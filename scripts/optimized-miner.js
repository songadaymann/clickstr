const { ethers } = require("ethers");
const fs = require("fs");
const path = require("path");
const { Worker, isMainThread, parentPort, workerData } = require("worker_threads");
const os = require("os");

/**
 * OPTIMIZED MINER - Maximum Performance Bot
 *
 * This bot is optimized for maximum click throughput:
 * - Batch size: 500 (contract max)
 * - Multi-threaded mining (uses all CPU cores)
 * - Minimal delay (submits as soon as batch is ready)
 * - Continuous mining while TX confirms
 *
 * Usage:
 *   node scripts/optimized-miner.js
 *
 * Environment variables:
 *   BOT_A_PRIVATE_KEY=0x...     Required: Wallet private key
 *   SEPOLIA_RPC_URL=https://... Optional: RPC endpoint
 *   BATCH_SIZE=500              Optional: Proofs per TX (default 500)
 *   NUM_WORKERS=auto            Optional: CPU threads (default: all cores)
 *
 * Performance notes:
 * - On a modern CPU, expects 50-100K hashes/second
 * - At difficulty ~1e74, finding 500 valid nonces takes ~5-10 seconds
 * - Block time is ~12 seconds, so TX confirmation is usually the bottleneck
 * - Maximum theoretical throughput: ~2,500 clicks/minute per wallet
 */

require("dotenv").config();

// ============ Configuration ============
const CONFIG = {
  batchSize: parseInt(process.env.BATCH_SIZE) || 500,  // Max allowed by contract
  numWorkers: process.env.NUM_WORKERS === "auto" ? os.cpus().length : parseInt(process.env.NUM_WORKERS) || os.cpus().length,
  minDelayMs: 2000,  // Minimum delay between submissions (rate limit protection)
  rpcUrl: process.env.SEPOLIA_RPC_URL || "https://ethereum-sepolia-rpc.publicnode.com",
  chainId: 11155111,
  contractAddress: null,
  tokenAddress: null,
};

// ============ Contract ABIs ============
const CLICKER_ABI = [
  "function submitClicks(uint256[] calldata nonces) external",
  "function getGameStats() external view returns (uint256 poolRemaining_, uint256 currentEpoch_, uint256 totalEpochs_, uint256 gameStartTime_, uint256 gameEndTime_, uint256 difficulty_, bool started_, bool ended_)",
  "function getUserLifetimeStats(address user) external view returns (uint256 totalClicks, uint256 totalEarned, uint256 totalBurned, uint256 epochsWon)",
  "function clicksPerEpoch(uint256 epoch, address user) external view returns (uint256)",
  "event Clicked(address indexed user, uint256 indexed epoch, uint256 validClicks, uint256 earned, uint256 burned)"
];

const TOKEN_ABI = [
  "function balanceOf(address) external view returns (uint256)"
];

// ============ Worker Thread Code ============
if (!isMainThread) {
  // This runs in worker threads
  const { address, epoch, chainId, startNonce, count, difficulty } = workerData;

  function mineInWorker() {
    const nonces = [];
    let nonce = BigInt(startNonce);
    const difficultyTarget = BigInt(difficulty);
    let attempts = 0;

    while (nonces.length < count) {
      // Pack data same as Solidity
      const packed = ethers.solidityPacked(
        ["address", "uint256", "uint256", "uint256"],
        [address, nonce, epoch, chainId]
      );

      const hash = ethers.keccak256(packed);
      const hashValue = BigInt(hash);
      attempts++;

      if (hashValue < difficultyTarget) {
        nonces.push(nonce.toString());
      }

      nonce++;
    }

    return { nonces, attempts };
  }

  const result = mineInWorker();
  parentPort.postMessage(result);
  process.exit(0);
}

// ============ Main Thread Code ============

let provider;
let wallet;
let clickerContract;
let tokenContract;
let currentEpoch = 0;
let difficultyTarget = 0n;

const stats = {
  totalProofsMined: 0,
  totalProofsSubmitted: 0,
  totalTokensEarned: 0n,
  totalGasSpent: 0n,
  submissionCount: 0,
  totalHashes: 0,
  startTime: Date.now(),
  errors: []
};

// ============ Multi-threaded Mining ============

