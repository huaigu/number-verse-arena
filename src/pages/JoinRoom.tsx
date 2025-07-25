import { useState, useEffect } from "react"
import { useNavigate } from "react-router-dom"
import { GradientButton } from "@/components/ui/gradient-button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Badge } from "@/components/ui/badge"
import { useToast } from "@/hooks/use-toast"
import { ArrowLeft, Users, Target, Trophy, Timer, Search, Wallet, Loader2, RefreshCw } from "lucide-react"
import { useAccount } from 'wagmi'
import { ConnectButton } from '@rainbow-me/rainbowkit'
import { useGetActiveGames, useGetAllGames, useGetGameSummary } from "@/hooks/contract/useGameContract"
import { CONTRACT_CONFIG, getGameStatusText, formatETH } from "@/contracts/config"

const JoinRoom = () => {
  const navigate = useNavigate()
  const { toast } = useToast()
  const { address, isConnected } = useAccount()
  
  const [roomCode, setRoomCode] = useState("")
  const [isJoining, setIsJoining] = useState(false)
  
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

  const handleJoinByCode = async () => {
    if (!isConnected) {
      toast({
        title: "Wallet not connected",
        description: "Please connect your wallet to join a room.",
        variant: "destructive"
      })
      return
    }

    if (!roomCode.trim()) {
      toast({
        title: "Please enter room code",
        variant: "destructive"
      })
      return
    }

    // 验证房间ID是否为数字
    const gameId = parseInt(roomCode)
    if (isNaN(gameId)) {
      toast({
        title: "Invalid room code",
        description: "Room code must be a number.",
        variant: "destructive"
      })
      return
    }

    setIsJoining(true)
    
    try {
      // 直接跳转到游戏页面，让游戏页面处理数据加载
      toast({
        title: "Joining room...",
        description: `Room ID: ${gameId}`,
      })
      navigate(`/game?room=${gameId}`)
    } catch (error) {
      toast({
        title: "Failed to join room",
        description: "Please check the room code and try again.",
        variant: "destructive"
      })
    } finally {
      setIsJoining(false)
    }
  }

  const handleJoinRoom = (gameId: bigint, status: number, timeLeft: number, playerCount: number) => {
    if (!isConnected) {
      toast({
        title: "Wallet not connected",
        description: "Please connect your wallet to join a room.",
        variant: "destructive"
      })
      return
    }

    // 检查是否已过期且没有玩家参与
    if (timeLeft <= 0 && playerCount === 0) {
      toast({
        title: "Game expired",
        description: "This room has expired and cannot be joined.",
        variant: "destructive"
      })
      return
    }

    // 检查游戏状态
    if (status === CONTRACT_CONFIG.GameStatus.Finished || status === CONTRACT_CONFIG.GameStatus.PrizeClaimed) {
      toast({
        title: "Game finished",
        description: "This room has already finished",
        variant: "destructive"
      })
      return
    }

    if (status === CONTRACT_CONFIG.GameStatus.Calculating) {
      toast({
        title: "Game calculating",
        description: "This game is calculating results...",
        variant: "destructive"
      })
      return
    }

    toast({
      title: "Joining room...",
      description: `Room ID: ${gameId.toString()}`,
    })

    navigate(`/game?room=${gameId.toString()}`)
  }

  const handleViewFinishedGame = (gameId: bigint) => {
    if (!isConnected) {
      toast({
        title: "Wallet not connected",
        description: "Please connect your wallet to view finished games.",
        variant: "destructive"
      })
      return
    }

    toast({
      title: "Loading game...",
      description: `Room ID: ${gameId.toString()}`,
    })

    navigate(`/game?room=${gameId.toString()}`)
  }

  const getStatusBadge = (status: number, isExpired?: boolean) => {
    // If expired, always show Expired badge regardless of status
    if (isExpired) {
      return <Badge variant="destructive">Expired</Badge>
    }
    
    switch (status) {
      case CONTRACT_CONFIG.GameStatus.Open:
        return <Badge variant="secondary">Open</Badge>
      case CONTRACT_CONFIG.GameStatus.Calculating:
        return <Badge className="bg-yellow-500 text-white">Calculating</Badge>
      case CONTRACT_CONFIG.GameStatus.Finished:
        return <Badge variant="destructive">Finished</Badge>
      case CONTRACT_CONFIG.GameStatus.PrizeClaimed:
        return <Badge className="bg-green-500 text-white">Completed</Badge>
      default:
        return <Badge variant="outline">Unknown</Badge>
    }
  }

  const getStatusColor = (status: number, isExpired?: boolean) => {
    // If expired, use red border regardless of status
    if (isExpired) {
      return "border-red-300"
    }
    
    switch (status) {
      case CONTRACT_CONFIG.GameStatus.Open:
        return "border-green-300 hover:border-green-400"
      case CONTRACT_CONFIG.GameStatus.Calculating:
        return "border-yellow-300"
      case CONTRACT_CONFIG.GameStatus.Finished:
        return "border-red-300"
      case CONTRACT_CONFIG.GameStatus.PrizeClaimed:
        return "border-gray-300"
      default:
        return "border-border"
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
      <div className="max-w-4xl mx-auto">
        {/* Header */}
        <div className="flex items-center justify-between mb-8">
          <div className="flex items-center space-x-4">
            <GradientButton 
              variant="outline" 
              size="sm"
              onClick={() => navigate("/")}
            >
              <ArrowLeft className="w-4 h-4 mr-2" />
              Back
            </GradientButton>
            <h1 className="text-3xl font-bold text-foreground">Join Game Room</h1>
          </div>
          <ConnectButton />
        </div>

        {/* Top Section - Join by Code */}
        <div className="mb-8">
          <Card className="shadow-card max-w-2xl mx-auto">
            <CardHeader>
              <CardTitle className="flex items-center justify-center space-x-2">
                <Search className="w-5 h-5" />
                <span>Join by Room Code</span>
              </CardTitle>
              <CardDescription className="text-center">Enter room ID to join directly</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="flex flex-col md:flex-row gap-4 items-end">
                {!isConnected && (
                  <Card className="border-orange-200 bg-orange-50 w-full mb-4">
                    <CardContent className="p-3">
                      <div className="flex items-center justify-center space-x-2 text-orange-700">
                        <Wallet className="w-4 h-4" />
                        <span className="text-sm">Connect wallet to join rooms</span>
                      </div>
                    </CardContent>
                  </Card>
                )}
                
                <div className="flex-1 space-y-2">
                  <Label htmlFor="roomCode">Room ID</Label>
                  <Input
                    id="roomCode"
                    placeholder="e.g: 123"
                    value={roomCode}
                    onChange={(e) => setRoomCode(e.target.value)}
                    className="text-center text-lg font-mono"
                    disabled={!isConnected}
                  />
                </div>
                
                <div className="flex gap-2">
                  <GradientButton
                    onClick={handleJoinByCode}
                    disabled={isJoining || !roomCode.trim() || !isConnected}
                  >
                    {isJoining ? "Joining..." : "Join Room"}
                  </GradientButton>
                  
                  <GradientButton
                    variant="outline"
                    onClick={() => navigate("/create-room")}
                  >
                    Create New Room
                  </GradientButton>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Bottom Section - Room Lists */}
        <div className="space-y-8">
          {/* Available Rooms */}
          <div>
            <Card className="shadow-card">
              <CardHeader>
                <div className="flex items-center justify-between">
                  <div>
                    <CardTitle>Available Rooms</CardTitle>
                    <CardDescription>Choose a room to quickly join the game</CardDescription>
                  </div>
                  <GradientButton
                    variant="outline"
                    size="sm"
                    onClick={() => {
                      refetchGames()
                      refetchAllGames()
                    }}
                    disabled={gamesLoading || allGamesLoading}
                  >
                    <RefreshCw className={`w-4 h-4 mr-2 ${(gamesLoading || allGamesLoading) ? 'animate-spin' : ''}`} />
                    Refresh
                  </GradientButton>
                </div>
              </CardHeader>
              <CardContent>
                {gamesLoading ? (
                  <div className="flex items-center justify-center py-12">
                    <Loader2 className="w-8 h-8 animate-spin text-primary" />
                    <span className="ml-2 text-muted-foreground">Loading rooms...</span>
                  </div>
                ) : gamesError ? (
                  <div className="text-center py-12">
                    <div className="text-6xl mb-4">⚠️</div>
                    <h3 className="text-xl font-semibold mb-2">Failed to Load Rooms</h3>
                    <p className="text-muted-foreground mb-4">
                      Unable to fetch game rooms from the blockchain.
                    </p>
                    <GradientButton onClick={() => refetchGames()}>
                      Try Again
                    </GradientButton>
                  </div>
                ) : (
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    {activeGames && activeGames.length > 0 ? (
                      activeGames.map((game) => {
                        const timeLeft = getTimeLeft(game.deadline)
                        const prizePool = calculatePrizePool(game.playerCount, game.entryFee)
                        const isExpired = timeLeft <= 0
                        const isEmpty = game.playerCount === 0
                        const isExpiredAndEmpty = isExpired && isEmpty
                        const canJoin = game.status === CONTRACT_CONFIG.GameStatus.Open && !isExpiredAndEmpty
                        
                        return (
                          <div
                            key={game.gameId.toString()}
                            className={`p-4 border-2 rounded-lg transition-all duration-300 ${getStatusColor(game.status, isExpired)} ${
                              canJoin ? "hover:shadow-card cursor-pointer hover:-translate-y-1" : "opacity-60 cursor-not-allowed"
                            }`}
                            onClick={() => canJoin && handleJoinRoom(game.gameId, game.status, timeLeft, game.playerCount)}
                          >
                            <div className="flex items-center justify-between mb-3">
                              <div className="flex items-center space-x-3">
                                <h3 className="font-semibold text-lg">{game.roomName || `Game ${game.gameId.toString()}`}</h3>
                                {getStatusBadge(game.status, isExpired)}
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
                            
                            {/* Entry fee info */}
                            <div className="mt-2 text-xs text-muted-foreground">
                              Entry Fee: {formatETH(game.entryFee)} ETH
                            </div>
                          </div>
                        )
                      })
                    ) : (
                      <div className="text-center py-12">
                        <div className="text-6xl mb-4">🎮</div>
                        <h3 className="text-xl font-semibold mb-2">No Available Rooms</h3>
                        <p className="text-muted-foreground mb-4">
                          Currently no open game rooms available. Create a new room to start playing!
                        </p>
                        <GradientButton onClick={() => navigate("/create-room")}>
                          Create Room
                        </GradientButton>
                      </div>
                    )}
                  </div>
                )}
              </CardContent>
            </Card>
          </div>

          {/* Finished Games */}
          <div>
            <Card className="shadow-card">
              <CardHeader>
                <div className="flex items-center justify-between">
                  <div>
                    <CardTitle>Finished Games</CardTitle>
                    <CardDescription>View completed games and claim rewards if you won</CardDescription>
                  </div>
                  <GradientButton
                    variant="outline"
                    size="sm"
                    onClick={() => refetchAllGames()}
                    disabled={allGamesLoading}
                  >
                    <RefreshCw className={`w-4 h-4 mr-2 ${allGamesLoading ? 'animate-spin' : ''}`} />
                    Refresh
                  </GradientButton>
                </div>
              </CardHeader>
              <CardContent>
                {allGamesLoading ? (
                  <div className="flex items-center justify-center py-12">
                    <Loader2 className="w-8 h-8 animate-spin text-primary" />
                    <span className="ml-2 text-muted-foreground">Loading finished games...</span>
                  </div>
                ) : allGamesError ? (
                  <div className="text-center py-12">
                    <div className="text-6xl mb-4">⚠️</div>
                    <h3 className="text-xl font-semibold mb-2">Failed to Load Finished Games</h3>
                    <p className="text-muted-foreground mb-4">
                      Unable to fetch finished games from the blockchain.
                    </p>
                    <GradientButton onClick={() => refetchAllGames()}>
                      Try Again
                    </GradientButton>
                  </div>
                ) : (
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    {finishedGames && finishedGames.length > 0 ? (
                      finishedGames.map((game) => {
                        const timeLeft = getTimeLeft(game.deadline)
                        const prizePool = calculatePrizePool(game.playerCount, game.entryFee)
                        const isWinner = address && game.winner && 
                                       address.toLowerCase() === game.winner.toLowerCase() &&
                                       game.winner !== "0x0000000000000000000000000000000000000000"
                        
                        return (
                          <div
                            key={game.gameId.toString()}
                            className={`p-4 border-2 rounded-lg transition-all duration-300 cursor-pointer hover:shadow-card hover:-translate-y-1 ${
                              isWinner 
                                ? "border-green-300 bg-green-50 hover:border-green-400" 
                                : game.status === CONTRACT_CONFIG.GameStatus.Calculating
                                  ? "border-yellow-300 bg-yellow-50 hover:border-yellow-400"
                                  : "border-gray-300 bg-gray-50 hover:border-gray-400"
                            }`}
                            onClick={() => handleViewFinishedGame(game.gameId)}
                          >
                            <div className="flex items-center justify-between mb-3">
                              <div className="flex items-center space-x-3">
                                <h3 className="font-semibold text-lg">{game.roomName || `Game ${game.gameId.toString()}`}</h3>
                                {getStatusBadge(game.status)}
                                {isWinner && (
                                  <Badge className="bg-green-500 text-white">
                                    <Trophy className="w-3 h-3 mr-1" />
                                    Winner
                                  </Badge>
                                )}
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
                                <span>Completed</span>
                              </div>
                            </div>

                            {/* Winner info or completion status */}
                            {game.winner && game.winner !== "0x0000000000000000000000000000000000000000" && (
                              <div className="mt-2 p-2 bg-white/50 rounded text-xs">
                                {isWinner ? (
                                  <div className="text-green-700 font-medium">
                                    🎉 You won with number {game.winningNumber}! Click to claim your prize.
                                  </div>
                                ) : (
                                  <div className="text-gray-600">
                                    Winner: {game.winner.slice(0, 6)}...{game.winner.slice(-4)} (Number: {game.winningNumber})
                                  </div>
                                )}
                              </div>
                            )}
                            
                            {/* Entry fee info */}
                            <div className="mt-2 text-xs text-muted-foreground">
                              Entry Fee: {formatETH(game.entryFee)} ETH
                            </div>
                          </div>
                        )
                      })
                    ) : (
                      <div className="text-center py-12 col-span-full">
                        <div className="text-6xl mb-4">🏆</div>
                        <h3 className="text-xl font-semibold mb-2">No Finished Games</h3>
                        <p className="text-muted-foreground mb-4">
                          No completed games found. Join some active games to see them here later!
                        </p>
                        <GradientButton onClick={() => navigate("/create-room")}>
                          Create Your First Room
                        </GradientButton>
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