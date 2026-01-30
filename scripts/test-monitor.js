const { ethers } = require("ethers");
const fs = require("fs");
const path = require("path");

/**
 * Test Monitor
 *
 * Watches the game contract and displays real-time stats for all players.
 * Shows epoch transitions, difficulty changes, and leaderboard.
 *
 * Usage:
 *   node scripts/test-monitor.js
 */

require("dotenv").config();

// ============ Configuration ============
const CONFIG = {
  rpcUrl: process.env.SEPOLIA_RPC_URL || "https://rpc.sepolia.org",
  refreshIntervalMs: 10000, // Update every 10 seconds
  apiUrl: process.env.API_URL || "https://mann.cool/api/stupid-clicker"
};

// ============ Contract ABIs ============
const CLICKER_ABI = [
  "function getCurrentEpoch() external view returns (uint256)",
  "function difficultyTarget() external view returns (uint256)",
  "function getGameStats() external view returns (uint256 poolRemaining_, uint256 totalClicks_, uint256 currentEpoch_, uint256 totalBurned_, bool started_, bool ended_, uint256 gameStartTime_, uint256 gameEndTime_)",
  "function getUserStats(address user) external view returns (uint256 totalClicks_, uint256 totalEarned_, uint256 currentEpochClicks_)",
  "function getEpochInfo(uint256 epoch) external view returns (uint256 totalClicks_, uint256 totalDistributed_, uint256 totalBurned_, address winner_, uint256 winnerClicks_, bool finalized_, uint256 participantCount_)",
  "function TOTAL_EPOCHS() external view returns (uint256)",
  "function EPOCH_DURATION() external view returns (uint256)",
  "function gameStartTime() external view returns (uint256)",
  "event ClicksSubmitted(address indexed user, uint256 epoch, uint256 validClicks, uint256 grossReward, uint256 netReward, uint256 burned)",
  "event EpochFinalized(uint256 indexed epoch, address winner, uint256 winnerBonus, uint256 totalDistributed, uint256 totalBurned)"
];

const TOKEN_ABI = [
  "function balanceOf(address) external view returns (uint256)"
];

// ============ State ============
let provider;
let clickerContract;
let tokenContract;
let deployment;
let lastEpoch = 0;
let eventHistory = [];

// Player addresses to track
const PLAYERS = {
  botA: null,    // Will be loaded from .env or manual input
  botB: null,
  human: null
};

// ============ Display Functions ============

function clearScreen() {
  process.stdout.write("\x1B[2J\x1B[0f");
}

function formatDuration(seconds) {
  const hours = Math.floor(seconds / 3600);
  const minutes = Math.floor((seconds % 3600) / 60);
  const secs = Math.floor(seconds % 60);
  return `${hours}h ${minutes}m ${secs}s`;
}

function formatNumber(n) {
  return n.toLocaleString();
}

function formatTokens(wei) {
  const tokens = parseFloat(ethers.formatEther(wei));
  if (tokens >= 1000000) {
    return (tokens / 1000000).toFixed(2) + "M";
  } else if (tokens >= 1000) {
    return (tokens / 1000).toFixed(2) + "K";
  } else {
    return tokens.toFixed(2);
  }
}

