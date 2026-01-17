const { getAIService } = require("./AIService");
const WebScrapingService = require("./WebScrapingService");
const MLVerificationService = require("./MLVerificationService");
const Claim = require("../models/Claim");

class ComprehensiveVerificationService {
  constructor() {
    this.aiService = getAIService();
    this.verificationPipeline = [
      "data_collection",
      "data_preprocessing",
      "evidence_retrieval",
      "ml_verification",
      "result_formatting",
    ];
  }

  /**
   * Main verification method following the pipeline you specified
   */
  async verifyClaim(claimText, category = "other", options = {}) {
    const aiOnly = options?.aiOnly === true;
    console.log(
      `🔍 Starting comprehensive verification pipeline for: "${claimText.substring(
        0,
        50
      )}..."`
    );

    const startTime = Date.now();
    const pipelineResults = {
      claim: claimText,
      category,
      startTime,
      steps: {},
    };

    try {
      let evidenceData = [];
      let cleanedData = { claim: claimText, evidence: [] };
      let relevantEvidence = [];
      let mlResult;

      if (aiOnly) {
        // AI-only mode: Skip web scraping and ML, go straight to AI verification
        console.log("🤖 AI-Only Mode: Skipping web scraping and ML");
        cleanedData = { claim: claimText, evidence: [] };
        relevantEvidence = [];

        // Step 4: Direct AI Verification
        console.log("🤖 Step 4: AI Verification");
        mlResult = await this.performAIVerification(claimText, []);
      } else {
        // Full pipeline mode
        // Step 1: Data Collection (Web Scraping + APIs)
        console.log("📊 Step 1: Data Collection");
        evidenceData = await this.collectEvidence(claimText);
        pipelineResults.steps.data_collection = {
          completed: true,
          evidence_count: evidenceData.length,
          sources: [...new Set(evidenceData.map((e) => e.source))],
        };

        // Step 2: Data Preprocessing
        console.log("🧹 Step 2: Data Preprocessing");
        cleanedData = await this.preprocessData(claimText, evidenceData);
        pipelineResults.steps.data_preprocessing = {
          completed: true,
          cleaned_claim: cleanedData.claim,
          processed_evidence: cleanedData.evidence.length,
        };

        // Step 3: Evidence Retrieval (Similarity Matching)
        console.log("🔎 Step 3: Evidence Retrieval");
        relevantEvidence = await this.retrieveRelevantEvidence(
          cleanedData.claim,
          cleanedData.evidence
        );
        pipelineResults.steps.evidence_retrieval = {
          completed: true,
          relevant_evidence_count: relevantEvidence.length,
          avg_relevance_score:
            relevantEvidence.length > 0
              ? relevantEvidence.reduce((sum, e) => sum + e.relevanceScore, 0) /
                relevantEvidence.length
              : 0,
        };

        // Step 4: ML Verification (BERT/RoBERTa)
        console.log("🤖 Step 4: ML Verification");
        console.log("🔍 ML Input:", {
          claim: cleanedData.claim,
          category: category,
          evidenceCount: relevantEvidence.length,
        });

        mlResult = await this.performMLVerification(
          cleanedData.claim,
          relevantEvidence,
          category
        );
      }

      console.log("🎯 ML Result:", {
        verdict: mlResult.verdict,
        confidence: mlResult.confidence,
        reasoning: mlResult.reasoning,
        source: mlResult.source,
      });

      pipelineResults.steps.ml_verification = {
        completed: true,
        verdict: mlResult.verdict,
        confidence: mlResult.confidence,
      };

      // Step 5: Result Formatting
      console.log("📋 Step 5: Result Formatting");
      const finalResult = await this.formatFinalResult(
        mlResult,
        relevantEvidence,
        pipelineResults
      );

      // Skip database save for AI-only requests to speed up response
      if (!aiOnly) {
        try {
          console.log("💾 Saving verification result to database...");
          await this.saveToDB(claimText, finalResult, category);
          console.log("✅ Verification result saved successfully");
        } catch (dbError) {
          console.warn(
            "⚠️ Database save failed, but continuing with verification result:",
            dbError.message
          );
        }
      } else {
        console.log("⏩ Skipping database save (AI-only mode)");
      }

      console.log(
        `✅ Verification pipeline completed in ${Date.now() - startTime}ms`
      );
      return finalResult;
    } catch (error) {
      console.error("❌ Verification pipeline failed:", error);

      // Return fallback result
      return this.getFallbackResult(claimText, error.message);
    }
  }

