const fs = require('fs');
const path = require('path');

class PDFGenerator {
  static generateHTML(data, type = 'daily') {
    const { claims, stats, period } = data;
    const title = type === 'daily' ? 'Daily Intelligence Brief' : 'Weekly Intelligence Report';
    const periodText = type === 'daily' ? 'Last 24 Hours' : 'Last 7 Days';
    
    return `
<!DOCTYPE html>
<html>
<head>
    <meta charset="UTF-8">
    <title>${title}</title>
    <style>
        body {
            font-family: 'Arial', sans-serif;
            margin: 0;
            padding: 20px;
            background: #f5f5f5;
            color: #333;
        }
        .header {
            background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
            color: white;
            padding: 30px;
            border-radius: 10px;
            text-align: center;
            margin-bottom: 30px;
        }
        .header h1 {
            margin: 0;
            font-size: 2.5em;
            font-weight: bold;
        }
        .header p {
            margin: 10px 0 0 0;
            font-size: 1.2em;
            opacity: 0.9;
        }
        .stats-grid {
            display: grid;
            grid-template-columns: repeat(auto-fit, minmax(200px, 1fr));
            gap: 20px;
            margin-bottom: 30px;
        }
        .stat-card {
            background: white;
            padding: 20px;
            border-radius: 10px;
            box-shadow: 0 2px 10px rgba(0,0,0,0.1);
            text-align: center;
        }
        .stat-number {
            font-size: 2.5em;
            font-weight: bold;
            color: #667eea;
        }
        .stat-label {
            color: #666;
            margin-top: 5px;
        }
        .section {
            background: white;
            margin-bottom: 30px;
            border-radius: 10px;
            overflow: hidden;
            box-shadow: 0 2px 10px rgba(0,0,0,0.1);
        }
        .section-header {
            background: #667eea;
            color: white;
            padding: 20px;
            font-size: 1.3em;
            font-weight: bold;
        }
        .section-content {
            padding: 20px;
        }
        .claim-item {
            border-left: 4px solid #ddd;
            padding: 15px;
            margin-bottom: 15px;
            background: #f9f9f9;
            border-radius: 5px;
        }
        .claim-item.false {
            border-left-color: #e74c3c;
        }
        .claim-item.true {
            border-left-color: #27ae60;
        }
        .claim-item.misleading {
            border-left-color: #f39c12;
        }
        .claim-item.unverified {
            border-left-color: #95a5a6;
        }
        .claim-text {
            font-weight: bold;
            margin-bottom: 10px;
            font-size: 1.1em;
        }
        .claim-meta {
            display: grid;
            grid-template-columns: repeat(auto-fit, minmax(150px, 1fr));
            gap: 10px;
            font-size: 0.9em;
            color: #666;
        }
        .verdict {
            display: inline-block;
            padding: 4px 12px;
            border-radius: 20px;
            font-weight: bold;
            font-size: 0.8em;
            text-transform: uppercase;
        }
        .verdict.false {
            background: #e74c3c;
            color: white;
        }
        .verdict.true {
            background: #27ae60;
            color: white;
        }
        .verdict.misleading {
            background: #f39c12;
            color: white;
        }
        .verdict.unverified {
            background: #95a5a6;
            color: white;
        }
        .explanation {
            margin-top: 10px;
            padding: 10px;
            background: white;
            border-radius: 5px;
            font-style: italic;
        }
        .footer {
            text-align: center;
            margin-top: 40px;
            padding: 20px;
            color: #666;
            border-top: 1px solid #eee;
        }
        .category-badge {
            display: inline-block;
            background: #667eea;
            color: white;
            padding: 2px 8px;
            border-radius: 12px;
            font-size: 0.8em;
            margin-right: 5px;
        }
        .language-badge {
            display: inline-block;
            background: #764ba2;
            color: white;
            padding: 2px 8px;
            border-radius: 12px;
            font-size: 0.8em;
        }
    </style>
</head>
<body>
    <div class="header">
        <h1>🛡️ ${title}</h1>
        <p>Misinformation Intelligence Report - ${periodText}</p>
        <p>Generated on ${new Date().toLocaleDateString('en-US', { 
          weekday: 'long', 
          year: 'numeric', 
          month: 'long', 
          day: 'numeric' 
        })}</p>
    </div>

    <div class="stats-grid">
        <div class="stat-card">
            <div class="stat-number">${stats.totalClaims}</div>
            <div class="stat-label">Total Claims</div>
        </div>
        <div class="stat-card">
            <div class="stat-number">${stats.verifiedClaims}</div>
            <div class="stat-label">Verified</div>
        </div>
        <div class="stat-card">
            <div class="stat-number">${stats.falseClaims}</div>
            <div class="stat-label">False Claims</div>
        </div>
        <div class="stat-card">
            <div class="stat-number">${stats.trueClaims}</div>
            <div class="stat-label">True Claims</div>
        </div>
    </div>

    <div class="section">
        <div class="section-header">
            📊 Claims by Category
        </div>
        <div class="section-content">
            ${this.generateCategoryBreakdown(claims)}
        </div>
    </div>

    <div class="section">
        <div class="section-header">
            🔍 Detailed Claims Analysis
        </div>
        <div class="section-content">
            ${claims.map(claim => `
                <div class="claim-item ${claim.verdict || 'unverified'}">
                    <div class="claim-text">${claim.text}</div>
                    <div class="claim-meta">
                        <div><strong>Verdict:</strong> <span class="verdict ${claim.verdict || 'unverified'}">${claim.verdict || 'Unverified'}</span></div>
                        <div><strong>Confidence:</strong> ${Math.round((claim.confidence || 0) * 100)}%</div>
                        <div><strong>Category:</strong> <span class="category-badge">${claim.category}</span></div>
                        <div><strong>Language:</strong> <span class="language-badge">${claim.language}</span></div>
                        <div><strong>Date:</strong> ${new Date(claim.createdAt).toLocaleDateString()}</div>
                        <div><strong>Status:</strong> ${claim.verificationStatus}</div>
                    </div>
                    ${claim.explanation ? `
                        <div class="explanation">
                            <strong>Explanation:</strong> ${claim.explanation.medium || claim.explanation.short || 'No explanation available'}
                        </div>
                    ` : ''}
                </div>
            `).join('')}
        </div>
    </div>

    <div class="section">
        <div class="section-header">
            📈 Key Insights & Recommendations
        </div>
        <div class="section-content">
            <h3>Summary</h3>
            <p>During this ${periodText.toLowerCase()}, we processed <strong>${stats.totalClaims}</strong> claims across multiple categories and languages.</p>
            
            <h3>Key Findings</h3>
            <ul>
                <li><strong>Verification Rate:</strong> ${Math.round((stats.verifiedClaims / stats.totalClaims) * 100)}% of claims have been verified</li>
                <li><strong>False Information Rate:</strong> ${Math.round((stats.falseClaims / stats.totalClaims) * 100)}% of claims were found to be false</li>
                <li><strong>Most Active Category:</strong> ${this.getMostActiveCategory(claims)}</li>
                <li><strong>Language Distribution:</strong> ${this.getLanguageDistribution(claims)}</li>
            </ul>

            <h3>Recommendations</h3>
            <ul>
                <li>Focus verification efforts on high-priority categories with false claims</li>
                <li>Monitor trending misinformation patterns</li>
                <li>Improve multilingual fact-checking capabilities</li>
                <li>Enhance user education on identified false claims</li>
            </ul>
        </div>
    </div>

    <div class="footer">
        <p>🤖 Generated by AI Misinformation Intelligence Platform</p>
        <p>This report contains automated analysis and should be reviewed by human experts</p>
    </div>
</body>
</html>`;
  }

