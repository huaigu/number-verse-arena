import { useState, useEffect } from 'react';
import { useAccount, useReadContract, useWriteContract, useWaitForTransactionReceipt } from 'wagmi';
import { parseEther, decodeEventLog } from 'viem';
import { CONTRACT_CONFIG, Game, GameSummary, CreateGameParams } from '@/contracts/config';
import contractABI from '@/contracts/UniqueNumberGameFactory.json';
import { useFHEEncryption } from '@/hooks/useFHEEncryption';

// 获取所有游戏
export const useGetAllGames = () => {
  const { data, isError, isLoading, refetch } = useReadContract({
    address: CONTRACT_CONFIG.address,
    abi: contractABI.abi,
    functionName: 'getAllGames',
  });

  return {
    games: data as Game[] | undefined,
    isError,
    isLoading,
    refetch,
  };
};

// 获取活跃游戏
export const useGetActiveGames = () => {
  const { data, isError, isLoading, refetch } = useReadContract({
    address: CONTRACT_CONFIG.address,
    abi: contractABI.abi,
    functionName: 'getActiveGames',
  });

  return {
    activeGames: data as Game[] | undefined,
    isError,
    isLoading,
    refetch,
  };
};

// 获取游戏摘要
export const useGetGameSummary = (gameId: bigint | undefined) => {
  const { data, isError, isLoading, refetch, error } = useReadContract({
    address: CONTRACT_CONFIG.address,
    abi: contractABI.abi,
    functionName: 'getGameSummary',
    args: gameId !== undefined ? [gameId] : undefined,
    query: {
      enabled: gameId !== undefined,
      // 添加重试逻辑
      retry: (failureCount, error) => {
        // 对于网络错误最多重试3次
        if (failureCount < 3 && error.message?.includes('network')) {
          return true;
        }
        // 对于合约调用错误，如果不是因为游戏不存在，重试1次
        if (failureCount < 1 && !error.message?.includes('Game not found')) {
          return true;
        }
        return false;
      },
    },
  });

  // 添加调试信息
  if (isError || error) {
    console.log('useGetGameSummary Error:', {
      gameId: gameId?.toString(),
      isError,
      error,
      errorMessage: error?.message || 'Unknown error'
    });
  }

  return {
    gameSummary: data as GameSummary | undefined,
    isError,
    isLoading,
    refetch,
    error,
  };
};

// 检查玩家是否已提交
export const useHasPlayerSubmitted = (gameId: bigint | undefined, playerAddress: string | undefined) => {
  const { data, isError, isLoading, refetch } = useReadContract({
    address: CONTRACT_CONFIG.address,
    abi: contractABI.abi,
    functionName: 'hasPlayerSubmitted',
    args: gameId !== undefined && playerAddress ? [gameId, playerAddress] : undefined,
    query: {
      enabled: gameId !== undefined && !!playerAddress,
    },
  });

  return {
    hasSubmitted: data as boolean | undefined,
    isError,
    isLoading,
    refetch,
  };
};

// 创建游戏hook
export const useCreateGame = () => {
  const [isCreating, setIsCreating] = useState(false);
  const [createdGameId, setCreatedGameId] = useState<bigint | null>(null);
  
  const { writeContract, data: hash, error, isPending } = useWriteContract();
  
  const { isLoading: isConfirming, isSuccess, data: receipt } = useWaitForTransactionReceipt({
    hash,
  });

  const createGame = async (params: CreateGameParams) => {
    try {
      setIsCreating(true);
      setCreatedGameId(null);
      
      const entryFeeWei = parseEther(params.entryFee);
      
      writeContract({
        address: CONTRACT_CONFIG.address,
        abi: contractABI.abi,
        functionName: 'createGame',
        args: [
          params.roomName,
          params.minNumber,
          params.maxNumber,
          params.maxPlayers,
          entryFeeWei,
          params.deadlineDuration,
        ],
      } as any);
    } catch (err) {
      console.error('Error creating game:', err);
      setIsCreating(false);
    }
  };

  useEffect(() => {
    if (isSuccess && receipt) {
      setIsCreating(false);
      
      // 从交易收据的事件日志中提取gameId
      try {
        console.log('Parsing transaction receipt logs:', receipt.logs.length, 'logs found');
        
        const gameCreatedEvent = receipt.logs.find(log => {
          try {
            const decoded = decodeEventLog({
              abi: contractABI.abi,
              data: log.data,
              topics: log.topics,
            });
            console.log('Decoded event:', decoded.eventName);
            return decoded.eventName === 'GameCreated';
          } catch (e) {
            // 忽略解码失败的日志
            return false;
          }
        });

        if (gameCreatedEvent) {
          const decoded = decodeEventLog({
            abi: contractABI.abi,
            data: gameCreatedEvent.data,
            topics: gameCreatedEvent.topics,
          });
          
          console.log('GameCreated event decoded:', decoded);
          
          if (decoded.eventName === 'GameCreated' && decoded.args) {
            const gameId = (decoded.args as any).gameId;
            setCreatedGameId(gameId);
            console.log('Game created with ID:', gameId.toString());
          }
        } else {
          console.warn('No GameCreated event found in transaction logs');
          setCreatedGameId(null);
        }
      } catch (error) {
        console.error('Error parsing GameCreated event:', error);
        // 如果无法解析事件，使用fallback策略
        setCreatedGameId(null);
      }
    }
  }, [isSuccess, receipt]);

  return {
    createGame,
    isCreating: isPending || isConfirming || isCreating,
    isSuccess,
    error,
    createdGameId,
    transactionHash: hash,
  };
};

