const mongoose = require('mongoose');

const dailyBriefSchema = new mongoose.Schema({
  userId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  date: {
    type: Date,
    required: true
  },
  summary: {
    type: String,
    required: true
  },
  topMisinformation: [{
    claimId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Claim'
    },
    text: String,
    category: String,
    severity: String
  }],
  watchlistAlerts: [{
    topic: String,
    claimText: String,
    timestamp: Date
  }],
  sent: {
    type: Boolean,
    default: false
  },
  sentAt: {
    type: Date
  }
}, {
  timestamps: true
});

dailyBriefSchema.index({ userId: 1, date: -1 });

module.exports = mongoose.model('DailyBrief', dailyBriefSchema);
