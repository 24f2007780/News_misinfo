const mongoose = require('mongoose');

const clusterSchema = new mongoose.Schema({
  name: {
    type: String,
    required: true
  },
  description: String,
  claims: [{
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Claim'
  }],
  centroid: [Number], // Vector centroid
  category: String,
  keywords: [String],
  entities: [{
    text: String,
    type: String,
    frequency: Number
  }],
  timeline: {
    firstSeen: Date,
    lastSeen: Date,
    peakActivity: Date
  },
  metrics: {
    totalClaims: { type: Number, default: 0 },
    verifiedTrue: { type: Number, default: 0 },
    verifiedFalse: { type: Number, default: 0 },
    totalReach: { type: Number, default: 0 }
  },
  geographicDistribution: [{
    country: String,
    region: String,
    count: Number
  }],
  languageDistribution: [{
    language: String,
    count: Number
  }],
  status: {
    type: String,
    enum: ['active', 'resolved', 'monitoring'],
    default: 'active'
  },
  aiSummary: String,
  riskLevel: {
    type: String,
    enum: ['low', 'medium', 'high', 'critical'],
    default: 'medium'
  }
}, {
  timestamps: true
});

clusterSchema.index({ category: 1, status: 1 });
clusterSchema.index({ 'timeline.lastSeen': -1 });

module.exports = mongoose.model('Cluster', clusterSchema);
