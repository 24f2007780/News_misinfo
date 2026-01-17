const express = require('express');
const { authenticateToken } = require('./auth');

const router = express.Router();

// In-memory storage for settings (in production, use database)
let systemSettings = {
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
  securityAlerts: true,
  
  // Metadata
  lastUpdated: new Date().toISOString(),
  updatedBy: null
};

// Get current system settings
router.get('/', authenticateToken, async (req, res) => {
  try {
    console.log('📋 Fetching system settings');
    
    // Check if user is admin
    if (req.user?.role !== 'admin') {
      return res.status(403).json({ error: 'Admin access required' });
    }
    
    res.json({
      ...systemSettings,
      availableLanguages: [
        { code: 'en', name: 'English', flag: '🇺🇸' },
        { code: 'hi', name: 'हिंदी (Hindi)', flag: '🇮🇳' },
        { code: 'mr', name: 'मराठी (Marathi)', flag: '🇮🇳' },
        { code: 'gu', name: 'ગુજરાતી (Gujarati)', flag: '🇮🇳' },
        { code: 'fr', name: 'Français (French)', flag: '🇫🇷' }
      ],
      availableModels: [
        { id: 'bert-base', name: 'BERT Base', description: 'Fast, lightweight model' },
        { id: 'bert-large', name: 'BERT Large', description: 'High accuracy, slower' },
        { id: 'roberta-large', name: 'RoBERTa Large', description: 'Best performance' },
        { id: 'distilbert', name: 'DistilBERT', description: 'Fastest, good accuracy' }
      ]
    });
  } catch (error) {
    console.error('❌ Error fetching settings:', error);
    res.status(500).json({ error: error.message });
  }
});

// Update system settings
router.put('/', authenticateToken, async (req, res) => {
  try {
    console.log('💾 Updating system settings');
    
    // Check if user is admin
    if (req.user?.role !== 'admin') {
      return res.status(403).json({ error: 'Admin access required' });
    }
    
    const updates = req.body;
    console.log('📝 Settings updates:', Object.keys(updates));
    
    // Validate settings
    const validationResult = validateSettings(updates);
    if (!validationResult.valid) {
      return res.status(400).json({ error: validationResult.error });
    }
    
    // Update settings
    systemSettings = {
      ...systemSettings,
      ...updates,
      lastUpdated: new Date().toISOString(),
      updatedBy: req.user.id
    };
    
    console.log('✅ Settings updated successfully');
    console.log('🔧 Active language:', systemSettings.language);
    console.log('🤖 Primary model:', systemSettings.primaryModel);
    console.log('🔒 Security settings updated');
    
    // In production, save to database here
    // await Settings.findOneAndUpdate({}, systemSettings, { upsert: true });
    
    res.json({
      message: 'Settings updated successfully',
      settings: systemSettings
    });
  } catch (error) {
    console.error('❌ Error updating settings:', error);
    res.status(500).json({ error: error.message });
  }
});

// Get specific setting by key
router.get('/:key', authenticateToken, async (req, res) => {
  try {
    const { key } = req.params;
    
    if (systemSettings.hasOwnProperty(key)) {
      res.json({
        key,
        value: systemSettings[key],
        lastUpdated: systemSettings.lastUpdated
      });
    } else {
      res.status(404).json({ error: 'Setting not found' });
    }
  } catch (error) {
    console.error('❌ Error fetching setting:', error);
    res.status(500).json({ error: error.message });
  }
});

// Update specific setting
router.patch('/:key', authenticateToken, async (req, res) => {
  try {
    const { key } = req.params;
    const { value } = req.body;
    
    // Check if user is admin
    if (req.user?.role !== 'admin') {
      return res.status(403).json({ error: 'Admin access required' });
    }
    
    if (!systemSettings.hasOwnProperty(key)) {
      return res.status(404).json({ error: 'Setting not found' });
    }
    
    // Validate specific setting
    const validationResult = validateSingleSetting(key, value);
    if (!validationResult.valid) {
      return res.status(400).json({ error: validationResult.error });
    }
    
    systemSettings[key] = value;
    systemSettings.lastUpdated = new Date().toISOString();
    systemSettings.updatedBy = req.user.id;
    
    console.log(`🔧 Updated setting: ${key} = ${value}`);
    
    res.json({
      message: `Setting '${key}' updated successfully`,
      key,
      value,
      lastUpdated: systemSettings.lastUpdated
    });
  } catch (error) {
    console.error('❌ Error updating setting:', error);
    res.status(500).json({ error: error.message });
  }
});

