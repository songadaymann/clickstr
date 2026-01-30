const { ethers } = require("ethers");
const fs = require("fs");
const path = require("path");

/**
 * Bot A - Contract Miner
 *
 * This bot mines PoW proofs and submits directly to the contract.
 * It does NOT use the frontend or any APIs.
 *
 * Purpose: Simulate a developer who bypasses the frontend entirely
 * Expected: Should earn $CLICK tokens but NO off-chain rewards (cursors, NFTs)
 *
 * Usage:
 *   BOT_A_PRIVATE_KEY=0x... node scripts/test-bot-a-contract.js
 *
 * Or create a .env file with:
 *   BOT_A_PRIVATE_KEY=0x...
 *   SEPOLIA_RPC_URL=https://...
 */

require("dotenv").config();

// ============ Configuration ============
const CONFIG = {
  // Bot settings
  batchSize: 100,              // Proofs per submission (min 50, max 500)
  submitIntervalMs: 30000,     // Check for submission every 30 seconds
  miningWorkers: 1,            // Single-threaded for simplicity

  // Network
  rpcUrl: process.env.SEPOLIA_RPC_URL || "https://rpc.sepolia.org",
  chainId: 11155111,

  // Loaded from deployment
  contractAddress: null,
  tokenAddress: null,
};

// ============ Contract ABIs (minimal) ============
const CLICKER_ABI = [
  "function submitClicks(uint256[] calldata nonces) external",
  "function getCurrentEpoch() external view returns (uint256)",
  "function difficultyTarget() external view returns (uint256)",
  "function getGameStats() external view returns (uint256 poolRemaining_, uint256 currentEpoch_, uint256 totalEpochs_, uint256 gameStartTime_, uint256 gameEndTime_, uint256 difficulty_, bool started_, bool ended_)",
  "function getUserLifetimeStats(address user) external view returns (uint256 totalClicks, uint256 totalEarned, uint256 totalBurned, uint256 epochsWon)",
  "function clicksPerEpoch(uint256 epoch, address user) external view returns (uint256)",
  "function TOTAL_EPOCHS() external view returns (uint256)",
  "function gameStartTime() external view returns (uint256)",
  "function usedProofs(bytes32) external view returns (bool)",
  "event Clicked(address indexed user, uint256 indexed epoch, uint256 validClicks, uint256 earned, uint256 burned)"
];

const TOKEN_ABI = [
  "function balanceOf(address) external view returns (uint256)"
];

// ============ State ============
let provider;
let wallet;
let clickerContract;
let tokenContract;
let currentEpoch = 0;
let difficultyTarget = 0n;
let minedNonces = [];
let stats = {
  totalProofsMined: 0,
  totalProofsSubmitted: 0,
  totalTokensEarned: 0n,
  totalGasSpent: 0n,
  submissionCount: 0,
  startTime: Date.now(),
  errors: []
};

// ============ Mining Functions ============

/**
 * Mine a single valid nonce
 * Hash = keccak256(abi.encodePacked(address, nonce, epoch, chainId))
 * Valid if uint256(hash) < difficultyTarget
 */
function mineNonce(address, epoch, chainId, startNonce = 0n) {
  let nonce = startNonce;
  const maxAttempts = 10_000_000; // Safety limit

  for (let i = 0; i < maxAttempts; i++) {
    // Pack data same as Solidity: abi.encodePacked(address, uint256, uint256, uint256)
    const packed = ethers.solidityPacked(
      ["address", "uint256", "uint256", "uint256"],
      [address, nonce, epoch, chainId]
    );

    const hash = ethers.keccak256(packed);
    const hashValue = BigInt(hash);

    if (hashValue < difficultyTarget) {
      return { nonce, hash, attempts: i + 1 };
    }

    nonce++;
  }

  throw new Error(`Could not find valid nonce after ${maxAttempts} attempts`);
}

/**
 * Mine multiple nonces
 */
async function mineNonces(count) {
  const address = wallet.address;
  const epoch = currentEpoch;
  const chainId = CONFIG.chainId;

  const nonces = [];
  let startNonce = BigInt(Date.now()) * 1000000n; // Random-ish starting point
  let totalAttempts = 0;

  console.log(`\n⛏️  Mining ${count} nonces for epoch ${epoch}...`);
  const miningStart = Date.now();

  for (let i = 0; i < count; i++) {
    const result = mineNonce(address, epoch, chainId, startNonce);
    nonces.push(result.nonce);
    startNonce = result.nonce + 1n;
    totalAttempts += result.attempts;

    if ((i + 1) % 10 === 0) {
      process.stdout.write(`   Mined ${i + 1}/${count} nonces\r`);
    }
  }

  const miningTime = (Date.now() - miningStart) / 1000;
  const hashRate = Math.floor(totalAttempts / miningTime);

  console.log(`   ✅ Mined ${count} nonces in ${miningTime.toFixed(1)}s (${hashRate.toLocaleString()} H/s)`);

  return nonces;
}

