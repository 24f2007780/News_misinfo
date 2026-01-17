import { useState, useEffect } from 'react'
import api from '@/lib/api'
import { useLanguage } from '@/contexts/LanguageContext'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/Card'
import Button from '@/components/ui/Button'
import Badge from '@/components/ui/Badge'
import Input from '@/components/ui/Input'
import { Search, Globe, RefreshCw, BarChart3, Clock } from 'lucide-react'
import { getVerdictBadgeColor, formatRelativeTime } from '@/lib/utils'
import toast from 'react-hot-toast'

export default function ClaimIntelligence() {
  const { t } = useLanguage()
  const [claims, setClaims] = useState<any[]>([])
  const [clusters, setClusters] = useState<any[]>([])
  const [selectedClaim, setSelectedClaim] = useState<any>(null)
  const [searchQuery, setSearchQuery] = useState('')
  const [filterStatus, setFilterStatus] = useState('all')
  const [loading, setLoading] = useState(true)
  const [scrapingStats, setScrapingStats] = useState<any>(null)
  const [scrapingClaim, setScrapingClaim] = useState<string | null>(null)

  useEffect(() => {
    loadData()
    loadScrapingStats()
  }, [filterStatus])

  const loadData = async () => {
    try {
      const params: any = { limit: 50 }
      if (filterStatus !== 'all') params.status = filterStatus

      const [claimsRes, clustersRes] = await Promise.all([
        api.get('/claims', { params }),
        api.get('/analytics/top-clusters')
      ])

      setClaims(claimsRes.data.claims)
      setClusters(clustersRes.data)
      setLoading(false)
    } catch (error) {
      toast.error('Failed to load data')
    }
  }

  const loadScrapingStats = async () => {
    try {
      const response = await api.get('/claims/scraping/stats')
      setScrapingStats(response.data)
    } catch (error) {
      console.error('Failed to load scraping stats:', error)
    }
  }

  const handleManualScraping = async (claimId: string) => {
    try {
      setScrapingClaim(claimId)
      toast.loading('Starting web scraping...', { id: 'scraping' })
      
      const response = await api.post(`/claims/${claimId}/scrape`)
      
      toast.success('Web scraping completed!', { id: 'scraping' })
      
      // Refresh the claim data
      loadData()
      loadScrapingStats()
      
      // Update selected claim if it's the one being scraped
      if (selectedClaim && selectedClaim._id === claimId) {
        setSelectedClaim(response.data.claim)
      }
    } catch (error: any) {
      toast.error(error.response?.data?.error || 'Scraping failed', { id: 'scraping' })
    } finally {
      setScrapingClaim(null)
    }
  }

  const handleSearch = async () => {
    if (!searchQuery.trim()) {
      loadData()
      return
    }

    try {
      const response = await api.get('/claims/search/query', {
        params: { q: searchQuery }
      })
      setClaims(response.data)
    } catch (error) {
      toast.error('Search failed')
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
      <div>
        <h1 className="text-3xl font-bold text-white mb-2">{t('claimIntelligence')}</h1>
        <p className="text-gray-400">{t('dynamicKnowledgeGraph')}</p>
      </div>

      {/* Web Scraping Stats */}
      {scrapingStats && (
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          <Card className="bg-card/50 backdrop-blur-sm border-white/10">
            <CardContent className="pt-6">
              <div className="flex items-center space-x-2">
                <Globe className="w-5 h-5 text-blue-400" />
                <div>
                  <p className="text-sm text-gray-400">{t('supportedSites')}</p>
                  <p className="text-2xl font-bold text-white">{scrapingStats.supportedSites}</p>
                </div>
              </div>
            </CardContent>
          </Card>
          <Card className="bg-card/50 backdrop-blur-sm border-white/10">
            <CardContent className="pt-6">
              <div className="flex items-center space-x-2">
                <BarChart3 className="w-5 h-5 text-green-400" />
                <div>
                  <p className="text-sm text-gray-400">{t('scrapingCoverage')}</p>
                  <p className="text-2xl font-bold text-white">{scrapingStats.database?.scrapingCoverage || '0%'}</p>
                </div>
              </div>
            </CardContent>
          </Card>
          <Card className="bg-card/50 backdrop-blur-sm border-white/10">
            <CardContent className="pt-6">
              <div className="flex items-center space-x-2">
                <RefreshCw className="w-5 h-5 text-yellow-400" />
                <div>
                  <p className="text-sm text-gray-400">{t('scrapedClaims')}</p>
                  <p className="text-2xl font-bold text-white">{scrapingStats.database?.scrapedClaims || 0}</p>
                </div>
              </div>
            </CardContent>
          </Card>
          <Card className="bg-card/50 backdrop-blur-sm border-white/10">
            <CardContent className="pt-6">
              <div className="flex items-center space-x-2">
                <Clock className="w-5 h-5 text-purple-400" />
                <div>
                  <p className="text-sm text-gray-400">{t('recent24h')}</p>
                  <p className="text-2xl font-bold text-white">{scrapingStats.database?.recentlyScrapped || 0}</p>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      )}

      {/* Search and Filters */}
      <Card className="bg-card/50 backdrop-blur-sm border-white/10">
        <CardContent className="pt-6">
          <div className="flex space-x-4">
            <div className="flex-1 flex space-x-2">
              <Input
                placeholder={t('searchClaimsPlaceholder')}
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                onKeyPress={(e) => e.key === 'Enter' && handleSearch()}
              />
              <Button onClick={handleSearch}>
                <Search className="w-4 h-4" />
              </Button>
            </div>
            <div className="flex space-x-2">
              <Button
                variant={filterStatus === 'all' ? 'default' : 'outline'}
                size="sm"
                onClick={() => setFilterStatus('all')}
              >
                {t('allClaims')}
              </Button>
              <Button
                variant={filterStatus === 'pending' ? 'default' : 'outline'}
                size="sm"
                onClick={() => setFilterStatus('pending')}
              >
                {t('pendingClaims')}
              </Button>
              <Button
                variant={filterStatus === 'verified' ? 'default' : 'outline'}
                size="sm"
                onClick={() => setFilterStatus('verified')}
              >
                {t('verifiedClaims')}
              </Button>
            </div>
          </div>
        </CardContent>
      </Card>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Claims List */}
        <div className="lg:col-span-2 space-y-3">
          <h2 className="text-xl font-semibold text-white">{t('claimsTitle')}</h2>
          {claims.map((claim) => (
            <Card
              key={claim._id}
              className="bg-card/50 backdrop-blur-sm border-white/10 hover:border-primary/30 transition-colors cursor-pointer"
              onClick={() => setSelectedClaim(claim)}
            >
              <CardContent className="pt-6">
                <div className="flex items-start justify-between mb-3">
                  <div className="flex-1">
                    <p className="text-sm text-white mb-2">{claim.text}</p>
                    <div className="flex items-center space-x-2">
                      <Badge className={getVerdictBadgeColor(claim.verdict)}>
                        {t(claim.verdict)}
                      </Badge>
                      <Badge variant="outline" className="text-xs">
                        {claim.category}
                      </Badge>
                      {claim.language !== 'en' && (
                        <Badge variant="outline" className="text-xs">
                          {claim.language}
                        </Badge>
                      )}
                      {claim.webScrapingData?.lastScraped && (
                        <Badge className="bg-green-500/20 text-green-400 text-xs">
                          <Globe className="w-3 h-3 mr-1" />
                          {t('webScraped')}
                        </Badge>
                      )}
                    </div>
                  </div>
                  <div className="text-right">
                    <p className="text-xs text-gray-400">{formatRelativeTime(claim.createdAt)}</p>
                    {claim.confidence > 0 && (
                      <p className="text-xs text-primary mt-1">
                        {(claim.confidence * 100).toFixed(0)}% {t('confidence')}
                      </p>
                    )}
                    {claim.webScrapingData?.resultsFound && (
                      <p className="text-xs text-green-400 mt-1">
                        {claim.webScrapingData.resultsFound} {t('webSources')}
                      </p>
                    )}
                    <Button
                      size="sm"
                      variant="outline"
                      className="mt-2 text-xs"
                      onClick={(e) => {
                        e.stopPropagation()
                        handleManualScraping(claim._id)
                      }}
                      disabled={scrapingClaim === claim._id}
                    >
                      {scrapingClaim === claim._id ? (
                        <RefreshCw className="w-3 h-3 animate-spin mr-1" />
                      ) : (
                        <Globe className="w-3 h-3 mr-1" />
                      )}
                      {scrapingClaim === claim._id ? t('scraping') : t('webScrape')}
                    </Button>
                  </div>
                </div>

                {claim.entities && claim.entities.length > 0 && (
                  <div className="flex flex-wrap gap-1 mt-2">
                    {claim.entities.slice(0, 5).map((entity: any, idx: number) => (
                      <span
                        key={idx}
                        className="text-xs px-2 py-1 bg-secondary/50 rounded"
                      >
                        {entity.text}
                      </span>
                    ))}
                  </div>
                )}
              </CardContent>
            </Card>
          ))}
        </div>

        {/* Clusters Sidebar */}
        <div className="space-y-3">
          <h2 className="text-xl font-semibold text-white">{t('activeClustersTitle')}</h2>
          {clusters.slice(0, 10).map((cluster) => (
            <Card
              key={cluster._id}
              className="bg-card/50 backdrop-blur-sm border-white/10 hover:border-primary/30 transition-colors"
            >
              <CardContent className="pt-4">
                <div className="flex items-start justify-between mb-2">
                  <h3 className="font-semibold text-white text-sm">{cluster.name}</h3>
                  <Badge variant="outline" className="text-xs">
                    {cluster.metrics?.totalClaims || 0}
                  </Badge>
                </div>
                <p className="text-xs text-gray-400 mb-2 line-clamp-2">
                  {cluster.description}
                </p>
                <div className="flex items-center space-x-2">
                  <Badge className="text-xs">{cluster.category}</Badge>
                  <Badge
                    variant="outline"
                    className={`text-xs ${
                      cluster.riskLevel === 'high' || cluster.riskLevel === 'critical'
                        ? 'text-red-400 border-red-400'
                        : ''
                    }`}
                  >
                    {t(cluster.riskLevel)}
                  </Badge>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      </div>

      {/* Claim Detail Modal */}
      {selectedClaim && (
        <div
          className="fixed inset-0 bg-black/80 backdrop-blur-sm z-50 flex items-center justify-center p-4"
          onClick={() => setSelectedClaim(null)}
        >
          <Card
            className="max-w-3xl w-full max-h-[90vh] overflow-y-auto bg-card"
            onClick={(e) => e.stopPropagation()}
          >
            <CardHeader>
              <div className="flex items-start justify-between">
                <CardTitle>Claim Details</CardTitle>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => setSelectedClaim(null)}
                >
                  ✕
                </Button>
              </div>
            </CardHeader>
            <CardContent className="space-y-4">
              <div>
                <h4 className="font-semibold mb-2">Claim Text</h4>
                <p className="text-sm text-gray-300">{selectedClaim.text}</p>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <h4 className="font-semibold mb-2">Verdict</h4>
                  <Badge className={getVerdictBadgeColor(selectedClaim.verdict)}>
                    {selectedClaim.verdict}
                  </Badge>
                </div>
                <div>
                  <h4 className="font-semibold mb-2">Confidence</h4>
                  <p className="text-sm">{(selectedClaim.confidence * 100).toFixed(0)}%</p>
                </div>
              </div>

              {selectedClaim.explanation && (
                <div>
                  <h4 className="font-semibold mb-2">Explanation</h4>
                  <p className="text-sm text-gray-300">
                    {selectedClaim.explanation.long || selectedClaim.explanation.medium}
                  </p>
                </div>
              )}

              {selectedClaim.webScrapingData && (
                <div>
                  <h4 className="font-semibold mb-2">Web Scraping Data</h4>
                  <div className="grid grid-cols-2 gap-4 p-3 bg-secondary/30 rounded-lg">
                    <div>
                      <p className="text-xs text-gray-400">Last Scraped</p>
                      <p className="text-sm">{formatRelativeTime(selectedClaim.webScrapingData.lastScraped)}</p>
                    </div>
                    <div>
                      <p className="text-xs text-gray-400">Sites Searched</p>
                      <p className="text-sm">{selectedClaim.webScrapingData.sitesSearched || 0}</p>
                    </div>
                    <div>
                      <p className="text-xs text-gray-400">Results Found</p>
                      <p className="text-sm">{selectedClaim.webScrapingData.resultsFound || 0}</p>
                    </div>
                    <div>
                      <p className="text-xs text-gray-400">Top Relevance</p>
                      <p className="text-sm">{selectedClaim.webScrapingData.topRelevanceScore ? (selectedClaim.webScrapingData.topRelevanceScore * 100).toFixed(0) + '%' : 'N/A'}</p>
                    </div>
                  </div>
                </div>
              )}

              {selectedClaim.evidence && selectedClaim.evidence.length > 0 && (
                <div>
                  <h4 className="font-semibold mb-2">Evidence Sources</h4>
                  <div className="space-y-2">
                    {selectedClaim.evidence.map((evidence: any, idx: number) => (
                      <div key={idx} className="p-3 bg-secondary/50 rounded-lg border border-white/10">
                        <div className="flex items-start justify-between mb-2">
                          <p className="text-sm font-medium">{evidence.title}</p>
                          <div className="flex space-x-1">
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
                        </div>
                        <p className="text-xs text-gray-400 mt-1">{evidence.snippet}</p>
                        <div className="flex items-center justify-between mt-2">
                          <a
                            href={evidence.url}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="text-xs text-primary hover:underline"
                          >
                            {evidence.source || evidence.factCheckingSite}
                          </a>
                          {evidence.relevanceScore && (
                            <span className="text-xs text-gray-500">
                              Relevance: {(evidence.relevanceScore * 100).toFixed(0)}%
                            </span>
                          )}
                        </div>
                        {evidence.rating && (
                          <p className="text-xs text-gray-500 mt-1">Rating: {evidence.rating}</p>
                        )}
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </CardContent>
          </Card>
        </div>
      )}
    </div>
  )
}
