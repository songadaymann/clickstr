const hre = require("hardhat");
const { ethers } = require("ethers");
const fs = require("fs");
const path = require("path");

/**
 * Deploy a Sepolia dry run that mimics mainnet token flow:
 *
 * Phase 1 (this script with PHASE=1):
 *   1. Deploy ClickstrNFT from NFT_DEPLOYER_KEY (signer = owner)
 *   2. Deploy MockClickToken with 1B supply from NFT_DEPLOYER_KEY
 *   3. Transfer 100M tokens to Safe Wallet
 *   4. Output instructions for manual transfer from Safe to Game Deployer
 *
 * Phase 2 (this script with PHASE=2):
 *   1. Deploy Clickstr from MAINNET_PRIVATE_KEY with 3M tokens
 *   2. Start the game
 *
 * Usage:
 *   PHASE=1 npx hardhat run scripts/deploy-sepolia-dryrun.js --network sepolia
 *   # ... do manual transfer from safe to game deployer ...
 *   PHASE=2 TOKEN_ADDRESS=0x... NFT_ADDRESS=0x... npx hardhat run scripts/deploy-sepolia-dryrun.js --network sepolia
 */

const SAFE_WALLET = "0x4890c268170a51d7864d4F879E73AC24A0415810";
const ONE_BILLION = ethers.parseEther("1000000000"); // 1B tokens
const HUNDRED_MILLION = ethers.parseEther("100000000"); // 100M tokens
const THREE_MILLION = ethers.parseEther("3000000"); // 3M tokens

async function phase1() {
  const nftDeployerKey = process.env.NFT_DEPLOYER_KEY;
  if (!nftDeployerKey) {
    console.error("ERROR: NFT_DEPLOYER_KEY is required");
    process.exit(1);
  }

  const provider = new ethers.JsonRpcProvider(process.env.SEPOLIA_RPC_URL);
  const nftDeployer = new ethers.Wallet(nftDeployerKey, provider);

  // Load baseURI from IPFS config
  let baseURI;
  const ipfsConfigPath = path.join(__dirname, "..", "nft-ipfs-config.json");
  if (fs.existsSync(ipfsConfigPath)) {
    const ipfsConfig = JSON.parse(fs.readFileSync(ipfsConfigPath, "utf-8"));
    baseURI = ipfsConfig.baseURI;
  } else {
    baseURI = "ipfs://QmfZqEdzeEm61d3uSeFxBc1HasR3KC6rMsiRnxkvzM3Ywx/clickstr-metadata/";
  }

  console.log("=".repeat(60));
  console.log("PHASE 1: Deploy NFT + Token, Transfer to Safe");
  console.log("=".repeat(60));
  console.log("\nNFT Deployer:", nftDeployer.address);
  console.log("Safe Wallet:", SAFE_WALLET);

  const balance = await provider.getBalance(nftDeployer.address);
  console.log("Balance:", ethers.formatEther(balance), "ETH");

  // Deploy NFT Contract
  console.log("\n1. Deploying ClickstrNFT...");
  const ClickstrNFT = await hre.ethers.getContractFactory("ClickstrNFT", nftDeployer);
  const nftContract = await ClickstrNFT.deploy(nftDeployer.address, baseURI);
  await nftContract.waitForDeployment();
  const nftAddress = await nftContract.getAddress();
  console.log("   ClickstrNFT deployed to:", nftAddress);

  // Deploy Token with 1B Supply
  console.log("\n2. Deploying MockClickToken (1B supply)...");
  const MockClickToken = await hre.ethers.getContractFactory("MockClickToken", nftDeployer);
  const clickToken = await MockClickToken.deploy(ONE_BILLION);
  await clickToken.waitForDeployment();
  const tokenAddress = await clickToken.getAddress();
  console.log("   MockClickToken deployed to:", tokenAddress);

  // Transfer 100M to Safe
  console.log("\n3. Transferring 100M tokens to Safe Wallet...");
  const transferTx = await clickToken.transfer(SAFE_WALLET, HUNDRED_MILLION);
  await transferTx.wait();
  console.log("   Transferred 100M CLICK to Safe");

  const safeBalance = await clickToken.balanceOf(SAFE_WALLET);
  console.log("   Safe wallet balance:", ethers.formatEther(safeBalance), "CLICK");

  // Save phase 1 info
  const phase1Info = {
    nftAddress,
    tokenAddress,
    safeWallet: SAFE_WALLET,
    phase1CompletedAt: new Date().toISOString()
  };

  const sepoliaDir = path.join(__dirname, "..", "sepolia");
  if (!fs.existsSync(sepoliaDir)) {
    fs.mkdirSync(sepoliaDir, { recursive: true });
  }
  fs.writeFileSync(path.join(sepoliaDir, "dryrun-phase1.json"), JSON.stringify(phase1Info, null, 2));

  console.log("\n" + "=".repeat(60));
  console.log("PHASE 1 COMPLETE!");
  console.log("=".repeat(60));
  console.log("\nContract Addresses:");
  console.log("  ClickstrNFT:    ", nftAddress);
  console.log("  MockClickToken: ", tokenAddress);

  console.log("\n" + "=".repeat(60));
  console.log("MANUAL ACTION REQUIRED:");
  console.log("=".repeat(60));
  console.log("\nTransfer 3M tokens from Safe to Game Deployer:");
  console.log("  From:   ", SAFE_WALLET);
  console.log("  To:     ", process.env.MAINNET_PRIVATE_KEY ? new ethers.Wallet(process.env.MAINNET_PRIVATE_KEY).address : "(set MAINNET_PRIVATE_KEY to see address)");
  console.log("  Amount: 3,000,000 CLICK");
  console.log("  Token:  ", tokenAddress);

  console.log("\nThen run Phase 2:");
  console.log(`  PHASE=2 TOKEN_ADDRESS=${tokenAddress} NFT_ADDRESS=${nftAddress} npx hardhat run scripts/deploy-sepolia-dryrun.js --network sepolia`);

  return phase1Info;
}

