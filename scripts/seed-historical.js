const hre = require("hardhat");

/**
 * Seed historical clicks and earnings to new registry
 */
async function main() {
  const registryAddress = process.env.REGISTRY_ADDRESS;
  if (!registryAddress) {
    console.error("ERROR: REGISTRY_ADDRESS required");
    process.exit(1);
  }
  
  const [deployer] = await hre.ethers.getSigners();
  console.log("Seeding historical data to registry:", registryAddress);
  console.log("Deployer:", deployer.address);
  
  const registry = await hre.ethers.getContractAt("ClickRegistry", registryAddress);
  
  // Historical data from Season 3 (Sepolia test)
  // User: 0x3d9456Ad6463a77bD77123Cb4836e463030bfAb4
  // Clicks: 426
  // Earned: 12780000000000000000 wei (12.78 CLICK)
  
  const users = ["0x3d9456Ad6463a77bD77123Cb4836e463030bfAb4"];
  const clicks = [426n];
  const earnings = [12780000000000000000n]; // 12.78 CLICK in wei
  const season = 3;
  
  console.log("\n1. Seeding historical clicks for Season", season, "...");
  const clicksTx = await registry.seedHistoricalClicks(users, clicks, season);
  await clicksTx.wait();
  console.log("   Clicks seeded!");
  
  console.log("\n2. Seeding historical earnings for Season", season, "...");
  const earningsTx = await registry.seedHistoricalEarnings(users, earnings, season);
  await earningsTx.wait();
  console.log("   Earnings seeded!");
  
  // Verify
  console.log("\n3. Verifying...");
  const totalClicks = await registry.totalClicks(users[0]);
  const totalEarned = await registry.totalEarned(users[0]);
  console.log("   User:", users[0]);
  console.log("   Total clicks:", totalClicks.toString());
  console.log("   Total earned:", hre.ethers.formatEther(totalEarned), "CLICK");
  
  console.log("\nDone!");
}

main()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error(error);
    process.exit(1);
  });
