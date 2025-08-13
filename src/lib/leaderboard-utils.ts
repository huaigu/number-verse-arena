import { Game, GameSummary, CONTRACT_CONFIG } from '@/contracts/config';

// Types for leaderboard data
export interface WinnerRecord {
  gameId: bigint;
  roomName: string;
  winner: string;
  winningNumber: number;
  prize: bigint;
  timestamp: bigint;
  status: number;
}

export interface LeaderboardEntry {
  address: string;
  gamesWon: number;
  totalEarnings: bigint;
  latestWin: WinnerRecord | null;
  averageWinnings: bigint;
}

export interface CachedLeaderboardData {
  cachedResults: WinnerRecord[];
  lastUpdated: number;
  processedGameIds: Set<string>;
  version: string;
}

// Cache configuration
export const CACHE_CONFIG = {
  VERSION: 'v1',
  KEY: 'leaderboard-cache-v1',
  MAX_RECORDS: 1000,
  REFRESH_INTERVAL: 30000, // 30 seconds
  STALE_THRESHOLD: 300000, // 5 minutes
} as const;

/**
 * Check if a game is finished and has a winner
 */
export function isFinishedGameWithWinner(game: Game): boolean {
  return (
    (game.status === CONTRACT_CONFIG.GameStatus.Finished || 
     game.status === CONTRACT_CONFIG.GameStatus.PrizeClaimed) &&
    game.encryptedWinner &&
    game.encryptedWinner !== "0x0000000000000000000000000000000000000000" &&
    game.decryptedWinner > 0
  );
}

/**
 * Check if a game summary is finished and has a winner
 */
export function isFinishedSummaryWithWinner(summary: GameSummary): boolean {
  return (
    (summary.status === CONTRACT_CONFIG.GameStatus.Finished || 
     summary.status === CONTRACT_CONFIG.GameStatus.PrizeClaimed) &&
    summary.winner &&
    summary.winner !== "0x0000000000000000000000000000000000000000" &&
    summary.winningNumber > 0
  );
}

/**
 * Convert a Game to WinnerRecord
 */
export function gameToWinnerRecord(game: Game): WinnerRecord | null {
  if (!isFinishedGameWithWinner(game)) {
    return null;
  }

  // Calculate prize (playerCount * entryFee)
  const prize = BigInt(game.playerCount) * game.entryFee;

  return {
    gameId: game.gameId,
    roomName: game.roomName || `Game ${game.gameId.toString()}`,
    winner: game.encryptedWinner,
    winningNumber: game.decryptedWinner,
    prize,
    timestamp: game.deadline, // Use deadline as approximation
    status: game.status,
  };
}

/**
 * Convert a GameSummary to WinnerRecord
 */
export function summaryToWinnerRecord(summary: GameSummary): WinnerRecord | null {
  if (!isFinishedSummaryWithWinner(summary)) {
    return null;
  }

  return {
    gameId: summary.gameId,
    roomName: summary.roomName || `Game ${summary.gameId.toString()}`,
    winner: summary.winner,
    winningNumber: summary.winningNumber,
    prize: summary.prizePool,
    timestamp: summary.deadline,
    status: summary.status,
  };
}

/**
 * Filter and extract winner records from games
 */
export function extractWinnerRecords(games: Game[]): WinnerRecord[] {
  const records: WinnerRecord[] = [];
  
  for (const game of games) {
    const record = gameToWinnerRecord(game);
    if (record) {
      records.push(record);
    }
  }
  
  return records;
}

/**
 * Aggregate winner records into leaderboard entries
 */
export function aggregateLeaderboard(records: WinnerRecord[]): LeaderboardEntry[] {
  const aggregated = new Map<string, {
    gamesWon: number;
    totalEarnings: bigint;
    latestWin: WinnerRecord | null;
  }>();

  // Sort records by timestamp to find latest wins
  const sortedRecords = [...records].sort((a, b) => 
    Number(b.timestamp) - Number(a.timestamp)
  );

  for (const record of sortedRecords) {
    const address = record.winner.toLowerCase();
    const current = aggregated.get(address);

    if (current) {
      current.gamesWon += 1;
      current.totalEarnings += record.prize;
      if (!current.latestWin || record.timestamp > current.latestWin.timestamp) {
        current.latestWin = record;
      }
    } else {
      aggregated.set(address, {
        gamesWon: 1,
        totalEarnings: record.prize,
        latestWin: record,
      });
    }
  }

  // Convert to array and calculate averages
  const entries: LeaderboardEntry[] = [];
  for (const [address, data] of aggregated.entries()) {
    entries.push({
      address,
      gamesWon: data.gamesWon,
      totalEarnings: data.totalEarnings,
      latestWin: data.latestWin,
      averageWinnings: data.totalEarnings / BigInt(data.gamesWon),
    });
  }

  // Sort by total earnings descending
  return entries.sort((a, b) => {
    const diff = Number(b.totalEarnings - a.totalEarnings);
    if (diff !== 0) return diff;
    // If earnings are equal, sort by games won
    return b.gamesWon - a.gamesWon;
  });
}

