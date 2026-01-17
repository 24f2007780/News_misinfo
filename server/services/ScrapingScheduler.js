const cron = require('node-cron');
const Claim = require('../models/Claim');
const WebScrapingService = require('./WebScrapingService');

class ScrapingScheduler {
  constructor() {
    this.isRunning = false;
    this.scheduledTasks = new Map();
  }

  /**
   * Start the automated scraping scheduler
   */
  start() {
    console.log('🕐 Starting Web Scraping Scheduler...');

    // Schedule daily scraping for unverified claims (runs at 2 AM)
    const dailyTask = cron.schedule('0 2 * * *', async () => {
      console.log('🌅 Running daily web scraping job...');
      await this.scrapeUnverifiedClaims();
    }, {
      scheduled: false,
      timezone: "Asia/Kolkata"
    });

    // Schedule hourly scraping for high-priority claims (runs every hour)
    const hourlyTask = cron.schedule('0 * * * *', async () => {
      console.log('⏰ Running hourly priority web scraping job...');
      await this.scrapeHighPriorityClaims();
    }, {
      scheduled: false,
      timezone: "Asia/Kolkata"
    });

    // Schedule weekly re-scraping for existing claims (runs on Sundays at 3 AM)
    const weeklyTask = cron.schedule('0 3 * * 0', async () => {
      console.log('📅 Running weekly re-scraping job...');
      await this.reScrapeExistingClaims();
    }, {
      scheduled: false,
      timezone: "Asia/Kolkata"
    });

    this.scheduledTasks.set('daily', dailyTask);
    this.scheduledTasks.set('hourly', hourlyTask);
    this.scheduledTasks.set('weekly', weeklyTask);

    // Start all tasks
    dailyTask.start();
    hourlyTask.start();
    weeklyTask.start();

    this.isRunning = true;
    console.log('✅ Web Scraping Scheduler started successfully');
  }

  /**
   * Stop the scheduler
   */
  stop() {
    console.log('🛑 Stopping Web Scraping Scheduler...');
    
    this.scheduledTasks.forEach((task, name) => {
      task.stop();
      console.log(`  - Stopped ${name} task`);
    });

    this.isRunning = false;
    console.log('✅ Web Scraping Scheduler stopped');
  }

