import { useState, useEffect } from "react"
import { useNavigate } from "react-router-dom"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { useToast } from "@/hooks/use-toast"
import { ArrowLeft, Users, Target, Trophy, Timer, Loader2, RefreshCw, TrendingUp } from "lucide-react"
import { useAccount } from 'wagmi'
import { ConnectButton } from '@rainbow-me/rainbowkit'
import { useGetActiveGames, useGetAllGames, useGetGameSummary } from "@/hooks/contract/useGameContract"
import { CONTRACT_CONFIG, getGameStatusText, formatETH } from "@/contracts/config"
import { useTranslation } from 'react-i18next'
import { LanguageSwitcher } from '@/components/LanguageSwitcher'

const JoinRoom = () => {
  const navigate = useNavigate()
  const { toast } = useToast()
  const { address, isConnected } = useAccount()
  const { t } = useTranslation()
  
  // 获取活跃游戏列表
  const { 
    activeGames, 
    isError: gamesError, 
    isLoading: gamesLoading, 
    refetch: refetchGames 
  } = useGetActiveGames()
  
  // 获取所有游戏列表（包括已结束的）
  const { 
    games: allGames, 
    isError: allGamesError, 
    isLoading: allGamesLoading, 
    refetch: refetchAllGames 
  } = useGetAllGames()
  
  // 定时刷新游戏列表
  useEffect(() => {
    const interval = setInterval(() => {
      refetchGames()
      refetchAllGames()
    }, 10000) // 每10秒刷新一次
    
    return () => clearInterval(interval)
  }, [refetchGames, refetchAllGames])


  const handleJoinRoom = (gameId: bigint, status: number, timeLeft: number, playerCount: number) => {
    if (!isConnected) {
      toast({
        title: t('toast.walletNotConnected.title'),
        description: t('toast.walletNotConnected.description'),
        variant: "destructive"
      })
      return
    }

    // 检查是否已过期
    if (timeLeft <= 0) {
      if (playerCount === 0) {
        toast({
          title: t('toast.gameExpired.title'),
          description: t('toast.gameExpired.description'),
          variant: "destructive"
        })
        return
      } else {
        // 过期但有玩家的游戏，允许查看结果
        toast({
          title: t('toast.viewingExpiredGame.title'),
          description: t('toast.viewingExpiredGame.description'),
        })
        navigate(`/game?room=${gameId.toString()}`)
        return
      }
    }

    // 检查游戏状态
    if (status === CONTRACT_CONFIG.GameStatus.Finished || status === CONTRACT_CONFIG.GameStatus.PrizeClaimed) {
      toast({
        title: t('toast.viewingFinishedGame.title'),
        description: t('toast.viewingFinishedGame.description'),
      })
      navigate(`/game?room=${gameId.toString()}`)
      return
    }

    if (status === CONTRACT_CONFIG.GameStatus.Calculating) {
      toast({
        title: t('toast.viewingCalculatingGame.title'),
        description: t('toast.viewingCalculatingGame.description'),
      })
      navigate(`/game?room=${gameId.toString()}`)
      return
    }

    toast({
      title: t('toast.joiningRoom.title'),
      description: t('toast.joiningRoom.description', { roomId: gameId.toString() }),
    })

    navigate(`/game?room=${gameId.toString()}`)
  }

  const handleViewFinishedGame = (gameId: bigint) => {
    if (!isConnected) {
      toast({
        title: t('toast.walletNotConnected.title'),
        description: t('toast.walletNotConnected.description'),
        variant: "destructive"
      })
      return
    }

    toast({
      title: t('gamePage.loading'),
      description: `Room ID: ${gameId.toString()}`,
    })

    navigate(`/game?room=${gameId.toString()}`)
  }

  const getStatusBadge = (status: number, isExpired?: boolean, playerCount?: number) => {
    // If expired, show different badges based on whether there are players
    if (isExpired) {
      if (playerCount && playerCount > 0) {
        return <Badge className="bg-blue-500 text-white">{t('joinRoom.roomCard.expired')} ({t('common.viewGame')})</Badge>
      } else {
        return <Badge variant="destructive">{t('joinRoom.roomCard.expired')}</Badge>
      }
    }

    switch (status) {
      case CONTRACT_CONFIG.GameStatus.Open:
        return <Badge variant="secondary">{t('joinRoom.status.open')}</Badge>
      case CONTRACT_CONFIG.GameStatus.Calculating:
        return <Badge className="bg-yellow-500 text-white">{t('joinRoom.status.calculating')}</Badge>
      case CONTRACT_CONFIG.GameStatus.Finished:
        return <Badge variant="destructive">{t('joinRoom.status.finished')}</Badge>
      case CONTRACT_CONFIG.GameStatus.PrizeClaimed:
        return <Badge className="bg-green-500 text-white">{t('joinRoom.status.claimed')}</Badge>
      default:
        return <Badge variant="outline">Unknown</Badge>
    }
  }
  
  // 计算剩余时间（简化版，实际应该基于区块时间戳）
  const getTimeLeft = (deadline: bigint) => {
    const now = Math.floor(Date.now() / 1000) // 当前时间戳（秒）
    const deadlineSeconds = Number(deadline)
    const timeLeft = Math.max(0, deadlineSeconds - now)
    return timeLeft
  }
  
  // 计算奖池
  const calculatePrizePool = (playerCount: number, entryFee: bigint) => {
    return (BigInt(playerCount) * entryFee)
  }

  // 过滤已结束的游戏
  const getFinishedGames = () => {
    if (!allGames) return []
    return allGames.filter(game => 
      game.status === CONTRACT_CONFIG.GameStatus.Finished || 
      game.status === CONTRACT_CONFIG.GameStatus.PrizeClaimed ||
      game.status === CONTRACT_CONFIG.GameStatus.Calculating
    )
  }

  const finishedGames = getFinishedGames()

  return (
    <div className="min-h-screen bg-gradient-background p-4">
      <div className="max-w-page mx-auto">
        {/* Header */}
        <div className="flex items-center justify-between mb-8">
          <div className="flex items-center space-x-4">
            <button
              className="bg-surface-light dark:bg-surface-dark text-foreground px-4 py-2 rounded-lg shadow-pixel-light dark:shadow-pixel-dark pixel-button border-2 border-black dark:border-white flex items-center space-x-2"
              onClick={() => navigate("/")}
            >
              <ArrowLeft className="w-4 h-4" />
              <span className="text-sm font-medium">{t('common.back')}</span>
            </button>
            <h1 className="text-2xl font-bold text-foreground">{t('joinRoom.title')}</h1>
          </div>
          <div className="flex items-center space-x-3">
            <button
              className="bg-surface-light dark:bg-surface-dark text-foreground px-4 py-2 rounded-lg shadow-pixel-light dark:shadow-pixel-dark pixel-button border-2 border-black dark:border-white flex items-center space-x-2"
              onClick={() => navigate("/leaderboard")}
            >
              <TrendingUp className="w-4 h-4" />
              <span className="text-sm font-medium">{t('common.leaderboard')}</span>
            </button>
            <LanguageSwitcher />
            <ConnectButton />
          </div>
        </div>


        {/* Bottom Section - Room Lists */}
        <div className="space-y-8">
          {/* Available Rooms */}
          <div>
            <Card className="shadow-pixel-light dark:shadow-pixel-dark border-2 border-black dark:border-white">
              <CardHeader>
                <div className="flex items-center justify-between">
                  <div>
                    <CardTitle>{t('joinRoom.activeRooms')}</CardTitle>
                    <CardDescription>{t('joinRoom.activeRoomsDesc')}</CardDescription>
                  </div>
                  <button
                    className="bg-surface-light dark:bg-surface-dark text-foreground px-4 py-2 rounded-lg shadow-pixel-light dark:shadow-pixel-dark pixel-button border-2 border-black dark:border-white flex items-center space-x-2 disabled:opacity-50"
                    onClick={() => {
                      refetchGames()
                      refetchAllGames()
                    }}
                    disabled={gamesLoading || allGamesLoading}
                  >
                    <RefreshCw className={`w-4 h-4 ${(gamesLoading || allGamesLoading) ? 'animate-spin' : ''}`} />
                    <span className="text-sm font-medium">{t('common.refresh')}</span>
                  </button>
                </div>
              </CardHeader>
              <CardContent>
                {gamesLoading ? (
                  <div className="flex items-center justify-center py-12">
                    <Loader2 className="w-8 h-8 animate-spin text-primary" />
                    <span className="ml-2 text-muted-foreground">{t('joinRoom.loadingRooms')}</span>
                  </div>
                ) : gamesError ? (
                  <div className="text-center py-12">
                    <div className="text-6xl mb-4">⚠️</div>
                    <h3 className="text-xl font-semibold mb-2">Failed to Load Rooms</h3>
                    <p className="text-muted-foreground mb-4">
                      Unable to fetch game rooms from the blockchain.
                    </p>
                    <button
                      className="bg-primary text-primary-foreground px-6 py-3 rounded-lg shadow-pixel-light dark:shadow-pixel-dark pixel-button border-2 border-black dark:border-white"
                      onClick={() => refetchGames()}
                    >
                      {t('gamePage.actions.tryAgain')}
                    </button>
                  </div>
                ) : activeGames && activeGames.length > 0 ? (
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    {activeGames.filter((game) => {
                        const timeLeft = getTimeLeft(game.deadline)
                        const isExpired = timeLeft <= 0
                        // 过滤掉没人参与且到期的房间
                        return !(isExpired && game.playerCount === 0)
                      }).map((game) => {
                        const timeLeft = getTimeLeft(game.deadline)
                        const prizePool = calculatePrizePool(game.playerCount, game.entryFee)
                        const isExpired = timeLeft <= 0
                        const isFull = game.playerCount >= game.maxPlayers
                        const canJoin = game.status === CONTRACT_CONFIG.GameStatus.Open && !isExpired && !isFull
                        
                        return (
                          <div
                            key={game.gameId.toString()}
                            className={`p-4 rounded-lg shadow-pixel-light dark:shadow-pixel-dark pixel-button transition-all duration-150 ${
                              canJoin
                                ? "bg-green-100 dark:bg-green-900 border-green-600 dark:border-green-400 cursor-pointer"
                                : (isExpired && game.playerCount > 0) || isFull
                                  ? "bg-yellow-100 dark:bg-yellow-900 border-yellow-600 dark:border-yellow-400 cursor-pointer opacity-90"
                                  : "bg-gray-100 dark:bg-gray-800 border-gray-500 dark:border-gray-600 opacity-60 cursor-not-allowed"
                            }`}
                            onClick={() => {
                              if (canJoin) {
                                handleJoinRoom(game.gameId, game.status, timeLeft, game.playerCount)
                              } else if (isExpired && game.playerCount > 0) {
                                // Allow viewing expired games with players
                                handleJoinRoom(game.gameId, game.status, timeLeft, game.playerCount)
                              } else if (isFull) {
                                // Allow viewing full games
                                handleJoinRoom(game.gameId, game.status, timeLeft, game.playerCount)
                              }
                            }}
                          >
                            <div className="flex items-center justify-between mb-3">
                              <div className="flex items-center space-x-3">
                                <h3 className="font-semibold text-lg">{game.roomName || `Game ${game.gameId.toString()}`}</h3>
                                {getStatusBadge(game.status, isExpired, game.playerCount)}
                              </div>
                              <Badge variant="outline" className="font-mono">
                                #{game.gameId.toString()}
                              </Badge>
                            </div>

                            <div className="grid grid-cols-2 md:grid-cols-4 gap-3 mb-3">
                              <div className="flex items-center space-x-2 text-sm">
                                <Users className="w-4 h-4 text-muted-foreground" />
                                <span>{game.playerCount}/{game.maxPlayers}</span>
                              </div>
                              
                              <div className="flex items-center space-x-2 text-sm">
                                <Target className="w-4 h-4 text-muted-foreground" />
                                <span>{game.minNumber}-{game.maxNumber}</span>
                              </div>
                              
                              <div className="flex items-center space-x-2 text-sm">
                                <Trophy className="w-4 h-4 text-muted-foreground" />
                                <span>{formatETH(prizePool)} ETH</span>
                              </div>
                              
                              <div className="flex items-center space-x-2 text-sm">
                                <Timer className="w-4 h-4 text-muted-foreground" />
                                <span>{timeLeft > 0 ? `${Math.floor(timeLeft / 60)}:${(timeLeft % 60).toString().padStart(2, '0')}` : "Expired"}</span>
                              </div>
                            </div>

                            {/* Player capacity bar */}
                            <div className="w-full bg-muted rounded-full h-2">
                              <div 
                                className="bg-gradient-primary h-2 rounded-full transition-all duration-300"
                                style={{ width: `${(game.playerCount / game.maxPlayers) * 100}%` }}
                              />
                            </div>
                            
                            {/* Entry fee info and action hint */}
                            <div className="mt-2 flex items-center justify-between">
                              <div className="text-xs text-muted-foreground">
                                {t('joinRoom.roomCard.entryFee')}: {formatETH(game.entryFee)} ETH
                              </div>

                              {canJoin && (
                                <div className="text-xs text-green-600 font-medium">
                                  {t('joinRoom.roomCard.joinButton')}
                                </div>
                              )}

                              {(isExpired || isFull) && !canJoin && (
                                <div className="text-xs text-amber-600 font-medium">
                                  {isExpired ? t('joinRoom.roomCard.viewButton') + ' (' + t('joinRoom.roomCard.expired') + ')' : t('joinRoom.roomCard.viewButton') + ' (' + t('joinRoom.roomCard.fullButton') + ')'}
                                </div>
                              )}
                            </div>
                          </div>
                        )
                      })}
                  </div>
                ) : (
                  <div className="text-center py-12">
                    <div className="text-6xl mb-4">🎮</div>
                    <h3 className="text-xl font-semibold mb-2">{t('joinRoom.noActiveRooms')}</h3>
                    <p className="text-muted-foreground mb-4">
                      {t('joinRoom.noActiveRoomsDesc')}
                    </p>
                    <button
                      className="bg-primary text-primary-foreground px-6 py-3 rounded-lg shadow-pixel-light dark:shadow-pixel-dark pixel-button border-2 border-black dark:border-white"
                      onClick={() => navigate("/create-room")}
                    >
                      {t('common.createRoom')}
                    </button>
                  </div>
                )}
              </CardContent>
            </Card>
          </div>

          {/* Finished Games */}
          <div>
            <Card className="shadow-pixel-light dark:shadow-pixel-dark border-2 border-black dark:border-white">
              <CardHeader>
                <div className="flex items-center justify-between">
                  <div>
                    <CardTitle>{t('joinRoom.allRooms')}</CardTitle>
                    <CardDescription>{t('joinRoom.allRoomsDesc')}</CardDescription>
                  </div>
                  <button
                    className="bg-surface-light dark:bg-surface-dark text-foreground px-4 py-2 rounded-lg shadow-pixel-light dark:shadow-pixel-dark pixel-button border-2 border-black dark:border-white flex items-center space-x-2 disabled:opacity-50"
                    onClick={() => refetchAllGames()}
                    disabled={allGamesLoading}
                  >
                    <RefreshCw className={`w-4 h-4 ${allGamesLoading ? 'animate-spin' : ''}`} />
                    <span className="text-sm font-medium">{t('common.refresh')}</span>
                  </button>
                </div>
              </CardHeader>
              <CardContent>
                {allGamesLoading ? (
                  <div className="flex items-center justify-center py-12">
                    <Loader2 className="w-8 h-8 animate-spin text-primary" />
                    <span className="ml-2 text-muted-foreground">{t('joinRoom.loadingRooms')}</span>
                  </div>
                ) : allGamesError ? (
                  <div className="text-center py-12">
                    <div className="text-6xl mb-4">⚠️</div>
                    <h3 className="text-xl font-semibold mb-2">Failed to Load Finished Games</h3>
                    <p className="text-muted-foreground mb-4">
                      Unable to fetch finished games from the blockchain.
                    </p>
                    <button
                      className="bg-primary text-primary-foreground px-6 py-3 rounded-lg shadow-pixel-light dark:shadow-pixel-dark pixel-button border-2 border-black dark:border-white"
                      onClick={() => refetchAllGames()}
                    >
                      {t('gamePage.actions.tryAgain')}
                    </button>
                  </div>
                ) : (
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    {finishedGames && finishedGames.length > 0 ? (
                      finishedGames.map((game) => {
                        const prizePool = calculatePrizePool(game.playerCount, game.entryFee)
                        
                        return (
                          <div
                            key={game.gameId.toString()}
                            className={`p-4 rounded-lg shadow-pixel-light dark:shadow-pixel-dark pixel-button cursor-pointer transition-all duration-150 ${
                              game.status === CONTRACT_CONFIG.GameStatus.Calculating
                                ? "bg-blue-100 dark:bg-blue-900 border-blue-600 dark:border-blue-400"
                                : "bg-purple-100 dark:bg-purple-900 border-purple-600 dark:border-purple-400"
                            }`}
                            onClick={() => handleViewFinishedGame(game.gameId)}
                          >
                            <div className="flex items-center justify-between mb-3">
                              <div className="flex items-center space-x-3">
                                <h3 className="font-semibold text-lg">{game.roomName || `Game ${game.gameId.toString()}`}</h3>
                                {getStatusBadge(game.status)}
                              </div>
                              <Badge variant="outline" className="font-mono">
                                #{game.gameId.toString()}
                              </Badge>
                            </div>

                            <div className="grid grid-cols-3 gap-3 mb-3">
                              <div className="flex items-center space-x-2 text-sm">
                                <Users className="w-4 h-4 text-muted-foreground" />
                                <span>{game.playerCount}/{game.maxPlayers}</span>
                              </div>
                              
                              <div className="flex items-center space-x-2 text-sm">
                                <Target className="w-4 h-4 text-muted-foreground" />
                                <span>{game.minNumber}-{game.maxNumber}</span>
                              </div>
                              
                              <div className="flex items-center space-x-2 text-sm">
                                <Trophy className="w-4 h-4 text-muted-foreground" />
                                <span>{formatETH(prizePool)} ETH</span>
                              </div>
                            </div>


                            {/* Entry fee info */}
                            <div className="mt-2 text-xs text-muted-foreground">
                              {t('joinRoom.roomCard.entryFee')}: {formatETH(game.entryFee)} ETH
                            </div>
                          </div>
                        )
                      })
                    ) : (
                      <div className="text-center py-12 col-span-full">
                        <div className="text-6xl mb-4">🏆</div>
                        <h3 className="text-xl font-semibold mb-2">{t('joinRoom.noAllRooms')}</h3>
                        <p className="text-muted-foreground mb-4">
                          {t('joinRoom.noAllRoomsDesc')}
                        </p>
                        <button
                          className="bg-primary text-primary-foreground px-6 py-3 rounded-lg shadow-pixel-light dark:shadow-pixel-dark pixel-button border-2 border-black dark:border-white"
                          onClick={() => navigate("/create-room")}
                        >
                          {t('common.createRoom')}
                        </button>
                      </div>
                    )}
                  </div>
                )}
              </CardContent>
            </Card>
          </div>
        </div>
      </div>
    </div>
  )
}

export default JoinRoom