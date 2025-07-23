import React, { useState } from "react"
import { useNavigate } from "react-router-dom"
import { GameCard } from "@/components/ui/game-card"
import { GradientButton } from "@/components/ui/gradient-button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Avatar, AvatarImage, AvatarFallback } from "@/components/ui/avatar"
import { Trophy, Users, Clock, Home, RotateCcw, Wallet } from "lucide-react"
import { useAccount } from 'wagmi'
import { ConnectButton } from '@rainbow-me/rainbowkit'
import { useToast } from "@/hooks/use-toast"

// Mock data for demonstration
const mockGameData = {
  roomId: "ROOM001",
  totalPlayers: 6,
  currentPlayers: 3,
  numberRange: { min: 1, max: 16 },
  entryFeeETH: 0.1,
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
  const { toast } = useToast()
  const { address, isConnected } = useAccount()
  const [selectedNumber, setSelectedNumber] = useState<number | null>(mockGameData.mySelection)
  const [hasConfirmedChoice, setHasConfirmedChoice] = useState(false)
  const [gameStarted, setGameStarted] = useState(true)
  const [userParticipated, setUserParticipated] = useState(false)
  const [highlightedNumber, setHighlightedNumber] = useState<number | null>(null)

  // Animation for non-participating users
  React.useEffect(() => {
    if (!userParticipated && !selectedNumber && isConnected) {
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
  }, [userParticipated, selectedNumber, isConnected])

  const generateNumberGrid = () => {
    const numbers = []
    const { min, max } = mockGameData.numberRange
    for (let i = min; i <= max; i++) {
      numbers.push(i)
    }
    return numbers
  }

  const getGridColumns = () => {
    const totalNumbers = mockGameData.numberRange.max - mockGameData.numberRange.min + 1
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
    // If user has participated and confirmed, show their choice with special styling
    if (userParticipated && hasConfirmedChoice && selectedNumber === number) return "selected"
    
    // If user is selecting (but not confirmed yet)
    if (!userParticipated && selectedNumber === number) return "selected"
    
    // If user hasn't participated and this number is highlighted by animation (different color)
    if (!userParticipated && !selectedNumber && highlightedNumber === number) return "highlighted"
    
    // Default available state - no disabled state, all numbers show as available
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

    // Prevent selection if user has already participated
    if (userParticipated) {
      toast({
        title: "Choice already confirmed",
        description: "You have already made your selection for this game.",
        variant: "destructive"
      })
      return
    }
    
    // Allow selection of any number - remove disabled restriction
    setSelectedNumber(selectedNumber === number ? null : number)
  }

  const handleConfirmChoice = () => {
    if (!isConnected) {
      toast({
        title: "Wallet not connected",
        description: "Please connect your wallet to confirm your choice.",
        variant: "destructive"
      })
      return
    }
    
    setHasConfirmedChoice(true)
    setUserParticipated(true)
  }

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
              {mockGameData.roomId}
            </Badge>
          </div>
          
          <div className="flex items-center space-x-3">
            <ConnectButton />
            <GradientButton variant="secondary" size="sm">
              <RotateCcw className="w-4 h-4 mr-1" />
              Reset
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
                    <Clock className="w-3 h-3 text-primary" />
                    <span className="text-sm font-mono font-bold text-primary">{mockGameData.timeLeft}s</span>
                  </div>
                  <div className="text-xs text-muted-foreground">Time</div>
                </CardContent>
              </Card>

              <Card className="bg-gradient-primary shadow-card">
                <CardContent className="p-2 text-center">
                  <Trophy className="w-3 h-3 mx-auto mb-1 text-primary-foreground" />
                  <div className="text-sm font-bold text-primary-foreground">
                    {(mockGameData.totalPlayers * mockGameData.entryFeeETH).toFixed(1)} ETH
                  </div>
                  <div className="text-xs text-primary-foreground/80">Prize</div>
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
                  {hasConfirmedChoice && selectedNumber && (
                    <Badge variant="default" className="text-xs mb-1">Confirmed</Badge>
                  )}
                  <div className="text-xs text-secondary-foreground/80">My Choice</div>
                </CardContent>
              </Card>

              <Card className="shadow-card">
                <CardContent className="p-2 text-center">
                  <Users className="w-3 h-3 mx-auto mb-1 text-primary" />
                  <div className="text-sm font-bold text-primary">
                    {mockGameData.currentPlayers}/{mockGameData.totalPlayers}
                  </div>
                  <div className="text-xs text-muted-foreground">Players</div>
                </CardContent>
              </Card>
            </div>

            {/* Player Slots */}
            <Card className="shadow-card">
              <CardContent className="p-3">
                <div className="grid grid-cols-3 gap-2">
                  {/* Current User */}
                  {mockPlayers.find(p => p.isCurrentUser) && (
                    <div className="text-center p-2 bg-primary/10 rounded border border-primary/30">
                      <Avatar className="w-8 h-8 mx-auto mb-1 ring-1 ring-primary">
                        <AvatarFallback className="bg-primary text-primary-foreground text-xs font-bold">
                          {mockPlayers.find(p => p.isCurrentUser)?.walletAddress.slice(2, 4).toUpperCase()}
                        </AvatarFallback>
                      </Avatar>
                      <p className="text-xs font-medium text-primary">You</p>
                      {mockPlayers.find(p => p.isCurrentUser)?.selectedNumber && (
                        <Badge variant="default" className="text-xs mt-1">
                          #{mockPlayers.find(p => p.isCurrentUser)?.selectedNumber}
                        </Badge>
                      )}
                    </div>
                  )}

                  {/* Other Players */}
                  {mockPlayers.filter(p => !p.isCurrentUser).map((player) => (
                    <div key={player.id} className="text-center p-2 bg-muted/30 rounded">
                      <Avatar className="w-8 h-8 mx-auto mb-1">
                        <AvatarFallback className="bg-gradient-secondary text-secondary-foreground text-xs font-bold">
                          {player.walletAddress.slice(2, 4).toUpperCase()}
                        </AvatarFallback>
                      </Avatar>
                      <p className="text-xs font-medium">P{player.id}</p>
                      {player.selectedNumber && (
                        <Badge variant="secondary" className="text-xs mt-1">
                          #{player.selectedNumber}
                        </Badge>
                      )}
                    </div>
                  ))}

                  {/* Empty Slots */}
                  {Array.from({ length: mockGameData.totalPlayers - mockGameData.currentPlayers }).map((_, index) => (
                    <div key={`empty-${index}`} className="text-center p-2 border border-dashed border-muted rounded">
                      <div className="w-8 h-8 mx-auto mb-1 bg-muted/30 rounded-full flex items-center justify-center">
                        <Users className="w-4 h-4 text-muted-foreground/50" />
                      </div>
                      <p className="text-xs text-muted-foreground">Empty</p>
                    </div>
                  ))}
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
                        userParticipated ? 'cursor-not-allowed' : 'cursor-pointer'
                      } ${
                        highlightedNumber === number && !userParticipated && !selectedNumber 
                          ? 'animate-highlight-pulse' 
                          : ''
                      } ${
                        userParticipated && hasConfirmedChoice && selectedNumber === number
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

                  {/* Status Message - Enhanced */}
                  {selectedNumber && !hasConfirmedChoice && (
                    <div className="p-2 bg-accent/20 rounded text-center">
                      <span className="text-sm text-accent-foreground">
                        Selected: <span className="font-bold text-lg">{selectedNumber}</span>
                      </span>
                    </div>
                  )}

                  {/* Action Buttons - Enhanced */}
                  {!hasConfirmedChoice && !userParticipated && (
                    <div className="grid grid-cols-2 gap-4">
                      <GradientButton 
                        variant="game" 
                        size="lg"
                        disabled={!selectedNumber || !isConnected}
                        className="w-full h-12 text-base font-semibold"
                        onClick={handleConfirmChoice}
                      >
                        {!isConnected ? "Connect Wallet" : "Confirm Choice"}
                      </GradientButton>
                      
                      <GradientButton 
                        variant="outline" 
                        size="lg"
                        onClick={() => setSelectedNumber(null)}
                        className="w-full h-12 text-base"
                        disabled={!isConnected}
                      >
                        Clear Selection
                      </GradientButton>
                    </div>
                  )}

                  {/* User Participated Message */}
                  {userParticipated && hasConfirmedChoice && (
                    <div className="p-2 bg-green-50 border border-green-200 rounded text-center">
                      <div className="flex items-center justify-center space-x-2 text-green-700">
                        <Trophy className="w-5 h-5" />
                        <span className="text-sm font-medium">
                          Choice confirmed! You selected number <span className="font-bold">{selectedNumber}</span>
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
