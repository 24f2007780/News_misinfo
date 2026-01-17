import { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import api from '@/lib/api'
import toast from 'react-hot-toast'
import { 
  ArrowLeft,
  Upload,
  Globe,
  FileText,
  Radio,
  Play,
  Pause,
  RefreshCw,
  CheckCircle,
  AlertCircle,
  Clock,
  Database
} from 'lucide-react'
import Button from '@/components/ui/Button'
import Input from '@/components/ui/Input'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/Card'
import Badge from '@/components/ui/Badge'

export default function IngestorAgent() {
  const navigate = useNavigate()
  const [agentStatus, setAgentStatus] = useState<any>({})
  const [ingestionJobs, setIngestionJobs] = useState<any[]>([])
  const [activeTab, setActiveTab] = useState('sources')
  const [loading, setLoading] = useState(true)
  
  // Source configuration
  const [sources, setSources] = useState({
    twitter: { enabled: false, keywords: '', hashtags: '', accounts: '' },
    reddit: { enabled: false, subreddits: '', keywords: '' },
    news: { enabled: false, sources: '', categories: '' },
    files: { enabled: false, formats: 'txt,pdf,docx,csv' }
  })
  
  // File upload
  const [selectedFiles, setSelectedFiles] = useState<FileList | null>(null)
  const [uploadProgress, setUploadProgress] = useState(0)
  const [extractedData, setExtractedData] = useState<any[]>([])
  
  // Manual input
  const [manualText, setManualText] = useState('')
  const [manualSource, setManualSource] = useState('manual')

  useEffect(() => {
    loadData()
    const interval = setInterval(loadData, 5000)
    return () => clearInterval(interval)
  }, [])

  const loadData = async () => {
    try {
      const [statusRes, jobsRes] = await Promise.all([
        api.get('/api/agents/ingestor/status'),
        api.get('/api/agents/ingestor/jobs')
      ])
      
      setAgentStatus(statusRes.data)
      setIngestionJobs(jobsRes.data || [])
      setLoading(false)
    } catch (error) {
      console.error('Failed to load ingestor data')
      setLoading(false)
    }
  }

  const startIngestion = async (sourceType: string) => {
    try {
      await api.post('/api/agents/ingestor/start', {
        source: sourceType,
        config: sources[sourceType as keyof typeof sources]
      })
      toast.success(`Started ${sourceType} ingestion`)
      loadData()
    } catch (error: any) {
      toast.error(error.response?.data?.error || 'Failed to start ingestion')
    }
  }

  const stopIngestion = async (jobId: string) => {
    try {
      await api.post(`/api/agents/ingestor/stop/${jobId}`)
      toast.success('Stopped ingestion job')
      loadData()
    } catch (error: any) {
      toast.error(error.response?.data?.error || 'Failed to stop ingestion')
    }
  }

  const uploadFiles = async () => {
    if (!selectedFiles || selectedFiles.length === 0) {
      toast.error('Please select files to upload')
      return
    }

    const formData = new FormData()
    Array.from(selectedFiles).forEach(file => {
      formData.append('files', file)
    })

    try {
      setUploadProgress(0)
      console.log('🔄 Starting file upload...')
      
      const response = await api.post('/api/agents/ingestor/upload', formData, {
        onUploadProgress: (progressEvent) => {
          const progress = Math.round((progressEvent.loaded * 100) / (progressEvent.total || 1))
          setUploadProgress(progress)
          console.log(`📊 Upload progress: ${progress}%`)
        }
      })
      
      console.log('✅ Upload response:', response.data)
      
      // Store extracted data
      setExtractedData(response.data.extractedData || [])
      
      toast.success(`Uploaded ${selectedFiles.length} files successfully`)
      setSelectedFiles(null)
      setUploadProgress(0)
      loadData()
    } catch (error: any) {
      toast.error(error.response?.data?.error || 'Upload failed')
      setUploadProgress(0)
    }
  }

  const submitManualText = async () => {
    if (!manualText.trim()) {
      toast.error('Please enter some text to ingest')
      return
    }

    try {
      await api.post('/api/agents/ingestor/manual', {
        text: manualText,
        source: manualSource,
        timestamp: new Date().toISOString()
      })
      
      toast.success('Text submitted for ingestion')
      setManualText('')
      loadData()
    } catch (error: any) {
      toast.error(error.response?.data?.error || 'Failed to submit text')
    }
  }

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'running': return 'text-green-400'
      case 'completed': return 'text-blue-400'
      case 'failed': return 'text-red-400'
      case 'paused': return 'text-yellow-400'
      default: return 'text-gray-400'
    }
  }

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'running': return <Play className="w-4 h-4" />
      case 'completed': return <CheckCircle className="w-4 h-4" />
      case 'failed': return <AlertCircle className="w-4 h-4" />
      case 'paused': return <Pause className="w-4 h-4" />
      default: return <Clock className="w-4 h-4" />
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
      <div className="flex items-center justify-between">
        <div className="flex items-center space-x-4">
          <Button variant="ghost" onClick={() => navigate('/admin/streams')}>
            <ArrowLeft className="w-4 h-4 mr-2" />
            Back to Streams
          </Button>
          <div>
            <h1 className="text-3xl font-bold text-white">Ingestor Agent</h1>
            <p className="text-gray-400">Collect and normalize data from multiple sources</p>
          </div>
        </div>
        <div className="flex items-center space-x-2">
          <Badge className={`${agentStatus.status === 'running' ? 'bg-green-500/20 text-green-400' : 'bg-gray-500/20 text-gray-400'}`}>
            {agentStatus.status || 'Unknown'}
          </Badge>
          <Button variant="outline" size="sm" onClick={loadData}>
            <RefreshCw className="w-4 h-4" />
          </Button>
        </div>
      </div>

      {/* Agent Status */}
      <Card className="bg-card/50 backdrop-blur-sm border-white/10">
        <CardHeader>
          <CardTitle className="flex items-center space-x-2">
            <Database className="w-5 h-5 text-primary" />
            <span>Agent Status</span>
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            <div className="bg-secondary/30 rounded-lg p-4">
              <p className="text-sm text-gray-400 mb-1">Queue Size</p>
              <p className="text-2xl font-bold text-white">{agentStatus.queueSize || 0}</p>
            </div>
            <div className="bg-secondary/30 rounded-lg p-4">
              <p className="text-sm text-gray-400 mb-1">Processed</p>
              <p className="text-2xl font-bold text-white">{agentStatus.processedCount || 0}</p>
            </div>
            <div className="bg-secondary/30 rounded-lg p-4">
              <p className="text-sm text-gray-400 mb-1">Active Jobs</p>
              <p className="text-2xl font-bold text-white">{ingestionJobs.filter(j => j.status === 'running').length}</p>
            </div>
            <div className="bg-secondary/30 rounded-lg p-4">
              <p className="text-sm text-gray-400 mb-1">Success Rate</p>
              <p className="text-2xl font-bold text-white">
                {agentStatus.processedCount > 0 
                  ? Math.round(((agentStatus.processedCount - (agentStatus.errorCount || 0)) / agentStatus.processedCount) * 100)
                  : 100}%
              </p>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Tabs */}
      <div className="flex space-x-1 bg-black/20 p-1 rounded-lg">
        {[
          { id: 'sources', label: 'Data Sources', icon: Globe },
          { id: 'upload', label: 'File Upload', icon: Upload },
          { id: 'manual', label: 'Manual Input', icon: FileText },
          { id: 'jobs', label: 'Ingestion Jobs', icon: Radio }
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

      {/* Tab Content */}
      {activeTab === 'sources' && (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {/* Social Media Sources */}
          <Card className="bg-card/50 backdrop-blur-sm border-white/10">
            <CardHeader>
              <CardTitle>Social Media Sources</CardTitle>
              <CardDescription>Configure social media data ingestion</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              {/* Twitter */}
              <div className="p-4 border border-white/10 rounded-lg">
                <div className="flex items-center justify-between mb-3">
                  <h4 className="font-medium text-white">Twitter/X</h4>
                  <label className="relative inline-flex items-center cursor-pointer">
                    <input
                      type="checkbox"
                      checked={sources.twitter.enabled}
                      onChange={(e) => setSources({
                        ...sources,
                        twitter: { ...sources.twitter, enabled: e.target.checked }
                      })}
                      className="sr-only peer"
                    />
                    <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-blue-300 dark:peer-focus:ring-blue-800 rounded-full peer dark:bg-gray-700 peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all dark:border-gray-600 peer-checked:bg-blue-600"></div>
                  </label>
                </div>
                {sources.twitter.enabled && (
                  <div className="space-y-2">
                    <Input
                      placeholder="Keywords (comma-separated)"
                      value={sources.twitter.keywords}
                      onChange={(e) => setSources({
                        ...sources,
                        twitter: { ...sources.twitter, keywords: e.target.value }
                      })}
                    />
                    <Input
                      placeholder="Hashtags (comma-separated)"
                      value={sources.twitter.hashtags}
                      onChange={(e) => setSources({
                        ...sources,
                        twitter: { ...sources.twitter, hashtags: e.target.value }
                      })}
                    />
                    <Button
                      size="sm"
                      onClick={() => startIngestion('twitter')}
                      className="w-full"
                    >
                      Start Twitter Ingestion
                    </Button>
                  </div>
                )}
              </div>

              {/* Reddit */}
              <div className="p-4 border border-white/10 rounded-lg">
                <div className="flex items-center justify-between mb-3">
                  <h4 className="font-medium text-white">Reddit</h4>
                  <label className="relative inline-flex items-center cursor-pointer">
                    <input
                      type="checkbox"
                      checked={sources.reddit.enabled}
                      onChange={(e) => setSources({
                        ...sources,
                        reddit: { ...sources.reddit, enabled: e.target.checked }
                      })}
                      className="sr-only peer"
                    />
                    <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-blue-300 dark:peer-focus:ring-blue-800 rounded-full peer dark:bg-gray-700 peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all dark:border-gray-600 peer-checked:bg-blue-600"></div>
                  </label>
                </div>
                {sources.reddit.enabled && (
                  <div className="space-y-2">
                    <Input
                      placeholder="Subreddits (e.g., news,politics)"
                      value={sources.reddit.subreddits}
                      onChange={(e) => setSources({
                        ...sources,
                        reddit: { ...sources.reddit, subreddits: e.target.value }
                      })}
                    />
                    <Button
                      size="sm"
                      onClick={() => startIngestion('reddit')}
                      className="w-full"
                    >
                      Start Reddit Ingestion
                    </Button>
                  </div>
                )}
              </div>
            </CardContent>
          </Card>

          {/* News Sources */}
          <Card className="bg-card/50 backdrop-blur-sm border-white/10">
            <CardHeader>
              <CardTitle>News Sources</CardTitle>
              <CardDescription>Configure news feed ingestion</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="p-4 border border-white/10 rounded-lg">
                <div className="flex items-center justify-between mb-3">
                  <h4 className="font-medium text-white">News Feeds</h4>
                  <label className="relative inline-flex items-center cursor-pointer">
                    <input
                      type="checkbox"
                      checked={sources.news.enabled}
                      onChange={(e) => setSources({
                        ...sources,
                        news: { ...sources.news, enabled: e.target.checked }
                      })}
                      className="sr-only peer"
                    />
                    <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-blue-300 dark:peer-focus:ring-blue-800 rounded-full peer dark:bg-gray-700 peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all dark:border-gray-600 peer-checked:bg-blue-600"></div>
                  </label>
                </div>
                {sources.news.enabled && (
                  <div className="space-y-2">
                    <Input
                      placeholder="News sources (e.g., reuters,bbc)"
                      value={sources.news.sources}
                      onChange={(e) => setSources({
                        ...sources,
                        news: { ...sources.news, sources: e.target.value }
                      })}
                    />
                    <Input
                      placeholder="Categories (e.g., politics,health)"
                      value={sources.news.categories}
                      onChange={(e) => setSources({
                        ...sources,
                        news: { ...sources.news, categories: e.target.value }
                      })}
                    />
                    <Button
                      size="sm"
                      onClick={() => startIngestion('news')}
                      className="w-full"
                    >
                      Start News Ingestion
                    </Button>
                  </div>
                )}
              </div>
            </CardContent>
          </Card>
        </div>
      )}

      {activeTab === 'upload' && (
        <Card className="bg-card/50 backdrop-blur-sm border-white/10">
          <CardHeader>
            <CardTitle className="flex items-center space-x-2">
              <Upload className="w-5 h-5 text-primary" />
              <span>File Upload</span>
            </CardTitle>
            <CardDescription>Upload documents, text files, or data files for processing</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div 
              className="border-2 border-dashed border-white/20 rounded-lg p-8 text-center hover:border-primary/50 transition-colors"
              onDragOver={(e) => {
                e.preventDefault()
                e.currentTarget.classList.add('border-primary')
              }}
              onDragLeave={(e) => {
                e.preventDefault()
                e.currentTarget.classList.remove('border-primary')
              }}
              onDrop={(e) => {
                e.preventDefault()
                e.currentTarget.classList.remove('border-primary')
                const files = e.dataTransfer.files
                if (files.length > 0) {
                  setSelectedFiles(files)
                  toast.success(`Selected ${files.length} file(s)`)
                }
              }}
            >
              <Upload className="w-12 h-12 text-gray-400 mx-auto mb-4" />
              <div className="space-y-2">
                <p className="text-white font-medium">Drop files here or click to browse</p>
                <p className="text-sm text-gray-400">Supports: .txt, .pdf, .docx, .csv, .json, .html</p>
                <p className="text-xs text-gray-500">Maximum file size: 10MB per file</p>
                <input
                  type="file"
                  multiple
                  accept=".txt,.pdf,.docx,.csv,.json,.html,.htm"
                  onChange={(e) => {
                    setSelectedFiles(e.target.files)
                    if (e.target.files && e.target.files.length > 0) {
                      toast.success(`Selected ${e.target.files.length} file(s)`)
                    }
                  }}
                  className="hidden"
                  id="file-upload"
                />
                <label htmlFor="file-upload">
                  <Button variant="outline" className="cursor-pointer">
                    Select Files
                  </Button>
                </label>
              </div>
            </div>

            {selectedFiles && selectedFiles.length > 0 && (
              <div className="space-y-3">
                <h4 className="font-medium text-white">Selected Files:</h4>
                <div className="space-y-2">
                  {Array.from(selectedFiles).map((file, idx) => (
                    <div key={idx} className="flex items-center justify-between p-3 bg-secondary/30 rounded-lg">
                      <div className="flex items-center space-x-3">
                        <FileText className="w-4 h-4 text-gray-400" />
                        <div>
                          <p className="text-sm font-medium text-white">{file.name}</p>
                          <p className="text-xs text-gray-400">{(file.size / 1024).toFixed(1)} KB</p>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
                
                {uploadProgress > 0 && (
                  <div className="w-full bg-gray-200 rounded-full h-2">
                    <div
                      className="bg-primary h-2 rounded-full transition-all duration-300"
                      style={{ width: `${uploadProgress}%` }}
                    />
                  </div>
                )}
                
                <Button onClick={uploadFiles} disabled={uploadProgress > 0}>
                  {uploadProgress > 0 ? `Uploading... ${uploadProgress}%` : 'Upload Files'}
                </Button>
              </div>
            )}

            {/* Display Extracted Information */}
            {extractedData.length > 0 && (
              <div className="mt-6 space-y-4">
                <h4 className="text-lg font-semibold text-white flex items-center space-x-2">
                  <CheckCircle className="w-5 h-5 text-green-400" />
                  <span>Extracted Information</span>
                </h4>
                
                <div className="space-y-4">
                  {extractedData.map((fileData, idx) => (
                    <Card key={idx} className="bg-secondary/30 border-white/10">
                      <CardHeader className="pb-3">
                        <CardTitle className="text-base flex items-center justify-between">
                          <div className="flex items-center space-x-2">
                            <FileText className="w-4 h-4 text-blue-400" />
                            <span>{fileData.filename}</span>
                          </div>
                          <Badge variant="outline" className="text-xs">
                            {fileData.extractedClaims?.length || 0} claims found
                          </Badge>
                        </CardTitle>
                      </CardHeader>
                      <CardContent className="space-y-3">
                        {/* File Metadata */}
                        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
                          <div>
                            <p className="text-gray-400">File Type</p>
                            <p className="text-white font-medium">{fileData.metadata?.type?.toUpperCase() || 'Unknown'}</p>
                          </div>
                          <div>
                            <p className="text-gray-400">Text Length</p>
                            <p className="text-white font-medium">{fileData.fullTextLength || 0} chars</p>
                          </div>
                          <div>
                            <p className="text-gray-400">Claims Found</p>
                            <p className="text-white font-medium">{fileData.extractedClaims?.length || 0}</p>
                          </div>
                          <div>
                            <p className="text-gray-400">Processed</p>
                            <p className="text-white font-medium">
                              {fileData.processedAt ? new Date(fileData.processedAt).toLocaleTimeString() : 'Now'}
                            </p>
                          </div>
                        </div>

                        {/* Additional Metadata based on file type */}
                        {fileData.metadata && (
                          <div className="grid grid-cols-2 md:grid-cols-3 gap-4 text-sm">
                            {fileData.metadata.type === 'csv' && (
                              <>
                                <div>
                                  <p className="text-gray-400">Rows</p>
                                  <p className="text-white">{fileData.metadata.rows}</p>
                                </div>
                                <div>
                                  <p className="text-gray-400">Columns</p>
                                  <p className="text-white">{fileData.metadata.columns}</p>
                                </div>
                              </>
                            )}
                            {fileData.metadata.type === 'html' && (
                              <>
                                <div>
                                  <p className="text-gray-400">HTML Tags</p>
                                  <p className="text-white">{fileData.metadata.htmlTags}</p>
                                </div>
                                <div>
                                  <p className="text-gray-400">Original Size</p>
                                  <p className="text-white">{(fileData.metadata.originalSize / 1024).toFixed(1)} KB</p>
                                </div>
                              </>
                            )}
                            {fileData.metadata.type === 'pdf' && (
                              <div>
                                <p className="text-gray-400">Pages</p>
                                <p className="text-white">{fileData.metadata.pages}</p>
                              </div>
                            )}
                            {fileData.metadata.type === 'docx' && (
                              <div>
                                <p className="text-gray-400">Word Count</p>
                                <p className="text-white">{fileData.metadata.wordCount}</p>
                              </div>
                            )}
                            {fileData.metadata.type === 'json' && (
                              <div>
                                <p className="text-gray-400">JSON Keys</p>
                                <p className="text-white">{fileData.metadata.keys}</p>
                              </div>
                            )}
                          </div>
                        )}

                        {/* Extracted Text Preview */}
                        {fileData.text && (
                          <div>
                            <p className="text-sm font-medium text-gray-400 mb-2">Extracted Text (Preview)</p>
                            <div className="p-3 bg-black/30 rounded-lg border border-white/5">
                              <p className="text-sm text-gray-300 line-clamp-4">
                                {fileData.text}
                                {fileData.fullTextLength > fileData.text.length && '...'}
                              </p>
                              {fileData.fullTextLength > fileData.text.length && (
                                <p className="text-xs text-gray-500 mt-2">
                                  Showing {fileData.text.length} of {fileData.fullTextLength} characters
                                </p>
                              )}
                            </div>
                          </div>
                        )}

                        {/* Extracted Claims */}
                        {fileData.extractedClaims && fileData.extractedClaims.length > 0 && (
                          <div>
                            <p className="text-sm font-medium text-gray-400 mb-2">
                              Identified Claims ({fileData.extractedClaims.length})
                            </p>
                            <div className="space-y-2">
                              {fileData.extractedClaims.slice(0, 3).map((claim: any, claimIdx: number) => (
                                <div key={claimIdx} className="p-3 bg-blue-500/10 border border-blue-500/20 rounded-lg">
                                  <div className="flex items-start justify-between mb-2">
                                    <p className="text-sm text-white font-medium">
                                      Claim {claimIdx + 1}
                                    </p>
                                    <Badge 
                                      variant="outline" 
                                      className={`text-xs ${
                                        claim.confidence > 0.8 ? 'text-green-400 border-green-400' :
                                        claim.confidence > 0.6 ? 'text-yellow-400 border-yellow-400' :
                                        'text-red-400 border-red-400'
                                      }`}
                                    >
                                      {Math.round(claim.confidence * 100)}% confidence
                                    </Badge>
                                  </div>
                                  <p className="text-sm text-gray-300 mb-2">
                                    "{claim.text}"
                                  </p>
                                  {claim.category && (
                                    <Badge variant="secondary" className="text-xs">
                                      {claim.category}
                                    </Badge>
                                  )}
                                </div>
                              ))}
                              
                              {fileData.extractedClaims.length > 3 && (
                                <div className="text-center py-2">
                                  <Badge variant="outline" className="text-xs">
                                    +{fileData.extractedClaims.length - 3} more claims
                                  </Badge>
                                </div>
                              )}
                            </div>
                          </div>
                        )}

                        {/* Processing Status */}
                        <div className="flex items-center justify-between pt-3 border-t border-white/10">
                          <div className="flex items-center space-x-2 text-sm">
                            <CheckCircle className="w-4 h-4 text-green-400" />
                            <span className="text-green-400">Processing completed</span>
                          </div>
                          <div className="text-xs text-gray-400">
                            Processed at {new Date(fileData.processedAt || Date.now()).toLocaleTimeString()}
                          </div>
                        </div>
                      </CardContent>
                    </Card>
                  ))}
                </div>

                {/* Summary Statistics */}
                <Card className="bg-primary/10 border-primary/20">
                  <CardContent className="pt-4">
                    <div className="grid grid-cols-3 gap-4 text-center">
                      <div>
                        <p className="text-2xl font-bold text-primary">
                          {extractedData.reduce((sum, file) => sum + (file.extractedClaims?.length || 0), 0)}
                        </p>
                        <p className="text-sm text-gray-400">Total Claims Extracted</p>
                      </div>
                      <div>
                        <p className="text-2xl font-bold text-primary">
                          {extractedData.length}
                        </p>
                        <p className="text-sm text-gray-400">Files Processed</p>
                      </div>
                      <div>
                        <p className="text-2xl font-bold text-primary">
                          {Math.round(
                            extractedData.reduce((sum, file) => 
                              sum + (file.extractedClaims?.reduce((claimSum: number, claim: any) => 
                                claimSum + (claim.confidence || 0), 0) || 0), 0
                            ) / Math.max(extractedData.reduce((sum, file) => sum + (file.extractedClaims?.length || 0), 0), 1) * 100
                          )}%
                        </p>
                        <p className="text-sm text-gray-400">Avg Confidence</p>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              </div>
            )}
          </CardContent>
        </Card>
      )}

      {activeTab === 'manual' && (
        <Card className="bg-card/50 backdrop-blur-sm border-white/10">
          <CardHeader>
            <CardTitle className="flex items-center space-x-2">
              <FileText className="w-5 h-5 text-primary" />
              <span>Manual Text Input</span>
            </CardTitle>
            <CardDescription>Directly input text content for processing</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-2">
              <label className="text-sm font-medium text-white">Source Type</label>
              <select
                value={manualSource}
                onChange={(e) => setManualSource(e.target.value)}
                className="w-full p-2 bg-background border border-input rounded-md text-white"
              >
                <option value="manual">Manual Input</option>
                <option value="social_media">Social Media Post</option>
                <option value="news_article">News Article</option>
                <option value="document">Document</option>
                <option value="other">Other</option>
              </select>
            </div>
            
            <div className="space-y-2">
              <label className="text-sm font-medium text-white">Text Content</label>
              <textarea
                value={manualText}
                onChange={(e) => setManualText(e.target.value)}
                placeholder="Enter text content to be processed by the ingestor..."
                className="w-full h-32 p-3 bg-background border border-input rounded-md text-white resize-none"
              />
            </div>
            
            <Button onClick={submitManualText} disabled={!manualText.trim()}>
              Submit for Processing
            </Button>
          </CardContent>
        </Card>
      )}

      {activeTab === 'jobs' && (
        <Card className="bg-card/50 backdrop-blur-sm border-white/10">
          <CardHeader>
            <CardTitle className="flex items-center space-x-2">
              <Radio className="w-5 h-5 text-primary" />
              <span>Ingestion Jobs</span>
            </CardTitle>
            <CardDescription>Monitor active and completed ingestion jobs</CardDescription>
          </CardHeader>
          <CardContent>
            {ingestionJobs.length > 0 ? (
              <div className="space-y-3">
                {ingestionJobs.map((job) => (
                  <div key={job.id} className="p-4 bg-secondary/30 rounded-lg">
                    <div className="flex items-center justify-between mb-2">
                      <div className="flex items-center space-x-3">
                        <div className={getStatusColor(job.status)}>
                          {getStatusIcon(job.status)}
                        </div>
                        <div>
                          <h4 className="font-medium text-white">{job.source} Ingestion</h4>
                          <p className="text-xs text-gray-400">Started: {new Date(job.startTime).toLocaleString()}</p>
                        </div>
                      </div>
                      <div className="flex items-center space-x-2">
                        <Badge className={`${getStatusColor(job.status)} bg-transparent border`}>
                          {job.status}
                        </Badge>
                        {job.status === 'running' && (
                          <Button size="sm" variant="outline" onClick={() => stopIngestion(job.id)}>
                            <Pause className="w-4 h-4" />
                          </Button>
                        )}
                      </div>
                    </div>
                    
                    <div className="grid grid-cols-3 gap-4 text-sm">
                      <div>
                        <p className="text-gray-400">Items Processed</p>
                        <p className="font-medium text-white">{job.itemsProcessed || 0}</p>
                      </div>
                      <div>
                        <p className="text-gray-400">Success Rate</p>
                        <p className="font-medium text-white">{job.successRate || 0}%</p>
                      </div>
                      <div>
                        <p className="text-gray-400">Duration</p>
                        <p className="font-medium text-white">{job.duration || '0s'}</p>
                      </div>
                    </div>
                    
                    {job.error && (
                      <div className="mt-3 p-2 bg-red-500/10 border border-red-500/20 rounded text-red-400 text-sm">
                        {job.error}
                      </div>
                    )}
                  </div>
                ))}
              </div>
            ) : (
              <div className="text-center py-12 text-gray-400">
                <Radio className="w-12 h-12 mx-auto mb-4 opacity-50" />
                <p>No ingestion jobs found</p>
                <p className="text-sm mt-1">Start ingestion from the Data Sources tab</p>
              </div>
            )}
          </CardContent>
        </Card>
      )}
    </div>
  )
}