  static generateCategoryBreakdown(claims) {
    const categories = {};
    claims.forEach(claim => {
      categories[claim.category] = (categories[claim.category] || 0) + 1;
    });

    return Object.entries(categories)
      .sort(([,a], [,b]) => b - a)
      .map(([category, count]) => `
        <div style="display: flex; justify-content: space-between; padding: 10px; border-bottom: 1px solid #eee;">
          <span class="category-badge">${category}</span>
          <strong>${count} claims</strong>
        </div>
      `).join('');
  }

  static getMostActiveCategory(claims) {
    const categories = {};
    claims.forEach(claim => {
      categories[claim.category] = (categories[claim.category] || 0) + 1;
    });
    
    const sorted = Object.entries(categories).sort(([,a], [,b]) => b - a);
    return sorted.length > 0 ? `${sorted[0][0]} (${sorted[0][1]} claims)` : 'None';
  }

  static getLanguageDistribution(claims) {
    const languages = {};
    claims.forEach(claim => {
      languages[claim.language] = (languages[claim.language] || 0) + 1;
    });
    
    return Object.entries(languages)
      .sort(([,a], [,b]) => b - a)
      .slice(0, 3)
      .map(([lang, count]) => `${lang.toUpperCase()}: ${count}`)
      .join(', ');
  }

  static async generatePDF(data, type = 'daily') {
    try {
      const html = this.generateHTML(data, type);
      
      // For now, return HTML since we don't have puppeteer
      // In production, you would use puppeteer to convert HTML to PDF
      return {
        success: true,
        html: html,
        filename: `${type}-report-${new Date().toISOString().split('T')[0]}.html`
      };
    } catch (error) {
      console.error('PDF generation error:', error);
      return {
        success: false,
        error: error.message
      };
    }
  }
}

module.exports = PDFGenerator;
