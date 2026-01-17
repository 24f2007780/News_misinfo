import { useState } from 'react'
import api from '@/lib/api'
import { useLanguage } from '@/contexts/LanguageContext'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/Card'
import Button from '@/components/ui/Button'
import { FileText, Download, Calendar, TrendingUp } from 'lucide-react'
import toast from 'react-hot-toast'

export default function Reports() {
  const { t } = useLanguage()
  const [generating, setGenerating] = useState(false)
  const [weeklyReport, setWeeklyReport] = useState<any>(null)
  const [dailyBrief, setDailyBrief] = useState<any>(null)

  const generateWeeklyReport = async () => {
    setGenerating(true)
    try {
      const response = await api.get('/analytics/weekly-report')
      setWeeklyReport(response.data)
      toast.success('Weekly report generated!')
    } catch (error: any) {
      toast.error(error.response?.data?.error || 'Failed to generate report')
    } finally {
      setGenerating(false)
    }
  }

  const generateDailyBrief = async () => {
    setGenerating(true)
    try {
      const response = await api.post('/agents/analyst/daily-brief')
      setDailyBrief(response.data)
      toast.success('Daily brief generated!')
    } catch (error: any) {
      toast.error(error.response?.data?.error || 'Failed to generate brief')
    } finally {
      setGenerating(false)
    }
  }

  const downloadDailyPDF = async () => {
    try {
      const response = await api.get('/analytics/daily-report-pdf', {
        responseType: 'blob'
      })
      
      const blob = new Blob([response.data], { type: 'text/html' })
      const url = window.URL.createObjectURL(blob)
      const link = document.createElement('a')
      link.href = url
      link.download = `daily-report-${new Date().toISOString().split('T')[0]}.html`
      document.body.appendChild(link)
      link.click()
      document.body.removeChild(link)
      window.URL.revokeObjectURL(url)
      
      toast.success('Daily report downloaded!')
    } catch (error: any) {
      toast.error('Failed to download daily report')
    }
  }

  const downloadWeeklyPDF = async () => {
    try {
      const response = await api.get('/analytics/weekly-report-pdf', {
        responseType: 'blob'
      })
      
      const blob = new Blob([response.data], { type: 'text/html' })
      const url = window.URL.createObjectURL(blob)
      const link = document.createElement('a')
      link.href = url
      link.download = `weekly-report-${new Date().toISOString().split('T')[0]}.html`
      document.body.appendChild(link)
      link.click()
      document.body.removeChild(link)
      window.URL.revokeObjectURL(url)
      
      toast.success('Weekly report downloaded!')
    } catch (error: any) {
      toast.error('Failed to download weekly report')
    }
  }

  return (
    <div className="space-y-6 animate-fadeIn">
      <div>
        <h1 className="text-3xl font-bold text-white mb-2">{t('reportsAndAutoInsights')}</h1>
        <p className="text-gray-400">{t('aiGeneratedIntelligenceReports')}</p>
      </div>

      {/* Report Generation */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <Card className="bg-card/50 backdrop-blur-sm border-white/10">
          <CardHeader>
            <CardTitle className="flex items-center space-x-2">
              <Calendar className="w-5 h-5 text-primary" />
              <span>{t('dailyIntelligenceBrief')}</span>
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <p className="text-sm text-gray-400">
              {t('aiGeneratedSummaryLast24Hours')}
            </p>
            <div className="space-y-2">
              <Button onClick={generateDailyBrief} disabled={generating} className="w-full">
                {generating ? t('generating') : t('generateDailyBrief')}
              </Button>
              <Button onClick={downloadDailyPDF} variant="outline" className="w-full">
                <Download className="w-4 h-4 mr-2" />
                {t('downloadDailyPdf')}
              </Button>
            </div>
          </CardContent>
        </Card>

        <Card className="bg-card/50 backdrop-blur-sm border-white/10">
          <CardHeader>
            <CardTitle className="flex items-center space-x-2">
              <FileText className="w-5 h-5 text-primary" />
              <span>{t('weeklyIntelligenceReport')}</span>
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <p className="text-sm text-gray-400">
              {t('comprehensiveAnalysisLastWeek')}
            </p>
            <div className="space-y-2">
              <Button onClick={generateWeeklyReport} disabled={generating} className="w-full">
                {generating ? t('generating') : t('generateWeeklyReport')}
              </Button>
              <Button onClick={downloadWeeklyPDF} variant="outline" className="w-full">
                <Download className="w-4 h-4 mr-2" />
                {t('downloadWeeklyPdf')}
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Daily Brief Display */}
      {dailyBrief && (
        <Card className="bg-card/50 backdrop-blur-sm border-white/10">
          <CardHeader>
            <div className="flex items-center justify-between">
              <CardTitle>Daily Intelligence Brief</CardTitle>
              <Button variant="outline" size="sm">
                <Download className="w-4 h-4 mr-2" />
                Export PDF
              </Button>
            </div>
          </CardHeader>
          <CardContent className="space-y-6">
            {/* Statistics */}
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              <div className="p-4 bg-secondary/30 rounded-lg">
                <p className="text-xs text-gray-400 mb-1">Total Claims</p>
                <p className="text-2xl font-bold text-white">{dailyBrief.stats?.totalClaims || 0}</p>
              </div>
              <div className="p-4 bg-secondary/30 rounded-lg">
                <p className="text-xs text-gray-400 mb-1">Verified</p>
                <p className="text-2xl font-bold text-green-400">{dailyBrief.stats?.verified || 0}</p>
              </div>
              <div className="p-4 bg-secondary/30 rounded-lg">
                <p className="text-xs text-gray-400 mb-1">False</p>
                <p className="text-2xl font-bold text-red-400">{dailyBrief.stats?.false || 0}</p>
              </div>
              <div className="p-4 bg-secondary/30 rounded-lg">
                <p className="text-xs text-gray-400 mb-1">Misleading</p>
                <p className="text-2xl font-bold text-yellow-400">{dailyBrief.stats?.misleading || 0}</p>
              </div>
            </div>

            {/* AI Summary */}
            <div>
              <h3 className="font-semibold text-white mb-3">AI Summary</h3>
              <div className="p-4 bg-primary/10 border border-primary/20 rounded-lg">
                <p className="text-sm text-gray-300 leading-relaxed whitespace-pre-wrap">
                  {dailyBrief.summary}
                </p>
              </div>
            </div>

            {/* Top Clusters */}
            {dailyBrief.topClusters && dailyBrief.topClusters.length > 0 && (
              <div>
                <h3 className="font-semibold text-white mb-3">Top Misinformation Clusters</h3>
                <div className="space-y-2">
                  {dailyBrief.topClusters.map((cluster: any, idx: number) => (
                    <div key={idx} className="p-3 bg-secondary/30 rounded-lg">
                      <div className="flex items-start justify-between">
                        <div className="flex-1">
                          <h4 className="font-medium text-white">{cluster.name}</h4>
                          <p className="text-sm text-gray-400 mt-1">{cluster.description}</p>
                        </div>
                        <span className="text-sm text-primary font-semibold">
                          {cluster.claimCount} claims
                        </span>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Trends */}
            {dailyBrief.trends && (
              <div>
                <h3 className="font-semibold text-white mb-3">Trending Topics</h3>
                <div className="flex flex-wrap gap-2">
                  {dailyBrief.trends.trending?.slice(0, 10).map((topic: any, idx: number) => (
                    <div
                      key={idx}
                      className="px-3 py-2 bg-primary/10 border border-primary/20 rounded-lg"
                    >
                      <span className="text-sm font-medium text-white">{topic.keyword}</span>
                      <span className="text-xs text-gray-400 ml-2">({topic.count})</span>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </CardContent>
        </Card>
      )}

      {/* Weekly Report Display */}
      {weeklyReport && (
        <Card className="bg-card/50 backdrop-blur-sm border-white/10">
          <CardHeader>
            <div className="flex items-center justify-between">
              <CardTitle>Weekly Intelligence Report</CardTitle>
              <Button variant="outline" size="sm">
                <Download className="w-4 h-4 mr-2" />
                Export PDF
              </Button>
            </div>
          </CardHeader>
          <CardContent className="space-y-6">
            {/* Period */}
            <div className="p-4 bg-secondary/30 rounded-lg">
              <p className="text-sm text-gray-400">
                Report Period: {new Date(weeklyReport.period?.start).toLocaleDateString()} - {new Date(weeklyReport.period?.end).toLocaleDateString()}
              </p>
            </div>

            {/* Summary Statistics */}
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              <div className="p-4 bg-secondary/30 rounded-lg">
                <p className="text-xs text-gray-400 mb-1">Total Claims</p>
                <p className="text-2xl font-bold text-white">{weeklyReport.summary?.totalClaims || 0}</p>
              </div>
              <div className="p-4 bg-secondary/30 rounded-lg">
                <p className="text-xs text-gray-400 mb-1">Active Clusters</p>
                <p className="text-2xl font-bold text-primary">{weeklyReport.summary?.clustersActive || 0}</p>
              </div>
              <div className="p-4 bg-secondary/30 rounded-lg">
                <p className="text-xs text-gray-400 mb-1">Verification Rate</p>
                <p className="text-2xl font-bold text-green-400">
                  {((weeklyReport.summary?.verificationRate || 0) * 100).toFixed(0)}%
                </p>
              </div>
              <div className="p-4 bg-secondary/30 rounded-lg">
                <p className="text-xs text-gray-400 mb-1">False Claims Rate</p>
                <p className="text-2xl font-bold text-red-400">
                  {((weeklyReport.summary?.falseClaimsRate || 0) * 100).toFixed(0)}%
                </p>
              </div>
            </div>

            {/* Recommendations */}
            {weeklyReport.recommendations && weeklyReport.recommendations.length > 0 && (
              <div>
                <h3 className="font-semibold text-white mb-3 flex items-center space-x-2">
                  <TrendingUp className="w-5 h-5 text-primary" />
                  <span>AI Recommendations</span>
                </h3>
                <div className="space-y-2">
                  {weeklyReport.recommendations.map((rec: string, idx: number) => (
                    <div key={idx} className="p-3 bg-blue-500/10 border border-blue-500/20 rounded-lg">
                      <p className="text-sm text-gray-300">{rec}</p>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </CardContent>
        </Card>
      )}
    </div>
  )
}
