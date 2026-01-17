// Misinformation Detector - Content Script
// Handles text selection, UI display, and user interactions on web pages

console.log("🚀 Misinformation Detector content script starting...");

let verificationBox = null;
let currentSelection = null;
let isProcessing = false;
let quickVerifyButton = null;

// Initialize after DOM is ready
if (document.readyState === "loading") {
  document.addEventListener("DOMContentLoaded", initializeExtension);
} else {
  initializeExtension();
}

function initializeExtension() {
  console.log("🎯 Initializing Misinformation Detector...");

  // Listen for text selection
  document.addEventListener("mouseup", handleTextSelection);
  document.addEventListener("keyup", handleTextSelection);

  console.log("✅ Event listeners attached");
}

// Listen for messages from popup/background
chrome.runtime.onMessage.addListener((request, sender, sendResponse) => {
  if (request.action === "verifySelection") {
    verifySelectedText();
  }
});

function handleTextSelection(event) {
  // If the mouse event originated from the verify button, ignore it
  if (event && event.target) {
    const target = event.target;
    if (
      (target.id && target.id === "misinfo-verify-btn") ||
      (typeof target.closest === "function" &&
        target.closest("#misinfo-verify-btn"))
    ) {
      return; // Do not clear selection or remove the button when clicking it
    }
  }

  const selectedText = window.getSelection().toString().trim();

  // Only show button for meaningful text selections (10+ characters)
  if (selectedText && selectedText.length >= 10) {
    currentSelection = {
      text: selectedText,
      range: window.getSelection().getRangeAt(0),
      timestamp: Date.now(),
    };

    // Show floating verify button near selection
    showQuickVerifyButton(event);
  } else {
    removeQuickVerifyButton();
    currentSelection = null;
  }
}

function showQuickVerifyButton(event) {
  // Remove existing button
  removeQuickVerifyButton();

  const selection = window.getSelection();
  if (!selection.rangeCount) return;

  const range = selection.getRangeAt(0);
  const rect = range.getBoundingClientRect();

  // Create floating verify button
  const button = document.createElement("div");
  button.id = "misinfo-verify-btn";
  button.className = "misinfo-verify-button";
  button.innerHTML = `
    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
      <path d="M9 11l3 3L22 4"></path>
      <path d="M21 12v7a2 2 0 01-2 2H5a2 2 0 01-2-2V5a2 2 0 012-2h11"></path>
    </svg>
    <span>Verify Fact</span>
  `;

  // Position near selected text
  button.style.position = "absolute";
  button.style.left = `${rect.left + window.scrollX}px`;
  button.style.top = `${rect.bottom + window.scrollY + 5}px`;
  button.style.zIndex = "2147483647"; // Maximum z-index

  button.addEventListener("click", (e) => {
    e.preventDefault();
    e.stopPropagation();
    verifySelectedText();
  });
  // Prevent default on mousedown so the selection isn't lost before click
  button.addEventListener("mousedown", (e) => {
    e.preventDefault();
    e.stopPropagation();
  });

  document.body.appendChild(button);
  quickVerifyButton = button;

  // Auto-hide after 10 seconds
  setTimeout(() => {
    if (quickVerifyButton === button) {
      removeQuickVerifyButton();
    }
  }, 10000);
}

function removeQuickVerifyButton() {
  if (quickVerifyButton) {
    quickVerifyButton.remove();
    quickVerifyButton = null;
  }
}

async function verifySelectedText() {
  console.log("🎯 verifySelectedText called");

  if (!currentSelection) {
    console.error("❌ No current selection");
    return;
  }

  if (isProcessing) {
    console.log("⏳ Already processing, skipping");
    return;
  }

  removeQuickVerifyButton();
  isProcessing = true;

  console.log(
    "📝 Selected text:",
    currentSelection.text.substring(0, 100) + "..."
  );

  // Show loading box immediately
  showVerificationBox({
    status: "loading",
    text: currentSelection.text,
  });

  try {
    console.log("🔍 Sending verification request to background script...");

    // Send to background script for API call
    const response = await chrome.runtime.sendMessage({
      action: "verifyClaim",
      text: currentSelection.text,
    });

    console.log("✅ Verification response received:", response);

    if (response.error) {
      throw new Error(response.error);
    }

    // Show results
    console.log("📊 Showing results in UI...");
    showVerificationBox({
      status: "complete",
      text: currentSelection.text,
      result: response,
    });
  } catch (error) {
    console.error("❌ Verification error:", error);
    showVerificationBox({
      status: "error",
      text: currentSelection.text,
      error: error.message || "Unknown error occurred",
    });
  } finally {
    isProcessing = false;
    console.log("✅ Verification complete");
  }
}

