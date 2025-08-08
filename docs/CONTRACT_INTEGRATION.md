# Contract Integration Guide

This document describes how to integrate the frontend with the UniqueNumberGameFactory smart contract.

## 📋 Overview

UniqueNumberGameFactory is a smart contract based on Zama FHE technology that supports creating and managing encrypted number games. The frontend interacts with the contract through React hooks.

## 🏗️ Architecture Diagram

```
Frontend (React + TypeScript)
    ↓
Web3 Layer (Wagmi + RainbowKit)
    ↓
Smart Contract (UniqueNumberGameFactory.sol)
    ↓
FHE Layer (Zama Protocol)
```

## 🔧 Configuration Steps

### 1. Contract Configuration

Update the contract address in `src/contracts/config.ts`:

```typescript
export const CONTRACT_CONFIG = {
  // Replace with the actual deployed contract address
  address: '0x1234567890123456789012345678901234567890' as `0x${string}`,
  // ... other configurations
};
```

### 2. Network Configuration

Configure supported networks in `src/config/wagmi.ts`:

```typescript
const zamaTestnet = defineChain({
  id: 8009, // Actual chain ID
  name: 'Zama FHE Testnet',
  rpcUrls: {
    default: {
      http: ['https://actual-rpc-url.com'], // Actual RPC URL
    },
  },
  // ... other configurations
});
```

### 3. WalletConnect Project ID

Get a project ID from [WalletConnect](https://cloud.walletconnect.com) and update:

```typescript
export const config = getDefaultConfig({
  projectId: 'your-actual-project-id',
  // ... other configurations
});
```

## 🎯 Core Feature Integration

### Game Creation

```typescript
import { useCreateGame } from '@/hooks/contract';

const { createGame, isCreating, isSuccess } = useCreateGame();

const handleCreate = async () => {
  await createGame({
    roomName: 'My Game Room',
    minNumber: 1,
    maxNumber: 16,
    maxPlayers: 6,
    entryFee: '0.1', // ETH
    deadlineDuration: 300, // 5 minutes
  });
};
```

### Fetching Game List

```typescript
import { useGetActiveGames } from '@/hooks/contract';

const { activeGames, isLoading, refetch } = useGetActiveGames();

// activeGames contains all games with Open status
```

### Joining Game/Submitting Numbers

```typescript
import { useSubmitNumber } from '@/hooks/contract';

const { submitNumber, isSubmitting } = useSubmitNumber();

const handleSubmit = async (gameId: bigint, selectedNumber: number, entryFee: string) => {
  await submitNumber(gameId, selectedNumber, entryFee);
};
```

### Getting Game Status

```typescript
import { useGetGameSummary } from '@/hooks/contract';

const { gameSummary, isLoading } = useGetGameSummary(gameId);

// gameSummary contains complete game information: status, player count, prize pool, etc.
```

### Player Statistics

```typescript
import { useGetPlayerStats } from '@/hooks/contract';

const { playerStats } = useGetPlayerStats(playerAddress);

// playerStats contains: gamesPlayed, gamesWon, totalWinnings
```

### Leaderboard

```typescript
import { useGetLeaderboard } from '@/hooks/contract';

const { leaderboard } = useGetLeaderboard(10); // Top 10

// leaderboard contains: topPlayers, winCounts, totalWinnings arrays
```

## 🔒 FHE Encryption Integration

### Current Status

Currently the `useSubmitNumber` hook uses mock encrypted data:

```typescript
// TODO: Implement FHE encryption logic
const mockEncryptedNumber = '0x0000000000000000000000000000000000000000000000000000000000000000';
const mockInputProof = '0x00';
```

### FHE Integration Plan

1. **Install Zama FHE Client Library**
   ```bash
   npm install @zama-fhe/fhevmjs
   ```

2. **Initialize FHE Instance**
   ```typescript
   import { createFhevmInstance } from '@zama-fhe/fhevmjs';
   
   const fhevmInstance = await createFhevmInstance({
     chainId: 8009, // Zama testnet chain ID
     gatewayUrl: 'https://gateway.zama.ai',
   });
   ```

3. **Encrypt User Input**
   ```typescript
   const encryptNumber = async (number: number) => {
     const encrypted = await fhevmInstance.encrypt32(number);
     return {
       encryptedData: encrypted.data,
       inputProof: encrypted.inputProof,
     };
   };
   ```

4. **Update submitNumber Function**
   ```typescript
   const submitNumber = async (gameId: bigint, number: number, entryFeeETH: string) => {
     const { encryptedData, inputProof } = await encryptNumber(number);
     
     writeContract({
       address: CONTRACT_CONFIG.address,
       abi: contractABI.abi,
       functionName: 'submitNumber',
       args: [gameId, encryptedData, inputProof],
       value: parseEther(entryFeeETH),
     });
   };
   ```

## 📊 Event Listening

### Game Creation Events

```typescript
import { useWatchContractEvent } from 'wagmi';

useWatchContractEvent({
  address: CONTRACT_CONFIG.address,
  abi: contractABI.abi,
  eventName: 'GameCreated',
  onLogs(logs) {
    logs.forEach((log) => {
      console.log('New game created:', log.args);
      // Refresh game list
      refetchActiveGames();
    });
  },
});
```

### Winner Determined Events

```typescript
useWatchContractEvent({
  address: CONTRACT_CONFIG.address,
  abi: contractABI.abi,
  eventName: 'WinnerDetermined',
  onLogs(logs) {
    logs.forEach((log) => {
      console.log('Winner determined:', log.args);
      // Update game status and leaderboard
    });
  },
});
```

## ⚠️ Important Notes

### 1. Error Handling

```typescript
const { createGame, error } = useCreateGame();

if (error) {
  console.error('Contract error:', error);
  // Display user-friendly error message
}
```

### 2. Transaction Confirmation

```typescript
const { isCreating, isSuccess, transactionHash } = useCreateGame();

// isCreating: Transaction being sent or confirmed
// isSuccess: Transaction successfully confirmed
// transactionHash: Transaction hash for blockchain explorer viewing
```

### 3. Data Refresh

Manual data refresh is needed after contract state changes:

```typescript
const { refetch: refetchGames } = useGetActiveGames();
const { refetch: refetchStats } = useGetPlayerStats(address);

// Refresh after successful transaction
useEffect(() => {
  if (isSuccess) {
    refetchGames();
    refetchStats();
  }
}, [isSuccess]);
```

## 🔗 Related Files

- `src/contracts/config.ts` - Contract configuration and type definitions
- `src/contracts/UniqueNumberGameFactory.json` - Contract ABI
- `src/hooks/contract/useGameContract.ts` - Game-related hooks
- `src/hooks/contract/useStatsContract.ts` - Statistics-related hooks
- `src/config/wagmi.ts` - Web3 configuration

## 📚 Reference Resources

- [Wagmi Documentation](https://wagmi.sh/)
- [RainbowKit Documentation](https://www.rainbowkit.com/)
- [Zama FHE Documentation](https://docs.zama.ai/fhevm)
- [Viem Documentation](https://viem.sh/)