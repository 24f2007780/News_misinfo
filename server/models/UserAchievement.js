const mongoose = require('mongoose');

const userAchievementSchema = new mongoose.Schema({
  userId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  type: {
    type: String,
    enum: ['first_verification', 'correct_streak', 'evidence_master', 'community_hero', 'expert_level'],
    required: true
  },
  title: {
    type: String,
    required: true
  },
  description: {
    type: String
  },
  icon: {
    type: String
  },
  earnedAt: {
    type: Date,
    default: Date.now
  }
}, {
  timestamps: true
});

userAchievementSchema.index({ userId: 1, earnedAt: -1 });

module.exports = mongoose.model('UserAchievement', userAchievementSchema);
