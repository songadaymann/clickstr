const hre = require("hardhat");
const fs = require("fs");
const path = require("path");

/**
 * Deploy full test environment to Sepolia
 *
 * Deploys:
 *   1. MockClickToken (2M tokens)
 *   2. StupidClickerNFT (achievement NFTs)
 *   3. StupidClicker (game contract with 2-hour epochs)
 *
 * Configuration:
 *   - 24 epochs × 2 hours = 48 hours (2 days)
 *   - 2M token pool
 *   - Target: 83,333 clicks per epoch (scaled from 1M/day)
 *
 * Usage:
 *   npx hardhat run scripts/test-deploy.js --network sepolia
 */
async function main() {
  // ============ Configuration ============
  const CONFIG = {
    totalEpochs: 24,              // 24 epochs
    epochDuration: 7200,          // 2 hours (7200 seconds)
    poolAmount: "2000000",        // 2M tokens
    nftBaseUri: "https://mann.cool/api/stupid-clicker/nft/",
  };

  // Calculate derived values
  const seasonLengthHours = (CONFIG.totalEpochs * CONFIG.epochDuration) / 3600;
  const seasonLengthDays = seasonLengthHours / 24;
  const targetClicksPerEpoch = Math.floor((1_000_000 * CONFIG.epochDuration) / 86400);

  const [deployer] = await hre.ethers.getSigners();

  console.log("╔════════════════════════════════════════════════════════════╗");
  console.log("║         STUPID CLICKER - 2-DAY TEST DEPLOYMENT             ║");
  console.log("╚════════════════════════════════════════════════════════════╝");

  console.log("\n📋 Test Configuration:");
  console.log("   ├─ Total Epochs:", CONFIG.totalEpochs);
  console.log("   ├─ Epoch Duration:", CONFIG.epochDuration / 3600, "hours");
  console.log("   ├─ Season Length:", seasonLengthDays, "days (" + seasonLengthHours + " hours)");
  console.log("   ├─ Token Pool:", CONFIG.poolAmount, "CLICK");
  console.log("   ├─ Target Clicks/Epoch:", targetClicksPerEpoch.toLocaleString());
  console.log("   └─ NFT Base URI:", CONFIG.nftBaseUri);

  console.log("\n👤 Deployer:", deployer.address);
  const balance = await hre.ethers.provider.getBalance(deployer.address);
  console.log("   Balance:", hre.ethers.formatEther(balance), "ETH");

  if (parseFloat(hre.ethers.formatEther(balance)) < 0.05) {
    console.log("\n⚠️  Warning: Low balance. You may need more Sepolia ETH.");
    console.log("   Get some from: https://sepoliafaucet.com");
  }

  // ============ Step 1: Deploy MockClickToken ============
  console.log("\n" + "─".repeat(60));
  console.log("Step 1/4: Deploying MockClickToken...");

  const MockClickToken = await hre.ethers.getContractFactory("MockClickToken");
  const poolAmountWei = hre.ethers.parseEther(CONFIG.poolAmount);
  const clickToken = await MockClickToken.deploy(poolAmountWei);
  await clickToken.waitForDeployment();
  const clickTokenAddress = await clickToken.getAddress();

  console.log("   ✅ MockClickToken deployed to:", clickTokenAddress);

  // ============ Step 2: Deploy StupidClickerNFT ============
  console.log("\n" + "─".repeat(60));
  console.log("Step 2/4: Deploying StupidClickerNFT...");

  // Use deployer as signer for testing (in production, use a dedicated signer wallet)
  const nftSigner = deployer.address;

  const StupidClickerNFT = await hre.ethers.getContractFactory("StupidClickerNFT");
  const nftContract = await StupidClickerNFT.deploy(nftSigner, CONFIG.nftBaseUri);
  await nftContract.waitForDeployment();
  const nftContractAddress = await nftContract.getAddress();

  console.log("   ✅ StupidClickerNFT deployed to:", nftContractAddress);
  console.log("   NFT Signer:", nftSigner);
  console.log("   ⚠️  For testing, deployer is the signer. Export private key for API.");

  // ============ Step 3: Deploy StupidClicker ============
  console.log("\n" + "─".repeat(60));
  console.log("Step 3/4: Deploying StupidClicker...");

  // Default difficulty: type(uint256).max / 1000
  const DEFAULT_DIFFICULTY = (2n ** 256n - 1n) / 1000n;

  const StupidClicker = await hre.ethers.getContractFactory("StupidClicker");
  const stupidClicker = await StupidClicker.deploy(
    clickTokenAddress,
    CONFIG.totalEpochs,
    CONFIG.epochDuration,
    DEFAULT_DIFFICULTY,
    nftContractAddress  // Link NFT contract for potential bonuses
  );
  await stupidClicker.waitForDeployment();
  const stupidClickerAddress = await stupidClicker.getAddress();

  console.log("   ✅ StupidClicker deployed to:", stupidClickerAddress);

  // ============ Step 4: Start the Game ============
  console.log("\n" + "─".repeat(60));
  console.log("Step 4/4: Starting the game...");

  // Approve tokens
  const approveTx = await clickToken.approve(stupidClickerAddress, poolAmountWei);
  await approveTx.wait();
  console.log("   ✅ Approved", CONFIG.poolAmount, "CLICK tokens");

  // Start game
  const startTx = await stupidClicker.startGame(poolAmountWei);
  await startTx.wait();
  console.log("   ✅ Game started!");

  // Get game info
  const gameStats = await stupidClicker.getGameStats();
  const startTime = new Date(Number(gameStats.gameStartTime_) * 1000);
  const endTime = new Date(Number(gameStats.gameEndTime_) * 1000);

  // ============ Summary ============
  console.log("\n" + "═".repeat(60));
  console.log("                    DEPLOYMENT COMPLETE!");
  console.log("═".repeat(60));

  console.log("\n📜 Contract Addresses:");
  console.log("   ├─ MockClickToken:    ", clickTokenAddress);
  console.log("   ├─ StupidClickerNFT:  ", nftContractAddress);
  console.log("   └─ StupidClicker:     ", stupidClickerAddress);

  console.log("\n⏰ Game Timeline:");
  console.log("   ├─ Start:", startTime.toISOString());
  console.log("   ├─ End:  ", endTime.toISOString());
  console.log("   └─ Duration:", seasonLengthDays, "days");

  console.log("\n📊 Game Parameters:");
  console.log("   ├─ Pool:", hre.ethers.formatEther(gameStats.poolRemaining_), "CLICK");
  console.log("   ├─ Current Epoch:", gameStats.currentEpoch_.toString(), "of", CONFIG.totalEpochs);
  console.log("   ├─ Epoch Duration:", CONFIG.epochDuration / 3600, "hours");
  console.log("   └─ Target Clicks/Epoch:", targetClicksPerEpoch.toLocaleString());

  // ============ Save Deployment Info ============
  const deploymentInfo = {
    network: "sepolia",
    chainId: 11155111,
    testRun: true,
    config: {
      totalEpochs: CONFIG.totalEpochs,
      epochDuration: CONFIG.epochDuration,
      epochDurationHours: CONFIG.epochDuration / 3600,
      poolAmount: CONFIG.poolAmount,
      seasonLengthDays,
      targetClicksPerEpoch,
      nftBaseUri: CONFIG.nftBaseUri
    },
    contracts: {
      clickToken: clickTokenAddress,
      stupidClicker: stupidClickerAddress,
      nftContract: nftContractAddress
    },
    nftSigner: nftSigner,
    deployer: deployer.address,
    deployedAt: new Date().toISOString(),
    gameStartTime: startTime.toISOString(),
    gameEndTime: endTime.toISOString(),
    blockNumber: await hre.ethers.provider.getBlockNumber()
  };

  // Save to test folder
  const testDir = path.join(__dirname, "..", "test-deployment");
  if (!fs.existsSync(testDir)) {
    fs.mkdirSync(testDir, { recursive: true });
  }

  const deploymentPath = path.join(testDir, "deployment.json");
  fs.writeFileSync(deploymentPath, JSON.stringify(deploymentInfo, null, 2));
  console.log("\n💾 Deployment info saved to:", deploymentPath);

  // ============ Next Steps ============
  console.log("\n" + "─".repeat(60));
  console.log("📝 NEXT STEPS:");
  console.log("─".repeat(60));

  console.log("\n1. Verify contracts on Etherscan:");
  console.log(`   npx hardhat verify --network sepolia ${clickTokenAddress} "${poolAmountWei}"`);
  console.log(`   npx hardhat verify --network sepolia ${nftContractAddress} "${nftSigner}" "${CONFIG.nftBaseUri}"`);
  console.log(`   npx hardhat verify --network sepolia ${stupidClickerAddress} "${clickTokenAddress}" ${CONFIG.totalEpochs} ${CONFIG.epochDuration} "${DEFAULT_DIFFICULTY}" "${nftContractAddress}"`);

  console.log("\n2. Fund test wallets with Sepolia ETH:");
  console.log("   Bot A (contract):  0.3 ETH");
  console.log("   Bot B (frontend):  0.1 ETH");
  console.log("   Human (you):       0.2 ETH");

  console.log("\n3. Update frontend CONFIG:");
  console.log(`   contractAddress: "${stupidClickerAddress}"`);
  console.log(`   tokenAddress: "${clickTokenAddress}"`);
  console.log(`   nftAddress: "${nftContractAddress}"`);
  console.log(`   chainId: 11155111`);

  console.log("\n4. Update API environment:");
  console.log(`   STUPID_CLICKER_ADDRESS=${stupidClickerAddress}`);
  console.log(`   NFT_CONTRACT_ADDRESS=${nftContractAddress}`);
  console.log(`   NFT_SIGNER_PRIVATE_KEY=<deployer private key for testing>`);

  console.log("\n5. Run the bots:");
  console.log("   node scripts/test-bot-a-contract.js");
  console.log("   node scripts/test-bot-b-frontend.js");

  console.log("\n6. Start clicking! 🖱️");
  console.log("─".repeat(60));

  return deploymentInfo;
}

main()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error(error);
    process.exit(1);
  });
