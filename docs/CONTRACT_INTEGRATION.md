# 合约集成指南

本文档介绍如何将前端与UniqueNumberGameFactory智能合约进行集成。

## 📋 概述

UniqueNumberGameFactory是一个基于Zama FHE技术的智能合约，支持创建和管理加密数字游戏。前端通过React hooks与合约进行交互。

## 🏗️ 架构图

```
Frontend (React + TypeScript)
    ↓
Web3 Layer (Wagmi + RainbowKit)
    ↓
Smart Contract (UniqueNumberGameFactory.sol)
    ↓
FHE Layer (Zama Protocol)
```

## 🔧 配置步骤

### 1. 合约配置

更新 `src/contracts/config.ts` 中的合约地址：

```typescript
export const CONTRACT_CONFIG = {
  // 替换为实际部署的合约地址
  address: '0x1234567890123456789012345678901234567890' as `0x${string}`,
  // ... 其他配置
};
```

### 2. 网络配置

在 `src/config/wagmi.ts` 中配置支持的网络：

```typescript
const zamaTestnet = defineChain({
  id: 8009, // 实际的链ID
  name: 'Zama FHE Testnet',
  rpcUrls: {
    default: {
      http: ['https://actual-rpc-url.com'], // 实际的RPC URL
    },
  },
  // ... 其他配置
});
```

### 3. WalletConnect项目ID

从 [WalletConnect](https://cloud.walletconnect.com) 获取项目ID并更新：

```typescript
export const config = getDefaultConfig({
  projectId: 'your-actual-project-id',
  // ... 其他配置
});
```

## 🎯 核心功能集成

### 游戏创建

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
    deadlineDuration: 300, // 5分钟
  });
};
```

### 游戏列表获取

```typescript
import { useGetActiveGames } from '@/hooks/contract';

const { activeGames, isLoading, refetch } = useGetActiveGames();

// activeGames包含所有状态为Open的游戏
```

### 加入游戏/提交数字

```typescript
import { useSubmitNumber } from '@/hooks/contract';

const { submitNumber, isSubmitting } = useSubmitNumber();

const handleSubmit = async (gameId: bigint, selectedNumber: number, entryFee: string) => {
  await submitNumber(gameId, selectedNumber, entryFee);
};
```

### 获取游戏状态

```typescript
import { useGetGameSummary } from '@/hooks/contract';

const { gameSummary, isLoading } = useGetGameSummary(gameId);

// gameSummary包含完整的游戏信息：状态、玩家数、奖池等
```

### 玩家统计

```typescript
import { useGetPlayerStats } from '@/hooks/contract';

const { playerStats } = useGetPlayerStats(playerAddress);

// playerStats包含：gamesPlayed, gamesWon, totalWinnings
```

### 排行榜

```typescript
import { useGetLeaderboard } from '@/hooks/contract';

const { leaderboard } = useGetLeaderboard(10); // 前10名

// leaderboard包含：topPlayers, winCounts, totalWinnings数组
```

## 🔒 FHE加密集成

### 当前状态

目前 `useSubmitNumber` hook使用模拟的加密数据：

```typescript
// TODO: 实现FHE加密逻辑
const mockEncryptedNumber = '0x0000000000000000000000000000000000000000000000000000000000000000';
const mockInputProof = '0x00';
```

### FHE集成计划

1. **安装Zama FHE客户端库**
   ```bash
   npm install @zama-fhe/fhevmjs
   ```

2. **初始化FHE实例**
   ```typescript
   import { createFhevmInstance } from '@zama-fhe/fhevmjs';
   
   const fhevmInstance = await createFhevmInstance({
     chainId: 8009, // Zama测试网链ID
     gatewayUrl: 'https://gateway.zama.ai',
   });
   ```

3. **加密用户输入**
   ```typescript
   const encryptNumber = async (number: number) => {
     const encrypted = await fhevmInstance.encrypt32(number);
     return {
       encryptedData: encrypted.data,
       inputProof: encrypted.inputProof,
     };
   };
   ```

4. **更新submitNumber函数**
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

## 📊 事件监听

### 游戏创建事件

```typescript
import { useWatchContractEvent } from 'wagmi';

useWatchContractEvent({
  address: CONTRACT_CONFIG.address,
  abi: contractABI.abi,
  eventName: 'GameCreated',
  onLogs(logs) {
    logs.forEach((log) => {
      console.log('New game created:', log.args);
      // 刷新游戏列表
      refetchActiveGames();
    });
  },
});
```

### 获胜者确定事件

```typescript
useWatchContractEvent({
  address: CONTRACT_CONFIG.address,
  abi: contractABI.abi,
  eventName: 'WinnerDetermined',
  onLogs(logs) {
    logs.forEach((log) => {
      console.log('Winner determined:', log.args);
      // 更新游戏状态和排行榜
    });
  },
});
```

## ⚠️ 注意事项

### 1. 错误处理

```typescript
const { createGame, error } = useCreateGame();

if (error) {
  console.error('Contract error:', error);
  // 向用户显示友好的错误信息
}
```

### 2. 交易确认

```typescript
const { isCreating, isSuccess, transactionHash } = useCreateGame();

// isCreating: 交易发送中或确认中
// isSuccess: 交易成功确认
// transactionHash: 交易哈希，可用于区块链浏览器查看
```

### 3. 数据刷新

合约状态变化后需要手动刷新相关数据：

```typescript
const { refetch: refetchGames } = useGetActiveGames();
const { refetch: refetchStats } = useGetPlayerStats(address);

// 在交易成功后刷新
useEffect(() => {
  if (isSuccess) {
    refetchGames();
    refetchStats();
  }
}, [isSuccess]);
```

## 🔗 相关文件

- `src/contracts/config.ts` - 合约配置和类型定义
- `src/contracts/UniqueNumberGameFactory.json` - 合约ABI
- `src/hooks/contract/useGameContract.ts` - 游戏相关hooks
- `src/hooks/contract/useStatsContract.ts` - 统计相关hooks
- `src/config/wagmi.ts` - Web3配置

## 📚 参考资源

- [Wagmi文档](https://wagmi.sh/)
- [RainbowKit文档](https://www.rainbowkit.com/)
- [Zama FHE文档](https://docs.zama.ai/fhevm)
- [Viem文档](https://viem.sh/)