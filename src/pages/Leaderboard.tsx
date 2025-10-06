import { useState } from "react"
import { useNavigate } from "react-router-dom"
import { useAccount } from 'wagmi'
import { ConnectButton } from '@rainbow-me/rainbowkit'
import { GradientButton } from "@/components/ui/gradient-button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Input } from "@/components/ui/input"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Skeleton } from "@/components/ui/skeleton"
import {
  ArrowLeft,
  Trophy,
  Users,
  DollarSign,
  RefreshCw,
  Search,
  Copy,
  ExternalLink,
  Medal,
  Crown,
  Award,
  Clock,
  Loader2,
  AlertCircle,
  TrendingUp
} from "lucide-react"
import { useToast } from "@/hooks/use-toast"
import { useLeaderboardData } from "@/hooks/useLeaderboardData"
import { formatAddress, formatETH } from "@/contracts/config"
import { LeaderboardEntry, WinnerRecord } from "@/lib/leaderboard-utils"
import { useTranslation } from 'react-i18next'
import { LanguageSwitcher } from '@/components/LanguageSwitcher'

const Leaderboard = () => {
  const navigate = useNavigate()
  const { toast } = useToast()
  const { address, isConnected } = useAccount()
  const { t } = useTranslation()
  
  const [searchQuery, setSearchQuery] = useState("")
  const [currentPage, setCurrentPage] = useState(1)
  const itemsPerPage = 20

  // Get leaderboard data with user address for position tracking
  const {
    leaderboardData,
    recentWinners,
    userPosition,
    totalGames,
    totalPlayers,
    totalPrizePool,
    isLoading,
    error,
    lastUpdated,
    refetch,
    clearCache,
  } = useLeaderboardData(address)

  // Filter leaderboard based on search query
  const filteredLeaderboard = leaderboardData.filter(entry =>
    entry.address.toLowerCase().includes(searchQuery.toLowerCase())
  )

  // Pagination
  const totalPages = Math.ceil(filteredLeaderboard.length / itemsPerPage)
  const paginatedData = filteredLeaderboard.slice(
    (currentPage - 1) * itemsPerPage,
    currentPage * itemsPerPage
  )

  const handleCopyAddress = (address: string) => {
    navigator.clipboard.writeText(address)
    toast({
      title: "Address copied",
      description: "Wallet address copied to clipboard",
    })
  }

  const handleViewGame = (gameId: bigint) => {
    navigate(`/game?room=${gameId.toString()}`)
  }

  const getRankIcon = (rank: number) => {
    switch (rank) {
      case 1:
        return <Crown className="w-5 h-5 text-yellow-500" />
      case 2:
        return <Medal className="w-5 h-5 text-gray-400" />
      case 3:
        return <Award className="w-5 h-5 text-amber-600" />
      default:
        return <span className="w-5 h-5 flex items-center justify-center text-sm font-bold text-muted-foreground">#{rank}</span>
    }
  }

  const formatTimestamp = (timestamp: bigint) => {
    return new Date(Number(timestamp) * 1000).toLocaleDateString()
  }

  return (
    <div className="min-h-screen bg-gradient-background p-4">
      <div className="max-w-7xl mx-auto">
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
            <div>
              <h1 className="text-3xl font-bold text-foreground">Leaderboard</h1>
              <p className="text-muted-foreground">Top players and recent winners</p>
            </div>
          </div>
          <ConnectButton />
        </div>

        {/* Stats Overview */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-6">
          <Card>
            <CardContent className="p-4">
              <div className="flex items-center space-x-2">
                <Trophy className="w-5 h-5 text-primary" />
                <div>
                  <p className="text-sm font-medium">Total Games</p>
                  <p className="text-2xl font-bold">{totalGames}</p>
                </div>
              </div>
            </CardContent>
          </Card>
          
          <Card>
            <CardContent className="p-4">
              <div className="flex items-center space-x-2">
                <DollarSign className="w-5 h-5 text-green-500" />
                <div>
                  <p className="text-sm font-medium">Total Prizes</p>
                  <p className="text-2xl font-bold">{formatETH(totalPrizePool)} ETH</p>
                </div>
              </div>
            </CardContent>
          </Card>
          
          <Card>
            <CardContent className="p-4">
              <div className="flex items-center space-x-2">
                <Users className="w-5 h-5 text-blue-500" />
                <div>
                  <p className="text-sm font-medium">Total Players</p>
                  <p className="text-2xl font-bold">{totalPlayers}</p>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="p-4">
              <div className="flex items-center space-x-2">
                <TrendingUp className="w-5 h-5 text-purple-500" />
                <div>
                  <p className="text-sm font-medium">Avg. Prize</p>
                  <p className="text-2xl font-bold">
                    {totalGames > 0 ? formatETH(totalPrizePool / BigInt(totalGames)) : "0.00"} ETH
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* User Position (if connected) */}
        {isConnected && userPosition && (
          <Card className="mb-6 bg-gradient-to-r from-green-50 to-emerald-50 border-green-300">
            <CardContent className="p-4">
              <div className="flex items-center justify-between">
                <div className="flex items-center space-x-4">
                  <div className="flex items-center space-x-2">
                    {getRankIcon(userPosition.position)}
                    <div>
                      <p className="font-semibold">Your Position: #{userPosition.position}</p>
                      <p className="text-sm text-muted-foreground">
                        {userPosition.entry.gamesWon} wins • {formatETH(userPosition.entry.totalEarnings)} ETH earned
                      </p>
                    </div>
                  </div>
                </div>
                <Badge className="bg-green-500 text-white">
                  Top {Math.round((userPosition.position / leaderboardData.length) * 100)}%
                </Badge>
              </div>
            </CardContent>
          </Card>
        )}

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Main Leaderboard */}
          <div className="lg:col-span-2">
            <Card className="shadow-card">
              <CardHeader>
                <div className="flex items-center justify-between">
                  <div>
                    <CardTitle>Top Players</CardTitle>
                    <CardDescription>Ranked by total winnings</CardDescription>
                  </div>
                  <div className="flex items-center space-x-2">
                    <GradientButton
                      variant="outline"
                      size="sm"
                      onClick={refetch}
                      disabled={isLoading}
                    >
                      <RefreshCw className={`w-4 h-4 mr-2 ${isLoading ? 'animate-spin' : ''}`} />
                      Refresh
                    </GradientButton>
                  </div>
                </div>
                
                {/* Search */}
                <div className="relative">
                  <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                  <Input
                    placeholder="Search by address..."
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    className="pl-10"
                  />
                </div>

                {/* Last Updated */}
                {lastUpdated && (
                  <div className="flex items-center space-x-2 text-sm text-muted-foreground">
                    <Clock className="w-4 h-4" />
                    <span>Last updated: {new Date(lastUpdated).toLocaleString()}</span>
                  </div>
                )}
              </CardHeader>
              
              <CardContent>
                {error ? (
                  <div className="text-center py-12">
                    <AlertCircle className="w-12 h-12 mx-auto text-destructive mb-4" />
                    <h3 className="text-lg font-semibold mb-2">Error Loading Data</h3>
                    <p className="text-muted-foreground mb-4">{error.message}</p>
                    <GradientButton onClick={refetch}>
                      Try Again
                    </GradientButton>
                  </div>
                ) : isLoading && leaderboardData.length === 0 ? (
                  <div className="space-y-3">
                    {Array(10).fill(0).map((_, i) => (
                      <div key={i} className="flex items-center space-x-4">
                        <Skeleton className="h-8 w-8" />
                        <Skeleton className="h-4 w-32" />
                        <Skeleton className="h-4 w-16" />
                        <Skeleton className="h-4 w-20" />
                      </div>
                    ))}
                  </div>
                ) : paginatedData.length > 0 ? (
                  <>
                    <Table>
                      <TableHeader>
                        <TableRow>
                          <TableHead className="w-16">Rank</TableHead>
                          <TableHead>Player</TableHead>
                          <TableHead className="text-center">Wins</TableHead>
                          <TableHead className="text-right">Earnings</TableHead>
                          <TableHead className="text-right">Avg Win</TableHead>
                          <TableHead className="w-20"></TableHead>
                        </TableRow>
                      </TableHeader>
                      <TableBody>
                        {paginatedData.map((entry, index) => {
                          const globalRank = (currentPage - 1) * itemsPerPage + index + 1
                          const isCurrentUser = isConnected && address?.toLowerCase() === entry.address.toLowerCase()
                          
                          return (
                            <TableRow 
                              key={entry.address}
                              className={isCurrentUser ? "bg-green-50 border-green-200" : ""}
                            >
                              <TableCell>
                                <div className="flex items-center justify-center">
                                  {getRankIcon(globalRank)}
                                </div>
                              </TableCell>
                              <TableCell>
                                <div className="flex items-center space-x-2">
                                  <code className="text-sm font-mono bg-muted px-2 py-1 rounded">
                                    {formatAddress(entry.address)}
                                  </code>
                                  {isCurrentUser && (
                                    <Badge variant="secondary" className="text-xs">You</Badge>
                                  )}
                                </div>
                              </TableCell>
                              <TableCell className="text-center font-medium">
                                {entry.gamesWon}
                              </TableCell>
                              <TableCell className="text-right font-bold">
                                {formatETH(entry.totalEarnings)} ETH
                              </TableCell>
                              <TableCell className="text-right text-muted-foreground">
                                {formatETH(entry.averageWinnings)} ETH
                              </TableCell>
                              <TableCell>
                                <GradientButton
                                  size="sm"
                                  variant="outline"
                                  onClick={() => handleCopyAddress(entry.address)}
                                >
                                  <Copy className="w-3 h-3" />
                                </GradientButton>
                              </TableCell>
                            </TableRow>
                          )
                        })}
                      </TableBody>
                    </Table>

                    {/* Pagination */}
                    {totalPages > 1 && (
                      <div className="flex items-center justify-between mt-4">
                        <p className="text-sm text-muted-foreground">
                          Showing {(currentPage - 1) * itemsPerPage + 1} to {Math.min(currentPage * itemsPerPage, filteredLeaderboard.length)} of {filteredLeaderboard.length} players
                        </p>
                        <div className="flex items-center space-x-2">
                          <GradientButton
                            variant="outline"
                            size="sm"
                            onClick={() => setCurrentPage(Math.max(1, currentPage - 1))}
                            disabled={currentPage === 1}
                          >
                            Previous
                          </GradientButton>
                          <span className="text-sm">
                            Page {currentPage} of {totalPages}
                          </span>
                          <GradientButton
                            variant="outline"
                            size="sm"
                            onClick={() => setCurrentPage(Math.min(totalPages, currentPage + 1))}
                            disabled={currentPage === totalPages}
                          >
                            Next
                          </GradientButton>
                        </div>
                      </div>
                    )}
                  </>
                ) : (
                  <div className="text-center py-12">
                    <Trophy className="w-12 h-12 mx-auto text-muted-foreground mb-4" />
                    <h3 className="text-lg font-semibold mb-2">No Players Found</h3>
                    <p className="text-muted-foreground">
                      {searchQuery ? 'No players match your search.' : 'No completed games with winners yet.'}
                    </p>
                  </div>
                )}
              </CardContent>
            </Card>
          </div>

          {/* Recent Winners Sidebar */}
          <div>
            <Card className="shadow-card">
              <CardHeader>
                <CardTitle className="flex items-center space-x-2">
                  <Clock className="w-5 h-5" />
                  <span>Recent Winners</span>
                </CardTitle>
                <CardDescription>Latest game results</CardDescription>
              </CardHeader>
              <CardContent>
                {isLoading && recentWinners.length === 0 ? (
                  <div className="space-y-3">
                    {Array(5).fill(0).map((_, i) => (
                      <div key={i} className="space-y-2">
                        <Skeleton className="h-4 w-full" />
                        <Skeleton className="h-3 w-20" />
                      </div>
                    ))}
                  </div>
                ) : recentWinners.length > 0 ? (
                  <div className="space-y-3">
                    {recentWinners.slice(0, 10).map((winner) => (
                      <div
                        key={`${winner.gameId}-${winner.winner}`}
                        className="p-3 border rounded-lg hover:bg-muted/50 transition-colors cursor-pointer"
                        onClick={() => handleViewGame(winner.gameId)}
                      >
                        <div className="flex items-center justify-between mb-2">
                          <code className="text-sm font-mono">
                            {formatAddress(winner.winner)}
                          </code>
                          <ExternalLink className="w-4 h-4 text-muted-foreground" />
                        </div>
                        <div className="flex items-center justify-between text-sm">
                          <span className="text-muted-foreground">
                            Number: {winner.winningNumber}
                          </span>
                          <span className="font-semibold text-green-600">
                            {formatETH(winner.prize)} ETH
                          </span>
                        </div>
                        <div className="text-xs text-muted-foreground mt-1">
                          {winner.roomName} • {formatTimestamp(winner.timestamp)}
                        </div>
                      </div>
                    ))}
                  </div>
                ) : (
                  <div className="text-center py-8">
                    <Clock className="w-8 h-8 mx-auto text-muted-foreground mb-2" />
                    <p className="text-sm text-muted-foreground">No recent winners</p>
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

export default Leaderboard