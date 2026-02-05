const hre = require("hardhat");
const fs = require("fs");
const path = require("path");

/**
 * Deploy Clickstr V2 to Sepolia with a fresh mock token
 *
 * This is a test deployment script that:
 *   1. Deploys MockClickToken (100M supply)
 *   2. Deploys ClickRegistry
 *   3. Deploys ClickstrTreasury
 *   4. Deploys ClickstrNFTV2
 *   5. Deploys ClickstrGameV2
 *   6. Sets up all authorizations
 *   7. Funds treasury and starts game
 *
 * Environment variables:
 *   ATTESTATION_SIGNER   - Address that signs claim attestations (REQUIRED)
 *   NFT_SIGNER_ADDRESS   - Address that signs NFT claims (REQUIRED)
 *   SEPOLIA_RPC_URL      - Sepolia RPC endpoint
 *   SEPOLIA_PRIVATE_KEY  - Deployer private key
 *
 * Optional:
 *   SEASON_NUMBER        - Season number (default: 2)
 *   SEASON_EPOCHS        - Number of epochs (default: 1)
 *   SEASON_DURATION      - Epoch duration in seconds (default: 86400 = 1 day)
 *   SEASON_POOL          - Token pool in whole tokens (default: 10000000 = 10M)
 *   NFT_BASE_URI         - Base URI for NFT metadata
 *
 * Usage:
 *   ATTESTATION_SIGNER=0x... NFT_SIGNER_ADDRESS=0x... \
 *     npx hardhat run scripts/deploy-v2-sepolia-test.js --network sepolia
 */