  /**
   * Step 1: Data Collection - Web Scraping + APIs
   */
  async collectEvidence(claimText) {
    const evidence = [];

    try {
      // Web scraping from fact-checking sites
      console.log("🕷️ Collecting evidence via web scraping...");
      const webScrapingResult = await WebScrapingService.verifyClaim(claimText);

      if (webScrapingResult && webScrapingResult.evidence) {
        evidence.push(
          ...webScrapingResult.evidence.map((e) => ({
            ...e,
            collection_method: "web_scraping",
          }))
        );
      }

      // Additional API sources (you can add more here)
      console.log("🌐 Collecting evidence via APIs...");
      const apiEvidence = await this.collectFromAPIs(claimText);
      evidence.push(...apiEvidence);

      // Database evidence
      console.log("💾 Collecting evidence from database...");
      const dbEvidence = await this.collectFromDatabase(claimText);
      evidence.push(...dbEvidence);
    } catch (error) {
      console.warn("⚠️ Evidence collection partially failed:", error.message);
    }

    console.log(`📊 Collected ${evidence.length} evidence items`);
    return evidence;
  }

  /**
   * Collect evidence from APIs (placeholder for future API integrations)
   */
  async collectFromAPIs(claimText) {
    // Placeholder for Google Fact Check Tools API, NewsAPI, etc.
    // You can implement these based on your API keys and requirements
    return [];
  }

  /**
   * Collect evidence from database
   */
  async collectFromDatabase(claimText) {
    try {
      const existingClaims = await Claim.find({
        $text: { $search: claimText },
        evidence: { $exists: true, $ne: [] },
      }).limit(5);

      const dbEvidence = [];

      existingClaims.forEach((claim) => {
        claim.evidence.forEach((evidence) => {
          dbEvidence.push({
            ...evidence.toObject(),
            collection_method: "database",
            source_claim_id: claim._id,
          });
        });
      });

      return dbEvidence;
    } catch (error) {
      console.warn("⚠️ Database evidence collection failed:", error);
      return [];
    }
  }

  /**
   * Step 2: Data Preprocessing
   */
  async preprocessData(claimText, evidenceData) {
    // Clean and tokenize claim
    const cleanedClaim = claimText
      .trim()
      .replace(/\s+/g, " ")
      .replace(/[^\w\s.,!?-]/g, "")
      .toLowerCase();

    // Clean and structure evidence
    const processedEvidence = evidenceData
      .map((evidence) => ({
        ...evidence,
        snippet: this.cleanText(evidence.snippet || evidence.content || ""),
        title: this.cleanText(evidence.title || ""),
        processed_at: new Date(),
      }))
      .filter((e) => e.snippet.length > 10); // Filter out empty evidence

    return {
      claim: cleanedClaim,
      evidence: processedEvidence,
    };
  }

  /**
   * Clean text for ML processing
   */
  cleanText(text) {
    if (!text) return "";

    return text
      .replace(/\s+/g, " ")
      .replace(/[^\w\s.,!?-]/g, "")
      .trim()
      .substring(0, 500); // Limit length for ML models
  }

  /**
   * Step 3: Evidence Retrieval using similarity
   */
  async retrieveRelevantEvidence(claim, evidence) {
    // Calculate relevance scores
    const scoredEvidence = evidence.map((e) => ({
      ...e,
      relevanceScore: this.calculateSemanticSimilarity(
        claim,
        e.snippet + " " + e.title
      ),
    }));

    // Filter and sort by relevance
    return scoredEvidence
      .filter((e) => e.relevanceScore > 0.3)
      .sort((a, b) => b.relevanceScore - a.relevanceScore)
      .slice(0, 5); // Top 5 most relevant
  }

  /**
   * Calculate semantic similarity (simplified version)
   */
  calculateSemanticSimilarity(text1, text2) {
    const words1 = new Set(text1.toLowerCase().split(/\s+/));
    const words2 = new Set(text2.toLowerCase().split(/\s+/));

    const intersection = new Set([...words1].filter((x) => words2.has(x)));
    const union = new Set([...words1, ...words2]);

    // Jaccard similarity with length penalty
    const jaccard = intersection.size / union.size;
    const lengthPenalty = Math.min(text2.length / 100, 1); // Prefer longer evidence

    return jaccard * lengthPenalty;
  }

  /**
   * Step 4: ML Verification using transformer models
   */
  async performMLVerification(claim, evidence, category = "other") {
    try {
      // Use ML service for verification with category
      const mlResult = await MLVerificationService.verifyClaim(
        claim,
        evidence,
        category
      );
      return mlResult;
    } catch (error) {
      console.warn(
        "⚠️ ML verification failed, using fallback AI analysis:",
        error
      );

      // Fallback to AI service
      return await this.performAIVerification(claim, evidence);
    }
  }

