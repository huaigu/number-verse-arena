import "@fhevm/hardhat-plugin";
import "@nomicfoundation/hardhat-chai-matchers";
import "@nomicfoundation/hardhat-ethers";
import "@nomicfoundation/hardhat-verify";
import "@typechain/hardhat";
import "hardhat-deploy";
import "hardhat-gas-reporter";
import type { HardhatUserConfig } from "hardhat/config";
import { vars } from "hardhat/config";
import "solidity-coverage";
import { HttpNetworkConfig } from "hardhat/types";

import "./tasks/accounts";
import "./tasks/FHECounter";
import "./tasks/TestAsyncDecrypt";
import "./tasks/UniqueNumberGameFactory";

// Run 'npx hardhat vars setup' to see the list of variables that need to be set

const MNEMONIC: string = vars.get("MNEMONIC", "test test test test test test test test test test test junk");
const PRIVATE_KEY: string = vars.get("PRIVATE_KEY", "");
const INFURA_API_KEY: string = vars.get("INFURA_API_KEY", "zzzzzzzzzzzzzzzzzzzzzzzzzzzzzzzz");

// Helper function to get accounts configuration
function getAccounts() {
  if (PRIVATE_KEY && PRIVATE_KEY.length > 0) {
    return [PRIVATE_KEY];
  }
  return {
    mnemonic: MNEMONIC,
    path: "m/44'/60'/0'/0/",
    count: 10,
  };
}

const config: HardhatUserConfig = {
  defaultNetwork: "hardhat",
  namedAccounts: {
    deployer: 0,
  },
  etherscan: {
    apiKey: {
      sepolia: vars.get("ETHERSCAN_API_KEY", "") || "3VMNGPDVSEBDFYV4WRDUYBRTPFZ73GUKEH",
    },
  },
  gasReporter: {
    currency: "USD",
    enabled: process.env.REPORT_GAS ? true : false,
    excludeContracts: [],
  },
  networks: {
    hardhat: {
      accounts: {
        mnemonic: MNEMONIC,
      },
      chainId: 31337,
    },
    anvil: {
      accounts: getAccounts(),
      chainId: 31337,
      url: "http://localhost:8545",
    },
    sepolia: {
      accounts: getAccounts(),
      chainId: 11155111,
      url: "https://eth-sepolia.public.blastapi.io",
      timeout: 60000,
    },
  },
  paths: {
    artifacts: "./artifacts",
    cache: "./cache",
    sources: "./contracts",
    tests: "./test",
  },
  solidity: {
    version: "0.8.24",

    settings: {
      metadata: {
        // Not including the metadata hash
        // https://github.com/paulrberg/hardhat-template/issues/31
        bytecodeHash: "none",
      },
      // Disable the optimizer when debugging
      // https://hardhat.org/hardhat-network/#solidity-optimizer-support
      optimizer: {
        enabled: true,
        runs: 800,
      },
      evmVersion: "cancun",
    },
  },
  typechain: {
    outDir: "types",
    target: "ethers-v6",
  },
};

export default config;
