import { useState, useEffect } from 'react'
import { useAuthStore } from '@/store/authStore'
import { initSocket } from '@/lib/socket'
import api from '@/lib/api'
import toast from 'react-hot-toast'
import { 
  Search, 
  TrendingUp, 
  Bell, 
  LogOut, 
  Send,
  CheckCircle,
  XCircle,
  AlertTriangle,
  HelpCircle,
  Sparkles,
  Menu,
  X,
  Sun,
  Moon,
  Rss,
  Users,
  BookOpen,
  Chrome,
  Award,
  ChevronRight
} from 'lucide-react'
import Button from '@/components/ui/Button'
import Input from '@/components/ui/Input'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/Card'
import Badge from '@/components/ui/Badge'
import { getVerdictBadgeColor, formatRelativeTime } from '@/lib/utils'

const CLAIM_CATEGORIES = [
  { value: 'politics_governance', label: 'Politics & Governance' },
  { value: 'health_medicine', label: 'Health & Medicine' },
  { value: 'environment_climate', label: 'Environment & Climate' },
  { value: 'economics_finance', label: 'Economics & Finance' },
  { value: 'science_technology', label: 'Science & Technology' },
  { value: 'food_nutrition', label: 'Food & Nutrition' },
  { value: 'social_cultural', label: 'Social & Cultural Issues' },
  { value: 'entertainment_media', label: 'Entertainment & Media' },
  { value: 'sports', label: 'Sports' },
  { value: 'technology_cybersecurity', label: 'Technology & Cybersecurity' },
  { value: 'other', label: 'Other' }
]

