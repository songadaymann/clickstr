const hre = require("hardhat");

/**
 * Deploy a MockClickToken with a large supply to simulate your mainnet treasury
 *
 * This is for Sepolia dry runs only - to test the mainnet deployment flow.
 *
 * Environment variables:
 *   TREASURY_AMOUNT - Amount to mint (default: 100000000 = 100M)
 *
 * Example:
 *   npx hardhat run scripts/deploy-mock-treasury.js --network sepolia
 */
async function main() {
  const treasuryAmount = process.env.TREASURY_AMOUNT || "100000000"; // 100M default

  const [deployer] = await hre.ethers.getSigners();

  console.log("=".repeat(60));
  console.log("MOCK TREASURY - DEPLOY");
  console.log("=".repeat(60));
  console.log("\nDeployer:", deployer.address);
  console.log("Treasury Amount:", treasuryAmount, "CLICK");

  const MockClickToken = await hre.ethers.getContractFactory("MockClickToken");
  const treasuryAmountWei = hre.ethers.parseEther(treasuryAmount);
  const clickToken = await MockClickToken.deploy(treasuryAmountWei);
  await clickToken.waitForDeployment();
  const tokenAddress = await clickToken.getAddress();

  console.log("\n✅ MockClickToken deployed to:", tokenAddress);
  console.log("   Total supply:", treasuryAmount, "CLICK");
  console.log("   All tokens in deployer wallet:", deployer.address);

  console.log("\n" + "=".repeat(60));
  console.log("NEXT STEPS:");
  console.log("=".repeat(60));
  console.log("\nTo deploy a season with this token:");
  console.log(`  CLICK_TOKEN_ADDRESS=${tokenAddress} \\`);
  console.log(`  NFT_CONTRACT=0x39B41525ba423FcAbE23564ecCCdEa66e7D59551 \\`);
  console.log(`  SEASON_EPOCHS=3 SEASON_POOL=3000000 \\`);
  console.log(`  npx hardhat run scripts/deploy-mainnet.js --network sepolia`);

  return { tokenAddress, treasuryAmount };
}

main()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error(error);
    process.exit(1);
  });
