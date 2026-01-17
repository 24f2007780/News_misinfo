// Misinformation Detector - Background Service Worker
// Handles API communication and message passing

// Configuration - automatically detects server URL
const API_ENDPOINTS = [
  "http://localhost:5000/api",
  "http://127.0.0.1:5000/api",
  "http://localhost:3000/api",
];

let activeApiUrl = null;

// Verify which API endpoint is available
async function detectApiEndpoint() {
  if (activeApiUrl) return activeApiUrl;

  for (const endpoint of API_ENDPOINTS) {
    try {
      const response = await fetch(`${endpoint}/verification/status`, {
        method: "GET",
        signal: AbortSignal.timeout(2000),
      });

      if (response.ok) {
        activeApiUrl = endpoint;
        console.log("✅ Active API endpoint detected:", endpoint);
        return endpoint;
      }
    } catch (error) {
      // Try next endpoint
      continue;
    }
  }

  // Default to first endpoint if none respond
  activeApiUrl = API_ENDPOINTS[0];
  console.warn("⚠️ No API endpoint responded, using default:", activeApiUrl);
  return activeApiUrl;
}

// Listen for messages from content script
chrome.runtime.onMessage.addListener((request, sender, sendResponse) => {
  if (request.action === "verifyClaim") {
    // Handle async verification
    verifyClaim(request.text)
      .then(sendResponse)
      .catch((error) => {
        console.error("Verification error:", error);
        sendResponse({
          error: error.message || "Verification failed",
          details: error.toString(),
        });
      });
    return true; // Keep channel open for async response
  }
});

/**
 * Verify a claim using the comprehensive verification API
 */
async function verifyClaim(claimText) {
  try {
    console.log(
      "🔍 Background: Verifying claim:",
      claimText.substring(0, 50) + "..."
    );

    // Detect available API endpoint
    const apiBaseUrl = await detectApiEndpoint();

    // Primary endpoint: Comprehensive verification (best for unseen data)
    const primaryEndpoint = `${apiBaseUrl}/verification/verify-claim`;

    try {
      console.log("📡 Calling primary verification endpoint...");
      const response = await fetch(primaryEndpoint, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          claim: claimText,
          category: detectCategory(claimText),
          aiOnly: true, // Force AI-only verification
        }),
        signal: AbortSignal.timeout(15000), // 15 second timeout
      });

      if (!response.ok) {
        const errorText = await response.text();
        console.error(
          "❌ Primary endpoint failed:",
          response.status,
          errorText
        );
        throw new Error(`Server error: ${response.status} - ${errorText}`);
      }

      const data = await response.json();
      console.log("✅ Primary verification successful:", data);

      return formatVerificationResult(data);
    } catch (primaryError) {
      console.warn(
        "⚠️ Primary endpoint failed, trying fallback...",
        primaryError.message
      );

      // Fallback endpoint: Quick verify
      const fallbackEndpoint = `${apiBaseUrl}/claims/quick-verify`;

      try {
        const fallbackResponse = await fetch(fallbackEndpoint, {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({ text: claimText }),
          signal: AbortSignal.timeout(45000),
        });

        if (fallbackResponse.ok) {
          const fallbackData = await fallbackResponse.json();
          console.log("✅ Fallback verification successful");
          return formatVerificationResult(fallbackData);
        }

        throw new Error("Fallback endpoint also failed");
      } catch (fallbackError) {
        console.error("❌ Both endpoints failed");
        throw new Error(getDetailedErrorMessage(primaryError, fallbackError));
      }
    }
  } catch (error) {
    console.error("❌ Verification error:", error);
    throw new Error(getDetailedErrorMessage(error));
  }
}

/**
 * Format verification result to standardized format
 */
function formatVerificationResult(data) {
  // Handle both response formats
  const result = data.result || data;

  return {
    success: true,
    result: {
      verdict: result.verdict || "unverified",
      confidence: result.confidence || 0.5,
      explanation: result.explanation || {
        short: "Verification completed",
        medium: "The claim has been analyzed.",
        long: "Our AI system has processed this claim.",
        eli5: "We checked this claim for you.",
      },
      evidence: result.evidence || [],
      reasoning: result.reasoning || "",
      metadata: {
        analyzed_at: new Date().toISOString(),
        source: result.source || "api",
        pipeline: result.pipeline || {},
        aiAnalysis: result.aiAnalysis || {},
        scrapingSummary: result.scrapingSummary || {},
        caveats: result.metadata?.caveats || result.caveats || null,
      },
    },
  };
}

