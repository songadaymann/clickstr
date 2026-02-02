const hre = require("hardhat");
const fs = require("fs");
const path = require("path");

/**
 * Deploy ClickstrNFT contract
 *
 * Environment variables:
 *   NFT_SIGNER_ADDRESS - Address that will sign claim messages (server wallet)
 *   NFT_BASE_URI       - Base URI for token metadata (auto-loads from nft-ipfs-config.json if available)
 *
 * Example:
 *   NFT_SIGNER_ADDRESS=0x... npx hardhat run scripts/deploy-nft.js --network sepolia
 */
async function main() {
  const signerAddress = process.env.NFT_SIGNER_ADDRESS;

  // Load baseURI from IPFS config if available, otherwise use env or default
  let baseURI = process.env.NFT_BASE_URI;
  const ipfsConfigPath = path.join(__dirname, "..", "nft-ipfs-config.json");
  if (!baseURI && fs.existsSync(ipfsConfigPath)) {
    const ipfsConfig = JSON.parse(fs.readFileSync(ipfsConfigPath, "utf-8"));
    baseURI = ipfsConfig.baseURI;
    console.log("Loaded baseURI from nft-ipfs-config.json");
  }
  baseURI = baseURI || "https://mann.cool/api/clickstr/nft/";

  if (!signerAddress) {
    console.error("ERROR: NFT_SIGNER_ADDRESS environment variable is required");
    console.error("This is the address that will sign NFT claim messages (your server wallet)");
    process.exit(1);
  }

  const [deployer] = await hre.ethers.getSigners();

  console.log("=".repeat(60));
  console.log("STUPID CLICKER NFT - DEPLOYMENT");
  console.log("=".repeat(60));
  console.log("\nConfiguration:");
  console.log("  Signer Address:", signerAddress);
  console.log("  Base URI:", baseURI);
  console.log("\nDeployer:", deployer.address);
  const balance = await hre.ethers.provider.getBalance(deployer.address);
  console.log("Balance:", hre.ethers.formatEther(balance), "ETH");

  // Deploy NFT contract
  console.log("\n1. Deploying ClickstrNFT...");
  const ClickstrNFT = await hre.ethers.getContractFactory("ClickstrNFT");
  const nftContract = await ClickstrNFT.deploy(signerAddress, baseURI);
  await nftContract.waitForDeployment();
  const nftAddress = await nftContract.getAddress();
  console.log("   ClickstrNFT deployed to:", nftAddress);

  // Verify deployment
  console.log("\n2. Verifying deployment...");
  const deployedSigner = await nftContract.signer();
  const deployedBaseURI = await nftContract.baseURI();
  console.log("   Signer:", deployedSigner);
  console.log("   Base URI:", deployedBaseURI);
  console.log("   Owner:", await nftContract.owner());

  // Get network info
  const network = await hre.ethers.provider.getNetwork();
  const networkName = network.name === "unknown" ? "localhost" : network.name;

  // Save deployment info
  const deploymentInfo = {
    network: networkName,
    chainId: Number(network.chainId),
    contract: {
      name: "ClickstrNFT",
      address: nftAddress,
      signer: signerAddress,
      baseURI: baseURI
    },
    deployer: deployer.address,
    deployedAt: new Date().toISOString(),
    blockNumber: await hre.ethers.provider.getBlockNumber()
  };

  // Create network folder if needed
  const networkDir = path.join(__dirname, "..", networkName);
  if (!fs.existsSync(networkDir)) {
    fs.mkdirSync(networkDir, { recursive: true });
  }

  // Save deployment info
  const deploymentPath = path.join(networkDir, "nft-deployment.json");
  fs.writeFileSync(deploymentPath, JSON.stringify(deploymentInfo, null, 2));
  console.log("\n3. Deployment info saved to:", deploymentPath);

  console.log("\n" + "=".repeat(60));
  console.log("DEPLOYMENT COMPLETE!");
  console.log("=".repeat(60));
  console.log("\nContract Address:", nftAddress);
  console.log("\nVerification command:");
  console.log(`  npx hardhat verify --network ${networkName} ${nftAddress} "${signerAddress}" "${baseURI}"`);

  console.log("\n" + "=".repeat(60));
  console.log("NEXT STEPS:");
  console.log("=".repeat(60));
  console.log("\n1. Update frontend CONFIG.nftContractAddress:");
  console.log(`   nftContractAddress: '${nftAddress}'`);
  console.log("\n2. Set NFT_CONTRACT_ADDRESS in your API server env:");
  console.log(`   NFT_CONTRACT_ADDRESS=${nftAddress}`);
  console.log("\n3. Ensure your server has NFT_SIGNER_PRIVATE_KEY set");
  console.log("   (The private key for address:", signerAddress + ")");

  return deploymentInfo;
}

main()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error(error);
    process.exit(1);
  });
