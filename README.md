# Number Verse Arena 🎮

A privacy-preserving multiplayer number guessing game powered by **Zama's Fully Homomorphic Encryption (FHE)** technology. Players select numbers that remain encrypted on-chain until game completion, ensuring complete privacy and fairness in Web3 gaming.

![Number Verse Arena](public/uninum.png)

## 🎯 What is Number Verse Arena?

Number Verse Arena is the world's first **FHE-powered multiplayer game** where players compete by selecting unique numbers. Your choices remain completely private through encryption until the game reveals all selections simultaneously. Players who choose unique numbers win the prize pool!

### Key Features

- 🔐 **Privacy-First Gaming**: Numbers encrypted using Zama's FHE technology
- ⚡ **Real-time Multiplayer**: Support for 2-10 players per room
- 🏆 **Fair Competition**: Cryptographically verifiable results
- 💰 **Prize Pool System**: Entry fees distributed to unique number holders
- 🎨 **Modern UI**: Built with React 18 + shadcn/ui components
- 🔗 **Web3 Native**: Seamless wallet integration with RainbowKit

## 🔧 Technology Stack

### Frontend
- **Framework**: React 18 + TypeScript + Vite
- **UI Library**: shadcn/ui components + Tailwind CSS
- **Web3 Integration**: Wagmi v2 + RainbowKit
- **State Management**: React hooks with local component state
- **Routing**: React Router DOM v6

### Blockchain & Privacy
- **Smart Contracts**: Solidity with Zama FHEVM
- **Privacy Layer**: Zama Fully Homomorphic Encryption (FHE)
- **Network**: Sepolia Testnet (with Zama FHE support)
- **Contract Address**: `0xF0d12594D93950DfAe70011c4FAF04F1Cc9f9e06`

### Development Tools
- **Build Tool**: Vite 5.4+
- **Type Checking**: TypeScript 5.5+
- **Linting**: ESLint 9+ with React hooks plugin
- **Styling**: PostCSS + Autoprefixer

## 🚀 Getting Started

### Prerequisites

- Node.js 18+ and npm
- MetaMask or compatible Web3 wallet
- Sepolia testnet ETH for gas fees

### Installation

```bash
# Clone the repository
git clone https://github.com/huaigu/number-verse-arena.git
cd number-verse-arena

# Install dependencies
npm install

# Start development server
npm run dev
```

The application will be available at `http://localhost:8080`

### Environment Setup

