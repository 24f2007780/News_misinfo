const mongoose = require('mongoose');

const communityVoteSchema = new mongoose.Schema({
  claimId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Claim',
    required: true
  },
  userId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  vote: {
    type: String,
    enum: ['true', 'false', 'misleading', 'unverified'],
    required: true
  },
  confidence: {
    type: Number,
    min: 0,
    max: 1,
    default: 0.5
  },
  evidence: {
    type: String
  },
  weight: {
    type: Number,
    default: 1
  }
}, {
  timestamps: true
});

// Compound index to prevent duplicate votes
communityVoteSchema.index({ claimId: 1, userId: 1 }, { unique: true });

module.exports = mongoose.model('CommunityVote', communityVoteSchema);
