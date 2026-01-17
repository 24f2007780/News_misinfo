const { getAIService } = require("./AIService");
const WebScrapingService = require("./WebScrapingService");

class EnhancedVerificationService {
  constructor() {
    this.aiService = getAIService();

    // Well-established scientific facts that should always be verified as true
    this.scientificFacts = [
      {
        patterns: [
          /earth.*revolves.*around.*sun/i,
          /earth.*orbits.*sun/i,
          /sun.*center.*solar.*system/i,
        ],
        verdict: "true",
        confidence: 0.99,
        explanation:
          "This is a well-established scientific fact. The Earth orbits around the Sun in our solar system, as proven by centuries of astronomical observations and scientific evidence.",
      },
      {
        patterns: [
          /gravity.*exists/i,
          /objects.*fall.*down/i,
          /gravity.*pulls.*objects/i,
        ],
        verdict: "true",
        confidence: 0.99,
        explanation:
          "Gravity is a fundamental force of nature, well-documented and proven through scientific observation and experimentation.",
      },
      {
        patterns: [
          /water.*boils.*100.*celsius/i,
          /water.*boils.*212.*fahrenheit/i,
        ],
        verdict: "true",
        confidence: 0.95,
        explanation:
          "Water boils at 100°C (212°F) at standard atmospheric pressure. This is a well-established physical property.",
      },
      {
        patterns: [/vaccines.*cause.*autism/i],
        verdict: "false",
        confidence: 0.98,
        explanation:
          "Multiple large-scale scientific studies have conclusively shown no link between vaccines and autism. This claim has been thoroughly debunked by the medical community.",
      },
      {
        patterns: [/climate.*change.*hoax/i, /global.*warming.*hoax/i],
        verdict: "false",
        confidence: 0.97,
        explanation:
          "Climate change is supported by overwhelming scientific consensus. It is not a hoax but a well-documented phenomenon backed by extensive research.",
      },
    ];
  }

  /**
   * Enhanced claim verification that combines multiple approaches
   */
  async verifyClaim(claimText) {
    console.log(
      `🔍 Enhanced verification for: "${claimText.substring(0, 50)}..."`
    );

    try {
      // Step 1: Check against known scientific facts
      const scientificCheck = this.checkScientificFacts(claimText);
      if (scientificCheck) {
        console.log("✅ Matched known scientific fact");
        return {
          ...scientificCheck,
          source: "scientific-knowledge",
          evidence: [
            {
              source: "Scientific Consensus",
              title: "Well-established Scientific Fact",
              snippet: scientificCheck.explanation,
              url: "https://en.wikipedia.org/wiki/Scientific_consensus",
              relevanceScore: 1.0,
              verdict: scientificCheck.verdict,
              factCheckingSite: "Scientific Knowledge Base",
            },
          ],
        };
      }

      // Step 2: Try web scraping first
      let webScrapingResult = null;
      try {
        webScrapingResult = await WebScrapingService.verifyClaim(claimText);
        console.log("✅ Web scraping completed");

        // If web scraping found good results, use them
        if (
          webScrapingResult &&
          webScrapingResult.evidence.length > 0 &&
          webScrapingResult.confidence > 0.5
        ) {
          return webScrapingResult;
        }
      } catch (error) {
        console.warn("⚠️ Web scraping failed:", error.message);
      }

      // Step 3: Use AI-powered fact-checking as fallback or enhancement
      console.log("🤖 Using AI-powered fact-checking...");
      const aiResult = await this.aiFactCheck(claimText);

      // Step 4: Combine results if both are available
      if (webScrapingResult && aiResult) {
        return this.combineResults(webScrapingResult, aiResult);
      }

      // Return AI result if web scraping failed or had low confidence
      if (aiResult) {
        return aiResult;
      }

      // Return web scraping result as last resort
      if (webScrapingResult) {
        return webScrapingResult;
      }

      // If everything fails, return unverified
      return {
        verdict: "unverified",
        confidence: 0.1,
        explanation: {
          short: "Unable to verify this claim",
          medium:
            "We could not find sufficient evidence to verify this claim through our fact-checking sources.",
          long: "This claim could not be verified through our available fact-checking methods including web scraping and AI analysis.",
          eli5: "We couldn't find enough information to check if this is true or false.",
        },
        evidence: [],
        source: "no-verification-possible",
      };
    } catch (error) {
      console.error("❌ Enhanced verification failed:", error);
      throw error;
    }
  }

