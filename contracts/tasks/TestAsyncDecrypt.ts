import { task } from "hardhat/config";
import { HardhatRuntimeEnvironment } from "hardhat/types";

task("testasync:requestBool", "Call requestBool function on TestAsyncDecrypt contract")
  .addOptionalParam("address", "Contract address (if not provided, uses deployed address)")
  .setAction(async (taskArgs, hre: HardhatRuntimeEnvironment) => {
    const { ethers, deployments } = hre;
    const { deployer } = await hre.getNamedAccounts();
    
    // Get contract address
    let contractAddress: string;
    if (taskArgs.address) {
      contractAddress = taskArgs.address;
      console.log(`Using provided contract address: ${contractAddress}`);
    } else {
      const deployment = await deployments.get("TestAsyncDecrypt");
      contractAddress = deployment.address;
      console.log(`Using deployed contract address: ${contractAddress}`);
    }
    
    // Get contract instance
    const contract = await ethers.getContractAt("TestAsyncDecrypt", contractAddress);
    const signer = await ethers.getSigner(deployer);
    const contractWithSigner = contract.connect(signer);
    
    try {
      console.log("Calling requestBool()...");
      const tx = await contractWithSigner.requestBool();
      console.log(`Transaction hash: ${tx.hash}`);
      
      const receipt = await tx.wait();
      console.log(`Transaction confirmed in block: ${receipt?.blockNumber}`);
      console.log("✅ requestBool() called successfully");
    } catch (error) {
      console.error("❌ Error calling requestBool():", error);
    }
  });

task("testasync:status", "Read yBool and isDecryptionPending states from TestAsyncDecrypt contract")
  .addOptionalParam("address", "Contract address (if not provided, uses deployed address)")
  .setAction(async (taskArgs, hre: HardhatRuntimeEnvironment) => {
    const { ethers, deployments } = hre;
    
    // Get contract address
    let contractAddress: string;
    if (taskArgs.address) {
      contractAddress = taskArgs.address;
      console.log(`Using provided contract address: ${contractAddress}`);
    } else {
      const deployment = await deployments.get("TestAsyncDecrypt");
      contractAddress = deployment.address;
      console.log(`Using deployed contract address: ${contractAddress}`);
    }
    
    // Get contract instance
    const contract = await ethers.getContractAt("TestAsyncDecrypt", contractAddress);
    
    try {
      console.log("Reading contract state...");
      
      // Read public variables
      const yBool = await contract.yBool();
      const isDecryptionPending = await contract.isDecryptionPending();
      const latestRequestId = await contract.latestRequestId();
      
      console.log(`yBool: ${yBool}`);
      console.log(`isDecryptionPending: ${isDecryptionPending}`);
      console.log(`latestRequestId: ${latestRequestId}`);
      
      console.log("✅ Contract state read successfully");
    } catch (error) {
      console.error("❌ Error reading contract state:", error);
    }
  });