async function main() {
  // Required env vars
  const attestationSigner = process.env.ATTESTATION_SIGNER;
  if (!attestationSigner) {
    console.error("ERROR: ATTESTATION_SIGNER environment variable is required");
    console.error("This is the ADDRESS (not private key) that signs claim attestations");
    process.exit(1);
  }

  // NFT signer - can be address or derived from private key
  let nftSignerAddress = process.env.NFT_SIGNER_ADDRESS;
  if (!nftSignerAddress && process.env.NFT_DEPLOYER_KEY) {
    // Derive address from private key
    const wallet = new hre.ethers.Wallet(process.env.NFT_DEPLOYER_KEY);
    nftSignerAddress = wallet.address;
    console.log("Derived NFT signer address from NFT_DEPLOYER_KEY:", nftSignerAddress);
  }
  if (!nftSignerAddress) {
    console.error("ERROR: NFT_SIGNER_ADDRESS or NFT_DEPLOYER_KEY environment variable is required");
    process.exit(1);
  }

  // Configuration
  const seasonNumber = parseInt(process.env.SEASON_NUMBER || "2");
  const totalEpochs = parseInt(process.env.SEASON_EPOCHS || "1");
  const epochDuration = parseInt(process.env.SEASON_DURATION || "86400");
  const seasonPool = process.env.SEASON_POOL || "10000000"; // 10M
  const treasuryFunding = "100000000"; // 100M to treasury
  const nftBaseURI = process.env.NFT_BASE_URI || "ipfs://QmP7joVgJgoW3u6TFCpmxBBWLdrZSvpiioENPHRRbD3t9S/";

  const [deployer] = await hre.ethers.getSigners();
  const network = await hre.ethers.provider.getNetwork();
  const networkName = network.name === "unknown" ? "localhost" : network.name;

  console.log("=".repeat(70));
  console.log("CLICKSTR V2 - SEPOLIA TEST DEPLOYMENT");
  console.log("=".repeat(70));

  console.log("\nNetwork:", networkName);
  console.log("Chain ID:", network.chainId.toString());

  console.log("\nConfiguration:");
  console.log("  Season Number:", seasonNumber);
  console.log("  Total Epochs:", totalEpochs);
  console.log("  Epoch Duration:", epochDuration, "seconds", `(${epochDuration / 3600} hours)`);
  console.log("  Season Pool:", seasonPool, "CLICK");
  console.log("  Treasury Funding:", treasuryFunding, "CLICK");
  console.log("  Season Length:", (totalEpochs * epochDuration) / 86400, "days");

  console.log("\nSigners:");
  console.log("  Attestation Signer:", attestationSigner);
  console.log("  NFT Signer:", nftSignerAddress);

  console.log("\nDeployer:", deployer.address);
  const ethBalance = await hre.ethers.provider.getBalance(deployer.address);
  console.log("ETH Balance:", hre.ethers.formatEther(ethBalance), "ETH");

  if (ethBalance < hre.ethers.parseEther("0.05")) {
    console.error("\nERROR: Insufficient ETH balance! Need at least 0.05 ETH for gas.");
    process.exit(1);
  }

  // Step 1: Deploy MockClickToken
  console.log("\n1. Deploying MockClickToken...");
  const MockClickToken = await hre.ethers.getContractFactory("MockClickToken");
  const initialSupply = hre.ethers.parseEther("1000000000"); // 1 billion
  const mockToken = await MockClickToken.deploy(initialSupply);
  await mockToken.waitForDeployment();
  const tokenAddress = await mockToken.getAddress();
  console.log("   MockClickToken deployed to:", tokenAddress);
  console.log("   Deployer balance:", hre.ethers.formatEther(await mockToken.balanceOf(deployer.address)), "CLICK");

  // Step 2: Deploy ClickRegistry
  console.log("\n2. Deploying ClickRegistry...");
  const ClickRegistry = await hre.ethers.getContractFactory("ClickRegistry");
  const registry = await ClickRegistry.deploy();
  await registry.waitForDeployment();
  const registryAddress = await registry.getAddress();
  console.log("   ClickRegistry deployed to:", registryAddress);

  // Step 3: Deploy ClickstrTreasury
  console.log("\n3. Deploying ClickstrTreasury...");
  const ClickstrTreasury = await hre.ethers.getContractFactory("ClickstrTreasury");
  const treasury = await ClickstrTreasury.deploy(tokenAddress);
  await treasury.waitForDeployment();
  const treasuryAddress = await treasury.getAddress();
  console.log("   ClickstrTreasury deployed to:", treasuryAddress);

  // Step 4: Fund treasury
  console.log("\n4. Funding treasury with", treasuryFunding, "CLICK...");
  const treasuryAmountWei = hre.ethers.parseEther(treasuryFunding);
  const transferTx = await mockToken.transfer(treasuryAddress, treasuryAmountWei);
  await transferTx.wait();
  console.log("   Treasury funded!");
  console.log("   Treasury balance:", hre.ethers.formatEther(await mockToken.balanceOf(treasuryAddress)), "CLICK");

  // Step 5: Deploy ClickstrNFTV2
  console.log("\n5. Deploying ClickstrNFTV2...");
  const ClickstrNFTV2 = await hre.ethers.getContractFactory("ClickstrNFTV2");
  const nft = await ClickstrNFTV2.deploy(registryAddress, nftSignerAddress, nftBaseURI);
  await nft.waitForDeployment();
  const nftAddress = await nft.getAddress();
  console.log("   ClickstrNFTV2 deployed to:", nftAddress);

  // Step 6: Deploy ClickstrGameV2
  console.log("\n6. Deploying ClickstrGameV2...");
  const ClickstrGameV2 = await hre.ethers.getContractFactory("ClickstrGameV2");
  const game = await ClickstrGameV2.deploy(
    registryAddress,
    treasuryAddress,
    seasonNumber,
    totalEpochs,
    epochDuration,
    attestationSigner
  );
  await game.waitForDeployment();
  const gameAddress = await game.getAddress();
  console.log("   ClickstrGameV2 deployed to:", gameAddress);

  // Step 7: Authorize game in registry
  console.log("\n7. Authorizing game in registry...");
  const authRegTx = await registry.authorizeGame(gameAddress, seasonNumber);
  await authRegTx.wait();
  console.log("   Game authorized for season", seasonNumber);

  // Step 8: Authorize game in treasury
  console.log("\n8. Authorizing game as treasury disburser...");
  const seasonPoolWei = hre.ethers.parseEther(seasonPool);
  const authTreasTx = await treasury.authorizeDisburser(gameAddress, seasonPoolWei);
  await authTreasTx.wait();
  console.log("   Game authorized with allowance:", seasonPool, "CLICK");

  // Step 9: Start the game
  console.log("\n9. Starting the game...");
  const startTx = await game.startGame(seasonPoolWei);
  await startTx.wait();
  console.log("   Game started!");

  // Get game info
  const gameStats = await game.getGameStats();
  console.log("\n10. Game Stats:");
  console.log("   Pool remaining:", hre.ethers.formatEther(gameStats.poolRemaining_), "CLICK");
  console.log("   Season:", gameStats.seasonNumber_.toString());
  console.log("   Current epoch:", gameStats.currentEpoch_.toString(), "of", totalEpochs);
  console.log("   Start time:", new Date(Number(gameStats.gameStartTime_) * 1000).toISOString());
  console.log("   End time:", new Date(Number(gameStats.gameEndTime_) * 1000).toISOString());

  // Save deployment info
  const deploymentInfo = {
    version: "v2-test",
    network: networkName,
    chainId: Number(network.chainId),
    season: {
      number: seasonNumber,
      totalEpochs,
      epochDuration,
      poolAmount: seasonPool,
      seasonLengthDays: (totalEpochs * epochDuration) / 86400
    },
    contracts: {
      mockClickToken: tokenAddress,
      clickRegistry: registryAddress,
      clickstrTreasury: treasuryAddress,
      clickstrGameV2: gameAddress,
      clickstrNFTV2: nftAddress
    },
    signers: {
      attestation: attestationSigner,
      nft: nftSignerAddress
    },
    deployer: deployer.address,
    deployedAt: new Date().toISOString(),
    gameStartTime: new Date(Number(gameStats.gameStartTime_) * 1000).toISOString(),
    gameEndTime: new Date(Number(gameStats.gameEndTime_) * 1000).toISOString(),
    blockNumber: await hre.ethers.provider.getBlockNumber()
  };

  // Save to network folder
  const networkDir = path.join(__dirname, "..", networkName);
  if (!fs.existsSync(networkDir)) {
    fs.mkdirSync(networkDir, { recursive: true });
  }

  const deploymentPath = path.join(networkDir, "deployment-v2-test.json");
  fs.writeFileSync(deploymentPath, JSON.stringify(deploymentInfo, null, 2));
  console.log("\n11. Deployment info saved to:", deploymentPath);

  console.log("\n" + "=".repeat(70));
  console.log("SEPOLIA TEST DEPLOYMENT COMPLETE!");
  console.log("=".repeat(70));

  console.log("\nContract Addresses:");
  console.log("  MockClickToken:     ", tokenAddress);
  console.log("  ClickRegistry:      ", registryAddress);
  console.log("  ClickstrTreasury:   ", treasuryAddress);
  console.log("  ClickstrGameV2:     ", gameAddress);
  console.log("  ClickstrNFTV2:      ", nftAddress);

  console.log("\nVerification commands:");
  console.log(`  npx hardhat verify --network ${networkName} ${tokenAddress} ${initialSupply.toString()}`);
  console.log(`  npx hardhat verify --network ${networkName} ${registryAddress}`);
  console.log(`  npx hardhat verify --network ${networkName} ${treasuryAddress} ${tokenAddress}`);
  console.log(`  npx hardhat verify --network ${networkName} ${nftAddress} ${registryAddress} ${nftSignerAddress} "${nftBaseURI}"`);
  console.log(`  npx hardhat verify --network ${networkName} ${gameAddress} ${registryAddress} ${treasuryAddress} ${seasonNumber} ${totalEpochs} ${epochDuration} ${attestationSigner}`);

  console.log("\n" + "=".repeat(70));
  console.log("NEXT STEPS:");
  console.log("=".repeat(70));
  console.log("\n1. Update frontend config with test addresses");
  console.log("\n2. Update server with ATTESTATION_SIGNER_PRIVATE_KEY");
  console.log("\n3. Test the claim flow!");

  return deploymentInfo;
}

main()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error(error);
    process.exit(1);
  });
