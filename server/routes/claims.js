const express = require('express');
const Claim = require('../models/Claim');
const { authenticateToken } = require('./auth');
const AgentOrchestrator = require('../services/AgentOrchestrator');
const WebScrapingService = require('../services/WebScrapingService');
const EnhancedVerificationService = require('../services/EnhancedVerificationService');

const router = express.Router();

// Get recent claims (most recently entered by users)
router.get('/recent', async (req, res) => {
  try {
    const { limit = 5 } = req.query;
    
    console.log('🔍 Fetching recent claims from database...');
    
    const recentClaims = await Claim.find({})
      .sort({ createdAt: -1 }) // Most recent first
      .limit(parseInt(limit))
      .select('text verdict confidence createdAt category verificationStatus')
      .lean();

    console.log(`📋 Database query completed. Found ${recentClaims.length} claims`);
    
    if (recentClaims.length > 0) {
      console.log('Recent claims details:', recentClaims.map(c => ({
        id: c._id,
        text: c.text?.substring(0, 50) + '...',
        verdict: c.verdict,
        createdAt: c.createdAt,
        category: c.category
      })));
    } else {
      console.log('⚠️ No claims found in database');
      
      // If no claims in database, create some sample data for testing
      console.log('🔄 Creating sample claims for testing...');
      const sampleClaims = [
        {
          text: "Vaccines cause autism",
          verdict: "refuted",
          confidence: 0.95,
          category: "health_medicine",
          verificationStatus: "verified",
          createdAt: new Date(Date.now() - 1000 * 60 * 5) // 5 minutes ago
        },
        {
          text: "The Earth revolves around the Sun",
          verdict: "supported",
          confidence: 0.98,
          category: "science_technology", 
          verificationStatus: "verified",
          createdAt: new Date(Date.now() - 1000 * 60 * 10) // 10 minutes ago
        },
        {
          text: "Climate change is caused entirely by natural cycles, not humans",
          verdict: "refuted",
          confidence: 0.83,
          category: "environment_climate",
          verificationStatus: "verified", 
          createdAt: new Date(Date.now() - 1000 * 60 * 2) // 2 minutes ago
        }
      ];
      
      try {
        await Claim.insertMany(sampleClaims);
        console.log('✅ Sample claims created');
        
        // Fetch again after creating samples
        const newRecentClaims = await Claim.find({})
          .sort({ createdAt: -1 })
          .limit(parseInt(limit))
          .select('text verdict confidence createdAt category verificationStatus')
          .lean();
          
        return res.json(newRecentClaims);
      } catch (sampleError) {
        console.error('❌ Failed to create sample claims:', sampleError);
      }
    }

    res.json(recentClaims);
  } catch (error) {
    console.error('❌ Failed to fetch recent claims:', error);
    res.status(500).json({ error: error.message });
  }
});

// Get all claims with filters
router.get('/', async (req, res) => {
  try {
    const {
      status,
      verdict,
      category,
      language,
      page = 1,
      limit = 20,
      sort = '-createdAt'
    } = req.query;

    const query = {};
    if (status) query.verificationStatus = status;
    if (verdict) query.verdict = verdict;
    if (category) query.category = category;
    if (language) query.language = language;

    const claims = await Claim.find(query)
      .sort(sort)
      .limit(parseInt(limit))
      .skip((parseInt(page) - 1) * parseInt(limit))
      .populate('clusterId', 'name description');

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
    res.status(500).json({ error: error.message });
  }
});