// Reset settings to defaults
router.post('/reset', authenticateToken, async (req, res) => {
  try {
    // Check if user is admin
    if (req.user?.role !== 'admin') {
      return res.status(403).json({ error: 'Admin access required' });
    }
    
    console.log('🔄 Resetting settings to defaults');
    
    systemSettings = {
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
      securityAlerts: true,
      lastUpdated: new Date().toISOString(),
      updatedBy: req.user.id
    };
    
    console.log('✅ Settings reset to defaults');
    
    res.json({
      message: 'Settings reset to defaults successfully',
      settings: systemSettings
    });
  } catch (error) {
    console.error('❌ Error resetting settings:', error);
    res.status(500).json({ error: error.message });
  }
});

// Export current settings (for backup)
router.get('/export/backup', authenticateToken, async (req, res) => {
  try {
    // Check if user is admin
    if (req.user?.role !== 'admin') {
      return res.status(403).json({ error: 'Admin access required' });
    }
    
    const backup = {
      settings: systemSettings,
      exportedAt: new Date().toISOString(),
      exportedBy: req.user.id,
      version: '1.0'
    };
    
    res.setHeader('Content-Disposition', 'attachment; filename=system-settings-backup.json');
    res.setHeader('Content-Type', 'application/json');
    res.json(backup);
  } catch (error) {
    console.error('❌ Error exporting settings:', error);
    res.status(500).json({ error: error.message });
  }
});

// Validation functions
function validateSettings(settings) {
  try {
    // Language validation
    if (settings.language && !['en', 'hi', 'mr', 'gu', 'fr'].includes(settings.language)) {
      return { valid: false, error: 'Invalid language code' };
    }
    
    // Model validation
    const validModels = ['bert-base', 'bert-large', 'roberta-large', 'distilbert'];
    if (settings.primaryModel && !validModels.includes(settings.primaryModel)) {
      return { valid: false, error: 'Invalid primary model' };
    }
    if (settings.fallbackModel && !validModels.includes(settings.fallbackModel)) {
      return { valid: false, error: 'Invalid fallback model' };
    }
    
    // Threshold validation
    if (settings.confidenceThreshold && (settings.confidenceThreshold < 0.1 || settings.confidenceThreshold > 1)) {
      return { valid: false, error: 'Confidence threshold must be between 0.1 and 1' };
    }
    if (settings.similarityThreshold && (settings.similarityThreshold < 0.1 || settings.similarityThreshold > 1)) {
      return { valid: false, error: 'Similarity threshold must be between 0.1 and 1' };
    }
    
    // Numeric validation
    if (settings.dataRetentionDays && (settings.dataRetentionDays < 30 || settings.dataRetentionDays > 3650)) {
      return { valid: false, error: 'Data retention days must be between 30 and 3650' };
    }
    if (settings.maxClaimsPerUser && (settings.maxClaimsPerUser < 10 || settings.maxClaimsPerUser > 1000)) {
      return { valid: false, error: 'Max claims per user must be between 10 and 1000' };
    }
    if (settings.sessionTimeout && (settings.sessionTimeout < 5 || settings.sessionTimeout > 480)) {
      return { valid: false, error: 'Session timeout must be between 5 and 480 minutes' };
    }
    
    return { valid: true };
  } catch (error) {
    return { valid: false, error: 'Validation error: ' + error.message };
  }
}

function validateSingleSetting(key, value) {
  const tempSettings = { [key]: value };
  return validateSettings(tempSettings);
}

module.exports = router;
