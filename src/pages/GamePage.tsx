import React, { useState, useEffect } from "react"
import { useNavigate, useSearchParams } from "react-router-dom"
import { GameCard } from "@/components/ui/game-card"
import { GradientButton } from "@/components/ui/gradient-button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Avatar, AvatarImage, AvatarFallback } from "@/components/ui/avatar"
import { Trophy, Users, Clock, Home, RotateCcw, Wallet, Loader2, AlertCircle } from "lucide-react"
import { useAccount } from 'wagmi'
import { ConnectButton } from '@rainbow-me/rainbowkit'
import { useToast } from "@/hooks/use-toast"
import { useGetGameSummary, useHasPlayerSubmitted, useSubmitNumber } from "@/hooks/contract/useGameContract"
import { CONTRACT_CONFIG, formatETH, formatAddress } from "@/contracts/config"

const GamePage = () => {
  const navigate = useNavigate()
  const { toast } = useToast()
  const { address, isConnected } = useAccount()
  const [searchParams] = useSearchParams()
  
  // 从URL参数获取游戏ID
  const roomParam = searchParams.get('room')
  const gameId = roomParam ? BigInt(roomParam) : undefined
  
  // 状态管理
  const [selectedNumber, setSelectedNumber] = useState<number | null>(null)
  const [highlightedNumber, setHighlightedNumber] = useState<number | null>(null)
  
  // 获取游戏详情
  const { 
    gameSummary, 
    isError: gameError, 
    isLoading: gameLoading, 
    refetch: refetchGame 
  } = useGetGameSummary(gameId)
  
  // 检查当前用户是否已提交
  const { 
    hasSubmitted, 
    isLoading: hasSubmittedLoading,
    refetch: refetchHasSubmitted 
  } = useHasPlayerSubmitted(gameId, address)
  
  // 提交数字的hook
  const {
    submitNumber,
    isSubmitting,
    isSuccess: submitSuccess,
    error: submitError
  } = useSubmitNumber()
  
  // 处理提交成功
  useEffect(() => {
    if (submitSuccess) {
      toast({
        title: "Number submitted successfully! 🎉",
        description: "Your number has been submitted to the blockchain.",
      })
      refetchGame()
      refetchHasSubmitted()
    }
  }, [submitSuccess, toast, refetchGame, refetchHasSubmitted])
  
  // 处理提交错误
  useEffect(() => {
    if (submitError) {
      toast({
        title: "Submission failed",
        description: submitError.message || "Please try again.",
        variant: "destructive"
      })
    }
  }, [submitError, toast])

  // 计算剩余时间
  const getTimeLeft = () => {
    if (!gameSummary) return 0
    const now = Math.floor(Date.now() / 1000)
    const deadlineSeconds = Number(gameSummary.deadline)
    return Math.max(0, deadlineSeconds - now)
  }

  // 格式化时间显示
  const formatTimeLeft = (seconds: number) => {
    if (seconds <= 0) return "Expired"
    
    const hours = Math.floor(seconds / 3600)
    const minutes = Math.floor((seconds % 3600) / 60)
    const secs = seconds % 60
    
    const parts = []
    if (hours > 0) parts.push(`${hours}h`)
    if (minutes > 0) parts.push(`${minutes}m`)
    if (secs > 0) parts.push(`${secs}s`)
    
    return parts.join(' ') || '0s'
  }
  
  // 定时刷新游戏数据和时间
  useEffect(() => {
    const interval = setInterval(() => {
      if (gameSummary && gameSummary.status === CONTRACT_CONFIG.GameStatus.Open) {
        refetchGame()
      }
    }, 5000) // 每5秒刷新一次
    
    return () => clearInterval(interval)
  }, [gameSummary, refetchGame])

  // Animation for non-participating users
  useEffect(() => {
    if (!hasSubmitted && !selectedNumber && isConnected && gameSummary) {
      const numbers = generateNumberGrid()
      let currentIndex = 0
      
      const interval = setInterval(() => {
        setHighlightedNumber(numbers[currentIndex])
        currentIndex = (currentIndex + 1) % numbers.length
      }, 800)

      return () => clearInterval(interval)
    } else {
      setHighlightedNumber(null)
    }
  }, [hasSubmitted, selectedNumber, isConnected, gameSummary])

  const generateNumberGrid = () => {
    if (!gameSummary) return []
    const numbers = []
    for (let i = gameSummary.minNumber; i <= gameSummary.maxNumber; i++) {
      numbers.push(i)
    }
    return numbers
  }

  const getGridColumns = () => {
    if (!gameSummary) return 4
    const totalNumbers = gameSummary.maxNumber - gameSummary.minNumber + 1
    if (totalNumbers <= 9) return 3
    if (totalNumbers <= 16) return 4
    if (totalNumbers <= 25) return 5
    return Math.ceil(Math.sqrt(totalNumbers))
  }

  const getNumberFontClass = (number: number) => {
    // Use number to determine font style for consistency
    const fontStyles = ['game-number', 'game-number-alt', 'game-number-bold']
    return fontStyles[number % fontStyles.length]
  }

  const getNumberVariant = (number: number) => {
    // If user has submitted and this is their number
    if (hasSubmitted && selectedNumber === number) return "selected"
    
    // If user is selecting (but not submitted yet)
    if (!hasSubmitted && selectedNumber === number) return "selected"
    
    // If user hasn't submitted and this number is highlighted by animation
    if (!hasSubmitted && !selectedNumber && highlightedNumber === number) return "highlighted"
    
    // Default available state
    return "available"
  }

  const handleNumberSelect = (number: number) => {
    if (!isConnected) {
      toast({
        title: "Wallet not connected",
        description: "Please connect your wallet to make a selection.",
        variant: "destructive"
      })
      return
    }

    // Prevent selection if user has already submitted
    if (hasSubmitted) {
      toast({
        title: "Already submitted",
        description: "You have already submitted your number for this game.",
        variant: "destructive"
      })
      return
    }
    
    // Check if game is still open
    if (!gameSummary || gameSummary.status !== CONTRACT_CONFIG.GameStatus.Open) {
      toast({
        title: "Game not available",
        description: "This game is no longer accepting submissions.",
        variant: "destructive"
      })
      return
    }
    
    // Allow selection of any number
    setSelectedNumber(selectedNumber === number ? null : number)
  }

  const handleConfirmChoice = async () => {
    if (!isConnected || !gameId || !selectedNumber || !gameSummary) {
      toast({
        title: "Cannot submit",
        description: "Please make sure you're connected and have selected a number.",
        variant: "destructive"
      })
      return
    }
    
    try {
      toast({
        title: "Encrypting number...",
        description: "Preparing your number with FHE encryption.",
      })
      
      // 调用更新后的 submitNumber，它现在包含 FHE 加密
      await submitNumber(gameId, selectedNumber, formatETH(gameSummary.entryFee))
      
      toast({
        title: "Transaction submitted",
        description: "Please confirm the transaction in your wallet.",
      })
    } catch (error) {
      console.error('Error submitting number:', error)
      
      // 提供更详细的错误信息
      let errorMessage = "Please try again."
      if (error instanceof Error) {
        if (error.message.includes('FHEVM')) {
          errorMessage = "FHE encryption failed. Please check your network connection."
        } else if (error.message.includes('Wallet not connected')) {
          errorMessage = "Please connect your wallet first."
        } else {
          errorMessage = error.message
        }
      }
      
      toast({
        title: "Submission failed",
        description: errorMessage,
        variant: "destructive"
      })
    }
  }

  // 如果没有游戏ID，显示错误
  if (!gameId) {
    return (
      <div className="h-screen bg-gradient-background p-3 flex items-center justify-center">
        <Card className="max-w-md">
          <CardContent className="p-6 text-center">
            <AlertCircle className="w-12 h-12 mx-auto mb-4 text-destructive" />
            <h3 className="text-xl font-semibold mb-2">Invalid Room</h3>
            <p className="text-muted-foreground mb-4">
              No room ID provided. Please use a valid room link.
            </p>
            <GradientButton onClick={() => navigate("/join-room")}>
              Browse Rooms
            </GradientButton>
          </CardContent>
        </Card>
      </div>
    )
  }

  // 加载状态
  if (gameLoading || hasSubmittedLoading) {
    return (
      <div className="h-screen bg-gradient-background p-3 flex items-center justify-center">
        <Card className="max-w-md">
          <CardContent className="p-6 text-center">
            <Loader2 className="w-12 h-12 mx-auto mb-4 animate-spin text-primary" />
            <h3 className="text-xl font-semibold mb-2">Loading Game</h3>
            <p className="text-muted-foreground">
              Fetching game data from blockchain...
            </p>
          </CardContent>
        </Card>
      </div>
    )
  }

  // 错误状态
  if (gameError || !gameSummary) {
    return (
      <div className="h-screen bg-gradient-background p-3 flex items-center justify-center">
        <Card className="max-w-md">
          <CardContent className="p-6 text-center">
            <AlertCircle className="w-12 h-12 mx-auto mb-4 text-destructive" />
            <h3 className="text-xl font-semibold mb-2">Game Not Found</h3>
            <p className="text-muted-foreground mb-4">
              Room #{gameId.toString()} could not be found or loaded.
            </p>
            <div className="space-y-2">
              <GradientButton onClick={() => refetchGame()} className="w-full">
                Try Again
              </GradientButton>
              <GradientButton variant="outline" onClick={() => navigate("/join-room")} className="w-full">
                Browse Other Rooms
              </GradientButton>
            </div>
          </CardContent>
        </Card>
      </div>
    )
  }

  const timeLeft = getTimeLeft()

  return (
    <div className="h-screen bg-gradient-background p-3 overflow-hidden">
      <div className="max-w-6xl mx-auto h-full flex flex-col">
        {/* Compact Header */}
        <div className="flex items-center justify-between mb-3">
          <div className="flex items-center space-x-3">
            <GradientButton 
              variant="outline" 
              size="sm"
              onClick={() => navigate("/")}
            >
              <Home className="w-4 h-4 mr-1" />
              Home
            </GradientButton>
            <Badge variant="secondary" className="px-3 py-1">
              Room #{gameId.toString()}
            </Badge>
            <Badge 
              variant={gameSummary.status === CONTRACT_CONFIG.GameStatus.Open ? "default" : "destructive"}
              className="px-3 py-1"
            >
              {CONTRACT_CONFIG.GameStatus.Open === gameSummary.status ? "Open" : 
               CONTRACT_CONFIG.GameStatus.Calculating === gameSummary.status ? "Calculating" : 
               CONTRACT_CONFIG.GameStatus.Finished === gameSummary.status ? "Finished" : "Completed"}
            </Badge>
          </div>
          
          <div className="flex items-center space-x-3">
            <ConnectButton />
            <GradientButton 
              variant="secondary" 
              size="sm"
              onClick={() => refetchGame()}
              disabled={gameLoading}
            >
              <RotateCcw className={`w-4 h-4 mr-1 ${gameLoading ? 'animate-spin' : ''}`} />
              Refresh
            </GradientButton>
          </div>
        </div>

        {/* Main Game Layout - 2 Column */}
        <div className="flex-1 grid grid-cols-4 gap-4">
          {/* Left Panel: Status & Player Slots */}
          <div className="col-span-1 space-y-3">
            {/* Top Row: Timer & Prize Pool */}
            <div className="grid grid-cols-2 gap-2">
              <Card className="shadow-card">
                <CardContent className="p-2 text-center">
                  <div className="flex items-center justify-center space-x-1 mb-1">
                    <Clock className={`w-3 h-3 ${timeLeft <= 60 && timeLeft > 0 ? 'text-destructive animate-timer-urgent' : 'text-primary'}`} />
                    <span className={`text-sm font-mono font-bold ${
                      timeLeft <= 60 && timeLeft > 0 ? 'animate-timer-urgent' : 
                      timeLeft === 0 ? 'text-destructive' : 'text-primary'
                    }`}>
                      {formatTimeLeft(timeLeft)}
                    </span>
                  </div>
                  <div className="text-xs text-muted-foreground">Time Left</div>
                </CardContent>
              </Card>

              <Card className="bg-gradient-primary shadow-card">
                <CardContent className="p-2 text-center">
                  <Trophy className="w-3 h-3 mx-auto mb-1 text-primary-foreground" />
                  <div className="text-sm font-bold text-primary-foreground">
                    {formatETH(gameSummary.prizePool)} ETH
                  </div>
                  <div className="text-xs text-primary-foreground/80">Prize Pool</div>
                </CardContent>
              </Card>
            </div>

            {/* Bottom Row: My Choice & Players */}
            <div className="grid grid-cols-2 gap-2">
              <Card className="bg-gradient-secondary shadow-card">
                <CardContent className="p-2 text-center">
                  <div className="text-lg font-bold text-secondary-foreground mb-1">
                    {selectedNumber || "?"}
                  </div>
                  {hasSubmitted && selectedNumber && (
                    <Badge variant="default" className="text-xs mb-1">Submitted</Badge>
                  )}
                  {isSubmitting && (
                    <Badge variant="outline" className="text-xs mb-1">
                      <Loader2 className="w-3 h-3 mr-1 animate-spin" />
                      Submitting...
                    </Badge>
                  )}
                  <div className="text-xs text-secondary-foreground/80">My Choice</div>
                </CardContent>
              </Card>

              <Card className="shadow-card">
                <CardContent className="p-2 text-center">
                  <Users className="w-3 h-3 mx-auto mb-1 text-primary" />
                  <div className="text-sm font-bold text-primary">
                    {gameSummary.playerCount}/{gameSummary.maxPlayers}
                  </div>
                  <div className="text-xs text-muted-foreground">Players</div>
                </CardContent>
              </Card>
            </div>

            {/* Entry Fee Display */}
            <Card className="shadow-card bg-gradient-primary">
              <CardContent className="p-3 text-center space-y-1">
                <div className="flex items-center justify-center space-x-2">
                  <Wallet className="w-4 h-4 text-primary-foreground" />
                  <span className="text-sm font-medium text-primary-foreground">Entry Fee Required</span>
                </div>
                <div className="text-xl font-bold text-primary-foreground">
                  {formatETH(gameSummary.entryFee)} ETH
                </div>
                <div className="text-xs text-primary-foreground/80">
                  To participate in this room
                </div>
              </CardContent>
            </Card>

            {/* Game Info */}
            <Card className="shadow-card">
              <CardContent className="p-3">
                <div className="space-y-3">
                  <div className="text-center">
                    <h4 className="font-semibold text-sm mb-1">{gameSummary.roomName}</h4>
                    <p className="text-xs text-muted-foreground">
                      Numbers: {gameSummary.minNumber}-{gameSummary.maxNumber}
                    </p>
                  </div>
                  
                  <div className="grid grid-cols-2 gap-2 text-xs">
                    <div className="text-center p-2 bg-muted/20 rounded">
                      <div className="font-semibold">{formatETH(gameSummary.entryFee)} ETH</div>
                      <div className="text-muted-foreground">Entry Fee</div>
                    </div>
                    <div className="text-center p-2 bg-muted/20 rounded">
                      <div className="font-semibold">
                        {gameSummary.winner !== "0x0000000000000000000000000000000000000000" ? 
                          formatAddress(gameSummary.winner) : "TBD"}
                      </div>
                      <div className="text-muted-foreground">Winner</div>
                    </div>
                  </div>
                  
                  {/* Player capacity bar */}
                  <div>
                    <div className="flex justify-between text-xs text-muted-foreground mb-1">
                      <span>Players</span>
                      <span>{gameSummary.playerCount}/{gameSummary.maxPlayers}</span>
                    </div>
                    <div className="w-full bg-muted rounded-full h-2">
                      <div 
                        className="bg-gradient-primary h-2 rounded-full transition-all duration-300"
                        style={{ width: `${(gameSummary.playerCount / gameSummary.maxPlayers) * 100}%` }}
                      />
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Main Game Area */}
          <div className="col-span-3">
            <Card className="shadow-card">
              <CardContent className="flex flex-col p-3">
                {/* Number Grid - Natural sizing */}
                <div 
                  className={`grid gap-2 place-items-stretch items-center`}
                  style={{
                    gridTemplateColumns: `repeat(${getGridColumns()}, minmax(0, 1fr))`,
                    gridTemplateRows: `repeat(${Math.ceil(generateNumberGrid().length / getGridColumns())}, minmax(120px, 1fr))`
                  }}
                >
                  {generateNumberGrid().map((number) => (
                    <GameCard
                      key={number}
                      variant={getNumberVariant(number)}
                      className={`w-full h-full min-h-[120px] text-4xl ${getNumberFontClass(number)} transition-all hover:scale-105 ${
                        hasSubmitted || isSubmitting ? 'cursor-not-allowed' : 'cursor-pointer'
                      } ${
                        highlightedNumber === number && !hasSubmitted && !selectedNumber 
                          ? 'animate-highlight-pulse' 
                          : ''
                      } ${
                        hasSubmitted && selectedNumber === number
                          ? 'animate-selected-glow'
                          : ''
                      }`}
                      onClick={() => handleNumberSelect(number)}
                    >
                      {number}
                    </GameCard>
                  ))}
                </div>

                {/* Bottom Section - With appropriate spacing */}
                <div className="mt-6 space-y-2">
                  {/* Wallet Warning - Compact */}
                  {!isConnected && (
                    <div className="p-2 bg-orange-50 border border-orange-200 rounded text-center">
                      <div className="flex items-center justify-center space-x-2 text-orange-700">
                        <Wallet className="w-4 h-4" />
                        <span className="text-sm">Connect wallet to play</span>
                      </div>
                    </div>
                  )}

                  {/* Game Status Messages */}
                  {gameSummary?.status !== CONTRACT_CONFIG.GameStatus.Open && (
                    <div className="p-2 bg-yellow-50 border border-yellow-200 rounded text-center">
                      <div className="flex items-center justify-center space-x-2 text-yellow-700">
                        <Clock className="w-4 h-4" />
                        <span className="text-sm">
                          {gameSummary?.status === CONTRACT_CONFIG.GameStatus.Calculating ? "Game is calculating results..." :
                           gameSummary?.status === CONTRACT_CONFIG.GameStatus.Finished ? "Game has finished" :
                           "Game is no longer accepting submissions"}
                        </span>
                      </div>
                    </div>
                  )}

                  {/* Status Message - Enhanced */}
                  {selectedNumber && !hasSubmitted && isConnected && gameSummary?.status === CONTRACT_CONFIG.GameStatus.Open && (
                    <div className="p-2 bg-accent/20 rounded text-center">
                      <span className="text-sm text-accent-foreground">
                        Selected: <span className="font-bold text-lg">{selectedNumber}</span>
                      </span>
                    </div>
                  )}

                  {/* Action Buttons - Enhanced */}
                  {!hasSubmitted && isConnected && gameSummary?.status === CONTRACT_CONFIG.GameStatus.Open && (
                    <div className="grid grid-cols-2 gap-4">
                      <GradientButton 
                        variant="game" 
                        size="lg"
                        disabled={!selectedNumber || isSubmitting || timeLeft === 0}
                        className="w-full h-12 text-base font-semibold"
                        onClick={handleConfirmChoice}
                      >
                        {isSubmitting ? (
                          <>
                            <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                            Submitting...
                          </>
                        ) : timeLeft === 0 ? (
                          "Time Expired"
                        ) : (
                          "Confirm Choice"
                        )}
                      </GradientButton>
                      
                      <GradientButton 
                        variant="outline" 
                        size="lg"
                        onClick={() => setSelectedNumber(null)}
                        className="w-full h-12 text-base"
                        disabled={isSubmitting}
                      >
                        Clear Selection
                      </GradientButton>
                    </div>
                  )}

                  {/* User Already Submitted Message */}
                  {hasSubmitted && (
                    <div className="p-2 bg-green-50 border border-green-200 rounded text-center">
                      <div className="flex items-center justify-center space-x-2 text-green-700">
                        <Trophy className="w-5 h-5" />
                        <span className="text-sm font-medium">
                          Number submitted successfully! Waiting for other players...
                        </span>
                      </div>
                    </div>
                  )}

                  {/* Game Time Expired */}
                  {gameSummary?.status === CONTRACT_CONFIG.GameStatus.Open && getTimeLeft() === 0 && (
                    <div className="p-2 bg-red-50 border border-red-200 rounded text-center">
                      <div className="flex items-center justify-center space-x-2 text-red-700">
                        <Clock className="w-4 h-4" />
                        <span className="text-sm font-medium">
                          Time expired! Game is ready for calculation.
                        </span>
                      </div>
                    </div>
                  )}
                </div>
              </CardContent>
            </Card>
          </div>

        </div>
      </div>
    </div>
  )
}

export default GamePage
