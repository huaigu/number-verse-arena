import React, { useState, useEffect, useMemo } from "react"
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
import { useGetGameSummary, useHasPlayerSubmitted, useSubmitNumber, useFindWinner, useClaimPrize, useHasPlayerClaimed, useCanFinalizeGame, useGetAllGames } from "@/hooks/contract/useGameContract"
import { CONTRACT_CONFIG, formatETH, formatAddress, Game, GameSummary } from "@/contracts/config"

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
  const [previousGameStatus, setPreviousGameStatus] = useState<number | null>(null)
  
  // 获取游戏详情
  const { 
    gameSummary, 
    isError: gameError, 
    isLoading: gameLoading, 
    refetch: refetchGame,
    error: gameErrorDetails
  } = useGetGameSummary(gameId)

  // 备用方案：如果无法获取游戏摘要，尝试从所有游戏中获取
  const { 
    games: allGames, 
    isLoading: allGamesLoading 
  } = useGetAllGames()

  // 从所有游戏中找到目标游戏作为备用数据
  const fallbackGame = useMemo(() => {
    if (!allGames || !gameId) return null
    return allGames.find(game => game.gameId === gameId)
  }, [allGames, gameId])

  // 转换Game数据为GameSummary格式
  const convertGameToSummary = useMemo(() => {
    if (!fallbackGame) return null
    
    const gameSummaryFromGame: GameSummary = {
      gameId: fallbackGame.gameId,
      roomName: fallbackGame.roomName,
      creator: fallbackGame.creator,
      status: fallbackGame.status,
      playerCount: fallbackGame.playerCount,
      maxPlayers: fallbackGame.maxPlayers,
      minNumber: fallbackGame.minNumber,
      maxNumber: fallbackGame.maxNumber,
      entryFee: fallbackGame.entryFee,
      deadline: fallbackGame.deadline,
      prizePool: fallbackGame.entryFee * BigInt(fallbackGame.playerCount),
      winner: fallbackGame.status >= CONTRACT_CONFIG.GameStatus.Finished ? '0x0000000000000000000000000000000000000000' : '0x0000000000000000000000000000000000000000',
      winningNumber: fallbackGame.decryptedWinner || 0
    }
    
    return gameSummaryFromGame
  }, [fallbackGame])

  // 使用主要数据或备用数据
  const finalGameSummary = gameSummary || convertGameToSummary
  
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
  
  // 检查当前用户是否已领取奖金
  const { 
    hasClaimed, 
    isLoading: hasClaimedLoading,
    refetch: refetchHasClaimed 
  } = useHasPlayerClaimed(gameId, address)
  
  // 触发开奖的hook
  const {
    findWinner,
    isFinding,
    isSuccess: findSuccess,
    error: findError
  } = useFindWinner()
  
  // 领取奖金的hook
  const {
    claimPrize,
    isClaiming,
    isSuccess: claimSuccess,
    error: claimError
  } = useClaimPrize()
  
  // 检查游戏是否可以结束
  const { 
    canFinalize, 
    isLoading: canFinalizeLoading,
    refetch: refetchCanFinalize 
  } = useCanFinalizeGame(gameId)
  
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
  
  // 处理开奖成功 - 添加重试机制获取winner信息
  useEffect(() => {
    if (findSuccess) {
      toast({
        title: "Game revealed! 🎉",
        description: "Fetching winner information...",
      })
      
      // 立即刷新一次
      refetchGame()
      refetchCanFinalize()
      
      // 设置重试机制，每3秒重试一次，最多5次
      let retryCount = 0
      const maxRetries = 5
      
      const retryInterval = setInterval(async () => {
        try {
          // 重新获取游戏数据
          const result = await refetchGame()
          
          // 检查是否已获取到winner信息
          const gameData = result.data as typeof finalGameSummary
          const hasWinner = gameData?.winner && gameData.winner !== "0x0000000000000000000000000000000000000000"
          
          if (hasWinner) {
            // 成功获取winner信息
            clearInterval(retryInterval)
            toast({
              title: "Winner information loaded! 🎉",
              description: "Game results are now available.",
            })
          } else {
            retryCount++
            if (retryCount >= maxRetries) {
              // 达到最大重试次数
              clearInterval(retryInterval)
              toast({
                title: "Winner information pending",
                description: "Please refresh the page manually to see results.",
                variant: "destructive"
              })
            } else {
              // 继续重试
              toast({
                title: `Fetching winner... (${retryCount}/${maxRetries})`,
                description: "Waiting for blockchain confirmation.",
              })
            }
          }
        } catch (error) {
          console.error('Error fetching winner info:', error)
          retryCount++
          if (retryCount >= maxRetries) {
            clearInterval(retryInterval)
            toast({
              title: "Error fetching winner",
              description: "Please refresh the page to see results.",
              variant: "destructive"
            })
          }
        }
      }, 3000) // 每3秒重试一次
      
      // 清理函数
      return () => {
        clearInterval(retryInterval)
      }
    }
  }, [findSuccess, toast, refetchGame, refetchCanFinalize, finalGameSummary])
  
  // 处理开奖错误
  useEffect(() => {
    if (findError) {
      toast({
        title: "Reveal failed",
        description: findError.message || "Please try again.",
        variant: "destructive"
      })
    }
  }, [findError, toast])
  
  // 处理领取成功
  useEffect(() => {
    if (claimSuccess) {
      toast({
        title: "Prize claimed! 🎉",
        description: "Your winnings have been transferred to your wallet.",
      })
      refetchGame()
      refetchHasClaimed()
    }
  }, [claimSuccess, toast, refetchGame, refetchHasClaimed])
  
  // 处理领取错误
  useEffect(() => {
    if (claimError) {
      toast({
        title: "Claim failed",
        description: claimError.message || "Please try again.",
        variant: "destructive"
      })
    }
  }, [claimError, toast])

  // 监听游戏状态变为 Calculating 并自动刷新结果
  useEffect(() => {
    const currentStatus = finalGameSummary?.status
    
    // 检查状态是否从非 Calculating 变为 Calculating
    if (currentStatus === CONTRACT_CONFIG.GameStatus.Calculating && 
        previousGameStatus !== null && 
        previousGameStatus !== CONTRACT_CONFIG.GameStatus.Calculating) {
      
      toast({
        title: "Game calculating! 🎲",
        description: "Automatically fetching results...",
      })
      
      // 立即刷新一次
      refetchGame()
      refetchCanFinalize()
      
      // 设置自动刷新机制，每3秒重试一次，最多8次
      let retryCount = 0
      const maxRetries = 8
      
      const autoRefreshInterval = setInterval(async () => {
        try {
          // 重新获取游戏数据
          const result = await refetchGame()
          
          // 检查是否已获取到winner信息
          const gameData = result.data as typeof finalGameSummary
          const hasWinner = gameData?.winner && gameData.winner !== "0x0000000000000000000000000000000000000000"
          
          if (hasWinner) {
            // 成功获取winner信息
            clearInterval(autoRefreshInterval)
            toast({
              title: "Results loaded! 🎉",
              description: "Game calculation complete.",
            })
          } else {
            retryCount++
            if (retryCount >= maxRetries) {
              // 达到最大重试次数
              clearInterval(autoRefreshInterval)
              toast({
                title: "Still calculating...",
                description: "You can manually refresh for updates.",
              })
            } else {
              // 继续重试，但不显示太多提示以避免spam
              if (retryCount % 3 === 0) { // 每隔3次重试才显示一次提示
                toast({
                  title: `Checking results... (${retryCount}/${maxRetries})`,
                  description: "Waiting for blockchain calculation.",
                })
              }
            }
          }
        } catch (error) {
          console.error('Error auto-fetching results:', error)
          retryCount++
          if (retryCount >= maxRetries) {
            clearInterval(autoRefreshInterval)
            toast({
              title: "Auto-refresh stopped",
              description: "Please refresh manually to see results.",
              variant: "destructive"
            })
          }
        }
      }, 3000) // 每3秒重试一次
      
      // 清理函数
      return () => {
        clearInterval(autoRefreshInterval)
      }
    }
    
    // 更新之前的状态
    if (currentStatus !== undefined) {
      setPreviousGameStatus(currentStatus)
    }
  }, [finalGameSummary?.status, previousGameStatus, toast, refetchGame, refetchCanFinalize])

  // 计算剩余时间
  const getTimeLeft = () => {
    if (!finalGameSummary) return 0
    const now = Math.floor(Date.now() / 1000)
    const deadlineSeconds = Number(finalGameSummary.deadline)
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
      if (finalGameSummary && finalGameSummary.status === CONTRACT_CONFIG.GameStatus.Open) {
        refetchGame()
      }
    }, 5000) // 每5秒刷新一次
    
    return () => clearInterval(interval)
  }, [finalGameSummary, refetchGame])

  // Animation for non-participating users
  useEffect(() => {
    if (!hasSubmitted && !selectedNumber && isConnected && finalGameSummary) {
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
  }, [hasSubmitted, selectedNumber, isConnected, finalGameSummary])

  const generateNumberGrid = () => {
    if (!finalGameSummary) return []
    const numbers = []
    for (let i = finalGameSummary.minNumber; i <= finalGameSummary.maxNumber; i++) {
      numbers.push(i)
    }
    return numbers
  }

  const getGridColumns = () => {
    if (!finalGameSummary) return 4
    const totalNumbers = finalGameSummary.maxNumber - finalGameSummary.minNumber + 1
    if (totalNumbers <= 9) return 3
    if (totalNumbers <= 16) return 4
    if (totalNumbers <= 25) return 5
    if (totalNumbers <= 36) return 6
    if (totalNumbers <= 49) return 7
    return Math.ceil(Math.sqrt(totalNumbers))
  }

  const getGridCellSize = () => {
    if (!finalGameSummary) return { minHeight: '120px', maxHeight: '120px' }
    const totalNumbers = finalGameSummary.maxNumber - finalGameSummary.minNumber + 1
    if (totalNumbers <= 9) return { minHeight: '120px', maxHeight: '150px' }
    if (totalNumbers <= 16) return { minHeight: '100px', maxHeight: '120px' }
    if (totalNumbers <= 25) return { minHeight: '80px', maxHeight: '100px' }
    if (totalNumbers <= 36) return { minHeight: '70px', maxHeight: '90px' }
    if (totalNumbers <= 49) return { minHeight: '60px', maxHeight: '80px' }
    return { minHeight: '50px', maxHeight: '70px' }
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
    if (!finalGameSummary || finalGameSummary.status !== CONTRACT_CONFIG.GameStatus.Open) {
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
    if (!isConnected || !selectedNumber || !finalGameSummary) {
      toast({
        title: "Cannot submit",
        description: "Please make sure you're connected and have selected a number.",
        variant: "destructive"
      })
      return
    }
    
    try {
      toast({
        title: "🔐 Encrypting your number...",
        description: "This may take 10-30 seconds due to FHE encryption. Please wait...",
      })
      
      // 调用更新后的 submitNumber，它现在包含 FHE 加密
      await submitNumber(gameId, selectedNumber, formatETH(finalGameSummary.entryFee))
      
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

  // 处理开奖操作
  const handleRevealWinner = async () => {
    if (gameId === undefined) {
      toast({
        title: "Cannot reveal",
        description: "Game ID is missing.",
        variant: "destructive"
      })
      return
    }
    
    try {
      await findWinner(gameId)
      toast({
        title: "Revealing winner...",
        description: "Please confirm the transaction in your wallet.",
      })
    } catch (error) {
      console.error('Error revealing winner:', error)
    }
  }

  // 处理领取奖金操作
  const handleClaimPrize = async () => {
    if (gameId === undefined) {
      toast({
        title: "Cannot claim",
        description: "Game ID is missing.",
        variant: "destructive"
      })
      return
    }
    
    try {
      await claimPrize(gameId)
      toast({
        title: "Claiming prize...",
        description: "Please confirm the transaction in your wallet.",
      })
    } catch (error) {
      console.error('Error claiming prize:', error)
    }
  }

  // 检查当前用户是否为获胜者
  const isCurrentUserWinner = () => {
    return address && finalGameSummary?.winner && 
           address.toLowerCase() === finalGameSummary.winner.toLowerCase() &&
           finalGameSummary.winner !== "0x0000000000000000000000000000000000000000"
  }

  // 检查游戏是否已解密（有获胜者且获胜者不是零地址）
  const isGameDecrypted = () => {
    return finalGameSummary?.winner && 
           finalGameSummary.winner !== "0x0000000000000000000000000000000000000000"
  }

  // 如果没有游戏ID，显示错误
  if (gameId === undefined) {
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

  // 加载状态 - 如果主要数据在加载，或者主要数据失败但备用数据还在加载
  const isLoading = gameLoading || hasSubmittedLoading || hasClaimedLoading || (!gameSummary && allGamesLoading)
  
  if (isLoading) {
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

  // 错误状态 - 只有在主要数据和备用数据都失败/不存在时才显示错误
  if ((gameError || !gameSummary) && !finalGameSummary) {
    // 为调试添加更详细的错误信息
    console.log('GamePage Error:', {
      gameError,
      gameSummary,
      gameId: gameId?.toString(),
      gameErrorDetails,
      errorMessage: gameErrorDetails?.message || 'No error details available'
    })

    return (
      <div className="min-h-screen bg-gradient-background p-3 flex items-center justify-center">
        <Card className="max-w-md">
          <CardContent className="p-6 text-center">
            <AlertCircle className="w-12 h-12 mx-auto mb-4 text-destructive" />
            <h3 className="text-xl font-semibold mb-2">Game Load Error</h3>
            <p className="text-muted-foreground mb-2">
              Room #{gameId?.toString()} could not be loaded.
            </p>
            {(gameError || gameErrorDetails) && (
              <div className="text-sm text-muted-foreground mb-4 p-2 bg-muted rounded">
                <strong>Error:</strong> {gameErrorDetails?.message || 'Unknown error'}
              </div>
            )}
            <p className="text-xs text-muted-foreground mb-4">
              This might be an expired game or network issue.
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
    <div className="min-h-screen bg-gradient-background p-3">
      <div className="max-w-6xl mx-auto flex flex-col">
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
              variant={finalGameSummary.status === CONTRACT_CONFIG.GameStatus.Open ? "default" : "destructive"}
              className="px-3 py-1"
            >
              {CONTRACT_CONFIG.GameStatus.Open === finalGameSummary.status ? "Open" : 
               CONTRACT_CONFIG.GameStatus.Calculating === finalGameSummary.status ? "Calculating" : 
               CONTRACT_CONFIG.GameStatus.Finished === finalGameSummary.status ? "Finished" : "Completed"}
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
        <div className="grid grid-cols-4 gap-4 pb-6">
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
                    {formatETH(finalGameSummary.prizePool)} ETH
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
                    {finalGameSummary.playerCount}/{finalGameSummary.maxPlayers}
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
                  {formatETH(finalGameSummary.entryFee)} ETH
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
                    <h4 className="font-semibold text-sm mb-1">{finalGameSummary.roomName}</h4>
                    <p className="text-xs text-muted-foreground">
                      Numbers: {finalGameSummary.minNumber}-{finalGameSummary.maxNumber}
                    </p>
                  </div>
                  
                  <div className="grid grid-cols-2 gap-2 text-xs">
                    <div className="text-center p-2 bg-muted/20 rounded">
                      <div className="font-semibold">{formatETH(finalGameSummary.entryFee)} ETH</div>
                      <div className="text-muted-foreground">Entry Fee</div>
                    </div>
                    <div className="text-center p-2 bg-muted/20 rounded">
                      <div className="font-semibold">
                        {finalGameSummary.winner !== "0x0000000000000000000000000000000000000000" ? 
                          formatAddress(finalGameSummary.winner) : "TBD"}
                      </div>
                      <div className="text-muted-foreground">Winner</div>
                    </div>
                  </div>
                  
                  {/* Player capacity bar */}
                  <div>
                    <div className="flex justify-between text-xs text-muted-foreground mb-1">
                      <span>Players</span>
                      <span>{finalGameSummary.playerCount}/{finalGameSummary.maxPlayers}</span>
                    </div>
                    <div className="w-full bg-muted rounded-full h-2">
                      <div 
                        className="bg-gradient-primary h-2 rounded-full transition-all duration-300"
                        style={{ width: `${(finalGameSummary.playerCount / finalGameSummary.maxPlayers) * 100}%` }}
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
              <CardContent className="p-3">
                {/* Number Grid - Responsive sizing */}
                <div className="mb-6">
                  <div 
                    className="grid gap-2 place-items-stretch"
                    style={{
                      gridTemplateColumns: `repeat(${getGridColumns()}, minmax(0, 1fr))`,
                    }}
                  >
                    {generateNumberGrid().map((number) => {
                      const cellSize = getGridCellSize();
                      const totalNumbers = finalGameSummary.maxNumber - finalGameSummary.minNumber + 1;
                      
                      // Adjust font size based on grid size
                      let fontSize = 'text-4xl';
                      if (totalNumbers > 25) fontSize = 'text-3xl';
                      if (totalNumbers > 36) fontSize = 'text-2xl';
                      if (totalNumbers > 49) fontSize = 'text-xl';
                      
                      return (
                        <GameCard
                          key={number}
                          variant={getNumberVariant(number)}
                          className={`w-full aspect-square ${fontSize} ${getNumberFontClass(number)} transition-all hover:scale-105 ${
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
                          style={{ minHeight: cellSize.minHeight, maxHeight: cellSize.maxHeight }}
                          onClick={() => handleNumberSelect(number)}
                        >
                          {number}
                        </GameCard>
                      );
                    })}
                </div>

                </div>
                
                {/* Bottom Section - Always visible */}
                <div className="space-y-2">
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
                  {finalGameSummary?.status !== CONTRACT_CONFIG.GameStatus.Open && !isGameDecrypted() && (
                    <div className="p-2 bg-yellow-50 border border-yellow-200 rounded text-center">
                      <div className="flex items-center justify-center space-x-2 text-yellow-700">
                        <Clock className="w-4 h-4" />
                        <span className="text-sm">
                          {finalGameSummary?.status === CONTRACT_CONFIG.GameStatus.Calculating ? "Waiting for game results..." :
                           finalGameSummary?.status === CONTRACT_CONFIG.GameStatus.Finished ? "Game has finished" :
                           "Game is no longer accepting submissions"}
                        </span>
                      </div>
                    </div>
                  )}

                  {/* Status Message - Enhanced */}
                  {selectedNumber && !hasSubmitted && isConnected && finalGameSummary?.status === CONTRACT_CONFIG.GameStatus.Open && (
                    <div className="p-2 bg-accent/20 rounded text-center">
                      <span className="text-sm text-accent-foreground">
                        Selected: <span className="font-bold text-lg">{selectedNumber}</span>
                      </span>
                    </div>
                  )}

                  {/* Action Buttons - Enhanced */}
                  {!hasSubmitted && isConnected && finalGameSummary?.status === CONTRACT_CONFIG.GameStatus.Open && (
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
                  {hasSubmitted && finalGameSummary?.status !== CONTRACT_CONFIG.GameStatus.PrizeClaimed && !isGameDecrypted() && (
                    <div className="p-2 bg-green-50 border border-green-200 rounded text-center">
                      <div className="flex items-center justify-center space-x-2 text-green-700">
                        <Trophy className="w-5 h-5" />
                        <span className="text-sm font-medium">
                          Number submitted successfully! Waiting for other players...
                        </span>
                      </div>
                    </div>
                  )}

                  {/* Game Time Expired - No players */}
                  {finalGameSummary?.status === CONTRACT_CONFIG.GameStatus.Open && getTimeLeft() === 0 && !canFinalize && (
                    <div className="p-2 bg-red-50 border border-red-200 rounded text-center">
                      <div className="flex items-center justify-center space-x-2 text-red-700">
                        <Clock className="w-4 h-4" />
                        <span className="text-sm font-medium">
                          Time expired! No players joined this game.
                        </span>
                      </div>
                    </div>
                  )}

                  {/* Game Result Section */}
                  {isGameDecrypted() && (
                    <div className="space-y-4">
                      {/* Header Section */}
                      <div className="text-center">
                        <Trophy className="w-8 h-8 mx-auto mb-2 text-purple-600" />
                        <h3 className="text-xl font-bold text-purple-800">Game Completed!</h3>
                      </div>
                      
                      {isCurrentUserWinner() ? (
                        /* Winner View */
                        <div className="space-y-3">
                          <div className="p-4 bg-gradient-to-r from-green-50 to-emerald-50 border border-green-200 rounded-lg text-center">
                            <div className="text-green-800 font-bold text-lg mb-2">🎉 Congratulations! You won!</div>
                            <div className="flex justify-center items-center space-x-6 text-green-700">
                              <div>
                                <div className="text-sm font-medium">Your winning number</div>
                                <div className="text-2xl font-bold">{finalGameSummary.winningNumber}</div>
                              </div>
                              <div>
                                <div className="text-sm font-medium">Prize</div>
                                <div className="text-2xl font-bold">{formatETH(finalGameSummary.prizePool)} ETH</div>
                              </div>
                            </div>
                          </div>
                          
                          {!hasClaimed ? (
                            <GradientButton 
                              onClick={handleClaimPrize} 
                              disabled={isClaiming}
                              className="w-full"
                              size="lg"
                            >
                              {isClaiming ? (
                                <>
                                  <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                                  Claiming...
                                </>
                              ) : (
                                <>
                                  <Wallet className="w-4 h-4 mr-2" />
                                  Claim {formatETH(finalGameSummary.prizePool)} ETH
                                </>
                              )}
                            </GradientButton>
                          ) : (
                            <div className="p-3 bg-green-100 border border-green-300 rounded-lg text-green-800 text-center font-medium">
                              ✅ Prize claimed! Congratulations!
                            </div>
                          )}
                        </div>
                      ) : (
                        /* Non-winner View */
                        <div className="space-y-3">
                          <div className="grid grid-cols-2 gap-3">
                            <div className="p-4 bg-gradient-to-r from-blue-50 to-indigo-50 border border-blue-200 rounded-lg text-center">
                              <div className="text-sm text-blue-600 font-medium mb-1">Winner</div>
                              <div className="text-blue-800 font-bold text-lg">
                                {formatAddress(finalGameSummary.winner)}
                              </div>
                            </div>
                            
                            <div className="p-4 bg-gradient-to-r from-purple-50 to-pink-50 border border-purple-200 rounded-lg text-center">
                              <div className="text-sm text-purple-600 font-medium mb-1">Winning Number</div>
                              <div className="text-purple-800 font-bold text-2xl">
                                {finalGameSummary.winningNumber}
                              </div>
                            </div>
                          </div>
                          
                          <div className="p-3 bg-gradient-to-r from-orange-50 to-yellow-50 border border-orange-200 rounded-lg text-center">
                            <div className="text-orange-700 font-medium">
                              Better luck next time! 🎯
                            </div>
                          </div>
                        </div>
                      )}
                    </div>
                  )}

                  {/* Time Expired - Manual Reveal Section */}
                  {finalGameSummary?.status === CONTRACT_CONFIG.GameStatus.Open && getTimeLeft() === 0 && canFinalize && (
                    <div className="p-4 bg-blue-50 border border-blue-200 rounded-lg text-center">
                      <div className="text-blue-700 mb-3">
                        <Clock className="w-6 h-6 mx-auto mb-2" />
                        <div className="font-medium">Time Expired!</div>
                        <div className="text-sm">
                          Game ended with {finalGameSummary.playerCount} players. Anyone can reveal the winner now!
                        </div>
                      </div>
                      
                      <div className="p-2 bg-yellow-50 border border-yellow-200 rounded text-yellow-800 text-sm mb-3">
                        💡 Reveal reward: ~{formatETH(finalGameSummary.prizePool / BigInt(10))} ETH (10% of prize pool)
                      </div>
                      
                      <GradientButton 
                        onClick={handleRevealWinner} 
                        disabled={isFinding}
                        size="sm"
                        className="w-full"
                      >
                        {isFinding ? (
                          <>
                            <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                            Revealing...
                          </>
                        ) : (
                          <>
                            🔍 Reveal Winner & Claim Reward
                          </>
                        )}
                      </GradientButton>
                    </div>
                  )}

                  {/* Calculating State - Only for time-expired games */}
                  {finalGameSummary?.status === CONTRACT_CONFIG.GameStatus.Calculating && !isGameDecrypted() && (
                    <div className="p-4 bg-blue-50 border border-blue-200 rounded-lg text-center">
                      <div className="flex items-center justify-center space-x-2 text-blue-700 mb-2">
                        <Loader2 className="w-5 h-5 animate-spin" />
                        <span className="text-sm font-medium">Calculating winner...</span>
                      </div>
                      <div className="text-blue-600 text-xs">
                        Please wait while the blockchain determines the winner.
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
