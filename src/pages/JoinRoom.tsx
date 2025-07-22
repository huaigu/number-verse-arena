import { useState } from "react"
import { useNavigate } from "react-router-dom"
import { GradientButton } from "@/components/ui/gradient-button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Badge } from "@/components/ui/badge"
import { useToast } from "@/hooks/use-toast"
import { ArrowLeft, Users, Target, Trophy, Timer, Search } from "lucide-react"

// Mock available rooms
const mockRooms = [
  {
    id: "ROOM001",
    name: "Quick Battle",
    currentPlayers: 0,
    maxPlayers: 6,
    numberRange: "1-16",
    entryFee: 0.1,
    timeLeft: 180,
    status: "waiting"
  },
  {
    id: "ROOM002", 
    name: "Beginner Friendly",
    currentPlayers: 2,
    maxPlayers: 4,
    numberRange: "1-9",
    entryFee: 0.05,
    timeLeft: 120,
    status: "started"
  },
  {
    id: "ROOM003",
    name: "Challenge Mode",
    currentPlayers: 6,
    maxPlayers: 8,
    numberRange: "1-25",
    entryFee: 0.2,
    timeLeft: 30,
    status: "started"
  },
  {
    id: "ROOM004",
    name: "Classic Mode",
    currentPlayers: 8,
    maxPlayers: 8,
    numberRange: "1-20",
    entryFee: 0.15,
    timeLeft: 0,
    status: "finished"
  },
  {
    id: "ROOM005",
    name: "Speed Run",
    currentPlayers: 4,
    maxPlayers: 6,
    numberRange: "1-12",
    entryFee: 0.08,
    timeLeft: 0,
    status: "finished"
  }
]

const JoinRoom = () => {
  const navigate = useNavigate()
  const { toast } = useToast()
  
  const [roomCode, setRoomCode] = useState("")
  const [isJoining, setIsJoining] = useState(false)

  const handleJoinByCode = async () => {
    if (!roomCode.trim()) {
      toast({
        title: "Please enter room code",
        variant: "destructive"
      })
      return
    }

    setIsJoining(true)
    
    // Simulate API call
    setTimeout(() => {
      toast({
        title: "Successfully joined room!",
        description: `Room ID: ${roomCode}`,
      })
      navigate(`/game?room=${roomCode}`)
      setIsJoining(false)
    }, 1000)
  }

  const handleJoinRoom = (roomId: string, status: string) => {
    if (status === "finished") {
      toast({
        title: "Game finished",
        description: "This room has already finished",
        variant: "destructive"
      })
      return
    }

    if (status === "started") {
      toast({
        title: "Game in progress",
        description: "Joining ongoing game...",
      })
    }

    setTimeout(() => {
      navigate(`/game?room=${roomId}`)
    }, 500)
  }

  const getStatusBadge = (status: string) => {
    switch (status) {
      case "waiting":
        return <Badge variant="secondary">Waiting</Badge>
      case "started":
        return <Badge className="bg-warning text-warning-foreground">Started</Badge>
      case "finished":
        return <Badge variant="destructive">Finished</Badge>
      default:
        return <Badge variant="outline">Unknown</Badge>
    }
  }

  const getStatusColor = (status: string) => {
    switch (status) {
      case "waiting":
        return "border-secondary"
      case "started":
        return "border-warning"
      case "finished":
        return "border-destructive"
      default:
        return "border-border"
    }
  }

  return (
    <div className="min-h-screen bg-gradient-background p-4">
      <div className="max-w-4xl mx-auto">
        {/* Header */}
        <div className="flex items-center space-x-4 mb-8">
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
                <div className="space-y-2">
                  <Label htmlFor="roomCode">Room Code</Label>
                  <Input
                    id="roomCode"
                    placeholder="e.g: ABC123"
                    value={roomCode}
                    onChange={(e) => setRoomCode(e.target.value.toUpperCase())}
                    maxLength={6}
                    className="text-center text-lg font-mono"
                  />
                </div>
                
                <GradientButton
                  className="w-full"
                  onClick={handleJoinByCode}
                  disabled={isJoining || roomCode.length < 6}
                >
                  {isJoining ? "Joining..." : "Join Room"}
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
                <CardTitle>Available Rooms</CardTitle>
                <CardDescription>Choose a room to quickly join the game</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  {mockRooms.map((room) => (
                    <div
                      key={room.id}
                      className={`p-4 border-2 rounded-lg transition-all duration-300 ${getStatusColor(room.status)} ${
                        room.status !== "finished" ? "hover:shadow-card cursor-pointer hover:-translate-y-1" : "opacity-60"
                      }`}
                      onClick={() => handleJoinRoom(room.id, room.status)}
                    >
                      <div className="flex items-center justify-between mb-3">
                        <div className="flex items-center space-x-3">
                          <h3 className="font-semibold text-lg">{room.name}</h3>
                          {getStatusBadge(room.status)}
                        </div>
                        <Badge variant="outline" className="font-mono">
                          {room.id}
                        </Badge>
                      </div>

                      <div className="grid grid-cols-2 md:grid-cols-4 gap-3 mb-3">
                        <div className="flex items-center space-x-2 text-sm">
                          <Users className="w-4 h-4 text-muted-foreground" />
                          <span>{room.currentPlayers}/{room.maxPlayers}</span>
                        </div>
                        
                        <div className="flex items-center space-x-2 text-sm">
                          <Target className="w-4 h-4 text-muted-foreground" />
                          <span>{room.numberRange}</span>
                        </div>
                        
                        <div className="flex items-center space-x-2 text-sm">
                          <Trophy className="w-4 h-4 text-muted-foreground" />
                          <span>{room.entryFee} ETH</span>
                        </div>
                        
                        <div className="flex items-center space-x-2 text-sm">
                          <Timer className="w-4 h-4 text-muted-foreground" />
                          <span>{room.timeLeft > 0 ? `${room.timeLeft}s` : "Started"}</span>
                        </div>
                      </div>

                      {/* Player capacity bar */}
                      <div className="w-full bg-muted rounded-full h-2">
                        <div 
                          className="bg-gradient-primary h-2 rounded-full transition-all duration-300"
                          style={{ width: `${(room.currentPlayers / room.maxPlayers) * 100}%` }}
                        />
                      </div>
                    </div>
                  ))}
                </div>

                {mockRooms.length === 0 && (
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
              </CardContent>
            </Card>
          </div>
        </div>
      </div>
    </div>
  )
}

export default JoinRoom