import { DeployFunction } from "hardhat-deploy/types";
import { HardhatRuntimeEnvironment } from "hardhat/types";

const func: DeployFunction = async function (hre: HardhatRuntimeEnvironment) {
  const { deployer } = await hre.getNamedAccounts();
  const { deploy } = hre.deployments;

  console.log("Deploying UniqueNumberGameFactory to", hre.network.name);
  console.log("Deployer address:", deployer);

  // Deploy UniqueNumberGameFactory contract
  const deployedGameFactory = await deploy("UniqueNumberGameFactory", {
    from: deployer,
    log: true,
    waitConfirmations: hre.network.name === "sepolia" ? 5 : 1, // Wait for confirmations on Sepolia
  });

  console.log(`UniqueNumberGameFactory contract deployed at: ${deployedGameFactory.address}`);

  // Verify contract on Etherscan if on Sepolia
  if (hre.network.name === "sepolia") {
    console.log("Waiting for block confirmations before verification...");
    
    try {
      await hre.run("verify:verify", {
        address: deployedGameFactory.address,
        constructorArguments: [],
      });
      console.log("Contract verified on Etherscan!");
    } catch (error) {
      console.log("Verification failed:", error);
    }

    // Check FHEVM compatibility
    console.log("Checking FHEVM compatibility...");
    try {
      await hre.run("fhevm:check-fhevm-compatibility", {
        network: "sepolia",
        address: deployedGameFactory.address,
      });
      console.log("FHEVM compatibility check completed!");
    } catch (error) {
      console.log("FHEVM compatibility check failed:", error);
    }
  }

  // Log deployment summary
  console.log("\n=== Deployment Summary ===");
  console.log(`Network: ${hre.network.name}`);
  console.log(`Contract: UniqueNumberGameFactory`);
  console.log(`Address: ${deployedGameFactory.address}`);
  console.log(`Deployer: ${deployer}`);
  console.log(`Gas Used: ${deployedGameFactory.receipt?.gasUsed || "N/A"}`);
  
  if (hre.network.name === "sepolia") {
    console.log(`\n🔗 View on Etherscan: https://sepolia.etherscan.io/address/${deployedGameFactory.address}`);
    console.log(`\n⚠️  Save this address for future interactions!`);
  }

  return deployedGameFactory;
};

export default func;
func.id = "deploy_unique_number_game_factory";
func.tags = ["UniqueNumberGameFactory", "Game"];
func.dependencies = []; // No dependencies required