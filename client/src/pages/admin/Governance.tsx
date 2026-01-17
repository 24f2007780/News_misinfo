import { useState, useEffect } from 'react'
import api from '@/lib/api'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/Card'
import Button from '@/components/ui/Button'
import Badge from '@/components/ui/Badge'
import { Shield, FileText, AlertTriangle, Activity } from 'lucide-react'
import { formatDateTime } from '@/lib/utils'
import toast from 'react-hot-toast'

export default function Governance() {
  const [auditLogs, setAuditLogs] = useState<any[]>([])
  const [biasReport, setBiasReport] = useState<any>(null)
  const [complianceReport, setComplianceReport] = useState<any>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    loadData()
  }, [])

  const loadData = async () => {
    try {
      const [logsRes, biasRes, complianceRes] = await Promise.all([
        api.get('/governance/audit-logs', { params: { limit: 50 } }),
        api.get('/governance/bias-report'),
        api.get('/governance/compliance-report')
      ])

      setAuditLogs(logsRes.data.logs)
      setBiasReport(biasRes.data)
      setComplianceReport(complianceRes.data)
      setLoading(false)
    } catch (error: any) {
      toast.error(error.response?.data?.error || 'Failed to load governance data')
      setLoading(false)
    }
  }

  const runBiasDetection = async () => {
    try {
      const response = await api.post('/agents/governance/bias-detection')
      setBiasReport(response.data)
      toast.success('Bias detection completed')
    } catch (error: any) {
      toast.error(error.response?.data?.error || 'Bias detection failed')
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
        <h1 className="text-3xl font-bold text-white mb-2">Governance & Audit</h1>
        <p className="text-gray-400">System transparency, bias detection, and compliance</p>
      </div>

      {/* Compliance Overview */}
      {complianceReport && (
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          <Card className="bg-card/50 backdrop-blur-sm border-white/10">
            <CardContent className="pt-6">
              <div className="flex items-center justify-between mb-2">
                <span className="text-sm text-gray-400">Total Actions</span>
                <Activity className="w-4 h-4 text-primary" />
              </div>
              <p className="text-2xl font-bold text-white">{complianceReport.totalActions}</p>
            </CardContent>
          </Card>

          <Card className="bg-card/50 backdrop-blur-sm border-white/10">
            <CardContent className="pt-6">
              <div className="flex items-center justify-between mb-2">
                <span className="text-sm text-gray-400">Agent Activity</span>
                <Activity className="w-4 h-4 text-blue-400" />
              </div>
              <p className="text-2xl font-bold text-white">{complianceReport.agentActivity}</p>
            </CardContent>
          </Card>

          <Card className="bg-card/50 backdrop-blur-sm border-white/10">
            <CardContent className="pt-6">
              <div className="flex items-center justify-between mb-2">
                <span className="text-sm text-gray-400">User Activity</span>
                <Activity className="w-4 h-4 text-green-400" />
              </div>
              <p className="text-2xl font-bold text-white">{complianceReport.userActivity}</p>
            </CardContent>
          </Card>

          <Card className="bg-card/50 backdrop-blur-sm border-white/10">
            <CardContent className="pt-6">
              <div className="flex items-center justify-between mb-2">
                <span className="text-sm text-gray-400">Errors</span>
                <AlertTriangle className="w-4 h-4 text-red-400" />
              </div>
              <p className="text-2xl font-bold text-white">{complianceReport.errors}</p>
            </CardContent>
          </Card>
        </div>
      )}

      {/* Bias Detection */}
      <Card className="bg-card/50 backdrop-blur-sm border-white/10">
        <CardHeader>
          <div className="flex items-center justify-between">
            <CardTitle className="flex items-center space-x-2">
              <Shield className="w-5 h-5 text-primary" />
              <span>Bias Detection Report</span>
            </CardTitle>
            <Button onClick={runBiasDetection} size="sm">
              Run Detection
            </Button>
          </div>
        </CardHeader>
        <CardContent className="space-y-6">
          {biasReport ? (
            <>
              {/* Category Distribution */}
              <div>
                <h3 className="font-semibold text-white mb-3">Category Distribution</h3>
                <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
                  {Object.entries(biasReport.categoryDistribution || {}).map(([category, count]: [string, any]) => (
                    <div key={category} className="p-3 bg-secondary/30 rounded-lg">
                      <p className="text-xs text-gray-400 mb-1">{category}</p>
                      <p className="text-xl font-bold text-white">{count}</p>
                    </div>
                  ))}
                </div>
              </div>

              {/* Verdict Distribution */}
              <div>
                <h3 className="font-semibold text-white mb-3">Verdict Distribution</h3>
                <div className="grid grid-cols-2 md:grid-cols-5 gap-3">
                  {Object.entries(biasReport.verdictDistribution || {}).map(([verdict, count]: [string, any]) => (
                    <div key={verdict} className="p-3 bg-secondary/30 rounded-lg">
                      <p className="text-xs text-gray-400 mb-1">{verdict}</p>
                      <p className="text-xl font-bold text-white">{count}</p>
                    </div>
                  ))}
                </div>
              </div>

              {/* Language Bias */}
              <div>
                <h3 className="font-semibold text-white mb-3">Language Distribution</h3>
                <div className="grid grid-cols-2 md:grid-cols-6 gap-3">
                  {Object.entries(biasReport.languageBias || {}).map(([lang, count]: [string, any]) => (
                    <div key={lang} className="p-3 bg-secondary/30 rounded-lg">
                      <p className="text-xs text-gray-400 mb-1">{lang.toUpperCase()}</p>
                      <p className="text-xl font-bold text-white">{count}</p>
                    </div>
                  ))}
                </div>
              </div>

              {/* Recommendations */}
              {biasReport.recommendations && biasReport.recommendations.length > 0 && (
                <div>
                  <h3 className="font-semibold text-white mb-3">Recommendations</h3>
                  <div className="space-y-2">
                    {biasReport.recommendations.map((rec: any, idx: number) => (
                      <div
                        key={idx}
                        className={`p-4 rounded-lg border ${
                          rec.type === 'over-representation'
                            ? 'bg-yellow-500/10 border-yellow-500/20'
                            : 'bg-blue-500/10 border-blue-500/20'
                        }`}
                      >
                        <div className="flex items-start space-x-3">
                          <AlertTriangle className="w-5 h-5 text-yellow-400 flex-shrink-0 mt-0.5" />
                          <div>
                            <p className="font-medium text-white">{rec.type}</p>
                            <p className="text-sm text-gray-300 mt-1">{rec.message}</p>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </>
          ) : (
            <div className="text-center py-12 text-gray-400">
              <Shield className="w-12 h-12 mx-auto mb-4 opacity-50" />
              <p>No bias report available. Click "Run Detection" to generate.</p>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Audit Logs */}
      <Card className="bg-card/50 backdrop-blur-sm border-white/10">
        <CardHeader>
          <CardTitle className="flex items-center space-x-2">
            <FileText className="w-5 h-5 text-primary" />
            <span>Audit Logs</span>
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-2 max-h-96 overflow-y-auto">
            {auditLogs.map((log) => (
              <div
                key={log._id}
                className="p-3 bg-secondary/30 rounded-lg border border-white/5 hover:bg-secondary/50 transition-colors"
              >
                <div className="flex items-start justify-between">
                  <div className="flex-1">
                    <div className="flex items-center space-x-2 mb-1">
                      <Badge variant={log.actor === 'agent' ? 'default' : 'secondary'}>
                        {log.actor}
                      </Badge>
                      <span className="text-sm font-medium text-white">{log.actorName}</span>
                      <span className="text-xs text-gray-400">→</span>
                      <span className="text-sm text-gray-400">{log.action}</span>
                    </div>
                    <p className="text-xs text-gray-500">
                      Target: {log.targetType} {log.targetId && `(${log.targetId.substring(0, 8)}...)`}
                    </p>
                  </div>
                  <span className="text-xs text-gray-400 whitespace-nowrap ml-4">
                    {formatDateTime(log.timestamp)}
                  </span>
                </div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
