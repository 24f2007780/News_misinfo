const axios = require('axios');
const cheerio = require('cheerio');
const { spawn } = require('child_process');
const path = require('path');
const fs = require('fs');

class WebScrapingService {
  constructor() {
    this.factCheckingSites = [
      {
        name: 'Snopes',
        baseUrl: 'https://www.snopes.com',
        searchUrl: 'https://www.snopes.com/search/',
        selectors: {
          articles: '.search-result-wrapper',
          title: '.search-result-title a',
          link: '.search-result-title a',
          snippet: '.search-result-content',
          rating: '.rating_title_wrap'
        }
      },
      {
        name: 'PolitiFact',
        baseUrl: 'https://www.politifact.com',
        searchUrl: 'https://www.politifact.com/search/',
        selectors: {
          articles: '.m-statement',
          title: '.m-statement__quote a',
          link: '.m-statement__quote a',
          snippet: '.m-statement__body',
          rating: '.m-statement__meter img'
        }
      },
      {
        name: 'FactCheck.org',
        baseUrl: 'https://www.factcheck.org',
        searchUrl: 'https://www.factcheck.org/search/',
        selectors: {
          articles: '.post-item',
          title: '.entry-title a',
          link: '.entry-title a',
          snippet: '.entry-summary',
          rating: '.verdict'
        }
      },
      {
        name: 'AFP Fact Check',
        baseUrl: 'https://factcheck.afp.com',
        searchUrl: 'https://factcheck.afp.com/search?q=',
        selectors: {
          articles: '.search-result, .article-item, .post-item',
          title: 'h2 a, .article-title a, .entry-title a',
          link: 'h2 a, .article-title a, .entry-title a',
          snippet: '.excerpt, .article-excerpt, .entry-summary, p',
          rating: '.verdict, .verdict-label, .rating'
        }
      },
      {
        name: 'Alt News',
        baseUrl: 'https://www.altnews.in',
        searchUrl: 'https://www.altnews.in/search/',
        selectors: {
          articles: '.post-item',
          title: '.entry-title a',
          link: '.entry-title a',
          snippet: '.entry-excerpt',
          rating: '.post-category'
        }
      },
      {
        name: 'Boom Live',
        baseUrl: 'https://www.boomlive.in',
        searchUrl: 'https://www.boomlive.in/search/',
        selectors: {
          articles: '.story-card',
          title: '.story-headline a',
          link: '.story-headline a',
          snippet: '.story-summary',
          rating: '.story-tag'
        }
      }
    ];

    this.headers = {
      'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/91.0.4472.124 Safari/537.36',
      'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,image/webp,*/*;q=0.8',
      'Accept-Language': 'en-US,en;q=0.5',
      'Accept-Encoding': 'gzip, deflate',
      'Connection': 'keep-alive',
      'Upgrade-Insecure-Requests': '1',
    };
  }

  /**
   * Search for claim verification across multiple fact-checking sites
   */
  async searchFactCheckingSites(claim) {
    console.log(`🔍 Searching fact-checking sites for: "${claim.substring(0, 50)}..."`);
    
    const results = [];
    const searchPromises = this.factCheckingSites.map(site => 
      this.searchSingleSite(site, claim).catch(error => {
        console.warn(`⚠️ Failed to search ${site.name}:`, error.message);
        return null;
      })
    );

    const siteResults = await Promise.allSettled(searchPromises);
    
    siteResults.forEach((result, index) => {
      if (result.status === 'fulfilled' && result.value) {
        results.push(...result.value);
      }
    });

    console.log(`✅ Found ${results.length} potential matches across fact-checking sites`);
    return results;
  }

  /**
   * Search a single fact-checking site
   */
  async searchSingleSite(site, claim) {
    try {
      // Extract key terms from claim for better search
      const searchTerms = this.extractSearchTerms(claim);
      const searchQuery = encodeURIComponent(searchTerms.join(' '));
      
      const searchUrl = `${site.searchUrl}?q=${searchQuery}`;
      
      // Add delay to be respectful to servers
      await this.delay(Math.random() * 1000 + 500);
      
      const response = await axios.get(searchUrl, {
        headers: this.headers,
        timeout: 10000
      });

      const $ = cheerio.load(response.data);
      const articles = [];

      $(site.selectors.articles).each((index, element) => {
        if (index >= 5) return false; // Limit to top 5 results per site
        
        const $el = $(element);
        const title = $el.find(site.selectors.title).text().trim();
        const link = $el.find(site.selectors.link).attr('href');
        const snippet = $el.find(site.selectors.snippet).text().trim();
        const rating = $el.find(site.selectors.rating).text().trim();

        if (title && link) {
          const fullUrl = link.startsWith('http') ? link : `${site.baseUrl}${link}`;
          
          articles.push({
            title,
            url: fullUrl,
            snippet: snippet.substring(0, 300),
            source: site.name,
            rating: rating || 'Unknown',
            relevanceScore: this.calculateRelevance(claim, title + ' ' + snippet),
            scrapedAt: new Date()
          });
        }
      });

      return articles.filter(article => article.relevanceScore > 0.3);
    } catch (error) {
      console.error(`❌ Error searching ${site.name}:`, error.message);
      return [];
    }
  }

