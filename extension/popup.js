// Misinformation Detector - Popup Script

// Verify button click handler
document.getElementById("verifyBtn").addEventListener("click", async () => {
  try {
    // Get active tab
    const [tab] = await chrome.tabs.query({
      active: true,
      currentWindow: true,
    });

    // Send message to content script to verify selected text
    chrome.tabs.sendMessage(tab.id, { action: "verifySelection" });

    // Close popup after sending command
    window.close();
  } catch (error) {
    console.error("Error sending verification command:", error);
  }
});

// Help link
document.getElementById("helpLink").addEventListener("click", (e) => {
  e.preventDefault();
  alert(`Misinformation Detector - Help

How to use:
1. Navigate to any webpage
2. Select text you want to fact-check
3. Click the "Verify Fact" button that appears
4. View the analysis results

Features:
• AI-powered fact checking
• Real-time web scraping
• Works on any claim (trained or untrained)
• Evidence-based verdicts
• Confidence scoring

Troubleshooting:
• If verification fails, ensure the backend server is running
• Check that your .env file has GEMINI_API_KEY or OPENAI_API_KEY
• Restart the server if needed

The extension works on completely new claims using advanced AI reasoning!`);
});

// Settings link
document.getElementById("settingsLink").addEventListener("click", (e) => {
  e.preventDefault();
  alert(`Settings

API Endpoint Configuration:
The extension automatically detects your backend server at:
• http://localhost:5000/api (primary)
• http://127.0.0.1:5000/api (fallback)

Server Requirements:
• Node.js backend running
• AI API key configured (GEMINI_API_KEY or OPENAI_API_KEY)
• All dependencies installed

For advanced configuration, edit the server .env file.`);
});

// About link
document.getElementById("aboutLink").addEventListener("click", (e) => {
  e.preventDefault();
  alert(`About Misinformation Detector

Version: 1.0.0
Type: AI-Enhanced Fact Checking Extension

This extension uses advanced AI and web scraping to verify claims in real-time. It works on ANY text, whether it's in the training data or completely new.

Technology Stack:
• AI: Google Gemini / OpenAI GPT
• Backend: Node.js + Express
• ML: Natural Language Inference models
• Web Scraping: Multiple fact-checking sites

Key Features:
✓ Works on unseen/unexpected data
✓ Real-time verification
✓ Evidence-based analysis
✓ Confidence scoring
✓ Multiple verification sources

Created with ❤️ for fighting misinformation`);
});

// Check server status on popup load
async function checkServerStatus() {
  const statusIcon = document.getElementById("statusIcon");

  try {
    const endpoints = [
      "http://localhost:5000/api/verification/status",
      "http://127.0.0.1:5000/api/verification/status",
    ];

    for (const endpoint of endpoints) {
      try {
        const response = await fetch(endpoint, {
          method: "GET",
          signal: AbortSignal.timeout(2000),
        });

        if (response.ok) {
          statusIcon.textContent = "✅";
          statusIcon.parentElement.querySelector(".stat-label").textContent =
            "Online";
          return;
        }
      } catch (err) {
        continue;
      }
    }

    // No server found
    statusIcon.textContent = "⚠️";
    statusIcon.parentElement.querySelector(".stat-label").textContent =
      "Server Offline";
  } catch (error) {
    statusIcon.textContent = "❌";
    statusIcon.parentElement.querySelector(".stat-label").textContent = "Error";
  }
}

// Check status when popup opens
checkServerStatus();

console.log("🔍 Misinformation Detector popup loaded");
