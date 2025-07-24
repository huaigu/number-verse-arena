// 游戏相关hooks
export {
  useGetAllGames,
  useGetActiveGames,
  useGetGameSummary,
  useHasPlayerSubmitted,
  useCreateGame,
  useSubmitNumber,
  useFindWinner,
  useClaimPrize,
} from './useGameContract';

// 统计和排行榜相关hooks
export {
  useGetPlayerStats,
  useGetPlayerGames,
  useGetWinnerHistory,
  useGetWinnerHistoryCount,
  useGetLeaderboard,
  useGetTotalGamesCount,
} from './useStatsContract';

// 导出类型和配置
export * from '@/contracts/config';