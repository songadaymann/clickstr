#!/usr/bin/env node
const { ethers } = require("ethers");
const { Worker, isMainThread, parentPort, workerData } = require("worker_threads");
const os = require("os");

/**
 * CLICKSTR PUBLIC MINER
 *
 * Mine $CLICK tokens by submitting proof-of-work directly to the smart contract.
 *
 * NOTE: Script mining earns $CLICK tokens, but does NOT count toward NFT rewards.
 *       Only frontend clicks (clickstr.fun) earn NFTs and collectibles.
 *
 * ═══════════════════════════════════════════════════════════════════════════════
 *
 * SETUP:
 *
 *   1. Create a .env file in the same directory with your private key:
 *
 *      PRIVATE_KEY=0xYourPrivateKeyHere
 *
 *   2. Make sure you have ETH for gas (Sepolia testnet or Mainnet depending on season)
 *
 *   3. Run the miner:
 *
 *      node public-miner.js
 *
 * ═══════════════════════════════════════════════════════════════════════════════
 *
 * CONFIGURATION (optional env vars):
 *
 *   PRIVATE_KEY       - Required: Your wallet private key
 *   RPC_URL           - Optional: Custom RPC endpoint
 *   BATCH_SIZE        - Optional: Proofs per TX (default: 500, max allowed)
 *   NUM_WORKERS       - Optional: CPU threads (default: all cores)
 *   NETWORK           - Optional: 'sepolia' or 'mainnet' (default: sepolia)
 *
 * ═══════════════════════════════════════════════════════════════════════════════
 */

require("dotenv").config();

// ============ Network Configuration ============
const NETWORKS = {
  sepolia: {
    chainId: 11155111,
    rpcUrl: "https://ethereum-sepolia-rpc.publicnode.com",
    contractAddress: "0xf724ede44Bbb2Ccf46cec530c21B14885D441e02", // Clickstr v6
    tokenAddress: "0x78A607EDE7C7b134F51E725e4bA73D7b269580fc", // MockClickToken v6
    explorerUrl: "https://sepolia.etherscan.io",
  },
  mainnet: {
    chainId: 1,
    rpcUrl: "https://eth.llamarpc.com",
    contractAddress: null,  // TODO: Set when mainnet launches
    tokenAddress: null,     // TODO: Set when mainnet launches
    explorerUrl: "https://etherscan.io",
  }
};

// ============ Configuration ============
const NETWORK = process.env.NETWORK || "sepolia";
const networkConfig = NETWORKS[NETWORK];

if (!networkConfig) {
  console.error(`❌ Unknown network: ${NETWORK}`);
  console.error(`   Valid options: ${Object.keys(NETWORKS).join(", ")}`);
  process.exit(1);
}

if (!networkConfig.contractAddress) {
  console.error(`❌ Network '${NETWORK}' not yet configured (no contract address)`);
  process.exit(1);
}

const CONFIG = {
  batchSize: Math.min(parseInt(process.env.BATCH_SIZE) || 500, 500),  // Max 500
  numWorkers: process.env.NUM_WORKERS ? parseInt(process.env.NUM_WORKERS) : os.cpus().length,
  minDelayMs: 2000,
  rpcUrl: process.env.RPC_URL || networkConfig.rpcUrl,
  chainId: networkConfig.chainId,
  contractAddress: networkConfig.contractAddress,
  tokenAddress: networkConfig.tokenAddress,
  explorerUrl: networkConfig.explorerUrl,
};

// ============ Contract ABIs ============
const CLICKER_ABI = [
  "function submitClicks(uint256[] calldata nonces) external",
  "function getGameStats() external view returns (uint256 poolRemaining_, uint256 currentEpoch_, uint256 totalEpochs_, uint256 gameStartTime_, uint256 gameEndTime_, uint256 difficulty_, bool started_, bool ended_)",
  "function getUserLifetimeStats(address user) external view returns (uint256 totalClicks, uint256 totalEarned, uint256 totalBurned, uint256 epochsWon)",
  "event Clicked(address indexed user, uint256 indexed epoch, uint256 validClicks, uint256 earned, uint256 burned)"
];

const TOKEN_ABI = [
  "function balanceOf(address) external view returns (uint256)"
];

