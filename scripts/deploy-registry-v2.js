const hre = require("hardhat");

/**
 * Deploy new ClickRegistry with earnings tracking
 * Then migrate historical data and deploy a new season
 */
async function main() {
  const [deployer] = await hre.ethers.getSigners();
  const network = await hre.ethers.provider.getNetwork();
  
  console.log("=".repeat(70));
  console.log("CLICKREGISTRY V2 DEPLOYMENT (with earnings tracking)");
  console.log("=".repeat(70));
  console.log("\nNetwork:", network.name === "unknown" ? "localhost" : network.name);
  console.log("Deployer:", deployer.address);
  
  // Deploy new ClickRegistry
  console.log("\n1. Deploying new ClickRegistry...");
  const ClickRegistry = await hre.ethers.getContractFactory("ClickRegistry");
  const registry = await ClickRegistry.deploy();
  await registry.waitForDeployment();
  const registryAddress = await registry.getAddress();
  console.log("   ClickRegistry deployed to:", registryAddress);
  
  console.log("\n" + "=".repeat(70));
  console.log("DEPLOYMENT COMPLETE!");
  console.log("=".repeat(70));
  console.log("\nNew ClickRegistry:", registryAddress);
  console.log("\nNext steps:");
  console.log("1. Seed historical clicks with seedHistoricalClicks()");
  console.log("2. Seed historical earnings with seedHistoricalEarnings()");
  console.log("3. Deploy new season with deploy-v2-season.js using this registry");
  console.log("4. Update CLICKSTR_REGISTRY_ADDRESS env var in Vercel");
  
  return { registryAddress };
}

main()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error(error);
    process.exit(1);
  });