async function displayDashboard() {
  clearScreen();

  const now = Math.floor(Date.now() / 1000);

  // Get game stats
  const gameStats = await clickerContract.getGameStats();
  const totalEpochs = await clickerContract.TOTAL_EPOCHS();
  const epochDuration = await clickerContract.EPOCH_DURATION();
  const difficultyTarget = await clickerContract.difficultyTarget();

  const currentEpoch = Number(gameStats.currentEpoch_);
  const gameStartTime = Number(gameStats.gameStartTime_);
  const gameEndTime = Number(gameStats.gameEndTime_);

  // Calculate epoch timing
  const epochStartTime = gameStartTime + (currentEpoch - 1) * Number(epochDuration);
  const epochEndTime = epochStartTime + Number(epochDuration);
  const timeRemaining = Math.max(0, epochEndTime - now);
  const gameTimeRemaining = Math.max(0, gameEndTime - now);

  // Header
  console.log("╔════════════════════════════════════════════════════════════════════════╗");
  console.log("║                    STUPID CLICKER - TEST MONITOR                       ║");
  console.log("╚════════════════════════════════════════════════════════════════════════╝");
  console.log("");

  // Game Status
  console.log("┌─────────────────────────── GAME STATUS ───────────────────────────────┐");
  console.log(`│  Epoch: ${currentEpoch} / ${totalEpochs}                Time Left: ${formatDuration(timeRemaining)}`.padEnd(75) + "│");
  console.log(`│  Game Ends In: ${formatDuration(gameTimeRemaining)}`.padEnd(75) + "│");
  console.log(`│  Pool Remaining: ${formatTokens(gameStats.poolRemaining_)} CLICK`.padEnd(75) + "│");
  console.log(`│  Total Clicks: ${formatNumber(Number(gameStats.totalClicks_))}`.padEnd(75) + "│");
  console.log(`│  Total Burned: ${formatTokens(gameStats.totalBurned_)} CLICK`.padEnd(75) + "│");
  console.log(`│  Difficulty: ${difficultyTarget.toString().slice(0, 30)}...`.padEnd(75) + "│");
  console.log("└──────────────────────────────────────────────────────────────────────────┘");
  console.log("");

  // Current Epoch Info
  if (currentEpoch > 0) {
    try {
      const epochInfo = await clickerContract.getEpochInfo(currentEpoch);
      console.log("┌─────────────────────────── CURRENT EPOCH ────────────────────────────────┐");
      console.log(`│  Clicks: ${formatNumber(Number(epochInfo.totalClicks_))}`.padEnd(75) + "│");
      console.log(`│  Distributed: ${formatTokens(epochInfo.totalDistributed_)} CLICK`.padEnd(75) + "│");
      console.log(`│  Burned: ${formatTokens(epochInfo.totalBurned_)} CLICK`.padEnd(75) + "│");
      console.log(`│  Participants: ${formatNumber(Number(epochInfo.participantCount_))}`.padEnd(75) + "│");
      if (epochInfo.winnerClicks_ > 0) {
        const shortWinner = epochInfo.winner_.slice(0, 10) + "..." + epochInfo.winner_.slice(-8);
        console.log(`│  Leader: ${shortWinner} (${formatNumber(Number(epochInfo.winnerClicks_))} clicks)`.padEnd(75) + "│");
      }
      console.log("└──────────────────────────────────────────────────────────────────────────┘");
      console.log("");
    } catch (e) {
      // Epoch info might not be available yet
    }
  }

  // Player Stats
  console.log("┌──────────────────────────── PLAYER STATS ────────────────────────────────┐");
  console.log("│  Player          │ On-Chain Clicks │ Tokens Earned │ This Epoch │ ETH   │");
  console.log("├──────────────────┼─────────────────┼───────────────┼────────────┼───────┤");

  for (const [name, address] of Object.entries(PLAYERS)) {
    if (address) {
      try {
        const userStats = await clickerContract.getUserStats(address);
        const tokenBalance = await tokenContract.balanceOf(address);
        const ethBalance = await provider.getBalance(address);

        const displayName = name.padEnd(16);
        const clicks = formatNumber(Number(userStats.totalClicks_)).padStart(15);
        const earned = formatTokens(tokenBalance).padStart(13);
        const epochClicks = formatNumber(Number(userStats.currentEpochClicks_)).padStart(10);
        const eth = parseFloat(ethers.formatEther(ethBalance)).toFixed(3).padStart(5);

        console.log(`│  ${displayName} │ ${clicks} │ ${earned} │ ${epochClicks} │ ${eth} │`);
      } catch (e) {
        console.log(`│  ${name.padEnd(16)} │ Error fetching stats`.padEnd(56) + "│");
      }
    } else {
      console.log(`│  ${name.padEnd(16)} │ (not configured)`.padEnd(56) + "│");
    }
  }
  console.log("└──────────────────────────────────────────────────────────────────────────┘");
  console.log("");

  // Recent Events
  console.log("┌──────────────────────────── RECENT EVENTS ───────────────────────────────┐");
  const recentEvents = eventHistory.slice(-5);
  if (recentEvents.length === 0) {
    console.log("│  No events yet...".padEnd(75) + "│");
  } else {
    for (const event of recentEvents) {
      const line = `│  ${event}`.padEnd(75) + "│";
      console.log(line.slice(0, 76) + "│");
    }
  }
  console.log("└──────────────────────────────────────────────────────────────────────────┘");
  console.log("");

  // Footer
  const updateTime = new Date().toLocaleTimeString();
  console.log(`Last updated: ${updateTime}  |  Press Ctrl+C to exit`);

  // Check for epoch change
  if (currentEpoch !== lastEpoch && lastEpoch !== 0) {
    eventHistory.push(`🔄 Epoch changed: ${lastEpoch} → ${currentEpoch}`);
  }
  lastEpoch = currentEpoch;
}