// 提交数字hook (使用FHE加密)
export const useSubmitNumber = () => {
  const [isSubmitting, setIsSubmitting] = useState(false);
  const { address } = useAccount();
  const { encryptNumber } = useFHEEncryption();

  const { writeContract, data: hash, error, isPending } = useWriteContract();

  const { isLoading: isConfirming, isSuccess } = useWaitForTransactionReceipt({
    hash,
  });

  const submitNumber = async (gameId: bigint, number: number, entryFeeETH: string) => {
    try {
      setIsSubmitting(true);

      if (!address) {
        throw new Error('Wallet not connected');
      }

      // 使用 FHE 加密用户选择的数字
      console.log('Encrypting number:', number, 'for contract:', CONTRACT_CONFIG.address, 'user:', address);
      const { encryptedData, inputProof } = await encryptNumber(
        number,
        CONTRACT_CONFIG.address,
        address
      );

      const entryFeeWei = parseEther(entryFeeETH);

      console.log('Submitting encrypted number to contract:', {
        gameId: gameId.toString(),
        encryptedData,
        inputProof,
        entryFee: entryFeeETH
      });

      writeContract({
        address: CONTRACT_CONFIG.address,
        abi: contractABI.abi,
        functionName: 'submitNumber',
        args: [gameId, encryptedData, inputProof],
        value: entryFeeWei,
      } as any);
    } catch (err) {
      console.error('Error submitting number:', err);
      setIsSubmitting(false);
      // 重新抛出错误，让调用方处理
      throw err;
    }
  };

  useEffect(() => {
    if (isSuccess || error) {
      console.error(error);
      setIsSubmitting(false);
    }
  }, [isSuccess, error]);

  return {
    submitNumber,
    isSubmitting: isPending || isConfirming || isSubmitting,
    isSuccess,
    error,
    transactionHash: hash,
  };
};

// 触发开奖hook
export const useFindWinner = () => {
  const [isFinding, setIsFinding] = useState(false);
  
  const { writeContract, data: hash, error, isPending } = useWriteContract();
  
  const { isLoading: isConfirming, isSuccess } = useWaitForTransactionReceipt({
    hash,
  });

  const findWinner = async (gameId: bigint) => {
    try {
      setIsFinding(true);
      
      writeContract({
        address: CONTRACT_CONFIG.address,
        abi: contractABI.abi,
        functionName: 'findWinnerByDeadline',
        args: [gameId],
      } as any);
    } catch (err) {
      console.error('Error finding winner:', err);
      setIsFinding(false);
    }
  };

  useEffect(() => {
    if (isSuccess || error) {
      setIsFinding(false);
    }
  }, [isSuccess, error]);

  return {
    findWinner,
    isFinding: isPending || isConfirming || isFinding,
    isSuccess,
    error,
    transactionHash: hash,
  };
};

// 检查玩家是否已领取奖金
export const useHasPlayerClaimed = (gameId: bigint | undefined, playerAddress: string | undefined) => {
  const { data, isError, isLoading, refetch } = useReadContract({
    address: CONTRACT_CONFIG.address,
    abi: contractABI.abi,
    functionName: 'hasPlayerClaimed',
    args: gameId !== undefined && playerAddress ? [gameId, playerAddress] : undefined,
    query: {
      enabled: gameId !== undefined && !!playerAddress,
    },
  });

  return {
    hasClaimed: data as boolean | undefined,
    isError,
    isLoading,
    refetch,
  };
};

// 检查游戏是否可以结束
export const useCanFinalizeGame = (gameId: bigint | undefined) => {
  const { data, isError, isLoading, refetch } = useReadContract({
    address: CONTRACT_CONFIG.address,
    abi: contractABI.abi,
    functionName: 'canFinalizeGame',
    args: gameId !== undefined ? [gameId] : undefined,
    query: {
      enabled: gameId !== undefined,
    },
  });

  return {
    canFinalize: data as boolean | undefined,
    isError,
    isLoading,
    refetch,
  };
};

// 领取奖金hook
export const useClaimPrize = () => {
  const [isClaiming, setIsClaiming] = useState(false);
  
  const { writeContract, data: hash, error, isPending } = useWriteContract();
  
  const { isLoading: isConfirming, isSuccess } = useWaitForTransactionReceipt({
    hash,
  });

  const claimPrize = async (gameId: bigint) => {
    try {
      setIsClaiming(true);
      
      writeContract({
        address: CONTRACT_CONFIG.address,
        abi: contractABI.abi,
        functionName: 'claimPrize',
        args: [gameId],
      } as any);
    } catch (err) {
      console.error('Error claiming prize:', err);
      setIsClaiming(false);
    }
  };

  useEffect(() => {
    if (isSuccess || error) {
      setIsClaiming(false);
    }
  }, [isSuccess, error]);

  return {
    claimPrize,
    isClaiming: isPending || isConfirming || isClaiming,
    isSuccess,
    error,
    transactionHash: hash,
  };
};