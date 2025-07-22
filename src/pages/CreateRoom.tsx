import { useState } from "react"
import { useNavigate } from "react-router-dom"
import { GradientButton } from "@/components/ui/gradient-button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Slider } from "@/components/ui/slider"
import { Badge } from "@/components/ui/badge"
import { useToast } from "@/hooks/use-toast"
import { ArrowLeft, Users, Target, Trophy, Timer } from "lucide-react"

const CreateRoom = () => {
  const navigate = useNavigate()
  const { toast } = useToast()
  
  const [roomSettings, setRoomSettings] = useState({
    maxPlayers: 6,
    minNumber: 1,
    maxNumber: 16,
    prize: 1000,
    timeLimit: 60
  })

  const [isCreating, setIsCreating] = useState(false)

  const handleCreateRoom = async () => {
    setIsCreating(true)
    
    // Simulate API call
    setTimeout(() => {
      const roomId = Math.random().toString(36).substr(2, 6).toUpperCase()
      toast({
        title: "房间创建成功！",
        description: `房间ID: ${roomId}`,
      })
      navigate(`/game?room=${roomId}`)
      setIsCreating(false)
    }, 1500)
  }

  const presets = [
    {
      name: "快速游戏",
      description: "4人小局，快速开始",
      settings: { maxPlayers: 4, minNumber: 1, maxNumber: 9, prize: 500, timeLimit: 30 }
    },
    {
      name: "标准游戏",
      description: "6人标准局",
      settings: { maxPlayers: 6, minNumber: 1, maxNumber: 16, prize: 1000, timeLimit: 60 }
    },
    {
      name: "挑战模式",
      description: "8人大局，高难度",
      settings: { maxPlayers: 8, minNumber: 1, maxNumber: 25, prize: 2000, timeLimit: 90 }
    }
  ]

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
          <h1 className="text-3xl font-bold text-foreground">创建游戏房间</h1>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
          {/* Left Side - Room Settings */}
          <div className="space-y-6">
            {/* Quick Presets */}
            <Card className="shadow-card">
              <CardHeader>
                <CardTitle>快速设置</CardTitle>
                <CardDescription>选择预设配置快速开始游戏</CardDescription>
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
                        {preset.settings.maxPlayers}人
                      </Badge>
                    </div>
                  </div>
                ))}
              </CardContent>
            </Card>

            {/* Custom Settings */}
            <Card className="shadow-card">
              <CardHeader>
                <CardTitle>自定义设置</CardTitle>
                <CardDescription>调整游戏参数以适合你的需求</CardDescription>
              </CardHeader>
              <CardContent className="space-y-6">
                {/* Max Players */}
                <div className="space-y-3">
                  <Label className="flex items-center space-x-2">
                    <Users className="w-4 h-4" />
                    <span>最大玩家数量: {roomSettings.maxPlayers}</span>
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
                    <span>2人</span>
                    <span>10人</span>
                  </div>
                </div>

                {/* Number Range */}
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label className="flex items-center space-x-2">
                      <Target className="w-4 h-4" />
                      <span>最小数字</span>
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
                    <Label>最大数字</Label>
                    <Input
                      type="number"
                      value={roomSettings.maxNumber}
                      onChange={(e) => setRoomSettings(prev => ({ ...prev, maxNumber: parseInt(e.target.value) || 1 }))}
                      min={roomSettings.minNumber}
                      max={100}
                    />
                  </div>
                </div>

                {/* Prize */}
                <div className="space-y-3">
                  <Label className="flex items-center space-x-2">
                    <Trophy className="w-4 h-4" />
                    <span>奖励积分: {roomSettings.prize.toLocaleString()}</span>
                  </Label>
                  <Slider
                    value={[roomSettings.prize]}
                    onValueChange={([value]) => setRoomSettings(prev => ({ ...prev, prize: value }))}
                    max={5000}
                    min={100}
                    step={100}
                    className="w-full"
                  />
                  <div className="flex justify-between text-sm text-muted-foreground">
                    <span>100</span>
                    <span>5,000</span>
                  </div>
                </div>

                {/* Time Limit */}
                <div className="space-y-3">
                  <Label className="flex items-center space-x-2">
                    <Timer className="w-4 h-4" />
                    <span>时间限制: {roomSettings.timeLimit}秒</span>
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
                    <span>15秒</span>
                    <span>5分钟</span>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Right Side - Preview */}
          <div className="space-y-6">
            <Card className="shadow-card">
              <CardHeader>
                <CardTitle>房间预览</CardTitle>
                <CardDescription>查看你的房间设置</CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="grid grid-cols-2 gap-4">
                  <div className="text-center p-4 bg-gradient-secondary rounded-lg">
                    <Users className="w-6 h-6 mx-auto mb-2 text-secondary-foreground" />
                    <div className="text-2xl font-bold text-secondary-foreground">
                      {roomSettings.maxPlayers}
                    </div>
                    <div className="text-sm text-secondary-foreground/70">最大玩家</div>
                  </div>

                  <div className="text-center p-4 bg-gradient-primary rounded-lg">
                    <Target className="w-6 h-6 mx-auto mb-2 text-primary-foreground" />
                    <div className="text-2xl font-bold text-primary-foreground">
                      {roomSettings.minNumber}-{roomSettings.maxNumber}
                    </div>
                    <div className="text-sm text-primary-foreground/70">数字范围</div>
                  </div>

                  <div className="text-center p-4 bg-game-grid rounded-lg">
                    <Trophy className="w-6 h-6 mx-auto mb-2 text-primary-foreground" />
                    <div className="text-2xl font-bold text-primary-foreground">
                      {roomSettings.prize.toLocaleString()}
                    </div>
                    <div className="text-sm text-primary-foreground/70">奖励积分</div>
                  </div>

                  <div className="text-center p-4 bg-accent rounded-lg">
                    <Timer className="w-6 h-6 mx-auto mb-2 text-accent-foreground" />
                    <div className="text-2xl font-bold text-accent-foreground">
                      {roomSettings.timeLimit}s
                    </div>
                    <div className="text-sm text-accent-foreground/70">时间限制</div>
                  </div>
                </div>

                {/* Game Rules Preview */}
                <div className="mt-6 p-4 bg-muted rounded-lg">
                  <h4 className="font-semibold mb-2">游戏规则</h4>
                  <ul className="text-sm text-muted-foreground space-y-1">
                    <li>• 每位玩家只能选择一个数字</li>
                    <li>• 选择独特数字的玩家可获得奖励</li>
                    <li>• 重复选择的数字无法获得积分</li>
                    <li>• {roomSettings.timeLimit}秒内必须完成选择</li>
                  </ul>
                </div>
              </CardContent>
            </Card>

            {/* Create Button */}
            <GradientButton
              size="xl"
              className="w-full"
              onClick={handleCreateRoom}
              disabled={isCreating}
            >
              {isCreating ? "创建中..." : "创建房间"}
            </GradientButton>

            <GradientButton
              variant="outline"
              size="lg"
              className="w-full"
              onClick={() => navigate("/join-room")}
            >
              或者加入现有房间
            </GradientButton>
          </div>
        </div>
      </div>
    </div>
  )
}

export default CreateRoom