import { useNavigate } from "react-router-dom"
import { GradientButton } from "@/components/ui/gradient-button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Trophy, Users, Target, Gamepad2, TwitterIcon, GithubIcon, Shield, Lock } from "lucide-react"
import { ConnectButton } from '@rainbow-me/rainbowkit'
import { useAccount } from 'wagmi'
import { useToast } from "@/hooks/use-toast"
import { useGetActiveGames } from "@/hooks/contract/useGameContract"
import { CONTRACT_CONFIG } from "@/contracts/config"

const LandingPage = () => {
  const navigate = useNavigate()
  const { toast } = useToast()
  const { isConnected } = useAccount()
  
  // 获取活跃游戏列表
  const { activeGames, isLoading: gamesLoading } = useGetActiveGames()

  // Quick Join 逻辑：找到接近满员的可用房间
  const handleQuickJoin = () => {
    if (!isConnected) {
      toast({
        title: "Wallet not connected",
        description: "Please connect your wallet to join a game.",
        variant: "destructive"
      })
      return
    }

    if (gamesLoading) {
      toast({
        title: "Loading games...",
        description: "Please wait while we fetch available rooms.",
      })
      return
    }

    if (!activeGames || activeGames.length === 0) {
      toast({
        title: "No available rooms",
        description: "Currently no open game rooms available. Create a new room to start playing!",
        variant: "destructive"
      })
      return
    }

    // 计算剩余时间函数
    const getTimeLeft = (deadline: bigint) => {
      const now = Math.floor(Date.now() / 1000)
      const deadlineSeconds = Number(deadline)
      return Math.max(0, deadlineSeconds - now)
    }

    // 过滤可加入的房间：状态为Open，未过期，未满员
    const availableRooms = activeGames.filter(game => {
      const timeLeft = getTimeLeft(game.deadline)
      return (
        game.status === CONTRACT_CONFIG.GameStatus.Open &&
        timeLeft > 0 &&
        game.playerCount < game.maxPlayers
      )
    })

    if (availableRooms.length === 0) {
      toast({
        title: "No joinable rooms",
        description: "All available rooms are either full or expired. Try creating a new room!",
        variant: "destructive"
      })
      return
    }

    // 按完成度排序：优先选择接近满员的房间
    const sortedRooms = availableRooms.sort((a, b) => {
      const aCompleteness = a.playerCount / a.maxPlayers
      const bCompleteness = b.playerCount / b.maxPlayers
      return bCompleteness - aCompleteness // 降序：越接近满员的排在前面
    })

    const bestRoom = sortedRooms[0]
    
    toast({
      title: "Joining room...",
      description: `Found room with ${bestRoom.playerCount}/${bestRoom.maxPlayers} players!`,
    })

    navigate(`/game?room=${bestRoom.gameId.toString()}`)
  }

  const features = [
    {
      icon: Shield,
      title: "FHE Privacy Protection",
      description: "Your number choices remain encrypted on-chain using ZAMA's FHE technology until game completion"
    },
    {
      icon: Lock,
      title: "Confidential by Design",
      description: "Game logic runs on encrypted data without revealing player selections, ensuring true privacy"
    },
    {
      icon: Users,
      title: "Trustless Multiplayer",
      description: "No central authority can see your choices - privacy guaranteed by cryptographic proofs"
    },
    {
      icon: Trophy,
      title: "Verifiable Fairness",
      description: "All game results are cryptographically verifiable while maintaining complete player privacy"
    }
  ]

  return (
    <div className="min-h-screen bg-gradient-background">
      {/* Header */}
      <header className="container mx-auto px-4 py-6">
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-2">
            <div className="w-8 h-8 rounded-lg flex items-center justify-center overflow-hidden">
              <img 
                src="/uninum.png" 
                alt="Unique Number Game Logo" 
                className="w-full h-full object-cover"
              />
            </div>
            <span className="text-xl font-bold text-foreground">Unique Number</span>
          </div>
          <div className="flex items-center gap-4">
            <GradientButton 
              variant="outline"
              onClick={() => navigate("/leaderboard")}
            >
              <Trophy className="w-4 h-4 mr-2" />
              Leaderboard
            </GradientButton>
           
            <GradientButton 
              variant="outline" 
              onClick={handleQuickJoin}
              disabled={gamesLoading}
            >
              {gamesLoading ? "Loading..." : "Quick Join"}
            </GradientButton>

             <ConnectButton />
          </div>
        </div>
      </header>

      {/* Hero Section */}
      <section className="container mx-auto px-4 py-16 text-center">
        <div className="max-w-4xl mx-auto">
          <h1 className="text-4xl md:text-6xl font-bold text-foreground mb-6 animate-slide-in">
            Unique Number Game
            <span className="block text-2xl md:text-4xl text-primary mt-2">
              Powered by Zama's fhEVM
            </span>
          </h1>
          
          <p className="text-lg md:text-xl text-muted-foreground mb-8 max-w-2xl mx-auto">
            The world's first privacy-preserving multiplayer number game using Fully Homomorphic Encryption. Your choices stay encrypted on-chain until reveal - no one can see your strategy!
          </p>

          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <GradientButton 
              size="xl" 
              onClick={() => navigate("/create-room")}
              className="animate-pulse-glow"
            >
              Create Room
            </GradientButton>
            <GradientButton 
              variant="secondary" 
              size="xl"
              onClick={() => navigate("/join-room")}
            >
              Join Room
            </GradientButton>
          </div>
        </div>
      </section>

      {/* Demo Video */}
      <section className="container mx-auto px-4 py-16">
        <div className="max-w-4xl mx-auto text-center">
          <h2 className="text-3xl font-bold text-foreground mb-8">
            Watch How It Works
          </h2>
          <p className="text-lg text-muted-foreground mb-8">
            See the Unique Number Game in action and learn how privacy-preserving gameplay works
          </p>
          <div className="relative w-full max-w-3xl mx-auto aspect-video rounded-xl overflow-hidden shadow-2xl bg-card">
            <iframe
              src="https://www.youtube.com/embed/5AlisRBd1tI"
              title="Unique Number Game Demo"
              className="w-full h-full"
              frameBorder="0"
              allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share"
              allowFullScreen
            />
          </div>
        </div>
      </section>

      {/* Features */}
      <section className="container mx-auto px-4 py-16">
        <h2 className="text-3xl font-bold text-center text-foreground mb-12">
          Revolutionary Privacy Features
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
            How to Play
          </h2>
          
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            <div className="text-center">
              <div className="w-16 h-16 bg-gradient-primary rounded-full mx-auto mb-4 flex items-center justify-center text-2xl font-bold text-primary-foreground">
                1
              </div>
              <h3 className="text-xl font-semibold mb-2">Create or Join Room</h3>
              <p className="text-muted-foreground">
                Set game parameters (players, number range, rewards) or join existing rooms
              </p>
            </div>
            
            <div className="text-center">
              <div className="w-16 h-16 bg-gradient-primary rounded-full mx-auto mb-4 flex items-center justify-center text-2xl font-bold text-primary-foreground">
                2
              </div>
              <h3 className="text-xl font-semibold mb-2">Choose & Encrypt</h3>
              <p className="text-muted-foreground">
                Select your number - it's encrypted using ZAMA FHE and hidden from all players until reveal
              </p>
            </div>
            
            <div className="text-center">
              <div className="w-16 h-16 bg-gradient-primary rounded-full mx-auto mb-4 flex items-center justify-center text-2xl font-bold text-primary-foreground">
                3
              </div>
              <h3 className="text-xl font-semibold mb-2">Cryptographic Reveal</h3>
              <p className="text-muted-foreground">
                When time expires, FHE reveals all choices simultaneously - unique number holders win!
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="bg-card py-8 mt-16">
        <div className="container mx-auto px-4 text-center">
          <p className="text-muted-foreground mb-4">
            © 2025 Unique Number Game. Challenge your strategic thinking and enjoy the fun!
          </p>
          <div className="flex justify-center items-center space-x-6">
            <a 
              href="https://x.com/coder_chao" 
              target="_blank" 
              rel="noopener noreferrer"
              className="flex items-center space-x-2 text-muted-foreground hover:text-primary transition-colors duration-200"
            >
              <TwitterIcon className="w-4 h-4" />
              <span>Twitter</span>
            </a>
            <a 
              href="http://github.com/huaigu" 
              target="_blank" 
              rel="noopener noreferrer"
              className="flex items-center space-x-2 text-muted-foreground hover:text-primary transition-colors duration-200"
            >
              <GithubIcon className="w-4 h-4" />
              <span>GitHub</span>
            </a>
          </div>
        </div>
      </footer>
    </div>
  )
}

export default LandingPage