// Get single claim
router.get('/:id', async (req, res) => {
  try {
    const claim = await Claim.findById(req.params.id)
      .populate('clusterId')
      .populate('relatedClaims')
      .populate('verifiedBy', 'name email');

    if (!claim) {
      return res.status(404).json({ error: 'Claim not found' });
    }

    res.json(claim);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Submit new claim for verification
router.post('/', async (req, res) => {
  try {
    const { text, source } = req.body;

    if (!text) {
      return res.status(400).json({ error: 'Claim text is required' });
    }

    // Process claim through agent orchestrator
    const result = await AgentOrchestrator.verifyClaim(text);
    res.json(result);
  } catch (error) {
    console.error('Claim submission error:', error);
    res.status(500).json({ error: error.message });
  }
});

// Quick verify endpoint with web scraping
router.post('/quick-verify', async (req, res) => {
  try {
    const { text } = req.body;

    if (!text) {
      return res.status(400).json({ error: 'Text is required' });
    }

    console.log('🔍 Quick verify request:', text.substring(0, 50) + '...');
    
    // Search database for similar claims first (exact match)
    let existingClaim = await Claim.findOne({
      text: new RegExp(text.trim(), 'i')
    });
    
    // If no exact match, try fuzzy matching for key terms
    if (!existingClaim) {
      const keyTerms = text.toLowerCase().split(' ').filter(word => word.length > 3);
      if (keyTerms.length > 0) {
        // Create regex pattern for key terms
        const pattern = keyTerms.slice(0, 3).join('|');
        existingClaim = await Claim.findOne({
          text: new RegExp(pattern, 'i'),
          verificationStatus: 'verified'
        });
      }
    }
    
    if (existingClaim && existingClaim.verdict !== 'unverified') {
      console.log('✅ Found existing verified claim in database');
      
      // Update view count
      existingClaim.metrics.views += 1;
      await existingClaim.save();
      
      return res.json({
        verdict: existingClaim.verdict,
        confidence: existingClaim.confidence,
        explanation: existingClaim.explanation,
        evidence: existingClaim.evidence,
        source: 'database',
        claimId: existingClaim._id,
        webScrapingData: existingClaim.webScrapingData
      });
    }
    
    // If not found or unverified, perform enhanced verification
    console.log('🚀 Starting enhanced verification (web scraping + AI)...');
    
    let verificationResult = null;
    let claimToUpdate = existingClaim;
    
    try {
      // Use enhanced verification service
      verificationResult = await EnhancedVerificationService.verifyClaim(text);
      console.log('✅ Enhanced verification completed successfully');
    } catch (verificationError) {
      console.warn('⚠️ Enhanced verification failed:', verificationError.message);
      // Fallback to basic web scraping
      try {
        verificationResult = await WebScrapingService.verifyClaim(text);
        console.log('✅ Fallback web scraping completed');
      } catch (fallbackError) {
        console.warn('⚠️ All verification methods failed:', fallbackError.message);
      }
    }
    
    // If no existing claim, create new one
    if (!claimToUpdate) {
      console.log('💾 Creating new claim with web scraping data...');
      
      const detectLanguage = (text) => {
        const hindiPattern = /[\u0900-\u097F]/;
        const arabicPattern = /[\u0600-\u06FF]/;
        const chinesePattern = /[\u4E00-\u9FFF]/;
        if (hindiPattern.test(text)) return 'hi';
        if (arabicPattern.test(text)) return 'ar';
        if (chinesePattern.test(text)) return 'zh';
        return 'en';
      };
      
      claimToUpdate = await Claim.create({
        text: text,
        originalText: text,
        verificationStatus: verificationResult ? 'verified' : 'pending',
        verdict: verificationResult ? verificationResult.verdict : 'unverified',
        confidence: verificationResult ? verificationResult.confidence : 0,
        category: 'other',
        language: detectLanguage(text),
        source: {
          type: 'user-submission',
          platform: 'web'
        },
        explanation: verificationResult ? verificationResult.explanation : undefined,
        evidence: verificationResult ? verificationResult.evidence.map(e => ({
          source: e.source,
          url: e.url,
          title: e.title,
          snippet: e.snippet,
          credibility: e.relevanceScore || 0.5,
          stance: e.verdict === 'false' ? 'refutes' : e.verdict === 'true' ? 'supports' : 'neutral',
          addedAt: new Date(),
          relevanceScore: e.relevanceScore,
          verdict: e.verdict,
          rating: e.rating,
          scrapedAt: e.scrapedAt || new Date(),
          factCheckingSite: e.factCheckingSite || e.source,
          content: e.content
        })) : [],
        webScrapingData: verificationResult?.scrapingSummary ? {
          lastScraped: new Date(),
          sitesSearched: verificationResult.scrapingSummary.sitesSearched,
          resultsFound: verificationResult.scrapingSummary.resultsFound,
          topRelevanceScore: Math.max(...verificationResult.evidence.map(e => e.relevanceScore || 0)),
          scrapingEnabled: true,
          scrapingHistory: [{
            timestamp: new Date(),
            sitesSearched: verificationResult.scrapingSummary.sitesSearched,
            resultsFound: verificationResult.scrapingSummary.resultsFound,
            topVerdict: verificationResult.verdict
          }]
        } : undefined,
        aiAnalysis: verificationResult?.aiAnalysis ? {
          provider: verificationResult.aiAnalysis.provider,
          verdict: verificationResult.aiAnalysis.verdict,
          confidence: verificationResult.aiAnalysis.confidence,
          reasoning: verificationResult.aiAnalysis.reasoning,
          analyzedAt: new Date()
        } : undefined
      });
    } else {
      // Update existing claim with verification data
      console.log('🔄 Updating existing claim with verification data...');
      
      if (verificationResult) {
        claimToUpdate.verdict = verificationResult.verdict;
        claimToUpdate.confidence = verificationResult.confidence;
        claimToUpdate.verificationStatus = 'verified';
        claimToUpdate.explanation = verificationResult.explanation;
        
        // Add new evidence from verification
        const newEvidence = verificationResult.evidence.map(e => ({
          source: e.source,
          url: e.url,
          title: e.title,
          snippet: e.snippet,
          credibility: e.relevanceScore || 0.5,
          stance: e.verdict === 'false' ? 'refutes' : e.verdict === 'true' ? 'supports' : 'neutral',
          addedAt: new Date(),
          relevanceScore: e.relevanceScore,
          verdict: e.verdict,
          rating: e.rating,
          scrapedAt: e.scrapedAt || new Date(),
          factCheckingSite: e.factCheckingSite || e.source,
          content: e.content
        }));
        
        claimToUpdate.evidence = [...(claimToUpdate.evidence || []), ...newEvidence];
        
        // Update web scraping metadata if available
        if (verificationResult.scrapingSummary) {
          claimToUpdate.webScrapingData = {
            lastScraped: new Date(),
            sitesSearched: verificationResult.scrapingSummary.sitesSearched,
            resultsFound: verificationResult.scrapingSummary.resultsFound,
            topRelevanceScore: Math.max(...verificationResult.evidence.map(e => e.relevanceScore || 0)),
            scrapingEnabled: true,
            scrapingHistory: [
              ...(claimToUpdate.webScrapingData?.scrapingHistory || []),
              {
                timestamp: new Date(),
                sitesSearched: verificationResult.scrapingSummary.sitesSearched,
                resultsFound: verificationResult.scrapingSummary.resultsFound,
                topVerdict: verificationResult.verdict
              }
            ]
          };
        }
        
        // Update AI analysis metadata if available
        if (verificationResult.aiAnalysis) {
          claimToUpdate.aiAnalysis = {
            provider: verificationResult.aiAnalysis.provider,
            verdict: verificationResult.aiAnalysis.verdict,
            confidence: verificationResult.aiAnalysis.confidence,
            reasoning: verificationResult.aiAnalysis.reasoning,
            analyzedAt: new Date()
          };
        }
      }
      
      claimToUpdate.metrics.views += 1;
      await claimToUpdate.save();
    }
    
    // Use explanation from verification result or generate fallback
    const explanation = verificationResult?.explanation || {
      short: 'Claim submitted! We\'re checking this for you.',
      medium: 'This claim has been added to our database and is pending verification. Check back later for results.',
      long: 'Your claim has been successfully submitted and saved. Our fact-checking team will review it soon.',
      eli5: 'We got your claim! We\'ll check if it\'s true or false and let you know!'
    };
    
    console.log('✅ Claim verification completed with ID:', claimToUpdate._id);
    
    res.json({
      verdict: claimToUpdate.verdict,
      confidence: claimToUpdate.confidence,
      explanation: explanation,
      evidence: claimToUpdate.evidence || [],
      source: verificationResult?.source || 'new-submission',
      claimId: claimToUpdate._id,
      webScrapingData: claimToUpdate.webScrapingData,
      scrapingSummary: verificationResult?.scrapingSummary,
      aiAnalysis: verificationResult?.aiAnalysis
    });
  } catch (error) {
    console.error('❌ Quick verify error:', error.message);
    console.error('Full error:', error);
    
    let errorMessage = error.message;
    if (error.message.includes('not configured')) {
      errorMessage = 'AI service not configured. Please add GEMINI_API_KEY or OPENAI_API_KEY to your .env file.';
    }
    
    res.status(500).json({ 
      error: errorMessage,
      details: 'Check server logs for more information'
    });
  }
});

// Update claim (admin/fact-checker only)
router.patch('/:id', authenticateToken, async (req, res) => {
  try {
    const { verdict, explanation, evidence } = req.body;

    const claim = await Claim.findById(req.params.id);
    if (!claim) {
      return res.status(404).json({ error: 'Claim not found' });
    }

    if (verdict) claim.verdict = verdict;
    if (explanation) claim.explanation = explanation;
    if (evidence) claim.evidence = evidence;

    claim.verifiedBy = req.user.userId;
    claim.verifiedAt = new Date();
    claim.verificationStatus = 'verified';

    await claim.save();

    res.json(claim);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Get trending claims
router.get('/trending/now', async (req, res) => {
  try {
    const last24Hours = new Date();
    last24Hours.setHours(last24Hours.getHours() - 24);

    const trending = await Claim.find({
      createdAt: { $gte: last24Hours },
      'flags.viral': true
    })
      .sort({ 'metrics.views': -1 })
      .limit(10);

    res.json(trending);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Search claims
router.get('/search/query', async (req, res) => {
  try {
    const { q } = req.query;

    if (!q) {
      return res.status(400).json({ error: 'Search query required' });
    }

    const claims = await Claim.find({
      $text: { $search: q }
    })
      .limit(20);

    res.json(claims);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Manual web scraping endpoint for admin
router.post('/:id/scrape', authenticateToken, async (req, res) => {
  try {
    const claim = await Claim.findById(req.params.id);
    if (!claim) {
      return res.status(404).json({ error: 'Claim not found' });
    }

    console.log(`🌐 Manual web scraping requested for claim: ${claim.text.substring(0, 50)}...`);
    
    const webScrapingResult = await WebScrapingService.verifyClaim(claim.text);
    
    // Update claim with new web scraping data
    claim.evidence = [...(claim.evidence || []), ...webScrapingResult.evidence.map(e => ({
      source: e.source,
      url: e.url,
      title: e.title,
      snippet: e.snippet,
      credibility: e.relevanceScore || 0.5,
      stance: e.verdict === 'false' ? 'refutes' : e.verdict === 'true' ? 'supports' : 'neutral',
      addedAt: new Date(),
      relevanceScore: e.relevanceScore,
      verdict: e.verdict,
      rating: e.rating,
      scrapedAt: e.scrapedAt,
      factCheckingSite: e.source,
      content: e.content
    }))];
    
    // Update web scraping metadata
    claim.webScrapingData = {
      lastScraped: new Date(),
      sitesSearched: webScrapingResult.scrapingSummary.sitesSearched,
      resultsFound: webScrapingResult.scrapingSummary.resultsFound,
      topRelevanceScore: Math.max(...webScrapingResult.evidence.map(e => e.relevanceScore || 0)),
      scrapingEnabled: true,
      scrapingHistory: [
        ...(claim.webScrapingData?.scrapingHistory || []),
        {
          timestamp: new Date(),
          sitesSearched: webScrapingResult.scrapingSummary.sitesSearched,
          resultsFound: webScrapingResult.scrapingSummary.resultsFound,
          topVerdict: webScrapingResult.verdict
        }
      ]
    };
    
    // Update verdict if web scraping provides better confidence
    if (webScrapingResult.confidence > claim.confidence) {
      claim.verdict = webScrapingResult.verdict;
      claim.confidence = webScrapingResult.confidence;
      claim.verificationStatus = 'verified';
    }
    
    await claim.save();
    
    res.json({
      message: 'Web scraping completed successfully',
      claim,
      scrapingResult: webScrapingResult
    });
  } catch (error) {
    console.error('❌ Manual web scraping error:', error);
    res.status(500).json({ error: error.message });
  }
});

// Get web scraping statistics
router.get('/scraping/stats', async (req, res) => {
  try {
    const stats = WebScrapingService.getScrapingStats();
    
    // Get database statistics
    const totalClaims = await Claim.countDocuments();
    const scrapedClaims = await Claim.countDocuments({ 'webScrapingData.lastScraped': { $exists: true } });
    const recentlyScrapped = await Claim.countDocuments({
      'webScrapingData.lastScraped': { $gte: new Date(Date.now() - 24 * 60 * 60 * 1000) }
    });
    
    res.json({
      ...stats,
      database: {
        totalClaims,
        scrapedClaims,
        scrapingCoverage: ((scrapedClaims / totalClaims) * 100).toFixed(1) + '%',
        recentlyScrapped
      }
    });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Test specific claim verification
router.post('/test-philippine-claim', async (req, res) => {
  try {
    const claimText = 'Streetwear advert baselessly linked to violent Philippine clashes';
    
    console.log('🧪 Testing Philippine claim verification...');
    
    // Check if claim exists in database
    const existingClaim = await Claim.findOne({
      text: new RegExp(claimText, 'i')
    });
    
    if (existingClaim) {
      console.log('✅ Found existing claim with verdict:', existingClaim.verdict);
      res.json({
        message: 'Claim found in database',
        claim: {
          id: existingClaim._id,
          text: existingClaim.text,
          verdict: existingClaim.verdict,
          confidence: existingClaim.confidence,
          verificationStatus: existingClaim.verificationStatus,
          evidence: existingClaim.evidence,
          webScrapingData: existingClaim.webScrapingData
        }
      });
    } else {
      console.log('❌ Claim not found in database');
      res.json({
        message: 'Claim not found in database',
        suggestion: 'Run the addSpecificClaim script first'
      });
    }
    
  } catch (error) {
    console.error('❌ Test error:', error);
    res.status(500).json({ error: error.message });
  }
});

module.exports = router;
