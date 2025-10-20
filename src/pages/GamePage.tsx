import React, { useState, useEffect, useMemo } from "react"
import { useNavigate, useSearchParams } from "react-router-dom"
import { GameCard } from "@/components/ui/game-card"
import { Card, CardContent } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Trophy, Users, Clock, Home, RotateCcw, Wallet, Loader2, AlertCircle } from "lucide-react"
import { useAccount } from 'wagmi'
import { ConnectButton } from '@rainbow-me/rainbowkit'
import { useToast } from "@/hooks/use-toast"
import { useGetGameSummary, useHasPlayerSubmitted, useSubmitNumber, useFindWinner, useClaimPrize, useHasPlayerClaimed, useCanFinalizeGame, useGetAllGames } from "@/hooks/contract/useGameContract"
import { CONTRACT_CONFIG, formatETH, formatAddress, GameSummary } from "@/contracts/config"
import { useTranslation } from 'react-i18next'
import { LanguageSwitcher } from '@/components/LanguageSwitcher'
import { useFhevmContext } from '@/providers/FhevmProvider'

const GamePage = () => {
  const navigate = useNavigate()
  const { toast } = useToast()
  const { address, isConnected } = useAccount()
  const { t } = useTranslation()
  const [searchParams] = useSearchParams()

  // 从URL参数获取游戏ID
  const roomParam = searchParams.get('room')
  const gameId = roomParam ? BigInt(roomParam) : undefined

  // Use shared FHEVM instance from global provider (preloaded on app mount)
  const { instance: fhevmInstance, status: fhevmStatus, error: fhevmError } = useFhevmContext()

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
  
  // Handle FHEVM initialization errors
  useEffect(() => {
    if (fhevmError) {
      console.error('FHEVM initialization error:', fhevmError)
      toast({
        title: "Encryption System Error",
        description: "Failed to initialize encryption. Please try again.",
        variant: "destructive"
      })
    }
  }, [fhevmError, toast])

  // 处理提交成功
  useEffect(() => {
    if (submitSuccess) {
      toast({
        title: t('toast.numberSubmitted.title'),
        description: t('toast.numberSubmitted.description'),
      })
      refetchGame()
      refetchHasSubmitted()
    }
  }, [submitSuccess, toast, refetchGame, refetchHasSubmitted, t])

  // 处理提交错误
  useEffect(() => {
    if (submitError) {
      toast({
        title: t('toast.submissionFailed.title'),
        description: submitError.message || t('toast.submissionFailed.description'),
        variant: "destructive"
      })
    }
  }, [submitError, toast, t])
  
  // 处理开奖成功 - 添加重试机制获取winner信息
  useEffect(() => {
    if (findSuccess) {
      toast({
        title: t('toast.gameFinalized.title'),
        description: t('toast.gameFinalized.description'),
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
              title: t('toast.winnerInfoLoaded.title'),
              description: t('toast.winnerInfoLoaded.description'),
            })
          } else {
            retryCount++
            if (retryCount >= maxRetries) {
              // 达到最大重试次数
              clearInterval(retryInterval)
              toast({
                title: t('toast.winnerInfoPending.title'),
                description: t('toast.winnerInfoPending.description'),
                variant: "destructive"
              })
            } else {
              // 继续重试
              toast({
                title: t('toast.fetchingWinner.title', { retryCount, maxRetries }),
                description: t('toast.fetchingWinner.description'),
              })
            }
          }
        } catch (error) {
          console.error('Error fetching winner info:', error)
          retryCount++
          if (retryCount >= maxRetries) {
            clearInterval(retryInterval)
            toast({
              title: t('toast.errorFetchingWinner.title'),
              description: t('toast.errorFetchingWinner.description'),
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
  }, [findSuccess, toast, refetchGame, refetchCanFinalize, finalGameSummary, t])
  
  // 处理开奖错误
  useEffect(() => {
    if (findError) {
      toast({
        title: t('toast.revealFailed.title'),
        description: findError.message || t('toast.revealFailed.description'),
        variant: "destructive"
      })
    }
  }, [findError, toast, t])
  
  // 处理领取成功
  useEffect(() => {
    if (claimSuccess) {
      toast({
        title: t('toast.prizeClaimed.title'),
        description: t('toast.prizeClaimed.description'),
      })
      refetchGame()
      refetchHasClaimed()
    }
  }, [claimSuccess, toast, refetchGame, refetchHasClaimed, t])
  
  // 处理领取错误
  useEffect(() => {
    if (claimError) {
      toast({
        title: t('toast.claimFailed.title'),
        description: claimError.message || t('toast.claimFailed.description'),
        variant: "destructive"
      })
    }
  }, [claimError, toast, t])

  // 监听游戏状态变为 Calculating 并自动刷新结果
  useEffect(() => {
    const currentStatus = finalGameSummary?.status
    
    // 检查状态是否从非 Calculating 变为 Calculating
    if (currentStatus === CONTRACT_CONFIG.GameStatus.Calculating && 
        previousGameStatus !== null && 
        previousGameStatus !== CONTRACT_CONFIG.GameStatus.Calculating) {
      
      toast({
        title: t('toast.gameCalculating.title'),
        description: t('toast.gameCalculating.description'),
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
              title: t('toast.resultsLoaded.title'),
              description: t('toast.resultsLoaded.description'),
            })
          } else {
            retryCount++
            if (retryCount >= maxRetries) {
              // 达到最大重试次数
              clearInterval(autoRefreshInterval)
              toast({
                title: t('toast.stillCalculating.title'),
                description: t('toast.stillCalculating.description'),
              })
            } else {
              // 继续重试，但不显示太多提示以避免spam
              if (retryCount % 3 === 0) { // 每隔3次重试才显示一次提示
                toast({
                  title: t('toast.checkingResults.title', { retryCount, maxRetries }),
                  description: t('toast.checkingResults.description'),
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
              title: t('toast.autoRefreshStopped.title'),
              description: t('toast.autoRefreshStopped.description'),
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
  }, [finalGameSummary?.status, previousGameStatus, toast, refetchGame, refetchCanFinalize, t])

  // 计算剩余时间
  const getTimeLeft = () => {
    if (!finalGameSummary) return 0
    const now = Math.floor(Date.now() / 1000)
    const deadlineSeconds = Number(finalGameSummary.deadline)
    return Math.max(0, deadlineSeconds - now)
  }

  // 格式化时间显示
  const formatTimeLeft = (seconds: number) => {
    if (seconds <= 0) return t('gamePage.roomInfo.expired')

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
    // 始终返回1-16的固定网格
    return Array.from({ length: 16 }, (_, i) => i + 1)
  }


  const getNumberVariant = (number: number) => {
    // 检查是否超出房间范围（禁用状态）
    if (!finalGameSummary || number < finalGameSummary.minNumber || number > finalGameSummary.maxNumber) {
      return "disabled"
    }

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
    // 检查是否为禁用的数字（超出房间范围）
    if (!finalGameSummary || number < finalGameSummary.minNumber || number > finalGameSummary.maxNumber) {
      return // 直接返回，不处理点击
    }

    if (!isConnected) {
      toast({
        title: t('toast.walletNotConnected.title'),
        description: t('toast.walletNotConnected.description'),
        variant: "destructive"
      })
      return
    }

    // Prevent selection if user has already submitted
    if (hasSubmitted) {
      toast({
        title: t('toast.alreadySubmitted.title'),
        description: t('toast.alreadySubmitted.description'),
        variant: "destructive"
      })
      return
    }

    // Check if game is still open
    if (!finalGameSummary || finalGameSummary.status !== CONTRACT_CONFIG.GameStatus.Open) {
      toast({
        title: t('toast.gameNotAvailable.title'),
        description: t('toast.gameNotAvailable.description'),
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
        title: t('toast.cannotSubmit.title'),
        description: t('toast.cannotSubmit.description'),
        variant: "destructive"
      })
      return
    }

    // Check FHEVM instance is ready before submission
    if (fhevmStatus !== 'ready' || !fhevmInstance) {
      const statusMessages: Record<string, string> = {
        'idle': 'Encryption system is initializing...',
        'loading': 'Encryption system is loading...',
        'error': 'Encryption system failed to initialize. Please refresh the page.',
      }

      toast({
        title: "Encryption Not Ready",
        description: statusMessages[fhevmStatus] || `Encryption system status: ${fhevmStatus}. Please wait or refresh the page.`,
        variant: "destructive"
      })
      return
    }

    try {
      toast({
        title: t('toast.encryptingNumber.title'),
        description: t('toast.encryptingNumber.description'),
      })

      // 调用更新后的 submitNumber，它现在包含 FHE 加密
      await submitNumber(gameId, selectedNumber, formatETH(finalGameSummary.entryFee))

      toast({
        title: t('toast.transactionSubmitted.title'),
        description: t('toast.transactionSubmitted.description'),
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
        title: t('toast.submissionFailed.title'),
        description: errorMessage,
        variant: "destructive"
      })
    }
  }

  // 处理开奖操作
  const handleRevealWinner = async () => {
    if (gameId === undefined) {
      toast({
        title: t('toast.cannotReveal.title'),
        description: t('toast.cannotReveal.description'),
        variant: "destructive"
      })
      return
    }
    
    try {
      await findWinner(gameId)
      toast({
        title: t('toast.revealingWinner.title'),
        description: t('toast.revealingWinner.description'),
      })
    } catch (error) {
      console.error('Error revealing winner:', error)
    }
  }

  // 处理领取奖金操作
  const handleClaimPrize = async () => {
    if (gameId === undefined) {
      toast({
        title: t('toast.cannotClaim.title'),
        description: t('toast.cannotClaim.description'),
        variant: "destructive"
      })
      return
    }
    
    try {
      await claimPrize(gameId)
      toast({
        title: t('toast.claimingPrize.title'),
        description: t('toast.claimingPrize.description'),
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
        <Card className="max-w-md bg-surface-light dark:bg-surface-dark shadow-pixel-light dark:shadow-pixel-dark border-2 border-black dark:border-white">
          <CardContent className="p-8 text-center">
            <AlertCircle className="w-16 h-16 mx-auto mb-4 text-destructive" />
            <h3 className="text-2xl font-bold mb-3">{t('gamePage.notFound')}</h3>
            <p className="text-muted-foreground mb-4">
              {t('gamePage.notFoundDesc')}
            </p>
            <button onClick={() => navigate("/join-room")} className="bg-primary text-white px-6 py-3 rounded-lg shadow-pixel-light dark:shadow-pixel-dark pixel-button border-2 border-black dark:border-white font-bold">
              {t('common.joinRoom')}
            </button>
          </CardContent>
        </Card>
      </div>
    )
  }

  // Wait for FHEVM initialization before showing game interface
  if (fhevmStatus === 'loading' || fhevmStatus === 'idle') {
    return (
      <div className="h-screen bg-gradient-background p-3 flex items-center justify-center">
        <Card className="max-w-md bg-surface-light dark:bg-surface-dark shadow-pixel-light dark:shadow-pixel-dark border-2 border-black dark:border-white">
          <CardContent className="p-8 text-center">
            <Loader2 className="w-16 h-16 mx-auto mb-4 animate-spin text-blue-500 dark:text-blue-400" />
            <h3 className="text-2xl font-bold mb-3">Initializing Encryption System</h3>
            <p className="text-muted-foreground text-sm mb-4">
              Loading privacy-preserving encryption...
            </p>
            <div className="flex items-center justify-center space-x-2 text-xs text-blue-500 dark:text-blue-400">
              <div className="w-2 h-2 bg-blue-500 rounded-full animate-pulse"></div>
              <span>Please wait a moment</span>
            </div>
          </CardContent>
        </Card>
      </div>
    )
  }

  // Show error screen if FHEVM initialization failed
  if (fhevmStatus === 'error') {
    return (
      <div className="h-screen bg-gradient-background p-3 flex items-center justify-center">
        <Card className="max-w-md bg-surface-light dark:bg-surface-dark shadow-pixel-light dark:shadow-pixel-dark border-2 border-black dark:border-white">
          <CardContent className="p-8 text-center">
            <AlertCircle className="w-16 h-16 mx-auto mb-4 text-red-500 dark:text-red-400" />
            <h3 className="text-2xl font-bold mb-3 text-red-600 dark:text-red-400">Encryption System Failed</h3>
            <p className="text-muted-foreground text-sm mb-4">
              Failed to initialize the privacy encryption system.
            </p>
            {fhevmError && (
              <div className="text-xs text-muted-foreground mb-4 p-3 bg-muted/50 dark:bg-muted/20 rounded border-2 border-muted">
                <strong>Error:</strong> {fhevmError.message}
              </div>
            )}
            <div className="space-y-3">
              <button
                onClick={() => window.location.reload()}
                className="w-full bg-primary text-white px-6 py-3 rounded-lg shadow-pixel-light dark:shadow-pixel-dark pixel-button border-2 border-black dark:border-white font-bold"
              >
                <RotateCcw className="w-4 h-4 mr-2 inline" />
                Refresh Page
              </button>
              <button
                onClick={() => navigate("/")}
                className="w-full bg-surface-light dark:bg-surface-dark text-foreground px-6 py-3 rounded-lg shadow-pixel-light dark:shadow-pixel-dark pixel-button border-2 border-black dark:border-white font-bold"
              >
                <Home className="w-4 h-4 mr-2 inline" />
                Back to Home
              </button>
            </div>
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
        <Card className="max-w-md bg-surface-light dark:bg-surface-dark shadow-pixel-light dark:shadow-pixel-dark border-2 border-black dark:border-white">
          <CardContent className="p-8 text-center">
            <Loader2 className="w-16 h-16 mx-auto mb-4 animate-spin text-primary" />
            <h3 className="text-2xl font-bold mb-2">{t('gamePage.loading')}</h3>
            <p className="text-muted-foreground text-sm">
              {t('common.loading')}
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
        <Card className="max-w-md bg-surface-light dark:bg-surface-dark shadow-pixel-light dark:shadow-pixel-dark border-2 border-black dark:border-white">
          <CardContent className="p-8 text-center">
            <AlertCircle className="w-16 h-16 mx-auto mb-4 text-destructive" />
            <h3 className="text-2xl font-bold mb-3">{t('gamePage.notFound')}</h3>
            <p className="text-muted-foreground mb-3">
              {t('gamePage.roomInfo.roomId')} #{gameId?.toString()} {t('gamePage.notFoundDesc')}
            </p>
            {(gameError || gameErrorDetails) && (
              <div className="text-sm text-muted-foreground mb-4 p-3 bg-muted/50 dark:bg-muted/20 rounded border-2 border-muted">
                <strong>Error:</strong> {gameErrorDetails?.message || 'Unknown error'}
              </div>
            )}
            <div className="space-y-3">
              <button onClick={() => refetchGame()} className="w-full bg-primary text-white px-6 py-3 rounded-lg shadow-pixel-light dark:shadow-pixel-dark pixel-button border-2 border-black dark:border-white font-bold">
                {t('gamePage.actions.tryAgain')}
              </button>
              <button onClick={() => navigate("/join-room")} className="w-full bg-surface-light dark:bg-surface-dark text-foreground px-6 py-3 rounded-lg shadow-pixel-light dark:shadow-pixel-dark pixel-button border-2 border-black dark:border-white font-bold">
                {t('common.joinRoom')}
              </button>
            </div>
          </CardContent>
        </Card>
      </div>
    )
  }

  const timeLeft = getTimeLeft()

  return (
    <div className="min-h-screen bg-gradient-background p-2 md:p-3">
      <div className="max-w-page mx-auto flex flex-col">
        {/* Compact Header */}
        <div className="flex items-center justify-between mb-2 md:mb-4">
          <div className="flex items-center space-x-3">
            <button
              className="bg-surface-light dark:bg-surface-dark text-foreground px-4 py-2 rounded-lg shadow-pixel-light dark:shadow-pixel-dark pixel-button border-2 border-black dark:border-white flex items-center space-x-2"
              onClick={() => navigate("/")}
            >
              <Home className="w-4 h-4" />
              <span className="text-sm font-medium">{t('common.home')}</span>
            </button>
            <Badge variant="secondary" className="px-3 py-1 border-2 border-black dark:border-white shadow-pixel-light dark:shadow-pixel-dark">
              {t('gamePage.roomInfo.roomId')} #{gameId.toString()}
            </Badge>
            <Badge
              variant={finalGameSummary.status === CONTRACT_CONFIG.GameStatus.Open ? "default" : "destructive"}
              className="px-3 py-1 border-2 border-black dark:border-white shadow-pixel-light dark:shadow-pixel-dark"
            >
              {CONTRACT_CONFIG.GameStatus.Open === finalGameSummary.status ? t('joinRoom.status.open') :
               CONTRACT_CONFIG.GameStatus.Calculating === finalGameSummary.status ? t('joinRoom.status.calculating') :
               CONTRACT_CONFIG.GameStatus.Finished === finalGameSummary.status ? t('joinRoom.status.finished') : t('joinRoom.status.claimed')}
            </Badge>
          </div>

          <div className="flex items-center space-x-3">
            <LanguageSwitcher />
            <ConnectButton />
            <button
              className="bg-surface-light dark:bg-surface-dark text-foreground px-4 py-2 rounded-lg shadow-pixel-light dark:shadow-pixel-dark pixel-button border-2 border-black dark:border-white flex items-center space-x-2"
              onClick={() => refetchGame()}
              disabled={gameLoading}
            >
              <RotateCcw className={`w-4 h-4 ${gameLoading ? 'animate-spin' : ''}`} />
              <span className="text-sm font-medium">{t('common.refresh')}</span>
            </button>
          </div>
        </div>

        {/* Main Game Layout - 2 Column */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-3 md:gap-6 pb-2 md:pb-6">
          {/* Left Panel: Status & Player Slots */}
          <div className="lg:col-span-1 space-y-3 md:space-y-4">
            {/* Top Row: Timer & Prize Pool */}
            <div className="grid grid-cols-2 gap-2 md:gap-4">
              <Card className="bg-surface-light dark:bg-surface-dark shadow-pixel-light dark:shadow-pixel-dark border-2 border-black dark:border-white">
                <CardContent className="p-2 md:p-4 text-center">
                  <div className="flex items-center justify-center text-red-500 dark:text-red-400 mb-2">
                    <Clock className={`w-8 h-8 ${timeLeft <= 60 && timeLeft > 0 ? 'animate-timer-urgent' : ''}`} />
                  </div>
                  <p className="text-sm">{t('gamePage.roomInfo.timeLeft')}</p>
                  <p className={`text-xl font-bold ${
                    timeLeft <= 60 && timeLeft > 0 ? 'text-red-500 animate-timer-urgent' :
                    timeLeft === 0 ? 'text-red-500' : 'text-red-500'
                  }`}>
                    {formatTimeLeft(timeLeft)}
                  </p>
                </CardContent>
              </Card>

              <Card className="bg-surface-light dark:bg-surface-dark shadow-pixel-light dark:shadow-pixel-dark border-2 border-black dark:border-white">
                <CardContent className="p-2 md:p-4 text-center">
                  <div className="flex items-center justify-center text-primary mb-1 md:mb-2">
                    <Trophy className="w-6 h-6 md:w-8 md:h-8" />
                  </div>
                  <p className="text-xs md:text-sm">{t('gamePage.roomInfo.prizePool')}</p>
                  <p className="text-lg md:text-xl font-bold text-primary">
                    {formatETH(finalGameSummary.prizePool)} ETH
                  </p>
                </CardContent>
              </Card>

              <Card className="bg-surface-light dark:bg-surface-dark shadow-pixel-light dark:shadow-pixel-dark border-2 border-black dark:border-white">
                <CardContent className="p-2 md:p-4 text-center">
                  <div className="flex items-center justify-center text-blue-500 dark:text-blue-400 mb-1">
                    <span className="text-3xl md:text-5xl font-bold font-mono">{selectedNumber || "?"}</span>
                  </div>
                  {hasSubmitted && selectedNumber && (
                    <Badge variant="default" className="text-xs mb-1">{t('gamePage.gameArea.submitted')}</Badge>
                  )}
                  {isSubmitting && (
                    <Badge variant="outline" className="text-xs mb-1">
                      <Loader2 className="w-3 h-3 mr-1 animate-spin" />
                      {t('gamePage.gameArea.submitting')}
                    </Badge>
                  )}
                  {/* FHEVM Status Badge */}
                  {isConnected && !hasSubmitted && !isSubmitting && (
                    <>
                      {fhevmStatus === 'loading' && (
                        <Badge variant="outline" className="text-xs mb-1 bg-blue-50 dark:bg-blue-900/20 border-blue-500">
                          <Loader2 className="w-3 h-3 mr-1 animate-spin" />
                          Encrypting...
                        </Badge>
                      )}
                      {fhevmStatus === 'ready' && selectedNumber && (
                        <Badge variant="outline" className="text-xs mb-1 bg-green-50 dark:bg-green-900/20 border-green-500 text-green-700 dark:text-green-400">
                          <span className="w-2 h-2 bg-green-500 rounded-full mr-1"></span>
                          Ready
                        </Badge>
                      )}
                      {fhevmStatus === 'error' && (
                        <Badge variant="outline" className="text-xs mb-1 bg-red-50 dark:bg-red-900/20 border-red-500 text-red-700 dark:text-red-400">
                          <AlertCircle className="w-3 h-3 mr-1" />
                          Error
                        </Badge>
                      )}
                    </>
                  )}
                  <p className="text-xs md:text-sm">{t('gamePage.gameArea.myChoice')}</p>
                </CardContent>
              </Card>

              <Card className="bg-surface-light dark:bg-surface-dark shadow-pixel-light dark:shadow-pixel-dark border-2 border-black dark:border-white">
                <CardContent className="p-2 md:p-4 text-center">
                  <div className="flex items-center justify-center text-green-500 dark:text-green-400 mb-1 md:mb-2">
                    <Users className="w-6 h-6 md:w-8 md:h-8" />
                  </div>
                  <p className="text-xs md:text-sm">{t('gamePage.roomInfo.players')}</p>
                  <p className="text-lg md:text-xl font-bold text-green-500">
                    {finalGameSummary.playerCount}/{finalGameSummary.maxPlayers}
                  </p>
                </CardContent>
              </Card>
            </div>

            {/* Entry Fee Display */}
            <button className="w-full bg-primary dark:bg-primary text-white p-4 md:p-6 rounded-lg shadow-pixel-light dark:shadow-pixel-dark pixel-button flex flex-col items-center justify-center border-2 border-black dark:border-white">
              <span className="text-xs md:text-sm mb-1">{t('joinRoom.roomCard.entryFee')}</span>
              <span className="text-2xl md:text-3xl font-bold font-mono">{formatETH(finalGameSummary.entryFee)} ETH</span>
            </button>

            {/* Game Info */}
            <Card className="bg-surface-light dark:bg-surface-dark shadow-pixel-light dark:shadow-pixel-dark border-2 border-black dark:border-white">
              <CardContent className="p-3 md:p-4 space-y-3 md:space-y-4">
                <h2 className="text-lg font-bold text-center">{finalGameSummary.roomName}</h2>
                <div className="text-sm">
                  <p>{t('gamePage.roomInfo.numberRange')}: {finalGameSummary.minNumber}-{finalGameSummary.maxNumber}</p>
                </div>

                <div className="flex justify-between items-center text-sm">
                  <span>{t('joinRoom.roomCard.entryFee')}</span>
                  <span className="font-bold">{formatETH(finalGameSummary.entryFee)} ETH</span>
                </div>

                <div className="flex justify-between items-center text-sm">
                  <span>{t('gamePage.gameArea.results.winner')}</span>
                  <span className="font-bold truncate">
                    {finalGameSummary.winner !== "0x0000000000000000000000000000000000000000" ?
                      formatAddress(finalGameSummary.winner) : "TBD"}
                  </span>
                </div>

                <div>
                  <p className="text-sm mb-1">{t('gamePage.roomInfo.players')} {finalGameSummary.playerCount}/{finalGameSummary.maxPlayers}</p>
                  <div className="w-full bg-gray-300 dark:bg-gray-700 rounded-full h-4 border-2 border-black dark:border-white p-0.5">
                    <div
                      className="bg-green-500 h-full rounded-full"
                      style={{ width: `${(finalGameSummary.playerCount / finalGameSummary.maxPlayers) * 100}%` }}
                    />
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Main Game Area */}
          <div className="lg:col-span-2">
            <Card className="bg-surface-light dark:bg-surface-dark shadow-pixel-light dark:shadow-pixel-dark border-2 border-black dark:border-white">
              <CardContent className="p-4 md:p-6">
                {/* Fixed 4x4 Number Grid */}
                <div className="grid grid-cols-4 gap-3 max-w-[600px] mx-auto">
                  {generateNumberGrid().map((number) => (
                    <GameCard
                      key={number}
                      variant={getNumberVariant(number)}
                      className={`aspect-square w-full flex items-center justify-center text-3xl md:text-4xl font-bold font-mono pixel-button ${
                        hasSubmitted || isSubmitting ? 'cursor-not-allowed' : 'cursor-pointer'
                      }`}
                      onClick={() => handleNumberSelect(number)}
                    >
                      {number}
                    </GameCard>
                  ))}
                </div>

                {/* Bottom Section - Always visible */}
                <div className="space-y-3 md:space-y-4 mt-4 md:mt-6">
                  {/* Wallet Warning - Compact */}
                  {!isConnected && (
                    <div className="p-4 bg-orange-50 dark:bg-orange-900/20 border-2 border-orange-500 rounded-lg text-center">
                      <div className="flex items-center justify-center space-x-2 text-orange-700 dark:text-orange-400">
                        <Wallet className="w-5 h-5" />
                        <span className="text-sm font-medium">{t('common.connectWallet')}</span>
                      </div>
                    </div>
                  )}

                  {/* FHEVM Loading Status */}
                  {isConnected && fhevmStatus === 'loading' && (
                    <div className="p-4 bg-blue-50 dark:bg-blue-900/20 border-2 border-blue-500 rounded-lg text-center">
                      <div className="flex items-center justify-center space-x-2 text-blue-700 dark:text-blue-400">
                        <Loader2 className="w-5 h-5 animate-spin" />
                        <span className="text-sm font-medium">Initializing encryption system...</span>
                      </div>
                    </div>
                  )}

                  {/* FHEVM Error Status */}
                  {isConnected && fhevmStatus === 'error' && (
                    <div className="p-4 bg-red-50 dark:bg-red-900/20 border-2 border-red-500 rounded-lg text-center">
                      <div className="flex flex-col items-center space-y-2">
                        <div className="flex items-center space-x-2 text-red-700 dark:text-red-400">
                          <AlertCircle className="w-5 h-5" />
                          <span className="text-sm font-medium">Encryption system failed</span>
                        </div>
                        <span className="text-xs text-red-600 dark:text-red-500">
                          {fhevmError?.message || 'Please refresh the page to retry'}
                        </span>
                      </div>
                    </div>
                  )}

                  {/* Game Status Messages */}
                  {finalGameSummary?.status !== CONTRACT_CONFIG.GameStatus.Open && !isGameDecrypted() && (
                    <div className="p-4 bg-yellow-50 dark:bg-yellow-900/20 border-2 border-yellow-500 rounded-lg text-center">
                      <div className="flex items-center justify-center space-x-2 text-yellow-700 dark:text-yellow-400">
                        <Clock className="w-5 h-5" />
                        <span className="text-sm font-medium">
                          {finalGameSummary?.status === CONTRACT_CONFIG.GameStatus.Calculating ? t('gamePage.gameArea.waitingResults') :
                           finalGameSummary?.status === CONTRACT_CONFIG.GameStatus.Finished ? t('joinRoom.status.finished') :
                           t('toast.gameNotAvailable.description')}
                        </span>
                      </div>
                    </div>
                  )}

                  {/* FHEVM Initialization Progress - Prominent Display */}
                  {isConnected && fhevmStatus === 'loading' && finalGameSummary?.status === CONTRACT_CONFIG.GameStatus.Open && (
                    <div className="p-6 bg-gradient-to-r from-blue-50 to-purple-50 dark:from-blue-900/30 dark:to-purple-900/30 border-2 border-blue-500 dark:border-blue-400 rounded-lg shadow-lg">
                      <div className="flex flex-col items-center space-y-3">
                        <div className="flex items-center space-x-3">
                          <Loader2 className="w-8 h-8 animate-spin text-blue-600 dark:text-blue-400" />
                          <span className="text-lg font-bold text-blue-700 dark:text-blue-300">
                            Initializing Encryption System
                          </span>
                        </div>
                        <div className="text-sm text-blue-600 dark:text-blue-400 text-center max-w-md">
                          <p className="mb-2">🔐 Setting up secure encryption for your number...</p>
                          <p className="text-xs opacity-80">This ensures your selection remains private until the game ends.</p>
                        </div>
                        <div className="flex items-center space-x-2 text-xs text-blue-500 dark:text-blue-500">
                          <div className="w-2 h-2 bg-blue-500 rounded-full animate-pulse"></div>
                          <span>Please wait a moment...</span>
                        </div>
                      </div>
                    </div>
                  )}

                  {/* Status Message - Enhanced */}
                  {selectedNumber && !hasSubmitted && isConnected && finalGameSummary?.status === CONTRACT_CONFIG.GameStatus.Open && fhevmStatus === 'ready' && (
                    <div className="p-4 bg-blue-50 dark:bg-blue-900/20 border-2 border-blue-500 rounded-lg text-center">
                      <span className="text-sm text-blue-700 dark:text-blue-400">
                        {t('gamePage.gameArea.selected')}: <span className="font-bold text-2xl">{selectedNumber}</span>
                      </span>
                    </div>
                  )}

                  {/* Action Buttons - Enhanced */}
                  {!hasSubmitted && isConnected && finalGameSummary?.status === CONTRACT_CONFIG.GameStatus.Open && (
                    <div className="space-y-3">
                      <div className="grid grid-cols-2 gap-4">
                        <button
                          disabled={!selectedNumber || isSubmitting || timeLeft === 0 || fhevmStatus !== 'ready'}
                          className="bg-primary text-white px-6 py-4 rounded-lg shadow-pixel-light dark:shadow-pixel-dark pixel-button border-2 border-black dark:border-white font-bold text-base disabled:opacity-50 disabled:cursor-not-allowed"
                          onClick={handleConfirmChoice}
                        >
                          {isSubmitting ? (
                            <>
                              <Loader2 className="w-4 h-4 mr-2 animate-spin inline" />
                              {t('gamePage.gameArea.submitting')}
                            </>
                          ) : fhevmStatus === 'loading' ? (
                            <>
                              <Loader2 className="w-4 h-4 mr-2 animate-spin inline" />
                              Initializing...
                            </>
                          ) : fhevmStatus === 'error' ? (
                            'Encryption Failed'
                          ) : timeLeft === 0 ? (
                            t('gamePage.roomInfo.expired')
                          ) : (
                            t('common.confirm')
                          )}
                        </button>

                        <button
                          onClick={() => setSelectedNumber(null)}
                          className="bg-surface-light dark:bg-surface-dark text-foreground px-6 py-4 rounded-lg shadow-pixel-light dark:shadow-pixel-dark pixel-button border-2 border-black dark:border-white font-bold text-base disabled:opacity-50 disabled:cursor-not-allowed"
                          disabled={isSubmitting}
                        >
                          {t('common.cancel')}
                        </button>
                      </div>

                      {/* Encryption Status Helper Text */}
                      {fhevmStatus !== 'ready' && !isSubmitting && (
                        <div className="text-center text-xs text-muted-foreground px-4">
                          {fhevmStatus === 'idle' && (
                            <p className="flex items-center justify-center space-x-1">
                              <Loader2 className="w-3 h-3 animate-spin" />
                              <span>Preparing encryption system...</span>
                            </p>
                          )}
                          {fhevmStatus === 'loading' && (
                            <p className="flex items-center justify-center space-x-1">
                              <Loader2 className="w-3 h-3 animate-spin" />
                              <span>Loading encryption keys, please wait...</span>
                            </p>
                          )}
                          {fhevmStatus === 'error' && (
                            <p className="flex items-center justify-center space-x-1 text-red-500 dark:text-red-400">
                              <AlertCircle className="w-3 h-3" />
                              <span>Encryption failed. Please refresh the page to retry.</span>
                            </p>
                          )}
                        </div>
                      )}

                      {/* Ready Status Indicator */}
                      {fhevmStatus === 'ready' && selectedNumber && !isSubmitting && (
                        <div className="text-center text-xs text-green-600 dark:text-green-400 px-4">
                          <p className="flex items-center justify-center space-x-1">
                            <span className="w-2 h-2 bg-green-500 rounded-full"></span>
                            <span>✓ Encryption ready - Your number will be encrypted on-chain</span>
                          </p>
                        </div>
                      )}
                    </div>
                  )}

                  {/* User Already Submitted Message */}
                  {hasSubmitted && finalGameSummary?.status !== CONTRACT_CONFIG.GameStatus.PrizeClaimed && !isGameDecrypted() && (
                    <div className="p-4 bg-green-50 dark:bg-green-900/20 border-2 border-green-500 rounded-lg text-center">
                      <div className="flex items-center justify-center space-x-2 text-green-700 dark:text-green-400">
                        <Trophy className="w-5 h-5" />
                        <span className="text-sm font-medium">
                          {t('gamePage.gameArea.waitingPlayers')}
                        </span>
                      </div>
                    </div>
                  )}

                  {/* Game Time Expired - No players */}
                  {finalGameSummary?.status === CONTRACT_CONFIG.GameStatus.Open && getTimeLeft() === 0 && !canFinalize && (
                    <div className="p-4 bg-red-50 dark:bg-red-900/20 border-2 border-red-500 rounded-lg text-center">
                      <div className="flex items-center justify-center space-x-2 text-red-700 dark:text-red-400">
                        <Clock className="w-5 h-5" />
                        <span className="text-sm font-medium">
                          {t('gamePage.gameArea.noPlayersJoined')}
                        </span>
                      </div>
                    </div>
                  )}

                  {/* Game Result Section */}
                  {isGameDecrypted() && (
                    <div className="space-y-4">
                      {/* Header Section */}
                      <div className="text-center">
                        <Trophy className="w-12 h-12 mx-auto mb-2 text-purple-600" />
                        <h3 className="text-2xl font-bold text-purple-800 dark:text-purple-400">{t('gamePage.gameArea.results.title')}</h3>
                      </div>

                      {isCurrentUserWinner() ? (
                        /* Winner View */
                        <div className="space-y-4">
                          <div className="p-6 bg-green-50 dark:bg-green-900/20 border-2 border-green-500 rounded-lg text-center shadow-pixel-light dark:shadow-pixel-dark">
                            <div className="text-green-800 dark:text-green-400 font-bold text-2xl mb-4">🎉 {t('gamePage.gameArea.results.youWon')}</div>
                            <div className="flex justify-center items-center space-x-8 text-green-700 dark:text-green-400">
                              <div>
                                <div className="text-sm font-medium">{t('gamePage.gameArea.results.winningNumber')}</div>
                                <div className="text-4xl font-bold font-mono">{finalGameSummary.winningNumber}</div>
                              </div>
                              <div>
                                <div className="text-sm font-medium">{t('joinRoom.roomCard.prizePool')}</div>
                                <div className="text-4xl font-bold font-mono">{formatETH(finalGameSummary.prizePool)} ETH</div>
                              </div>
                            </div>
                          </div>

                          {!hasClaimed ? (
                            <button
                              onClick={handleClaimPrize}
                              disabled={isClaiming}
                              className="w-full bg-primary text-white px-6 py-4 rounded-lg shadow-pixel-light dark:shadow-pixel-dark pixel-button border-2 border-black dark:border-white font-bold text-lg disabled:opacity-50"
                            >
                              {isClaiming ? (
                                <>
                                  <Loader2 className="w-5 h-5 mr-2 animate-spin inline" />
                                  {t('gamePage.gameArea.results.claiming')}
                                </>
                              ) : (
                                <>
                                  <Wallet className="w-5 h-5 mr-2 inline" />
                                  {t('gamePage.gameArea.results.claimPrize')} {formatETH(finalGameSummary.prizePool)} ETH
                                </>
                              )}
                            </button>
                          ) : (
                            <div className="p-4 bg-green-100 dark:bg-green-900/30 border-2 border-green-500 rounded-lg text-green-800 dark:text-green-400 text-center font-bold shadow-pixel-light dark:shadow-pixel-dark">
                              ✅ {t('gamePage.gameArea.results.claimed')}
                            </div>
                          )}
                        </div>
                      ) : (
                        /* Non-winner View */
                        <div className="space-y-4">
                          <div className="grid grid-cols-2 gap-4">
                            <div className="p-4 bg-blue-50 dark:bg-blue-900/20 border-2 border-blue-500 rounded-lg text-center shadow-pixel-light dark:shadow-pixel-dark">
                              <div className="text-sm text-blue-600 dark:text-blue-400 font-medium mb-1">{t('gamePage.gameArea.results.winner')}</div>
                              <div className="text-blue-800 dark:text-blue-300 font-bold text-lg">
                                {formatAddress(finalGameSummary.winner)}
                              </div>
                            </div>

                            <div className="p-4 bg-purple-50 dark:bg-purple-900/20 border-2 border-purple-500 rounded-lg text-center shadow-pixel-light dark:shadow-pixel-dark">
                              <div className="text-sm text-purple-600 dark:text-purple-400 font-medium mb-1">{t('gamePage.gameArea.results.winningNumber')}</div>
                              <div className="text-purple-800 dark:text-purple-300 font-bold text-3xl font-mono">
                                {finalGameSummary.winningNumber}
                              </div>
                            </div>
                          </div>

                          <div className="p-4 bg-orange-50 dark:bg-orange-900/20 border-2 border-orange-500 rounded-lg text-center shadow-pixel-light dark:shadow-pixel-dark">
                            <div className="text-orange-700 dark:text-orange-400 font-bold text-lg">
                              {t('gamePage.gameArea.results.youLost')} 🎯
                            </div>
                          </div>
                        </div>
                      )}
                    </div>
                  )}

                  {/* Time Expired - Manual Reveal Section */}
                  {finalGameSummary?.status === CONTRACT_CONFIG.GameStatus.Open && getTimeLeft() === 0 && canFinalize && (
                    <div className="p-6 bg-blue-50 dark:bg-blue-900/20 border-2 border-blue-500 rounded-lg text-center shadow-pixel-light dark:shadow-pixel-dark">
                      <div className="text-blue-700 dark:text-blue-400 mb-4">
                        <Clock className="w-8 h-8 mx-auto mb-2" />
                        <div className="font-bold text-lg">{t('gamePage.gameArea.timeExpiredReveal')}</div>
                        <div className="text-sm mt-2">
                          {t('gamePage.gameArea.gameEndedWithPlayers', { count: finalGameSummary.playerCount })}
                        </div>
                      </div>

                      <div className="p-4 bg-yellow-50 dark:bg-yellow-900/20 border-2 border-yellow-500 rounded-lg text-yellow-800 dark:text-yellow-400 text-sm mb-4">
                        💡 {t('gamePage.gameArea.revealReward')}: {t('gamePage.gameArea.revealRewardAmount', { amount: formatETH(finalGameSummary.prizePool / BigInt(10)) })}
                      </div>

                      <button
                        onClick={handleRevealWinner}
                        disabled={isFinding}
                        className="w-full bg-primary text-white px-6 py-4 rounded-lg shadow-pixel-light dark:shadow-pixel-dark pixel-button border-2 border-black dark:border-white font-bold text-base disabled:opacity-50"
                      >
                        {isFinding ? (
                          <>
                            <Loader2 className="w-5 h-5 mr-2 animate-spin inline" />
                            {t('gamePage.gameArea.revealing')}
                          </>
                        ) : (
                          <>
                            🔍 {t('gamePage.gameArea.revealWinner')}
                          </>
                        )}
                      </button>
                    </div>
                  )}

                  {/* Calculating State - Only for time-expired games */}
                  {finalGameSummary?.status === CONTRACT_CONFIG.GameStatus.Calculating && !isGameDecrypted() && (
                    <div className="p-6 bg-blue-50 dark:bg-blue-900/20 border-2 border-blue-500 rounded-lg text-center shadow-pixel-light dark:shadow-pixel-dark">
                      <div className="flex items-center justify-center space-x-3 text-blue-700 dark:text-blue-400 mb-2">
                        <Loader2 className="w-6 h-6 animate-spin" />
                        <span className="text-base font-bold">{t('gamePage.gameArea.calculating')}</span>
                      </div>
                      <div className="text-blue-600 dark:text-blue-500 text-sm mt-2">
                        {t('gamePage.gameArea.calculatingDesc')}
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
