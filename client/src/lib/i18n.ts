// Internationalization (i18n) system for multi-language support

export interface Translation {
  [key: string]: string | Translation;
}

export const translations: Record<string, Translation> = {
  en: {
    // Common
    save: 'Save',
    cancel: 'Cancel',
    delete: 'Delete',
    edit: 'Edit',
    loading: 'Loading...',
    error: 'Error',
    success: 'Success',
    warning: 'Warning',
    
    // Navigation
    overview: 'Overview',
    streams: 'Streams & Agents',
    claims: 'Claim Intelligence',
    verification: 'Verification Studio',
    trends: 'Trends & Heatmaps',
    reports: 'Reports & Insights',
    governance: 'Governance & Audit',
    settings: 'Settings',
    
    // File Upload
    fileUpload: 'File Upload',
    dropFiles: 'Drop files here or click to browse',
    selectFiles: 'Select Files',
    uploadFiles: 'Upload Files',
    uploading: 'Uploading...',
    supports: 'Supports: TXT, PDF, DOCX, CSV, JSON, HTML',
    maxFileSize: 'Maximum file size: 10MB per file',
    selectedFiles: 'Selected Files:',
    
    // Settings
    systemSettings: 'System Settings',
    configureLanguageModels: 'Configure language, models, security, and system preferences',
    languageSettings: 'Language Settings',
    selectPreferredLanguage: 'Select your preferred language for the entire system',
    systemLanguage: 'System Language',
    active: 'Active',
    aiModelSettings: 'AI Model Settings',
    configureMachineLearning: 'Configure machine learning models and thresholds',
    securityPrivacy: 'Security & Privacy',
    configureDataTracking: 'Configure data tracking, privacy, and security options',
    systemConfiguration: 'System Configuration',
    configureSystemLimits: 'Configure system limits, performance, and behavior',
    primaryModel: 'Primary Model',
    fallbackModel: 'Fallback Model',
    confidenceThreshold: 'Confidence Threshold',
    similarityThreshold: 'Similarity Threshold',
    locationTracking: 'Location Tracking',
    informationTracking: 'Information Tracking',
    claimHistory: 'Claim History',
    userActivityLogging: 'User Activity Logging',
    twoFactorAuthentication: 'Two-Factor Authentication',
    dataRetentionDays: 'Data Retention (Days)',
    maxClaimsPerUser: 'Max Claims per User',
    sessionTimeoutMinutes: 'Session Timeout (minutes)',
    autoLogout: 'Auto Logout',
    cacheEnabled: 'Cache Enabled',
    securityAlerts: 'Security Alerts',
    saveConfiguration: 'Save Configuration',
    changesAppliedSystemWide: 'Changes will be applied system-wide and may require restart for some settings',
    resetToDefaults: 'Reset to Defaults',
    resetAll: 'Reset All',
    saveSettings: 'Save Settings',
    saving: 'Saving...',
    settingsSavedSuccessfully: 'Settings saved successfully!',
    failedToSaveSettings: 'Failed to save settings',
    failedToLoadSettings: 'Failed to load settings',
    resetAllSettingsConfirm: 'Are you sure you want to reset all settings to defaults?',
    settingsResetToDefaults: 'Settings reset to defaults',
    
    // Admin Dashboard
    aiMisinformationIntelligence: 'AI Misinformation Intelligence',
    adminCommandCenter: 'Admin Command Center',
    searchPlaceholder: 'Search claims, agents...',
    administrator: 'Administrator',
    toggleTheme: 'Toggle theme',
    lightMode: 'Light mode',
    darkMode: 'Dark mode',
    
    // Overview Page
    aiPoweredSituationalIntelligence: 'AI-powered situational intelligence dashboard',
    aiSituationalBrief: 'AI Situational Brief',
    last24HoursIntelligence: 'Last 24 hours intelligence summary',
    newMisinformationClaims: 'new misinformation claims',
    wereDetectedAcrossMultiplePlatforms: 'were detected across multiple platforms',
    topCategoriesInclude: 'Top categories include',
    health: 'health',
    politics: 'politics',
    climate: 'climate',
    aiConfidenceInVerification: 'AI confidence in verification',
    totalClaims: 'Total Claims',
    today: 'today',
    verified: 'Verified',
    rate: 'rate',
    falseClaims: 'False Claims',
    highPriority: 'High priority',
    activeClusters: 'Active Clusters',
    monitoring: 'Monitoring',
    claimsTimeline7Days: 'Claims Timeline (7 Days)',
    askTheSystem: 'Ask the System',
    queryAiForInsights: 'Query AI for insights',
    askAiPlaceholder: 'e.g., Show me all false claims about vaccines in the last week',
    askAi: 'Ask AI',
    top5MisinformationClusters: 'Top 5 Misinformation Clusters',
    mostActiveMisinformationNarratives: 'Most active misinformation narratives',
    claimsCount: 'claims',
    risk: 'risk',
    geographicDistribution: 'Geographic Distribution',
    topRegionsAffectedByMisinformation: 'Top regions affected by misinformation',
    clusters: 'clusters',
    trackingMisinformationAcross: 'Tracking misinformation across',
    regionsWithActiveClusters: 'regions with',
    activeClustersText: 'active clusters',
    loadingGeographicData: 'Loading geographic data...',
    failedToLoadDashboardData: 'Failed to load dashboard data',
    newDailyBriefGenerated: 'New daily brief generated!',
    misinformationSpikeDetected: '⚠️ Misinformation spike detected!',
    newClaimsExtracted: 'new claims extracted',
    failedToGetResponse: 'Failed to get response',
    
    // Streams & Agents Page
    streamsAndAgents: 'Streams & Agents',
    agentStatus: 'Agent Status',
    running: 'Running',
    stopped: 'Stopped',
    errorStatus: 'Error',
    start: 'Start',
    stop: 'Stop',
    restart: 'Restart',
    
    // Claim Intelligence Page
    claimIntelligence: 'Claim Intelligence',
    dynamicKnowledgeGraph: 'Dynamic knowledge graph of claims and clusters',
    supportedSites: 'Supported Sites',
    scrapingCoverage: 'Scraping Coverage',
    scrapedClaims: 'Scraped Claims',
    recent24h: 'Recent (24h)',
    allClaims: 'All',
    pendingClaims: 'Pending',
    verifiedClaims: 'Verified',
    confidence: 'confidence',
    webScrape: 'Web Scrape',
    webScraped: 'Web Scraped',
    minutesAgo: 'minutes ago',
    hoursAgo: 'hours ago',
    dayAgo: 'day ago',
    daysAgo: 'days ago',
    aboutTime: 'about',
    activeClustersTitle: 'Active Clusters',
    searchClaimsPlaceholder: 'Search claims...',
    claimsTitle: 'Claims',
    webSources: 'web sources',
    scraping: 'Scraping...',
    
    // Claim statuses and verdicts
    true: 'true',
    false: 'false',
    unverified: 'unverified',
    
    // Risk levels
    critical: 'critical',
    high: 'high',
    medium: 'medium',
    low: 'low',
    
    // Categories (already exist but adding for completeness)
    economicsFinanceCategory: 'economics_finance',
    politicsGovernanceCategory: 'politics_governance',
    healthMedicineCategory: 'health_medicine',
    otherCategory: 'other',
    economyCategory: 'economy',
    climateCategory: 'climate',
    technologyCategory: 'technology',
    
    // Verification Studio Page
    verificationStudio: 'Verification Studio',
    hybridAiHumanVerification: 'Hybrid AI + Human verification workspace',
    pendingQueue: 'Pending Queue',
    noPendingClaims: 'No pending claims',
    noClaimSelected: 'No claim selected',
    
    // Trends & Heatmaps Page
    trendsAndHeatmaps: 'Trends & Heatmaps',
    
    // Reports & Insights Page
    reportsAndInsights: 'Reports & Insights',
    reportsAndAutoInsights: 'Reports & Auto-Insights',
    aiGeneratedIntelligenceReports: 'AI-generated intelligence reports and summaries',
    dailyIntelligenceBrief: 'Daily Intelligence Brief',
    aiGeneratedSummaryLast24Hours: 'AI-generated summary of the last 24 hours of misinformation activity',
    generateDailyBrief: 'Generate Daily Brief',
    downloadDailyPdf: 'Download Daily PDF',
    weeklyIntelligenceReport: 'Weekly Intelligence Report',
    comprehensiveAnalysisLastWeek: 'Comprehensive analysis of misinformation trends over the past week',
    generateWeeklyReport: 'Generate Weekly Report',
    downloadWeeklyPdf: 'Download Weekly PDF',
    generating: 'Generating...',
    
    // Governance & Audit Page
    governanceAndAudit: 'Governance & Audit',
    
    // User Dashboard
    verifyAClaim: 'Verify a Claim',
    claimText: 'Claim Text',
    category: 'Category',
    verifyWithAI: 'Verify with AI',
    yourProfile: 'Your Profile',
    recentClaims: 'Recent Claims',
    
    // Categories
    healthMedicine: 'Health & Medicine',
    politicsGovernance: 'Politics & Governance',
    environmentClimate: 'Environment & Climate',
    economicsFinance: 'Economics & Finance',
    scienceTechnology: 'Science & Technology',
    foodNutrition: 'Food & Nutrition',
    socialCultural: 'Social & Cultural Issues',
    entertainmentMedia: 'Entertainment & Media',
    sports: 'Sports',
    technologyCybersecurity: 'Technology & Cybersecurity',
    other: 'Other'
  },
  
  hi: {
    // Common
    save: 'सहेजें',
    cancel: 'रद्द करें',
    delete: 'हटाएं',
    edit: 'संपादित करें',
    loading: 'लोड हो रहा है...',
    error: 'त्रुटि',
    success: 'सफलता',
    warning: 'चेतावनी',
    
    // Navigation
    overview: 'अवलोकन',
    streams: 'स्ट्रीम और एजेंट',
    claims: 'दावा बुद्धिमत्ता',
    verification: 'सत्यापन स्टूडियो',
    trends: 'रुझान और हीटमैप',
    reports: 'रिपोर्ट और अंतर्दृष्टि',
    governance: 'शासन और ऑडिट',
    settings: 'सेटिंग्स',
    
    // File Upload
    fileUpload: 'फ़ाइल अपलोड',
    dropFiles: 'फ़ाइलें यहाँ छोड़ें या ब्राउज़ करने के लिए क्लिक करें',
    selectFiles: 'फ़ाइलें चुनें',
    uploadFiles: 'फ़ाइलें अपलोड करें',
    uploading: 'अपलोड हो रहा है...',
    supports: 'समर्थित: TXT, PDF, DOCX, CSV, JSON, HTML',
    maxFileSize: 'अधिकतम फ़ाइल आकार: प्रति फ़ाइल 10MB',
    selectedFiles: 'चयनित फ़ाइलें:',
    
    // Settings
    systemSettings: 'सिस्टम सेटिंग्स',
    configureLanguageModels: 'भाषा, मॉडल, सुरक्षा और सिस्टम प्राथमिकताएं कॉन्फ़िगर करें',
    languageSettings: 'भाषा सेटिंग्स',
    selectPreferredLanguage: 'पूरे सिस्टम के लिए अपनी पसंदीदा भाषा चुनें',
    systemLanguage: 'सिस्टम भाषा',
    active: 'सक्रिय',
    aiModelSettings: 'AI मॉडल सेटिंग्स',
    configureMachineLearning: 'मशीन लर्निंग मॉडल और सीमाएं कॉन्फ़िगर करें',
    securityPrivacy: 'सुरक्षा और गोपनीयता',
    configureDataTracking: 'डेटा ट्रैकिंग, गोपनीयता और सुरक्षा विकल्प कॉन्फ़िगर करें',
    systemConfiguration: 'सिस्टम कॉन्फ़िगरेशन',
    configureSystemLimits: 'सिस्टम सीमाएं, प्रदर्शन और व्यवहार कॉन्फ़िगर करें',
    primaryModel: 'प्राथमिक मॉडल',
    fallbackModel: 'फॉलबैक मॉडल',
    confidenceThreshold: 'विश्वास सीमा',
    similarityThreshold: 'समानता सीमा',
    locationTracking: 'स्थान ट्रैकिंग',
    informationTracking: 'जानकारी ट्रैकिंग',
    claimHistory: 'दावा इतिहास',
    userActivityLogging: 'उपयोगकर्ता गतिविधि लॉगिंग',
    twoFactorAuthentication: 'दो-कारक प्रमाणीकरण',
    dataRetentionDays: 'डेटा प्रतिधारण (दिन)',
    maxClaimsPerUser: 'प्रति उपयोगकर्ता अधिकतम दावे',
    sessionTimeoutMinutes: 'सत्र समय सीमा (मिनट)',
    autoLogout: 'स्वचालित लॉगआउट',
    cacheEnabled: 'कैश सक्षम',
    securityAlerts: 'सुरक्षा अलर्ट',
    saveConfiguration: 'कॉन्फ़िगरेशन सहेजें',
    changesAppliedSystemWide: 'परिवर्तन सिस्टम-व्यापी लागू होंगे और कुछ सेटिंग्स के लिए पुनः आरंभ की आवश्यकता हो सकती है',
    resetToDefaults: 'डिफ़ॉल्ट पर रीसेट करें',
    resetAll: 'सभी रीसेट करें',
    saveSettings: 'सेटिंग्स सहेजें',
    saving: 'सहेजा जा रहा है...',
    settingsSavedSuccessfully: 'सेटिंग्स सफलतापूर्वक सहेजी गईं!',
    failedToSaveSettings: 'सेटिंग्स सहेजने में विफल',
    failedToLoadSettings: 'सेटिंग्स लोड करने में विफल',
    resetAllSettingsConfirm: 'क्या आप वाकई सभी सेटिंग्स को डिफ़ॉल्ट पर रीसेट करना चाहते हैं?',
    settingsResetToDefaults: 'सेटिंग्स डिफ़ॉल्ट पर रीसेट कर दी गईं',
    
    // Admin Dashboard
    aiMisinformationIntelligence: 'AI गलत सूचना बुद्धिमत्ता',
    adminCommandCenter: 'एडमिन कमांड सेंटर',
    searchPlaceholder: 'दावे, एजेंट खोजें...',
    administrator: 'प्रशासक',
    toggleTheme: 'थीम बदलें',
    lightMode: 'लाइट मोड',
    darkMode: 'डार्क मोड',
    
    // Overview Page
    aiPoweredSituationalIntelligence: 'AI-संचालित स्थितिजन्य बुद्धिमत्ता डैशबोर्ड',
    aiSituationalBrief: 'AI स्थितिजन्य संक्षेप',
    last24HoursIntelligence: 'पिछले 24 घंटों का खुफिया सारांश',
    newMisinformationClaims: 'नए गलत सूचना दावे',
    wereDetectedAcrossMultiplePlatforms: 'कई प्लेटफॉर्म पर पाए गए',
    topCategoriesInclude: 'मुख्य श्रेणियों में शामिल हैं',
    health: 'स्वास्थ्य',
    politics: 'राजनीति',
    climate: 'जलवायु',
    aiConfidenceInVerification: 'सत्यापन में AI विश्वास',
    totalClaims: 'कुल दावे',
    today: 'आज',
    verified: 'सत्यापित',
    rate: 'दर',
    falseClaims: 'झूठे दावे',
    highPriority: 'उच्च प्राथमिकता',
    activeClusters: 'सक्रिय क्लस्टर',
    monitoring: 'निगरानी',
    claimsTimeline7Days: 'दावे समयरेखा (7 दिन)',
    askTheSystem: 'सिस्टम से पूछें',
    queryAiForInsights: 'अंतर्दृष्टि के लिए AI से पूछताछ करें',
    askAiPlaceholder: 'जैसे, पिछले सप्ताह टीकों के बारे में सभी झूठे दावे दिखाएं',
    askAi: 'AI से पूछें',
    top5MisinformationClusters: 'शीर्ष 5 गलत सूचना क्लस्टर',
    mostActiveMisinformationNarratives: 'सबसे सक्रिय गलत सूचना कथाएं',
    claimsCount: 'दावे',
    risk: 'जोखिम',
    geographicDistribution: 'भौगोलिक वितरण',
    topRegionsAffectedByMisinformation: 'गलत सूचना से प्रभावित शीर्ष क्षेत्र',
    clusters: 'क्लस्टर',
    trackingMisinformationAcross: 'गलत सूचना की ट्रैकिंग',
    regionsWithActiveClusters: 'क्षेत्रों में',
    activeClustersText: 'सक्रिय क्लस्टर',
    loadingGeographicData: 'भौगोलिक डेटा लोड हो रहा है...',
    failedToLoadDashboardData: 'डैशबोर्ड डेटा लोड करने में विफल',
    newDailyBriefGenerated: 'नया दैनिक संक्षेप तैयार किया गया!',
    misinformationSpikeDetected: '⚠️ गलत सूचना में वृद्धि का पता चला!',
    newClaimsExtracted: 'नए दावे निकाले गए',
    failedToGetResponse: 'प्रतिक्रिया प्राप्त करने में विफल',
    
    // Streams & Agents Page
    streamsAndAgents: 'स्ट्रीम और एजेंट',
    agentStatus: 'एजेंट स्थिति',
    running: 'चल रहा है',
    stopped: 'रुका हुआ',
    errorStatus: 'त्रुटि',
    start: 'शुरू करें',
    stop: 'रोकें',
    restart: 'पुनः आरंभ करें',
    
    // Claim Intelligence Page
    claimIntelligence: 'दावा बुद्धिमत्ता',
    dynamicKnowledgeGraph: 'दावों और क्लस्टर का गतिशील ज्ञान ग्राफ',
    supportedSites: 'समर्थित साइटें',
    scrapingCoverage: 'स्क्रैपिंग कवरेज',
    scrapedClaims: 'स्क्रैप किए गए दावे',
    recent24h: 'हाल के (24 घंटे)',
    allClaims: 'सभी',
    pendingClaims: 'लंबित',
    verifiedClaims: 'सत्यापित',
    confidence: 'विश्वास',
    webScrape: 'वेब स्क्रैप',
    webScraped: 'वेब स्क्रैप किया गया',
    minutesAgo: 'मिनट पहले',
    hoursAgo: 'घंटे पहले',
    dayAgo: 'दिन पहले',
    daysAgo: 'दिन पहले',
    aboutTime: 'लगभग',
    activeClustersTitle: 'सक्रिय क्लस्टर',
    searchClaimsPlaceholder: 'दावे खोजें...',
    claimsTitle: 'दावे',
    webSources: 'वेब स्रोत',
    scraping: 'स्क्रैप कर रहे हैं...',
    
    // Claim statuses and verdicts
    true: 'सत्य',
    false: 'झूठ',
    unverified: 'असत्यापित',
    
    // Risk levels
    critical: 'गंभीर',
    high: 'उच्च',
    medium: 'मध्यम',
    low: 'कम',
    
    // Categories (already exist but adding for completeness)
    economicsFinanceCategory: 'अर्थशास्त्र_वित्त',
    politicsGovernanceCategory: 'राजनीति_शासन',
    healthMedicineCategory: 'स्वास्थ्य_चिकित्सा',
    otherCategory: 'अन्य',
    economyCategory: 'अर्थव्यवस्था',
    climateCategory: 'जलवायु',
    technologyCategory: 'प्रौद्योगिकी',
    
    // Verification Studio Page
    verificationStudio: 'सत्यापन स्टूडियो',
    hybridAiHumanVerification: 'हाइब्रिड AI + मानव सत्यापन कार्यक्षेत्र',
    pendingQueue: 'लंबित कतार',
    noPendingClaims: 'कोई लंबित दावे नहीं',
    noClaimSelected: 'कोई दावा चयनित नहीं',
    
    // Trends & Heatmaps Page
    trendsAndHeatmaps: 'रुझान और हीटमैप',
    
    // Reports & Insights Page
    reportsAndInsights: 'रिपोर्ट और अंतर्दृष्टि',
    reportsAndAutoInsights: 'रिपोर्ट और स्वचालित अंतर्दृष्टि',
    aiGeneratedIntelligenceReports: 'AI-जनरेटेड खुफिया रिपोर्ट और सारांश',
    dailyIntelligenceBrief: 'दैनिक खुफिया संक्षेप',
    aiGeneratedSummaryLast24Hours: 'पिछले 24 घंटों की गलत सूचना गतिविधि का AI-जनरेटेड सारांश',
    generateDailyBrief: 'दैनिक संक्षेप तैयार करें',
    downloadDailyPdf: 'दैनिक PDF डाउनलोड करें',
    weeklyIntelligenceReport: 'साप्ताहिक खुफिया रिपोर्ट',
    comprehensiveAnalysisLastWeek: 'पिछले सप्ताह की गलत सूचना प्रवृत्तियों का व्यापक विश्लेषण',
    generateWeeklyReport: 'साप्ताहिक रिपोर्ट तैयार करें',
    downloadWeeklyPdf: 'साप्ताहिक PDF डाउनलोड करें',
    generating: 'तैयार कर रहे हैं...',
    
    // Governance & Audit Page
    governanceAndAudit: 'शासन और ऑडिट',
    
    // User Dashboard
    verifyAClaim: 'एक दावे को सत्यापित करें',
    claimText: 'दावा पाठ',
    category: 'श्रेणी',
    verifyWithAI: 'AI के साथ सत्यापित करें',
    yourProfile: 'आपकी प्रोफ़ाइल',
    recentClaims: 'हाल के दावे',
    
    // Categories
    healthMedicine: 'स्वास्थ्य और चिकित्सा',
    politicsGovernance: 'राजनीति और शासन',
    environmentClimate: 'पर्यावरण और जलवायु',
    economicsFinance: 'अर्थशास्त्र और वित्त',
    scienceTechnology: 'विज्ञान और प्रौद्योगिकी',
    foodNutrition: 'भोजन और पोषण',
    socialCultural: 'सामाजिक और सांस्कृतिक मुद्दे',
    entertainmentMedia: 'मनोरंजन और मीडिया',
    sports: 'खेल',
    technologyCybersecurity: 'प्रौद्योगिकी और साइबर सुरक्षा',
    other: 'अन्य'
  },
  
  mr: {
    // Common
    save: 'जतन करा',
    cancel: 'रद्द करा',
    delete: 'हटवा',
    edit: 'संपादित करा',
    loading: 'लोड होत आहे...',
    error: 'त्रुटी',
    success: 'यश',
    warning: 'चेतावणी',
    
    // Navigation
    overview: 'विहंगावलोकन',
    streams: 'स्ट्रीम आणि एजंट',
    claims: 'दावा बुद्धिमत्ता',
    verification: 'सत्यापन स्टुडिओ',
    trends: 'ट्रेंड आणि हीटमॅप',
    reports: 'अहवाल आणि अंतर्दृष्टी',
    governance: 'शासन आणि ऑडिट',
    settings: 'सेटिंग्ज',
    
    // File Upload
    fileUpload: 'फाइल अपलोड',
    dropFiles: 'फाइल्स येथे टाका किंवा ब्राउझ करण्यासाठी क्लिक करा',
    selectFiles: 'फाइल्स निवडा',
    uploadFiles: 'फाइल्स अपलोड करा',
    uploading: 'अपलोड होत आहे...',
    supports: 'समर्थित: TXT, PDF, DOCX, CSV, JSON, HTML',
    maxFileSize: 'कमाल फाइल आकार: प्रति फाइल 10MB',
    selectedFiles: 'निवडलेल्या फाइल्स:',
    
    // Settings
    systemSettings: 'सिस्टम सेटिंग्ज',
    languageSettings: 'भाषा सेटिंग्ज',
    aiModelSettings: 'AI मॉडेल सेटिंग्ज',
    securityPrivacy: 'सुरक्षा आणि गोपनीयता',
    systemConfiguration: 'सिस्टम कॉन्फिगरेशन',
    primaryModel: 'प्राथमिक मॉडेल',
    fallbackModel: 'फॉलबॅक मॉडेल',
    confidenceThreshold: 'विश्वास मर्यादा',
    similarityThreshold: 'समानता मर्यादा',
    
    // User Dashboard
    verifyAClaim: 'दावा सत्यापित करा',
    claimText: 'दावा मजकूर',
    category: 'श्रेणी',
    verifyWithAI: 'AI सह सत्यापित करा',
    yourProfile: 'तुमची प्रोफाइल',
    recentClaims: 'अलीकडील दावे',
    
    // Categories
    healthMedicine: 'आरोग्य आणि वैद्यकीय',
    politicsGovernance: 'राजकारण आणि शासन',
    environmentClimate: 'पर्यावरण आणि हवामान',
    economicsFinance: 'अर्थशास्त्र आणि वित्त',
    scienceTechnology: 'विज्ञान आणि तंत्रज्ञान',
    foodNutrition: 'अन्न आणि पोषण',
    socialCultural: 'सामाजिक आणि सांस्कृतिक मुद्दे',
    entertainmentMedia: 'मनोरंजन आणि मीडिया',
    sports: 'खेळ',
    technologyCybersecurity: 'तंत्रज्ञान आणि सायबर सुरक्षा',
    other: 'इतर'
  },
  
  gu: {
    // Common
    save: 'સાચવો',
    cancel: 'રદ કરો',
    delete: 'કાઢી નાખો',
    edit: 'સંપાદિત કરો',
    loading: 'લોડ થઈ રહ્યું છે...',
    error: 'ભૂલ',
    success: 'સફળતા',
    warning: 'ચેતવણી',
    
    // Navigation
    overview: 'વિહંગાવલોકન',
    streams: 'સ્ટ્રીમ અને એજન્ટ',
    claims: 'દાવો બુદ્ધિ',
    verification: 'ચકાસણી સ્ટુડિયો',
    trends: 'ટ્રેન્ડ અને હીટમેપ',
    reports: 'રિપોર્ટ અને આંતરદૃષ્ટિ',
    governance: 'શાસન અને ઓડિટ',
    settings: 'સેટિંગ્સ',
    
    // File Upload
    fileUpload: 'ફાઇલ અપલોડ',
    dropFiles: 'ફાઇલો અહીં મૂકો અથવા બ્રાઉઝ કરવા માટે ક્લિક કરો',
    selectFiles: 'ફાઇલો પસંદ કરો',
    uploadFiles: 'ફાઇલો અપલોડ કરો',
    uploading: 'અપલોડ થઈ રહ્યું છે...',
    supports: 'સપોર્ટ કરે છે: TXT, PDF, DOCX, CSV, JSON, HTML',
    maxFileSize: 'મહત્તમ ફાઇલ સાઇઝ: પ્રતિ ફાઇલ 10MB',
    selectedFiles: 'પસંદ કરેલી ફાઇલો:',
    
    // Settings
    systemSettings: 'સિસ્ટમ સેટિંગ્સ',
    languageSettings: 'ભાષા સેટિંગ્સ',
    aiModelSettings: 'AI મોડેલ સેટિંગ્સ',
    securityPrivacy: 'સુરક્ષા અને ગોપનીયતા',
    systemConfiguration: 'સિસ્ટમ કન્ફિગરેશન',
    primaryModel: 'પ્રાથમિક મોડેલ',
    fallbackModel: 'ફોલબેક મોડેલ',
    confidenceThreshold: 'વિશ્વાસ મર્યાદા',
    similarityThreshold: 'સમાનતા મર્યાદા',
    
    // User Dashboard
    verifyAClaim: 'દાવો ચકાસો',
    claimText: 'દાવો ટેક્સ્ટ',
    category: 'કેટેગરી',
    verifyWithAI: 'AI સાથે ચકાસો',
    yourProfile: 'તમારી પ્રોફાઇલ',
    recentClaims: 'તાજેતરના દાવા',
    
    // Categories
    healthMedicine: 'આરોગ્ય અને દવા',
    politicsGovernance: 'રાજકારણ અને શાસન',
    environmentClimate: 'પર્યાવરણ અને આબોહવા',
    economicsFinance: 'અર્થશાસ્ત્ર અને ફાઇનાન્સ',
    scienceTechnology: 'વિજ્ઞાન અને ટેકનોલોજી',
    foodNutrition: 'ખોરાક અને પોષણ',
    socialCultural: 'સામાજિક અને સાંસ્કૃતિક મુદ્દાઓ',
    entertainmentMedia: 'મનોરંજન અને મીડિયા',
    sports: 'રમતગમત',
    technologyCybersecurity: 'ટેકનોલોજી અને સાયબર સિક્યુરિટી',
    other: 'અન્ય'
  },
  
  fr: {
    // Common
    save: 'Enregistrer',
    cancel: 'Annuler',
    delete: 'Supprimer',
    edit: 'Modifier',
    loading: 'Chargement...',
    error: 'Erreur',
    success: 'Succès',
    warning: 'Avertissement',
    
    // Navigation
    overview: 'Vue d\'ensemble',
    streams: 'Flux et Agents',
    claims: 'Intelligence des Revendications',
    verification: 'Studio de Vérification',
    trends: 'Tendances et Cartes de Chaleur',
    reports: 'Rapports et Analyses',
    governance: 'Gouvernance et Audit',
    settings: 'Paramètres',
    
    // File Upload
    fileUpload: 'Téléchargement de Fichier',
    dropFiles: 'Déposez les fichiers ici ou cliquez pour parcourir',
    selectFiles: 'Sélectionner les Fichiers',
    uploadFiles: 'Télécharger les Fichiers',
    uploading: 'Téléchargement...',
    supports: 'Supporte: TXT, PDF, DOCX, CSV, JSON, HTML',
    maxFileSize: 'Taille maximale du fichier: 10MB par fichier',
    selectedFiles: 'Fichiers Sélectionnés:',
    
    // Settings
    systemSettings: 'Paramètres Système',
    languageSettings: 'Paramètres de Langue',
    aiModelSettings: 'Paramètres du Modèle IA',
    securityPrivacy: 'Sécurité et Confidentialité',
    systemConfiguration: 'Configuration Système',
    primaryModel: 'Modèle Principal',
    fallbackModel: 'Modèle de Secours',
    confidenceThreshold: 'Seuil de Confiance',
    similarityThreshold: 'Seuil de Similarité',
    
    // User Dashboard
    verifyAClaim: 'Vérifier une Revendication',
    claimText: 'Texte de la Revendication',
    category: 'Catégorie',
    verifyWithAI: 'Vérifier avec IA',
    yourProfile: 'Votre Profil',
    recentClaims: 'Revendications Récentes',
    
    // Categories
    healthMedicine: 'Santé et Médecine',
    politicsGovernance: 'Politique et Gouvernance',
    environmentClimate: 'Environnement et Climat',
    economicsFinance: 'Économie et Finance',
    scienceTechnology: 'Science et Technologie',
    foodNutrition: 'Alimentation et Nutrition',
    socialCultural: 'Questions Sociales et Culturelles',
    entertainmentMedia: 'Divertissement et Médias',
    sports: 'Sports',
    technologyCybersecurity: 'Technologie et Cybersécurité',
    other: 'Autre'
  }
};

// Get nested translation value
export function getTranslation(key: string, lang: string = 'en'): string {
  const keys = key.split('.');
  let value: any = translations[lang] || translations.en;
  
  for (const k of keys) {
    value = value?.[k];
    if (value === undefined) {
      // Fallback to English if translation not found
      value = translations.en;
      for (const k of keys) {
        value = value?.[k];
        if (value === undefined) {
          return key; // Return key if not found in English either
        }
      }
      break;
    }
  }
  
  return typeof value === 'string' ? value : key;
}

// Translation hook
export function useTranslation(currentLanguage: string = 'en') {
  return (key: string) => getTranslation(key, currentLanguage);
}
