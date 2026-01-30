const hre = require("hardhat");

async function main() {
  const [deployer] = await hre.ethers.getSigners();
  
  console.log("Deploying StupidClicker with account:", deployer.address);
  console.log("Account balance:", (await hre.ethers.provider.getBalance(deployer.address)).toString());
  
  // Get the $CLICK token address from environment or command line
  const clickTokenAddress = process.env.CLICK_TOKEN_ADDRESS;
  
  if (!clickTokenAddress) {
    console.error("ERROR: CLICK_TOKEN_ADDRESS environment variable not set");
    console.log("\nUsage:");
    console.log("  CLICK_TOKEN_ADDRESS=0x... npx hardhat run scripts/deploy.js --network mainnet");
    process.exit(1);
  }
  
  console.log("$CLICK token address:", clickTokenAddress);
  
  // Deploy StupidClicker
  const StupidClicker = await hre.ethers.getContractFactory("StupidClicker");
  const stupidClicker = await StupidClicker.deploy(clickTokenAddress);
  
  await stupidClicker.waitForDeployment();
  
  const contractAddress = await stupidClicker.getAddress();
  
  console.log("\n✅ StupidClicker deployed to:", contractAddress);
  console.log("\n📋 Next steps:");
  console.log("1. Approve the contract to spend your $CLICK tokens:");
  console.log(`   clickToken.approve("${contractAddress}", 100000000 * 10**18)`);
  console.log("\n2. Start the game with 100M tokens:");
  console.log(`   stupidClicker.startGame(100000000 * 10**18)`);
  console.log("\n3. Verify on Etherscan:");
  console.log(`   npx hardhat verify --network mainnet ${contractAddress} ${clickTokenAddress}`);
  
  // Save deployment info
  const deploymentInfo = {
    network: hre.network.name,
    contractAddress: contractAddress,
    clickTokenAddress: clickTokenAddress,
    deployer: deployer.address,
    deployedAt: new Date().toISOString(),
    blockNumber: await hre.ethers.provider.getBlockNumber()
  };
  
  console.log("\n📄 Deployment info:", JSON.stringify(deploymentInfo, null, 2));
  
  return deploymentInfo;
}

main()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error(error);
    process.exit(1);
  });

