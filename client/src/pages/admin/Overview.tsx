import { useState, useEffect } from 'react'
import api from '@/lib/api'
import { getSocket } from '@/lib/socket'
import { useLanguage } from '@/contexts/LanguageContext'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/Card'
import Button from '@/components/ui/Button'
import Badge from '@/components/ui/Badge'
import { 
  Activity, 
  AlertTriangle, 
  CheckCircle, 
  TrendingUp,
  Globe,
  Sparkles,
  Send
} from 'lucide-react'
import { AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts'
import toast from 'react-hot-toast'

export default function Overview() {
  const { t } = useLanguage()
  const [overview, setOverview] = useState<any>(null)
  const [trends, setTrends] = useState<any>(null)
  const [topClusters, setTopClusters] = useState<any[]>([])
  const [geoData, setGeoData] = useState<any>(null)
  const [chatInput, setChatInput] = useState('')
  const [chatResponse, setChatResponse] = useState('')
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    loadData()

    const socket = getSocket()
    socket?.on('daily-brief', () => {
      toast.success(t('newDailyBriefGenerated'))
    })

    socket?.on('spike-alert', () => {
      toast.error(t('misinformationSpikeDetected'), {
        duration: 6000,
      })
    })

    socket?.on('claims-extracted', (data) => {
      toast.success(`${data.count} ${t('newClaimsExtracted')}`)
      loadData()
    })

    return () => {
      socket?.off('daily-brief')
      socket?.off('spike-alert')
      socket?.off('claims-extracted')
    }
  }, [])

  const loadData = async () => {
    try {
      const [overviewRes, trendsRes, clustersRes, geoRes] = await Promise.all([
        api.get('/analytics/overview'),
        api.get('/analytics/trends?period=7d'),
        api.get('/analytics/top-clusters'),
        api.get('/analytics/heatmap')
      ])

      setOverview(overviewRes.data)
      setTrends(trendsRes.data)
      setTopClusters(clustersRes.data)
      setGeoData(geoRes.data)
    } catch (error) {
      toast.error(t('failedToLoadDashboardData'))
    } finally {
      setLoading(false)
    }
  }

  const handleAskSystem = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!chatInput.trim()) return

    try {
      const response = await api.post('/agents/chat', {
        message: chatInput,
        userId: 'admin'
      })
      setChatResponse(response.data.response)
      setChatInput('')
    } catch (error) {
      toast.error(t('failedToGetResponse'))
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
    <div className="space-y-6 animate-fadeIn">
      {/* Header */}
      <div>
        <h1 className="text-3xl font-bold text-white mb-2">{t('overview')}</h1>
        <p className="text-gray-400">{t('aiPoweredSituationalIntelligence')}</p>
      </div>

      {/* AI Situational Brief */}
      <Card className="bg-gradient-to-br from-blue-500/10 to-purple-500/10 border-blue-500/20">
        <CardHeader>
          <CardTitle className="flex items-center space-x-2">
            <Sparkles className="w-6 h-6 text-blue-400 ai-glow" />
            <span>{t('aiSituationalBrief')}</span>
          </CardTitle>
          <CardDescription>{t('last24HoursIntelligence')}</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="bg-black/20 rounded-lg p-4 mb-4">
            <p className="text-sm text-gray-300 leading-relaxed">
              In the last 24 hours, <span className="font-semibold text-white">{overview?.todayClaims || 0} {t('newMisinformationClaims')}</span> {t('wereDetectedAcrossMultiplePlatforms')}. 
              {t('topCategoriesInclude')} <span className="text-primary">{t('health')}</span>, <span className="text-primary">{t('politics')}</span>, and <span className="text-primary">{t('climate')}</span>. 
              {t('aiConfidenceInVerification')}: <span className="font-semibold text-green-400">{overview?.verificationRate || 0}%</span>
            </p>
          </div>

          {/* Quick Stats */}
          <div className="grid grid-cols-4 gap-4">
            <div className="bg-black/30 rounded-lg p-4">
              <div className="flex items-center justify-between mb-2">
                <span className="text-xs text-gray-400">{t('totalClaims')}</span>
                <Activity className="w-4 h-4 text-blue-400" />
              </div>
              <p className="text-2xl font-bold text-white">{overview?.totalClaims || 0}</p>
              <p className="text-xs text-green-400 mt-1">+{overview?.todayClaims || 0} {t('today')}</p>
            </div>

            <div className="bg-black/30 rounded-lg p-4">
              <div className="flex items-center justify-between mb-2">
                <span className="text-xs text-gray-400">{t('verified')}</span>
                <CheckCircle className="w-4 h-4 text-green-400" />
              </div>
              <p className="text-2xl font-bold text-white">{overview?.verifiedClaims || 0}</p>
              <p className="text-xs text-gray-400 mt-1">{overview?.verificationRate}% {t('rate')}</p>
            </div>

            <div className="bg-black/30 rounded-lg p-4">
              <div className="flex items-center justify-between mb-2">
                <span className="text-xs text-gray-400">{t('falseClaims')}</span>
                <AlertTriangle className="w-4 h-4 text-red-400" />
              </div>
              <p className="text-2xl font-bold text-white">{overview?.falseClaims || 0}</p>
              <p className="text-xs text-red-400 mt-1">{t('highPriority')}</p>
            </div>

            <div className="bg-black/30 rounded-lg p-4">
              <div className="flex items-center justify-between mb-2">
                <span className="text-xs text-gray-400">{t('activeClusters')}</span>
                <Globe className="w-4 h-4 text-purple-400" />
              </div>
              <p className="text-2xl font-bold text-white">{overview?.activeClusters || 0}</p>
              <p className="text-xs text-gray-400 mt-1">{t('monitoring')}</p>
            </div>
          </div>
        </CardContent>
      </Card>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Trends Chart */}
        <Card className="lg:col-span-2 bg-card/50 backdrop-blur-sm border-white/10">
          <CardHeader>
            <CardTitle className="flex items-center space-x-2">
              <TrendingUp className="w-5 h-5 text-primary" />
              <span>{t('claimsTimeline7Days')}</span>
            </CardTitle>
          </CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={300}>
              <AreaChart data={trends?.timeline || []}>
                <defs>
                  <linearGradient id="colorTotal" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#3b82f6" stopOpacity={0.3}/>
                    <stop offset="95%" stopColor="#3b82f6" stopOpacity={0}/>
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" stroke="#ffffff10" />
                <XAxis dataKey="date" stroke="#888" fontSize={12} />
                <YAxis stroke="#888" fontSize={12} />
                <Tooltip 
                  contentStyle={{ 
                    backgroundColor: '#1e293b', 
                    border: '1px solid #334155',
                    borderRadius: '8px'
                  }}
                />
                <Area 
                  type="monotone" 
                  dataKey="total" 
                  stroke="#3b82f6" 
                  fillOpacity={1} 
                  fill="url(#colorTotal)" 
                />
              </AreaChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>

        {/* Ask the System */}
        <Card className="bg-card/50 backdrop-blur-sm border-white/10">
          <CardHeader>
            <CardTitle className="text-lg">{t('askTheSystem')}</CardTitle>
            <CardDescription>{t('queryAiForInsights')}</CardDescription>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleAskSystem} className="space-y-3">
              <textarea
                className="w-full h-32 px-3 py-2 bg-background border border-input rounded-lg text-sm resize-none focus:outline-none focus:ring-2 focus:ring-primary"
                placeholder={t('askAiPlaceholder')}
                value={chatInput}
                onChange={(e) => setChatInput(e.target.value)}
              />
              <Button type="submit" size="sm" className="w-full">
                <Send className="w-4 h-4 mr-2" />
                {t('askAi')}
              </Button>
            </form>

            {chatResponse && (
              <div className="mt-4 p-3 bg-primary/10 border border-primary/20 rounded-lg">
                <p className="text-sm text-gray-300">{chatResponse}</p>
              </div>
            )}
          </CardContent>
        </Card>
      </div>

      {/* Top Misinformation Clusters */}
      <Card className="bg-card/50 backdrop-blur-sm border-white/10">
        <CardHeader>
          <CardTitle>{t('top5MisinformationClusters')}</CardTitle>
          <CardDescription>{t('mostActiveMisinformationNarratives')}</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-3">
            {topClusters.slice(0, 5).map((cluster, idx) => (
              <div 
                key={cluster._id} 
                className="p-4 bg-secondary/30 rounded-lg hover:bg-secondary/50 transition-colors border border-white/5"
              >
                <div className="flex items-start justify-between">
                  <div className="flex-1">
                    <div className="flex items-center space-x-2 mb-2">
                      <span className="text-lg font-bold text-primary">#{idx + 1}</span>
                      <h4 className="font-semibold text-white">{cluster.name}</h4>
                      <Badge variant="outline" className="text-xs">
                        {cluster.metrics?.totalClaims || 0} {t('claimsCount')}
                      </Badge>
                    </div>
                    <p className="text-sm text-gray-400 mb-2">{cluster.description}</p>
                    <div className="flex items-center space-x-2">
                      <Badge className="text-xs">{cluster.category}</Badge>
                      <Badge 
                        variant="outline" 
                        className={cluster.riskLevel === 'high' || cluster.riskLevel === 'critical' ? 'text-red-400 border-red-400' : ''}
                      >
                        {cluster.riskLevel} {t('risk')}
                      </Badge>
                    </div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>

      {/* Geographic Distribution */}
      <Card className="bg-card/50 backdrop-blur-sm border-white/10">
        <CardHeader>
          <CardTitle className="flex items-center space-x-2">
            <Globe className="w-5 h-5 text-primary" />
            <span>{t('geographicDistribution')}</span>
          </CardTitle>
          <CardDescription>{t('topRegionsAffectedByMisinformation')}</CardDescription>
        </CardHeader>
        <CardContent>
          {geoData?.topCountries && geoData.topCountries.length > 0 ? (
            <div className="space-y-3">
              {geoData.topCountries.slice(0, 5).map((country: any, idx: number) => (
                <div key={country.country} className="flex items-center justify-between p-3 bg-secondary/30 rounded-lg">
                  <div className="flex items-center space-x-3">
                    <span className="text-lg font-bold text-primary">#{idx + 1}</span>
                    <div>
                      <h4 className="font-semibold text-white">{country.country}</h4>
                      <p className="text-xs text-gray-400">{country.region}</p>
                    </div>
                  </div>
                  <div className="text-right">
                    <p className="text-lg font-bold text-white">{country.count}</p>
                    <p className="text-xs text-gray-400">{country.clusters} {t('clusters')}</p>
                  </div>
                </div>
              ))}
              <div className="mt-4 p-3 bg-blue-500/10 rounded-lg border border-blue-500/20">
                <p className="text-sm text-blue-400">
                  📊 {t('trackingMisinformationAcross')} {geoData.regionData?.length || 0} {t('regionsWithActiveClusters')} {geoData.totalClusters || 0} {t('activeClustersText')}
                </p>
              </div>
            </div>
          ) : (
            <div className="h-64 bg-secondary/20 rounded-lg flex items-center justify-center">
              <div className="text-center">
                <Globe className="w-16 h-16 text-primary/50 mx-auto mb-4" />
                <p className="text-sm text-gray-400">{t('loadingGeographicData')}</p>
              </div>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  )
}
