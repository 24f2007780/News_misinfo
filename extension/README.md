# 🔍 Misinformation Detector - Browser Extension

**AI-Powered Fact Checking for Everyone**

Verify facts and detect misinformation in real-time using advanced AI analysis. This extension works on **ANY claim**, whether it's in our training data or completely new and unseen!

![Version](https://img.shields.io/badge/version-1.0.0-blue)
![AI Powered](https://img.shields.io/badge/AI-Enhanced-green)
![Works Offline](https://img.shields.io/badge/Unseen%20Data-Supported-orange)

---

## ✨ Features

### 🤖 **Advanced AI Analysis**

- Uses Google Gemini or OpenAI GPT for intelligent fact-checking
- Multi-stage reasoning process for accurate verdicts
- Works on claims it has never encountered before

### 🌐 **Real-Time Web Scraping**

- Searches multiple fact-checking sites (Snopes, PolitiFact, AFP, etc.)
- Gathers fresh evidence from credible sources
- Cross-references multiple sources automatically

### 🎯 **Works on Unseen Data**

- **No training required** - analyzes completely new claims
- Uses logical reasoning and critical thinking frameworks
- Evaluates evidence quality and source credibility

### 📊 **Comprehensive Results**

- Confidence scores with interpretation
- Evidence sources with links
- Step-by-step reasoning explanation
- Context and caveats when appropriate

### 🎨 **Beautiful User Interface**

- Clean, modern design
- Draggable verification box
- Smooth animations
- Dark mode support

---

## 📋 Requirements

### Backend Server

- Node.js (v14 or higher)
- Running server on `http://localhost:5000`
- AI API key (GEMINI_API_KEY or OPENAI_API_KEY)

### Browser

- Google Chrome (v88+)
- Microsoft Edge (v88+)
- Any Chromium-based browser

---

## 🚀 Installation Guide

### Step 1: Generate Extension Icons

1. Open `extension/icons/generate-icons.html` in your browser
2. Click "Download All Icons" button
3. Save all three PNG files (`icon16.png`, `icon48.png`, `icon128.png`) to the `extension/icons/` directory

### Step 2: Ensure Backend is Running

1. Make sure your backend server is running:

   ```bash
   cd Missinformation
   npm start
   ```

2. Verify the server is accessible at `http://localhost:5000`

3. Ensure you have an AI API key configured in your `.env` file:
   ```env
   GEMINI_API_KEY=your_gemini_api_key_here
   # OR
   OPENAI_API_KEY=your_openai_api_key_here
   ```

### Step 3: Load Extension in Browser

#### Chrome/Edge:

1. Open your browser and navigate to:

   - **Chrome**: `chrome://extensions/`
   - **Edge**: `edge://extensions/`

2. Enable **"Developer mode"** (toggle in top-right corner)

3. Click **"Load unpacked"** button

4. Navigate to and select the `Missinformation/extension` folder

5. The extension should now appear in your extensions list! 🎉

### Step 4: Verify Installation

1. You should see the extension icon in your browser toolbar
2. Click the icon to open the popup and check status
3. Navigate to any webpage and select some text
4. A "Verify Fact" button should appear near your selection
5. Click it to test the fact-checking functionality!

---

## 💡 How to Use

### Method 1: Quick Verify Button (Recommended)

1. **Navigate** to any webpage
2. **Select** text you want to fact-check (minimum 10 characters)
3. **Click** the "Verify Fact" button that appears near your selection
4. **View** the analysis results in the popup box

### Method 2: Extension Icon

1. **Select** text on any webpage
2. **Click** the extension icon in your toolbar
3. **Click** "Verify Selected Text Now" in the popup
4. **View** the results

### Understanding Results

**Verdict Types:**

- ✅ **True/Supported** - Strong evidence confirms the claim
- ❌ **False/Refuted** - Strong evidence contradicts the claim
- ⚠️ **Misleading/Mixed** - Partially true but lacks context
- ❓ **Unverified** - Insufficient evidence to determine

**Confidence Levels:**

- **90-100%** - Very High Confidence
- **75-89%** - High Confidence
- **60-74%** - Moderate Confidence
- **40-59%** - Low Confidence
- **0-39%** - Very Low Confidence

---

## 🔧 Configuration

### API Endpoint Configuration

The extension automatically detects your backend server. It tries these endpoints in order:

1. `http://localhost:5000/api`
2. `http://127.0.0.1:5000/api`
3. `http://localhost:3000/api`

To use a different endpoint, edit `background.js`:

```javascript
const API_ENDPOINTS = [
  "http://your-custom-endpoint/api",
  "http://localhost:5000/api",
];
```

### Timeout Settings

Default timeout is 45 seconds. To adjust, edit `background.js`:

```javascript
signal: AbortSignal.timeout(45000); // milliseconds
```

---

## 🎯 Supported Categories

The extension automatically detects claim categories and applies specialized verification:

- 🏥 **Health & Medicine** - WHO, CDC, medical journals
- 🔬 **Science & Technology** - Peer-reviewed research, scientific consensus
- 🏛️ **Politics & Government** - Official records, verified quotes
- 🌍 **Environment & Climate** - IPCC, climate research
- 📚 **History** - Historical records, academic sources
- 💰 **Economics & Business** - Financial data, expert analysis
- 🌐 **General** - Multi-source verification

---

## 🛠️ Troubleshooting

### "Cannot connect to verification server"

**Solutions:**

1. Ensure the backend server is running: `npm start`
2. Check that it's accessible at `http://localhost:5000`
3. Verify no firewall is blocking the connection
4. Check server console for error messages

### "AI service not configured"

**Solutions:**

1. Add `GEMINI_API_KEY` or `OPENAI_API_KEY` to your server `.env` file
2. Get a free Gemini API key at: https://makersuite.google.com/app/apikey
3. Restart the server after adding the key
4. Verify the key is valid and not expired

### "Verification timed out"

**Solutions:**

1. The claim might be very complex - try again
2. Check your internet connection for web scraping
3. Server might be overloaded - wait a moment
4. Increase timeout in `background.js`

### Extension doesn't appear after selection

**Solutions:**

1. Ensure you selected at least 10 characters
2. Refresh the page and try again
3. Check browser console for errors (F12 → Console)
4. Verify extension is enabled in extensions page

### No evidence sources shown

**Solutions:**

1. This is normal for very new or niche claims
2. The AI will still analyze using logical reasoning
3. Web scraping might have failed - check internet connection
4. Some claims don't have existing fact-check articles

---

## 🧪 Testing the Extension

### Test with Known Claims

Try these claims to test the extension:

**Should be TRUE:**

- "The Earth orbits around the Sun"
- "Water boils at 100 degrees Celsius at sea level"
- "Gravity causes objects to fall"

**Should be FALSE:**

- "Vaccines cause autism"
- "The Earth is flat"
- "Climate change is a hoax"

**Should be UNVERIFIED/MIXED:**

- Very recent news events
- Highly specific niche claims
- Claims with missing context

### Test with New Claims

The extension's power is in handling **unseen data**! Try:

- Current breaking news
- Specific factual statements
- Scientific claims
- Political statements
- Historical facts

---

## 📊 How It Works (Technical)

### Verification Pipeline

1. **Text Selection** - Content script detects user text selection
2. **Request Sent** - Background worker sends claim to backend API
3. **Multi-Source Verification**:
   - Web scraping from fact-checking sites
   - AI analysis using GPT/Gemini
   - ML verification (if available)
   - Evidence cross-referencing
4. **Result Aggregation** - Combines all sources for final verdict
5. **UI Display** - Beautiful box shows results near selection

### AI Analysis Process

1. **Claim Analysis** - Breaks down the claim into assertions
2. **Category Detection** - Identifies claim type (health, science, etc.)
3. **Evidence Evaluation** - Assesses quality and credibility of sources
4. **Logical Reasoning** - Applies critical thinking frameworks
5. **Verdict Generation** - Produces verdict with confidence score
6. **Explanation** - Provides detailed reasoning

### Why It Works on Unseen Data

Unlike traditional ML models that need training data, our system:

- Uses **generative AI** (GPT/Gemini) that can reason about new claims
- Applies **logical frameworks** and critical thinking
- **Web scrapes** real-time information
- Evaluates **source credibility** hierarchically
- Uses **multi-stage analysis** for accuracy

---

## 🎨 Customization

### Modify UI Colors

Edit `content.css` to change colors:

```css
/* Change primary color */
.misinfo-verify-button {
  background: linear-gradient(135deg, #YOUR_COLOR_1 0%, #YOUR_COLOR_2 100%);
}
```

### Change Box Size

Edit `content.css`:

```css
.misinfo-box {
  width: 500px; /* Default: 420px */
  max-height: 700px; /* Default: 600px */
}
```

### Modify Minimum Selection Length

Edit `content.js`:

```javascript
if (selectedText && selectedText.length >= 10) { // Change 10 to your preference
```

---

## 🔒 Privacy & Security

- **No data collection** - All processing happens on your local server
- **No tracking** - Extension doesn't track your browsing
- **Local storage only** - No cloud data transmission
- **Open source** - You can inspect all code
- **Secure API** - Only communicates with localhost by default

---

## 🤝 Contributing

Want to improve the extension? Here's how:

1. Add more fact-checking sites to web scraper
2. Improve AI prompts for better accuracy
3. Add new UI features
4. Enhance error handling
5. Add more language support

---

## 📝 Version History

### Version 1.0.0 (Current)

- ✅ Initial release
- ✅ AI-powered verification
- ✅ Web scraping integration
- ✅ Beautiful UI
- ✅ Works on unseen data
- ✅ Multi-category support
- ✅ Comprehensive error handling

---

## 🆘 Support

### Need Help?

1. **Check Troubleshooting** section above
2. **Server Console** - Check for error messages
3. **Browser Console** - Open DevTools (F12) and check Console tab
4. **Backend Logs** - Look at server terminal output

### Report Issues

When reporting issues, include:

- Browser and version
- Selected text example
- Error message (if any)
- Server console output
- Extension console output

---

## 📜 License

Part of the Misinformation Detection Platform project.

---

## 🌟 Credits

**Technology Stack:**

- AI: Google Gemini / OpenAI GPT
- Backend: Node.js + Express
- Frontend: Vanilla JavaScript
- Web Scraping: Cheerio + Axios
- ML: Natural Language Inference models

**Created with ❤️ for fighting misinformation**

---

## 🚀 Quick Start Checklist

- [ ] Backend server running
- [ ] AI API key configured
- [ ] Icons generated and saved
- [ ] Extension loaded in browser
- [ ] Extension icon visible in toolbar
- [ ] Tested with sample claim
- [ ] Verification works!

**Congratulations! You're ready to fight misinformation! 🎉**