async function phase2() {
  const mainnetKey = process.env.MAINNET_PRIVATE_KEY;
  const tokenAddress = process.env.TOKEN_ADDRESS;
  const nftAddress = process.env.NFT_ADDRESS;

  if (!mainnetKey || !tokenAddress || !nftAddress) {
    console.error("ERROR: MAINNET_PRIVATE_KEY, TOKEN_ADDRESS, and NFT_ADDRESS are required for Phase 2");
    process.exit(1);
  }

  // Detect network from hardhat config
  const networkName = hre.network.name;
  const rpcUrl = networkName === 'mainnet'
    ? process.env.ETH_MAINNET_RPC_URL
    : process.env.SEPOLIA_RPC_URL;

  console.log("Network:", networkName);
  console.log("RPC URL:", rpcUrl?.substring(0, 50) + "...");

  const provider = new ethers.JsonRpcProvider(rpcUrl);
  const gameDeployer = new ethers.Wallet(mainnetKey, provider);

  // Season configuration
  const totalEpochs = parseInt(process.env.SEASON_EPOCHS || "12");
  const epochDuration = parseInt(process.env.SEASON_DURATION || "7200"); // 2 hours default

  console.log("=".repeat(60));
  console.log("PHASE 2: Deploy Clickstr and Start Game");
  console.log("=".repeat(60));
  console.log("\nGame Deployer:", gameDeployer.address);
  console.log("Token Address:", tokenAddress);
  console.log("NFT Address:", nftAddress);

  const balance = await provider.getBalance(gameDeployer.address);
  console.log("ETH Balance:", ethers.formatEther(balance), "ETH");

  // Check token balance
  const tokenABI = ["function balanceOf(address) view returns (uint256)", "function approve(address,uint256) returns (bool)"];
  const token = new ethers.Contract(tokenAddress, tokenABI, gameDeployer);
  const tokenBalance = await token.balanceOf(gameDeployer.address);
  console.log("Token Balance:", ethers.formatEther(tokenBalance), "CLICK");

  if (tokenBalance < THREE_MILLION) {
    console.error("\nERROR: Not enough tokens! Need 3M CLICK");
    console.error("Current balance:", ethers.formatEther(tokenBalance), "CLICK");
    process.exit(1);
  }

  console.log("\nSeason Configuration:");
  console.log("  Total Epochs:", totalEpochs);
  console.log("  Epoch Duration:", epochDuration, "seconds", `(${epochDuration / 3600} hours)`);
  console.log("  Token Pool: 3,000,000 CLICK");
  console.log("  Season Length:", (totalEpochs * epochDuration) / 3600, "hours");

  // Default difficulty
  const DEFAULT_DIFFICULTY = (2n ** 256n - 1n) / 1000n;
  const initialDifficulty = process.env.INITIAL_DIFFICULTY
    ? BigInt(process.env.INITIAL_DIFFICULTY)
    : DEFAULT_DIFFICULTY;

  // Deploy Clickstr
  console.log("\n1. Deploying Clickstr...");
  const Clickstr = await hre.ethers.getContractFactory("Clickstr", gameDeployer);
  const clickstr = await Clickstr.deploy(
    tokenAddress,
    totalEpochs,
    epochDuration,
    initialDifficulty,
    nftAddress
  );
  await clickstr.waitForDeployment();
  const clickstrAddress = await clickstr.getAddress();
  console.log("   Clickstr deployed to:", clickstrAddress);

  // Set up NFT tier bonuses
  console.log("\n2. Setting up NFT tier bonuses...");
  const tiers = [4, 6, 8, 9, 11];
  const bonuses = [200, 300, 500, 700, 1000];
  const bonusTx = await clickstr.setTierBonuses(tiers, bonuses);
  await bonusTx.wait();
  console.log("   Tier bonuses configured (2%-10%)");

  // Approve and start game
  console.log("\n3. Approving tokens...");
  const approveTx = await token.approve(clickstrAddress, THREE_MILLION);
  await approveTx.wait();
  console.log("   Approved 3M CLICK");

  console.log("\n4. Starting game...");
  const startTx = await clickstr.startGame(THREE_MILLION);
  await startTx.wait();
  console.log("   Game started!");

  // Get game stats
  const gameStats = await clickstr.getGameStats();
  console.log("\n5. Game Stats:");
  console.log("   Pool remaining:", ethers.formatEther(gameStats.poolRemaining_), "CLICK");
  console.log("   Current epoch:", gameStats.currentEpoch_.toString(), "of", totalEpochs);
  console.log("   Start time:", new Date(Number(gameStats.gameStartTime_) * 1000).toISOString());
  console.log("   End time:", new Date(Number(gameStats.gameEndTime_) * 1000).toISOString());

  // Save deployment info
  const isMainnet = networkName === 'mainnet';
  const deploymentInfo = {
    network: networkName,
    chainId: isMainnet ? 1 : 11155111,
    dryRun: !isMainnet,
    season: {
      totalEpochs,
      epochDuration,
      poolAmount: "3000000",
      seasonLengthHours: (totalEpochs * epochDuration) / 3600,
    },
    contracts: {
      clickstrNFT: nftAddress,
      clickToken: tokenAddress,
      clickstr: clickstrAddress
    },
    wallets: {
      gameDeployer: gameDeployer.address,
      safeWallet: SAFE_WALLET
    },
    deployedAt: new Date().toISOString(),
    gameStartTime: new Date(Number(gameStats.gameStartTime_) * 1000).toISOString(),
    gameEndTime: new Date(Number(gameStats.gameEndTime_) * 1000).toISOString(),
  };

  const sepoliaDir = path.join(__dirname, "..", "sepolia");
  fs.writeFileSync(path.join(sepoliaDir, "dryrun-deployment.json"), JSON.stringify(deploymentInfo, null, 2));

  console.log("\n" + "=".repeat(60));
  console.log("PHASE 2 COMPLETE!");
  console.log("=".repeat(60));
  console.log("\nContract Addresses:");
  console.log("  ClickstrNFT:    ", nftAddress);
  console.log("  MockClickToken: ", tokenAddress);
  console.log("  Clickstr:       ", clickstrAddress);

  console.log("\n" + "=".repeat(60));
  console.log("NEXT STEPS:");
  console.log("=".repeat(60));
  console.log("\n1. Update frontend config (src-ts/src/config/network.ts):");
  console.log(`   contractAddress: '${clickstrAddress}'`);
  console.log(`   tokenAddress: '${tokenAddress}'`);
  console.log(`   nftContractAddress: '${nftAddress}'`);
  console.log("\n2. Update Vercel env var (mann.cool):");
  console.log(`   NFT_CONTRACT_ADDRESS=${nftAddress}`);
  console.log("\n3. Deploy new subgraph pointing to:", clickstrAddress);
  console.log("\n4. Reset API click counts");

  return deploymentInfo;
}

async function main() {
  const phase = process.env.PHASE || "1";

  if (phase === "1") {
    return phase1();
  } else if (phase === "2") {
    return phase2();
  } else {
    console.error("ERROR: PHASE must be 1 or 2");
    process.exit(1);
  }
}

main()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error(error);
    process.exit(1);
  });
