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
import { useGetActiveGames, useGetGameSummary } from "@/hooks/contract/useGameContract"
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
  
  // 定时刷新游戏列表
  useEffect(() => {
    const interval = setInterval(() => {
      refetchGames()
    }, 10000) // 每10秒刷新一次
    
    return () => clearInterval(interval)
  }, [refetchGames])

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

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Left Side - Join by Code */}
          <div className="lg:col-span-1">
            <Card className="shadow-card h-fit">
              <CardHeader>
                <CardTitle className="flex items-center space-x-2">
                  <Search className="w-5 h-5" />
                  <span>Room Code</span>
                </CardTitle>
                <CardDescription>Enter 6-digit room code to join directly</CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                {!isConnected && (
                  <Card className="border-orange-200 bg-orange-50">
                    <CardContent className="p-3">
                      <div className="flex items-center space-x-2 text-orange-700">
                        <Wallet className="w-4 h-4" />
                        <span className="text-sm">Connect wallet to join rooms</span>
                      </div>
                    </CardContent>
                  </Card>
                )}
                
                <div className="space-y-2">
                  <Label htmlFor="roomCode">Room Code</Label>
                  <Input
                    id="roomCode"
                    placeholder="e.g: ABC123"
                    value={roomCode}
                    onChange={(e) => setRoomCode(e.target.value.toUpperCase())}
                    maxLength={6}
                    className="text-center text-lg font-mono"
                    disabled={!isConnected}
                  />
                </div>
                
                <GradientButton
                  className="w-full"
                  onClick={handleJoinByCode}
                  disabled={isJoining || roomCode.length < 6 || !isConnected}
                >
                  {isJoining ? "Joining..." : !isConnected ? "Connect Wallet First" : "Join Room"}
                </GradientButton>

                <div className="pt-4 border-t">
                  <GradientButton
                    variant="outline"
                    className="w-full"
                    onClick={() => navigate("/create-room")}
                  >
                    Create New Room
                  </GradientButton>
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Right Side - Available Rooms */}
          <div className="lg:col-span-2">
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
                    onClick={() => refetchGames()}
                    disabled={gamesLoading}
                  >
                    <RefreshCw className={`w-4 h-4 mr-2 ${gamesLoading ? 'animate-spin' : ''}`} />
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
        </div>
      </div>
    </div>
  )
}

export default JoinRoom