// ============ Worker Thread Code ============
if (!isMainThread) {
  const { address, epoch, chainId, startNonce, count, difficulty } = workerData;

  function mineInWorker() {
    const nonces = [];
    let nonce = BigInt(startNonce);
    const difficultyTarget = BigInt(difficulty);
    let attempts = 0;

    while (nonces.length < count) {
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

  const results = await Promise.all(workerPromises);

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

  return allNonces.slice(0, count);
}

// ============ Contract Interaction ============

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

    console.log(`   TX: ${CONFIG.explorerUrl}/tx/${tx.hash}`);

    const receipt = await tx.wait();

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
  const avgHashRate = runtime > 0 ? Math.floor(stats.totalHashes / (runtime * 60)) : 0;

  console.log("\n" + "═".repeat(65));
  console.log("                    CLICKSTR MINER STATUS");
  console.log("═".repeat(65));
  console.log(`⏱️  Runtime: ${runtime.toFixed(1)} min | Avg: ${avgHashRate.toLocaleString()} H/s`);
  console.log(`📊 Submitted: ${stats.totalProofsSubmitted.toLocaleString()} clicks in ${stats.submissionCount} TXs`);
  console.log(`💰 Earned: ${ethers.formatEther(stats.totalTokensEarned)} CLICK | Gas: ${ethers.formatEther(stats.totalGasSpent)} ETH`);
  console.log(`💼 Balance: ${ethers.formatEther(balance)} CLICK | ${ethers.formatEther(ethBalance)} ETH`);
  if (stats.errors.length > 0) console.log(`⚠️  Errors: ${stats.errors.length}`);
  console.log("═".repeat(65));
}

// ============ Main Loop ============

async function run() {
  console.log("╔═══════════════════════════════════════════════════════════════╗");
  console.log("║                  CLICKSTR PUBLIC MINER                        ║");
  console.log("╠═══════════════════════════════════════════════════════════════╣");
  console.log(`║  Network: ${NETWORK.padEnd(8)} | Batch: ${CONFIG.batchSize.toString().padEnd(3)} | Workers: ${CONFIG.numWorkers.toString().padEnd(2)}        ║`);
  console.log("╠═══════════════════════════════════════════════════════════════╣");
  console.log("║  NOTE: Script clicks earn $CLICK but NOT NFT rewards.         ║");
  console.log("║        Use clickstr.fun for NFTs and collectibles!            ║");
  console.log("╚═══════════════════════════════════════════════════════════════╝");

  const privateKey = process.env.PRIVATE_KEY;
  if (!privateKey) {
    console.error("\n❌ PRIVATE_KEY not set");
    console.error("   Create a .env file with: PRIVATE_KEY=0xYourKeyHere");
    process.exit(1);
  }

  provider = new ethers.JsonRpcProvider(CONFIG.rpcUrl);
  wallet = new ethers.Wallet(privateKey, provider);

  console.log("\n👤 Wallet:", wallet.address);
  console.log("📜 Contract:", CONFIG.contractAddress);

  const ethBalance = await provider.getBalance(wallet.address);
  console.log("💰 ETH Balance:", ethers.formatEther(ethBalance));

  if (ethBalance < ethers.parseEther("0.01")) {
    console.error("\n❌ Need at least 0.01 ETH for gas");
    console.error(`   Get testnet ETH from a Sepolia faucet`);
    process.exit(1);
  }

  clickerContract = new ethers.Contract(CONFIG.contractAddress, CLICKER_ABI, wallet);
  tokenContract = new ethers.Contract(CONFIG.tokenAddress, TOKEN_ABI, provider);

  const state = await updateGameState();
  console.log("\n🎮 Game Status:");
  console.log(`   Epoch: ${state.currentEpoch} / ${state.totalEpochs}`);
  console.log(`   Pool: ${ethers.formatEther(state.poolRemaining)} CLICK remaining`);
  console.log(`   Started: ${state.started} | Ended: ${state.ended}`);

  if (!state.started) {
    console.log("\n⚠️  Game hasn't started yet. Waiting...");
    process.exit(0);
  }

  if (state.ended) {
    console.log("\n⚠️  Game has ended. Wait for next season!");
    process.exit(0);
  }

  console.log("\n🚀 Starting mining loop... (Ctrl+C to stop)\n");

  let lastEpoch = currentEpoch;
  let pendingSubmit = null;

  while (true) {
    try {
      const state = await updateGameState();

      if (state.ended) {
        console.log("\n🏁 Game ended!");
        await printStatus();
        break;
      }

      if (state.currentEpoch !== lastEpoch) {
        console.log(`\n📅 New epoch: ${lastEpoch} → ${state.currentEpoch}`);
        lastEpoch = state.currentEpoch;
      }

      const minePromise = mineNoncesParallel(CONFIG.batchSize);

      if (pendingSubmit) {
        await pendingSubmit;
      }

      const nonces = await minePromise;
      stats.totalProofsMined += nonces.length;

      pendingSubmit = submitNonces(nonces);

      await new Promise(r => setTimeout(r, CONFIG.minDelayMs));

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
  console.log("\n\n🛑 Stopping miner...");
  await printStatus();
  console.log("\nThanks for mining! Check clickstr.fun for NFT rewards.");
  process.exit(0);
});

run().catch(error => {
  console.error("Fatal error:", error);
  process.exit(1);
});
