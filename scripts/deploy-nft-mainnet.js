const hre = require("hardhat");
const { ethers } = require("ethers");
const fs = require("fs");
const path = require("path");

/**
 * Deploy ClickstrNFT contract to MAINNET
 *
 * Uses NFT_DEPLOYER_KEY which is the same wallet as the signer (0xf55E4fac...)
 * This means the deployer is BOTH owner AND signer.
 *
 * Usage:
 *   npx hardhat run scripts/deploy-nft-mainnet.js --network mainnet
 */
async function main() {
  // Load the NFT deployer key
  const deployerKey = process.env.NFT_DEPLOYER_KEY;
  if (!deployerKey) {
    console.error("ERROR: NFT_DEPLOYER_KEY environment variable is required");
    process.exit(1);
  }

  // Create a wallet with the deployer key
  const provider = new ethers.JsonRpcProvider(process.env.ETH_MAINNET_RPC_URL);
  const deployerWallet = new ethers.Wallet(deployerKey, provider);

  // Load baseURI from IPFS config
  let baseURI;
  const ipfsConfigPath = path.join(__dirname, "..", "nft-ipfs-config.json");
  if (fs.existsSync(ipfsConfigPath)) {
    const ipfsConfig = JSON.parse(fs.readFileSync(ipfsConfigPath, "utf-8"));
    baseURI = ipfsConfig.baseURI;
    console.log("Loaded baseURI from nft-ipfs-config.json");
  } else {
    baseURI = "ipfs://QmfZqEdzeEm61d3uSeFxBc1HasR3KC6rMsiRnxkvzM3Ywx/clickstr-metadata/";
    console.log("Using hardcoded baseURI");
  }

  // The signer is the same as the deployer
  const signerAddress = deployerWallet.address;

  console.log("=".repeat(60));
  console.log("CLICKSTR NFT - MAINNET DEPLOYMENT");
  console.log("=".repeat(60));
  console.log("\nConfiguration:");
  console.log("  Signer Address:", signerAddress);
  console.log("  Base URI:", baseURI);
  console.log("\nDeployer:", deployerWallet.address);
  console.log("  (Deployer = Owner = Signer)");

  const balance = await provider.getBalance(deployerWallet.address);
  console.log("Balance:", ethers.formatEther(balance), "ETH");

  if (balance < ethers.parseEther("0.01")) {
    console.error("\nERROR: Insufficient balance for deployment (need at least 0.01 ETH)");
    process.exit(1);
  }

  // Get gas price estimate
  const feeData = await provider.getFeeData();
  console.log("\nGas Price:", ethers.formatUnits(feeData.gasPrice || 0n, "gwei"), "gwei");

  // Confirmation prompt
  console.log("\n" + "=".repeat(60));
  console.log("READY TO DEPLOY TO MAINNET");
  console.log("=".repeat(60));
  console.log("\nThis will deploy the ClickstrNFT contract to Ethereum mainnet.");
  console.log("The contract will be owned by:", signerAddress);
  console.log("\nPress Ctrl+C within 10 seconds to cancel...");

  await new Promise(resolve => setTimeout(resolve, 10000));

  // Deploy NFT contract using the deployer wallet
  console.log("\n1. Deploying ClickstrNFT...");

  // Get the contract factory and connect it to our deployer wallet
  const ClickstrNFT = await hre.ethers.getContractFactory("ClickstrNFT", deployerWallet);
  const nftContract = await ClickstrNFT.deploy(signerAddress, baseURI);

  console.log("   Transaction hash:", nftContract.deploymentTransaction().hash);
  console.log("   Waiting for confirmation...");

  await nftContract.waitForDeployment();
  const nftAddress = await nftContract.getAddress();
  console.log("   ClickstrNFT deployed to:", nftAddress);

  // Verify deployment
  console.log("\n2. Verifying deployment...");
  const deployedSigner = await nftContract.signer();
  const deployedBaseURI = await nftContract.baseURI();
  const owner = await nftContract.owner();
  console.log("   Signer:", deployedSigner);
  console.log("   Base URI:", deployedBaseURI);
  console.log("   Owner:", owner);

  // Save deployment info
  const deploymentInfo = {
    network: "mainnet",
    chainId: 1,
    contract: {
      name: "ClickstrNFT",
      address: nftAddress,
      signer: signerAddress,
      baseURI: baseURI
    },
    deployer: deployerWallet.address,
    deployedAt: new Date().toISOString(),
    txHash: nftContract.deploymentTransaction().hash
  };

  // Create mainnet folder if needed
  const networkDir = path.join(__dirname, "..", "mainnet");
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
  console.log("\nEtherscan:", `https://etherscan.io/address/${nftAddress}`);

  console.log("\nVerification command:");
  console.log(`  npx hardhat verify --network mainnet ${nftAddress} "${signerAddress}" "${baseURI}"`);

  console.log("\n" + "=".repeat(60));
  console.log("NEXT STEPS:");
  console.log("=".repeat(60));
  console.log("\n1. Update Vercel env var (mann.cool):");
  console.log(`   NFT_CONTRACT_ADDRESS=${nftAddress}`);
  console.log("\n2. Update frontend CONFIG for mainnet:");
  console.log(`   nftContractAddress: '${nftAddress}'`);
  console.log("\n3. Verify on Etherscan (run command above)");

  return deploymentInfo;
}

main()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error(error);
    process.exit(1);
  });
