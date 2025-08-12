import { ethers } from "hardhat";
import { UniqueNumberGameFactory__factory } from "../types";

async function main() {
  console.log("Starting UniqueNumberGameFactory deployment to Sepolia...");
  
  // Get the deployer signer
  const [deployer] = await ethers.getSigners();
  console.log("Deploying with account:", deployer.address);
  
  // Check balance
  const balance = await ethers.provider.getBalance(deployer.address);
  console.log("Account balance:", ethers.formatEther(balance), "ETH");
  
  if (balance < ethers.parseEther("0.01")) {
    throw new Error("Insufficient balance. Need at least 0.01 ETH for deployment.");
  }
  
  // Deploy the contract
  console.log("\nDeploying UniqueNumberGameFactory contract...");
  const GameFactory = (await ethers.getContractFactory("UniqueNumberGameFactory")) as UniqueNumberGameFactory__factory;
  
  // Use fixed high gas limit for FHE contracts
  const gasLimit = BigInt(5000000); // 5M gas should be enough
  console.log("Using gas limit:", gasLimit.toString());
  
  // Deploy with fixed gas limit
  const gameFactory = await GameFactory.deploy({
    gasLimit: gasLimit,
  });
  
  console.log("Transaction hash:", gameFactory.deploymentTransaction()?.hash);
  console.log("Waiting for deployment confirmation...");
  
  // Wait for deployment
  await gameFactory.waitForDeployment();
  const contractAddress = await gameFactory.getAddress();
  
  console.log("\n✅ Deployment successful!");
  console.log("Contract address:", contractAddress);
  
  // Get deployment transaction receipt
  const deployTx = gameFactory.deploymentTransaction();
  if (deployTx) {
    const receipt = await deployTx.wait();
    console.log("Gas used:", receipt?.gasUsed.toString());
    console.log("Gas price:", ethers.formatUnits(receipt?.gasPrice || 0, "gwei"), "gwei");
    console.log("Transaction cost:", ethers.formatEther((receipt?.gasUsed || BigInt(0)) * (receipt?.gasPrice || BigInt(0))), "ETH");
  }
  
  // Verify contract interaction
  console.log("\n🔍 Verifying contract deployment...");
  try {
    const gameCounter = await gameFactory.gameCounter();
    console.log("Initial game counter:", gameCounter.toString());
    
    const totalGames = await gameFactory.getTotalGamesCount();
    console.log("Total games count:", totalGames.toString());
    
    console.log("✅ Contract is working correctly!");
  } catch (error) {
    console.error("❌ Contract verification failed:", error);
  }
  
  // Display important information
  console.log("\n=== DEPLOYMENT SUMMARY ===");
  console.log("Network: Sepolia Testnet");
  console.log("Contract: UniqueNumberGameFactory");
  console.log("Address:", contractAddress);
  console.log("Deployer:", deployer.address);
  console.log("Explorer:", `https://sepolia.etherscan.io/address/${contractAddress}`);
  
  console.log("\n📋 NEXT STEPS:");
  console.log("1. Update frontend contract address in src/contracts/config.ts");
  console.log("2. Verify contract on Etherscan (optional):");
  console.log(`   npx hardhat verify --network sepolia ${contractAddress}`);
  console.log("3. Test basic functionality:");
  console.log(`   npx hardhat --network sepolia task:create-game --address ${contractAddress}`);
  
  console.log("\n⚠️  IMPORTANT: Save the contract address for future use!");
  
  return {
    contractAddress,
    deployer: deployer.address,
    network: "sepolia"
  };
}

// Execute deployment
main()
  .then((result) => {
    console.log("\n🎉 Deployment completed successfully!");
    console.log("Result:", result);
    process.exit(0);
  })
  .catch((error) => {
    console.error("\n❌ Deployment failed:");
    console.error(error);
    process.exit(1);
  });