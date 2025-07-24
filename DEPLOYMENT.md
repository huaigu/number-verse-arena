# Contract Deployment Configuration

## 📋 Deployment Summary

**Contract**: UniqueNumberGameFactory  
**Network**: Sepolia Testnet  
**Address**: `0xF0d12594D93950DfAe70011c4FAF04F1Cc9f9e06`  
**Explorer**: https://sepolia.etherscan.io/address/0xF0d12594D93950DfAe70011c4FAF04F1Cc9f9e06  
**Deployment Date**: 2025-01-24  
**Gas Used**: 4,296,037  
**Deployment Cost**: 0.12888111 ETH  

## ✅ Frontend Configuration Status

### Contract Address
- ✅ **Updated**: `src/contracts/config.ts` - Contract address configured
- ✅ **Updated**: RPC endpoint updated to `https://eth-sepolia.public.blastapi.io`

### Network Configuration
- ✅ **Configured**: Sepolia Testnet (chainId: 11155111)
- ⚠️ **Pending**: Zama FHE Testnet configuration (placeholder values)

### Contract Integration
- ✅ **Ready**: Contract ABI loaded (`src/contracts/UniqueNumberGameFactory.json`)
- ✅ **Ready**: React hooks configured (`src/hooks/contract/useGameContract.ts`)
- ✅ **Ready**: All contract functions mapped to frontend hooks

## 🔧 Next Steps Required

### 1. WalletConnect Configuration
```typescript
// src/config/wagmi.ts
projectId: 'YOUR_PROJECT_ID', // ❌ Replace with actual WalletConnect Project ID
```
**Action**: Get Project ID from https://cloud.walletconnect.com

### 2. FHE Encryption Implementation
```typescript
// src/hooks/contract/useGameContract.ts (Line 148-151)
// TODO: 实现FHE加密逻辑
// 现在使用模拟的加密数据
const mockEncryptedNumber = '0x0000000000000000000000000000000000000000000000000000000000000000';
const mockInputProof = '0x00';
```
**Action**: Implement actual FHE encryption for number submission

### 3. Smart Contract Verification (Optional)
```bash
npx hardhat verify --network sepolia 0xF0d12594D93950DfAe70011c4FAF04F1Cc9f9e06
```

## 🎮 Available Contract Functions

The frontend is configured to interact with all contract functions:

### Game Management
- `createGame()` - Create new game room
- `getAllGames()` - Get all games
- `getActiveGames()` - Get open games only
- `getGameSummary(gameId)` - Get game details

### Player Actions
- `submitNumber(gameId, encryptedNumber, proof)` - Submit encrypted number (requires FHE)
- `hasPlayerSubmitted(gameId, player)` - Check if player already submitted
- `findWinnerByDeadline(gameId)` - Trigger game completion
- `claimPrize(gameId)` - Claim winnings

### Statistics
- `getPlayerStats(player)` - Get player statistics
- `getWinnerHistory(limit)` - Get winner history
- `getLeaderboard(limit)` - Get top players

## 🚀 Testing the Integration

### Local Development
```bash
cd /home/bojack/zama/number-verse-arena
npm run dev
```

### Wallet Setup
1. Install MetaMask or compatible wallet
2. Add Sepolia Testnet
3. Get test ETH from Sepolia faucet
4. Connect wallet to application

### Basic Testing Flow
1. Connect wallet (requires WalletConnect Project ID)
2. Create a test game room
3. Verify game appears in active games list
4. Join game and submit number (currently uses mock encryption)
5. Test game completion and prize claiming

## 🔍 Contract Verification

Contract has been deployed successfully and basic functions tested:
- ✅ `gameCounter` returns 0 (initial state)
- ✅ `getTotalGamesCount()` returns 0 (initial state)
- ✅ Contract accepts transactions
- ✅ FHEVM infrastructure contracts detected on Sepolia

## 📚 Documentation References

- **Smart Contract**: `/home/bojack/zama/zama-unique-number-game-contract/contracts/UniqueNumberGameFactory.sol`
- **Frontend Config**: `/home/bojack/zama/number-verse-arena/src/contracts/config.ts`
- **Contract Hooks**: `/home/bojack/zama/number-verse-arena/src/hooks/contract/useGameContract.ts`
- **Deployment Scripts**: `/home/bojack/zama/zama-unique-number-game-contract/scripts/deploy-sepolia-simple.ts`

## ⚠️ Important Notes

1. **FHE Implementation**: The current frontend uses mock encryption data. Real FHE encryption must be implemented for production use.

2. **Network Requirements**: While the contract is deployed on Sepolia, it uses Zama's FHEVM infrastructure which requires specific client-side encryption libraries.

3. **Gas Costs**: FHEVM operations consume significantly more gas than regular transactions. Ensure sufficient ETH balance for testing.

4. **Privacy**: Numbers remain encrypted on-chain until game completion, providing true privacy-preserving gameplay.