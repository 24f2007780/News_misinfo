import { useState, useEffect } from 'react'
import { useAuthStore } from '@/store/authStore'
import api from '@/lib/api'
import toast from 'react-hot-toast'
import { 
  Users, 
  Vote, 
  CheckCircle,
  XCircle,
  AlertTriangle,
  HelpCircle,
  Filter,
  Search,
  BarChart3,
  Trophy,
  Clock,
  Eye,
  MessageSquare
} from 'lucide-react'
import Button from '@/components/ui/Button'
import Input from '@/components/ui/Input'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/Card'
import Badge from '@/components/ui/Badge'
import { formatRelativeTime } from '@/lib/utils'

export default function CommunityReport() {
  const { user } = useAuthStore()
  const [claims, setClaims] = useState<any[]>([])
  const [stats, setStats] = useState<any>(null)
  const [leaderboard, setLeaderboard] = useState<any[]>([])
  const [userVotes, setUserVotes] = useState<any[]>([])
  const [loading, setLoading] = useState(true)
  const [activeTab, setActiveTab] = useState('claims')
  const [filters, setFilters] = useState({
    category: 'all',
    status: 'all',
    search: ''
  })
  const [votingClaim, setVotingClaim] = useState<string | null>(null)
  const [selectedVote, setSelectedVote] = useState<{vote: string, confidence: number, evidence: string}>({
    vote: '',
    confidence: 0.5,
    evidence: ''
  })

  useEffect(() => {
    loadData()
  }, [filters])

  const loadData = async () => {
    try {
      const [claimsRes, statsRes, leaderboardRes] = await Promise.all([
        api.get('/community/claims', {
          params: {
            category: filters.category,
            status: filters.status,
            userId: user?.id
          }
        }),
        api.get('/community/stats'),
        api.get('/community/leaderboard')
      ])

      setClaims(claimsRes.data.claims)
      setStats(statsRes.data)
      setLeaderboard(leaderboardRes.data)

      if (user?.id) {
        const userVotesRes = await api.get(`/community/user/${user.id}/votes`)
        setUserVotes(userVotesRes.data.votes)
      }
    } catch (error) {
      toast.error('Failed to load community data')
    } finally {
      setLoading(false)
    }
  }

  const handleVote = async (claimId: string) => {
    if (!selectedVote.vote) {
      toast.error('Please select a verdict')
      return
    }

    try {
      setVotingClaim(claimId)
      
      await api.post('/community/vote', {
        claimId,
        userId: user?.id,
        vote: selectedVote.vote,
        confidence: selectedVote.confidence,
        evidence: selectedVote.evidence
      })

      toast.success('Vote submitted successfully!')
      setVotingClaim(null)
      setSelectedVote({ vote: '', confidence: 0.5, evidence: '' })
      loadData() // Refresh data
    } catch (error: any) {
      toast.error(error.response?.data?.error || 'Failed to submit vote')
      setVotingClaim(null)
    }
  }

  const getVerdictIcon = (verdict: string) => {
    switch (verdict) {
      case 'true':
        return <CheckCircle className="w-4 h-4 text-green-500" />
      case 'false':
        return <XCircle className="w-4 h-4 text-red-500" />
      case 'misleading':
        return <AlertTriangle className="w-4 h-4 text-yellow-500" />
      default:
        return <HelpCircle className="w-4 h-4 text-gray-500" />
    }
  }

  const getVerdictColor = (verdict: string) => {
    switch (verdict) {
      case 'true':
        return 'bg-green-500'
      case 'false':
        return 'bg-red-500'
      case 'misleading':
        return 'bg-yellow-500'
      default:
        return 'bg-gray-500'
    }
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center h-96">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary" />
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-blue-900 to-slate-950 p-6">
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-4xl font-bold text-white mb-2">Community Report</h1>
          <p className="text-gray-400">Collaborative fact-checking powered by community wisdom</p>
        </div>

        {/* Stats Overview */}
        {stats && (
          <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
            <Card className="bg-card/50 backdrop-blur-sm border-white/10">
              <CardContent className="pt-6">
                <div className="flex items-center space-x-2">
                  <Vote className="w-8 h-8 text-blue-400" />
                  <div>
                    <p className="text-2xl font-bold text-white">{stats.totalVotes}</p>
                    <p className="text-sm text-gray-400">Total Votes</p>
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card className="bg-card/50 backdrop-blur-sm border-white/10">
              <CardContent className="pt-6">
                <div className="flex items-center space-x-2">
                  <Users className="w-8 h-8 text-green-400" />
                  <div>
                    <p className="text-2xl font-bold text-white">{stats.totalVoters}</p>
                    <p className="text-sm text-gray-400">Active Voters</p>
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card className="bg-card/50 backdrop-blur-sm border-white/10">
              <CardContent className="pt-6">
                <div className="flex items-center space-x-2">
                  <MessageSquare className="w-8 h-8 text-purple-400" />
                  <div>
                    <p className="text-2xl font-bold text-white">{stats.claimsWithVotes}</p>
                    <p className="text-sm text-gray-400">Claims Reviewed</p>
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card className="bg-card/50 backdrop-blur-sm border-white/10">
              <CardContent className="pt-6">
                <div className="flex items-center space-x-2">
                  <Clock className="w-8 h-8 text-yellow-400" />
                  <div>
                    <p className="text-2xl font-bold text-white">{stats.recentVotes}</p>
                    <p className="text-sm text-gray-400">Votes (24h)</p>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
        )}

        {/* Tabs */}
        <div className="flex space-x-1 mb-6 bg-black/20 p-1 rounded-lg">
          {[
            { id: 'claims', label: 'Vote on Claims', icon: Vote },
            { id: 'leaderboard', label: 'Leaderboard', icon: Trophy },
            { id: 'my-votes', label: 'My Votes', icon: Eye },
            { id: 'stats', label: 'Statistics', icon: BarChart3 }
          ].map((tab) => {
            const Icon = tab.icon
            return (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id)}
                className={`flex items-center space-x-2 px-4 py-2 rounded-md transition-colors ${
                  activeTab === tab.id
                    ? 'bg-primary text-white'
                    : 'text-gray-400 hover:text-white hover:bg-white/5'
                }`}
              >
                <Icon className="w-4 h-4" />
                <span>{tab.label}</span>
              </button>
            )
          })}
        </div>

        {/* Claims Tab */}
        {activeTab === 'claims' && (
          <div>
            {/* Filters */}
            <Card className="bg-card/50 backdrop-blur-sm border-white/10 mb-6">
              <CardContent className="pt-6">
                <div className="flex flex-wrap gap-4">
                  <div className="flex items-center space-x-2">
                    <Filter className="w-4 h-4 text-gray-400" />
                    <select
                      value={filters.category}
                      onChange={(e) => setFilters({...filters, category: e.target.value})}
                      className="bg-background border border-input rounded-md px-3 py-1 text-sm"
                    >
                      <option value="all">All Categories</option>
                      <option value="health">Health</option>
                      <option value="politics">Politics</option>
                      <option value="science">Science</option>
                      <option value="climate">Climate</option>
                      <option value="technology">Technology</option>
                      <option value="economy">Economy</option>
                    </select>
                  </div>

                  <div className="flex items-center space-x-2">
                    <select
                      value={filters.status}
                      onChange={(e) => setFilters({...filters, status: e.target.value})}
                      className="bg-background border border-input rounded-md px-3 py-1 text-sm"
                    >
                      <option value="all">All Status</option>
                      <option value="pending">Pending</option>
                      <option value="verified">Verified</option>
                      <option value="in_progress">In Progress</option>
                    </select>
                  </div>

                  <div className="flex items-center space-x-2 flex-1">
                    <Search className="w-4 h-4 text-gray-400" />
                    <Input
                      placeholder="Search claims..."
                      value={filters.search}
                      onChange={(e) => setFilters({...filters, search: e.target.value})}
                      className="max-w-xs"
                    />
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Claims List */}
            <div className="space-y-4">
              {claims.map((claim) => (
                <Card key={claim._id} className="bg-card/50 backdrop-blur-sm border-white/10">
                  <CardContent className="pt-6">
                    <div className="space-y-4">
                      {/* Claim Header */}
                      <div className="flex items-start justify-between">
                        <div className="flex-1">
                          <p className="text-white font-medium mb-2">{claim.text}</p>
                          <div className="flex items-center space-x-2 mb-2">
                            <Badge variant="outline">{claim.category}</Badge>
                            <Badge className={getVerdictColor(claim.verdict)}>
                              {claim.verdict?.toUpperCase() || 'UNVERIFIED'}
                            </Badge>
                            {claim.communityVerdict && (
                              <Badge className="bg-purple-500">
                                Community: {claim.communityVerdict.toUpperCase()}
                              </Badge>
                            )}
                          </div>
                          <p className="text-xs text-gray-400">
                            {formatRelativeTime(claim.createdAt)} • {claim.totalVotes} community votes
                          </p>
                        </div>
                      </div>

                      {/* Community Voting Stats */}
                      <div className="grid grid-cols-4 gap-4 p-4 bg-black/20 rounded-lg">
                        <div className="text-center">
                          <div className="flex items-center justify-center space-x-1 mb-1">
                            <CheckCircle className="w-4 h-4 text-green-500" />
                            <span className="text-sm font-medium text-white">{claim.trueVotes}</span>
                          </div>
                          <p className="text-xs text-gray-400">True</p>
                        </div>
                        <div className="text-center">
                          <div className="flex items-center justify-center space-x-1 mb-1">
                            <XCircle className="w-4 h-4 text-red-500" />
                            <span className="text-sm font-medium text-white">{claim.falseVotes}</span>
                          </div>
                          <p className="text-xs text-gray-400">False</p>
                        </div>
                        <div className="text-center">
                          <div className="flex items-center justify-center space-x-1 mb-1">
                            <AlertTriangle className="w-4 h-4 text-yellow-500" />
                            <span className="text-sm font-medium text-white">{claim.misleadingVotes}</span>
                          </div>
                          <p className="text-xs text-gray-400">Misleading</p>
                        </div>
                        <div className="text-center">
                          <div className="flex items-center justify-center space-x-1 mb-1">
                            <HelpCircle className="w-4 h-4 text-gray-500" />
                            <span className="text-sm font-medium text-white">{claim.unverifiedVotes}</span>
                          </div>
                          <p className="text-xs text-gray-400">Unverified</p>
                        </div>
                      </div>

                      {/* User's Previous Vote */}
                      {claim.userVote && (
                        <div className="p-3 bg-blue-500/10 border border-blue-500/20 rounded-lg">
                          <div className="flex items-center space-x-2">
                            {getVerdictIcon(claim.userVote.vote)}
                            <span className="text-sm text-blue-400">
                              You voted: <strong>{claim.userVote.vote.toUpperCase()}</strong>
                            </span>
                            <span className="text-xs text-gray-400">
                              (Confidence: {(claim.userVote.confidence * 100).toFixed(0)}%)
                            </span>
                          </div>
                        </div>
                      )}

                      {/* Voting Interface */}
                      {(!claim.userVote || votingClaim === claim._id) && (
                        <div className="space-y-3 p-4 bg-secondary/20 rounded-lg">
                          <h4 className="text-sm font-medium text-white">Cast Your Vote</h4>
                          
                          {/* Vote Options */}
                          <div className="grid grid-cols-4 gap-2">
                            {[
                              { value: 'true', label: 'True', icon: CheckCircle, color: 'green' },
                              { value: 'false', label: 'False', icon: XCircle, color: 'red' },
                              { value: 'misleading', label: 'Misleading', icon: AlertTriangle, color: 'yellow' },
                              { value: 'unverified', label: 'Unverified', icon: HelpCircle, color: 'gray' }
                            ].map((option) => {
                              const Icon = option.icon
                              return (
                                <button
                                  key={option.value}
                                  onClick={() => setSelectedVote({...selectedVote, vote: option.value})}
                                  className={`p-2 rounded-lg border transition-colors ${
                                    selectedVote.vote === option.value
                                      ? `border-${option.color}-500 bg-${option.color}-500/20`
                                      : 'border-white/10 hover:border-white/20'
                                  }`}
                                >
                                  <Icon className={`w-4 h-4 mx-auto mb-1 text-${option.color}-500`} />
                                  <p className="text-xs text-white">{option.label}</p>
                                </button>
                              )
                            })}
                          </div>

                          {/* Confidence Slider */}
                          <div className="space-y-2">
                            <label className="text-xs text-gray-400">
                              Confidence: {(selectedVote.confidence * 100).toFixed(0)}%
                            </label>
                            <input
                              type="range"
                              min="0"
                              max="1"
                              step="0.1"
                              value={selectedVote.confidence}
                              onChange={(e) => setSelectedVote({...selectedVote, confidence: parseFloat(e.target.value)})}
                              className="w-full"
                            />
                          </div>

                          {/* Evidence Input */}
                          <div className="space-y-2">
                            <label className="text-xs text-gray-400">Evidence/Reasoning (Optional)</label>
                            <textarea
                              value={selectedVote.evidence}
                              onChange={(e) => setSelectedVote({...selectedVote, evidence: e.target.value})}
                              placeholder="Provide any evidence or reasoning for your vote..."
                              className="w-full h-20 px-3 py-2 bg-background border border-input rounded-md text-sm resize-none"
                            />
                          </div>

                          {/* Submit Button */}
                          <div className="flex justify-end space-x-2">
                            {votingClaim === claim._id && (
                              <Button
                                variant="outline"
                                size="sm"
                                onClick={() => {
                                  setVotingClaim(null)
                                  setSelectedVote({ vote: '', confidence: 0.5, evidence: '' })
                                }}
                              >
                                Cancel
                              </Button>
                            )}
                            <Button
                              size="sm"
                              onClick={() => handleVote(claim._id)}
                              disabled={!selectedVote.vote || votingClaim === claim._id}
                            >
                              {votingClaim === claim._id ? (
                                <>
                                  <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2" />
                                  Submitting...
                                </>
                              ) : (
                                <>
                                  <Vote className="w-4 h-4 mr-2" />
                                  Submit Vote
                                </>
                              )}
                            </Button>
                          </div>
                        </div>
                      )}
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          </div>
        )}

        {/* Leaderboard Tab */}
        {activeTab === 'leaderboard' && (
          <Card className="bg-card/50 backdrop-blur-sm border-white/10">
            <CardHeader>
              <CardTitle className="flex items-center space-x-2">
                <Trophy className="w-6 h-6 text-yellow-400" />
                <span>Community Leaderboard</span>
              </CardTitle>
              <CardDescription>Top contributors to community fact-checking</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-3">
                {leaderboard.map((contributor, idx) => (
                  <div key={contributor._id} className="flex items-center justify-between p-4 bg-secondary/20 rounded-lg">
                    <div className="flex items-center space-x-3">
                      <div className={`w-8 h-8 rounded-full flex items-center justify-center font-bold ${
                        idx === 0 ? 'bg-yellow-500 text-black' :
                        idx === 1 ? 'bg-gray-400 text-black' :
                        idx === 2 ? 'bg-orange-600 text-white' :
                        'bg-blue-500 text-white'
                      }`}>
                        {idx + 1}
                      </div>
                      <div>
                        <p className="font-medium text-white">{contributor.name}</p>
                        <p className="text-xs text-gray-400">
                          Level {contributor.level} • {contributor.credibilityScore} credibility
                        </p>
                      </div>
                    </div>
                    <div className="text-right">
                      <p className="text-lg font-bold text-white">{contributor.totalVotes}</p>
                      <p className="text-xs text-gray-400">votes</p>
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        )}

        {/* My Votes Tab */}
        {activeTab === 'my-votes' && (
          <Card className="bg-card/50 backdrop-blur-sm border-white/10">
            <CardHeader>
              <CardTitle className="flex items-center space-x-2">
                <Eye className="w-6 h-6 text-blue-400" />
                <span>My Voting History</span>
              </CardTitle>
              <CardDescription>Your contributions to community verification</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-3">
                {userVotes.map((vote) => (
                  <div key={vote._id} className="p-4 bg-secondary/20 rounded-lg">
                    <div className="flex items-start justify-between mb-2">
                      <p className="text-white font-medium flex-1">{vote.claimId?.text}</p>
                      <div className="flex items-center space-x-2">
                        {getVerdictIcon(vote.vote)}
                        <Badge className={getVerdictColor(vote.vote)}>
                          {vote.vote.toUpperCase()}
                        </Badge>
                      </div>
                    </div>
                    <div className="flex items-center justify-between text-xs text-gray-400">
                      <span>Confidence: {(vote.confidence * 100).toFixed(0)}%</span>
                      <span>{formatRelativeTime(vote.createdAt)}</span>
                    </div>
                    {vote.evidence && (
                      <p className="text-sm text-gray-300 mt-2 italic">"{vote.evidence}"</p>
                    )}
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        )}

        {/* Statistics Tab */}
        {activeTab === 'stats' && stats && (
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <Card className="bg-card/50 backdrop-blur-sm border-white/10">
              <CardHeader>
                <CardTitle>Vote Distribution</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  {stats.voteDistribution?.map((item: any) => (
                    <div key={item._id} className="flex items-center justify-between">
                      <div className="flex items-center space-x-2">
                        {getVerdictIcon(item._id)}
                        <span className="text-white capitalize">{item._id}</span>
                      </div>
                      <div className="text-right">
                        <p className="text-white font-medium">{item.count}</p>
                        <p className="text-xs text-gray-400">
                          {((item.avgConfidence || 0) * 100).toFixed(0)}% avg confidence
                        </p>
                      </div>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>

            <Card className="bg-card/50 backdrop-blur-sm border-white/10">
              <CardHeader>
                <CardTitle>Top Contributors</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  {stats.topContributors?.slice(0, 5).map((contributor: any, idx: number) => (
                    <div key={contributor._id} className="flex items-center justify-between">
                      <div className="flex items-center space-x-2">
                        <span className="text-primary font-bold">#{idx + 1}</span>
                        <span className="text-white">{contributor.name}</span>
                      </div>
                      <div className="text-right">
                        <p className="text-white font-medium">{contributor.voteCount}</p>
                        <p className="text-xs text-gray-400">votes</p>
                      </div>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          </div>
        )}
      </div>
    </div>
  )
}