function showVerificationBox(data) {
  // Remove existing box
  if (verificationBox) {
    verificationBox.remove();
  }

  // Create verification box
  const box = document.createElement("div");
  box.id = "misinfo-verification-box";
  box.className = "misinfo-box";

  // Position near selected text (or center of screen if no selection)
  const selection = window.getSelection();
  let rect = {
    left: window.innerWidth / 2 - 200,
    top: window.scrollY + 100,
    bottom: window.scrollY + 120,
  };

  if (selection.rangeCount > 0) {
    const selectionRect = selection.getRangeAt(0).getBoundingClientRect();
    rect = {
      left: Math.max(10, Math.min(selectionRect.left, window.innerWidth - 420)),
      top: selectionRect.bottom + window.scrollY + 10,
      bottom: selectionRect.bottom + window.scrollY + 10,
    };
  }

  box.style.position = "absolute";
  box.style.left = `${rect.left + window.scrollX}px`;
  box.style.top = `${rect.top}px`;

  // Generate content based on status
  if (data.status === "loading") {
    box.innerHTML = generateLoadingContent(data.text);
  } else if (data.status === "complete") {
    box.innerHTML = generateResultContent(data.result, data.text);
  } else if (data.status === "error") {
    box.innerHTML = generateErrorContent(data.error);
  }

  document.body.appendChild(box);
  verificationBox = box;

  // Add event handlers
  setupBoxEventHandlers(box);

  // Make box draggable
  makeDraggable(box);

  // Animate entrance
  setTimeout(() => box.classList.add("visible"), 10);
}

function setupBoxEventHandlers(box) {
  // Close button
  const closeBtn = box.querySelector(".misinfo-close-btn");
  if (closeBtn) {
    closeBtn.addEventListener("click", () => {
      box.classList.remove("visible");
      setTimeout(() => {
        box.remove();
        verificationBox = null;
      }, 200);
    });
  }

  // Evidence links
  const links = box.querySelectorAll(".misinfo-evidence-list a");
  links.forEach((link) => {
    link.addEventListener("click", (e) => {
      e.stopPropagation();
    });
  });

  // Expand/collapse sections
  const expandButtons = box.querySelectorAll(".expand-toggle");
  expandButtons.forEach((btn) => {
    btn.addEventListener("click", () => {
      const section = btn.closest(".expandable-section");
      section.classList.toggle("expanded");
    });
  });
}

function generateLoadingContent(text) {
  return `
    <div class="misinfo-header loading">
      <div class="misinfo-spinner"></div>
      <h3>Analyzing Claim...</h3>
      <button class="misinfo-close-btn" title="Close">×</button>
    </div>
    <div class="misinfo-content">
      <div class="misinfo-claim-section">
        <strong>Selected Text:</strong>
        <p class="misinfo-claim-text">"${escapeHtml(
          truncateText(text, 150)
        )}"</p>
      </div>
      
      <div class="misinfo-loading-steps">
        <div class="step active">
          <span class="step-icon">🔍</span>
          <span>Searching fact-check databases...</span>
        </div>
        <div class="step">
          <span class="step-icon">🌐</span>
          <span>Scraping credible sources...</span>
        </div>
        <div class="step">
          <span class="step-icon">🤖</span>
          <span>AI analysis in progress...</span>
        </div>
        <div class="step">
          <span class="step-icon">📊</span>
          <span>Calculating confidence score...</span>
        </div>
      </div>
      
      <div class="loading-tip">
        <small>💡 Tip: Our AI analyzes claims it's never seen before using logic, evidence, and credible sources.</small>
      </div>
    </div>
  `;
}