async function mineNoncesParallel(count) {
  const address = wallet.address;
  const epoch = currentEpoch;
  const chainId = CONFIG.chainId;
  const numWorkers = CONFIG.numWorkers;

  // Divide work among workers
  const countPerWorker = Math.ceil(count / numWorkers);
  const baseNonce = BigInt(Date.now()) * 1000000n + BigInt(Math.floor(Math.random() * 1000000));

  console.log(`\n⛏️  Mining ${count} nonces with ${numWorkers} threads...`);
  const miningStart = Date.now();

  const workerPromises = [];

  for (let i = 0; i < numWorkers; i++) {
    const workerCount = i === numWorkers - 1 ? count - (countPerWorker * (numWorkers - 1)) : countPerWorker;
    if (workerCount <= 0) continue;

    const startNonce = (baseNonce + BigInt(i) * 100000000n).toString();

    const promise = new Promise((resolve, reject) => {
      const worker = new Worker(__filename, {
        workerData: {
          address,
          epoch,
          chainId,
          startNonce,
          count: workerCount,
          difficulty: difficultyTarget.toString()
        }
      });

      worker.on("message", resolve);
      worker.on("error", reject);
      worker.on("exit", (code) => {
        if (code !== 0) reject(new Error(`Worker exited with code ${code}`));
      });
    });

    workerPromises.push(promise);
  }

  // Wait for all workers
  const results = await Promise.all(workerPromises);

  // Combine results
  const allNonces = [];
  let totalAttempts = 0;

  for (const result of results) {
    allNonces.push(...result.nonces.map(n => BigInt(n)));
    totalAttempts += result.attempts;
  }

  const miningTime = (Date.now() - miningStart) / 1000;
  const hashRate = Math.floor(totalAttempts / miningTime);
  stats.totalHashes += totalAttempts;

  console.log(`   ✅ Mined ${allNonces.length} nonces in ${miningTime.toFixed(2)}s`);
  console.log(`   📊 Hash rate: ${hashRate.toLocaleString()} H/s (${numWorkers} threads)`);

  return allNonces.slice(0, count); // Ensure we don't exceed requested count
}

// ============ Contract Interaction ============

async function loadDeployment() {
  const deploymentPath = path.join(__dirname, "..", "test-deployment", "deployment.json");

  if (!fs.existsSync(deploymentPath)) {
    throw new Error(`Deployment not found. Run test-deploy.js first.`);
  }

  const deployment = JSON.parse(fs.readFileSync(deploymentPath, "utf8"));
  CONFIG.contractAddress = deployment.contracts.stupidClicker;
  CONFIG.tokenAddress = deployment.contracts.clickToken;

  console.log("📜 Contract:", CONFIG.contractAddress);
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
  };
}

async function submitNonces(nonces) {
  console.log(`\n📤 Submitting ${nonces.length} nonces...`);

  try {
    const gasEstimate = await clickerContract.submitClicks.estimateGas(nonces);
    console.log(`   Gas estimate: ${gasEstimate.toLocaleString()}`);

    const tx = await clickerContract.submitClicks(nonces, {
      gasLimit: gasEstimate * 120n / 100n
    });

    console.log(`   TX: ${tx.hash}`);

    const receipt = await tx.wait();

    // Parse Clicked event
    const event = receipt.logs
      .map(log => {
        try { return clickerContract.interface.parseLog(log); }
        catch { return null; }
      })
      .find(e => e && e.name === "Clicked");

    if (event) {
      const { validClicks, earned, burned } = event.args;
      console.log(`   ✅ ${validClicks} clicks | +${ethers.formatEther(earned)} CLICK | 🔥${ethers.formatEther(burned)} burned`);

      stats.totalProofsSubmitted += Number(validClicks);
      stats.totalTokensEarned += earned;
      stats.totalGasSpent += receipt.gasUsed * (receipt.gasPrice || 0n);
      stats.submissionCount++;

      return { success: true, validClicks: Number(validClicks) };
    }

    return { success: true, validClicks: nonces.length };

  } catch (error) {
    console.log(`   ❌ Failed: ${error.message}`);
    stats.errors.push({ time: new Date().toISOString(), error: error.message });
    return { success: false, error };
  }
}

async function printStatus() {
  const balance = await tokenContract.balanceOf(wallet.address);
  const ethBalance = await provider.getBalance(wallet.address);
  const runtime = (Date.now() - stats.startTime) / 1000 / 60;
  const avgHashRate = Math.floor(stats.totalHashes / (runtime * 60));

  console.log("\n" + "═".repeat(65));
  console.log("                  OPTIMIZED MINER STATUS");
  console.log("═".repeat(65));
  console.log(`⏱️  Runtime: ${runtime.toFixed(1)} min | Avg: ${avgHashRate.toLocaleString()} H/s`);
  console.log(`📊 Submitted: ${stats.totalProofsSubmitted.toLocaleString()} clicks in ${stats.submissionCount} TXs`);
  console.log(`💰 Earned: ${ethers.formatEther(stats.totalTokensEarned)} CLICK | Gas: ${ethers.formatEther(stats.totalGasSpent)} ETH`);
  console.log(`💼 Balance: ${ethers.formatEther(balance)} CLICK | ${ethers.formatEther(ethBalance)} ETH`);
  if (stats.errors.length > 0) console.log(`⚠️  Errors: ${stats.errors.length}`);
  console.log("═".repeat(65));
}

