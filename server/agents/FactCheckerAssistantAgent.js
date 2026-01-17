const BaseAgent = require('./BaseAgent');
const { getAIService } = require('../services/AIService');
const Claim = require('../models/Claim');
const Cluster = require('../models/Cluster');

class FactCheckerAssistantAgent extends BaseAgent {
  constructor(io) {
    super('FactCheckerAssistant', io);
    this.aiService = getAIService();
    this.conversationHistory = new Map();
    this.useMockMode = process.env.USE_MOCK_AI === 'true';
  }

  async chat(userId, message, context = {}) {
    try {
      // Get or create conversation history
      if (!this.conversationHistory.has(userId)) {
        this.conversationHistory.set(userId, []);
      }
      const history = this.conversationHistory.get(userId);

      // Database-driven responses instead of AI
      const response = await this.getDatabaseResponse(message, context);

      // Update history
      history.push({ role: "user", content: message });
      history.push({ role: "assistant", content: response });

      // Keep only last 10 messages
      if (history.length > 10) {
        history.splice(0, history.length - 10);
      }

      this.conversationHistory.set(userId, history);

      await this.logAction('chat', {
        userId,
        messageLength: message.length,
        responseLength: response.length
      });

      return response;
    } catch (error) {
      console.error('FactChecker chat error:', error.message);
      console.error('Error details:', error.response?.data || error);
      await this.handleError(error, { userId, message });
      
      // Check if it's a rate limit or quota error
      const isRateLimit = error.message?.includes('rate limit') || 
                         error.message?.includes('resource_exhausted') ||
                         error.message?.includes('429') ||
                         error.code === 'insufficient_quota' || 
                         error.status === 429;
      
      if (isRateLimit) {
        console.log('⚠️  Rate limit hit. Returning helpful mock response.');
        return this.getMockResponse(message, context);
      }
      
      // Return more specific error message
      if (error.message.includes('API key')) {
        return "I'm sorry, the AI API key is not configured properly. Please check your .env file.";
      } else if (error.message.includes('model')) {
        return "I'm sorry, the AI model is not accessible. Please check your account permissions.";
      }
      
      return `I'm sorry, I encountered an error: ${error.message}. Please try again.`;
    }
  }

  async getDatabaseResponse(message, context) {
    const lowerMessage = message.toLowerCase();
    
    try {
      // Search for claims in database
      if (lowerMessage.includes('show') || lowerMessage.includes('find') || lowerMessage.includes('search')) {
        // Extract keywords
        const keywords = ['vaccine', 'climate', 'election', 'covid', 'politics', 'health', 'false', 'true'];
        const foundKeyword = keywords.find(k => lowerMessage.includes(k));
        
        if (foundKeyword) {
          const claims = await Claim.find({
            $or: [
              { text: new RegExp(foundKeyword, 'i') },
              { category: new RegExp(foundKeyword, 'i') }
            ]
          }).limit(5).sort({ createdAt: -1 });
          
          if (claims.length > 0) {
            let response = `I found ${claims.length} claims about "${foundKeyword}":\n\n`;
            claims.forEach((claim, i) => {
              response += `${i + 1}. **${claim.text.substring(0, 100)}...**\n`;
              response += `   - Verdict: ${claim.verdict || 'Pending'}\n`;
              response += `   - Category: ${claim.category}\n\n`;
            });
            return response;
          }
        }
      }
      
      // Get statistics
      if (lowerMessage.includes('how many') || lowerMessage.includes('stats') || lowerMessage.includes('statistics')) {
        const totalClaims = await Claim.countDocuments();
        const verifiedClaims = await Claim.countDocuments({ verificationStatus: 'verified' });
        const falseClaims = await Claim.countDocuments({ verdict: 'false' });
        const trueClaims = await Claim.countDocuments({ verdict: 'true' });
        
        return `📊 **Database Statistics:**\n\n` +
               `- Total Claims: ${totalClaims}\n` +
               `- Verified: ${verifiedClaims}\n` +
               `- False Claims: ${falseClaims}\n` +
               `- True Claims: ${trueClaims}\n` +
               `- Pending: ${totalClaims - verifiedClaims}`;
      }
      
      // Get recent claims
      if (lowerMessage.includes('recent') || lowerMessage.includes('latest') || lowerMessage.includes('new')) {
        const recentClaims = await Claim.find().sort({ createdAt: -1 }).limit(5);
        
        if (recentClaims.length > 0) {
          let response = `📰 **Latest Claims:**\n\n`;
          recentClaims.forEach((claim, i) => {
            response += `${i + 1}. ${claim.text.substring(0, 80)}...\n`;
            response += `   - Status: ${claim.verificationStatus}\n`;
            response += `   - Date: ${new Date(claim.createdAt).toLocaleDateString()}\n\n`;
          });
          return response;
        }
      }
      
      // Get clusters
      if (lowerMessage.includes('cluster') || lowerMessage.includes('group') || lowerMessage.includes('similar')) {
        const clusters = await Cluster.find().limit(5).sort({ 'timeline.lastSeen': -1 });
        
        if (clusters.length > 0) {
          let response = `🔗 **Active Claim Clusters:**\n\n`;
          clusters.forEach((cluster, i) => {
            response += `${i + 1}. **${cluster.name}**\n`;
            response += `   - ${cluster.description}\n`;
            response += `   - Claims: ${cluster.claimIds?.length || 0}\n\n`;
          });
          return response;
        }
      }
      
      // Detect language from text
      const detectedLanguage = this.detectLanguageFromText(message);
      
      // Save user's message as a new claim to verify
      const newClaim = await Claim.create({
        text: message,
        originalText: message,
        verificationStatus: 'pending',
        category: 'other',
        language: detectedLanguage,
        source: {
          type: 'user-submission',
          userId: context.userId || 'anonymous'
        }
      });
      
      return `✅ **Claim submitted for verification!**\n\n` +
             `Your claim: "${message}"\n\n` +
             `Status: Pending verification\n` +
             `Claim ID: ${newClaim._id}\n\n` +
             `This claim has been added to the database and will appear in the Claim Intelligence section. It's currently pending verification.`;
             
    } catch (error) {
      console.error('Database query error:', error);
      return `I encountered an error querying the database. Please try again.`;
    }
  }

