const hre = require("hardhat");
const fs = require("fs");
const path = require("path");

/**
 * Deploy a Stupid Clicker season to Sepolia
 *
 * Environment variables:
 *   SEASON_EPOCHS      - Number of epochs (default: 3)
 *   SEASON_DURATION    - Epoch duration in seconds (default: 86400 = 24 hours)
 *   SEASON_POOL        - Token pool in whole tokens (default: 5000000 = 5M)
 *   INITIAL_DIFFICULTY - Starting difficulty (default: DEFAULT_INITIAL_DIFFICULTY from contract)
 *                        For subsequent seasons, pass the final difficultyTarget from previous season
 *   NFT_CONTRACT       - Address of the achievement NFT contract (optional, for seasons 2+)
 *
 * Examples:
 *   # First season (no NFT bonuses)
 *   npx hardhat run scripts/deploy-sepolia.js --network sepolia
 *
 *   # Season 2+ with NFT bonuses
 *   NFT_CONTRACT=0x... INITIAL_DIFFICULTY=123... npx hardhat run scripts/deploy-sepolia.js --network sepolia
 *
 *   # 1-week season with 10M tokens
 *   SEASON_EPOCHS=7 SEASON_POOL=10000000 npx hardhat run scripts/deploy-sepolia.js --network sepolia
 */