export default function UserDashboard() {
  const { user, logout } = useAuthStore()
  const [claimText, setClaimText] = useState('')
  const [selectedCategory, setSelectedCategory] = useState('other')
  const [verifying, setVerifying] = useState(false)
  const [result, setResult] = useState<any>(null)
  const [chatMessages, setChatMessages] = useState<any[]>([])
  const [chatInput, setChatInput] = useState('')
  const [chatting, setChatting] = useState(false)
  const [trendingClaims, setTrendingClaims] = useState<any[]>([])
  const [sidebarOpen, setSidebarOpen] = useState(false)
  const [darkMode, setDarkMode] = useState(true)
  const [activeFeature, setActiveFeature] = useState<string | null>(null)
  const [personalizedFeed, setPersonalizedFeed] = useState<any[]>([])
  const [explanationMode, setExplanationMode] = useState<'eli5' | 'expert'>('eli5')
  const [loadingClaims, setLoadingClaims] = useState(false)

  useEffect(() => {
    const socket = initSocket(user?.id)
    
    socket?.on('verification-result', (data) => {
      setResult(data)
      setVerifying(false)
      toast.success('Verification complete!')
    })

    socket?.on('verification-error', (data) => {
      toast.error(data.error)
      setVerifying(false)
    })

    loadTrendingClaims()

    return () => {
      socket?.off('verification-result')
      socket?.off('verification-error')
    }
  }, [user])

  const loadPersonalizedFeed = async () => {
    try {
      const response = await api.get('/user/feed', {
        headers: { 'user-id': user?.id }
      })
      setPersonalizedFeed(response.data || [])
    } catch (error) {
      console.error('Failed to load personalized feed:', error)
    }
  }

  const loadTrendingClaims = async () => {
    try {
      setLoadingClaims(true)
      console.log('🔄 Loading recent claims...')
      // Fetch the most recent 5 claims that users have entered
      const response = await api.get('/claims/recent?limit=5')
      console.log('📋 Recent claims response:', response.data)
      setTrendingClaims(response.data || [])
      toast.success(`Loaded ${response.data?.length || 0} recent claims`)
    } catch (error) {
      console.error('Failed to load recent claims:', error)
      toast.error('Failed to load recent claims')
      // Set empty array if fails
      setTrendingClaims([])
    } finally {
      setLoadingClaims(false)
    }
  }

  const markFeedAsSeen = async (feedId: string) => {
    try {
      await api.patch(`/user/feed/${feedId}/seen`, {}, {
        headers: { 'user-id': user?.id }
      })
      toast.success('Marked as seen')
      loadPersonalizedFeed()
    } catch (error) {
      toast.error('Failed to mark as seen')
    }
  }

  const requestVerification = async (feedId: string) => {
    try {
      await api.post(`/user/feed/${feedId}/request-verification`, {}, {
        headers: { 'user-id': user?.id }
      })
      toast.success('Verification requested!')
    } catch (error) {
      toast.error('Failed to request verification')
    }
  }


  const handleFeatureClick = (feature: string) => {
    setActiveFeature(feature)
    if (feature === 'feed') {
      loadPersonalizedFeed()
    }
  }

  const handleExplanationToggle = () => {
    setExplanationMode(prev => prev === 'eli5' ? 'expert' : 'eli5')
    toast.success(`Switched to ${explanationMode === 'eli5' ? 'Expert' : 'ELI5'} mode`)
  }

  const handleBrowserExtension = () => {
    toast('Browser extension coming soon! Install from Chrome Web Store.', { icon: '🔌' })
  }

  const [profileData, setProfileData] = useState<any>(null)
  const [achievements, setAchievements] = useState<any[]>([])

  const handleCredibilityProfile = async () => {
    setActiveFeature('profile')
    try {
      const response = await api.get('/user/profile', {
        headers: { 'user-id': user?.id }
      })
      setProfileData(response.data)
      setAchievements(response.data.achievements || [])
    } catch (error) {
      toast.error('Failed to load profile')
    }
  }

  const handleVerifyClaim = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!claimText.trim()) return

    setVerifying(true)
    setResult(null)

    try {
      const response = await api.post('/verification/verify-claim', { 
        claim: claimText,
        category: selectedCategory 
      })
      setResult(response.data.result)
      toast.success('Verification complete!')
      
      // Refresh trending claims to show the new claim immediately
      setTimeout(() => {
        loadTrendingClaims()
      }, 1000) // Wait 1 second for database save to complete
    } catch (error: any) {
      toast.error(error.response?.data?.error || 'Verification failed')
      // Show fallback result if available
      if (error.response?.data?.result) {
        setResult(error.response.data.result)
      }
    } finally {
      setVerifying(false)
    }
  }

  const handleChat = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!chatInput.trim()) return

    const userMessage = { role: 'user', content: chatInput }
    setChatMessages([...chatMessages, userMessage])
    setChatInput('')
    setChatting(true)

    try {
      const response = await api.post('/agents/chat', {
        message: chatInput,
        userId: user?.id,
        context: result ? {
          claim: claimText,
          verdict: result.verdict,
          confidence: result.confidence
        } : undefined
      })

      const aiMessage = { role: 'assistant', content: response.data.response }
      setChatMessages(prev => [...prev, aiMessage])
    } catch (error) {
      toast.error('Chat failed')
    } finally {
      setChatting(false)
    }
  }

  const getVerdictIcon = (verdict: string) => {
    switch (verdict) {
      case 'true':
        return <CheckCircle className="w-5 h-5 text-green-500" />
      case 'false':
        return <XCircle className="w-5 h-5 text-red-500" />
      case 'misleading':
        return <AlertTriangle className="w-5 h-5 text-yellow-500" />
      default:
        return <HelpCircle className="w-5 h-5 text-gray-500" />
    }
  }

  return (
    <div className={`min-h-screen ${darkMode ? 'bg-gradient-to-br from-slate-900 via-blue-900 to-slate-950' : 'bg-gradient-to-br from-gray-50 via-blue-50 to-gray-100'}`}>
      {/* Sidebar */}
      <div className={`fixed inset-y-0 left-0 z-50 w-80 transform transition-transform duration-300 ${sidebarOpen ? 'translate-x-0' : '-translate-x-full'} ${darkMode ? 'bg-slate-900/95' : 'bg-white'} backdrop-blur-lg border-r ${darkMode ? 'border-white/10' : 'border-gray-200'} shadow-2xl`}>
        <div className="flex flex-col h-full">
          {/* Sidebar Header */}
          <div className={`p-6 border-b ${darkMode ? 'border-white/10' : 'border-gray-200'}`}>
            <div className="flex items-center justify-between">
              <h2 className={`text-xl font-bold ${darkMode ? 'text-white' : 'text-gray-900'}`}>Features</h2>
              <Button variant="ghost" size="sm" onClick={() => setSidebarOpen(false)}>
                <X className={`w-5 h-5 ${darkMode ? 'text-white' : 'text-gray-900'}`} />
              </Button>
            </div>
          </div>

          {/* Sidebar Content */}
          <div className="flex-1 overflow-y-auto p-4 space-y-2">
            {/* Personalized AI Feed */}
            <button onClick={() => handleFeatureClick('feed')} className={`w-full text-left p-4 rounded-lg transition-colors ${darkMode ? 'hover:bg-white/5 text-white' : 'hover:bg-gray-100 text-gray-900'} ${activeFeature === 'feed' ? darkMode ? 'bg-white/10' : 'bg-blue-50' : ''} group`}>
              <div className="flex items-center space-x-3">
                <div className={`p-2 rounded-lg ${darkMode ? 'bg-blue-500/20' : 'bg-blue-100'}`}>
                  <Rss className={`w-5 h-5 ${darkMode ? 'text-blue-400' : 'text-blue-600'}`} />
                </div>
                <div className="flex-1">
                  <h3 className="font-semibold text-sm">Personalized AI Feed</h3>
                  <p className={`text-xs ${darkMode ? 'text-gray-400' : 'text-gray-600'} mt-1`}>Curated misinformation alerts</p>
                </div>
                <ChevronRight className={`w-4 h-4 ${darkMode ? 'text-gray-400' : 'text-gray-600'} group-hover:translate-x-1 transition-transform`} />
              </div>
            </button>


            {/* Explainability Layer */}
            <button onClick={handleExplanationToggle} className={`w-full text-left p-4 rounded-lg transition-colors ${darkMode ? 'hover:bg-white/5 text-white' : 'hover:bg-gray-100 text-gray-900'} group`}>
              <div className="flex items-center space-x-3">
                <div className={`p-2 rounded-lg ${darkMode ? 'bg-green-500/20' : 'bg-green-100'}`}>
                  <BookOpen className={`w-5 h-5 ${darkMode ? 'text-green-400' : 'text-green-600'}`} />
                </div>
                <div className="flex-1">
                  <h3 className="font-semibold text-sm">Explainability Layer</h3>
                  <p className={`text-xs ${darkMode ? 'text-gray-400' : 'text-gray-600'} mt-1`}>Mode: {explanationMode === 'eli5' ? 'ELI5' : 'Expert'}</p>
                </div>
                <ChevronRight className={`w-4 h-4 ${darkMode ? 'text-gray-400' : 'text-gray-600'} group-hover:translate-x-1 transition-transform`} />
              </div>
            </button>

            {/* Browser Extension */}
            <button onClick={handleBrowserExtension} className={`w-full text-left p-4 rounded-lg transition-colors ${darkMode ? 'hover:bg-white/5 text-white' : 'hover:bg-gray-100 text-gray-900'} group`}>
              <div className="flex items-center space-x-3">
                <div className={`p-2 rounded-lg ${darkMode ? 'bg-orange-500/20' : 'bg-orange-100'}`}>
                  <Chrome className={`w-5 h-5 ${darkMode ? 'text-orange-400' : 'text-orange-600'}`} />
                </div>
                <div className="flex-1">
                  <h3 className="font-semibold text-sm">Browser Extension</h3>
                  <p className={`text-xs ${darkMode ? 'text-gray-400' : 'text-gray-600'} mt-1`}>Real-time web verification</p>
                </div>
                <ChevronRight className={`w-4 h-4 ${darkMode ? 'text-gray-400' : 'text-gray-600'} group-hover:translate-x-1 transition-transform`} />
              </div>
            </button>

            {/* Gamified Profile */}
            <button onClick={handleCredibilityProfile} className={`w-full text-left p-4 rounded-lg transition-colors ${darkMode ? 'hover:bg-white/5 text-white' : 'hover:bg-gray-100 text-gray-900'} group`}>
              <div className="flex items-center space-x-3">
                <div className={`p-2 rounded-lg ${darkMode ? 'bg-yellow-500/20' : 'bg-yellow-100'}`}>
                  <Award className={`w-5 h-5 ${darkMode ? 'text-yellow-400' : 'text-yellow-600'}`} />
                </div>
                <div className="flex-1">
                  <h3 className="font-semibold text-sm">Credibility Profile</h3>
                  <p className={`text-xs ${darkMode ? 'text-gray-400' : 'text-gray-600'} mt-1`}>Track your achievements</p>
                </div>
                <ChevronRight className={`w-4 h-4 ${darkMode ? 'text-gray-400' : 'text-gray-600'} group-hover:translate-x-1 transition-transform`} />
              </div>
            </button>

            {/* Community Report Link */}
            <a 
              href="/community"
              className={`w-full text-left p-4 rounded-lg transition-colors ${darkMode ? 'hover:bg-white/5 text-white' : 'hover:bg-gray-100 text-gray-900'} group block`}
            >
              <div className="flex items-center space-x-3">
                <div className={`p-2 rounded-lg ${darkMode ? 'bg-indigo-500/20' : 'bg-indigo-100'}`}>
                  <Users className={`w-5 h-5 ${darkMode ? 'text-indigo-400' : 'text-indigo-600'}`} />
                </div>
                <div className="flex-1">
                  <h3 className="font-semibold text-sm">Community Report</h3>
                  <p className={`text-xs ${darkMode ? 'text-gray-400' : 'text-gray-600'} mt-1`}>Vote on claims & see community insights</p>
                </div>
                <ChevronRight className={`w-4 h-4 ${darkMode ? 'text-gray-400' : 'text-gray-600'} group-hover:translate-x-1 transition-transform`} />
              </div>
            </a>
          </div>

          {/* Sidebar Footer */}
          <div className={`p-4 border-t ${darkMode ? 'border-white/10' : 'border-gray-200'}`}>
            <p className={`text-xs ${darkMode ? 'text-gray-400' : 'text-gray-600'} text-center`}>
              More features coming soon!
            </p>
          </div>
        </div>
      </div>

      {/* Overlay */}
      {sidebarOpen && (
        <div 
          className="fixed inset-0 bg-black/50 z-40 backdrop-blur-sm"
          onClick={() => setSidebarOpen(false)}
        />
      )}

      {/* Feature Modal */}
      {activeFeature && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          <div 
            className="absolute inset-0 bg-black/60 backdrop-blur-sm"
            onClick={() => setActiveFeature(null)}
          />
          <Card className={`relative w-full max-w-2xl max-h-[80vh] overflow-y-auto ${darkMode ? 'bg-slate-900 border-white/10' : 'bg-white border-gray-200'}`}>
            <CardHeader>
              <div className="flex items-center justify-between">
                <CardTitle className={darkMode ? 'text-white' : 'text-gray-900'}>
                  {activeFeature === 'feed' && 'Personalized AI Feed'}
                  {activeFeature === 'profile' && 'Credibility Profile'}
                </CardTitle>
                <Button variant="ghost" size="sm" onClick={() => setActiveFeature(null)}>
                  <X className={`w-5 h-5 ${darkMode ? 'text-white' : 'text-gray-900'}`} />
                </Button>
              </div>
            </CardHeader>
            <CardContent>
              {activeFeature === 'feed' && (
                <div className="space-y-4">
                  {personalizedFeed.length === 0 ? (
                    <p className={`text-sm ${darkMode ? 'text-gray-400' : 'text-gray-600'}`}>
                      No new items in your feed. Check back later!
                    </p>
                  ) : (
                    personalizedFeed.map((item: any) => (
                      <div key={item._id} className={`p-4 rounded-lg border ${darkMode ? 'bg-slate-800 border-white/10' : 'bg-gray-50 border-gray-200'}`}>
                        <div className="flex items-start justify-between">
                          <div className="flex-1">
                            <Badge className={item.severity === 'high' ? 'bg-red-500' : item.severity === 'medium' ? 'bg-yellow-500' : 'bg-blue-500'}>
                              {item.severity?.toUpperCase()}
                            </Badge>
                            <h4 className={`font-semibold mt-2 ${darkMode ? 'text-white' : 'text-gray-900'}`}>{item.text}</h4>
                            <p className={`text-xs mt-1 ${darkMode ? 'text-gray-400' : 'text-gray-600'}`}>
                              Category: {item.category} • {item.region}
                            </p>
                            {item.aiSummary && (
                              <p className={`text-sm mt-2 ${darkMode ? 'text-gray-300' : 'text-gray-700'}`}>
                                {item.aiSummary}
                              </p>
                            )}
                          </div>
                        </div>
                        <div className="mt-3 flex space-x-2">
                          {!item.seen && (
                            <Button size="sm" variant="outline" onClick={() => markFeedAsSeen(item._id)}>
                              Mark as Seen
                            </Button>
                          )}
                          {!item.verificationRequested && (
                            <Button size="sm" onClick={() => requestVerification(item._id)}>
                              Request Verification
                            </Button>
                          )}
                          {item.verificationRequested && (
                            <Badge variant="secondary">Verification Requested</Badge>
                          )}
                        </div>
                      </div>
                    ))
                  )}
                </div>
              )}


              {activeFeature === 'profile' && (
                <div className="space-y-6">
                  {/* Stats Overview */}
                  <div className="grid grid-cols-2 gap-4">
                    <div className={`p-4 rounded-lg ${darkMode ? 'bg-slate-800' : 'bg-gray-100'}`}>
                      <p className={`text-xs ${darkMode ? 'text-gray-400' : 'text-gray-600'}`}>Level</p>
                      <p className={`text-2xl font-bold ${darkMode ? 'text-white' : 'text-gray-900'}`}>{user?.level}</p>
                    </div>
                    <div className={`p-4 rounded-lg ${darkMode ? 'bg-slate-800' : 'bg-gray-100'}`}>
                      <p className={`text-xs ${darkMode ? 'text-gray-400' : 'text-gray-600'}`}>Credibility Score</p>
                      <p className={`text-2xl font-bold ${darkMode ? 'text-white' : 'text-gray-900'}`}>{user?.credibilityScore}/100</p>
                    </div>
                    <div className={`p-4 rounded-lg ${darkMode ? 'bg-slate-800' : 'bg-gray-100'}`}>
                      <p className={`text-xs ${darkMode ? 'text-gray-400' : 'text-gray-600'}`}>Verifications</p>
                      <p className={`text-2xl font-bold ${darkMode ? 'text-white' : 'text-gray-900'}`}>{profileData?.stats?.verificationsSubmitted || 0}</p>
                    </div>
                    <div className={`p-4 rounded-lg ${darkMode ? 'bg-slate-800' : 'bg-gray-100'}`}>
                      <p className={`text-xs ${darkMode ? 'text-gray-400' : 'text-gray-600'}`}>Accuracy</p>
                      <p className={`text-2xl font-bold ${darkMode ? 'text-white' : 'text-gray-900'}`}>{profileData?.stats?.accuracy || 0}%</p>
                    </div>
                  </div>

                  {/* Achievements */}
                  <div>
                    <h3 className={`text-lg font-semibold mb-3 ${darkMode ? 'text-white' : 'text-gray-900'}`}>Achievements</h3>
                    {achievements.length === 0 ? (
                      <p className={`text-sm ${darkMode ? 'text-gray-400' : 'text-gray-600'}`}>
                        Start verifying claims to earn achievements!
                      </p>
                    ) : (
                      <div className="grid grid-cols-2 gap-3">
                        {achievements.map((achievement: any) => (
                          <div key={achievement._id} className={`p-3 rounded-lg border ${darkMode ? 'bg-slate-800 border-white/10' : 'bg-gray-50 border-gray-200'}`}>
                            <div className="text-2xl mb-2">{achievement.icon || '🏆'}</div>
                            <h4 className={`font-semibold text-sm ${darkMode ? 'text-white' : 'text-gray-900'}`}>{achievement.title}</h4>
                            <p className={`text-xs mt-1 ${darkMode ? 'text-gray-400' : 'text-gray-600'}`}>{achievement.description}</p>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                </div>
              )}
            </CardContent>
          </Card>
        </div>
      )}

      {/* Header */}
      <header className={`border-b ${darkMode ? 'border-white/10 bg-black/20' : 'border-gray-200 bg-white/50'} backdrop-blur-sm`}>
        <div className="container mx-auto px-4 py-4 flex items-center justify-between">
          <div className="flex items-center space-x-3">
            <Button variant="ghost" size="sm" onClick={() => setSidebarOpen(true)}>
              <Menu className={`w-5 h-5 ${darkMode ? 'text-white' : 'text-gray-900'}`} />
            </Button>
            <div className={`p-2 ${darkMode ? 'bg-primary/20' : 'bg-blue-100'} rounded-lg`}>
              <Sparkles className={`w-6 h-6 ${darkMode ? 'text-primary' : 'text-blue-600'}`} />
            </div>
            <div>
              <h1 className={`text-xl font-bold ${darkMode ? 'text-white' : 'text-gray-900'}`}>AI Fact-Checker</h1>
              <p className={`text-xs ${darkMode ? 'text-gray-400' : 'text-gray-600'}`}>Powered by Multi-Agent AI</p>
            </div>
          </div>
          <div className="flex items-center space-x-4">
            <Button variant="ghost" size="sm" onClick={() => setDarkMode(!darkMode)}>
              {darkMode ? (
                <Sun className="w-5 h-5 text-yellow-400" />
              ) : (
                <Moon className="w-5 h-5 text-gray-700" />
              )}
            </Button>
            <Button variant="ghost" size="sm">
              <Bell className={`w-5 h-5 ${darkMode ? 'text-white' : 'text-gray-900'}`} />
            </Button>
            <div className="flex items-center space-x-2">
              <div className="text-right">
                <p className={`text-sm font-medium ${darkMode ? 'text-white' : 'text-gray-900'}`}>{user?.name}</p>
                <p className={`text-xs ${darkMode ? 'text-gray-400' : 'text-gray-600'}`}>{user?.level} • {user?.credibilityScore} pts</p>
              </div>
              <Button variant="ghost" size="sm" onClick={logout}>
                <LogOut className={`w-5 h-5 ${darkMode ? 'text-white' : 'text-gray-900'}`} />
              </Button>
            </div>
          </div>
        </div>
      </header>

      <div className="container mx-auto px-4 py-8">
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Main Verification Area */}
          <div className="lg:col-span-2 space-y-6">
            {/* Fact-Check Input */}
            <Card className={`${darkMode ? 'bg-card/50 border-white/10' : 'bg-white border-gray-200'} backdrop-blur-sm`}>
              <CardHeader>
                <CardTitle className={`flex items-center space-x-2 ${darkMode ? 'text-white' : 'text-gray-900'}`}>
                  <Search className={`w-6 h-6 ${darkMode ? 'text-primary' : 'text-blue-600'}`} />
                  <span>Verify a Claim</span>
                </CardTitle>
                <CardDescription className={darkMode ? 'text-gray-400' : 'text-gray-600'}>
                  Paste any claim, link, or text to fact-check it instantly
                </CardDescription>
              </CardHeader>
              <CardContent>
                <form onSubmit={handleVerifyClaim} className="space-y-4">
                  <div className="space-y-4">
                    <div>
                      <label className={`block text-sm font-medium mb-2 ${darkMode ? 'text-white' : 'text-gray-900'}`}>
                        Category
                      </label>
                      <select
                        className={`w-full px-4 py-3 rounded-lg border focus:outline-none focus:ring-2 focus:ring-primary ${
                          darkMode 
                            ? 'border-input bg-background text-foreground' 
                            : 'border-gray-300 bg-white text-gray-900'
                        }`}
                        value={selectedCategory}
                        onChange={(e) => setSelectedCategory(e.target.value)}
                      >
                        {CLAIM_CATEGORIES.map((category) => (
                          <option key={category.value} value={category.value} style={{ color: 'white', backgroundColor: '#1e293b' }}>
                            {category.label}
                          </option>
                        ))}
                      </select>
                    </div>
                    
                    <div>
                      <label className={`block text-sm font-medium mb-2 ${darkMode ? 'text-white' : 'text-gray-900'}`}>
                        Claim Text
                      </label>
                      <textarea
                        className={`w-full h-32 px-4 py-3 rounded-lg border resize-none focus:outline-none focus:ring-2 focus:ring-primary ${
                          darkMode 
                            ? 'border-input bg-background text-foreground' 
                            : 'border-gray-300 bg-white text-gray-900'
                        }`}
                        placeholder="Paste a claim here... e.g., 'Vaccines cause autism' or 'Climate change is a hoax'"
                        value={claimText}
                        onChange={(e) => setClaimText(e.target.value)}
                      />
                    </div>
                  </div>
                  <Button type="submit" disabled={verifying} className="w-full">
                    {verifying ? (
                      <>
                        <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2" />
                        AI is verifying...
                      </>
                    ) : (
                      <>
                        <Sparkles className="w-4 h-4 mr-2" />
                        Verify with AI
                      </>
                    )}
                  </Button>
                </form>
              </CardContent>
            </Card>

            {/* Verification Result */}
            {result && (
              <Card className={`${darkMode ? 'bg-card/50 border-white/10' : 'bg-white border-gray-200'} backdrop-blur-sm animate-fadeIn`}>
                <CardHeader>
                  <div className="flex items-center justify-between">
                    <CardTitle className={`flex items-center space-x-2 ${darkMode ? 'text-white' : 'text-gray-900'}`}>
                      {getVerdictIcon(result.verdict)}
                      <span>Verification Result</span>
                    </CardTitle>
                    <Badge className={getVerdictBadgeColor(result.verdict)}>
                      {result.verdict?.toUpperCase()}
                    </Badge>
                  </div>
                  
                  {/* New Format Display */}
                  <div className="mt-4">
                    <div className={`p-4 rounded-lg border-2 ${
                      result.verdict === 'supported' ? 'border-green-500 bg-green-50 dark:bg-green-900/20' :
                      result.verdict === 'refuted' ? 'border-red-500 bg-red-50 dark:bg-red-900/20' :
                      'border-gray-500 bg-gray-50 dark:bg-gray-900/20'
                    }`}>
                      <div className="text-center">
                        <div className="text-3xl mb-2">{result.emoji}</div>
                        <div className={`text-xl font-bold ${
                          result.verdict === 'supported' ? 'text-green-700 dark:text-green-300' :
                          result.verdict === 'refuted' ? 'text-red-700 dark:text-red-300' :
                          'text-gray-700 dark:text-gray-300'
                        }`}>
                          {result.classification || `${result.emoji} ${result.formattedVerdict} (Confidence: ${result.confidencePercent}%)`}
                        </div>
                      </div>
                    </div>
                  </div>

                  {/* Pipeline Information */}
                  {result.pipeline && (
                    <div className="mt-3">
                      <div className="flex items-center justify-between text-xs">
                        <span className={`${darkMode ? 'text-gray-400' : 'text-gray-600'}`}>
                          Pipeline: {result.pipeline.steps_completed} steps • {result.pipeline.total_time_ms}ms
                        </span>
                        <span className={`${darkMode ? 'text-gray-400' : 'text-gray-600'}`}>
                          Sources: {result.pipeline.evidence_sources?.join(', ') || 'N/A'}
                        </span>
                      </div>
                    </div>
                  )}
                </CardHeader>
                <CardContent className="space-y-4">
                  <div>
                    <h4 className={`font-semibold mb-2 ${darkMode ? 'text-white' : 'text-gray-900'}`}>Explanation</h4>
                    <p className={`text-sm ${darkMode ? 'text-muted-foreground' : 'text-gray-600'}`}>
                      {result.explanation?.medium || result.explanation?.short || 'Insufficient evidence to make a determination.'}
                    </p>
                  </div>

                  {result.evidence && result.evidence.length > 0 && (
                    <div>
                      <div className="flex items-center justify-between mb-2">
                        <h4 className={`font-semibold ${darkMode ? 'text-white' : 'text-gray-900'}`}>
                          Evidence Sources {result.scrapingSummary && `(${result.scrapingSummary.sitesSearched} sites searched)`}
                        </h4>
                        {result.source === 'web-scraping' && (
                          <Badge className="bg-green-500 text-white text-xs">
                            Web Scraped
                          </Badge>
                        )}
                      </div>
                      <div className="space-y-2">
                        {result.evidence.map((evidence: any, idx: number) => (
                          <div key={idx} className={`p-3 rounded-lg border ${darkMode ? 'bg-secondary/50 border-white/10' : 'bg-gray-100 border-gray-200'}`}>
                            <div className="flex items-start justify-between">
                              <div className="flex-1">
                                <div className="flex items-center space-x-2 mb-1">
                                  <p className={`text-sm font-medium ${darkMode ? 'text-white' : 'text-gray-900'}`}>
                                    {evidence.title || 'Related Article'}
                                  </p>
                                  {evidence.factCheckingSite && (
                                    <Badge variant="outline" className="text-xs">
                                      {evidence.factCheckingSite}
                                    </Badge>
                                  )}
                                  {evidence.verdict && (
                                    <Badge className={`text-xs ${
                                      evidence.verdict === 'false' ? 'bg-red-500' :
                                      evidence.verdict === 'true' ? 'bg-green-500' :
                                      evidence.verdict === 'misleading' ? 'bg-yellow-500' :
                                      'bg-gray-500'
                                    }`}>
                                      {evidence.verdict}
                                    </Badge>
                                  )}
                                </div>
                                <p className={`text-xs mt-1 ${darkMode ? 'text-muted-foreground' : 'text-gray-600'}`}>
                                  {evidence.snippet || 'Context about the claim...'}
                                </p>
                                <div className="flex items-center justify-between mt-2">
                                  <a 
                                    href={evidence.url} 
                                    target="_blank" 
                                    rel="noopener noreferrer"
                                    className={`text-xs hover:underline ${darkMode ? 'text-primary' : 'text-blue-600'}`}
                                  >
                                    {evidence.source || evidence.factCheckingSite || 'Web Source'}
                                  </a>
                                  {evidence.relevanceScore && (
                                    <span className={`text-xs ${darkMode ? 'text-gray-400' : 'text-gray-500'}`}>
                                      Relevance: {(evidence.relevanceScore * 100).toFixed(0)}%
                                    </span>
                                  )}
                                </div>
                                {evidence.rating && (
                                  <p className={`text-xs mt-1 ${darkMode ? 'text-gray-400' : 'text-gray-500'}`}>
                                    Rating: {evidence.rating}
                                  </p>
                                )}
                              </div>
                            </div>
                          </div>
                        ))}
                      </div>
                      {result.scrapingSummary && (
                        <div className={`mt-3 p-2 rounded-lg text-xs ${darkMode ? 'bg-blue-500/10 text-blue-400' : 'bg-blue-50 text-blue-600'}`}>
                          <p>🔍 Web scraping completed: Found {result.scrapingSummary.resultsFound} results from {result.scrapingSummary.sitesSearched} fact-checking sites</p>
                        </div>
                      )}
                    </div>
                  )}
                </CardContent>
              </Card>
            )}

            {/* AI Chat Assistant */}
            <Card className={`${darkMode ? 'bg-card/50 border-white/10' : 'bg-white border-gray-200'} backdrop-blur-sm`}>
              <CardHeader>
                <CardTitle className={`flex items-center space-x-2 ${darkMode ? 'text-white' : 'text-gray-900'}`}>
                  <Sparkles className={`w-6 h-6 ${darkMode ? 'text-primary' : 'text-blue-600'} ai-glow`} />
                  <span>Ask AI Assistant</span>
                </CardTitle>
                <CardDescription className={darkMode ? 'text-gray-400' : 'text-gray-600'}>
                  Get more context, ask follow-up questions, or request explanations
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  {/* Chat Messages */}
                  <div className={`h-64 overflow-y-auto space-y-3 p-4 rounded-lg ${darkMode ? 'bg-secondary/30' : 'bg-gray-50'}`}>
                    {chatMessages.length === 0 ? (
                      <div className={`h-full flex items-center justify-center text-sm ${darkMode ? 'text-muted-foreground' : 'text-gray-500'}`}>
                        Start a conversation with the AI assistant...
                      </div>
                    ) : (
                      chatMessages.map((msg, idx) => (
                        <div
                          key={idx}
                          className={`flex ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`}
                        >
                          <div
                            className={`max-w-[80%] p-3 rounded-lg ${
                              msg.role === 'user'
                                ? darkMode 
                                  ? 'bg-primary text-primary-foreground'
                                  : 'bg-blue-600 text-white'
                                : darkMode
                                  ? 'bg-card border border-white/10 text-white'
                                  : 'bg-white border border-gray-200 text-gray-900'
                            }`}
                          >
                            <p className="text-sm whitespace-pre-wrap">{msg.content}</p>
                          </div>
                        </div>
                      ))
                    )}
                  </div>

                  {/* Chat Input */}
                  <form onSubmit={handleChat} className="flex space-x-2">
                    <Input
                      placeholder="Ask anything about the claim..."
                      value={chatInput}
                      onChange={(e) => setChatInput(e.target.value)}
                      disabled={chatting}
                      className={darkMode ? '' : 'bg-white border-gray-300 text-gray-900'}
                    />
                    <Button type="submit" disabled={chatting}>
                      <Send className="w-4 h-4" />
                    </Button>
                  </form>
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Sidebar */}
          <div className="space-y-6">
            {/* User Stats */}
            <Card className={`${darkMode ? 'bg-card/50 border-white/10' : 'bg-white border-gray-200'} backdrop-blur-sm`}>
              <CardHeader>
                <CardTitle className={`text-lg ${darkMode ? 'text-white' : 'text-gray-900'}`}>Your Profile</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                {/* User Avatar and Basic Info */}
                <div className="flex items-center space-x-3 pb-4 border-b border-gray-200 dark:border-gray-700">
                  <div className="w-12 h-12 rounded-full bg-gradient-to-r from-blue-500 to-purple-500 flex items-center justify-center text-white font-bold text-lg">
                    {user?.name?.charAt(0).toUpperCase() || user?.email?.charAt(0).toUpperCase() || 'U'}
                  </div>
                  <div>
                    <h3 className={`font-semibold ${darkMode ? 'text-white' : 'text-gray-900'}`}>
                      {user?.name || 'User'}
                    </h3>
                    <p className={`text-sm ${darkMode ? 'text-gray-400' : 'text-gray-600'}`}>
                      {user?.email || 'No email provided'}
                    </p>
                  </div>
                </div>

                {/* Account Details */}
                <div className="space-y-3">
                  <div className="flex items-center justify-between">
                    <span className={`text-sm ${darkMode ? 'text-muted-foreground' : 'text-gray-600'}`}>Level</span>
                    <Badge variant="secondary">{user?.level || 'Novice'}</Badge>
                  </div>
                  
                  <div className="flex items-center justify-between">
                    <span className={`text-sm ${darkMode ? 'text-muted-foreground' : 'text-gray-600'}`}>Credibility Score</span>
                    <span className={`font-semibold ${darkMode ? 'text-white' : 'text-gray-900'}`}>
                      {user?.credibilityScore || 50}/100
                    </span>
                  </div>
                  
                  <div className={`w-full h-2 rounded-full overflow-hidden ${darkMode ? 'bg-secondary' : 'bg-gray-200'}`}>
                    <div 
                      className="h-full bg-gradient-to-r from-blue-500 to-purple-500"
                      style={{ width: `${user?.credibilityScore || 50}%` }}
                    />
                  </div>

                  <div className="flex items-center justify-between">
                    <span className={`text-sm ${darkMode ? 'text-muted-foreground' : 'text-gray-600'}`}>Member Since</span>
                    <span className={`text-sm ${darkMode ? 'text-white' : 'text-gray-900'}`}>
                      Recently
                    </span>
                  </div>

                  <div className="flex items-center justify-between">
                    <span className={`text-sm ${darkMode ? 'text-muted-foreground' : 'text-gray-600'}`}>Verifications</span>
                    <span className={`text-sm font-medium ${darkMode ? 'text-white' : 'text-gray-900'}`}>
                      {user?.stats?.verificationsSubmitted || 0}
                    </span>
                  </div>

                  <div className="flex items-center justify-between">
                    <span className={`text-sm ${darkMode ? 'text-muted-foreground' : 'text-gray-600'}`}>Accuracy Rate</span>
                    <span className={`text-sm font-medium ${darkMode ? 'text-white' : 'text-gray-900'}`}>
                      {user?.stats?.accuracy ? `${(user.stats.accuracy * 100).toFixed(1)}%` : 'N/A'}
                    </span>
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Trending Topics */}
            <Card className={`${darkMode ? 'bg-card/50 border-white/10' : 'bg-white border-gray-200'} backdrop-blur-sm`}>
              <CardHeader>
                <div className="flex items-center justify-between">
                  <CardTitle className={`text-lg flex items-center space-x-2 ${darkMode ? 'text-white' : 'text-gray-900'}`}>
                    <TrendingUp className={`w-5 h-5 ${darkMode ? 'text-primary' : 'text-blue-600'}`} />
                    <span>Recent Claims</span>
                  </CardTitle>
                  <button
                    onClick={loadTrendingClaims}
                    disabled={loadingClaims}
                    className={`text-xs px-2 py-1 rounded border transition-colors ${
                      loadingClaims
                        ? 'border-gray-600 text-gray-500 cursor-not-allowed'
                        : darkMode 
                          ? 'border-gray-600 text-gray-400 hover:bg-gray-700' 
                          : 'border-gray-300 text-gray-600 hover:bg-gray-100'
                    }`}
                  >
                    {loadingClaims ? 'Loading...' : 'Refresh'}
                  </button>
                </div>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  {trendingClaims.length === 0 ? (
                    <p className={`text-sm ${darkMode ? 'text-muted-foreground' : 'text-gray-500'}`}>No recent claims</p>
                  ) : (
                    trendingClaims.slice(0, 5).map((claim) => (
                      <div key={claim._id} className={`p-3 rounded-lg transition-colors cursor-pointer ${darkMode ? 'bg-secondary/50 hover:bg-secondary/70' : 'bg-gray-100 hover:bg-gray-200'}`}>
                        <p className={`text-sm font-medium line-clamp-2 ${darkMode ? 'text-white' : 'text-gray-900'}`}>{claim.text}</p>
                        <div className="flex items-center justify-between mt-2">
                          <Badge className={getVerdictBadgeColor(claim.verdict)}>
                            {claim.verdict}
                          </Badge>
                          <span className={`text-xs ${darkMode ? 'text-muted-foreground' : 'text-gray-500'}`}>
                            {formatRelativeTime(claim.createdAt)}
                          </span>
                        </div>
                      </div>
                    ))
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
