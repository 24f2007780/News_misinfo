const express = require('express');
const Claim = require('../models/Claim');
const CommunityVote = require('../models/CommunityVote');
const User = require('../models/User');
const { authenticateToken } = require('./auth');

const router = express.Router();

// Get all claims available for community voting
router.get('/claims', async (req, res) => {
  try {
    const { page = 1, limit = 20, category, status, userId } = req.query;
    
    // Build query
    const query = {};
    if (category && category !== 'all') query.category = category;
    if (status && status !== 'all') query.verificationStatus = status;
    
    // Get claims with community vote data
    const claims = await Claim.aggregate([
      { $match: query },
      {
        $lookup: {
          from: 'communityvotes',
          localField: '_id',
          foreignField: 'claimId',
          as: 'communityVotes'
        }
      },
      {
        $addFields: {
          totalVotes: { $size: '$communityVotes' },
          trueVotes: {
            $size: {
              $filter: {
                input: '$communityVotes',
                cond: { $eq: ['$$this.vote', 'true'] }
              }
            }
          },
          falseVotes: {
            $size: {
              $filter: {
                input: '$communityVotes',
                cond: { $eq: ['$$this.vote', 'false'] }
              }
            }
          },
          misleadingVotes: {
            $size: {
              $filter: {
                input: '$communityVotes',
                cond: { $eq: ['$$this.vote', 'misleading'] }
              }
            }
          },
          unverifiedVotes: {
            $size: {
              $filter: {
                input: '$communityVotes',
                cond: { $eq: ['$$this.vote', 'unverified'] }
              }
            }
          },
          averageConfidence: {
            $cond: {
              if: { $gt: [{ $size: '$communityVotes' }, 0] },
              then: { $avg: '$communityVotes.confidence' },
              else: 0
            }
          },
          userVote: {
            $cond: {
              if: userId,
              then: {
                $arrayElemAt: [
                  {
                    $filter: {
                      input: '$communityVotes',
                      cond: { $eq: ['$$this.userId', { $toObjectId: userId }] }
                    }
                  },
                  0
                ]
              },
              else: null
            }
          }
        }
      },
      {
        $project: {
          communityVotes: 0 // Remove detailed votes for privacy
        }
      },
      { $sort: { createdAt: -1 } },
      { $skip: (parseInt(page) - 1) * parseInt(limit) },
      { $limit: parseInt(limit) }
    ]);

    const total = await Claim.countDocuments(query);

    res.json({
      claims,
      pagination: {
        page: parseInt(page),
        limit: parseInt(limit),
        total,
        pages: Math.ceil(total / parseInt(limit))
      }
    });
  } catch (error) {
    console.error('Community claims error:', error);
    res.status(500).json({ error: error.message });
  }
});

// Submit a community vote
router.post('/vote', async (req, res) => {
  try {
    const { claimId, vote, confidence = 0.5, evidence, userId } = req.body;

    if (!claimId || !vote || !userId) {
      return res.status(400).json({ error: 'Missing required fields' });
    }

    if (!['true', 'false', 'misleading', 'unverified'].includes(vote)) {
      return res.status(400).json({ error: 'Invalid vote value' });
    }

    // Check if claim exists
    const claim = await Claim.findById(claimId);
    if (!claim) {
      return res.status(404).json({ error: 'Claim not found' });
    }

    // Get user for weight calculation
    const user = await User.findById(userId);
    if (!user) {
      return res.status(404).json({ error: 'User not found' });
    }

    // Calculate vote weight based on user credibility
    const weight = 1 + (user.credibilityScore || 0) / 100;

    // Check if user already voted
    const existingVote = await CommunityVote.findOne({ claimId, userId });
    
    if (existingVote) {
      // Update existing vote
      existingVote.vote = vote;
      existingVote.confidence = confidence;
      existingVote.evidence = evidence;
      existingVote.weight = weight;
      await existingVote.save();
      
      console.log(`🔄 Updated vote for claim ${claimId} by user ${userId}: ${vote}`);
    } else {
      // Create new vote
      await CommunityVote.create({
        claimId,
        userId,
        vote,
        confidence,
        evidence,
        weight
      });
      
      console.log(`✅ New vote for claim ${claimId} by user ${userId}: ${vote}`);
      
      // Update user stats
      if (user.stats) {
        user.stats.verificationsSubmitted = (user.stats.verificationsSubmitted || 0) + 1;
        await user.save();
      }
    }

    // Recalculate community consensus
    await updateCommunityConsensus(claimId);

    res.json({ 
      message: 'Vote submitted successfully',
      weight: weight.toFixed(2)
    });
  } catch (error) {
    console.error('Community vote error:', error);
    res.status(500).json({ error: error.message });
  }
});

