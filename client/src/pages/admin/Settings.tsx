import { useState, useEffect } from 'react'
import api from '@/lib/api'
import toast from 'react-hot-toast'
import { useLanguage } from '@/contexts/LanguageContext'
import { 
  Globe, 
  Brain, 
  Shield, 
  MapPin, 
  History, 
  Eye, 
  Database,
  Sliders,
  Save,
  RefreshCw,
  AlertTriangle,
  Lock,
  Users,
  Clock
} from 'lucide-react'
import Button from '@/components/ui/Button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/Card'
import Badge from '@/components/ui/Badge'

const LANGUAGES = [
  { code: 'en', name: 'English', flag: '🇺🇸' },
  { code: 'hi', name: 'हिंदी (Hindi)', flag: '🇮🇳' },
  { code: 'mr', name: 'मराठी (Marathi)', flag: '🇮🇳' },
  { code: 'gu', name: 'ગુજરાતી (Gujarati)', flag: '🇮🇳' },
  { code: 'fr', name: 'Français (French)', flag: '🇫🇷' }
]

const MODEL_OPTIONS = [
  { id: 'bert-base', name: 'BERT Base', description: 'Fast, lightweight model' },
  { id: 'bert-large', name: 'BERT Large', description: 'High accuracy, slower' },
  { id: 'roberta-large', name: 'RoBERTa Large', description: 'Best performance' },
  { id: 'distilbert', name: 'DistilBERT', description: 'Fastest, good accuracy' }
]

