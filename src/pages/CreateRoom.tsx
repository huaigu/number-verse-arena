import { useState, useEffect } from "react"
import { useNavigate } from "react-router-dom"
import { GradientButton } from "@/components/ui/gradient-button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Slider } from "@/components/ui/slider"
import { Badge } from "@/components/ui/badge"
import { useToast } from "@/hooks/use-toast"
import { ArrowLeft, Users, Target, Trophy, Timer, Wallet, Loader2, TrendingUp } from "lucide-react"
import { useAccount } from 'wagmi'
import { ConnectButton } from '@rainbow-me/rainbowkit'
import { useCreateGame } from "@/hooks/contract/useGameContract"
import { useReadContract } from 'wagmi'
import { CONTRACT_CONFIG } from "@/contracts/config"
import contractABI from "@/contracts/UniqueNumberGameFactory.json"

const CreateRoom = () => {
  const navigate = useNavigate()
  const { toast } = useToast()
  const { address, isConnected } = useAccount()
  
  // 使用智能合约hook
  const { 
    createGame, 
    isCreating, 
    isSuccess, 
    error, 
    createdGameId, 
    transactionHash 
  } = useCreateGame()
  
  // 获取gameCounter作为fallback
  const { data: gameCounter, refetch: refetchGameCounter } = useReadContract({
    address: CONTRACT_CONFIG.address,
    abi: contractABI.abi,
    functionName: 'gameCounter',
    query: {
      enabled: false, // 只在需要时手动调用
    }
  })
  
  const [roomSettings, setRoomSettings] = useState({
    roomName: "",
    maxPlayers: 6,
    minNumber: 1,
    maxNumber: 16,
    entryFee: 0.1, // ETH
    timeLimit: 900 // 15 minutes in seconds
  })

  // 处理合约调用结果
  useEffect(() => {
    if (isSuccess) {
      toast({
        title: "Room created successfully! 🎉",
        description: `Transaction confirmed! Redirecting to game room...`,
      })
      
      // 延迟一下让用户看到成功提示，然后跳转
      setTimeout(async () => {
        let roomId: string;
        
        if (createdGameId) {
          // 首选：使用从事件解析的gameId
          roomId = createdGameId.toString();
          console.log('Using parsed gameId:', roomId);
        } else {
          // 备选：从合约状态获取最新的gameCounter - 1（因为新游戏的ID是递增的）
          try {
            const result = await refetchGameCounter();
            if (result.data) {
              const counter = result.data as bigint;
              roomId = (counter - BigInt(1)).toString();
              console.log('Using calculated gameId from counter:', roomId);
            } else {
              throw new Error('No gameCounter data');
            }
          } catch (error) {
            console.error('Failed to get gameId from contract:', error);
            // 最后的备选：使用交易hash
            roomId = transactionHash?.slice(-8) || 'new';
            console.log('Using fallback transaction hash:', roomId);
          }
        }
        
        navigate(`/game?room=${roomId}`)
      }, 1500)
    }
  }, [isSuccess, createdGameId, transactionHash, navigate, toast])

  // 处理错误
  useEffect(() => {
    if (error) {
      toast({
        title: "Transaction failed",
        description: error.message || "Please try again.",
        variant: "destructive"
      })
    }
  }, [error, toast])

  const handleCreateRoom = async () => {
    if (!isConnected) {
      toast({
        title: "Wallet not connected",
        description: "Please connect your wallet to create a room.",
        variant: "destructive"
      })
      return
    }

    // 验证房间设置
    if (!roomSettings.roomName.trim()) {
      toast({
        title: "Room name required",
        description: "Please enter a room name.",
        variant: "destructive"
      })
      return
    }

    if (roomSettings.minNumber >= roomSettings.maxNumber) {
      toast({
        title: "Invalid number range",
        description: "Maximum number must be greater than minimum number.",
        variant: "destructive"
      })
      return
    }

    try {
      // 显示开始创建的提示
      toast({
        title: "Creating room...",
        description: "Please confirm the transaction in your wallet.",
      })

      // 调用智能合约创建游戏
      await createGame({
        roomName: roomSettings.roomName,
        minNumber: roomSettings.minNumber,
        maxNumber: roomSettings.maxNumber,
        maxPlayers: roomSettings.maxPlayers,
        entryFee: roomSettings.entryFee.toString(),
        deadlineDuration: roomSettings.timeLimit
      })
    } catch (err) {
      console.error('Error creating room:', err)
      toast({
        title: "Failed to create room",
        description: "Please try again or check your wallet connection.",
        variant: "destructive"
      })
    }
  }

  const presets = [
    {
      name: "Quick Game",
      description: "4 players, fast start",
      settings: { roomName: "Quick Game", maxPlayers: 4, minNumber: 1, maxNumber: 9, entryFee: 0.05, timeLimit: 900 }
    },
    {
      name: "Standard Game",
      description: "6 players standard",
      settings: { roomName: "Standard Game", maxPlayers: 6, minNumber: 1, maxNumber: 16, entryFee: 0.1, timeLimit: 1800 }
    },
    {
      name: "Challenge Mode",
      description: "8 players, high difficulty",
      settings: { roomName: "Challenge Mode", maxPlayers: 8, minNumber: 1, maxNumber: 25, entryFee: 0.2, timeLimit: 3600 }
    }
  ]

  return (
    <div className="min-h-screen bg-gradient-background p-4">
      {/* 加载覆盖层 */}
      {isCreating && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-center justify-center">
          <div className="bg-card p-8 rounded-lg shadow-lg text-center">
            <Loader2 className="w-12 h-12 mx-auto mb-4 animate-spin text-primary" />
            <h3 className="text-xl font-semibold mb-2">Creating Game Room</h3>
            <p className="text-muted-foreground mb-4">
              Please confirm the transaction in your wallet and wait for confirmation...
            </p>
            {transactionHash && (
              <p className="text-xs text-muted-foreground">
                Transaction: {transactionHash.slice(0, 10)}...{transactionHash.slice(-8)}
              </p>
            )}
          </div>
        </div>
      )}
      
      <div className="max-w-4xl mx-auto">
        {/* Header */}
        <div className="flex items-center justify-between mb-8">
          <div className="flex items-center space-x-4">
            <GradientButton 
              variant="outline" 
              size="sm"
              onClick={() => navigate("/")}
              disabled={isCreating}
            >
              <ArrowLeft className="w-4 h-4 mr-2" />
              Back
            </GradientButton>
            <h1 className="text-xl font-bold text-foreground">Create Game Room</h1>
          </div>
          <div className="flex items-center space-x-2">
            <GradientButton 
              variant="outline"
              size="sm"
              onClick={() => navigate("/leaderboard")}
              disabled={isCreating}
            >
              <TrendingUp className="w-4 h-4 mr-2" />
              Leaderboard
            </GradientButton>
            <ConnectButton />
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
          {/* Left Side - Room Settings */}
          <div className="space-y-6">
            {/* Quick Presets */}
            <Card className="shadow-card">
              <CardHeader>
                <CardTitle>Quick Setup</CardTitle>
                <CardDescription>Choose preset configurations to start quickly</CardDescription>
              </CardHeader>
              <CardContent className="space-y-3">
                {presets.map((preset, index) => (
                  <div
                    key={index}
                    className={`p-4 border-2 border-border rounded-lg transition-all duration-300 ${
                      isCreating 
                        ? 'opacity-50 cursor-not-allowed' 
                        : 'cursor-pointer hover:border-primary hover:shadow-card'
                    }`}
                    onClick={() => !isCreating && setRoomSettings(preset.settings)}
                  >
                    <div className="flex justify-between items-center">
                      <div>
                        <h3 className="font-semibold text-foreground">{preset.name}</h3>
                        <p className="text-sm text-muted-foreground">{preset.description}</p>
                      </div>
                      <Badge variant="secondary">
                        {preset.settings.maxPlayers} players
                      </Badge>
                    </div>
                  </div>
                ))}
              </CardContent>
            </Card>

            {/* Custom Settings */}
            <Card className="shadow-card">
              <CardHeader>
                <CardTitle>Custom Settings</CardTitle>
                <CardDescription>Adjust game parameters to fit your needs</CardDescription>
              </CardHeader>
              <CardContent className="space-y-6">
                {/* Room Name */}
                <div className="space-y-2">
                  <Label>Room Name</Label>
                  <Input
                    type="text"
                    placeholder="Enter room name"
                    value={roomSettings.roomName}
                    onChange={(e) => setRoomSettings(prev => ({ ...prev, roomName: e.target.value }))}
                    disabled={isCreating}
                  />
                </div>

                {/* Max Players */}
                <div className="space-y-3">
                  <Label className="flex items-center space-x-2">
                    <Users className="w-4 h-4" />
                    <span>Max Players: {roomSettings.maxPlayers}</span>
                  </Label>
                  <Slider
                    value={[roomSettings.maxPlayers]}
                    onValueChange={([value]) => setRoomSettings(prev => ({ ...prev, maxPlayers: value }))}
                    max={10}
                    min={2}
                    step={1}
                    className="w-full"
                    disabled={isCreating}
                  />
                  <div className="flex justify-between text-sm text-muted-foreground">
                    <span>2 players</span>
                    <span>10 players</span>
                  </div>
                </div>

                {/* Number Range */}
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label className="flex items-center space-x-2">
                      <Target className="w-4 h-4" />
                      <span>Min Number</span>
                    </Label>
                    <Input
                      type="number"
                      value={roomSettings.minNumber}
                      onChange={(e) => setRoomSettings(prev => ({ ...prev, minNumber: parseInt(e.target.value) || 1 }))}
                      min={1}
                      max={99}
                      disabled={isCreating}
                    />
                  </div>
                  <div className="space-y-2">
                    <Label className="flex items-center space-x-2">
                      <Target className="w-4 h-4" />
                      <span>Max Number</span>
                    </Label>
                    <Input
                      type="number"
                      value={roomSettings.maxNumber}
                      onChange={(e) => setRoomSettings(prev => ({ ...prev, maxNumber: parseInt(e.target.value) || 1 }))}
                      min={roomSettings.minNumber}
                      max={100}
                      disabled={isCreating}
                    />
                  </div>
                </div>

                {/* Entry Fee */}
                <div className="space-y-3">
                  <Label className="flex items-center space-x-2">
                    <Trophy className="w-4 h-4" />
                    <span>Entry Fee: {roomSettings.entryFee} ETH</span>
                  </Label>
                  <Slider
                    value={[roomSettings.entryFee]}
                    onValueChange={([value]) => setRoomSettings(prev => ({ ...prev, entryFee: value }))}
                    max={1}
                    min={0.01}
                    step={0.01}
                    className="w-full"
                    disabled={isCreating}
                  />
                  <div className="flex justify-between text-sm text-muted-foreground">
                    <span>0.01 ETH</span>
                    <span>1 ETH</span>
                  </div>
                </div>

                {/* Time Limit */}
                <div className="space-y-3">
                  <Label className="flex items-center space-x-2">
                    <Timer className="w-4 h-4" />
                    <span>Time Limit: {Math.floor(roomSettings.timeLimit / 60)} minutes</span>
                  </Label>
                  <Slider
                    value={[roomSettings.timeLimit]}
                    onValueChange={([value]) => setRoomSettings(prev => ({ ...prev, timeLimit: value }))}
                    max={86400}
                    min={900}
                    step={900}
                    className="w-full"
                    disabled={isCreating}
                  />
                  <div className="flex justify-between text-sm text-muted-foreground">
                    <span>15 min</span>
                    <span>24 hours</span>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Right Side - Preview */}
          <div className="space-y-6">
            <Card className="shadow-card">
              <CardHeader>
                <CardTitle>Room Preview</CardTitle>
                <CardDescription>Review your room settings</CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="grid grid-cols-2 gap-4">
                  <div className="text-center p-4 bg-gradient-secondary rounded-lg">
                    <Users className="w-6 h-6 mx-auto mb-2 text-secondary-foreground" />
                    <div className="text-2xl font-bold text-secondary-foreground">
                      {roomSettings.maxPlayers}
                    </div>
                    <div className="text-sm text-secondary-foreground/70">Max Players</div>
                  </div>

                  <div className="text-center p-4 bg-gradient-primary rounded-lg">
                    <Target className="w-6 h-6 mx-auto mb-2 text-primary-foreground" />
                    <div className="text-2xl font-bold text-primary-foreground">
                      {roomSettings.minNumber}-{roomSettings.maxNumber}
                    </div>
                    <div className="text-sm text-primary-foreground/70">Number Range</div>
                  </div>

                  <div className="text-center p-4 bg-game-grid rounded-lg">
                    <Trophy className="w-6 h-6 mx-auto mb-2 text-primary-foreground" />
                    <div className="text-2xl font-bold text-primary-foreground">
                      {roomSettings.entryFee} ETH
                    </div>
                    <div className="text-sm text-primary-foreground/70">Entry Fee</div>
                  </div>

                  <div className="text-center p-4 bg-accent rounded-lg">
                    <Timer className="w-6 h-6 mx-auto mb-2 text-accent-foreground" />
                    <div className="text-2xl font-bold text-accent-foreground">
                      {Math.floor(roomSettings.timeLimit / 60)}m
                    </div>
                    <div className="text-sm text-accent-foreground/70">Time Limit</div>
                  </div>
                </div>

                {/* Game Rules Preview */}
                <div className="mt-6 p-4 bg-muted rounded-lg">
                  <h4 className="font-semibold mb-2">Game Rules</h4>
                  <ul className="text-sm text-muted-foreground space-y-1">
                    <li>• Each player can only choose one number</li>
                    <li>• Players who choose unique numbers get rewards</li>
                    <li>• Duplicate number choices earn no points</li>
                    <li>• Must complete selection within {Math.floor(roomSettings.timeLimit / 60)} minutes</li>
                  </ul>
                </div>
              </CardContent>
            </Card>

            {/* Create Button */}
            {!isConnected && (
              <Card className="border-orange-200 bg-orange-50">
                <CardContent className="p-4">
                  <div className="flex items-center space-x-2 text-orange-700">
                    <Wallet className="w-4 h-4" />
                    <span className="text-sm">Connect your wallet to create a room</span>
                  </div>
                </CardContent>
              </Card>
            )}
            
            <GradientButton
              size="xl"
              className="w-full"
              onClick={handleCreateRoom}
              disabled={isCreating || !isConnected}
            >
              {isCreating ? (
                <>
                  <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                  Creating Room...
                </>
              ) : !isConnected ? (
                "Connect Wallet First"
              ) : (
                "Create Room"
              )}
            </GradientButton>

            <GradientButton
              variant="outline"
              size="lg"
              className="w-full"
              onClick={() => navigate("/join-room")}
              disabled={isCreating}
            >
              Or Join Existing Room
            </GradientButton>
          </div>
        </div>
      </div>
    </div>
  )
}

export default CreateRoom