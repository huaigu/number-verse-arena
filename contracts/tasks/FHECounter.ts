import { task } from "hardhat/config";
import { HardhatRuntimeEnvironment } from "hardhat/types";

// Note: FHECounter tasks are for the original template contract
// Since we're focusing on UniqueNumberGameFactory, these are minimal stubs

task("fhecounter:deploy", "Deploy FHECounter contract")
  .setAction(async (_, hre: HardhatRuntimeEnvironment) => {
    console.log("⚠️  FHECounter deployment not implemented.");
    console.log("This project focuses on UniqueNumberGameFactory.");
    console.log("Use 'npm run deploy:sepolia' to deploy the game factory.");
  });

task("fhecounter:address", "Get FHECounter address")
  .setAction(async (_, hre: HardhatRuntimeEnvironment) => {
    console.log("⚠️  FHECounter not deployed in this project.");
    console.log("Use 'npx hardhat game:address' for UniqueNumberGameFactory.");
  });

task("fhecounter:increment", "Increment FHECounter")
  .setAction(async (_, hre: HardhatRuntimeEnvironment) => {
    console.log("⚠️  FHECounter not available in this project.");
    console.log("Use 'npx hardhat game:create' to create a new game.");
  });

task("fhecounter:decrypt", "Decrypt FHECounter value")
  .setAction(async (_, hre: HardhatRuntimeEnvironment) => {
    console.log("⚠️  FHECounter not available in this project.");
    console.log("Use 'npx hardhat game:info --id <gameId>' to view game details.");
  });