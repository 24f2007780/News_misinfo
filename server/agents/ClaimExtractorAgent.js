const BaseAgent = require('./BaseAgent');
const { getAIService } = require('../services/AIService');
const Sentiment = require('sentiment');

class ClaimExtractorAgent extends BaseAgent {
  constructor(io) {
    super('ClaimExtractor', io);
    this.aiService = getAIService();
    this.sentiment = new Sentiment();
  }

  async extractClaims(text, source = {}) {
    try {
      this.queueSize++;
      this.status = 'processing';

      // Use AI to extract checkable claims
      const messages = [
        {
          role: "system",
          content: `You are a claim extraction expert. Extract all factual claims from the text that can be fact-checked. 
          For each claim, provide:
          1. The claim text
          2. Claim type (factual, opinion, prediction, etc.)
          3. Checkability score (0-1)
          4. Urgency (low, medium, high, critical)
          5. Category (health, politics, science, economy, climate, technology, other)
          6. Key entities mentioned
          
          Return as JSON array with a "claims" field.`
        },
        {
          role: "user",
          content: text
        }
      ];

      const result = await this.aiService.generateJSON(messages);
      const claims = result.claims || [];

      // Extract entities using NLP
      const doc = nlp(text);
      const entities = this.extractEntities(doc);

      // Analyze sentiment
      const sentimentResult = this.sentiment.analyze(text);

      // Create claim documents
      const createdClaims = [];
      for (const claimData of claims) {
        const claim = await Claim.create({
          text: claimData.claim,
          originalText: text,
          source,
          entities: claimData.entities || entities,
          sentiment: {
            score: sentimentResult.score,
            label: sentimentResult.score > 0 ? 'positive' : sentimentResult.score < 0 ? 'negative' : 'neutral'
          },
          category: claimData.category || 'other',
          aiAnalysis: {
            claimType: claimData.type,
            checkability: claimData.checkability,
            urgency: claimData.urgency,
            reasoning: claimData.reasoning,
            extractedAt: new Date()
          },
          flags: {
            urgent: claimData.urgency === 'critical' || claimData.urgency === 'high'
          }
        });

        createdClaims.push(claim);
      }

      this.processedCount += claims.length;
      this.queueSize--;
      this.status = 'idle';

      await this.logAction('extract_claims', {
        sourceText: text.substring(0, 100) + '...',
        claimsExtracted: claims.length
      });

      this.emitToAdmin('claims-extracted', {
        count: claims.length,
        claims: createdClaims
      });

      return createdClaims;
    } catch (error) {
      await this.handleError(error, { text: text.substring(0, 100) });
      this.queueSize--;
      return [];
    }
  }

  extractEntities(doc) {
    const entities = [];

    // Extract people
    doc.people().forEach(person => {
      entities.push({
        text: person.text(),
        type: 'PERSON',
        confidence: 0.9
      });
    });

    // Extract places
    doc.places().forEach(place => {
      entities.push({
        text: place.text(),
        type: 'GPE',
        confidence: 0.85
      });
    });

    // Extract organizations
    doc.organizations().forEach(org => {
      entities.push({
        text: org.text(),
        type: 'ORG',
        confidence: 0.8
      });
    });

    // Extract dates
    doc.dates().forEach(date => {
      entities.push({
        text: date.text(),
        type: 'DATE',
        confidence: 0.95
      });
    });

    return entities;
  }

  async analyzeTone(text) {
    try {
      const completion = await this.openai.chat.completions.create({
        model: "gpt-3.5-turbo",
        messages: [
          {
            role: "system",
            content: "Analyze the tone and rhetoric of this text. Identify if it uses emotional manipulation, fear-mongering, or sensationalism. Return JSON with: tone, manipulation_score (0-1), techniques_used[]"
          },
          {
            role: "user",
            content: text
          }
        ],
        response_format: { type: "json_object" }
      });

      return JSON.parse(completion.choices[0].message.content);
    } catch (error) {
      console.error('Tone analysis error:', error);
      return null;
    }
  }
}

module.exports = ClaimExtractorAgent;