// ============ Event Listeners ============

async function setupEventListeners() {
  // Listen for ClicksSubmitted events
  clickerContract.on("ClicksSubmitted", (user, epoch, validClicks, grossReward, netReward, burned) => {
    const shortUser = user.slice(0, 8) + "...";
    const playerName = Object.entries(PLAYERS).find(([_, addr]) => addr?.toLowerCase() === user.toLowerCase())?.[0] || shortUser;
    eventHistory.push(`📤 ${playerName}: ${validClicks} clicks → ${formatTokens(netReward)} CLICK`);

    // Keep only last 20 events
    if (eventHistory.length > 20) {
      eventHistory = eventHistory.slice(-20);
    }
  });

  // Listen for EpochFinalized events
  clickerContract.on("EpochFinalized", (epoch, winner, winnerBonus, totalDistributed, totalBurned) => {
    const shortWinner = winner.slice(0, 8) + "...";
    eventHistory.push(`🏆 Epoch ${epoch} finalized! Winner: ${shortWinner}`);
  });

  console.log("Event listeners set up");
}

// ============ Main ============

async function loadDeployment() {
  const deploymentPath = path.join(__dirname, "..", "test-deployment", "deployment.json");

  if (!fs.existsSync(deploymentPath)) {
    console.error("❌ Deployment not found. Run test-deploy.js first.");
    process.exit(1);
  }

  deployment = JSON.parse(fs.readFileSync(deploymentPath, "utf8"));
  return deployment;
}

async function loadPlayerAddresses() {
  // Try to load from environment or prompt
  PLAYERS.botA = process.env.BOT_A_ADDRESS || null;
  PLAYERS.botB = process.env.BOT_B_ADDRESS || null;
  PLAYERS.human = process.env.HUMAN_ADDRESS || null;

  // Also check for a players.json file
  const playersPath = path.join(__dirname, "..", "test-deployment", "players.json");
  if (fs.existsSync(playersPath)) {
    const players = JSON.parse(fs.readFileSync(playersPath, "utf8"));
    PLAYERS.botA = PLAYERS.botA || players.botA;
    PLAYERS.botB = PLAYERS.botB || players.botB;
    PLAYERS.human = PLAYERS.human || players.human;
  }

  console.log("Player addresses:");
  console.log("  Bot A:", PLAYERS.botA || "(not set)");
  console.log("  Bot B:", PLAYERS.botB || "(not set)");
  console.log("  Human:", PLAYERS.human || "(not set)");
  console.log("");
  console.log("Set addresses via environment variables or test-deployment/players.json");
}

async function main() {
  console.log("Starting Stupid Clicker Monitor...\n");

  // Load deployment
  await loadDeployment();
  await loadPlayerAddresses();

  // Set up provider and contracts
  provider = new ethers.JsonRpcProvider(CONFIG.rpcUrl);
  clickerContract = new ethers.Contract(
    deployment.contracts.stupidClicker,
    CLICKER_ABI,
    provider
  );
  tokenContract = new ethers.Contract(
    deployment.contracts.clickToken,
    TOKEN_ABI,
    provider
  );

  // Set up event listeners
  await setupEventListeners();

  // Main display loop
  console.log("Monitor starting in 3 seconds...");
  await new Promise(resolve => setTimeout(resolve, 3000));

  while (true) {
    try {
      await displayDashboard();
    } catch (error) {
      console.error("Error updating dashboard:", error.message);
    }

    await new Promise(resolve => setTimeout(resolve, CONFIG.refreshIntervalMs));
  }
}

// Handle exit
process.on("SIGINT", () => {
  console.log("\n\nMonitor stopped.");
  process.exit(0);
});

main().catch(error => {
  console.error("Fatal error:", error);
  process.exit(1);
});
