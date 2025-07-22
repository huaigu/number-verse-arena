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
    name: "快速对战",
    currentPlayers: 3,
    maxPlayers: 6,
    numberRange: "1-16",
    prize: 1000,
    timeLeft: 45,
    status: "waiting"
  },
  {
    id: "ROOM002", 
    name: "新手友好",
    currentPlayers: 2,
    maxPlayers: 4,
    numberRange: "1-9",
    prize: 500,
    timeLeft: 120,
    status: "waiting"
  },
  {
    id: "ROOM003",
    name: "挑战模式",
    currentPlayers: 6,
    maxPlayers: 8,
    numberRange: "1-25",
    prize: 2000,
    timeLeft: 30,
    status: "starting"
  },
  {
    id: "ROOM004",
    name: "经典模式",
    currentPlayers: 8,
    maxPlayers: 8,
    numberRange: "1-20",
    prize: 1500,
    timeLeft: 0,
    status: "full"
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
        title: "请输入房间代码",
        variant: "destructive"
      })
      return
    }

    setIsJoining(true)
    
    // Simulate API call
    setTimeout(() => {
      toast({
        title: "成功加入房间！",
        description: `房间ID: ${roomCode}`,
      })
      navigate(`/game?room=${roomCode}`)
      setIsJoining(false)
    }, 1000)
  }

  const handleJoinRoom = (roomId: string, status: string) => {
    if (status === "full") {
      toast({
        title: "房间已满",
        description: "请选择其他房间",
        variant: "destructive"
      })
      return
    }

    if (status === "starting") {
      toast({
        title: "游戏即将开始",
        description: "正在加入房间...",
      })
    }

    setTimeout(() => {
      navigate(`/game?room=${roomId}`)
    }, 500)
  }

  const getStatusBadge = (status: string) => {
    switch (status) {
      case "waiting":
        return <Badge variant="secondary">等待中</Badge>
      case "starting":
        return <Badge className="bg-warning text-warning-foreground">即将开始</Badge>
      case "full":
        return <Badge variant="destructive">已满</Badge>
      default:
        return <Badge variant="outline">未知</Badge>
    }
  }

  const getStatusColor = (status: string) => {
    switch (status) {
      case "waiting":
        return "border-secondary"
      case "starting":
        return "border-warning"
      case "full":
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
            返回
          </GradientButton>
          <h1 className="text-3xl font-bold text-foreground">加入游戏房间</h1>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Left Side - Join by Code */}
          <div className="lg:col-span-1">
            <Card className="shadow-card h-fit">
              <CardHeader>
                <CardTitle className="flex items-center space-x-2">
                  <Search className="w-5 h-5" />
                  <span>房间代码</span>
                </CardTitle>
                <CardDescription>输入6位房间代码直接加入</CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="roomCode">房间代码</Label>
                  <Input
                    id="roomCode"
                    placeholder="例如: ABC123"
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
                  {isJoining ? "加入中..." : "加入房间"}
                </GradientButton>

                <div className="pt-4 border-t">
                  <GradientButton
                    variant="outline"
                    className="w-full"
                    onClick={() => navigate("/create-room")}
                  >
                    创建新房间
                  </GradientButton>
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Right Side - Available Rooms */}
          <div className="lg:col-span-2">
            <Card className="shadow-card">
              <CardHeader>
                <CardTitle>可用房间</CardTitle>
                <CardDescription>选择一个房间快速加入游戏</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  {mockRooms.map((room) => (
                    <div
                      key={room.id}
                      className={`p-4 border-2 rounded-lg transition-all duration-300 ${getStatusColor(room.status)} ${
                        room.status !== "full" ? "hover:shadow-card cursor-pointer hover:-translate-y-1" : "opacity-60"
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
                          <span>{room.prize.toLocaleString()}</span>
                        </div>
                        
                        <div className="flex items-center space-x-2 text-sm">
                          <Timer className="w-4 h-4 text-muted-foreground" />
                          <span>{room.timeLeft > 0 ? `${room.timeLeft}s` : "已开始"}</span>
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
                    <h3 className="text-xl font-semibold mb-2">暂无可用房间</h3>
                    <p className="text-muted-foreground mb-4">
                      当前没有开放的游戏房间，创建一个新房间开始游戏吧！
                    </p>
                    <GradientButton onClick={() => navigate("/create-room")}>
                      创建房间
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