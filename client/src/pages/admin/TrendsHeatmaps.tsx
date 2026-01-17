import { useState, useEffect } from 'react'
import api from '@/lib/api'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/Card'
import Badge from '@/components/ui/Badge'
import { TrendingUp, Globe, BarChart3, RefreshCw } from 'lucide-react'
import { BarChart, Bar, PieChart, Pie, Cell, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Legend } from 'recharts'
import toast from 'react-hot-toast'

const COLORS = ['#3b82f6', '#ef4444', '#f59e0b', '#10b981', '#8b5cf6', '#ec4899']

export default function TrendsHeatmaps() {
  const [categoryStats, setCategoryStats] = useState<any[]>([])
  const [verdictDistribution, setVerdictDistribution] = useState<any>({})
  const [heatmapData, setHeatmapData] = useState<any[]>([])
  const [trends, setTrends] = useState<any>(null)
  const [loading, setLoading] = useState(true)
  const [refreshing, setRefreshing] = useState(false)
  const [lastUpdated, setLastUpdated] = useState<Date | null>(null)

  useEffect(() => {
    loadData()
    
    // Set up auto-refresh every 30 seconds
    const interval = setInterval(() => {
      loadData()
    }, 30000)
    
    return () => clearInterval(interval)
  }, [])

  const loadData = async (isRefresh = false) => {
    try {
      if (isRefresh) {
        setRefreshing(true)
      }
      
      const [categoriesRes, heatmapRes, trendsRes] = await Promise.all([
        api.get('/analytics/categories'),
        api.get('/analytics/heatmap'),
        api.get('/analytics/trends?period=30d')
      ])

      console.log('Categories data:', categoriesRes.data)
      console.log('Heatmap data:', heatmapRes.data)
      console.log('Trends data:', trendsRes.data)

      // Handle the new category analytics structure
      if (categoriesRes.data) {
        setCategoryStats(categoriesRes.data.categoryStats || [])
        setVerdictDistribution(categoriesRes.data.verdictDistribution || {})
      }
      
      // Handle the new heatmap data structure
      setHeatmapData(heatmapRes.data?.heatmapData || heatmapRes.data || [])
      setTrends(trendsRes.data || {})
      setLastUpdated(new Date())
      setLoading(false)
      setRefreshing(false)
      
      if (isRefresh) {
        toast.success('Data refreshed successfully!')
      }
    } catch (error) {
      console.error('Analytics data error:', error)
      toast.error('Failed to load analytics data')
      setLoading(false)
      setRefreshing(false)
    }
  }

  const handleManualRefresh = () => {
    loadData(true)
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center h-96">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary" />
      </div>
    )
  }

  // Use real category statistics for charts
  const categoryChartData = categoryStats?.length > 0 ? categoryStats.map(cat => ({
    name: cat.label || cat.category || 'Unknown',
    total: cat.total || 0,
    true: cat.true || 0,
    false: cat.false || 0,
    misleading: cat.misleading || 0,
    unverified: cat.unverified || 0
  })) : [
    { name: 'No Data', total: 0, true: 0, false: 0, misleading: 0, unverified: 0 }
  ]

  // Pie chart data for category distribution
  const pieData = categoryStats?.length > 0 ? categoryStats
    .filter(cat => cat.total > 0)
    .slice(0, 6)
    .map(cat => ({
      name: cat.label || cat.category || 'Unknown',
      value: cat.total || 0
    })) : [
    { name: 'No Claims Yet', value: 1 }
  ]

  // Overall verdict distribution for additional insights
  const verdictData = verdictDistribution ? [
    { name: 'True', value: verdictDistribution.true || 0, color: '#10b981' },
    { name: 'False', value: verdictDistribution.false || 0, color: '#ef4444' },
    { name: 'Misleading', value: verdictDistribution.misleading || 0, color: '#f59e0b' },
    { name: 'Unverified', value: verdictDistribution.unverified || 0, color: '#6b7280' }
  ].filter(item => item.value > 0) : []

  return (
    <div className="space-y-6 animate-fadeIn">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold text-white mb-2">Trends & Heatmaps</h1>
          <p className="text-gray-400">Visual analytics and geographic distribution</p>
          {lastUpdated && (
            <p className="text-xs text-gray-500 mt-1">
              Last updated: {lastUpdated.toLocaleTimeString()} • Auto-refresh: 30s
            </p>
          )}
        </div>
        <button
          onClick={handleManualRefresh}
          disabled={refreshing}
          className={`flex items-center space-x-2 px-4 py-2 rounded-lg border transition-colors ${
            refreshing 
              ? 'border-gray-600 text-gray-400 cursor-not-allowed' 
              : 'border-primary text-primary hover:bg-primary/10'
          }`}
        >
          <RefreshCw className={`w-4 h-4 ${refreshing ? 'animate-spin' : ''}`} />
          <span>{refreshing ? 'Refreshing...' : 'Refresh'}</span>
        </button>
      </div>

      {/* Overall Statistics */}
      {verdictData.length > 0 && (
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          {verdictData.map((item, index) => (
            <Card key={index} className="bg-card/50 backdrop-blur-sm border-white/10">
              <CardContent className="p-4">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm text-gray-400">{item.name} Claims</p>
                    <p className="text-2xl font-bold text-white">{item.value}</p>
                  </div>
                  <div 
                    className="w-3 h-3 rounded-full"
                    style={{ backgroundColor: item.color }}
                  />
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}

      {/* Category Distribution */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <Card className="bg-card/50 backdrop-blur-sm border-white/10">
          <CardHeader>
            <CardTitle className="flex items-center space-x-2">
              <BarChart3 className="w-5 h-5 text-primary" />
              <span>Claims by Category</span>
            </CardTitle>
          </CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={300}>
              <BarChart data={categoryChartData}>
                <CartesianGrid strokeDasharray="3 3" stroke="#ffffff10" />
                <XAxis dataKey="name" stroke="#888" fontSize={12} />
                <YAxis stroke="#888" fontSize={12} />
                <Tooltip
                  contentStyle={{
                    backgroundColor: '#1e293b',
                    border: '1px solid #334155',
                    borderRadius: '8px'
                  }}
                />
                <Legend />
                <Bar dataKey="total" fill="#3b82f6" name="Total" />
                <Bar dataKey="true" fill="#10b981" name="True" />
                <Bar dataKey="false" fill="#ef4444" name="False" />
                <Bar dataKey="misleading" fill="#f59e0b" name="Misleading" />
              </BarChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>

        <Card className="bg-card/50 backdrop-blur-sm border-white/10">
          <CardHeader>
            <CardTitle>Category Distribution</CardTitle>
          </CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={300}>
              <PieChart>
                <Pie
                  data={pieData}
                  cx="50%"
                  cy="50%"
                  labelLine={false}
                  label={({ name, percent }) => `${name} ${(percent * 100).toFixed(0)}%`}
                  outerRadius={100}
                  fill="#8884d8"
                  dataKey="value"
                >
                  {pieData.map((_, index) => (
                    <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                  ))}
                </Pie>
                <Tooltip
                  contentStyle={{
                    backgroundColor: '#1e293b',
                    border: '1px solid #334155',
                    borderRadius: '8px'
                  }}
                />
              </PieChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>
      </div>

      {/* Geographic Heatmap */}
      <Card className="bg-card/50 backdrop-blur-sm border-white/10">
        <CardHeader>
          <CardTitle className="flex items-center space-x-2">
            <Globe className="w-5 h-5 text-primary" />
            <span>Geographic Distribution</span>
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {heatmapData.slice(0, 12).map((location, idx) => (
              <div
                key={idx}
                className="p-4 bg-secondary/30 rounded-lg border border-white/5"
              >
                <div className="flex items-start justify-between mb-2">
                  <div>
                    <h4 className="font-semibold text-white">{location.country}</h4>
                    {location.region && (
                      <p className="text-xs text-gray-400">{location.region}</p>
                    )}
                  </div>
                  <Badge variant="secondary">{location.count}</Badge>
                </div>
                <div className="mt-2">
                  <p className="text-xs text-gray-400 mb-1">Cluster: {location.clusterName}</p>
                  <Badge
                    variant="outline"
                    className={`text-xs ${
                      location.riskLevel === 'high' || location.riskLevel === 'critical'
                        ? 'text-red-400 border-red-400'
                        : ''
                    }`}
                  >
                    {location.riskLevel} risk
                  </Badge>
                </div>
              </div>
            ))}

            {heatmapData.length === 0 && (
              <div className="col-span-3 text-center py-12 text-gray-400">
                <Globe className="w-12 h-12 mx-auto mb-4 opacity-50" />
                <p>No geographic data available</p>
              </div>
            )}
          </div>
        </CardContent>
      </Card>

      {/* Trending Topics */}
      <Card className="bg-card/50 backdrop-blur-sm border-white/10">
        <CardHeader>
          <CardTitle className="flex items-center space-x-2">
            <TrendingUp className="w-5 h-5 text-primary" />
            <span>Trending Topics</span>
          </CardTitle>
        </CardHeader>
        <CardContent>
          {trends?.trending && trends.trending.length > 0 ? (
            <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-3">
              {trends.trending.map((topic: any, idx: number) => (
                <div
                  key={idx}
                  className="p-4 bg-gradient-to-br from-primary/10 to-purple/10 rounded-lg border border-primary/20 text-center"
                >
                  <p className="font-semibold text-white mb-1">{topic.keyword}</p>
                  <p className="text-2xl font-bold text-primary">{topic.count}</p>
                  <p className="text-xs text-gray-400 mt-1">mentions</p>
                </div>
              ))}
            </div>
          ) : (
            <div className="text-center py-12 text-gray-400">
              <TrendingUp className="w-12 h-12 mx-auto mb-4 opacity-50" />
              <p>No trending topics</p>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Spikes Detection */}
      {trends?.spikes && trends.spikes.length > 0 && (
        <Card className="bg-red-500/10 border-red-500/20">
          <CardHeader>
            <CardTitle className="text-red-400">⚠️ Misinformation Spikes Detected</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              {trends.spikes.map((spike: any, idx: number) => (
                <div
                  key={idx}
                  className="p-4 bg-black/30 rounded-lg border border-red-500/20"
                >
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="font-semibold text-white">Spike on {spike.date}</p>
                      <p className="text-sm text-gray-400 mt-1">
                        {spike.count} claims detected (threshold: {spike.threshold.toFixed(0)})
                      </p>
                    </div>
                    <Badge variant="destructive">Alert</Badge>
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  )
}
