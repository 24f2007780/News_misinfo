const BaseAgent = require('./BaseAgent');
const { getAIService } = require('../services/AIService');
const Claim = require('../models/Claim');
const Cluster = require('../models/Cluster');

class AnalystAgent extends BaseAgent {
  constructor(io) {
    super('Analyst', io);
    this.aiService = getAIService();
  }

  async generateDailyBrief() {
    try {
      this.status = 'processing';

      const today = new Date();
      today.setHours(0, 0, 0, 0);

      // Get today's statistics
      const stats = await this.getTodayStats(today);

      // Get top clusters
      const topClusters = await Cluster.find({ status: 'active' })
        .sort({ 'metrics.totalClaims': -1 })
        .limit(5)
        .populate('claims');

      // Generate AI summary
      const summary = await this.generateAISummary(stats, topClusters);

      const brief = {
        date: new Date(),
        stats,
        topClusters: topClusters.map(c => ({
          id: c._id,
          name: c.name,
          description: c.description,
          claimCount: c.metrics.totalClaims,
          riskLevel: c.riskLevel
        })),
        summary,
        trends: await this.analyzeTrends()
      };

      await this.logAction('generate_daily_brief', { date: today });

      this.status = 'idle';
      return brief;
    } catch (error) {
      await this.handleError(error, {});
      return null;
    }
  }

  async getTodayStats(today) {
    const claims = await Claim.find({ createdAt: { $gte: today } });

    return {
      totalClaims: claims.length,
      verified: claims.filter(c => c.verificationStatus === 'verified').length,
      false: claims.filter(c => c.verdict === 'false').length,
      misleading: claims.filter(c => c.verdict === 'misleading').length,
      true: claims.filter(c => c.verdict === 'true').length,
      byCategory: this.groupByCategory(claims),
      byLanguage: this.groupByLanguage(claims),
      viral: claims.filter(c => c.flags.viral).length,
      urgent: claims.filter(c => c.flags.urgent).length
    };
  }

  groupByCategory(claims) {
    const categories = {};
    claims.forEach(claim => {
      categories[claim.category] = (categories[claim.category] || 0) + 1;
    });
    return categories;
  }

  groupByLanguage(claims) {
    const languages = {};
    claims.forEach(claim => {
      languages[claim.language] = (languages[claim.language] || 0) + 1;
    });
    return languages;
  }

  async generateAISummary(stats, clusters) {
    try {
      const messages = [
        {
          role: "system",
          content: "Generate a concise intelligence brief summarizing the misinformation landscape for today. Focus on key trends, risks, and notable patterns."
        },
        {
          role: "user",
          content: `Statistics:\n${JSON.stringify(stats, null, 2)}\n\nTop Clusters:\n${clusters.map(c => `- ${c.name}: ${c.description}`).join('\n')}`
        }
      ];

      return await this.aiService.chat(messages, { maxTokens: 500 });
    } catch (error) {
      console.error('AI summary error:', error);
      return 'Unable to generate summary at this time.';
    }
  }

  async analyzeTrends() {
    try {
      const last7Days = new Date();
      last7Days.setDate(last7Days.getDate() - 7);

      const claims = await Claim.find({ createdAt: { $gte: last7Days } });

      const dailyCounts = {};
      claims.forEach(claim => {
        const date = claim.createdAt.toISOString().split('T')[0];
        dailyCounts[date] = (dailyCounts[date] || 0) + 1;
      });

      return {
        dailyCounts,
        trending: await this.getTrendingTopics(claims),
        spikes: this.detectSpikes(dailyCounts)
      };
    } catch (error) {
      console.error('Trend analysis error:', error);
      return {};
    }
  }

  async getTrendingTopics(claims) {
    const keywords = {};
    claims.forEach(claim => {
      claim.entities.forEach(entity => {
        keywords[entity.text] = (keywords[entity.text] || 0) + 1;
      });
    });

    return Object.entries(keywords)
      .sort((a, b) => b[1] - a[1])
      .slice(0, 10)
      .map(([keyword, count]) => ({ keyword, count }));
  }

  detectSpikes(dailyCounts) {
    const counts = Object.values(dailyCounts);
    const avg = counts.reduce((a, b) => a + b, 0) / counts.length;
    const threshold = avg * 1.5;

    return Object.entries(dailyCounts)
      .filter(([date, count]) => count > threshold)
      .map(([date, count]) => ({ date, count, threshold }));
  }

  async generateWeeklyReport() {
    try {
      const last7Days = new Date();
      last7Days.setDate(last7Days.getDate() - 7);

      const claims = await Claim.find({ createdAt: { $gte: last7Days } });
      const clusters = await Cluster.find({ 'timeline.lastSeen': { $gte: last7Days } });

      const report = {
        period: {
          start: last7Days,
          end: new Date()
        },
        summary: {
          totalClaims: claims.length,
          clustersActive: clusters.length,
          verificationRate: claims.filter(c => c.verificationStatus === 'verified').length / claims.length,
          falseClaimsRate: claims.filter(c => c.verdict === 'false').length / claims.length
        },
        topCategories: this.groupByCategory(claims),
        topClusters: clusters.slice(0, 10),
        recommendations: await this.generateRecommendations(claims, clusters)
      };

      await this.logAction('generate_weekly_report', { claimCount: claims.length });

      return report;
    } catch (error) {
      await this.handleError(error, {});
      return null;
    }
  }

  async generateRecommendations(claims, clusters) {
    try {
      const messages = [
        {
          role: "system",
          content: "Based on the misinformation data, provide 3-5 actionable recommendations for fact-checkers and administrators."
        },
        {
          role: "user",
          content: `Claims: ${claims.length}\nClusters: ${clusters.length}\nTop categories: ${Object.keys(this.groupByCategory(claims)).join(', ')}`
        }
      ];

      return await this.aiService.chat(messages);
    } catch (error) {
      console.error('Recommendations error:', error);
      return 'Unable to generate recommendations at this time.';
    }
  }
}

module.exports = AnalystAgent;