/**
 * Load cached leaderboard data from localStorage
 */
export function loadCachedData(): CachedLeaderboardData | null {
  try {
    const cached = localStorage.getItem(CACHE_CONFIG.KEY);
    if (!cached) return null;

    const data = JSON.parse(cached);
    
    // Validate cache version
    if (data.version !== CACHE_CONFIG.VERSION) {
      localStorage.removeItem(CACHE_CONFIG.KEY);
      return null;
    }

    // Convert serialized data back to proper types
    return {
      cachedResults: data.cachedResults.map((record: {
        gameId: string;
        prize: string;
        timestamp: string;
        [key: string]: unknown;
      }) => ({
        ...record,
        gameId: BigInt(record.gameId),
        prize: BigInt(record.prize),
        timestamp: BigInt(record.timestamp),
      })),
      lastUpdated: data.lastUpdated,
      processedGameIds: new Set(data.processedGameIds),
      version: data.version,
    };
  } catch (error) {
    console.warn('Failed to load cached leaderboard data:', error);
    localStorage.removeItem(CACHE_CONFIG.KEY);
    return null;
  }
}

/**
 * Save leaderboard data to localStorage
 */
export function saveCachedData(data: CachedLeaderboardData): void {
  try {
    // Convert BigInt values to strings for serialization
    const serializable = {
      cachedResults: data.cachedResults.map(record => ({
        ...record,
        gameId: record.gameId.toString(),
        prize: record.prize.toString(),
        timestamp: record.timestamp.toString(),
      })),
      lastUpdated: data.lastUpdated,
      processedGameIds: Array.from(data.processedGameIds),
      version: data.version,
    };

    localStorage.setItem(CACHE_CONFIG.KEY, JSON.stringify(serializable));
  } catch (error) {
    console.warn('Failed to save cached leaderboard data:', error);
  }
}

/**
 * Check if cached data is stale
 */
export function isCacheStale(lastUpdated: number): boolean {
  return Date.now() - lastUpdated > CACHE_CONFIG.STALE_THRESHOLD;
}

/**
 * Clear cached data
 */
export function clearCache(): void {
  localStorage.removeItem(CACHE_CONFIG.KEY);
}

/**
 * Merge new winner records with cached data
 */
export function mergeWithCache(
  newRecords: WinnerRecord[],
  cachedData: CachedLeaderboardData
): WinnerRecord[] {
  const allRecords = [...cachedData.cachedResults];
  
  for (const record of newRecords) {
    const gameIdStr = record.gameId.toString();
    if (!cachedData.processedGameIds.has(gameIdStr)) {
      allRecords.push(record);
    }
  }
  
  // Remove duplicates and sort by timestamp
  const uniqueRecords = Array.from(
    new Map(
      allRecords.map(record => [record.gameId.toString(), record])
    ).values()
  ).sort((a, b) => Number(b.timestamp) - Number(a.timestamp));
  
  // Limit records to prevent unlimited growth
  return uniqueRecords.slice(0, CACHE_CONFIG.MAX_RECORDS);
}

/**
 * Get recent winners (last N winners)
 */
export function getRecentWinners(records: WinnerRecord[], limit: number = 10): WinnerRecord[] {
  return [...records]
    .sort((a, b) => Number(b.timestamp) - Number(a.timestamp))
    .slice(0, limit);
}

/**
 * Find user's position in leaderboard
 */
export function findUserPosition(
  leaderboard: LeaderboardEntry[],
  userAddress: string
): { position: number; entry: LeaderboardEntry } | null {
  const normalizedAddress = userAddress.toLowerCase();
  const position = leaderboard.findIndex(
    entry => entry.address.toLowerCase() === normalizedAddress
  );
  
  if (position === -1) return null;
  
  return {
    position: position + 1, // 1-indexed
    entry: leaderboard[position],
  };
}