import { useState, useEffect } from 'react'
import api from '@/lib/api'
import { useLanguage } from '@/contexts/LanguageContext'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/Card'
import Button from '@/components/ui/Button'
import Badge from '@/components/ui/Badge'
import { FlaskConical, CheckCircle, XCircle, AlertTriangle } from 'lucide-react'
import { formatDateTime } from '@/lib/utils'
import toast from 'react-hot-toast'

export default function VerificationStudio() {
  const { t } = useLanguage()
  const [pendingClaims, setPendingClaims] = useState<any[]>([])
  const [selectedClaim, setSelectedClaim] = useState<any>(null)
  const [verdict, setVerdict] = useState('')
  const [explanation, setExplanation] = useState('')
  const [loading, setLoading] = useState(true)
  const [submitting, setSubmitting] = useState(false)

  useEffect(() => {
    loadPendingClaims()
  }, [])

  const loadPendingClaims = async () => {
    try {
      const response = await api.get('/claims', {
        params: { status: 'pending', limit: 20 }
      })
      setPendingClaims(response.data.claims)
      if (response.data.claims.length > 0 && !selectedClaim) {
        setSelectedClaim(response.data.claims[0])
      }
      setLoading(false)
    } catch (error) {
      toast.error('Failed to load claims')
    }
  }

  const handleVerify = async () => {
    if (!selectedClaim || !verdict) {
      toast.error('Please select a verdict')
      return
    }

    setSubmitting(true)
    try {
      await api.patch(`/claims/${selectedClaim._id}`, {
        verdict,
        explanation: {
          short: explanation.substring(0, 100),
          medium: explanation,
          long: explanation
        }
      })

      toast.success('Claim verified successfully')
      
      // Remove from pending list
      setPendingClaims(prev => prev.filter(c => c._id !== selectedClaim._id))
      
      // Select next claim
      const nextClaim = pendingClaims.find(c => c._id !== selectedClaim._id)
      setSelectedClaim(nextClaim || null)
      setVerdict('')
      setExplanation('')
    } catch (error: any) {
      toast.error(error.response?.data?.error || 'Verification failed')
    } finally {
      setSubmitting(false)
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
        <h1 className="text-3xl font-bold text-white mb-2">{t('verificationStudio')}</h1>
        <p className="text-gray-400">{t('hybridAiHumanVerification')}</p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Pending Claims Queue */}
        <div className="space-y-3">
          <div className="flex items-center justify-between">
            <h2 className="text-xl font-semibold text-white">{t('pendingQueue')}</h2>
            <Badge variant="secondary">{pendingClaims.length}</Badge>
          </div>

          <div className="space-y-2 max-h-[calc(100vh-200px)] overflow-y-auto">
            {pendingClaims.map((claim) => (
              <Card
                key={claim._id}
                className={`cursor-pointer transition-all ${
                  selectedClaim?._id === claim._id
                    ? 'bg-primary/20 border-primary'
                    : 'bg-card/50 border-white/10 hover:border-primary/30'
                }`}
                onClick={() => setSelectedClaim(claim)}
              >
                <CardContent className="pt-4">
                  <p className="text-sm text-white line-clamp-3 mb-2">{claim.text}</p>
                  <div className="flex items-center justify-between">
                    <Badge variant="outline" className="text-xs">
                      {claim.category}
                    </Badge>
                    <span className="text-xs text-gray-400">
                      {formatDateTime(claim.createdAt)}
                    </span>
                  </div>
                </CardContent>
              </Card>
            ))}

            {pendingClaims.length === 0 && (
              <div className="text-center py-12 text-gray-400">
                <FlaskConical className="w-12 h-12 mx-auto mb-4 opacity-50" />
                <p>{t('noPendingClaims')}</p>
              </div>
            )}
          </div>
        </div>

        {/* Verification Panel */}
        <div className="lg:col-span-2 space-y-6">
          {selectedClaim ? (
            <>
              {/* Claim Details */}
              <Card className="bg-card/50 backdrop-blur-sm border-white/10">
                <CardHeader>
                  <CardTitle>Claim Under Review</CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div>
                    <h4 className="font-semibold mb-2">Original Text</h4>
                    <p className="text-sm text-gray-300 p-4 bg-secondary/30 rounded-lg">
                      {selectedClaim.text}
                    </p>
                  </div>

                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <h4 className="font-semibold mb-2">Category</h4>
                      <Badge>{selectedClaim.category}</Badge>
                    </div>
                    <div>
                      <h4 className="font-semibold mb-2">Language</h4>
                      <Badge variant="outline">{selectedClaim.language}</Badge>
                    </div>
                  </div>

                  {selectedClaim.aiAnalysis && (
                    <div>
                      <h4 className="font-semibold mb-2">AI Analysis</h4>
                      <div className="p-4 bg-blue-500/10 border border-blue-500/20 rounded-lg space-y-2">
                        <div className="flex justify-between text-sm">
                          <span className="text-gray-400">Checkability:</span>
                          <span className="text-white">
                            {(selectedClaim.aiAnalysis.checkability * 100).toFixed(0)}%
                          </span>
                        </div>
                        <div className="flex justify-between text-sm">
                          <span className="text-gray-400">Urgency:</span>
                          <Badge variant="outline">{selectedClaim.aiAnalysis.urgency}</Badge>
                        </div>
                        {selectedClaim.aiAnalysis.reasoning && (
                          <p className="text-sm text-gray-300 mt-2">
                            {selectedClaim.aiAnalysis.reasoning}
                          </p>
                        )}
                      </div>
                    </div>
                  )}

                  {selectedClaim.entities && selectedClaim.entities.length > 0 && (
                    <div>
                      <h4 className="font-semibold mb-2">Entities Detected</h4>
                      <div className="flex flex-wrap gap-2">
                        {selectedClaim.entities.map((entity: any, idx: number) => (
                          <Badge key={idx} variant="secondary">
                            {entity.text} ({entity.type})
                          </Badge>
                        ))}
                      </div>
                    </div>
                  )}
                </CardContent>
              </Card>

              {/* Verification Form */}
              <Card className="bg-card/50 backdrop-blur-sm border-white/10">
                <CardHeader>
                  <CardTitle>Your Verification</CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div>
                    <h4 className="font-semibold mb-3">Select Verdict</h4>
                    <div className="grid grid-cols-2 gap-3">
                      <Button
                        variant={verdict === 'true' ? 'default' : 'outline'}
                        className={verdict === 'true' ? 'bg-green-600 hover:bg-green-700' : ''}
                        onClick={() => setVerdict('true')}
                      >
                        <CheckCircle className="w-4 h-4 mr-2" />
                        True
                      </Button>
                      <Button
                        variant={verdict === 'false' ? 'default' : 'outline'}
                        className={verdict === 'false' ? 'bg-red-600 hover:bg-red-700' : ''}
                        onClick={() => setVerdict('false')}
                      >
                        <XCircle className="w-4 h-4 mr-2" />
                        False
                      </Button>
                      <Button
                        variant={verdict === 'misleading' ? 'default' : 'outline'}
                        className={verdict === 'misleading' ? 'bg-yellow-600 hover:bg-yellow-700' : ''}
                        onClick={() => setVerdict('misleading')}
                      >
                        <AlertTriangle className="w-4 h-4 mr-2" />
                        Misleading
                      </Button>
                      <Button
                        variant={verdict === 'unverified' ? 'default' : 'outline'}
                        onClick={() => setVerdict('unverified')}
                      >
                        Unverified
                      </Button>
                    </div>
                  </div>

                  <div>
                    <h4 className="font-semibold mb-2">Explanation</h4>
                    <textarea
                      className="w-full h-32 px-4 py-3 rounded-lg border border-input bg-background text-foreground resize-none focus:outline-none focus:ring-2 focus:ring-primary"
                      placeholder="Provide a clear explanation for your verdict..."
                      value={explanation}
                      onChange={(e) => setExplanation(e.target.value)}
                    />
                  </div>

                  <div className="flex space-x-3">
                    <Button
                      className="flex-1"
                      onClick={handleVerify}
                      disabled={!verdict || submitting}
                    >
                      {submitting ? 'Submitting...' : 'Submit Verification'}
                    </Button>
                    <Button
                      variant="outline"
                      onClick={() => {
                        const nextClaim = pendingClaims.find(c => c._id !== selectedClaim._id)
                        setSelectedClaim(nextClaim || null)
                        setVerdict('')
                        setExplanation('')
                      }}
                    >
                      Skip
                    </Button>
                  </div>
                </CardContent>
              </Card>
            </>
          ) : (
            <Card className="bg-card/50 backdrop-blur-sm border-white/10">
              <CardContent className="py-24 text-center">
                <FlaskConical className="w-16 h-16 mx-auto mb-4 text-gray-400" />
                <p className="text-gray-400">{t('noClaimSelected')}</p>
              </CardContent>
            </Card>
          )}
        </div>
      </div>
    </div>
  )
}
