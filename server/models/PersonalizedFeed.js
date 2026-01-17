const mongoose = require('mongoose');

const personalizedFeedSchema = new mongoose.Schema({
  userId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  text: {
    type: String,
    required: true
  },
  category: {
    type: String,
    enum: ['health', 'politics', 'science', 'technology', 'climate', 'other'],
    required: true
  },
  severity: {
    type: String,
    enum: ['low', 'medium', 'high'],
    default: 'medium'
  },
  region: {
    type: String,
    default: 'global'
  },
  relatedClaimId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Claim'
  },
  seen: {
    type: Boolean,
    default: false
  },
  verificationRequested: {
    type: Boolean,
    default: false
  },
  aiSummary: {
    type: String
  }
}, {
  timestamps: true
});

// Index for efficient queries
personalizedFeedSchema.index({ userId: 1, seen: 1, createdAt: -1 });

module.exports = mongoose.model('PersonalizedFeed', personalizedFeedSchema);
