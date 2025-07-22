import { useState } from "react"
import { useNavigate } from "react-router-dom"
import { GameCard } from "@/components/ui/game-card"
import { GradientButton } from "@/components/ui/gradient-button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Avatar, AvatarImage, AvatarFallback } from "@/components/ui/avatar"
import { Trophy, Users, Clock, Home, RotateCcw } from "lucide-react"

// Mock data for demonstration
const mockGameData = {
  roomId: "ROOM001",
  totalPlayers: 6,
  currentPlayers: 3,
  numberRange: { min: 1, max: 16 },
  prize: 1000,
  timeLeft: 45,
  selectedNumbers: [3, 7, 12],
  mySelection: 7
}

// Mock player data with wallet addresses
const mockPlayers = [
  { 
    id: 1, 
    walletAddress: "0xA7B8C9D1E2F3456789", 
    selectedNumber: 7, 
    isCurrentUser: true 
  },
  { 
    id: 2, 
    walletAddress: "0xB4E7F2A8C5D1234567", 
    selectedNumber: 3, 
    isCurrentUser: false 
  },
  { 
    id: 3, 
    walletAddress: "0xC8F1B5E9A3D7891234", 
    selectedNumber: 12, 
    isCurrentUser: false 
  }
]

const GamePage = () => {
  const navigate = useNavigate()
  const [selectedNumber, setSelectedNumber] = useState<number | null>(mockGameData.mySelection)
  const [gameStarted, setGameStarted] = useState(true)

  const generateNumberGrid = () => {
    const numbers = []
    const { min, max } = mockGameData.numberRange
    for (let i = min; i <= max; i++) {
      numbers.push(i)
    }
    return numbers
  }

  const getNumberVariant = (number: number) => {
    if (selectedNumber === number) return "selected"
    if (mockGameData.selectedNumbers.includes(number)) return "disabled"
    return "available"
  }

  const handleNumberSelect = (number: number) => {
    if (mockGameData.selectedNumbers.includes(number) && number !== selectedNumber) return
    setSelectedNumber(selectedNumber === number ? null : number)
  }

  return (
    <div className="min-h-screen bg-gradient-background p-4">
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <div className="flex items-center justify-between mb-6">
          <div className="flex items-center space-x-4">
            <GradientButton 
              variant="outline" 
              size="sm"
              onClick={() => navigate("/")}
            >
              <Home className="w-4 h-4 mr-2" />
              Home
            </GradientButton>
            <Badge variant="secondary" className="text-lg px-4 py-2">
              Room: {mockGameData.roomId}
            </Badge>
          </div>
          
          <div className="flex items-center space-x-4">
            <div className="flex items-center space-x-2 text-foreground">
              <Clock className="w-4 h-4" />
              <span className="font-mono text-lg">{mockGameData.timeLeft}s</span>
            </div>
            <GradientButton variant="secondary" size="sm">
              <RotateCcw className="w-4 h-4 mr-2" />
              Reset
            </GradientButton>
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Left Side - Player Slots */}
          <div className="lg:col-span-1">
            <Card className="shadow-card">
              <CardHeader>
                <CardTitle className="flex items-center space-x-2">
                  <Users className="w-5 h-5 text-primary" />
                  <span>Players ({mockGameData.currentPlayers}/{mockGameData.totalPlayers})</span>
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-2 gap-3">
                  {/* Current User (Always First) */}
                  {mockPlayers.find(p => p.isCurrentUser) && (
                    <div className="text-center p-3 bg-primary/10 rounded-lg border-2 border-primary/30">
                      <Avatar className="w-12 h-12 mx-auto mb-2 ring-2 ring-primary">
                        <AvatarFallback className="bg-primary text-primary-foreground font-bold">
                          {mockPlayers.find(p => p.isCurrentUser)?.walletAddress.slice(2, 4).toUpperCase()}
                        </AvatarFallback>
                      </Avatar>
                      <p className="text-xs font-medium text-primary">You</p>
                      <p className="text-xs text-muted-foreground truncate">
                        {mockPlayers.find(p => p.isCurrentUser)?.walletAddress.slice(0, 6)}...
                      </p>
                      {mockPlayers.find(p => p.isCurrentUser)?.selectedNumber && (
                        <div className="mt-1 text-xs bg-primary text-primary-foreground rounded px-2 py-1">
                          #{mockPlayers.find(p => p.isCurrentUser)?.selectedNumber}
                        </div>
                      )}
                    </div>
                  )}

                  {/* Other Players */}
                  {mockPlayers.filter(p => !p.isCurrentUser).map((player) => (
                    <div key={player.id} className="text-center p-3 bg-muted/50 rounded-lg">
                      <Avatar className="w-12 h-12 mx-auto mb-2">
                        <AvatarFallback className="bg-gradient-secondary text-secondary-foreground font-bold">
                          {player.walletAddress.slice(2, 4).toUpperCase()}
                        </AvatarFallback>
                      </Avatar>
                      <p className="text-xs font-medium">Player</p>
                      <p className="text-xs text-muted-foreground truncate">
                        {player.walletAddress.slice(0, 6)}...
                      </p>
                      {player.selectedNumber && (
                        <div className="mt-1 text-xs bg-secondary text-secondary-foreground rounded px-2 py-1">
                          #{player.selectedNumber}
                        </div>
                      )}
                    </div>
                  ))}

                  {/* Empty Slots */}
                  {Array.from({ length: mockGameData.totalPlayers - mockGameData.currentPlayers }).map((_, index) => (
                    <div key={`empty-${index}`} className="text-center p-3 border-2 border-dashed border-muted rounded-lg">
                      <div className="w-12 h-12 mx-auto mb-2 bg-muted/30 rounded-full flex items-center justify-center">
                        <Users className="w-6 h-6 text-muted-foreground/50" />
                      </div>
                      <p className="text-xs text-muted-foreground">Empty Slot</p>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Right Side - Game Area */}
          <div className="lg:col-span-2">
            <Card className="shadow-card">
              <CardHeader>
                <div className="flex items-center justify-between">
                  <CardTitle className="flex items-center space-x-2">
                    <Users className="w-5 h-5 text-primary" />
                    <span>Game Area</span>
                  </CardTitle>
                  <div className="text-right">
                    <div className="text-2xl font-bold text-primary">
                      {mockGameData.currentPlayers}
                    </div>
                    <div className="text-sm text-muted-foreground">
                      / {mockGameData.totalPlayers} players
                    </div>
                  </div>
                </div>
              </CardHeader>
              <CardContent>
                {/* Number Grid */}
                <div className="grid grid-cols-4 gap-3 mb-6">
                  {generateNumberGrid().map((number) => (
                    <GameCard
                      key={number}
                      variant={getNumberVariant(number)}
                      className="aspect-square text-xl font-bold cursor-pointer"
                      onClick={() => handleNumberSelect(number)}
                    >
                      {number}
                    </GameCard>
                  ))}
                </div>

                {/* Game Info */}
                <div className="grid grid-cols-2 gap-4 mb-6">
                  <Card className="bg-gradient-secondary">
                    <CardContent className="p-4 text-center">
                      <div className="text-2xl font-bold text-secondary-foreground">
                        {selectedNumber || "-"}
                      </div>
                      <div className="text-sm text-secondary-foreground/70">
                        My Choice
                      </div>
                    </CardContent>
                  </Card>

                  <Card className="bg-gradient-primary">
                    <CardContent className="p-4 text-center">
                      <div className="text-2xl font-bold text-primary-foreground">
                        {mockGameData.prize.toLocaleString()}
                      </div>
                      <div className="text-sm text-primary-foreground/70">
                        Reward Points
                      </div>
                    </CardContent>
                  </Card>
                </div>

                {/* Action Buttons */}
                <div className="grid grid-cols-2 gap-4">
                  <GradientButton 
                    variant="game" 
                    size="lg"
                    disabled={!selectedNumber}
                    className="w-full"
                  >
                    Confirm Choice
                  </GradientButton>
                  
                  <GradientButton 
                    variant="outline" 
                    size="lg"
                    onClick={() => setSelectedNumber(null)}
                    className="w-full"
                  >
                    Clear Choice
                  </GradientButton>
                </div>

                {/* Game Status */}
                {selectedNumber && (
                  <div className="mt-4 p-4 bg-accent/20 rounded-lg text-center">
                    <p className="text-accent-foreground">
                      Selected number <span className="font-bold text-lg">{selectedNumber}</span>
                      {mockGameData.selectedNumbers.includes(selectedNumber) && selectedNumber !== mockGameData.mySelection && 
                        <span className="text-destructive ml-2">(already taken)</span>
                      }
                    </p>
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

export default GamePage