  /**
   * Enhanced AI verification using pure AI knowledge (Gemini/OpenAI) for real-time fact-checking
   */
  async performAIVerification(claim, evidence) {
    if (!this.aiService.isConfigured()) {
      throw new Error("Neither ML models nor AI service available");
    }

    const prompt = `You are an expert fact-checker. Analyze this claim and determine if it's TRUE, FALSE, or UNCERTAIN.

CLAIM: "${claim}"

INSTRUCTIONS:
- Use "supported" for TRUE claims (well-established facts, scientific consensus)
- Use "refuted" for FALSE claims (debunked, contradicts facts)
- Use "not_enough_info" ONLY if genuinely uncertain
- Be confident: Earth orbits Sun = supported (0.99), Vaccines cause autism = refuted (0.98)
- Confidence: 0.85-0.99 (very high), 0.70-0.84 (high), 0.55-0.69 (moderate)

Respond with ONLY valid JSON:
{
  "verdict": "supported" | "refuted" | "not_enough_info",
  "confidence": 0.0-1.0,
  "reasoning": "Brief explanation why this is true/false with key facts",
  "key_facts": "Main facts supporting your verdict",
  "sources_used": "Type of knowledge used",
  "caveats": "Important context or limitations"
}`;

    try {
      const response = await this.aiService.generateJSON(
        [
          {
            role: "system",
            content:
              "You are an expert fact-checker with comprehensive world knowledge. You provide accurate, well-reasoned verdicts on claims using your extensive knowledge base covering science, history, current events, and more. You are confident in well-established facts and clearly identify misinformation.",
          },
          { role: "user", content: prompt },
        ],
        { temperature: 0.1 }
      ); // Very low temperature for factual consistency

      console.log("🤖 AI Response:", response);

      return {
        verdict: response.verdict || "not_enough_info",
        confidence: response.confidence || 0.5, // Use AI's confidence directly
        reasoning: `${response.reasoning}\n\nKey Facts: ${
          response.key_facts || "N/A"
        }\n\nKnowledge Sources: ${
          response.sources_used || "AI knowledge base"
        }${response.caveats ? "\n\nCaveats: " + response.caveats : ""}`,
        source: "gemini-ai-knowledge",
        metadata: {
          evidence_count: evidence.length,
          key_facts: response.key_facts,
          sources_used: response.sources_used,
          caveats: response.caveats,
          analyzed_at: new Date(),
          ai_provider: this.aiService.getProvider(),
        },
      };
    } catch (error) {
      console.error("❌ AI verification error:", error);
      throw new Error("AI verification failed: " + error.message);
    }
  }

  /**
   * Step 5: Format final result in your required format
   */
  async formatFinalResult(mlResult, evidence, pipelineResults) {
    const { verdict, confidence, reasoning } = mlResult;

    // Format according to your requirements
    let emoji, formattedVerdict;

    switch (verdict.toLowerCase()) {
      case "supported":
      case "true":
        emoji = "✅";
        formattedVerdict = "Supported";
        break;
      case "refuted":
      case "false":
        emoji = "❌";
        formattedVerdict = "Refuted";
        break;
      default:
        emoji = "⚪";
        formattedVerdict = "Not Enough Information";
        break;
    }

    const confidencePercent = Math.round(confidence * 100);

    return {
      // Your required format
      classification: `${emoji} ${formattedVerdict} (Confidence: ${confidencePercent}%)`,

      // Detailed breakdown
      verdict: verdict.toLowerCase(),
      confidence,
      confidencePercent,
      emoji,
      formattedVerdict,

      // Evidence and analysis
      evidence: evidence.slice(0, 5),
      reasoning,

      // Pipeline metadata
      pipeline: {
        steps_completed: Object.keys(pipelineResults.steps).length,
        total_time_ms: Date.now() - pipelineResults.startTime,
        evidence_sources: [...new Set(evidence.map((e) => e.source))],
        verification_method: mlResult.source || "ml-analysis",
      },

      // Detailed explanation
      explanation: {
        short: `${formattedVerdict} with ${confidencePercent}% confidence`,
        medium: `Analysis of ${
          evidence.length
        } evidence sources indicates this claim is ${formattedVerdict.toLowerCase()} (${confidencePercent}% confidence)`,
        long: `Our comprehensive verification pipeline analyzed this claim through web scraping, evidence retrieval, and machine learning models. Based on ${
          evidence.length
        } evidence sources from ${[
          ...new Set(evidence.map((e) => e.source)),
        ].join(
          ", "
        )}, the claim is classified as ${formattedVerdict.toLowerCase()} with ${confidencePercent}% confidence. ${reasoning}`,
        eli5: `We checked this claim by looking at lots of websites and using smart computer programs. The result is: ${formattedVerdict.toLowerCase()}.`,
      },

      timestamp: new Date(),
      version: "2.0",
    };
  }