  /**
   * Extract key search terms from claim
   */
  extractSearchTerms(claim) {
    // Remove common stop words and extract meaningful terms
    const stopWords = new Set(['the', 'is', 'at', 'which', 'on', 'a', 'an', 'and', 'or', 'but', 'in', 'with', 'to', 'for', 'of', 'as', 'by', 'that', 'this', 'are', 'was', 'were', 'been', 'have', 'has', 'had']);
    
    // Extract key phrases and important terms
    const terms = claim
      .toLowerCase()
      .replace(/[^\w\s]/g, ' ')
      .split(/\s+/)
      .filter(word => word.length > 2 && !stopWords.has(word));

    // For specific claims, add contextual terms
    const contextualTerms = [];
    if (claim.toLowerCase().includes('philippine') || claim.toLowerCase().includes('philippines')) {
      contextualTerms.push('philippines', 'philippine');
    }
    if (claim.toLowerCase().includes('streetwear') || claim.toLowerCase().includes('advert')) {
      contextualTerms.push('streetwear', 'advertisement', 'advert');
    }
    if (claim.toLowerCase().includes('clash') || claim.toLowerCase().includes('violence')) {
      contextualTerms.push('clashes', 'violence', 'protest');
    }

    // Combine original terms with contextual terms
    const allTerms = [...new Set([...terms, ...contextualTerms])];
    
    return allTerms.slice(0, 10); // Limit to most important terms
  }

  /**
   * Calculate relevance score between claim and article
   */
  calculateRelevance(claim, articleText) {
    const claimWords = new Set(this.extractSearchTerms(claim));
    const articleWords = new Set(this.extractSearchTerms(articleText));
    
    const intersection = new Set([...claimWords].filter(x => articleWords.has(x)));
    const union = new Set([...claimWords, ...articleWords]);
    
    return intersection.size / union.size; // Jaccard similarity
  }

  /**
   * Scrape detailed content from a specific article
   */
  async scrapeArticleDetails(url) {
    try {
      await this.delay(1000); // Be respectful
      
      const response = await axios.get(url, {
        headers: this.headers,
        timeout: 15000
      });

      const $ = cheerio.load(response.data);
      
      // Generic selectors for article content
      const content = $('article, .content, .post-content, .entry-content, .article-body')
        .first()
        .text()
        .trim()
        .substring(0, 1000);

      const verdict = this.extractVerdict($);
      
      return {
        url,
        content,
        verdict,
        scrapedAt: new Date()
      };
    } catch (error) {
      console.error(`❌ Error scraping article details from ${url}:`, error.message);
      return null;
    }
  }

  /**
   * Extract verdict from article page
   */
  extractVerdict($) {
    const verdictSelectors = [
      '.verdict', '.rating', '.fact-check-result', '.conclusion',
      '.truth-o-meter', '.rating_title_wrap', '.m-statement__meter',
      '[class*="verdict"]', '[class*="rating"]', '[class*="fact"]',
      'h1', 'title', '.headline' // Check headlines for AFP-style verdicts
    ];

    // First check page content for AFP-style patterns
    const pageText = $('body').text().toLowerCase();
    
    // AFP Fact Check patterns
    if (pageText.includes('baselessly linked') || pageText.includes('baseless')) return 'false';
    if (pageText.includes('false claim') || pageText.includes('misleading claim')) return 'false';
    if (pageText.includes('no evidence') || pageText.includes('unsubstantiated')) return 'false';
    if (pageText.includes('debunked') || pageText.includes('fabricated')) return 'false';
    
    // Check title for verdict indicators
    const title = $('title, h1').first().text().toLowerCase();
    if (title.includes('baselessly') || title.includes('false') || title.includes('misleading')) return 'false';
    if (title.includes('true') || title.includes('confirmed') || title.includes('verified')) return 'true';

    for (const selector of verdictSelectors) {
      const element = $(selector).first();
      if (element.length) {
        const text = element.text().trim().toLowerCase();
        
        // Map common verdict patterns
        if (text.includes('false') || text.includes('pants on fire') || text.includes('baselessly')) return 'false';
        if (text.includes('true') || text.includes('correct') || text.includes('accurate')) return 'true';
        if (text.includes('misleading') || text.includes('mostly false') || text.includes('partly false')) return 'misleading';
        if (text.includes('mixed') || text.includes('half true') || text.includes('partly true')) return 'mixed';
        
        return text;
      }
    }
    
    return 'unknown';
  }

