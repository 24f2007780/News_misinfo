const BaseAgent = require('./BaseAgent');
const { getAIService } = require('../services/AIService');
const Claim = require('../models/Claim');

class MultilingualAgent extends BaseAgent {
  constructor(io) {
    super('Multilingual', io);
    this.aiService = getAIService();
  }

  async detectLanguage(text) {
    try {
      const messages = [
        {
          role: "system",
          content: "Detect the language of the text. Return only the ISO 639-1 language code (e.g., 'en', 'es', 'fr', 'hi', 'ar')."
        },
        {
          role: "user",
          content: text.substring(0, 200) // Only send first 200 chars
        }
      ];

      const result = await this.aiService.chat(messages, { maxTokens: 10 });
      return result.trim().toLowerCase();
    } catch (error) {
      console.error('Language detection error:', error);
      return 'en'; // Default to English
    }
  }

  async translate(text, targetLanguage = 'en') {
    try {
      const messages = [
        {
          role: "system",
          content: `Translate the following text to ${targetLanguage}. Preserve the meaning and tone.`
        },
        {
          role: "user",
          content: text
        }
      ];

      return await this.aiService.chat(messages);
    } catch (error) {
      console.error('Translation error:', error);
      return text;
    }
  }

  async processMultilingualClaim(claimId) {
    try {
      const claim = await Claim.findById(claimId);
      if (!claim) return;

      // Detect language
      const language = await this.detectLanguage(claim.originalText);
      claim.language = language;

      // Translate to English if needed
      if (language !== 'en') {
        claim.text = await this.translate(claim.originalText, 'en');
      }

      await claim.save();

      await this.logAction('process_multilingual', {
        claimId,
        language,
        translated: language !== 'en'
      });

      return claim;
    } catch (error) {
      await this.handleError(error, { claimId });
    }
  }

  async translateExplanation(explanation, targetLanguage) {
    try {
      const translated = {};
      
      for (const [key, value] of Object.entries(explanation)) {
        translated[key] = await this.translate(value, targetLanguage);
      }

      return translated;
    } catch (error) {
      console.error('Explanation translation error:', error);
      return explanation;
    }
  }
}

module.exports = MultilingualAgent;