  /**
   * Check claim against known scientific facts
   */
  checkScientificFacts(claimText) {
    const normalizedClaim = claimText.toLowerCase().trim();

    for (const fact of this.scientificFacts) {
      for (const pattern of fact.patterns) {
        if (pattern.test(normalizedClaim)) {
          return {
            verdict: fact.verdict,
            confidence: fact.confidence,
            explanation: {
              short: fact.explanation,
              medium: fact.explanation,
              long:
                fact.explanation +
                " This is part of our scientific knowledge base.",
              eli5: this.simplifyExplanation(fact.explanation),
            },
          };
        }
      }
    }

    return null;
  }

  /**
   * Advanced AI-powered fact-checking with multi-stage analysis for unseen claims
   */
  async aiFactCheck(claimText) {
    if (!this.aiService.isConfigured()) {
      throw new Error("AI service not configured");
    }

    // Stage 1: Initial claim analysis and categorization
    const analysisPrompt = `As a professional fact-checker, analyze this claim to understand what needs to be verified:

CLAIM: "${claimText}"

Provide initial analysis:
1. What specific factual assertions are being made?
2. What category does this fall into? (science, health, politics, technology, history, etc.)
3. What would you need to verify this claim?
4. Are there any obvious red flags (conspiracy theory language, extreme claims, logical fallacies)?
5. What is the inherent plausibility based on established knowledge?

Respond with JSON:
{
  "key_assertions": ["assertion 1", "assertion 2"],
  "category": "category name",
  "verification_needs": ["what to check 1", "what to check 2"],
  "red_flags": ["flag 1" or null],
  "prior_plausibility": "high" | "medium" | "low",
  "reasoning": "brief explanation"
}`;

    try {
      // Get initial analysis
      const analysis = await this.aiService.generateJSON(
        [
          {
            role: "system",
            content:
              "You are a fact-checking analyst. Your job is to break down claims systematically.",
          },
          { role: "user", content: analysisPrompt },
        ],
        { temperature: 0.3 }
      );

      // Stage 2: Comprehensive fact-check with enhanced context
      const verificationPrompt = `You are an expert fact-checker with access to vast knowledge. Verify this claim using critical reasoning and evidence-based analysis.

CLAIM: "${claimText}"

PRELIMINARY ANALYSIS:
- Category: ${analysis.category || "general"}
- Key Assertions: ${(analysis.key_assertions || []).join("; ")}
- Prior Plausibility: ${analysis.prior_plausibility || "unknown"}
${
  analysis.red_flags && analysis.red_flags.length > 0
    ? "- Red Flags Detected: " + analysis.red_flags.join(", ")
    : ""
}

FACT-CHECKING FRAMEWORK:

**1. KNOWLEDGE BASE CHECK**
- What does established scientific/historical/factual knowledge say about this?
- Is this claim consistent with peer-reviewed research, official data, or expert consensus?
- Have credible fact-checkers already addressed this or similar claims?

**2. LOGICAL ANALYSIS**
- Is the claim logically coherent?
- Are there any logical fallacies (false causation, cherry-picking, false dichotomy, etc.)?
- Does the claim make extraordinary assertions that would require extraordinary evidence?

**3. SOURCE & EVIDENCE EVALUATION**
- If this were true/false, what evidence would exist?
- What credible sources would have covered this?
- Are there any authoritative sources (WHO, NASA, peer-reviewed journals, government data, etc.) relevant to this claim?

**4. CONTEXT & NUANCE**
- Is important context missing that changes the meaning?
- Could this be partially true but misleading?
- Are there legitimate different perspectives on this topic?

**5. CLAIM-SPECIFIC CONSIDERATIONS**
For SCIENCE claims: Check against scientific consensus, peer-reviewed research
For HEALTH claims: Verify against medical authorities (WHO, CDC, medical journals)
For POLITICAL claims: Check official records, statements, verified quotes
For HISTORICAL claims: Verify against historical records, academic sources
For NEWS claims: Cross-reference with multiple reputable news outlets

VERDICT CRITERIA:
- "true": Strong evidence from authoritative sources confirms this, consistent with established knowledge (confidence: 0.75-0.95)
- "false": Strong evidence from authoritative sources contradicts this, or claim is logically impossible (confidence: 0.75-0.95)
- "misleading": Claim contains some truth but lacks crucial context or presents distorted information (confidence: 0.65-0.85)
- "unverified": Insufficient authoritative information available, or conflicting evidence from credible sources (confidence: 0.2-0.5)

CRITICAL INSTRUCTIONS:
✓ You CAN verify claims you haven't seen before by using logical reasoning and knowledge synthesis
✓ For well-established facts (e.g., Earth orbits Sun, water is H2O), mark as "true" with high confidence
✓ For debunked claims (e.g., vaccines cause autism, flat Earth), mark as "false" with high confidence
✓ For current events or niche topics with limited knowledge, be honest about uncertainty
✓ Consider multiple perspectives but prioritize authoritative sources and scientific consensus
✓ Don't invent or fabricate specific sources - use general knowledge categories instead

Respond with ONLY valid JSON:
{
  "verdict": "true" | "false" | "misleading" | "unverified",
  "confidence": 0.0-1.0,
  "explanation": {
    "short": "1-2 sentence verdict",
    "medium": "3-4 sentence detailed explanation",
    "long": "Comprehensive analysis with reasoning and context (5-7 sentences)",
    "eli5": "Simple explanation suitable for a child"
  },
  "evidence": [
    {
      "source": "General source category (e.g., 'Scientific Consensus', 'Medical Research', 'Historical Records')",
      "title": "Type of evidence",
      "snippet": "What this evidence shows (150 chars max)",
      "url": "https://example.com or 'General Knowledge'",
      "relevanceScore": 0.7-1.0,
      "verdict": "supports" | "refutes" | "provides-context"
    }
  ],
  "reasoning": "Step-by-step logical analysis of how you reached this verdict",
  "knowledge_sources": "What types of authoritative sources would support this analysis (e.g., 'peer-reviewed studies', 'official government data', 'expert consensus')",
  "confidence_factors": "What factors influenced your confidence level (high/low evidence quality, consensus/conflict among sources, etc.)",
  "caveats": "Important nuances, limitations, or context (null if none)"
}`;

      const messages = [
        {
          role: "system",
          content: `You are a world-class fact-checker with expertise across multiple domains: science, medicine, politics, history, technology, and current events. 

Your capabilities:
- You can analyze NEW claims you've never encountered by applying logical reasoning and evidence-based thinking
- You synthesize knowledge from multiple domains to verify claims
- You understand the difference between established facts, current scientific consensus, and uncertain/disputed topics
- You recognize common misinformation patterns and logical fallacies
- You provide transparent, evidence-based verdicts with appropriate confidence levels

Your methodology:
- Apply critical thinking frameworks
- Consider source credibility hierarchies
- Evaluate claims against established knowledge
- Be honest about uncertainty and limitations
- Provide nuanced analysis when appropriate

You are NOT limited to claims in your training data - you can reason about new claims using established knowledge and logical analysis.`,
        },
        {
          role: "user",
          content: verificationPrompt,
        },
      ];

      const response = await this.aiService.generateJSON(messages, {
        temperature: 0.2, // Low temperature for consistent, factual analysis
        maxTokens: 2000,
      });

      if (!response) {
        throw new Error("AI returned empty response");
      }

      // Validate and enhance the AI response
      return {
        verdict: response.verdict || "unverified",
        confidence: Math.min(Math.max(response.confidence || 0.5, 0), 0.95), // Cap at 0.95 for AI
        explanation: response.explanation || {
          short: "AI analysis completed",
          medium:
            "The AI has analyzed this claim based on available knowledge and logical reasoning.",
          long: "Our AI fact-checking system has processed this claim using evidence-based analysis and critical thinking frameworks.",
          eli5: "The computer checked this claim using what it knows.",
        },
        evidence: this.formatAIEvidence(response.evidence || []),
        source: "ai-enhanced-analysis",
        reasoning: response.reasoning || "AI-based analysis",
        aiProvider: this.aiService.getProvider(),
        metadata: {
          category: analysis.category,
          key_assertions: analysis.key_assertions,
          prior_plausibility: analysis.prior_plausibility,
          red_flags: analysis.red_flags,
          knowledge_sources: response.knowledge_sources,
          confidence_factors: response.confidence_factors,
          caveats: response.caveats,
          analyzed_at: new Date(),
        },
      };
    } catch (error) {
      console.error("❌ AI fact-checking failed:", error);
      throw new Error(`AI fact-checking failed: ${error.message}`);
    }
  }

