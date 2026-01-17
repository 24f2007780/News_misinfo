const BaseAgent = require('./BaseAgent');
const { getAIService } = require('../services/AIService');
const axios = require('axios');
const Claim = require('../models/Claim');

class VerificationAgent extends BaseAgent {
  constructor(io) {
    super('Verification', io);
    this.aiService = getAIService();
  }

  async verifyClaim(claimId) {
    try {
      this.queueSize++;
      this.status = 'processing';

      const claim = await Claim.findById(claimId);
      if (!claim) throw new Error('Claim not found');

      claim.verificationStatus = 'in_progress';
      await claim.save();

      // Search for evidence
      const evidence = await this.searchEvidence(claim.text);

      // Analyze evidence with AI
      const analysis = await this.analyzeEvidence(claim.text, evidence);

      // Update claim with verification results
      claim.evidence = evidence;
      claim.verdict = analysis.verdict;
      claim.confidence = analysis.confidence;
      claim.explanation = analysis.explanation;
      claim.verificationStatus = 'verified';
      claim.verifiedAt = new Date();

      await claim.save();

      this.processedCount++;
      this.queueSize--;
      this.status = 'idle';

      await this.logAction('verify_claim', {
        claimId: claim._id,
        verdict: analysis.verdict,
        confidence: analysis.confidence
      });

      this.emitToAdmin('claim-verified', {
        claimId: claim._id,
        verdict: analysis.verdict,
        confidence: analysis.confidence
      });

      return claim;
    } catch (error) {
      await this.handleError(error, { claimId });
      this.queueSize--;
      throw error;
    }
  }

  async searchEvidence(claimText) {
    const evidence = [];

    try {
      // Search Google Fact Check API (if available)
      if (process.env.GOOGLE_FACT_CHECK_API_KEY) {
        const factCheckResults = await this.searchFactCheckAPI(claimText);
        evidence.push(...factCheckResults);
      }

      // Search news articles
      if (process.env.NEWS_API_KEY) {
        const newsResults = await this.searchNewsAPI(claimText);
        evidence.push(...newsResults);
      }

      // Web search using OpenAI browsing (simulated)
      const webResults = await this.searchWeb(claimText);
      evidence.push(...webResults);

      return evidence;
    } catch (error) {
      console.error('Evidence search error:', error);
      return evidence;
    }
  }

  async searchWeb(query) {
    // Simulated web search - in production, use actual search API
    // For now, return mock data
    return [
      {
        source: 'Web Search',
        url: 'https://example.com/article',
        title: 'Related Article',
        snippet: 'Context about the claim...',
        credibility: 0.7,
        stance: 'neutral',
        addedAt: new Date()
      }
    ];
  }

  async searchNewsAPI(query) {
    try {
      const response = await axios.get('https://newsapi.org/v2/everything', {
        params: {
          q: query,
          apiKey: process.env.NEWS_API_KEY,
          language: 'en',
          sortBy: 'relevancy',
          pageSize: 5
        }
      });

      return response.data.articles.map(article => ({
        source: article.source.name,
        url: article.url,
        title: article.title,
        snippet: article.description,
        credibility: 0.75,
        stance: 'neutral',
        addedAt: new Date()
      }));
    } catch (error) {
      console.error('News API error:', error);
      return [];
    }
  }

  async searchFactCheckAPI(query) {
    // Placeholder for Google Fact Check API
    return [];
  }

  async analyzeEvidence(claim, evidence) {
    try {
      const evidenceText = evidence.map(e => 
        `Source: ${e.source}\nTitle: ${e.title}\nContent: ${e.snippet}`
      ).join('\n\n');

      const messages = [
        {
          role: "system",
          content: `You are a fact-checking expert. Analyze the claim against the provided evidence and determine:
          1. verdict: "true", "false", "misleading", "unverified", or "satire"
          2. confidence: 0-1 score
          3. explanation: {
            short: 1-2 sentences
            medium: 1 paragraph
            long: detailed analysis
            eli5: explain like I'm 5
          }
          4. key_points: array of supporting/refuting points
          
          Return as JSON.`
        },
        {
          role: "user",
          content: `Claim: ${claim}\n\nEvidence:\n${evidenceText}`
        }
      ];

      return await this.aiService.generateJSON(messages);
    } catch (error) {
      console.error('Evidence analysis error:', error);
      return {
        verdict: 'unverified',
        confidence: 0,
        explanation: {
          short: 'Unable to verify this claim.',
          medium: 'Insufficient evidence to make a determination.',
          long: 'The verification process encountered an error.',
          eli5: 'We need more information to check this.'
        }
      };
    }
  }

  async quickVerify(claimText) {
    try {
      const evidence = await this.searchEvidence(claimText);
      const analysis = await this.analyzeEvidence(claimText, evidence);
      
      return {
        verdict: analysis.verdict,
        confidence: analysis.confidence,
        explanation: analysis.explanation,
        evidence: evidence.slice(0, 3) // Top 3 sources
      };
    } catch (error) {
      await this.handleError(error, { claimText });
      throw error;
    }
  }
}

module.exports = VerificationAgent;