async function main() {
  // Season configuration from env vars
  const totalEpochs = parseInt(process.env.SEASON_EPOCHS || "3");
  const epochDuration = parseInt(process.env.SEASON_DURATION || "86400"); // 24 hours default
  const poolAmount = process.env.SEASON_POOL || "5000000"; // 5M tokens default

  // Default difficulty: type(uint256).max / 1000
  const DEFAULT_DIFFICULTY = (2n ** 256n - 1n) / 1000n;
  const initialDifficulty = process.env.INITIAL_DIFFICULTY
    ? BigInt(process.env.INITIAL_DIFFICULTY)
    : DEFAULT_DIFFICULTY;

  // NFT contract address (optional, use address(0) for first season)
  const nftContractAddress = process.env.NFT_CONTRACT || hre.ethers.ZeroAddress;
  const hasNFTBonuses = nftContractAddress !== hre.ethers.ZeroAddress;

  const [deployer] = await hre.ethers.getSigners();

  console.log("=".repeat(60));
  console.log("STUPID CLICKER - SEASON DEPLOYMENT");
  console.log("=".repeat(60));
  // Calculate target clicks per epoch (same formula as contract)
  const targetClicksPerEpoch = (1_000_000 * epochDuration) / 86400;

  console.log("\nSeason Configuration:");
  console.log("  Total Epochs:", totalEpochs);
  console.log("  Epoch Duration:", epochDuration, "seconds", `(${epochDuration / 3600} hours)`);
  console.log("  Token Pool:", poolAmount, "CLICK");
  console.log("  Season Length:", (totalEpochs * epochDuration) / 86400, "days");
  console.log("  Target Clicks/Epoch:", targetClicksPerEpoch.toLocaleString());
  console.log("  Initial Difficulty:", initialDifficulty.toString().slice(0, 20) + "...");
  console.log("  Using default difficulty:", !process.env.INITIAL_DIFFICULTY);
  console.log("  NFT Contract:", hasNFTBonuses ? nftContractAddress : "None (first season)");
  console.log("\nDeployer:", deployer.address);
  const balance = await hre.ethers.provider.getBalance(deployer.address);
  console.log("Balance:", hre.ethers.formatEther(balance), "ETH");

  // Deploy MockClickToken with pool amount
  console.log("\n1. Deploying MockClickToken...");
  const MockClickToken = await hre.ethers.getContractFactory("MockClickToken");
  const poolAmountWei = hre.ethers.parseEther(poolAmount);
  const clickToken = await MockClickToken.deploy(poolAmountWei);
  await clickToken.waitForDeployment();
  const clickTokenAddress = await clickToken.getAddress();
  console.log("   MockClickToken deployed to:", clickTokenAddress);

  // Deploy StupidClicker with season params
  console.log("\n2. Deploying StupidClicker...");
  const StupidClicker = await hre.ethers.getContractFactory("StupidClicker");
  const stupidClicker = await StupidClicker.deploy(
    clickTokenAddress,
    totalEpochs,
    epochDuration,
    initialDifficulty,
    nftContractAddress
  );
  await stupidClicker.waitForDeployment();
  const stupidClickerAddress = await stupidClicker.getAddress();
  console.log("   StupidClicker deployed to:", stupidClickerAddress);

  // Set up NFT bonuses if NFT contract is provided
  let tierBonuses = [];
  if (hasNFTBonuses) {
    console.log("\n3. Setting up NFT tier bonuses...");
    // Recommended tier bonuses (personal milestones only, no globals)
    const tiers = [4, 6, 8, 9, 11]; // 1K, 10K, 50K, 100K, 500K clicks
    const bonuses = [200, 300, 500, 700, 1000]; // 2%, 3%, 5%, 7%, 10%

    const bonusTx = await stupidClicker.setTierBonuses(tiers, bonuses);
    await bonusTx.wait();

    tierBonuses = tiers.map((t, i) => ({ tier: t, bonus: bonuses[i] }));
    console.log("   Tier bonuses set:");
    console.log("     Tier 4  (1K clicks):     2%");
    console.log("     Tier 6  (10K clicks):    3%");
    console.log("     Tier 8  (50K clicks):    5%");
    console.log("     Tier 9  (100K clicks):   7%");
    console.log("     Tier 11 (500K clicks):  10%");
    console.log("   Max possible bonus: 27%");
  }

  // Approve and start the game
  console.log(`\n${hasNFTBonuses ? "4" : "3"}. Approving tokens for game...`);
  const approveTx = await clickToken.approve(stupidClickerAddress, poolAmountWei);
  await approveTx.wait();
  console.log("   Approved", poolAmount, "CLICK tokens");

  console.log(`\n${hasNFTBonuses ? "5" : "4"}. Starting the game...`);
  const startTx = await stupidClicker.startGame(poolAmountWei);
  await startTx.wait();
  console.log("   Game started!");

  // Get game info
  const gameStats = await stupidClicker.getGameStats();
  console.log(`\n${hasNFTBonuses ? "6" : "5"}. Game Stats:`);
  console.log("   Pool remaining:", hre.ethers.formatEther(gameStats.poolRemaining_), "CLICK");
  console.log("   Current epoch:", gameStats.currentEpoch_.toString(), "of", totalEpochs);
  console.log("   Game started:", gameStats.started_);
  console.log("   Start time:", new Date(Number(gameStats.gameStartTime_) * 1000).toISOString());
  console.log("   End time:", new Date(Number(gameStats.gameEndTime_) * 1000).toISOString());

  // Save deployment info
  const deploymentInfo = {
    network: "sepolia",
    chainId: 11155111,
    season: {
      totalEpochs,
      epochDuration,
      poolAmount,
      seasonLengthDays: (totalEpochs * epochDuration) / 86400,
      targetClicksPerEpoch,
      initialDifficulty: initialDifficulty.toString(),
      nftContract: hasNFTBonuses ? nftContractAddress : null,
      tierBonuses: tierBonuses
    },
    contracts: {
      clickToken: clickTokenAddress,
      stupidClicker: stupidClickerAddress
    },
    deployer: deployer.address,
    deployedAt: new Date().toISOString(),
    gameStartTime: new Date(Number(gameStats.gameStartTime_) * 1000).toISOString(),
    gameEndTime: new Date(Number(gameStats.gameEndTime_) * 1000).toISOString(),
    blockNumber: await hre.ethers.provider.getBlockNumber()
  };

  // Create sepolia folder if it doesn't exist
  const sepoliaDir = path.join(__dirname, "..", "sepolia");
  if (!fs.existsSync(sepoliaDir)) {
    fs.mkdirSync(sepoliaDir, { recursive: true });
  }

  // Save deployment info
  const deploymentPath = path.join(sepoliaDir, "deployment.json");
  fs.writeFileSync(deploymentPath, JSON.stringify(deploymentInfo, null, 2));
  console.log("\n6. Deployment info saved to:", deploymentPath);

  console.log("\n" + "=".repeat(60));
  console.log("DEPLOYMENT COMPLETE!");
  console.log("=".repeat(60));
  console.log("\nContract Addresses:");
  console.log("  MockClickToken:", clickTokenAddress);
  console.log("  StupidClicker: ", stupidClickerAddress);
  console.log("\nVerification commands:");
  console.log(`  npx hardhat verify --network sepolia ${clickTokenAddress} "${poolAmountWei}"`);
  console.log(`  npx hardhat verify --network sepolia ${stupidClickerAddress} ${clickTokenAddress} ${totalEpochs} ${epochDuration} "${initialDifficulty}" ${nftContractAddress}`);

  console.log("\nTo get final difficulty for next season:");
  console.log(`  cast call ${stupidClickerAddress} "difficultyTarget()" --rpc-url sepolia`);

  if (!hasNFTBonuses) {
    console.log("\nNote: No NFT bonuses configured (first season).");
    console.log("For Season 2+, deploy NFT contract first and pass NFT_CONTRACT=<address>");
  }

  return deploymentInfo;
}

main()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error(error);
    process.exit(1);
  });