export default function Settings() {
  const { setLanguage, t } = useLanguage()
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [settings, setSettings] = useState({
    // Language Settings
    language: 'en',
    
    // Model Settings
    primaryModel: 'bert-large',
    fallbackModel: 'distilbert',
    confidenceThreshold: 0.7,
    similarityThreshold: 0.6,
    
    // Security Settings
    locationTracking: true,
    informationTracking: true,
    claimHistory: true,
    userActivityLogging: true,
    dataRetentionDays: 365,
    
    // Privacy Settings
    anonymizeUserData: false,
    shareAnalytics: true,
    cookieConsent: true,
    
    // System Settings
    maxClaimsPerUser: 100,
    sessionTimeout: 30,
    autoLogout: true,
    twoFactorAuth: false,
    
    // Performance Settings
    cacheEnabled: true,
    compressionEnabled: true,
    cdnEnabled: true,
    
    // Notification Settings
    emailNotifications: true,
    pushNotifications: true,
    weeklyReports: true,
    securityAlerts: true
  })

  useEffect(() => {
    loadSettings()
  }, [])

  const loadSettings = async () => {
    try {
      const response = await api.get('/admin/settings')
      setSettings(prev => ({ ...prev, ...response.data }))
    } catch (error) {
      console.error('Failed to load settings:', error)
      toast.error(t('failedToLoadSettings'))
    } finally {
      setLoading(false)
    }
  }

  const saveSettings = async () => {
    try {
      setSaving(true)
      await api.put('/admin/settings', settings)
      toast.success(t('settingsSavedSuccessfully'))
    } catch (error) {
      console.error('Failed to save settings:', error)
      toast.error(t('failedToSaveSettings'))
    } finally {
      setSaving(false)
    }
  }

  const resetToDefaults = () => {
    if (confirm(t('resetAllSettingsConfirm'))) {
      setSettings({
        language: 'en',
        primaryModel: 'bert-large',
        fallbackModel: 'distilbert',
        confidenceThreshold: 0.7,
        similarityThreshold: 0.6,
        locationTracking: true,
        informationTracking: true,
        claimHistory: true,
        userActivityLogging: true,
        dataRetentionDays: 365,
        anonymizeUserData: false,
        shareAnalytics: true,
        cookieConsent: true,
        maxClaimsPerUser: 100,
        sessionTimeout: 30,
        autoLogout: true,
        twoFactorAuth: false,
        cacheEnabled: true,
        compressionEnabled: true,
        cdnEnabled: true,
        emailNotifications: true,
        pushNotifications: true,
        weeklyReports: true,
        securityAlerts: true
      })
      toast.success(t('settingsResetToDefaults'))
    }
  }

  const updateSetting = (key: string, value: any) => {
    setSettings(prev => ({ ...prev, [key]: value }))
    
    // If language is being changed, update the global language context
    if (key === 'language') {
      setLanguage(value)
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
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold text-white mb-2">{t('systemSettings')}</h1>
          <p className="text-gray-400">{t('configureLanguageModels')}</p>
        </div>
        <div className="flex space-x-3">
          <Button variant="outline" onClick={resetToDefaults}>
            <RefreshCw className="w-4 h-4 mr-2" />
            {t('resetToDefaults')}
          </Button>
          <Button onClick={saveSettings} disabled={saving}>
            <Save className="w-4 h-4 mr-2" />
            {saving ? t('saving') : t('saveSettings')}
          </Button>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Language Settings */}
        <Card className="bg-card/50 backdrop-blur-sm border-white/10">
          <CardHeader>
            <CardTitle className="flex items-center space-x-2">
              <Globe className="w-5 h-5 text-primary" />
              <span>{t('languageSettings')}</span>
            </CardTitle>
            <CardDescription>{t('selectPreferredLanguage')}</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-300 mb-3">{t('systemLanguage')}</label>
              <div className="grid grid-cols-1 gap-3">
                {LANGUAGES.map((lang) => (
                  <label key={lang.code} className="flex items-center space-x-3 cursor-pointer">
                    <input
                      type="radio"
                      name="language"
                      value={lang.code}
                      checked={settings.language === lang.code}
                      onChange={(e) => updateSetting('language', e.target.value)}
                      className="w-4 h-4 text-primary"
                    />
                    <span className="text-2xl">{lang.flag}</span>
                    <span className="text-white font-medium">{lang.name}</span>
                    {settings.language === lang.code && (
                      <Badge variant="outline" className="ml-auto">{t('active')}</Badge>
                    )}
                  </label>
                ))}
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Model Settings */}
        <Card className="bg-card/50 backdrop-blur-sm border-white/10">
          <CardHeader>
            <CardTitle className="flex items-center space-x-2">
              <Brain className="w-5 h-5 text-primary" />
              <span>{t('aiModelSettings')}</span>
            </CardTitle>
            <CardDescription>{t('configureMachineLearning')}</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-300 mb-2">{t('primaryModel')}</label>
              <select
                value={settings.primaryModel}
                onChange={(e) => updateSetting('primaryModel', e.target.value)}
                className="w-full px-3 py-2 bg-background border border-input rounded-lg text-white"
              >
                {MODEL_OPTIONS.map((model) => (
                  <option key={model.id} value={model.id} style={{ color: 'white', backgroundColor: '#1e293b' }}>
                    {model.name} - {model.description}
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-300 mb-2">{t('fallbackModel')}</label>
              <select
                value={settings.fallbackModel}
                onChange={(e) => updateSetting('fallbackModel', e.target.value)}
                className="w-full px-3 py-2 bg-background border border-input rounded-lg text-white"
              >
                {MODEL_OPTIONS.map((model) => (
                  <option key={model.id} value={model.id} style={{ color: 'white', backgroundColor: '#1e293b' }}>
                    {model.name} - {model.description}
                  </option>
                ))}
              </select>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-300 mb-2">
                  {t('confidenceThreshold')} ({(settings.confidenceThreshold * 100).toFixed(0)}%)
                </label>
                <input
                  type="range"
                  min="0.1"
                  max="1"
                  step="0.05"
                  value={settings.confidenceThreshold}
                  onChange={(e) => updateSetting('confidenceThreshold', parseFloat(e.target.value))}
                  className="w-full"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-300 mb-2">
                  {t('similarityThreshold')} ({(settings.similarityThreshold * 100).toFixed(0)}%)
                </label>
                <input
                  type="range"
                  min="0.1"
                  max="1"
                  step="0.05"
                  value={settings.similarityThreshold}
                  onChange={(e) => updateSetting('similarityThreshold', parseFloat(e.target.value))}
                  className="w-full"
                />
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Security & Privacy Settings */}
        <Card className="bg-card/50 backdrop-blur-sm border-white/10">
          <CardHeader>
            <CardTitle className="flex items-center space-x-2">
              <Shield className="w-5 h-5 text-primary" />
              <span>{t('securityPrivacy')}</span>
            </CardTitle>
            <CardDescription>{t('configureDataTracking')}</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-3">
              <label className="flex items-center justify-between">
                <div className="flex items-center space-x-3">
                  <MapPin className="w-4 h-4 text-gray-400" />
                  <span className="text-white">{t('locationTracking')}</span>
                </div>
                <input
                  type="checkbox"
                  checked={settings.locationTracking}
                  onChange={(e) => updateSetting('locationTracking', e.target.checked)}
                  className="w-4 h-4"
                />
              </label>

              <label className="flex items-center justify-between">
                <div className="flex items-center space-x-3">
                  <Eye className="w-4 h-4 text-gray-400" />
                  <span className="text-white">{t('informationTracking')}</span>
                </div>
                <input
                  type="checkbox"
                  checked={settings.informationTracking}
                  onChange={(e) => updateSetting('informationTracking', e.target.checked)}
                  className="w-4 h-4"
                />
              </label>

              <label className="flex items-center justify-between">
                <div className="flex items-center space-x-3">
                  <History className="w-4 h-4 text-gray-400" />
                  <span className="text-white">{t('claimHistory')}</span>
                </div>
                <input
                  type="checkbox"
                  checked={settings.claimHistory}
                  onChange={(e) => updateSetting('claimHistory', e.target.checked)}
                  className="w-4 h-4"
                />
              </label>

              <label className="flex items-center justify-between">
                <div className="flex items-center space-x-3">
                  <Users className="w-4 h-4 text-gray-400" />
                  <span className="text-white">{t('userActivityLogging')}</span>
                </div>
                <input
                  type="checkbox"
                  checked={settings.userActivityLogging}
                  onChange={(e) => updateSetting('userActivityLogging', e.target.checked)}
                  className="w-4 h-4"
                />
              </label>

              <label className="flex items-center justify-between">
                <div className="flex items-center space-x-3">
                  <Lock className="w-4 h-4 text-gray-400" />
                  <span className="text-white">{t('twoFactorAuthentication')}</span>
                </div>
                <input
                  type="checkbox"
                  checked={settings.twoFactorAuth}
                  onChange={(e) => updateSetting('twoFactorAuth', e.target.checked)}
                  className="w-4 h-4"
                />
              </label>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-300 mb-2">
                {t('dataRetentionDays')}
              </label>
              <input
                type="number"
                min="30"
                max="3650"
                value={settings.dataRetentionDays}
                onChange={(e) => updateSetting('dataRetentionDays', parseInt(e.target.value))}
                className="w-full px-3 py-2 bg-background border border-input rounded-lg text-white"
              />
            </div>
          </CardContent>
        </Card>

        {/* System Configuration */}
        <Card className="bg-card/50 backdrop-blur-sm border-white/10">
          <CardHeader>
            <CardTitle className="flex items-center space-x-2">
              <Sliders className="w-5 h-5 text-primary" />
              <span>{t('systemConfiguration')}</span>
            </CardTitle>
            <CardDescription>{t('configureSystemLimits')}</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-300 mb-2">
                  {t('maxClaimsPerUser')}
                </label>
                <input
                  type="number"
                  min="10"
                  max="1000"
                  value={settings.maxClaimsPerUser}
                  onChange={(e) => updateSetting('maxClaimsPerUser', parseInt(e.target.value))}
                  className="w-full px-3 py-2 bg-background border border-input rounded-lg text-white"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-300 mb-2">
                  {t('sessionTimeoutMinutes')}
                </label>
                <input
                  type="number"
                  min="5"
                  max="480"
                  value={settings.sessionTimeout}
                  onChange={(e) => updateSetting('sessionTimeout', parseInt(e.target.value))}
                  className="w-full px-3 py-2 bg-background border border-input rounded-lg text-white"
                />
              </div>
            </div>

            <div className="space-y-3">
              <label className="flex items-center justify-between">
                <div className="flex items-center space-x-3">
                  <Clock className="w-4 h-4 text-gray-400" />
                  <span className="text-white">{t('autoLogout')}</span>
                </div>
                <input
                  type="checkbox"
                  checked={settings.autoLogout}
                  onChange={(e) => updateSetting('autoLogout', e.target.checked)}
                  className="w-4 h-4"
                />
              </label>

              <label className="flex items-center justify-between">
                <div className="flex items-center space-x-3">
                  <Database className="w-4 h-4 text-gray-400" />
                  <span className="text-white">{t('cacheEnabled')}</span>
                </div>
                <input
                  type="checkbox"
                  checked={settings.cacheEnabled}
                  onChange={(e) => updateSetting('cacheEnabled', e.target.checked)}
                  className="w-4 h-4"
                />
              </label>

              <label className="flex items-center justify-between">
                <div className="flex items-center space-x-3">
                  <AlertTriangle className="w-4 h-4 text-gray-400" />
                  <span className="text-white">{t('securityAlerts')}</span>
                </div>
                <input
                  type="checkbox"
                  checked={settings.securityAlerts}
                  onChange={(e) => updateSetting('securityAlerts', e.target.checked)}
                  className="w-4 h-4"
                />
              </label>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Save Actions */}
      <Card className="bg-card/50 backdrop-blur-sm border-white/10">
        <CardContent className="p-6">
          <div className="flex items-center justify-between">
            <div>
              <h3 className="text-lg font-semibold text-white mb-1">{t('saveConfiguration')}</h3>
              <p className="text-gray-400">{t('changesAppliedSystemWide')}</p>
            </div>
            <div className="flex space-x-3">
              <Button variant="outline" onClick={resetToDefaults}>
                <RefreshCw className="w-4 h-4 mr-2" />
                {t('resetAll')}
              </Button>
              <Button onClick={saveSettings} disabled={saving} className="min-w-[120px]">
                <Save className="w-4 h-4 mr-2" />
                {saving ? t('saving') : t('saveSettings')}
              </Button>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
