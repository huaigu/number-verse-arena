import { useNavigate } from "react-router-dom"
import { GradientButton } from "@/components/ui/gradient-button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Trophy, Users, Target, Gamepad2, TwitterIcon, GithubIcon, Shield, Lock } from "lucide-react"
import { ConnectButton } from '@rainbow-me/rainbowkit'
import { useAccount } from 'wagmi'
import { useToast } from "@/hooks/use-toast"
import { useGetActiveGames } from "@/hooks/contract/useGameContract"
import { CONTRACT_CONFIG } from "@/contracts/config"
import { useTranslation } from 'react-i18next'
import { LanguageSwitcher } from '@/components/LanguageSwitcher'

const LandingPage = () => {
  const navigate = useNavigate()
  const { toast } = useToast()
  const { isConnected } = useAccount()
  const { t } = useTranslation()
  
  // 获取活跃游戏列表
  const { activeGames, isLoading: gamesLoading } = useGetActiveGames()

  // Quick Join 逻辑：找到接近满员的可用房间
  const handleQuickJoin = () => {
    if (!isConnected) {
      toast({
        title: t('toast.walletNotConnected.title'),
        description: t('toast.walletNotConnected.description'),
        variant: "destructive"
      })
      return
    }

    if (gamesLoading) {
      toast({
        title: t('toast.loadingGames.title'),
        description: t('toast.loadingGames.description'),
      })
      return
    }

    if (!activeGames || activeGames.length === 0) {
      toast({
        title: t('toast.noAvailableRooms.title'),
        description: t('toast.noAvailableRooms.description'),
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
        title: t('toast.noJoinableRooms.title'),
        description: t('toast.noJoinableRooms.description'),
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
      title: t('toast.foundRoom.title'),
      description: t('toast.foundRoom.description', { players: bestRoom.playerCount, maxPlayers: bestRoom.maxPlayers }),
    })

    navigate(`/game?room=${bestRoom.gameId.toString()}`)
  }

  const features = [
    {
      icon: Shield,
      title: t('landing.features.fhePrivacy.title'),
      description: t('landing.features.fhePrivacy.description')
    },
    {
      icon: Lock,
      title: t('landing.features.confidential.title'),
      description: t('landing.features.confidential.description')
    },
    {
      icon: Users,
      title: t('landing.features.trustless.title'),
      description: t('landing.features.trustless.description')
    },
    {
      icon: Trophy,
      title: t('landing.features.verifiable.title'),
      description: t('landing.features.verifiable.description')
    }
  ]

  return (
    <div className="min-h-screen bg-gradient-background">
      {/* Warning Banner */}
      <div className="bg-destructive text-destructive-foreground py-3 px-4 text-center">
        <p className="text-sm font-medium">
          {t('landing.warningBanner')}
        </p>
      </div>

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
              {t('common.leaderboard')}
            </GradientButton>

            <GradientButton
              variant="outline"
              onClick={handleQuickJoin}
              disabled={gamesLoading}
            >
              {gamesLoading ? t('common.loading') : t('common.quickJoin')}
            </GradientButton>

            <LanguageSwitcher />
            <ConnectButton />
          </div>
        </div>
      </header>

      {/* Hero Section */}
      <section className="container mx-auto px-4 py-16 text-center">
        <div className="max-w-4xl mx-auto">
          <h1 className="text-4xl md:text-6xl font-bold text-foreground mb-6 animate-slide-in">
            {t('landing.title')}
            <span className="block text-2xl md:text-4xl text-primary mt-2">
              {t('landing.subtitle')}
            </span>
          </h1>

          <p className="text-lg md:text-xl text-muted-foreground mb-8 max-w-2xl mx-auto">
            {t('landing.description')}
          </p>

          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <GradientButton
              size="xl"
              onClick={() => navigate("/create-room")}
              className="animate-pulse-glow"
            >
              {t('common.createRoom')}
            </GradientButton>
            <GradientButton
              variant="secondary"
              size="xl"
              onClick={() => navigate("/join-room")}
            >
              {t('common.joinRoom')}
            </GradientButton>
          </div>
        </div>
      </section>

      {/* Demo Video */}
      <section className="container mx-auto px-4 py-16">
        <div className="max-w-4xl mx-auto text-center">
          <h2 className="text-3xl font-bold text-foreground mb-8">
            {t('landing.demoVideo.title')}
          </h2>
          <p className="text-lg text-muted-foreground mb-8">
            {t('landing.demoVideo.description')}
          </p>
          <div className="relative w-full max-w-3xl mx-auto aspect-video rounded-xl overflow-hidden shadow-2xl bg-card">
            <iframe
              src="https://www.youtube.com/embed/_eOtbshkZ5w"
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
          {t('landing.features.title')}
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
            {t('landing.howToPlay.title')}
          </h2>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            <div className="text-center">
              <div className="w-16 h-16 bg-gradient-primary rounded-full mx-auto mb-4 flex items-center justify-center text-2xl font-bold text-primary-foreground">
                1
              </div>
              <h3 className="text-xl font-semibold mb-2">{t('landing.howToPlay.step1.title')}</h3>
              <p className="text-muted-foreground">
                {t('landing.howToPlay.step1.description')}
              </p>
            </div>

            <div className="text-center">
              <div className="w-16 h-16 bg-gradient-primary rounded-full mx-auto mb-4 flex items-center justify-center text-2xl font-bold text-primary-foreground">
                2
              </div>
              <h3 className="text-xl font-semibold mb-2">{t('landing.howToPlay.step2.title')}</h3>
              <p className="text-muted-foreground">
                {t('landing.howToPlay.step2.description')}
              </p>
            </div>

            <div className="text-center">
              <div className="w-16 h-16 bg-gradient-primary rounded-full mx-auto mb-4 flex items-center justify-center text-2xl font-bold text-primary-foreground">
                3
              </div>
              <h3 className="text-xl font-semibold mb-2">{t('landing.howToPlay.step3.title')}</h3>
              <p className="text-muted-foreground">
                {t('landing.howToPlay.step3.description')}
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="bg-card py-8 mt-16">
        <div className="container mx-auto px-4 text-center">
          <p className="text-muted-foreground mb-4">
            {t('landing.footer.copyright')}
          </p>
          <div className="flex justify-center items-center space-x-6">
            <a
              href="https://x.com/coder_chao"
              target="_blank"
              rel="noopener noreferrer"
              className="flex items-center space-x-2 text-muted-foreground hover:text-primary transition-colors duration-200"
            >
              <TwitterIcon className="w-4 h-4" />
              <span>{t('landing.footer.twitter')}</span>
            </a>
            <a
              href="http://github.com/huaigu"
              target="_blank"
              rel="noopener noreferrer"
              className="flex items-center space-x-2 text-muted-foreground hover:text-primary transition-colors duration-200"
            >
              <GithubIcon className="w-4 h-4" />
              <span>{t('landing.footer.github')}</span>
            </a>
          </div>
        </div>
      </footer>
    </div>
  )
}

export default LandingPage