function generateResultContent(result, text) {
  const verdict = result.result?.verdict || result.verdict || "unverified";
  const confidence = result.result?.confidence || result.confidence || 0;
  const explanation = result.result?.explanation || result.explanation || {};
  const evidence = result.result?.evidence || result.evidence || [];
  const reasoning = result.result?.reasoning || result.reasoning || "";
  const metadata = result.result?.metadata || result.metadata || {};

  const verdictInfo = getVerdictInfo(verdict);
  const confidencePercent = Math.round(confidence * 100);

  return `
    <div class="misinfo-header ${verdictInfo.class}">
      <span class="misinfo-verdict-icon">${verdictInfo.icon}</span>
      <div class="header-content">
        <h3>${verdictInfo.title}</h3>
        <p class="verdict-subtitle">${verdictInfo.subtitle}</p>
      </div>
      <button class="misinfo-close-btn" title="Close">×</button>
    </div>
    
    <div class="misinfo-content">
      <div class="misinfo-claim-section">
        <strong>Analyzed Claim:</strong>
        <p class="misinfo-claim-text">"${escapeHtml(
          truncateText(text, 200)
        )}"</p>
      </div>
      
      <div class="misinfo-verdict-section">
        <div class="confidence-label">
          <strong>Confidence Level:</strong>
          <span class="confidence-value">${confidencePercent}%</span>
        </div>
        <div class="misinfo-confidence-bar">
          <div class="misinfo-confidence-fill ${verdictInfo.class}" 
               style="width: ${confidencePercent}%"
               data-confidence="${confidencePercent}">
          </div>
        </div>
        <div class="confidence-interpretation">
          ${getConfidenceInterpretation(confidencePercent, verdict)}
        </div>
      </div>
      
      <div class="misinfo-explanation-section">
        <strong>📝 Analysis:</strong>
        <p class="explanation-text">${escapeHtml(
          explanation.medium ||
            explanation.short ||
            "No detailed explanation available."
        )}</p>
        
        ${
          explanation.long && explanation.long !== explanation.medium
            ? `
          <div class="expandable-section">
            <button class="expand-toggle">Show detailed analysis ▼</button>
            <div class="expanded-content">
              <p>${escapeHtml(explanation.long)}</p>
            </div>
          </div>
        `
            : ""
        }
      </div>
      
      ${
        reasoning
          ? `
        <div class="misinfo-reasoning-section">
          <strong>🧠 Reasoning Process:</strong>
          <p class="reasoning-text">${escapeHtml(reasoning)}</p>
        </div>
      `
          : ""
      }
      
      ${
        evidence.length > 0
          ? `
        <div class="misinfo-evidence-section">
          <strong>📚 Evidence Sources (${evidence.length}):</strong>
          <ul class="misinfo-evidence-list">
            ${evidence
              .slice(0, 5)
              .map(
                (e, i) => `
              <li class="evidence-item">
                <div class="evidence-header">
                  <span class="evidence-number">${i + 1}</span>
                  <a href="${
                    e.url
                  }" target="_blank" rel="noopener noreferrer" class="evidence-source">
                    ${escapeHtml(e.source || e.title || "Source")}
                    <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor">
                      <path d="M18 13v6a2 2 0 01-2 2H5a2 2 0 01-2-2V8a2 2 0 012-2h6M15 3h6v6M10 14L21 3"/>
                    </svg>
                  </a>
                </div>
                ${
                  e.snippet
                    ? `
                  <p class="evidence-snippet">${escapeHtml(
                    truncateText(e.snippet, 120)
                  )}</p>
                `
                    : ""
                }
                ${
                  e.relevanceScore
                    ? `
                  <div class="relevance-bar">
                    <div class="relevance-fill" style="width: ${Math.round(
                      e.relevanceScore * 100
                    )}%"></div>
                  </div>
                `
                    : ""
                }
              </li>
            `
              )
              .join("")}
          </ul>
          ${
            evidence.length > 5
              ? `
            <p class="more-evidence">+${
              evidence.length - 5
            } more sources available</p>
          `
              : ""
          }
        </div>
      `
          : `
        <div class="no-evidence-section">
          <p>⚠️ No external evidence sources found. Analysis based on AI reasoning and general knowledge.</p>
        </div>
      `
      }
      
      ${
        metadata.caveats
          ? `
        <div class="misinfo-caveats-section">
          <strong>⚠️ Important Context:</strong>
          <p>${escapeHtml(metadata.caveats)}</p>
        </div>
      `
          : ""
      }
      
      <div class="misinfo-footer">
        <div class="footer-info">
          <small>🤖 Powered by AI-Enhanced Fact Checking</small>
          <small>✨ Works on any claim, trained or untrained</small>
        </div>
        ${
          metadata.analyzed_at
            ? `
          <small class="timestamp">Analyzed: ${new Date(
            metadata.analyzed_at
          ).toLocaleTimeString()}</small>
        `
            : ""
        }
      </div>
    </div>
  `;
}

function generateErrorContent(error) {
  const isServerError =
    error.includes("connect") ||
    error.includes("fetch") ||
    error.includes("network");

  return `
    <div class="misinfo-header error">
      <span class="misinfo-verdict-icon">⚠️</span>
      <div class="header-content">
        <h3>Verification Error</h3>
        <p class="verdict-subtitle">Unable to verify claim</p>
      </div>
      <button class="misinfo-close-btn" title="Close">×</button>
    </div>
    <div class="misinfo-content">
      <div class="error-details">
        <p class="error-message">${escapeHtml(error)}</p>
        
        ${
          isServerError
            ? `
          <div class="error-help">
            <strong>Troubleshooting Steps:</strong>
            <ol>
              <li>Make sure the backend server is running on <code>http://localhost:5000</code></li>
              <li>Check that your <code>.env</code> file has <code>GEMINI_API_KEY</code> or <code>OPENAI_API_KEY</code></li>
              <li>Restart the server and try again</li>
            </ol>
            <p>Need help? Check the server console for error messages.</p>
          </div>
        `
            : `
          <div class="error-help">
            <p><strong>What happened?</strong></p>
            <p>The verification process encountered an unexpected error. This might be temporary.</p>
            <p>Please try again in a moment.</p>
          </div>
        `
        }
      </div>
    </div>
  `;
}

