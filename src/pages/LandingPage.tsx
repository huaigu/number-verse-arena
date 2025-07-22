import { useNavigate } from "react-router-dom"
import { GradientButton } from "@/components/ui/gradient-button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Trophy, Users, Target, Gamepad2 } from "lucide-react"

const LandingPage = () => {
  const navigate = useNavigate()

  const features = [
    {
      icon: Users,
      title: "多人游戏",
      description: "创建房间，邀请好友一起参与数字选择游戏"
    },
    {
      icon: Target,
      title: "策略选择",
      description: "选择独特数字，避免与他人重复，争夺奖励"
    },
    {
      icon: Trophy,
      title: "排行榜",
      description: "实时查看积分排名，成为最强玩家"
    },
    {
      icon: Gamepad2,
      title: "简单易玩",
      description: "规则简单，上手容易，适合所有年龄段"
    }
  ]

  return (
    <div className="min-h-screen bg-gradient-background">
      {/* Header */}
      <header className="container mx-auto px-4 py-6">
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-2">
            <div className="w-8 h-8 bg-gradient-primary rounded-lg flex items-center justify-center">
              <span className="text-primary-foreground font-bold">U</span>
            </div>
            <span className="text-xl font-bold text-foreground">Unique Number</span>
          </div>
          <GradientButton 
            variant="outline" 
            onClick={() => navigate("/game")}
          >
            进入游戏
          </GradientButton>
        </div>
      </header>

      {/* Hero Section */}
      <section className="container mx-auto px-4 py-16 text-center">
        <div className="max-w-4xl mx-auto">
          <h1 className="text-4xl md:text-6xl font-bold text-foreground mb-6 animate-slide-in">
            独特数字游戏
            <span className="block text-2xl md:text-4xl text-primary mt-2">
              挑战你的策略思维
            </span>
          </h1>
          
          <p className="text-lg md:text-xl text-muted-foreground mb-8 max-w-2xl mx-auto">
            在这个刺激的多人游戏中，选择你的独特数字，避免与他人重复，赢取丰厚奖励！
          </p>

          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <GradientButton 
              size="xl" 
              onClick={() => navigate("/create-room")}
              className="animate-pulse-glow"
            >
              创建房间
            </GradientButton>
            <GradientButton 
              variant="secondary" 
              size="xl"
              onClick={() => navigate("/join-room")}
            >
              加入房间
            </GradientButton>
          </div>
        </div>
      </section>

      {/* Features */}
      <section className="container mx-auto px-4 py-16">
        <h2 className="text-3xl font-bold text-center text-foreground mb-12">
          游戏特色
        </h2>
        
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          {features.map((feature, index) => (
            <Card 
              key={index} 
              className="shadow-card hover:shadow-float transition-all duration-300 hover:-translate-y-2"
            >
              <CardHeader className="text-center">
                <div className="w-12 h-12 bg-gradient-primary rounded-xl mx-auto mb-4 flex items-center justify-center">
                  <feature.icon className="w-6 h-6 text-primary-foreground" />
                </div>
                <CardTitle className="text-lg">{feature.title}</CardTitle>
              </CardHeader>
              <CardContent>
                <CardDescription className="text-center">
                  {feature.description}
                </CardDescription>
              </CardContent>
            </Card>
          ))}
        </div>
      </section>

      {/* How to Play */}
      <section className="container mx-auto px-4 py-16">
        <div className="max-w-4xl mx-auto">
          <h2 className="text-3xl font-bold text-center text-foreground mb-12">
            游戏规则
          </h2>
          
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            <div className="text-center">
              <div className="w-16 h-16 bg-gradient-primary rounded-full mx-auto mb-4 flex items-center justify-center text-2xl font-bold text-primary-foreground">
                1
              </div>
              <h3 className="text-xl font-semibold mb-2">创建或加入房间</h3>
              <p className="text-muted-foreground">
                设置游戏参数（人数、数字范围、奖励）或加入现有房间
              </p>
            </div>
            
            <div className="text-center">
              <div className="w-16 h-16 bg-gradient-primary rounded-full mx-auto mb-4 flex items-center justify-center text-2xl font-bold text-primary-foreground">
                2
              </div>
              <h3 className="text-xl font-semibold mb-2">选择独特数字</h3>
              <p className="text-muted-foreground">
                在指定范围内选择一个数字，记住：选择独特才能获胜
              </p>
            </div>
            
            <div className="text-center">
              <div className="w-16 h-16 bg-gradient-primary rounded-full mx-auto mb-4 flex items-center justify-center text-2xl font-bold text-primary-foreground">
                3
              </div>
              <h3 className="text-xl font-semibold mb-2">赢取奖励</h3>
              <p className="text-muted-foreground">
                独特数字的玩家获得奖励，重复选择的玩家无法获得积分
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="bg-card py-8 mt-16">
        <div className="container mx-auto px-4 text-center">
          <p className="text-muted-foreground">
            © 2024 Unique Number Game. 挑战你的策略思维，享受游戏乐趣！
          </p>
        </div>
      </footer>
    </div>
  )
}

export default LandingPage