  /**
   * Format AI evidence to match expected structure
   */
  formatAIEvidence(aiEvidence) {
    return aiEvidence.map((evidence) => ({
      source: evidence.source || "AI Knowledge Base",
      title: evidence.title || "AI Analysis",
      snippet:
        evidence.snippet || evidence.description || "Evidence from AI analysis",
      url: evidence.url || "https://en.wikipedia.org/wiki/Fact-checking",
      relevanceScore: evidence.relevanceScore || 0.8,
      verdict: evidence.verdict || "neutral",
      factCheckingSite: "AI Analysis",
      scrapedAt: new Date(),
    }));
  }

  /**
   * Combine web scraping and AI results
   */
  combineResults(webResult, aiResult) {
    // Use web scraping verdict if confidence is high, otherwise use AI
    const primaryResult =
      webResult.confidence > aiResult.confidence ? webResult : aiResult;
    const secondaryResult =
      webResult.confidence > aiResult.confidence ? aiResult : webResult;

    return {
      verdict: primaryResult.verdict,
      confidence: Math.max(webResult.confidence, aiResult.confidence),
      explanation: primaryResult.explanation,
      evidence: [...webResult.evidence, ...aiResult.evidence],
      source: "combined-analysis",
      webScrapingData: webResult.webScrapingData,
      aiAnalysis: {
        verdict: aiResult.verdict,
        confidence: aiResult.confidence,
        reasoning: aiResult.reasoning,
        provider: aiResult.aiProvider,
      },
      scrapingSummary: webResult.scrapingSummary,
    };
  }

