import { useState, useCallback } from 'react';
import {
  CachedLeaderboardData,
  WinnerRecord,
  CACHE_CONFIG,
  loadCachedData,
  saveCachedData,
  clearCache as clearCacheUtil,
  isCacheStale,
  mergeWithCache,
} from '@/lib/leaderboard-utils';

export interface UseWinnerCacheReturn {
  cachedData: CachedLeaderboardData | null;
  isStale: boolean;
  saveToCache: (newRecords: WinnerRecord[]) => void;
  clearCache: () => void;
  updateLastRefresh: () => void;
  getCachedRecords: () => WinnerRecord[];
  isGameProcessed: (gameId: bigint) => boolean;
}

/**
 * Custom hook for managing winner cache in localStorage
 */
export function useWinnerCache(): UseWinnerCacheReturn {
  const [cachedData, setCachedData] = useState<CachedLeaderboardData | null>(() => {
    return loadCachedData();
  });

  const isStale = cachedData ? isCacheStale(cachedData.lastUpdated) : true;

  const saveToCache = useCallback((newRecords: WinnerRecord[]) => {
    const currentData = loadCachedData() || {
      cachedResults: [],
      lastUpdated: Date.now(),
      processedGameIds: new Set<string>(),
      version: CACHE_CONFIG.VERSION,
    };

    // Merge new records with existing cache
    const mergedRecords = mergeWithCache(newRecords, currentData);

    // Update processed game IDs
    const processedGameIds = new Set(currentData.processedGameIds);
    for (const record of newRecords) {
      processedGameIds.add(record.gameId.toString());
    }

    const updatedData: CachedLeaderboardData = {
      cachedResults: mergedRecords,
      lastUpdated: Date.now(),
      processedGameIds,
      version: CACHE_CONFIG.VERSION,
    };

    // Save to localStorage
    saveCachedData(updatedData);
    setCachedData(updatedData);
  }, []);

  const clearCache = useCallback(() => {
    clearCacheUtil();
    setCachedData(null);
  }, []);

  const updateLastRefresh = useCallback(() => {
    const currentData = loadCachedData();
    if (currentData) {
      const updatedData = {
        ...currentData,
        lastUpdated: Date.now(),
      };
      saveCachedData(updatedData);
      setCachedData(updatedData);
    }
  }, []);

  const getCachedRecords = useCallback((): WinnerRecord[] => {
    const currentData = loadCachedData();
    return currentData?.cachedResults || [];
  }, []);

  const isGameProcessed = useCallback((gameId: bigint): boolean => {
    const currentData = loadCachedData();
    return currentData?.processedGameIds.has(gameId.toString()) || false;
  }, []);

  return {
    cachedData,
    isStale,
    saveToCache,
    clearCache,
    updateLastRefresh,
    getCachedRecords,
    isGameProcessed,
  };
}