// ============ Main Loop ============

async function runOptimizedMiner() {
  console.log("╔═══════════════════════════════════════════════════════════════╗");
  console.log("║            OPTIMIZED MINER - MAXIMUM PERFORMANCE              ║");
  console.log("╠═══════════════════════════════════════════════════════════════╣");
  console.log(`║  Batch size: ${CONFIG.batchSize.toString().padEnd(5)} | Workers: ${CONFIG.numWorkers.toString().padEnd(2)} | Chain: Sepolia       ║`);
  console.log("╚═══════════════════════════════════════════════════════════════╝");

  const privateKey = process.env.BOT_A_PRIVATE_KEY;
  if (!privateKey) {
    console.error("\n❌ BOT_A_PRIVATE_KEY not set in .env");
    process.exit(1);
  }

  await loadDeployment();

  provider = new ethers.JsonRpcProvider(CONFIG.rpcUrl);
  wallet = new ethers.Wallet(privateKey, provider);

  console.log("\n👤 Wallet:", wallet.address);

  const ethBalance = await provider.getBalance(wallet.address);
  console.log("   ETH:", ethers.formatEther(ethBalance));

  if (ethBalance < ethers.parseEther("0.01")) {
    console.error("❌ Need at least 0.01 ETH for gas");
    process.exit(1);
  }

  clickerContract = new ethers.Contract(CONFIG.contractAddress, CLICKER_ABI, wallet);
  tokenContract = new ethers.Contract(CONFIG.tokenAddress, TOKEN_ABI, provider);

  const state = await updateGameState();
  console.log("\n🎮 Epoch:", state.currentEpoch, "/", state.totalEpochs);
  console.log("   Pool:", ethers.formatEther(state.poolRemaining), "CLICK");

  if (!state.started) { console.log("⚠️ Game not started"); process.exit(0); }
  if (state.ended) { console.log("⚠️ Game ended"); process.exit(0); }

  console.log("\n🚀 Starting optimized mining loop...\n");

  let lastEpoch = currentEpoch;
  let pendingSubmit = null;

  while (true) {
    try {
      // Update state
      const state = await updateGameState();

      if (state.ended) {
        console.log("\n🏁 Game ended!");
        await printStatus();
        break;
      }

      if (state.currentEpoch !== lastEpoch) {
        console.log(`\n📅 Epoch ${lastEpoch} → ${state.currentEpoch}`);
        lastEpoch = state.currentEpoch;
      }

      // Mine while waiting for previous TX (if any)
      const minePromise = mineNoncesParallel(CONFIG.batchSize);

      // Wait for pending submission if exists
      if (pendingSubmit) {
        await pendingSubmit;
      }

      // Get newly mined nonces
      const nonces = await minePromise;
      stats.totalProofsMined += nonces.length;

      // Submit (don't await - mine next batch while this confirms)
      pendingSubmit = submitNonces(nonces);

      // Brief delay to avoid rate limits
      await new Promise(r => setTimeout(r, CONFIG.minDelayMs));

      // Status every 5 submissions
      if (stats.submissionCount > 0 && stats.submissionCount % 5 === 0) {
        await printStatus();
      }

    } catch (error) {
      console.error(`\n❌ Error: ${error.message}`);
      stats.errors.push({ time: new Date().toISOString(), error: error.message });
      await new Promise(r => setTimeout(r, 5000));
    }
  }
}

// Handle Ctrl+C
process.on("SIGINT", async () => {
  console.log("\n\n🛑 Stopping...");
  await printStatus();

  const statsPath = path.join(__dirname, "..", "test-deployment", "optimized-miner-stats.json");
  fs.writeFileSync(statsPath, JSON.stringify({
    ...stats,
    totalTokensEarned: stats.totalTokensEarned.toString(),
    totalGasSpent: stats.totalGasSpent.toString(),
    endTime: Date.now()
  }, null, 2));
  console.log(`📊 Stats saved to: ${statsPath}`);

  process.exit(0);
});

runOptimizedMiner().catch(error => {
  console.error("Fatal:", error);
  process.exit(1);
});