  /**
   * Simplify explanation for ELI5 format
   */
  simplifyExplanation(explanation) {
    // Simple patterns to make explanations more child-friendly
    return explanation
      .replace(/scientific evidence/gi, "scientists have proven")
      .replace(/well-established/gi, "we know for sure")
      .replace(
        /astronomical observations/gi,
        "looking at space with telescopes"
      )
      .replace(/centuries of/gi, "many years of")
      .replace(/fundamental force/gi, "basic rule of nature")
      .replace(/atmospheric pressure/gi, "air pressure")
      .replace(/conclusively shown/gi, "clearly proven")
      .replace(/medical community/gi, "doctors and scientists");
  }

  /**
   * Get category-specific verification guidelines for enhanced accuracy
   */
  getCategoryGuidelines(category) {
    const guidelines = {
      health_medicine: {
        authorities: [
          "WHO",
          "CDC",
          "NIH",
          "peer-reviewed medical journals",
          "medical consensus",
          "FDA",
        ],
        red_flags: [
          "miracle cure",
          "doctors hate this",
          "big pharma hiding",
          "natural remedy for everything",
          "cures all diseases",
          "secret treatment",
        ],
        confidence_boost:
          "Strong medical consensus and peer-reviewed research increases confidence",
        example_sources: [
          "PubMed",
          "WHO.int",
          "medical journals",
          "CDC.gov",
          "NHS.uk",
        ],
        verification_priority:
          "High - health misinformation can cause direct harm",
        common_tactics: [
          "cherry-picking studies",
          "misrepresenting research",
          "anecdotal evidence",
          "correlation-causation fallacy",
        ],
      },
      science_technology: {
        authorities: [
          "peer-reviewed journals",
          "scientific consensus",
          "research institutions",
          "NASA",
          "established physics",
          "academic papers",
        ],
        red_flags: [
          "defies laws of physics",
          "scientists don't want you to know",
          "revolutionary discovery they're hiding",
          "mainstream science wrong",
        ],
        confidence_boost: "Peer-reviewed research and scientific consensus",
        example_sources: [
          "Scientific journals",
          "NASA",
          "research institutions",
          "Science.org",
          "Nature",
          "arXiv",
        ],
        verification_priority: "High - scientific accuracy is critical",
        common_tactics: [
          "misunderstanding statistics",
          "selective data presentation",
          "false equivalence",
        ],
      },
      politics_government: {
        authorities: [
          "official government records",
          "verified quotes",
          "voting records",
          "court documents",
          "official transcripts",
          "government databases",
        ],
        red_flags: [
          "unnamed sources",
          "secret plan",
          "cover-up",
          "they don't want you to know",
          "deep state",
          "stolen election without evidence",
        ],
        confidence_boost: "Official records and multiple credible news sources",
        example_sources: [
          "Government databases",
          "official transcripts",
          "court records",
          "credible news outlets",
          "fact-checkers",
        ],
        verification_priority:
          "Very High - political misinformation affects democracy",
        common_tactics: [
          "out-of-context quotes",
          "false attribution",
          "misleading statistics",
          "whataboutism",
        ],
      },
      environment_climate: {
        authorities: [
          "IPCC",
          "climate scientists",
          "peer-reviewed climate research",
          "NASA climate data",
          "NOAA",
          "academic consensus",
        ],
        red_flags: [
          "climate hoax",
          "all scientists are lying",
          "natural cycles only",
          "CO2 is good for plants (ignoring harm)",
          "global cooling",
        ],
        confidence_boost: "97%+ scientific consensus on climate topics",
        example_sources: [
          "IPCC reports",
          "climate research",
          "NASA climate",
          "NOAA",
          "peer-reviewed journals",
        ],
        verification_priority:
          "Very High - climate misinformation threatens future",
        common_tactics: [
          "cherry-picking data points",
          "confusing weather and climate",
          "false balance",
        ],
      },
      history: {
        authorities: [
          "historical records",
          "academic historians",
          "primary sources",
          "archaeological evidence",
          "scholarly consensus",
          "archives",
        ],
        red_flags: [
          "secret history",
          "they rewrote history",
          "hidden truth",
          "conspiracy to hide",
          "alternative facts",
        ],
        confidence_boost: "Multiple historical sources and academic consensus",
        example_sources: [
          "Historical archives",
          "academic publications",
          "primary sources",
          "museums",
          "universities",
        ],
        verification_priority:
          "Medium-High - historical accuracy is important for understanding",
        common_tactics: [
          "presentism",
          "selective omission",
          "anachronism",
          "false attribution",
        ],
      },
      economics_business: {
        authorities: [
          "economic data",
          "central banks",
          "financial institutions",
          "academic economists",
          "verified financial reports",
        ],
        red_flags: [
          "get rich quick",
          "secret investment",
          "guaranteed returns",
          "market manipulation claims without evidence",
        ],
        confidence_boost: "Official economic data and expert consensus",
        example_sources: [
          "Federal Reserve",
          "World Bank",
          "IMF",
          "economic journals",
          "official statistics",
        ],
        verification_priority:
          "High - financial misinformation can cause economic harm",
        common_tactics: [
          "misunderstanding economics",
          "correlation without causation",
          "cherry-picked timeframes",
        ],
      },
    };

    return (
      guidelines[category] || {
        authorities: [
          "credible sources",
          "expert consensus",
          "authoritative data",
          "verified information",
        ],
        red_flags: [
          "too good to be true",
          "conspiracy language",
          "emotional manipulation",
          "unnamed sources",
        ],
        confidence_boost: "Multiple independent credible sources",
        example_sources: [
          "Authoritative sources",
          "fact-checking sites",
          "credible publications",
          "expert analysis",
        ],
        verification_priority:
          "Medium - general claims require standard verification",
        common_tactics: [
          "emotional appeal",
          "false dichotomy",
          "straw man arguments",
          "ad hominem",
        ],
      }
    );
  }

  /**
   * Get verification statistics
   */
  getStats() {
    return {
      scientificFactsCount: this.scientificFacts.length,
      aiConfigured: this.aiService.isConfigured(),
      aiProvider: this.aiService.getProvider(),
      webScrapingEnabled: true,
      categoriesSupported: [
        "health_medicine",
        "science_technology",
        "politics_government",
        "environment_climate",
        "history",
        "economics_business",
        "other",
      ],
    };
  }
}

module.exports = new EnhancedVerificationService();
