const CommunityVote = require('../models/CommunityVote');
const Claim = require('../models/Claim');
const User = require('../models/User');
const mongoose = require('mongoose');

async function seedCommunityVotes() {
  try {
    console.log('🗳️ Seeding community votes...');
    
    // Check if already connected, if not connect
    if (mongoose.connection.readyState !== 1) {
      await mongoose.connect(process.env.MONGODB_URI || 'mongodb://localhost:27017/misinformation-platform');
      console.log('✅ Connected to MongoDB for community votes seeding');
    }
    
    // Get some claims and users
    const claims = await Claim.find().limit(10);
    const users = await User.find().limit(5);
    
    if (claims.length === 0 || users.length === 0) {
      console.log('❌ No claims or users found. Please seed claims and users first.');
      return;
    }
    
    // Check if votes already exist
    const existingVotes = await CommunityVote.countDocuments();
    if (existingVotes > 0) {
      console.log(`📊 Found ${existingVotes} existing community votes. Skipping seed.`);
      return;
    }
    
    console.log('🗑️ No existing community votes found, proceeding with seeding...');
    
    const sampleVotes = [];
    
    // Create diverse voting patterns
    const usedCombinations = new Set(); // Track user-claim combinations to avoid duplicates
    
    claims.forEach((claim, claimIndex) => {
      // Each claim gets 3-5 votes from different users (reduced to avoid duplicates)
      const numVotes = Math.min(Math.floor(Math.random() * 3) + 3, users.length);
      const shuffledUsers = [...users].sort(() => Math.random() - 0.5); // Shuffle users
      const votingUsers = shuffledUsers.slice(0, numVotes);
      
      votingUsers.forEach((user, userIndex) => {
        const combination = `${claim._id}-${user._id}`;
        if (usedCombinations.has(combination)) {
          return; // Skip if this user already voted on this claim
        }
        usedCombinations.add(combination);
        // Create realistic voting patterns based on claim content
        let vote = 'unverified';
        let confidence = 0.5;
        
        // Simulate realistic voting based on claim keywords
        const claimText = claim.text.toLowerCase();
        
        if (claimText.includes('vaccine') || claimText.includes('covid')) {
          // COVID/vaccine claims tend to get more false votes
          const rand = Math.random();
          if (rand < 0.6) vote = 'false';
          else if (rand < 0.8) vote = 'misleading';
          else vote = 'true';
          confidence = 0.7 + Math.random() * 0.25;
        } else if (claimText.includes('climate') || claimText.includes('global warming')) {
          // Climate claims
          const rand = Math.random();
          if (rand < 0.7) vote = 'false';
          else if (rand < 0.9) vote = 'true';
          else vote = 'misleading';
          confidence = 0.8 + Math.random() * 0.2;
        } else if (claimText.includes('election') || claimText.includes('voting')) {
          // Election claims
          const rand = Math.random();
          if (rand < 0.8) vote = 'false';
          else vote = 'misleading';
          confidence = 0.6 + Math.random() * 0.3;
        } else if (claimText.includes('5g') || claimText.includes('technology')) {
          // Technology claims
          const rand = Math.random();
          if (rand < 0.75) vote = 'false';
          else if (rand < 0.9) vote = 'misleading';
          else vote = 'unverified';
          confidence = 0.65 + Math.random() * 0.3;
        } else {
          // General claims - more diverse voting
          const votes = ['true', 'false', 'misleading', 'unverified'];
          vote = votes[Math.floor(Math.random() * votes.length)];
          confidence = 0.4 + Math.random() * 0.5;
        }
        
        // Add some user-specific bias
        if (user.credibilityScore > 80) {
          confidence = Math.min(0.95, confidence + 0.1);
        }
        
        // Calculate weight based on user credibility
        const weight = 1 + (user.credibilityScore || 0) / 100;
        
        // Create evidence text
        const evidenceOptions = [
          'Based on my research and fact-checking sources',
          'I found contradictory evidence from reliable sources',
          'Multiple fact-checkers have verified this claim',
          'This appears to be misleading based on context',
          'No credible sources support this claim',
          'The claim lacks sufficient evidence',
          'Scientific consensus contradicts this statement',
          'Official sources have debunked this claim'
        ];
        
        const evidence = Math.random() > 0.3 ? evidenceOptions[Math.floor(Math.random() * evidenceOptions.length)] : '';
        
        sampleVotes.push({
          claimId: claim._id,
          userId: user._id,
          vote,
          confidence,
          evidence,
          weight,
          createdAt: new Date(Date.now() - Math.random() * 7 * 24 * 60 * 60 * 1000) // Random date within last week
        });
      });
    });
    
    // Insert votes with error handling
    if (sampleVotes.length > 0) {
      try {
        await CommunityVote.insertMany(sampleVotes, { ordered: false }); // Continue on duplicates
        console.log(`✅ Created ${sampleVotes.length} community votes`);
      } catch (error) {
        if (error.code === 11000) {
          console.log(`⚠️ Some duplicate votes skipped. Created ${sampleVotes.length - (error.result?.writeErrors?.length || 0)} votes`);
        } else {
          throw error;
        }
      }
    } else {
      console.log('⚠️ No votes to insert');
    }
    
    // Update user stats
    for (const user of users) {
      const userVoteCount = sampleVotes.filter(v => v.userId.toString() === user._id.toString()).length;
      if (!user.stats) user.stats = {};
      user.stats.verificationsSubmitted = (user.stats.verificationsSubmitted || 0) + userVoteCount;
      await user.save();
    }
    console.log('✅ Updated user statistics');
    
    // Calculate community consensus for claims
    console.log('🏛️ Calculating community consensus...');
    for (const claim of claims) {
      const votes = await CommunityVote.find({ claimId: claim._id });
      
      if (votes.length >= 3) {
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
        
        const maxVote = Object.keys(weightedVotes).reduce((a, b) => 
          weightedVotes[a] > weightedVotes[b] ? a : b
        );
        
        const consensusStrength = weightedVotes[maxVote] / totalWeight;
        const avgConfidence = totalConfidence / totalWeight;
        
        if (consensusStrength > 0.6) {
          claim.communityVerdict = maxVote;
          claim.communityConfidence = avgConfidence;
          claim.communityConsensus = consensusStrength;
          await claim.save();
          
          console.log(`  - Claim "${claim.text.substring(0, 50)}...": ${maxVote} (${(consensusStrength * 100).toFixed(1)}%)`);
        }
      }
    }
    
    console.log('✅ Community votes seeding completed successfully!');
    console.log(`📊 Total votes: ${sampleVotes.length}`);
    console.log(`📊 Claims with votes: ${claims.length}`);
    console.log(`📊 Participating users: ${users.length}`);
    
  } catch (error) {
    console.error('❌ Error seeding community votes:', error);
    throw error; // Re-throw to let caller handle
  } finally {
    // Only disconnect if we connected in this function
    if (mongoose.connection.readyState === 1 && require.main === module) {
      await mongoose.disconnect();
    }
  }
}

// Run if called directly
if (require.main === module) {
  seedCommunityVotes();
}

module.exports = seedCommunityVotes;
