import { useState, useEffect, useCallback } from 'react';
import { useGetAllGames } from '@/hooks/contract/useGameContract';
import { useWinnerCache } from './useWinnerCache';
import {
  LeaderboardEntry,
  WinnerRecord,
  extractWinnerRecords,
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

  const isLoading = gamesLoading;
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
   * Extract new winner records from fresh game data
   */
  const extractNewRecords = useCallback((gameData: typeof games): WinnerRecord[] => {
    if (!gameData) return [];

    // Filter out games that are already processed
    const newGames = gameData.filter(game => !isGameProcessed(game.gameId));
    
    // Extract winner records from new games
    return extractWinnerRecords(newGames);
  }, [isGameProcessed]);

  /**
   * Manual refetch function
   */
  const refetch = useCallback(() => {
    refetchGames();
  }, [refetchGames]);

  /**
   * Clear cache and refresh data
   */
  const clearCache = useCallback(() => {
    clearCacheUtil();
    refetch();
  }, [clearCacheUtil, refetch]);

  /**
   * Main effect - handle data loading and caching
   */
  useEffect(() => {
    if (gamesError) {
      setError(new Error('Failed to fetch game data from blockchain'));
      // Fallback to cached data if available
      if (cachedData) {
        processData(cachedData.cachedResults);
      }
      return;
    }

    if (isLoading) return;

    try {
      // If we have fresh blockchain data
      if (games) {
        // Extract new winner records
        const newRecords = extractNewRecords(games);
        
        // Get cached records
        const cachedRecords = getCachedRecords();

        // If we have new records, update cache
        if (newRecords.length > 0) {
          saveToCache(newRecords);
          // Combine with cached records for processing
          const allRecords = [...cachedRecords, ...newRecords];
          processData(allRecords, games);
        } else {
          // No new records, but update last refresh time
          updateLastRefresh();
          // Process with cached data
          processData(cachedRecords, games);
        }
      } else if (cachedData) {
        // No fresh data but we have cache
        processData(cachedData.cachedResults, games);
      }
    } catch (err) {
      console.error('Error processing leaderboard data:', err);
      setError(err instanceof Error ? err : new Error('Unknown error occurred'));
      
      // Fallback to cached data
      if (cachedData) {
        processData(cachedData.cachedResults, games);
      }
    }
  }, [
    games,
    gamesError,
    isLoading,
    cachedData,
    extractNewRecords,
    getCachedRecords,
    saveToCache,
    updateLastRefresh,
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