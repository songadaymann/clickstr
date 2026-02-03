const hre = require("hardhat");
const fs = require("fs");
const path = require("path");

/**
 * Deploy a Clickstr season using an EXISTING token (for mainnet or mainnet-like testing)
 *
 * This script assumes:
 *   1. The token already exists (e.g., $CLICK on mainnet, or a MockClickToken on Sepolia)
 *   2. The deployer wallet already holds the tokens needed for the season pool
 *   3. The NFT contract is already deployed
 *
 * Environment variables:
 *   CLICK_TOKEN_ADDRESS - Address of the $CLICK token (REQUIRED)
 *   NFT_CONTRACT        - Address of the ClickstrNFT contract (REQUIRED)
 *   SEASON_EPOCHS       - Number of epochs (default: 3)
 *   SEASON_DURATION     - Epoch duration in seconds (default: 86400 = 24 hours)
 *   SEASON_POOL         - Token pool in whole tokens (default: 3000000 = 3M)
 *   INITIAL_DIFFICULTY  - Starting difficulty (default: type(uint256).max / 1000)
 *
 * Example (Sepolia dry run):
 *   CLICK_TOKEN_ADDRESS=0x... NFT_CONTRACT=0x... SEASON_POOL=3000000 \
 *     npx hardhat run scripts/deploy-mainnet.js --network sepolia
 *
 * Example (Mainnet):
 *   CLICK_TOKEN_ADDRESS=0x... NFT_CONTRACT=0x... SEASON_EPOCHS=3 SEASON_POOL=3000000 \
 *     npx hardhat run scripts/deploy-mainnet.js --network mainnet
 */