// ============ Contract Interaction ============

async function loadDeployment() {
  const deploymentPath = path.join(__dirname, "..", "test-deployment", "deployment.json");

  if (!fs.existsSync(deploymentPath)) {
    throw new Error(`Deployment not found at ${deploymentPath}. Run test-deploy.js first.`);
  }

  const deployment = JSON.parse(fs.readFileSync(deploymentPath, "utf8"));
  CONFIG.contractAddress = deployment.contracts.stupidClicker;
  CONFIG.tokenAddress = deployment.contracts.clickToken;

  console.log("📜 Loaded deployment:");
  console.log("   Contract:", CONFIG.contractAddress);
  console.log("   Token:", CONFIG.tokenAddress);

  return deployment;
}

async function updateGameState() {
  const gameStats = await clickerContract.getGameStats();
  currentEpoch = Number(gameStats.currentEpoch_);
  difficultyTarget = gameStats.difficulty_;

  return {
    poolRemaining: gameStats.poolRemaining_,
    totalEpochs: Number(gameStats.totalEpochs_),
    currentEpoch,
    ended: gameStats.ended_,
    started: gameStats.started_,
    difficultyTarget
  };
}

async function submitNonces(nonces) {
  console.log(`\n📤 Submitting ${nonces.length} nonces...`);

  try {
    // Estimate gas first
    const gasEstimate = await clickerContract.submitClicks.estimateGas(nonces);
    console.log(`   Gas estimate: ${gasEstimate.toLocaleString()}`);

    // Submit with some buffer
    const tx = await clickerContract.submitClicks(nonces, {
      gasLimit: gasEstimate * 120n / 100n // 20% buffer
    });

    console.log(`   TX hash: ${tx.hash}`);
    console.log(`   Waiting for confirmation...`);

    const receipt = await tx.wait();

    // Parse events to get actual results
    const event = receipt.logs
      .map(log => {
        try {
          return clickerContract.interface.parseLog(log);
        } catch {
          return null;
        }
      })
      .find(e => e && e.name === "ClicksSubmitted");

    if (event) {
      const { validClicks, grossReward, netReward, burned } = event.args;
      console.log(`   ✅ Submitted successfully!`);
      console.log(`   Valid clicks: ${validClicks}`);
      console.log(`   Gross reward: ${ethers.formatEther(grossReward)} CLICK`);
      console.log(`   Net reward: ${ethers.formatEther(netReward)} CLICK`);
      console.log(`   Burned: ${ethers.formatEther(burned)} CLICK`);
      console.log(`   Gas used: ${receipt.gasUsed.toLocaleString()}`);

      // Update stats
      stats.totalProofsSubmitted += Number(validClicks);
      stats.totalTokensEarned += netReward;
      stats.totalGasSpent += receipt.gasUsed * receipt.gasPrice;
      stats.submissionCount++;

      return { success: true, validClicks: Number(validClicks), netReward };
    }

    return { success: true, validClicks: nonces.length, netReward: 0n };

  } catch (error) {
    console.log(`   ❌ Submission failed: ${error.message}`);
    stats.errors.push({ time: new Date().toISOString(), error: error.message });
    return { success: false, error };
  }
}

// ============ Main Loop ============

async function printStatus() {
  const balance = await tokenContract.balanceOf(wallet.address);
  const ethBalance = await provider.getBalance(wallet.address);
  const userStats = await clickerContract.getUserLifetimeStats(wallet.address);
  const epochClicks = await clickerContract.clicksPerEpoch(currentEpoch, wallet.address);
  const runtime = (Date.now() - stats.startTime) / 1000 / 60; // minutes

  console.log("\n" + "═".repeat(60));
  console.log("                    BOT A STATUS");
  console.log("═".repeat(60));
  console.log(`⏱️  Runtime: ${runtime.toFixed(1)} minutes`);
  console.log(`📊 Stats:`);
  console.log(`   ├─ Proofs mined: ${stats.totalProofsMined.toLocaleString()}`);
  console.log(`   ├─ Proofs submitted: ${stats.totalProofsSubmitted.toLocaleString()}`);
  console.log(`   ├─ Submissions: ${stats.submissionCount}`);
  console.log(`   ├─ Tokens earned: ${ethers.formatEther(stats.totalTokensEarned)} CLICK`);
  console.log(`   ├─ Gas spent: ${ethers.formatEther(stats.totalGasSpent)} ETH`);
  console.log(`   └─ Errors: ${stats.errors.length}`);
  console.log(`💰 Balances:`);
  console.log(`   ├─ CLICK: ${ethers.formatEther(balance)}`);
  console.log(`   └─ ETH: ${ethers.formatEther(ethBalance)}`);
  console.log(`🎮 On-chain stats:`);
  console.log(`   ├─ Total clicks: ${userStats.totalClicks.toString()}`);
  console.log(`   ├─ Total earned: ${ethers.formatEther(userStats.totalEarned)} CLICK`);
  console.log(`   └─ This epoch: ${epochClicks.toString()} clicks`);
  console.log("═".repeat(60));
}

