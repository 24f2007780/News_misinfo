# 🚀 Web Extension Setup Guide

Complete guide to installing and using the Misinformation Detector browser extension.

---

## ⚡ Quick Setup (5 Minutes)

### 1. Generate Icons (1 minute)

```bash
# Open the icon generator in your browser
start extension/icons/generate-icons.html
# Or on Mac/Linux: open extension/icons/generate-icons.html
```

Click "Download All Icons" and save to `extension/icons/` directory.

### 2. Start Backend Server (2 minutes)

```bash
cd Missinformation
npm start
```

Verify it's running at: http://localhost:5000

### 3. Load Extension (2 minutes)

1. Open Chrome/Edge and go to: `chrome://extensions/` or `edge://extensions/`
2. Enable "Developer mode" (top-right toggle)
3. Click "Load unpacked"
4. Select the `Missinformation/extension` folder
5. Done! 🎉

---

## 📝 Pre-Installation Checklist

Before installing the extension, ensure:

- [ ] **Node.js installed** (check: `node --version`)
- [ ] **Backend dependencies installed** (run: `npm install` in Missinformation folder)
- [ ] **AI API key configured** in `.env` file:
  ```env
  GEMINI_API_KEY=your_key_here
  # OR
  OPENAI_API_KEY=your_key_here
  ```
- [ ] **MongoDB running** (check server logs)
- [ ] **Extension icons generated** (see step 1 above)

---

## 🎯 Detailed Installation Steps

### Step 1: Prepare Backend

#### 1.1 Install Dependencies

```bash
cd Missinformation
npm install
```

#### 1.2 Configure AI API

**Option A: Use Google Gemini (Free)**

1. Get free API key: https://makersuite.google.com/app/apikey
2. Add to `.env`:
   ```env
   GEMINI_API_KEY=your_gemini_api_key_here
   AI_PROVIDER=gemini
   ```

**Option B: Use OpenAI**

1. Get API key from: https://platform.openai.com/api-keys
2. Add to `.env`:
   ```env
   OPENAI_API_KEY=your_openai_api_key_here
   AI_PROVIDER=openai
   ```

#### 1.3 Start Server

```bash
npm start
```

**Expected output:**

```
🚀 Server started on port 5000
✅ MongoDB connected
🤖 AI Provider: gemini
✅ Gemini initialized
```

Keep this terminal window open!

### Step 2: Generate Extension Icons

#### Option A: Using HTML Generator (Easiest)

1. Open in browser: `extension/icons/generate-icons.html`
2. Click "Download All Icons"
3. Save to `extension/icons/` directory
4. Verify you have:
   - `icon16.png`
   - `icon48.png`
   - `icon128.png`

#### Option B: Use Your Own Icons

Create three PNG files with these exact dimensions and names:

- `icon16.png` (16×16 pixels)
- `icon48.png` (48×48 pixels)
- `icon128.png` (128×128 pixels)

Place them in `extension/icons/` directory.

### Step 3: Load Extension in Browser

#### For Chrome:

1. Open: `chrome://extensions/`
2. Toggle "Developer mode" ON (top-right)
3. Click "Load unpacked" button
4. Navigate to: `E:\Missinformation\Missinformation\extension`
5. Click "Select Folder"
6. Extension will appear with icons and "Misinformation Detector" title

#### For Edge:

1. Open: `edge://extensions/`
2. Toggle "Developer mode" ON (left sidebar)
3. Click "Load unpacked" button
4. Navigate to: `E:\Missinformation\Missinformation\extension`
5. Click "Select Folder"
6. Extension will appear in your extensions list

### Step 4: Verify Installation

1. **Check Extension Icon**

   - Should appear in browser toolbar
   - Click it to open popup

2. **Test Server Connection**

   - Popup should show "✅ Online" status
   - If "⚠️ Server Offline", check backend is running

3. **Test Fact-Checking**
   - Go to any webpage (e.g., Wikipedia)
   - Select text: "The Earth orbits around the Sun"
   - Click "Verify Fact" button that appears
   - Should show: ✅ True with high confidence

---

## 🧪 Testing the Extension

### Test 1: Simple True Claim

1. Go to: https://en.wikipedia.org/wiki/Earth
2. Select: "Earth is the third planet from the Sun"
3. Click "Verify Fact"
4. **Expected:** ✅ True (90%+ confidence)