/**
 * Detect claim category for better verification
 */
function detectCategory(claimText) {
  const text = claimText.toLowerCase();

  // Health & Medicine
  if (
    text.match(
      /vaccine|disease|health|medical|doctor|medicine|covid|virus|treatment|cure|symptom/i
    )
  ) {
    return "health_medicine";
  }

  // Science & Technology
  if (
    text.match(
      /science|research|study|experiment|technology|physics|chemistry|biology|space|nasa|ai|artificial intelligence|quantum/i
    )
  ) {
    return "science_technology";
  }

  // Politics & Governance
  if (
    text.match(
      /president|government|election|vote|congress|senator|political|policy|law|parliament|minister|governance/i
    )
  ) {
    return "politics_governance";
  }

  // Environment & Climate
  if (
    text.match(
      /climate|environment|global warming|pollution|carbon|emission|renewable|fossil|deforestation/i
    )
  ) {
    return "environment_climate";
  }

  // Economics & Finance
  if (
    text.match(
      /economy|inflation|gdp|unemployment|stock|market|bank|interest rate|recession|finance|currency/i
    )
  ) {
    return "economics_finance";
  }

  // Food & Nutrition
  if (text.match(/diet|calorie|vitamin|nutrition|food|supplement/i)) {
    return "food_nutrition";
  }

  // Social & Cultural (includes history)
  if (
    text.match(
      /culture|society|demographic|religion|ethnic|history|historical|ancient|century|war|tradition|social/i
    )
  ) {
    return "social_cultural";
  }

  // Entertainment & Media
  if (
    text.match(/movie|film|tv|series|celebrity|music|media|viral|influencer/i)
  ) {
    return "entertainment_media";
  }

  // Sports
  if (
    text.match(
      /match|tournament|league|football|soccer|basketball|cricket|olympic|athlete|score/i
    )
  ) {
    return "sports";
  }

  // Technology & Cybersecurity
  if (
    text.match(
      /cyber|hacker|malware|ransomware|breach|data leak|password|phishing|cybersecurity/i
    )
  ) {
    return "technology_cybersecurity";
  }

  // Default
  return "other";
}

/**
 * Generate detailed error message for user
 */
function getDetailedErrorMessage(error, fallbackError = null) {
  const errorMsg = error.message || error.toString();

  // Network/Connection errors
  if (
    errorMsg.includes("fetch") ||
    errorMsg.includes("network") ||
    errorMsg.includes("Failed to fetch")
  ) {
    return "Cannot connect to verification server. Please ensure the backend is running on http://localhost:5000";
  }

  // Timeout errors
  if (errorMsg.includes("timeout") || errorMsg.includes("aborted")) {
    return "Verification timed out. The server might be overloaded or the claim is too complex. Please try again.";
  }

  // API configuration errors
  if (errorMsg.includes("not configured") || errorMsg.includes("API key")) {
    return "AI service not configured. Please add GEMINI_API_KEY or OPENAI_API_KEY to your server .env file.";
  }

  // Server errors
  if (errorMsg.includes("500") || errorMsg.includes("Server error")) {
    return "Server error occurred during verification. Check server logs for details.";
  }

  // Generic error
  return `Verification failed: ${errorMsg}`;
}

// Handle extension icon click
chrome.action.onClicked.addListener((tab) => {
  chrome.tabs.sendMessage(tab.id, { action: "verifySelection" });
});

// Initialize on install
chrome.runtime.onInstalled.addListener(() => {
  console.log("🔍 Misinformation Detector extension installed!");
  console.log("📡 Will auto-detect API endpoint on first use");
});

// Detect API endpoint on startup
detectApiEndpoint().then((endpoint) => {
  console.log("✅ Extension ready. API endpoint:", endpoint);
});

console.log("🚀 Misinformation Detector background service worker active");