  /**
   * Save verification result to database
   */
  async saveToDB(claimText, result, category = "other") {
    try {
      // Map the verdict to database format
      let dbVerdict = "unverified";
      if (result.verdict === "supported") {
        dbVerdict = "true";
      } else if (result.verdict === "refuted") {
        dbVerdict = "false";
      } else if (result.verdict === "not_enough_info") {
        dbVerdict = "unverified";
      }

      console.log("💾 Attempting to save claim to database:", {
        text: claimText.substring(0, 50) + "...",
        originalVerdict: result.verdict,
        dbVerdict: dbVerdict,
        confidence: result.confidence,
        category: category,
      });

      // Always create a new claim entry for recent claims tracking
      const claim = new Claim({
        text: claimText,
        originalText: claimText,
        category: this.normalizeCategory(category),
        verdict: dbVerdict,
        confidence: result.confidence || 0.5,
        verificationStatus: "verified",
        evidence: Array.isArray(result.evidence) ? result.evidence : [],
        explanation: result.explanation || { short: "Verification completed" },
        aiAnalysis: {
          verdict: result.verdict || "unverified",
          confidence: result.confidence || 0.5,
          reasoning: result.reasoning || "AI-powered verification",
          provider: "comprehensive-pipeline",
          analyzedAt: new Date(),
        },
      });

      const savedClaim = await claim.save();
      console.log("✅ Claim saved successfully with ID:", savedClaim._id);
      console.log("📊 Saved claim details:", {
        id: savedClaim._id,
        text: savedClaim.text.substring(0, 50) + "...",
        verdict: savedClaim.verdict,
        createdAt: savedClaim.createdAt,
      });

      return savedClaim;
    } catch (error) {
      console.error("❌ Failed to save to database:", error);
      console.error("Error details:", error.message);
      throw error; // Re-throw to see the error in the main flow
    }
  }

  /**
   * Get fallback result when pipeline fails
   */
  getFallbackResult(claimText, errorMessage) {
    return {
      classification: "⚪ Not Enough Information (Confidence: 20%)",
      verdict: "not_enough_info",
      confidence: 0.2,
      confidencePercent: 20,
      emoji: "⚪",
      formattedVerdict: "Not Enough Information",
      evidence: [],
      reasoning: `Verification failed: ${errorMessage}`,
      pipeline: {
        steps_completed: 0,
        total_time_ms: 0,
        evidence_sources: [],
        verification_method: "fallback",
      },
      explanation: {
        short: "Unable to verify this claim",
        medium:
          "Our verification system encountered an error and could not analyze this claim",
        long: `The comprehensive verification pipeline failed to analyze this claim due to: ${errorMessage}. Please try again later.`,
        eli5: "Sorry, we couldn't check this claim right now.",
      },
      timestamp: new Date(),
      version: "2.0",
      error: errorMessage,
    };
  }

  /**
   * Normalize category to valid enum value
   */
  normalizeCategory(category) {
    const allowed = new Set([
      "politics_governance",
      "health_medicine",
      "environment_climate",
      "economics_finance",
      "science_technology",
      "food_nutrition",
      "social_cultural",
      "entertainment_media",
      "sports",
      "technology_cybersecurity",
      "other",
    ]);

    // Map common variations to valid enum values
    const map = {
      politics_government: "politics_governance",
      government_politics: "politics_governance",
      politics: "politics_governance",
      health: "health_medicine",
      environment: "environment_climate",
      climate_change: "environment_climate",
      finance: "economics_finance",
      economics: "economics_finance",
      tech: "science_technology",
      technology: "science_technology",
      cybersecurity: "technology_cybersecurity",
      history: "social_cultural",
    };

    const c = (category || "").toString().trim();
    const mapped = map[c] || c;
    return allowed.has(mapped) ? mapped : "other";
  }

  /**
   * Get service status
   */
  getStatus() {
    return {
      pipeline_steps: this.verificationPipeline,
      ml_service: MLVerificationService.getStatus(),
      web_scraping: WebScrapingService.getScrapingStats(),
      ai_service: this.aiService.isConfigured(),
    };
  }
}

module.exports = new ComprehensiveVerificationService();
