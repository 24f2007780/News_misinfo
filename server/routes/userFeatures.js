const express = require('express');
const router = express.Router();
const PersonalizedFeed = require('../models/PersonalizedFeed');
const CommunityVote = require('../models/CommunityVote');
const UserAchievement = require('../models/UserAchievement');
const DailyBrief = require('../models/DailyBrief');
const User = require('../models/User');
const Claim = require('../models/Claim');

// Middleware to verify user (simplified - add proper JWT verification)
const authMiddleware = (req, res, next) => {
  // TODO: Add proper JWT verification
  req.userId = req.headers['user-id'] || req.query.userId;
  if (!req.userId) {
    return res.status(401).json({ error: 'Unauthorized' });
  }
  next();
};

// ===== PERSONALIZED FEED ROUTES =====

// Get personalized feed for user
router.get('/feed', authMiddleware, async (req, res) => {
  try {
    const { seen } = req.query;
    const query = { userId: req.userId };
    
    if (seen !== undefined) {
      query.seen = seen === 'true';
    }

    const feed = await PersonalizedFeed.find(query)
      .populate('relatedClaimId')
      .sort({ createdAt: -1 })
      .limit(20);

    res.json(feed);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Mark feed item as seen
router.patch('/feed/:id/seen', authMiddleware, async (req, res) => {
  try {
    const feedItem = await PersonalizedFeed.findOneAndUpdate(
      { _id: req.params.id, userId: req.userId },
      { seen: true },
      { new: true }
    );

    if (!feedItem) {
      return res.status(404).json({ error: 'Feed item not found' });
    }

    res.json(feedItem);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Request verification for feed item
router.post('/feed/:id/request-verification', authMiddleware, async (req, res) => {
  try {
    const feedItem = await PersonalizedFeed.findOneAndUpdate(
      { _id: req.params.id, userId: req.userId },
      { verificationRequested: true },
      { new: true }
    );

    if (!feedItem) {
      return res.status(404).json({ error: 'Feed item not found' });
    }

    // TODO: Trigger verification workflow
    res.json({ message: 'Verification requested', feedItem });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// ===== COMMUNITY VERIFICATION ROUTES =====

// Get pending community verifications
router.get('/community/pending', authMiddleware, async (req, res) => {
  try {
    // Get claims that need community verification
    const claims = await Claim.find({
      status: 'pending',
      aiVerified: true
    })
    .limit(10)
    .sort({ createdAt: -1 });

    // Get vote counts for each claim
    const claimsWithVotes = await Promise.all(
      claims.map(async (claim) => {
        const votes = await CommunityVote.find({ claimId: claim._id });
        
        const voteCounts = {
          true: 0,
          false: 0,
          misleading: 0,
          unverified: 0
        };

        let totalConfidence = 0;
        votes.forEach(vote => {
          voteCounts[vote.vote]++;
          totalConfidence += vote.confidence * vote.weight;
        });

        const avgConfidence = votes.length > 0 ? totalConfidence / votes.length : 0;

        return {
          id: claim._id,
          claim: claim.text,
          status: claim.status,
          votes: voteCounts,
          confidence: avgConfidence,
          totalVotes: votes.length
        };
      })
    );

    res.json(claimsWithVotes);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Submit community vote
router.post('/community/vote', authMiddleware, async (req, res) => {
  try {
    const { claimId, vote, confidence, evidence } = req.body;

    // Get user to calculate vote weight based on credibility
    const user = await User.findById(req.userId);
    if (!user) {
      return res.status(404).json({ error: 'User not found' });
    }

    // Calculate vote weight based on credibility score
    const weight = 1 + (user.credibilityScore / 100);

    // Create or update vote
    const communityVote = await CommunityVote.findOneAndUpdate(
      { claimId, userId: req.userId },
      {
        vote,
        confidence: confidence || 0.5,
        evidence,
        weight
      },
      { upsert: true, new: true }
    );

    // Update user stats
    user.stats.verificationsSubmitted++;
    await user.save();

    // Recalculate claim confidence based on community votes
    await updateClaimConfidence(claimId);

    res.json({ message: 'Vote submitted', vote: communityVote });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Helper function to update claim confidence
async function updateClaimConfidence(claimId) {
  const votes = await CommunityVote.find({ claimId }).populate('userId');
  
  if (votes.length === 0) return;

  let weightedSum = 0;
  let totalWeight = 0;

  votes.forEach(vote => {
    weightedSum += vote.confidence * vote.weight;
    totalWeight += vote.weight;
  });

  const newConfidence = weightedSum / totalWeight;

  await Claim.findByIdAndUpdate(claimId, {
    communityConfidence: newConfidence,
    communityVoteCount: votes.length
  });
}

// ===== DAILY BRIEF ROUTES =====

// Get user's daily brief
router.get('/brief/today', authMiddleware, async (req, res) => {
  try {
    const today = new Date();
    today.setHours(0, 0, 0, 0);

    let brief = await DailyBrief.findOne({
      userId: req.userId,
      date: { $gte: today }
    }).populate('topMisinformation.claimId');

    if (!brief) {
      // Generate brief if not exists
      brief = await generateDailyBrief(req.userId);
    }

    res.json(brief);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Get watchlist alerts
router.get('/watchlist/alerts', authMiddleware, async (req, res) => {
  try {
    const user = await User.findById(req.userId);
    if (!user || !user.watchlist || user.watchlist.length === 0) {
      return res.json([]);
    }

    // Find claims matching watchlist topics
    const alerts = [];
    for (const watchItem of user.watchlist) {
      const claims = await Claim.find({
        category: watchItem.topic,
        verdict: { $in: ['false', 'misleading'] },
        createdAt: { $gte: watchItem.addedAt }
      })
      .sort({ createdAt: -1 })
      .limit(5);

      claims.forEach(claim => {
        alerts.push({
          topic: watchItem.topic,
          claimText: claim.text,
          verdict: claim.verdict,
          timestamp: claim.createdAt
        });
      });
    }

    res.json(alerts);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Add topic to watchlist
router.post('/watchlist', authMiddleware, async (req, res) => {
  try {
    const { topic, keywords } = req.body;

    const user = await User.findByIdAndUpdate(
      req.userId,
      {
        $push: {
          watchlist: {
            topic,
            keywords: keywords || [],
            addedAt: new Date()
          }
        }
      },
      { new: true }
    );

    res.json({ message: 'Topic added to watchlist', watchlist: user.watchlist });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// ===== GAMIFIED PROFILE ROUTES =====

// Get user profile with achievements
router.get('/profile', authMiddleware, async (req, res) => {
  try {
    const user = await User.findById(req.userId).select('-password');
    const achievements = await UserAchievement.find({ userId: req.userId })
      .sort({ earnedAt: -1 });

    // Calculate accuracy
    const accuracy = user.stats.verificationsSubmitted > 0
      ? (user.stats.correctVerifications / user.stats.verificationsSubmitted) * 100
      : 0;

    res.json({
      user,
      achievements,
      stats: {
        ...user.stats,
        accuracy: accuracy.toFixed(1)
      }
    });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Get user achievements
router.get('/achievements', authMiddleware, async (req, res) => {
  try {
    const achievements = await UserAchievement.find({ userId: req.userId })
      .sort({ earnedAt: -1 });

    res.json(achievements);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Helper function to generate daily brief
async function generateDailyBrief(userId) {
  const user = await User.findById(userId);
  const today = new Date();
  today.setHours(0, 0, 0, 0);

  // Get top misinformation from user's topics
  const topics = user.preferences.topics || ['health', 'politics', 'science'];
  const topClaims = await Claim.find({
    category: { $in: topics },
    verdict: { $in: ['false', 'misleading'] },
    createdAt: { $gte: today }
  })
  .sort({ views: -1 })
  .limit(5);

  // Get watchlist alerts
  const watchlistAlerts = [];
  if (user.watchlist && user.watchlist.length > 0) {
    for (const watchItem of user.watchlist) {
      const claims = await Claim.find({
        category: watchItem.topic,
        verdict: { $in: ['false', 'misleading'] },
        createdAt: { $gte: today }
      }).limit(3);

      claims.forEach(claim => {
        watchlistAlerts.push({
          topic: watchItem.topic,
          claimText: claim.text,
          timestamp: claim.createdAt
        });
      });
    }
  }

  const summary = `Daily Brief for ${today.toDateString()}: ${topClaims.length} new misinformation claims detected in your topics of interest.`;

  const brief = new DailyBrief({
    userId,
    date: today,
    summary,
    topMisinformation: topClaims.map(claim => ({
      claimId: claim._id,
      text: claim.text,
      category: claim.category,
      severity: claim.confidence < 0.5 ? 'high' : 'medium'
    })),
    watchlistAlerts
  });

  await brief.save();
  return brief;
}

module.exports = router;