  /**
   * Scrape unverified claims (daily job)
   */
  async scrapeUnverifiedClaims() {
    try {
      console.log('🔍 Finding unverified claims for scraping...');
      
      const unverifiedClaims = await Claim.find({
        $or: [
          { verdict: 'unverified' },
          { verificationStatus: 'pending' }
        ],
        'webScrapingData.scrapingEnabled': { $ne: false },
        createdAt: { $gte: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000) } // Last 7 days
      })
      .sort({ createdAt: -1 })
      .limit(20); // Process max 20 claims per day

      console.log(`📊 Found ${unverifiedClaims.length} unverified claims to scrape`);

      let successCount = 0;
      let errorCount = 0;

      for (const claim of unverifiedClaims) {
        try {
          console.log(`🌐 Scraping claim: "${claim.text.substring(0, 50)}..."`);
          
          const scrapingResult = await WebScrapingService.verifyClaim(claim.text);
          
          // Update claim with scraping results
          await this.updateClaimWithScrapingData(claim, scrapingResult);
          
          successCount++;
          
          // Add delay between requests to be respectful
          await this.delay(2000);
        } catch (error) {
          console.error(`❌ Failed to scrape claim ${claim._id}:`, error.message);
          errorCount++;
        }
      }

      console.log(`✅ Daily scraping completed: ${successCount} successful, ${errorCount} failed`);
    } catch (error) {
      console.error('❌ Daily scraping job failed:', error);
    }
  }

  /**
   * Scrape high-priority claims (hourly job)
   */
  async scrapeHighPriorityClaims() {
    try {
      console.log('🚨 Finding high-priority claims for scraping...');
      
      const highPriorityClaims = await Claim.find({
        $or: [
          { 'flags.urgent': true },
          { 'flags.viral': true },
          { 'metrics.views': { $gte: 100 } }
        ],
        verdict: 'unverified',
        'webScrapingData.lastScraped': {
          $lt: new Date(Date.now() - 60 * 60 * 1000) // Not scraped in last hour
        }
      })
      .sort({ 'metrics.views': -1, createdAt: -1 })
      .limit(5); // Process max 5 high-priority claims per hour

      console.log(`🔥 Found ${highPriorityClaims.length} high-priority claims to scrape`);

      for (const claim of highPriorityClaims) {
        try {
          console.log(`⚡ Priority scraping: "${claim.text.substring(0, 50)}..."`);
          
          const scrapingResult = await WebScrapingService.verifyClaim(claim.text);
          await this.updateClaimWithScrapingData(claim, scrapingResult);
          
          // Add delay
          await this.delay(1500);
        } catch (error) {
          console.error(`❌ Failed to scrape priority claim ${claim._id}:`, error.message);
        }
      }

      console.log('✅ Priority scraping completed');
    } catch (error) {
      console.error('❌ Priority scraping job failed:', error);
    }
  }

  /**
   * Re-scrape existing claims (weekly job)
   */
  async reScrapeExistingClaims() {
    try {
      console.log('🔄 Finding claims for re-scraping...');
      
      const claimsToRescrape = await Claim.find({
        'webScrapingData.lastScraped': {
          $lt: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000) // Scraped more than 7 days ago
        },
        'webScrapingData.scrapingEnabled': { $ne: false },
        verdict: { $in: ['true', 'false', 'misleading'] } // Only re-scrape verified claims
      })
      .sort({ 'webScrapingData.lastScraped': 1 })
      .limit(10); // Process max 10 claims per week

      console.log(`🔄 Found ${claimsToRescrape.length} claims for re-scraping`);

      for (const claim of claimsToRescrape) {
        try {
          console.log(`🔄 Re-scraping: "${claim.text.substring(0, 50)}..."`);
          
          const scrapingResult = await WebScrapingService.verifyClaim(claim.text);
          await this.updateClaimWithScrapingData(claim, scrapingResult, true);
          
          // Add delay
          await this.delay(3000);
        } catch (error) {
          console.error(`❌ Failed to re-scrape claim ${claim._id}:`, error.message);
        }
      }

      console.log('✅ Weekly re-scraping completed');
    } catch (error) {
      console.error('❌ Weekly re-scraping job failed:', error);
    }
  }

  /**
   * Update claim with scraping data
   */
  async updateClaimWithScrapingData(claim, scrapingResult, isRescrape = false) {
    try {
      // Add new evidence from web scraping
      const newEvidence = scrapingResult.evidence.map(e => ({
        source: e.source,
        url: e.url,
        title: e.title,
        snippet: e.snippet,
        credibility: e.relevanceScore || 0.5,
        stance: e.verdict === 'false' ? 'refutes' : e.verdict === 'true' ? 'supports' : 'neutral',
        addedAt: new Date(),
        relevanceScore: e.relevanceScore,
        verdict: e.verdict,
        rating: e.rating,
        scrapedAt: e.scrapedAt,
        factCheckingSite: e.source,
        content: e.content
      }));

      // Update or append evidence
      if (isRescrape) {
        // For re-scraping, replace old evidence with new
        claim.evidence = newEvidence;
      } else {
        // For new scraping, append to existing evidence
        claim.evidence = [...(claim.evidence || []), ...newEvidence];
      }

      // Update web scraping metadata
      claim.webScrapingData = {
        lastScraped: new Date(),
        sitesSearched: scrapingResult.scrapingSummary.sitesSearched,
        resultsFound: scrapingResult.scrapingSummary.resultsFound,
        topRelevanceScore: Math.max(...scrapingResult.evidence.map(e => e.relevanceScore || 0)),
        scrapingEnabled: true,
        scrapingHistory: [
          ...(claim.webScrapingData?.scrapingHistory || []),
          {
            timestamp: new Date(),
            sitesSearched: scrapingResult.scrapingSummary.sitesSearched,
            resultsFound: scrapingResult.scrapingSummary.resultsFound,
            topVerdict: scrapingResult.verdict
          }
        ]
      };

      // Update verdict if scraping provides better confidence or if it's unverified
      if (claim.verdict === 'unverified' || scrapingResult.confidence > claim.confidence) {
        claim.verdict = scrapingResult.verdict;
        claim.confidence = scrapingResult.confidence;
        claim.verificationStatus = 'verified';
      }

      await claim.save();
      
      console.log(`✅ Updated claim ${claim._id} with scraping data`);
    } catch (error) {
      console.error(`❌ Failed to update claim ${claim._id}:`, error);
      throw error;
    }
  }

  /**
   * Get scheduler status
   */
  getStatus() {
    return {
      isRunning: this.isRunning,
      activeTasks: Array.from(this.scheduledTasks.keys()),
      nextRuns: {
        daily: this.scheduledTasks.get('daily')?.nextDate()?.toISOString(),
        hourly: this.scheduledTasks.get('hourly')?.nextDate()?.toISOString(),
        weekly: this.scheduledTasks.get('weekly')?.nextDate()?.toISOString()
      }
    };
  }

  /**
   * Manual trigger for scraping jobs
   */
  async triggerManualScraping(jobType = 'daily') {
    console.log(`🔧 Manual trigger for ${jobType} scraping job`);
    
    switch (jobType) {
      case 'daily':
        await this.scrapeUnverifiedClaims();
        break;
      case 'hourly':
        await this.scrapeHighPriorityClaims();
        break;
      case 'weekly':
        await this.reScrapeExistingClaims();
        break;
      default:
        throw new Error(`Unknown job type: ${jobType}`);
    }
  }

  /**
   * Utility delay function
   */
  delay(ms) {
    return new Promise(resolve => setTimeout(resolve, ms));
  }
}

module.exports = new ScrapingScheduler();