async function main() {
  // Required: existing token address
  const clickTokenAddress = process.env.CLICK_TOKEN_ADDRESS;
  if (!clickTokenAddress) {
    console.error("ERROR: CLICK_TOKEN_ADDRESS environment variable is required");
    console.error("This should be the address of the existing $CLICK token");
    process.exit(1);
  }

  // Required: NFT contract address
  const nftContractAddress = process.env.NFT_CONTRACT;
  if (!nftContractAddress) {
    console.error("ERROR: NFT_CONTRACT environment variable is required");
    console.error("This should be the address of the ClickstrNFT contract");
    process.exit(1);
  }

  // Season configuration from env vars
  const totalEpochs = parseInt(process.env.SEASON_EPOCHS || "3");
  const epochDuration = parseInt(process.env.SEASON_DURATION || "86400"); // 24 hours default
  const poolAmount = process.env.SEASON_POOL || "3000000"; // 3M tokens default

  // Default difficulty: type(uint256).max / 1000
  const DEFAULT_DIFFICULTY = (2n ** 256n - 1n) / 1000n;
  const initialDifficulty = process.env.INITIAL_DIFFICULTY
    ? BigInt(process.env.INITIAL_DIFFICULTY)
    : DEFAULT_DIFFICULTY;

  const [deployer] = await hre.ethers.getSigners();
  const network = await hre.ethers.provider.getNetwork();
  const networkName = network.name === "unknown" ? "localhost" : network.name;
  const isMainnet = network.chainId === 1n;

  console.log("=".repeat(60));
  console.log("CLICKSTR - SEASON DEPLOYMENT (EXISTING TOKEN)");
  console.log("=".repeat(60));

  // Calculate target clicks per epoch (same formula as contract)
  const targetClicksPerEpoch = (1_000_000 * epochDuration) / 86400;

  console.log("\nNetwork:", networkName, isMainnet ? "(MAINNET - BE CAREFUL!)" : "");
  console.log("Chain ID:", network.chainId.toString());

  console.log("\nSeason Configuration:");
  console.log("  Total Epochs:", totalEpochs);
  console.log("  Epoch Duration:", epochDuration, "seconds", `(${epochDuration / 3600} hours)`);
  console.log("  Token Pool:", poolAmount, "CLICK");
  console.log("  Season Length:", (totalEpochs * epochDuration) / 86400, "days");
  console.log("  Target Clicks/Epoch:", targetClicksPerEpoch.toLocaleString());
  console.log("  Initial Difficulty:", initialDifficulty.toString().slice(0, 20) + "...");

  console.log("\nExisting Contracts:");
  console.log("  $CLICK Token:", clickTokenAddress);
  console.log("  NFT Contract:", nftContractAddress);

  console.log("\nDeployer:", deployer.address);
  const ethBalance = await hre.ethers.provider.getBalance(deployer.address);
  console.log("ETH Balance:", hre.ethers.formatEther(ethBalance), "ETH");

  // Check deployer's token balance
  const clickToken = await hre.ethers.getContractAt("IERC20", clickTokenAddress);
  const tokenBalance = await clickToken.balanceOf(deployer.address);
  const poolAmountWei = hre.ethers.parseEther(poolAmount);

  console.log("$CLICK Balance:", hre.ethers.formatEther(tokenBalance), "CLICK");

  if (tokenBalance < poolAmountWei) {
    console.error("\n❌ ERROR: Insufficient token balance!");
    console.error(`   Need: ${poolAmount} CLICK`);
    console.error(`   Have: ${hre.ethers.formatEther(tokenBalance)} CLICK`);
    console.error("\nTransfer tokens to deployer wallet before running this script.");
    process.exit(1);
  }

  console.log("✅ Sufficient token balance for season pool");

  // Confirmation prompt for mainnet
  if (isMainnet) {
    console.log("\n" + "⚠️ ".repeat(20));
    console.log("WARNING: You are deploying to MAINNET!");
    console.log("This will spend real $CLICK tokens.");
    console.log("⚠️ ".repeat(20));
    console.log("\nPress Ctrl+C within 10 seconds to cancel...");
    await new Promise(resolve => setTimeout(resolve, 10000));
    console.log("Proceeding with mainnet deployment...\n");
  }

  // Step 1: Deploy Clickstr
  console.log("\n1. Deploying Clickstr...");
  const Clickstr = await hre.ethers.getContractFactory("Clickstr");
  const clickstr = await Clickstr.deploy(
    clickTokenAddress,
    totalEpochs,
    epochDuration,
    initialDifficulty,
    nftContractAddress
  );
  await clickstr.waitForDeployment();
  const clickstrAddress = await clickstr.getAddress();
  console.log("   Clickstr deployed to:", clickstrAddress);

  // Step 2: Set up NFT tier bonuses
  console.log("\n2. Setting up NFT tier bonuses...");
  const tiers = [4, 6, 8, 9, 11]; // 1K, 10K, 50K, 100K, 500K clicks
  const bonuses = [200, 300, 500, 700, 1000]; // 2%, 3%, 5%, 7%, 10%

  const bonusTx = await clickstr.setTierBonuses(tiers, bonuses);
  await bonusTx.wait();

  console.log("   Tier bonuses set:");
  console.log("     Tier 4  (1K clicks):     2%");
  console.log("     Tier 6  (10K clicks):    3%");
  console.log("     Tier 8  (50K clicks):    5%");
  console.log("     Tier 9  (100K clicks):   7%");
  console.log("     Tier 11 (500K clicks):  10%");

  // Step 3: Approve tokens
  console.log("\n3. Approving tokens for game...");
  const approveTx = await clickToken.approve(clickstrAddress, poolAmountWei);
  await approveTx.wait();
  console.log("   Approved", poolAmount, "CLICK tokens");

  // Step 4: Start the game
  console.log("\n4. Starting the game...");
  const startTx = await clickstr.startGame(poolAmountWei);
  await startTx.wait();
  console.log("   Game started!");

  // Get game info
  const gameStats = await clickstr.getGameStats();
  console.log("\n5. Game Stats:");
  console.log("   Pool remaining:", hre.ethers.formatEther(gameStats.poolRemaining_), "CLICK");
  console.log("   Current epoch:", gameStats.currentEpoch_.toString(), "of", totalEpochs);
  console.log("   Game started:", gameStats.started_);
  console.log("   Start time:", new Date(Number(gameStats.gameStartTime_) * 1000).toISOString());
  console.log("   End time:", new Date(Number(gameStats.gameEndTime_) * 1000).toISOString());

  // Check remaining balance
  const remainingBalance = await clickToken.balanceOf(deployer.address);
  console.log("\n6. Deployer's remaining $CLICK balance:", hre.ethers.formatEther(remainingBalance), "CLICK");

  // Save deployment info
  const deploymentInfo = {
    network: networkName,
    chainId: Number(network.chainId),
    season: {
      totalEpochs,
      epochDuration,
      poolAmount,
      seasonLengthDays: (totalEpochs * epochDuration) / 86400,
      targetClicksPerEpoch,
      initialDifficulty: initialDifficulty.toString()
    },
    contracts: {
      clickToken: clickTokenAddress,
      clickstr: clickstrAddress,
      nft: nftContractAddress
    },
    tierBonuses: tiers.map((t, i) => ({ tier: t, bonus: bonuses[i] })),
    deployer: deployer.address,
    deployedAt: new Date().toISOString(),
    gameStartTime: new Date(Number(gameStats.gameStartTime_) * 1000).toISOString(),
    gameEndTime: new Date(Number(gameStats.gameEndTime_) * 1000).toISOString(),
    blockNumber: await hre.ethers.provider.getBlockNumber()
  };

  // Create network folder if it doesn't exist
  const networkDir = path.join(__dirname, "..", networkName);
  if (!fs.existsSync(networkDir)) {
    fs.mkdirSync(networkDir, { recursive: true });
  }

  // Save deployment info
  const deploymentPath = path.join(networkDir, "deployment.json");
  fs.writeFileSync(deploymentPath, JSON.stringify(deploymentInfo, null, 2));
  console.log("\n7. Deployment info saved to:", deploymentPath);

  console.log("\n" + "=".repeat(60));
  console.log("DEPLOYMENT COMPLETE!");
  console.log("=".repeat(60));
  console.log("\nContract Addresses:");
  console.log("  $CLICK Token:  ", clickTokenAddress);
  console.log("  Clickstr:      ", clickstrAddress);
  console.log("  NFT Contract:  ", nftContractAddress);

  console.log("\nVerification command:");
  console.log(`  npx hardhat verify --network ${networkName} ${clickstrAddress} ${clickTokenAddress} ${totalEpochs} ${epochDuration} "${initialDifficulty}" ${nftContractAddress}`);

  console.log("\n" + "=".repeat(60));
  console.log("NEXT STEPS:");
  console.log("=".repeat(60));
  console.log("\n1. Update frontend config with new Clickstr address:");
  console.log(`   contractAddress: '${clickstrAddress}'`);
  console.log("\n2. Deploy/update subgraph for new contract:");
  console.log("   - Update subgraph.yaml with new address and startBlock");
  console.log("   - Run: goldsky subgraph deploy clickstr-" + networkName + "/<version> --path .");
  console.log("\n3. To get final difficulty for next season:");
  console.log(`   cast call ${clickstrAddress} "difficultyTarget()" --rpc-url ${networkName}`);

  return deploymentInfo;
}

main()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error(error);
    process.exit(1);
  });
