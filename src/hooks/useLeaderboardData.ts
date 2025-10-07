import { useState, useEffect, useCallback } from 'react';
import { useGetAllGames } from '@/hooks/contract/useGameContract';
import { useGetWinnerHistory } from '@/hooks/contract/useStatsContract';
import { useWinnerCache } from './useWinnerCache';
import {
  LeaderboardEntry,
  WinnerRecord,
  aggregateLeaderboard,
  getRecentWinners,
  findUserPosition,
  CACHE_CONFIG,
} from '@/lib/leaderboard-utils';

export interface UseLeaderboardDataReturn {
  leaderboardData: LeaderboardEntry[];
  recentWinners: WinnerRecord[];
  userPosition: { position: number; entry: LeaderboardEntry } | null;
  allWinnerRecords: WinnerRecord[];
  totalGames: number;
  totalPlayers: number;
  totalPrizePool: bigint;
  isLoading: boolean;
  error: Error | null;
  lastUpdated: number | null;
  refetch: () => void;
  clearCache: () => void;
}

/**
 * Custom hook for aggregating leaderboard data with intelligent caching
 */
export function useLeaderboardData(userAddress?: string): UseLeaderboardDataReturn {
  const [leaderboardData, setLeaderboardData] = useState<LeaderboardEntry[]>([]);
  const [recentWinners, setRecentWinners] = useState<WinnerRecord[]>([]);
  const [userPosition, setUserPosition] = useState<{ position: number; entry: LeaderboardEntry } | null>(null);
  const [allWinnerRecords, setAllWinnerRecords] = useState<WinnerRecord[]>([]);
  const [totalGames, setTotalGames] = useState(0);
  const [totalPlayers, setTotalPlayers] = useState(0);
  const [totalPrizePool, setTotalPrizePool] = useState(BigInt(0));
  const [error, setError] = useState<Error | null>(null);

  // Blockchain data hooks
  const {
    games,
    isLoading: gamesLoading,
    isError: gamesError,
    refetch: refetchGames
  } = useGetAllGames();

  // Fetch winner history directly from contract (contains original prize amounts)
  const {
    winnerHistory,
    isLoading: historyLoading,
    isError: historyError,
    refetch: refetchHistory,
  } = useGetWinnerHistory(1000); // Get all winner history

  // Cache management
  const {
    cachedData,
    isStale,
    saveToCache,
    clearCache: clearCacheUtil,
    updateLastRefresh,
    getCachedRecords,
    isGameProcessed,
  } = useWinnerCache();

  const isLoading = gamesLoading || historyLoading;
  const lastUpdated = cachedData?.lastUpdated || null;

  /**
   * Process and aggregate all winner data
   */
  const processData = useCallback((allRecords: WinnerRecord[], allGamesData?: typeof games) => {
    // Aggregate leaderboard
    const aggregated = aggregateLeaderboard(allRecords);
    setLeaderboardData(aggregated);

    // Get recent winners
    const recent = getRecentWinners(allRecords, 10);
    setRecentWinners(recent);

    // Find user position if address provided
    if (userAddress) {
      const position = findUserPosition(aggregated, userAddress);
      setUserPosition(position);
    } else {
      setUserPosition(null);
    }

    // Set all records
    setAllWinnerRecords(allRecords);

    // Calculate totals from winner records
    setTotalGames(allRecords.length);
    const totalPrize = allRecords.reduce((sum, record) => sum + record.prize, BigInt(0));
    setTotalPrizePool(totalPrize);

    // Calculate total players from all games data (all participants, not just winners)
    if (allGamesData) {
      const totalParticipants = allGamesData.reduce((sum, game) => sum + game.playerCount, 0);
      setTotalPlayers(totalParticipants);
    } else {
      // Fallback: count unique winner addresses (underestimated but better than nothing)
      setTotalPlayers(aggregated.length);
    }

    setError(null);
  }, [userAddress]);


  /**
   * Manual refetch function
   */
  const refetch = useCallback(() => {
    refetchGames();
    refetchHistory();
  }, [refetchGames, refetchHistory]);

  /**
   * Clear cache and refresh data
   */
  const clearCache = useCallback(() => {
    clearCacheUtil();
    refetch();
  }, [clearCacheUtil, refetch]);

  /**
   * Main effect - handle data loading and caching
   * Use winnerHistory from contract which contains original prize amounts
   */
  useEffect(() => {
    if (gamesError || historyError) {
      setError(new Error('Failed to fetch data from blockchain'));
      return;
    }

    if (isLoading) return;

    try {
      // Use winner history directly from contract
      if (winnerHistory && games) {
        // Convert contract WinnerRecord to our WinnerRecord format
        const records: WinnerRecord[] = winnerHistory.map(record => ({
          gameId: record.gameId,
          roomName: record.roomName,
          winner: record.winner,
          winningNumber: record.winningNumber,
          prize: record.prize,
          timestamp: record.timestamp,
          status: 2, // Finished status
        }));

        // Process all data
        processData(records, games);
        setError(null);
      }
    } catch (err) {
      console.error('Error processing leaderboard data:', err);
      setError(err instanceof Error ? err : new Error('Unknown error occurred'));
    }
  }, [
    games,
    winnerHistory,
    gamesError,
    historyError,
    isLoading,
    processData,
  ]);

  /**
   * Auto-refresh effect for background updates
   */
  useEffect(() => {
    if (!isStale) {
      const interval = setInterval(() => {
        refetchGames();
      }, CACHE_CONFIG.REFRESH_INTERVAL);

      return () => clearInterval(interval);
    }
  }, [isStale, refetchGames]);

  return {
    leaderboardData,
    recentWinners,
    userPosition,
    allWinnerRecords,
    totalGames,
    totalPlayers,
    totalPrizePool,
    isLoading,
    error,
    lastUpdated,
    refetch,
    clearCache,
  };
}