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
    const currentData = cachedData || {
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
  }, [cachedData]);

  const clearCache = useCallback(() => {
    clearCacheUtil();
    setCachedData(null);
  }, []);

  const updateLastRefresh = useCallback(() => {
    if (cachedData) {
      const updatedData = {
        ...cachedData,
        lastUpdated: Date.now(),
      };
      saveCachedData(updatedData);
      setCachedData(updatedData);
    }
  }, [cachedData]);

  const getCachedRecords = useCallback((): WinnerRecord[] => {
    return cachedData?.cachedResults || [];
  }, [cachedData]);

  const isGameProcessed = useCallback((gameId: bigint): boolean => {
    return cachedData?.processedGameIds.has(gameId.toString()) || false;
  }, [cachedData]);

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