// Get community statistics
router.get('/stats', async (req, res) => {
  try {
    const [
      totalVotes,
      totalVoters,
      claimsWithVotes,
      recentVotes
    ] = await Promise.all([
      CommunityVote.countDocuments(),
      CommunityVote.distinct('userId').then(users => users.length),
      CommunityVote.distinct('claimId').then(claims => claims.length),
      CommunityVote.countDocuments({
        createdAt: { $gte: new Date(Date.now() - 24 * 60 * 60 * 1000) }
      })
    ]);

    // Get vote distribution
    const voteDistribution = await CommunityVote.aggregate([
      {
        $group: {
          _id: '$vote',
          count: { $sum: 1 },
          avgConfidence: { $avg: '$confidence' }
        }
      }
    ]);

    // Get top contributors
    const topContributors = await CommunityVote.aggregate([
      {
        $group: {
          _id: '$userId',
          voteCount: { $sum: 1 },
          avgConfidence: { $avg: '$confidence' }
        }
      },
      {
        $lookup: {
          from: 'users',
          localField: '_id',
          foreignField: '_id',
          as: 'user'
        }
      },
      {
        $unwind: '$user'
      },
      {
        $project: {
          name: '$user.name',
          voteCount: 1,
          avgConfidence: 1,
          credibilityScore: '$user.credibilityScore'
        }
      },
      { $sort: { voteCount: -1 } },
      { $limit: 10 }
    ]);

    res.json({
      totalVotes,
      totalVoters,
      claimsWithVotes,
      recentVotes,
      voteDistribution,
      topContributors
    });
  } catch (error) {
    console.error('Community stats error:', error);
    res.status(500).json({ error: error.message });
  }
});

// Get community leaderboard
router.get('/leaderboard', async (req, res) => {
  try {
    const leaderboard = await CommunityVote.aggregate([
      {
        $group: {
          _id: '$userId',
          totalVotes: { $sum: 1 },
          avgConfidence: { $avg: '$confidence' },
          totalWeight: { $sum: '$weight' }
        }
      },
      {
        $lookup: {
          from: 'users',
          localField: '_id',
          foreignField: '_id',
          as: 'user'
        }
      },
      {
        $unwind: '$user'
      },
      {
        $project: {
          name: '$user.name',
          level: '$user.level',
          credibilityScore: '$user.credibilityScore',
          totalVotes: 1,
          avgConfidence: 1,
          totalWeight: 1,
          score: {
            $multiply: [
              '$totalVotes',
              { $add: [1, { $divide: ['$user.credibilityScore', 100] }] }
            ]
          }
        }
      },
      { $sort: { score: -1 } },
      { $limit: 20 }
    ]);

    res.json(leaderboard);
  } catch (error) {
    console.error('Leaderboard error:', error);
    res.status(500).json({ error: error.message });
  }
});

// Get user's voting history
router.get('/user/:userId/votes', async (req, res) => {
  try {
    const { userId } = req.params;
    const { page = 1, limit = 10 } = req.query;

    const votes = await CommunityVote.find({ userId })
      .populate('claimId', 'text category verdict confidence')
      .sort({ createdAt: -1 })
      .skip((parseInt(page) - 1) * parseInt(limit))
      .limit(parseInt(limit));

    const total = await CommunityVote.countDocuments({ userId });

    res.json({
      votes,
      pagination: {
        page: parseInt(page),
        limit: parseInt(limit),
        total,
        pages: Math.ceil(total / parseInt(limit))
      }
    });
  } catch (error) {
    console.error('User votes error:', error);
    res.status(500).json({ error: error.message });
  }
});

// Helper function to update community consensus
async function updateCommunityConsensus(claimId) {
  try {
    const votes = await CommunityVote.find({ claimId });
    
    if (votes.length === 0) return;

    // Calculate weighted votes
    const weightedVotes = {
      true: 0,
      false: 0,
      misleading: 0,
      unverified: 0
    };

    let totalWeight = 0;
    let totalConfidence = 0;

    votes.forEach(vote => {
      const weight = vote.weight || 1;
      weightedVotes[vote.vote] += weight;
      totalWeight += weight;
      totalConfidence += vote.confidence * weight;
    });

    // Determine community consensus
    const maxVote = Object.keys(weightedVotes).reduce((a, b) => 
      weightedVotes[a] > weightedVotes[b] ? a : b
    );

    const consensusStrength = weightedVotes[maxVote] / totalWeight;
    const avgConfidence = totalConfidence / totalWeight;

    // Update claim if community consensus is strong enough (>60% agreement)
    if (consensusStrength > 0.6 && votes.length >= 3) {
      const claim = await Claim.findById(claimId);
      if (claim && claim.verificationStatus !== 'verified') {
        claim.communityVerdict = maxVote;
        claim.communityConfidence = avgConfidence;
        claim.communityConsensus = consensusStrength;
        await claim.save();
        
        console.log(`🏛️ Community consensus reached for claim ${claimId}: ${maxVote} (${(consensusStrength * 100).toFixed(1)}%)`);
      }
    }
  } catch (error) {
    console.error('Error updating community consensus:', error);
  }
}

module.exports = router;
