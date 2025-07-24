export const CONTRACT_CONFIG = {
  // 已部署的 UniqueNumberGameFactory 合约地址 - Sepolia Testnet
  address: '0xF0d12594D93950DfAe70011c4FAF04F1Cc9f9e06' as `0x${string}`,
  
  // 游戏状态枚举
  GameStatus: {
    Open: 0,
    Calculating: 1, 
    Finished: 2,
    PrizeClaimed: 3
  } as const,
  
  // 网络配置
  networks: {
    sepolia: {
      chainId: 11155111,
      name: 'Sepolia Testnet',
      rpcUrl: 'https://eth-sepolia.public.blastapi.io'
    }
  }
} as const;

// TypeScript类型定义
export interface Game {
  gameId: bigint;
  creator: string;
  status: number;
  roomName: string;
  minNumber: number;
  maxNumber: number;
  maxPlayers: number;
  entryFee: bigint;
  deadline: bigint;
  playerCount: number;
  encryptedWinner: string;
  decryptedWinner: number;
}

export interface GameSummary {
  gameId: bigint;
  roomName: string;
  creator: string;
  status: number;
  playerCount: number;
  maxPlayers: number;
  minNumber: number;
  maxNumber: number;
  entryFee: bigint;
  deadline: bigint;
  prizePool: bigint;
  winner: string;
  winningNumber: number;
}

export interface PlayerStats {
  gamesPlayed: bigint;
  gamesWon: bigint;
  totalWinnings: bigint;
}

export interface WinnerRecord {
  gameId: bigint;
  roomName: string;
  winner: string;
  winningNumber: number;
  prize: bigint;
  timestamp: bigint;
}

export interface CreateGameParams {
  roomName: string;
  minNumber: number;
  maxNumber: number;
  maxPlayers: number;
  entryFee: string; // ETH amount as string
  deadlineDuration: number; // in seconds
}

// 辅助函数
export const getGameStatusText = (status: number): string => {
  switch (status) {
    case CONTRACT_CONFIG.GameStatus.Open:
      return 'Open';
    case CONTRACT_CONFIG.GameStatus.Calculating:
      return 'Calculating';
    case CONTRACT_CONFIG.GameStatus.Finished:
      return 'Finished';
    case CONTRACT_CONFIG.GameStatus.PrizeClaimed:
      return 'Prize Claimed';
    default:
      return 'Unknown';
  }
};

export const formatAddress = (address: string): string => {
  if (!address) return '';
  return `${address.slice(0, 6)}...${address.slice(-4)}`;
};

export const formatETH = (wei: bigint): string => {
  const eth = Number(wei) / 1e18;
  return eth.toFixed(4);
};