import { task } from "hardhat/config";
import { HardhatRuntimeEnvironment } from "hardhat/types";

// List accounts with their balances
task("accounts", "Prints the list of accounts with balances")
  .setAction(async (_, hre: HardhatRuntimeEnvironment) => {
    const { ethers } = hre;
    const accounts = await ethers.getSigners();

    console.log(`\n=== Accounts on ${hre.network.name} ===`);
    for (const account of accounts) {
      const balance = await ethers.provider.getBalance(account.address);
      console.log(`${account.address}: ${ethers.formatEther(balance)} ETH`);
    }
  });

// Check balance of specific address
task("balance", "Prints an account's balance")
  .addParam("account", "The account's address")
  .setAction(async (taskArgs, hre: HardhatRuntimeEnvironment) => {
    const { ethers } = hre;
    const balance = await ethers.provider.getBalance(taskArgs.account);
    console.log(`Balance for ${taskArgs.account}: ${ethers.formatEther(balance)} ETH`);
  });