### Test 2: Simple False Claim

1. Go to any webpage
2. Select: "Vaccines cause autism"
3. Click "Verify Fact"
4. **Expected:** ❌ False (90%+ confidence)

### Test 3: Unseen/New Claim

1. Create a specific factual statement
2. Example: "Mount Everest is 8,849 meters tall"
3. Click "Verify Fact"
4. **Expected:** ✅ True with evidence from web scraping

### Test 4: Extension Popup

1. Click extension icon in toolbar
2. Should see:
   - "Misinformation Detector" title
   - Instructions
   - "Verify Selected Text Now" button
   - Status: "✅ Online"

---

## 🔧 Configuration Options

### Change API Endpoint

Edit `extension/background.js`:

```javascript
const API_ENDPOINTS = [
  "http://localhost:5000/api", // Primary
  "http://127.0.0.1:5000/api", // Fallback 1
  "http://localhost:3000/api", // Fallback 2
];
```

### Adjust Timeout

Edit `extension/background.js` (line ~25):

```javascript
signal: AbortSignal.timeout(45000); // 45 seconds (default)
// Change to 60 seconds:
signal: AbortSignal.timeout(60000);
```

### Minimum Selection Length

Edit `extension/content.js` (line ~18):

```javascript
if (selectedText && selectedText.length >= 10) {
  // Change 10 to your preferred minimum
}
```

---

## 🐛 Troubleshooting

### Issue: Extension doesn't load

**Symptoms:** Error when loading unpacked extension

**Solutions:**

1. Verify manifest.json exists in extension folder
2. Check all files are present:
   ```
   extension/
   ├── manifest.json
   ├── content.js
   ├── background.js
   ├── content.css
   ├── popup.html
   ├── popup.js
   └── icons/
       ├── icon16.png
       ├── icon48.png
       └── icon128.png
   ```
3. Check browser console for specific error
4. Try restarting browser

### Issue: "Cannot connect to server"

**Symptoms:** Red error box saying "Cannot connect to verification server"

**Solutions:**

1. Start backend: `npm start` in Missinformation folder
2. Check server is running: http://localhost:5000/api/verification/status
3. Verify no firewall blocking localhost:5000
4. Check server console for errors
5. Restart server

### Issue: "AI service not configured"

**Symptoms:** Verification fails with AI configuration error

**Solutions:**

1. Add API key to `.env` file:
   ```env
   GEMINI_API_KEY=your_actual_key_here
   ```
2. Restart server after adding key
3. Verify key is valid (test on Gemini website)
4. Check server logs for "✅ Gemini initialized"

### Issue: Verify button doesn't appear

**Symptoms:** No button shows after selecting text

**Solutions:**

