const express = require("express");
const Claim = require("../models/Claim");
const User = require("../models/User");
const { authenticateToken } = require("./auth");
const ComprehensiveVerificationService = require("../services/ComprehensiveVerificationService");

const router = express.Router();

// Submit user verification
router.post("/submit", authenticateToken, async (req, res) => {
  try {
    const { claimId, verdict, evidence, explanation } = req.body;

    const claim = await Claim.findById(claimId);
    if (!claim) {
      return res.status(404).json({ error: "Claim not found" });
    }

    const user = await User.findById(req.user.userId);

    // Add user's verification
    claim.verdict = verdict;
    if (evidence) claim.evidence.push(...evidence);
    if (explanation) claim.explanation = explanation;
    claim.verifiedBy = user._id;
    claim.verifiedAt = new Date();
    claim.verificationStatus = "verified";

    await claim.save();

    // Update user stats
    user.stats.verificationsSubmitted++;
    await user.save();

    res.json({ message: "Verification submitted", claim });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Vote on verification (community feedback)
router.post("/vote", authenticateToken, async (req, res) => {
  try {
    const { claimId, helpful } = req.body;

    const claim = await Claim.findById(claimId);
    if (!claim) {
      return res.status(404).json({ error: "Claim not found" });
    }

    // Track votes (simplified - in production, use separate collection)
    if (!claim.votes) claim.votes = { helpful: 0, notHelpful: 0 };

    if (helpful) {
      claim.votes.helpful++;
    } else {
      claim.votes.notHelpful++;
    }

    await claim.save();

    res.json({ message: "Vote recorded", votes: claim.votes });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Get verification history
router.get("/history", authenticateToken, async (req, res) => {
  try {
    const claims = await Claim.find({ verifiedBy: req.user.userId })
      .sort({ verifiedAt: -1 })
      .limit(50);

    res.json(claims);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// AI-powered claim verification with ML and web scraping
router.post("/verify-claim", async (req, res) => {
  try {
    const { claim, category = "other", aiOnly = false } = req.body;

    if (!claim || claim.trim().length === 0) {
      return res.status(400).json({ error: "Claim text is required" });
    }

    console.log(
      `🔍 Verifying claim: "${claim.substring(
        0,
        50
      )}..." in category: ${category}, aiOnly: ${aiOnly}`
    );

    // Use comprehensive verification service
    const result = await ComprehensiveVerificationService.verifyClaim(
      claim,
      category,
      { aiOnly }
    );

    console.log("✅ Verification completed, result:", {
      verdict: result.verdict,
      confidence: result.confidence,
      classification: result.classification,
    });

    res.json({
      success: true,
      result,
      message: "Claim verification completed",
    });
  } catch (error) {
    console.error("❌ Claim verification failed:", error);
    res.status(500).json({
      success: false,
      error: error.message,
      result: ComprehensiveVerificationService.getFallbackResult(
        req.body.claim || "",
        error.message
      ),
    });
  }
});

// Get verification service status
router.get("/status", async (req, res) => {
  try {
    const status = ComprehensiveVerificationService.getStatus();
    res.json(status);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Initialize ML models (admin endpoint)
router.post("/initialize-ml", async (req, res) => {
  try {
    const MLVerificationService = require("../services/MLVerificationService");
    const initialized = await MLVerificationService.initializeModels();

    res.json({
      success: initialized,
      message: initialized
        ? "ML models initialized successfully"
        : "Failed to initialize ML models",
    });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

module.exports = router;