1. **WalletConnect Project ID** (Optional for enhanced wallet support):
   ```typescript
   // src/config/wagmi.ts
   projectId: 'YOUR_WALLETCONNECT_PROJECT_ID'
   ```
   Get your Project ID from [WalletConnect Cloud](https://cloud.walletconnect.com)

## 🎮 How to Play

### 1. **Create or Join a Room**
- Set game parameters (player count, number range, entry fee, time limit)
- Or join existing rooms using Quick Join feature

### 2. **Select Your Number**
- Choose a number within the specified range
- Your selection is encrypted using FHE and stored on-chain
- No one can see your choice until game completion

### 3. **Wait for Game Completion**
- When all players submit or time expires, FHE reveals all choices
- Players who selected unique numbers split the prize pool
- Winners can claim rewards immediately

## 🔐 Zama FHE Integration

### Where FHE is Used

1. **Number Encryption** (`src/lib/fhe.ts`):
   ```typescript
   // Client-side encryption before blockchain submission
   const encryptedNumber = await encryptNumber(playerChoice, contractAddress);
   ```

2. **Smart Contract Operations** (`UniqueNumberGameFactory.sol`):
   - Encrypted number storage using `euint32` types
   - FHE-based winner calculation without revealing individual choices
   - Cryptographic proof verification for game integrity

3. **Privacy Guarantees**:
   - Player selections remain encrypted until game completion
   - Even contract owners cannot see individual choices
   - Winner determination happens through FHE computations

### FHE Implementation Status

- ✅ **Infrastructure**: FHE client libraries integrated
- ✅ **Smart Contracts**: FHEVM-compatible contract deployed
- ⚠️ **Production Ready**: Currently uses mock encryption for development
- 🔄 **Next Phase**: Full FHE encryption implementation

## 🌐 Live Demo

### Demo Application
- **Live Site**: *Coming Soon* - Deployment in progress
- **Demo Video**: [Watch How It Works](https://www.youtube.com/watch?v=5AlisRBd1tI)

### Smart Contract
- **Network**: Sepolia Testnet
- **Contract**: `0xF0d12594D93950DfAe70011c4FAF04F1Cc9f9e06`
- **Explorer**: [View on Etherscan](https://sepolia.etherscan.io/address/0xF0d12594D93950DfAe70011c4FAF04F1Cc9f9e06)

## 📁 Project Structure

```
src/
├── components/ui/          # shadcn/ui components + custom game components
├── pages/                  # Main application pages
│   ├── LandingPage.tsx    # Home page with demo video
│   ├── CreateRoom.tsx     # Game room creation
│   ├── JoinRoom.tsx       # Join existing rooms
│   └── GamePage.tsx       # Main game interface
├── hooks/contract/         # Smart contract integration hooks
├── config/wagmi.ts        # Web3 configuration
├── contracts/             # Contract ABI and configuration
├── lib/                   # Utilities and FHE integration
└── main.tsx              # Application entry point
```

## 🛠️ Development Commands

```bash
# Development
npm run dev              # Start development server with hot reload
npm run preview          # Preview production build locally

# Build
npm run build           # Production build
npm run build:dev       # Development build with debug info

# Code Quality
npm run lint            # Run ESLint for code linting
```

## 🧪 Testing

### Smart Contract Testing
```bash
# Navigate to contract repository
cd ../zama-unique-number-game-contract

# Run contract tests
npm test
npx hardhat test
```

### Frontend Testing
- **Manual Testing**: Use development server with mock data
- **Contract Integration**: Test with deployed Sepolia contract
- **Wallet Integration**: Test with MetaMask on Sepolia testnet

## 📚 Documentation

- **API Reference**: [docs/API_REFERENCE.md](docs/API_REFERENCE.md) - Smart contract methods and events
- **Game Flow**: [docs/GAME_FLOW.md](docs/GAME_FLOW.md) - Complete game mechanics and user flow
- **Contract Integration**: [docs/CONTRACT_INTEGRATION.md](docs/CONTRACT_INTEGRATION.md) - Frontend-contract integration guide  
- **Deployment Guide**: [docs/DEPLOYMENT_GUIDE.md](docs/DEPLOYMENT_GUIDE.md) - Full deployment instructions
- **Testing Plan**: [docs/TESTING_PLAN.md](docs/TESTING_PLAN.md) - Comprehensive testing strategy and test cases
- **Development Tasks**: [docs/TODO.md](docs/TODO.md) - Project roadmap and task tracking

## 🤝 Contributing

1. Fork the repository
2. Create a feature branch (`git checkout -b feature/amazing-feature`)
3. Commit your changes (`git commit -m 'Add some amazing feature'`)
4. Push to the branch (`git push origin feature/amazing-feature`)
5. Open a Pull Request

## 📄 License

This project is licensed under the MIT License - see the LICENSE file for details.

## 🔗 Links & Resources

- **Developer**: [@coder_chao](https://x.com/coder_chao)
- **GitHub**: [huaigu/number-verse-arena](https://github.com/huaigu/number-verse-arena)
- **Zama Documentation**: [docs.zama.ai](https://docs.zama.ai/)
- **Demo Video**: [YouTube](https://www.youtube.com/watch?v=5AlisRBd1tI)

## ⚠️ Important Notes

- **Testnet Only**: Currently deployed on Sepolia testnet for testing
- **Gas Costs**: FHE operations require higher gas fees than standard transactions
- **Privacy**: While using FHE infrastructure, full encryption is still in development
- **Educational Purpose**: This is a demonstration of FHE technology in gaming

---

*Built with ❤️ for the future of privacy-preserving Web3 gaming*