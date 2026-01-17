const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');

const userSchema = new mongoose.Schema({
  email: {
    type: String,
    required: true,
    unique: true,
    lowercase: true,
    trim: true
  },
  password: {
    type: String,
    required: true
  },
  name: {
    type: String,
    required: true
  },
  role: {
    type: String,
    enum: ['admin', 'fact-checker', 'user'],
    default: 'user'
  },
  credibilityScore: {
    type: Number,
    default: 50,
    min: 0,
    max: 100
  },
  level: {
    type: String,
    enum: ['novice', 'trusted', 'expert'],
    default: 'novice'
  },
  stats: {
    verificationsSubmitted: { type: Number, default: 0 },
    correctVerifications: { type: Number, default: 0 },
    evidenceProvided: { type: Number, default: 0 },
    reportsGenerated: { type: Number, default: 0 }
  },
  preferences: {
    language: { type: String, default: 'en' },
    topics: [String],
    notifications: {
      email: { type: Boolean, default: true },
      push: { type: Boolean, default: true }
    }
  },
  watchlist: [{
    topic: String,
    keywords: [String],
    addedAt: Date
  }]
}, {
  timestamps: true
});

// Hash password before saving
userSchema.pre('save', async function(next) {
  if (!this.isModified('password')) return next();
  this.password = await bcrypt.hash(this.password, 10);
  next();
});

// Compare password method
userSchema.methods.comparePassword = async function(candidatePassword) {
  return await bcrypt.compare(candidatePassword, this.password);
};

// Update credibility level based on score
userSchema.methods.updateLevel = function() {
  if (this.credibilityScore >= 80) {
    this.level = 'expert';
  } else if (this.credibilityScore >= 40) {
    this.level = 'trusted';
  } else {
    this.level = 'novice';
  }
};

module.exports = mongoose.model('User', userSchema);