function getVerdictInfo(verdict) {
  const verdictMap = {
    supported: {
      icon: "✅",
      title: "Likely True",
      subtitle: "Evidence supports this claim",
      class: "verdict-true",
    },
    true: {
      icon: "✅",
      title: "True",
      subtitle: "Strong evidence confirms this",
      class: "verdict-true",
    },
    refuted: {
      icon: "❌",
      title: "Likely False",
      subtitle: "Evidence contradicts this claim",
      class: "verdict-false",
    },
    false: {
      icon: "❌",
      title: "False",
      subtitle: "This claim is not supported",
      class: "verdict-false",
    },
    misleading: {
      icon: "⚠️",
      title: "Misleading",
      subtitle: "Partially true but lacks context",
      class: "verdict-mixed",
    },
    mixed: {
      icon: "⚠️",
      title: "Mixed Evidence",
      subtitle: "Contains both true and false elements",
      class: "verdict-mixed",
    },
    not_enough_info: {
      icon: "❓",
      title: "Unverified",
      subtitle: "Insufficient evidence to determine",
      class: "verdict-unverified",
    },
    unverified: {
      icon: "❓",
      title: "Unverified",
      subtitle: "Cannot be confirmed or denied",
      class: "verdict-unverified",
    },
  };

  return verdictMap[verdict] || verdictMap["unverified"];
}

function getConfidenceInterpretation(confidence, verdict) {
  if (confidence >= 90) {
    return '<span class="confidence-high">Very High Confidence</span> - Multiple authoritative sources agree';
  } else if (confidence >= 75) {
    return '<span class="confidence-high">High Confidence</span> - Strong evidence from credible sources';
  } else if (confidence >= 60) {
    return '<span class="confidence-medium">Moderate Confidence</span> - Some evidence available';
  } else if (confidence >= 40) {
    return '<span class="confidence-low">Low Confidence</span> - Limited evidence found';
  } else {
    return '<span class="confidence-low">Very Low Confidence</span> - Insufficient evidence';
  }
}

function truncateText(text, maxLength) {
  if (!text) return "";
  if (text.length <= maxLength) return text;
  return text.substring(0, maxLength) + "...";
}

function escapeHtml(text) {
  if (!text) return "";
  const div = document.createElement("div");
  div.textContent = text;
  return div.innerHTML;
}

function makeDraggable(element) {
  let isDragging = false;
  let currentX, currentY, initialX, initialY;

  const header = element.querySelector(".misinfo-header");
  header.style.cursor = "move";
  header.title = "Drag to move";

  header.addEventListener("mousedown", dragStart);
  document.addEventListener("mousemove", drag);
  document.addEventListener("mouseup", dragEnd);

  function dragStart(e) {
    if (
      e.target.classList.contains("misinfo-close-btn") ||
      e.target.closest(".misinfo-close-btn")
    ) {
      return;
    }

    isDragging = true;
    initialX = e.clientX - element.offsetLeft;
    initialY = e.clientY - element.offsetTop;
    element.style.cursor = "grabbing";
  }

  function drag(e) {
    if (!isDragging) return;

    e.preventDefault();
    currentX = e.clientX - initialX;
    currentY = e.clientY - initialY;

    // Keep within viewport bounds
    const maxX = window.innerWidth - element.offsetWidth - 20;
    const maxY =
      window.innerHeight + window.scrollY - element.offsetHeight - 20;

    currentX = Math.max(10, Math.min(currentX, maxX));
    currentY = Math.max(window.scrollY + 10, Math.min(currentY, maxY));

    element.style.left = currentX + "px";
    element.style.top = currentY + "px";
  }

  function dragEnd() {
    isDragging = false;
    element.style.cursor = "";
    header.style.cursor = "move";
  }
}

// Clean up on page unload
window.addEventListener("beforeunload", () => {
  removeQuickVerifyButton();
  if (verificationBox) {
    verificationBox.remove();
  }
});

console.log("🔍 Misinformation Detector extension loaded and ready!");
