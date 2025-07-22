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
  currentPlayers: 4,
  numberRange: { min: 1, max: 16 },
  prize: 1000,
  timeLeft: 45,
  selectedNumbers: [3, 7, 12],
  mySelection: 7
}

const mockPlayers = [
  { id: 1, name: "David Renald", avatar: "👨‍💼", score: 4291, rank: 1 },
  { id: 2, name: "Donita Alla", avatar: "👩‍💼", score: 3321, rank: 2 },
  { id: 3, name: "Steven Craig", avatar: "👨‍💻", score: 2826, rank: 3 },
  { id: 4, name: "You", avatar: "🎮", score: 1200, rank: 4 }
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
              首页
            </GradientButton>
            <Badge variant="secondary" className="text-lg px-4 py-2">
              房间: {mockGameData.roomId}
            </Badge>
          </div>
          
          <div className="flex items-center space-x-4">
            <div className="flex items-center space-x-2 text-foreground">
              <Clock className="w-4 h-4" />
              <span className="font-mono text-lg">{mockGameData.timeLeft}s</span>
            </div>
            <GradientButton variant="secondary" size="sm">
              <RotateCcw className="w-4 h-4 mr-2" />
              重置
            </GradientButton>
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Left Side - Leaderboard */}
          <div className="lg:col-span-1">
            <Card className="shadow-card">
              <CardHeader>
                <CardTitle className="flex items-center space-x-2">
                  <Trophy className="w-5 h-5 text-primary" />
                  <span>排行榜</span>
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  {/* Top 3 Podium */}
                  <div className="flex items-end justify-center space-x-2 mb-6">
                    {/* 2nd Place */}
                    <div className="text-center">
                      <div className="w-12 h-12 bg-gradient-secondary rounded-xl flex items-center justify-center text-2xl mb-2">
                        {mockPlayers[1].avatar}
                      </div>
                      <div className="w-16 h-12 bg-secondary rounded-t-lg flex items-center justify-center font-bold text-lg">
                        2
                      </div>
                      <p className="text-xs mt-1 truncate w-16">{mockPlayers[1].name}</p>
                      <p className="text-xs text-muted-foreground">{mockPlayers[1].score.toLocaleString()}</p>
                    </div>

                    {/* 1st Place */}
                    <div className="text-center">
                      <div className="w-16 h-16 bg-gradient-primary rounded-xl flex items-center justify-center text-3xl mb-2 animate-pulse-glow">
                        {mockPlayers[0].avatar}
                      </div>
                      <div className="w-20 h-16 bg-primary rounded-t-lg flex items-center justify-center font-bold text-xl text-primary-foreground">
                        1
                      </div>
                      <p className="text-sm mt-1 font-semibold truncate w-20">{mockPlayers[0].name}</p>
                      <p className="text-xs text-muted-foreground">{mockPlayers[0].score.toLocaleString()}</p>
                    </div>

                    {/* 3rd Place */}
                    <div className="text-center">
                      <div className="w-12 h-12 bg-gradient-secondary rounded-xl flex items-center justify-center text-2xl mb-2">
                        {mockPlayers[2].avatar}
                      </div>
                      <div className="w-16 h-10 bg-accent rounded-t-lg flex items-center justify-center font-bold text-lg">
                        3
                      </div>
                      <p className="text-xs mt-1 truncate w-16">{mockPlayers[2].name}</p>
                      <p className="text-xs text-muted-foreground">{mockPlayers[2].score.toLocaleString()}</p>
                    </div>
                  </div>

                  {/* Other Players */}
                  {mockPlayers.slice(3).map((player, index) => (
                    <div key={player.id} className="flex items-center space-x-3 p-3 bg-muted rounded-lg">
                      <div className="w-8 h-8 bg-gradient-secondary rounded-lg flex items-center justify-center font-bold">
                        {player.rank}
                      </div>
                      <Avatar className="w-8 h-8">
                        <AvatarFallback>{player.avatar}</AvatarFallback>
                      </Avatar>
                      <div className="flex-1 min-w-0">
                        <p className="font-medium truncate">{player.name}</p>
                        <p className="text-sm text-muted-foreground">{player.score.toLocaleString()} Points</p>
                      </div>
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
                    <span>游戏区域</span>
                  </CardTitle>
                  <div className="text-right">
                    <div className="text-2xl font-bold text-primary">
                      {mockGameData.currentPlayers}
                    </div>
                    <div className="text-sm text-muted-foreground">
                      / {mockGameData.totalPlayers} 人
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
                        我的选择
                      </div>
                    </CardContent>
                  </Card>

                  <Card className="bg-gradient-primary">
                    <CardContent className="p-4 text-center">
                      <div className="text-2xl font-bold text-primary-foreground">
                        {mockGameData.prize.toLocaleString()}
                      </div>
                      <div className="text-sm text-primary-foreground/70">
                        奖励积分
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
                    确认选择
                  </GradientButton>
                  
                  <GradientButton 
                    variant="outline" 
                    size="lg"
                    onClick={() => setSelectedNumber(null)}
                    className="w-full"
                  >
                    清除选择
                  </GradientButton>
                </div>

                {/* Game Status */}
                {selectedNumber && (
                  <div className="mt-4 p-4 bg-accent/20 rounded-lg text-center">
                    <p className="text-accent-foreground">
                      已选择数字 <span className="font-bold text-lg">{selectedNumber}</span>
                      {mockGameData.selectedNumbers.includes(selectedNumber) && selectedNumber !== mockGameData.mySelection && 
                        <span className="text-destructive ml-2">(已被选择)</span>
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