  /**
   * Comprehensive claim verification using web scraping
   */
  async verifyClaim(claimText) {
    try {
      console.log(`🚀 Starting web scraping verification for claim: "${claimText.substring(0, 50)}..."`);
      
      // Step 1: Search fact-checking sites
      const factCheckResults = await this.searchFactCheckingSites(claimText);
      
      // Step 2: Get detailed content for top results
      const detailedResults = [];
      const topResults = factCheckResults
        .sort((a, b) => b.relevanceScore - a.relevanceScore)
        .slice(0, 3);

      for (const result of topResults) {
        const details = await this.scrapeArticleDetails(result.url);
        if (details) {
          detailedResults.push({
            ...result,
            ...details
          });
        }
      }

      // Step 3: Analyze results and determine verdict
      const analysis = this.analyzeScrapingResults(detailedResults);
      
      console.log(`✅ Web scraping completed. Found ${factCheckResults.length} results, analyzed ${detailedResults.length} in detail`);
      
      return {
        verdict: analysis.verdict,
        confidence: analysis.confidence,
        evidence: factCheckResults.slice(0, 5), // Top 5 results
        detailedAnalysis: detailedResults,
        scrapingSummary: {
          sitesSearched: this.factCheckingSites.length,
          resultsFound: factCheckResults.length,
          detailedAnalysis: detailedResults.length,
          timestamp: new Date()
        }
      };
    } catch (error) {
      console.error('❌ Web scraping verification failed:', error);
      throw new Error(`Web scraping failed: ${error.message}`);
    }
  }

  /**
   * Analyze scraping results to determine overall verdict
   */
  analyzeScrapingResults(results) {
    if (results.length === 0) {
      return {
        verdict: 'unverified',
        confidence: 0.1,
        reasoning: 'No fact-checking sources found'
      };
    }

    const verdicts = results.map(r => r.verdict).filter(v => v !== 'unknown');
    const verdictCounts = {};
    
    verdicts.forEach(verdict => {
      verdictCounts[verdict] = (verdictCounts[verdict] || 0) + 1;
    });

    const mostCommonVerdict = Object.keys(verdictCounts).reduce((a, b) => 
      verdictCounts[a] > verdictCounts[b] ? a : b, 'unverified'
    );

    const confidence = Math.min(0.9, (verdictCounts[mostCommonVerdict] || 0) / results.length + 0.3);

    return {
      verdict: mostCommonVerdict,
      confidence,
      reasoning: `Based on ${results.length} fact-checking sources, ${verdictCounts[mostCommonVerdict] || 0} indicate "${mostCommonVerdict}"`
    };
  }

  /**
   * Utility function to add delays between requests
   */
  delay(ms) {
    return new Promise(resolve => setTimeout(resolve, ms));
  }

  /**
   * Check robots.txt compliance
   */
  async checkRobotsTxt(baseUrl) {
    try {
      const robotsUrl = `${baseUrl}/robots.txt`;
      const response = await axios.get(robotsUrl, { timeout: 5000 });
      
      // Basic robots.txt parsing (simplified)
      const robotsContent = response.data.toLowerCase();
      const isAllowed = !robotsContent.includes('disallow: /search') && 
                       !robotsContent.includes('disallow: /');
      
      return isAllowed;
    } catch (error) {
      // If robots.txt is not accessible, assume it's okay to scrape
      return true;
    }
  }

  /**
   * Get scraping statistics
   */
  getScrapingStats() {
    return {
      supportedSites: this.factCheckingSites.length,
      sites: this.factCheckingSites.map(site => ({
        name: site.name,
        baseUrl: site.baseUrl
      }))
    };
  }
}

module.exports = new WebScrapingService();
