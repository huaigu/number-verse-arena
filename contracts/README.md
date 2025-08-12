# Zama FHEVM Unique Number Game Contract

A complete implementation of a unique number game using Zama's Fully Homomorphic Encryption (FHE) technology on Ethereum.

## 🎮 Game Overview

The UniqueNumberGameFactory allows players to submit encrypted numbers, and the contract determines the winner by finding the smallest unique number - all while keeping the submitted numbers private until the game ends.

### Key Features

- **Complete Privacy**: Numbers remain encrypted throughout the game
- **Fair Play**: No one can see submitted numbers until decryption
- **Automatic Winner Detection**: Smart contract finds the smallest unique number
- **Flexible Game Rules**: Customizable number ranges, player limits, and entry fees
- **Prize Distribution**: Winners can claim the accumulated prize pool

## 🚀 Quick Start

### Local Testing

```bash
# Install dependencies
npm install

# Run tests with mock FHE encryption
npm test

# Run specific game contract tests
npx hardhat test test/UniqueNumberGameFactory.ts
```

### Deploy to Sepolia

```bash
# Set up environment variables
npx hardhat vars setup

# Deploy to Sepolia testnet
npx hardhat deploy --network sepolia --tags UniqueNumberGameFactory

# Create a new game
npx hardhat game:create --min 1 --max 10 --players 3 --fee "0.01" --duration 3600 --network sepolia
```

For detailed deployment instructions, see [DEPLOYMENT.md](./DEPLOYMENT.md).

## 📁 Project Structure

```
contracts/
├── FHECounter.sol              # Example FHE counter contract
└── UniqueNumberGameFactory.sol # Main game contract

test/
├── FHECounter.ts              # Basic FHE tests
└── UniqueNumberGameFactory.ts # Comprehensive game tests (16 test cases)

deploy/
├── deploy.ts                  # FHECounter deployment
└── deploy-game.ts            # UniqueNumberGameFactory deployment

tasks/
├── FHECounter.ts             # FHECounter interaction tasks
└── UniqueNumberGameFactory.ts # Game interaction tasks
```

## 🎯 Available Commands

### Game Management
```bash
# Get deployed contract address
npx hardhat game:address --network sepolia

# Create a new game
npx hardhat game:create --min 1 --max 20 --players 5 --fee "0.005" --duration 7200 --network sepolia

# View game information
npx hardhat game:info --id 0 --network sepolia

# List recent games
npx hardhat game:list --count 5 --network sepolia

# Manually trigger winner calculation (after deadline)
npx hardhat game:calculate --id 0 --network sepolia

# Claim prize (for winners)
npx hardhat game:claim --id 0 --network sepolia
```

## 🧪 Testing

The project includes comprehensive tests covering all game mechanics:

- ✅ Game creation and parameter validation
- ✅ Encrypted number submission with FHE permissions
- ✅ Winner calculation logic
- ✅ Prize distribution
- ✅ Event emission
- ✅ State management

Run tests:
```bash
npm test                                          # All tests
npx hardhat test test/UniqueNumberGameFactory.ts  # Game tests only
```

## 📖 Documentation

- **[DEPLOYMENT.md](./DEPLOYMENT.md)** - Complete Sepolia deployment guide
- **[CLAUDE.md](./CLAUDE.md)** - Technical analysis and development notes
- **[test-usage-example.md](./test-usage-example.md)** - Testing guide and examples

### External Resources

- [The FHEVM documentation](https://docs.zama.ai/fhevm)
- [FHEVM Hardhat Plugin](https://docs.zama.ai/protocol/solidity-guides/development-guide/hardhat)
- [Zama FHE Solidity Library](https://docs.zama.ai/protocol/solidity-guides)