1. Select at least 10 characters
2. Refresh the page (F5)
3. Check if extension is enabled (chrome://extensions/)
4. Open browser console (F12) and check for errors
5. Try different webpage

### Issue: Very slow verification

**Symptoms:** Takes 30+ seconds to verify

**Solutions:**

1. Check internet connection (web scraping requires internet)
2. Web scraping timeout - some sites may be slow
3. AI API might be rate-limited
4. Try simpler claim first
5. Check server isn't overloaded

### Issue: Low confidence on known facts

**Symptoms:** Getting 40-60% confidence on obvious truths

**Solutions:**

1. AI might need more context
2. Web scraping might have failed (check server logs)
3. Claim might be too vague - try more specific
4. Check if AI API key is valid
5. Try restarting server

---

## 📊 Understanding Results

### Verdict Types

| Icon | Verdict        | Meaning                           |
| ---- | -------------- | --------------------------------- |
| ✅   | True/Supported | Strong evidence confirms claim    |
| ❌   | False/Refuted  | Strong evidence contradicts claim |
| ⚠️   | Misleading     | Partially true but lacks context  |
| ❓   | Unverified     | Insufficient evidence             |

### Confidence Levels

| Range   | Level     | Interpretation                        |
| ------- | --------- | ------------------------------------- |
| 90-100% | Very High | Multiple authoritative sources agree  |
| 75-89%  | High      | Strong evidence from credible sources |
| 60-74%  | Moderate  | Some evidence available               |
| 40-59%  | Low       | Limited evidence found                |
| 0-39%   | Very Low  | Insufficient evidence                 |

### Evidence Sources

- **Scientific Consensus** - Peer-reviewed research
- **Medical Research** - WHO, CDC, medical journals
- **Fact-Checking Sites** - Snopes, PolitiFact, AFP
- **Official Records** - Government data, verified quotes
- **AI Analysis** - Logical reasoning and knowledge synthesis

---

## 🎓 Best Practices

### For Accurate Results:

1. **Select Complete Statements**

   - ✅ "The Earth orbits around the Sun"
   - ❌ "orbits around"

2. **Be Specific**

   - ✅ "COVID-19 vaccines are safe and effective"
   - ❌ "vaccines are good"

3. **Include Context**

   - ✅ "In 2020, the global average temperature was 1.2°C above pre-industrial levels"
   - ❌ "temperature increase"

4. **Avoid Opinions**
   - ✅ "Smoking increases risk of lung cancer"
   - ❌ "Smoking is bad" (subjective)

### Understanding Limitations:

- **Very Recent Events** - May have low confidence due to limited sources
- **Niche Topics** - Might not have web scraping results
- **Opinion Statements** - Cannot be fact-checked objectively
- **Future Predictions** - Cannot be verified
- **Subjective Claims** - Not suitable for verification

---

## 🔒 Privacy & Security

### What Data is Collected?

**None.** The extension:

- ✅ Processes everything locally on your server
- ✅ Only sends selected text to YOUR localhost
- ✅ Doesn't track browsing history
- ✅ Doesn't send data to external servers (except fact-checking sites for scraping)
- ✅ No analytics or telemetry

### What Data Leaves Your Computer?

Only when verifying:

1. **Selected text** → Your local server (localhost:5000)
2. **Search queries** → Fact-checking websites (for web scraping)
3. **Claims** → AI API (Gemini/OpenAI) for analysis

All data processing happens on YOUR server.

---

## 📈 Advanced Usage

### Keyboard Shortcuts (Future Feature)

Current: Manual selection + click button
Planned: Alt+V to verify selected text

### Custom Categories

Edit `background.js` to customize category detection:

```javascript
function detectCategory(claimText) {
  const text = claimText.toLowerCase();

  // Add your custom category
  if (text.match(/your|custom|keywords/i)) {
    return "your_custom_category";
  }

  // ... existing categories
}
```

### Integration with Other Tools

The extension works alongside:

- Regular fact-checking websites
- Browser reading modes
- PDF viewers
- Social media platforms

---

## 🆘 Getting Help

### Self-Help Resources

1. **README.md** - Full documentation
2. **Server Console** - Error messages and logs
3. **Browser Console** - Extension errors (F12 → Console)
4. **Extension Popup** - Status indicator

### Debugging Steps

1. **Enable Verbose Logging**

   - Open `background.js`
   - All `console.log` statements show in extension console
   - Open: Extensions → Misinformation Detector → "Inspect views: service worker"

2. **Check Server Logs**

   - Terminal where `npm start` is running
   - Shows verification requests and errors

3. **Test API Directly**

   - Open: http://localhost:5000/api/verification/status
   - Should return server status JSON

4. **Reload Extension**
   - Go to `chrome://extensions/`
   - Click reload icon on extension card
   - Try verification again

---

## ✅ Post-Installation Checklist

After installation, verify:

- [ ] Extension icon visible in toolbar
- [ ] Popup opens when clicking icon
- [ ] Status shows "✅ Online"
- [ ] Backend server running (terminal active)
- [ ] AI API key configured
- [ ] Test claim returns result
- [ ] Confidence score makes sense
- [ ] Evidence sources shown (when available)
- [ ] UI looks correct (no CSS issues)
- [ ] Draggable box works
- [ ] Close button works
- [ ] Links in evidence open correctly

---

## 🎉 Success!

**You're all set!** The extension is now ready to verify claims on any webpage.

### Quick Test:

1. Go to Wikipedia
2. Select any factual statement
3. Click "Verify Fact"
4. See the magic! ✨

**Happy fact-checking! 🔍**

---

## 📞 Support

If you encounter issues not covered here:

1. Check server console for errors
2. Check browser console (F12)
3. Verify all installation steps completed
4. Try restarting both server and browser
5. Check that AI API key is valid

Remember: The extension works on **completely new claims** using AI reasoning, so don't worry if you're testing with claims it's never seen before - that's the point! 🚀
