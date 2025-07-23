import { useState } from "react"
import { useNavigate } from "react-router-dom"
import { GradientButton } from "@/components/ui/gradient-button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Slider } from "@/components/ui/slider"
import { Badge } from "@/components/ui/badge"
import { useToast } from "@/hooks/use-toast"
import { ArrowLeft, Users, Target, Trophy, Timer, Wallet } from "lucide-react"
import { useAccount } from 'wagmi'
import { ConnectButton } from '@rainbow-me/rainbowkit'

const CreateRoom = () => {
  const navigate = useNavigate()
  const { toast } = useToast()
  const { address, isConnected } = useAccount()
  
  const [roomSettings, setRoomSettings] = useState({
    roomName: "",
    maxPlayers: 6,
    minNumber: 1,
    maxNumber: 16,
    entryFee: 0.1, // ETH
    timeLimit: 60
  })

  const [isCreating, setIsCreating] = useState(false)

  const handleCreateRoom = async () => {
    if (!isConnected) {
      toast({
        title: "Wallet not connected",
        description: "Please connect your wallet to create a room.",
        variant: "destructive"
      })
      return
    }

    setIsCreating(true)
    
    // Simulate API call
    setTimeout(() => {
      const roomId = Math.random().toString(36).substr(2, 6).toUpperCase()
      toast({
        title: "Room created successfully!",
        description: `Room ID: ${roomId}`,
      })
      navigate(`/game?room=${roomId}`)
      setIsCreating(false)
    }, 1500)
  }

  const presets = [
    {
      name: "Quick Game",
      description: "4 players, fast start",
      settings: { roomName: "Quick Game", maxPlayers: 4, minNumber: 1, maxNumber: 9, entryFee: 0.05, timeLimit: 30 }
    },
    {
      name: "Standard Game",
      description: "6 players standard",
      settings: { roomName: "Standard Game", maxPlayers: 6, minNumber: 1, maxNumber: 16, entryFee: 0.1, timeLimit: 60 }
    },
    {
      name: "Challenge Mode",
      description: "8 players, high difficulty",
      settings: { roomName: "Challenge Mode", maxPlayers: 8, minNumber: 1, maxNumber: 25, entryFee: 0.2, timeLimit: 90 }
    }
  ]

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
            <h1 className="text-3xl font-bold text-foreground">Create Game Room</h1>
          </div>
          <ConnectButton />
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
                    className="p-4 border-2 border-border rounded-lg cursor-pointer hover:border-primary hover:shadow-card transition-all duration-300"
                    onClick={() => setRoomSettings(preset.settings)}
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
                    <span>Time Limit: {roomSettings.timeLimit} seconds</span>
                  </Label>
                  <Slider
                    value={[roomSettings.timeLimit]}
                    onValueChange={([value]) => setRoomSettings(prev => ({ ...prev, timeLimit: value }))}
                    max={300}
                    min={15}
                    step={15}
                    className="w-full"
                  />
                  <div className="flex justify-between text-sm text-muted-foreground">
                    <span>15 sec</span>
                    <span>5 min</span>
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
                      {roomSettings.timeLimit}s
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
                    <li>• Must complete selection within {roomSettings.timeLimit} seconds</li>
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
              {isCreating ? "Creating..." : !isConnected ? "Connect Wallet First" : "Create Room"}
            </GradientButton>

            <GradientButton
              variant="outline"
              size="lg"
              className="w-full"
              onClick={() => navigate("/join-room")}
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