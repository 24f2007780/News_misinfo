const mongoose = require('mongoose');

const claimSchema = new mongoose.Schema({
  text: {
    type: String,
    required: true,
    trim: true
  },
  originalText: {
    type: String,
    required: true
  },
  language: {
    type: String,
    default: 'en'
  },
  source: {
    platform: String,
    url: String,
    author: String,
    timestamp: Date
  },
  entities: [{
    text: String,
    type: String, // PERSON, ORG, GPE, DATE, etc.
    confidence: Number
  }],
  sentiment: {
    score: Number,
    label: String // positive, negative, neutral
  },
  category: {
    type: String,
    enum: [
      'politics_governance', 
      'health_medicine', 
      'environment_climate', 
      'economics_finance', 
      'science_technology', 
      'food_nutrition', 
      'social_cultural', 
      'entertainment_media', 
      'sports', 
      'technology_cybersecurity',
      'other'
    ],
    default: 'other'
  },
  verificationStatus: {
    type: String,
    enum: ['pending', 'in_progress', 'verified', 'debunked', 'unverified'],
    default: 'pending'
  },
  verdict: {
    type: String,
    enum: ['true', 'false', 'misleading', 'unverified', 'satire'],
    default: 'unverified'
  },
  confidence: {
    type: Number,
    min: 0,
    max: 1,
    default: 0
  },
  aiAnalysis: {
    claimType: String,
    checkability: Number,
    urgency: String,
    reasoning: String,
    extractedAt: Date,
    // Enhanced AI analysis fields
    provider: String, // 'gemini', 'openai'
    verdict: String,
    confidence: Number,
    analyzedAt: Date
  },
  evidence: [{
    source: String,
    url: String,
    title: String,
    snippet: String,
    credibility: Number,
    stance: String, // supports, refutes, neutral
    addedAt: Date,
    // Web scraping specific fields
    relevanceScore: Number,
    verdict: String, // from fact-checking site
    rating: String, // site-specific rating
    scrapedAt: Date,
    factCheckingSite: String,
    content: String // detailed content if scraped
  }],
  clusterId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Cluster'
  },
  embedding: [Number], // Vector embedding for similarity
  verifiedBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User'
  },
  verifiedAt: Date,
  explanation: {
    short: String,
    medium: String,
    long: String,
    eli5: String
  },
  relatedClaims: [{
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Claim'
  }],
  metrics: {
    views: { type: Number, default: 0 },
    shares: { type: Number, default: 0 },
    reports: { type: Number, default: 0 },
    reach: { type: Number, default: 0 }
  },
  flags: {
    viral: { type: Boolean, default: false },
    urgent: { type: Boolean, default: false },
    sensitive: { type: Boolean, default: false }
  },
  // Web scraping metadata
  webScrapingData: {
    lastScraped: Date,
    sitesSearched: Number,
    resultsFound: Number,
    topRelevanceScore: Number,
    scrapingEnabled: { type: Boolean, default: true },
    scrapingHistory: [{
      timestamp: Date,
      sitesSearched: Number,
      resultsFound: Number,
      topVerdict: String
    }]
  },
  // Community verification data
  communityVerdict: {
    type: String,
    enum: ['true', 'false', 'misleading', 'unverified']
  },
  communityConfidence: {
    type: Number,
    min: 0,
    max: 1
  },
  communityConsensus: {
    type: Number,
    min: 0,
    max: 1
  }
}, {
  timestamps: true
});

// Indexes for performance
claimSchema.index({ text: 'text' });
claimSchema.index({ verificationStatus: 1, createdAt: -1 });
claimSchema.index({ category: 1, createdAt: -1 });
claimSchema.index({ clusterId: 1 });

module.exports = mongoose.model('Claim', claimSchema);