async function runBot() {
  console.log("╔════════════════════════════════════════════════════════════╗");
  console.log("║              BOT A - CONTRACT MINER                        ║");
  console.log("║                                                            ║");
  console.log("║  This bot mines PoW proofs and submits directly to the    ║");
  console.log("║  contract. It does NOT use the frontend or APIs.          ║");
  console.log("║                                                            ║");
  console.log("║  Press Ctrl+C to stop.                                     ║");
  console.log("╚════════════════════════════════════════════════════════════╝");

  // Check for private key
  const privateKey = process.env.BOT_A_PRIVATE_KEY;
  if (!privateKey) {
    console.error("\n❌ Error: BOT_A_PRIVATE_KEY not set");
    console.error("   Set it in .env or pass as environment variable");
    process.exit(1);
  }

  // Load deployment
  const deployment = await loadDeployment();

  // Set up provider and wallet
  provider = new ethers.JsonRpcProvider(CONFIG.rpcUrl);
  wallet = new ethers.Wallet(privateKey, provider);

  console.log("\n👤 Bot wallet:", wallet.address);

  // Check balance
  const ethBalance = await provider.getBalance(wallet.address);
  console.log("   ETH balance:", ethers.formatEther(ethBalance), "ETH");

  if (ethBalance < ethers.parseEther("0.01")) {
    console.error("\n❌ Error: Insufficient ETH balance");
    console.error("   Need at least 0.01 ETH for gas");
    process.exit(1);
  }

  // Set up contracts
  clickerContract = new ethers.Contract(CONFIG.contractAddress, CLICKER_ABI, wallet);
  tokenContract = new ethers.Contract(CONFIG.tokenAddress, TOKEN_ABI, provider);

  // Get initial state
  const gameState = await updateGameState();
  console.log("\n🎮 Game state:");
  console.log("   Pool remaining:", ethers.formatEther(gameState.poolRemaining), "CLICK");
  console.log("   Current epoch:", gameState.currentEpoch, "of", gameState.totalEpochs);
  console.log("   Game started:", gameState.started);
  console.log("   Difficulty:", gameState.difficultyTarget.toString().slice(0, 20) + "...");

  if (!gameState.started) {
    console.log("\n⚠️  Game has not started yet!");
    process.exit(0);
  }

  if (gameState.ended) {
    console.log("\n⚠️  Game has ended!");
    process.exit(0);
  }

  // Main loop
  console.log("\n🚀 Starting mining loop...");
  console.log(`   Batch size: ${CONFIG.batchSize}`);
  console.log(`   Submit interval: ${CONFIG.submitIntervalMs / 1000}s`);

  let lastEpoch = currentEpoch;

  while (true) {
    try {
      // Update game state
      const state = await updateGameState();

      // Check if game ended
      if (state.ended) {
        console.log("\n🏁 Game has ended!");
        await printStatus();
        break;
      }

      // Check if epoch changed
      if (state.currentEpoch !== lastEpoch) {
        console.log(`\n📅 Epoch changed: ${lastEpoch} → ${state.currentEpoch}`);
        lastEpoch = state.currentEpoch;
        minedNonces = []; // Clear nonces from old epoch
      }

      // Mine nonces
      const newNonces = await mineNonces(CONFIG.batchSize);
      stats.totalProofsMined += newNonces.length;

      // Submit
      await submitNonces(newNonces);

      // Print status every 5 submissions
      if (stats.submissionCount % 5 === 0) {
        await printStatus();
      }

      // Wait before next cycle
      console.log(`\n⏳ Waiting ${CONFIG.submitIntervalMs / 1000}s before next cycle...`);
      await new Promise(resolve => setTimeout(resolve, CONFIG.submitIntervalMs));

    } catch (error) {
      console.error(`\n❌ Error in main loop: ${error.message}`);
      stats.errors.push({ time: new Date().toISOString(), error: error.message });

      // Wait and retry
      await new Promise(resolve => setTimeout(resolve, 10000));
    }
  }
}

// ============ Entry Point ============

// Handle Ctrl+C
process.on("SIGINT", async () => {
  console.log("\n\n🛑 Stopping bot...");
  await printStatus();

  // Save stats to file
  const statsPath = path.join(__dirname, "..", "test-deployment", "bot-a-stats.json");
  fs.writeFileSync(statsPath, JSON.stringify({
    ...stats,
    totalTokensEarned: stats.totalTokensEarned.toString(),
    totalGasSpent: stats.totalGasSpent.toString(),
    endTime: Date.now()
  }, null, 2));
  console.log(`\n📊 Stats saved to: ${statsPath}`);

  process.exit(0);
});

runBot().catch(error => {
  console.error("Fatal error:", error);
  process.exit(1);
});