  detectLanguageFromText(text) {
    // Simple language detection based on character sets
    const hindiPattern = /[\u0900-\u097F]/;
    const arabicPattern = /[\u0600-\u06FF]/;
    const chinesePattern = /[\u4E00-\u9FFF]/;
    const japanesePattern = /[\u3040-\u309F\u30A0-\u30FF]/;
    const koreanPattern = /[\uAC00-\uD7AF]/;
    const cyrillicPattern = /[\u0400-\u04FF]/;
    const thaiPattern = /[\u0E00-\u0E7F]/;
    
    if (hindiPattern.test(text)) return 'hi';
    if (arabicPattern.test(text)) return 'ar';
    if (chinesePattern.test(text)) return 'zh';
    if (japanesePattern.test(text)) return 'ja';
    if (koreanPattern.test(text)) return 'ko';
    if (cyrillicPattern.test(text)) return 'ru';
    if (thaiPattern.test(text)) return 'th';
    
    // Check for common non-English words
    const spanishWords = /\b(el|la|los|las|un|una|de|que|es|por|para)\b/i;
    const frenchWords = /\b(le|la|les|un|une|de|que|est|pour|avec)\b/i;
    const germanWords = /\b(der|die|das|ein|eine|und|ist|für|mit)\b/i;
    
    if (spanishWords.test(text)) return 'es';
    if (frenchWords.test(text)) return 'fr';
    if (germanWords.test(text)) return 'de';
    
    // Default to English
    return 'en';
  }

  getMockResponse(message, context) {
    const lowerMessage = message.toLowerCase();
    
    // Context-aware responses
    if (context.claim) {
      return `I understand you're asking about the claim "${context.claim}". While I'm experiencing high demand right now, I can tell you that the claim has been marked as "${context.verdict || 'unknown'}" with ${Math.round((context.confidence || 0) * 100)}% confidence. 

⏳ **High Demand**: The AI service is currently experiencing high traffic. Please try again in 1-2 minutes, or check the verification results which use real fact-checking sources!`;
    }
    
    // Question detection
    if (lowerMessage.includes('how') || lowerMessage.includes('what') || lowerMessage.includes('why') || lowerMessage.includes('?')) {
      return `That's a great question about "${message.substring(0, 50)}..."

⏳ **Temporary Limitation**: The AI service is experiencing high demand right now. 

**What you can do:**
• Wait 1-2 minutes and try again (rate limits reset quickly)
• Use the "Verify Claim" feature which searches real fact-checking databases
• Check the trending claims section for similar topics

The AI assistant will be back shortly!`;
    }
    
    // Greeting detection
    if (lowerMessage.includes('hello') || lowerMessage.includes('hi') || lowerMessage.includes('hey')) {
      return `Hello! 👋 I'm your AI fact-checking assistant. I'm experiencing high demand right now, but I'll be back in 1-2 minutes. In the meantime, feel free to use the claim verification feature!`;
    }
    
    // Default response
    return `I received your message: "${message.substring(0, 100)}${message.length > 100 ? '...' : ''}"

⏳ **High Demand Notice**: The AI service is currently experiencing high traffic due to rate limits.

**Quick Solutions:**
• **Wait 1-2 minutes** - Rate limits reset every minute
• **Use Claim Verification** - Searches real fact-checking sources
• **Try shorter queries** - Reduces token usage

The service will be available again shortly. Thank you for your patience! 🙏`;
  }

  async draftVerification(claim, evidence, verdict) {
    try {
      const messages = [
        {
          role: "system",
          content: `You are drafting a fact-check verification report. Create a professional, clear report with:
          1. Summary verdict
          2. Key findings
          3. Evidence analysis
          4. Conclusion
          5. Sources cited
          
          Return as JSON with these sections.`
        },
        {
          role: "user",
          content: `Claim: ${claim}\n\nVerdict: ${verdict}\n\nEvidence:\n${JSON.stringify(evidence, null, 2)}`
        }
      ];

      return await this.aiService.generateJSON(messages);
    } catch (error) {
      console.error('Draft verification error:', error);
      return null;
    }
  }

  clearHistory(userId) {
    this.conversationHistory.delete(userId);
  }
}

module.exports = FactCheckerAssistantAgent;
