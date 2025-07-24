import { useReadContract } from 'wagmi';
import { CONTRACT_CONFIG, PlayerStats, WinnerRecord } from '@/contracts/config';
import contractABI from '@/contracts/UniqueNumberGameFactory.json';

// 获取玩家统计
export const useGetPlayerStats = (playerAddress: string | undefined) => {
  const { data, isError, isLoading, refetch } = useReadContract({
    address: CONTRACT_CONFIG.address,
    abi: contractABI.abi,
    functionName: 'getPlayerStats',
    args: playerAddress ? [playerAddress] : undefined,
    query: {
      enabled: !!playerAddress,
    },
  });

  return {
    playerStats: data as PlayerStats | undefined,
    isError,
    isLoading,
    refetch,
  };
};

// 获取玩家参与的游戏
export const useGetPlayerGames = (playerAddress: string | undefined) => {
  const { data, isError, isLoading, refetch } = useReadContract({
    address: CONTRACT_CONFIG.address,
    abi: contractABI.abi,
    functionName: 'getPlayerGames',
    args: playerAddress ? [playerAddress] : undefined,
    query: {
      enabled: !!playerAddress,
    },
  });

  return {
    playerGames: data as bigint[] | undefined,
    isError,
    isLoading,
    refetch,
  };
};

// 获取获胜历史
export const useGetWinnerHistory = (limit: number = 10) => {
  const { data, isError, isLoading, refetch } = useReadContract({
    address: CONTRACT_CONFIG.address,
    abi: contractABI.abi,
    functionName: 'getWinnerHistory',
    args: [BigInt(limit)],
  });

  return {
    winnerHistory: data as WinnerRecord[] | undefined,
    isError,
    isLoading,
    refetch,
  };
};

// 获取获胜历史总数
export const useGetWinnerHistoryCount = () => {
  const { data, isError, isLoading, refetch } = useReadContract({
    address: CONTRACT_CONFIG.address,
    abi: contractABI.abi,
    functionName: 'getWinnerHistoryCount',
  });

  return {
    winnerHistoryCount: data as bigint | undefined,
    isError,
    isLoading,
    refetch,
  };
};

// 获取排行榜
export const useGetLeaderboard = (limit: number = 10) => {
  const { data, isError, isLoading, refetch } = useReadContract({
    address: CONTRACT_CONFIG.address,
    abi: contractABI.abi,
    functionName: 'getLeaderboard',
    args: [BigInt(limit)],
  });

  // 处理返回的数据结构
  const leaderboard = data ? {
    topPlayers: (data as any)[0] as string[],
    winCounts: (data as any)[1] as bigint[],
    totalWinnings: (data as any)[2] as bigint[],
  } : undefined;

  return {
    leaderboard,
    isError,
    isLoading,
    refetch,
  };
};

// 获取游戏总数
export const useGetTotalGamesCount = () => {
  const { data, isError, isLoading, refetch } = useReadContract({
    address: CONTRACT_CONFIG.address,
    abi: contractABI.abi,
    functionName: 'getTotalGamesCount',
  });

  return {
    totalGamesCount: data as bigint | undefined,
    isError,
    isLoading,
    refetch,
  };
};