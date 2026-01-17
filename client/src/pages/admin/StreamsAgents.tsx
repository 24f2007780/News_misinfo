import { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import api from '@/lib/api'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/Card'
import Button from '@/components/ui/Button'
import Badge from '@/components/ui/Badge'
import { 
  Activity, 
  Pause, 
  Play, 
  RefreshCw,
  Radio,
  Cpu,
  Zap
} from 'lucide-react'
import toast from 'react-hot-toast'

export default function StreamsAgents() {
  const navigate = useNavigate()
  const [agents, setAgents] = useState<any>({})
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    loadAgentStatus()
    const interval = setInterval(loadAgentStatus, 5000) // Refresh every 5s
    return () => clearInterval(interval)
  }, [])

  const loadAgentStatus = async () => {
    try {
      const response = await api.get('/agents/status')
      setAgents(response.data)
      setLoading(false)
    } catch (error) {
      console.error('Failed to load agent status')
    }
  }

  const controlAgent = async (agentName: string, action: string) => {
    try {
      await api.post(`/agents/${agentName}/${action}`)
      toast.success(`Agent ${agentName} ${action}ed successfully`)
      loadAgentStatus()
    } catch (error: any) {
      toast.error(error.response?.data?.error || 'Action failed')
    }
  }

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'running':
        return 'bg-green-500/20 text-green-400 border-green-500/30'
      case 'idle':
        return 'bg-blue-500/20 text-blue-400 border-blue-500/30'
      case 'processing':
        return 'bg-yellow-500/20 text-yellow-400 border-yellow-500/30'
      case 'stopped':
        return 'bg-red-500/20 text-red-400 border-red-500/30'
      case 'paused':
        return 'bg-gray-500/20 text-gray-400 border-gray-500/30'
      default:
        return 'bg-gray-500/20 text-gray-400 border-gray-500/30'
    }
  }

  const formatUptime = (ms: number) => {
    const seconds = Math.floor(ms / 1000)
    const minutes = Math.floor(seconds / 60)
    const hours = Math.floor(minutes / 60)
    
    if (hours > 0) return `${hours}h ${minutes % 60}m`
    if (minutes > 0) return `${minutes}m ${seconds % 60}s`
    return `${seconds}s`
  }

  const handleAgentClick = (agentName: string) => {
    if (agentName === 'ingestor') {
      navigate('/admin/ingestor')
    }
    // Add more agent-specific pages here in the future
  }

  const agentDescriptions: Record<string, string> = {
    ingestor: 'Collects and normalizes data from social media, news, and files',
    claimExtractor: 'Uses LLM to identify checkable claims and entities',
    cluster: 'Groups similar claims using embeddings & vector DB',
    verification: 'Searches web and fact-check databases for evidence',
    multilingual: 'Detects language, translates, and verifies',
    factChecker: 'Interacts with users and drafts verifications',
    analyst: 'Generates insights and reports automatically',
    governance: 'Ensures audit logging and bias detection'
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
        <h1 className="text-3xl font-bold text-white mb-2">Streams & Agents</h1>
        <p className="text-gray-400">Monitor and control AI agent pipeline</p>
      </div>

      {/* Agent Status Board */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {Object.entries(agents).map(([name, agent]: [string, any]) => (
          <Card 
            key={name} 
            className={`bg-card/50 backdrop-blur-sm border-white/10 ${
              name === 'ingestor' ? 'cursor-pointer hover:bg-card/70 transition-colors' : ''
            }`}
            onClick={() => handleAgentClick(name)}
          >
            <CardHeader>
              <div className="flex items-start justify-between">
                <div className="flex items-center space-x-2">
                  <div className="p-2 bg-primary/10 rounded-lg">
                    <Cpu className="w-5 h-5 text-primary" />
                  </div>
                  <div>
                    <CardTitle className="text-lg capitalize">{name}</CardTitle>
                    <Badge className={`mt-1 ${getStatusColor(agent.status)}`}>
                      {agent.status}
                    </Badge>
                  </div>
                </div>
                {agent.status === 'processing' && (
                  <div className="animate-pulse">
                    <Activity className="w-5 h-5 text-yellow-400" />
                  </div>
                )}
              </div>
            </CardHeader>
            <CardContent className="space-y-4">
              <p className="text-sm text-gray-400">{agentDescriptions[name]}</p>

              {/* Metrics */}
              <div className="grid grid-cols-2 gap-3">
                <div className="bg-secondary/30 rounded-lg p-3">
                  <p className="text-xs text-gray-400 mb-1">Queue</p>
                  <p className="text-lg font-bold text-white">{agent.queueSize}</p>
                </div>
                <div className="bg-secondary/30 rounded-lg p-3">
                  <p className="text-xs text-gray-400 mb-1">Processed</p>
                  <p className="text-lg font-bold text-white">{agent.processedCount}</p>
                </div>
                <div className="bg-secondary/30 rounded-lg p-3">
                  <p className="text-xs text-gray-400 mb-1">Errors</p>
                  <p className="text-lg font-bold text-red-400">{agent.errorCount}</p>
                </div>
                <div className="bg-secondary/30 rounded-lg p-3">
                  <p className="text-xs text-gray-400 mb-1">Uptime</p>
                  <p className="text-lg font-bold text-white">{formatUptime(agent.uptime)}</p>
                </div>
              </div>

              {/* Last Action */}
              {agent.lastAction && (
                <div className="text-xs text-gray-400">
                  <span className="font-medium">Last action:</span> {agent.lastAction.action}
                </div>
              )}

              {/* Controls */}
              <div className="flex space-x-2">
                {agent.status === 'running' || agent.status === 'processing' || agent.status === 'idle' ? (
                  <Button 
                    size="sm" 
                    variant="outline" 
                    className="flex-1"
                    onClick={() => controlAgent(name, 'pause')}
                  >
                    <Pause className="w-4 h-4 mr-1" />
                    Pause
                  </Button>
                ) : agent.status === 'paused' ? (
                  <Button 
                    size="sm" 
                    variant="outline" 
                    className="flex-1"
                    onClick={() => controlAgent(name, 'resume')}
                  >
                    <Play className="w-4 h-4 mr-1" />
                    Resume
                  </Button>
                ) : (
                  <Button 
                    size="sm" 
                    variant="outline" 
                    className="flex-1"
                    onClick={() => controlAgent(name, 'start')}
                  >
                    <Play className="w-4 h-4 mr-1" />
                    Start
                  </Button>
                )}
                <Button 
                  size="sm" 
                  variant="ghost"
                  onClick={loadAgentStatus}
                >
                  <RefreshCw className="w-4 h-4" />
                </Button>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Real-time Ingestion Feed */}
      <Card className="bg-card/50 backdrop-blur-sm border-white/10">
        <CardHeader>
          <CardTitle className="flex items-center space-x-2">
            <Radio className="w-5 h-5 text-primary" />
            <span>Real-time Ingestion Feed</span>
          </CardTitle>
          <CardDescription>Live stream of incoming data</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="h-64 bg-secondary/20 rounded-lg p-4 overflow-y-auto">
            <div className="space-y-2 text-sm font-mono">
              <div className="flex items-center space-x-2 text-green-400">
                <Zap className="w-3 h-3" />
                <span>[{new Date().toLocaleTimeString()}] Ingested 5 posts from Twitter</span>
              </div>
              <div className="flex items-center space-x-2 text-blue-400">
                <Zap className="w-3 h-3" />
                <span>[{new Date().toLocaleTimeString()}] Extracted 3 claims from batch</span>
              </div>
              <div className="flex items-center space-x-2 text-purple-400">
                <Zap className="w-3 h-3" />
                <span>[{new Date().toLocaleTimeString()}] Clustered 12 similar claims</span>
              </div>
              <div className="text-gray-500 text-center py-8">
                Live feed will appear here when agents are processing...
              </div>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
