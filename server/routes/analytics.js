const express = require('express');
const Claim = require('../models/Claim');
const Cluster = require('../models/Cluster');
const { getAgents } = require('../agents');
const { authenticateToken } = require('./auth');
const PDFGenerator = require('../utils/pdfGenerator');

const router = express.Router();

// Get dashboard overview
router.get('/overview', async (req, res) => {
  try {
    const today = new Date();
    today.setHours(0, 0, 0, 0);

    const last24Hours = new Date();
    last24Hours.setHours(last24Hours.getHours() - 24);

    const [
      totalClaims,
      todayClaims,
      verifiedClaims,
      trueClaims,
      falseClaims,
      misleadingClaims,
      activeClusters,
      recentClaims
    ] = await Promise.all([
      Claim.countDocuments(),
      Claim.countDocuments({ createdAt: { $gte: today } }),
      Claim.countDocuments({ verificationStatus: 'verified' }),
      Claim.countDocuments({ verdict: 'true' }),
      Claim.countDocuments({ verdict: 'false' }),
      Claim.countDocuments({ verdict: 'misleading' }),
      Cluster.countDocuments({ status: 'active' }),
      Claim.find().sort({ createdAt: -1 }).limit(10)
    ]);

    const verificationRate = totalClaims > 0 ? (verifiedClaims / totalClaims) * 100 : 0;

    res.json({
      totalClaims,
      todayClaims,
      verifiedClaims,
      trueClaims,
      falseClaims,
      misleadingClaims,
      activeClusters,
      verificationRate: verificationRate.toFixed(1),
      recentClaims
    });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Get category-wise analytics
router.get('/categories', async (req, res) => {
  try {
    // Get category distribution
    const categoryStats = await Claim.aggregate([
      {
        $group: {
          _id: '$category',
          total: { $sum: 1 },
          true: { $sum: { $cond: [{ $eq: ['$verdict', 'true'] }, 1, 0] } },
          false: { $sum: { $cond: [{ $eq: ['$verdict', 'false'] }, 1, 0] } },
          misleading: { $sum: { $cond: [{ $eq: ['$verdict', 'misleading'] }, 1, 0] } },
          unverified: { $sum: { $cond: [{ $eq: ['$verdict', 'unverified'] }, 1, 0] } }
        }
      },
      {
        $sort: { total: -1 }
      }
    ]);

    // Format category names for display
    const categoryLabels = {
      'politics_governance': 'Politics & Governance',
      'health_medicine': 'Health & Medicine',
      'environment_climate': 'Environment & Climate',
      'economics_finance': 'Economics & Finance',
      'science_technology': 'Science & Technology',
      'food_nutrition': 'Food & Nutrition',
      'social_cultural': 'Social & Cultural Issues',
      'entertainment_media': 'Entertainment & Media',
      'sports': 'Sports',
      'technology_cybersecurity': 'Technology & Cybersecurity',
      'other': 'Other'
    };

    const formattedStats = categoryStats.map(stat => ({
      category: stat._id,
      label: categoryLabels[stat._id] || stat._id,
      total: stat.total,
      true: stat.true,
      false: stat.false,
      misleading: stat.misleading,
      unverified: stat.unverified
    }));

    // Calculate overall verdict distribution
    const verdictDistribution = await Claim.aggregate([
      {
        $group: {
          _id: '$verdict',
          count: { $sum: 1 }
        }
      }
    ]);

    const verdictStats = {
      true: 0,
      false: 0,
      misleading: 0,
      unverified: 0
    };

    verdictDistribution.forEach(item => {
      if (verdictStats.hasOwnProperty(item._id)) {
        verdictStats[item._id] = item.count;
      }
    });

    res.json({
      categoryStats: formattedStats,
      verdictDistribution: verdictStats,
      totalClaims: formattedStats.reduce((sum, cat) => sum + cat.total, 0)
    });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Get trending claims (top 5 most recent or popular)
router.get('/trending-claims', async (req, res) => {
  try {
    const { limit = 5 } = req.query;
    
    // Get recent claims with high engagement or verification activity
    const trendingClaims = await Claim.find({
      verificationStatus: { $in: ['verified', 'debunked'] }
    })
    .sort({ 
      createdAt: -1,  // Most recent first
      confidence: -1  // Higher confidence first
    })
    .limit(parseInt(limit))
    .select('text verdict confidence createdAt category')
    .lean();

    res.json(trendingClaims);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Get trends data
router.get('/trends', async (req, res) => {
  try {
    const { period = '7d' } = req.query;

    let startDate = new Date();
    if (period === '24h') {
      startDate.setHours(startDate.getHours() - 24);
    } else if (period === '7d') {
      startDate.setDate(startDate.getDate() - 7);
    } else if (period === '30d') {
      startDate.setDate(startDate.getDate() - 30);
    }

    const claims = await Claim.find({ createdAt: { $gte: startDate } });

    // Group by date
    const dailyData = {};
    claims.forEach(claim => {
      const date = claim.createdAt.toISOString().split('T')[0];
      if (!dailyData[date]) {
        dailyData[date] = {
          date,
          total: 0,
          verified: 0,
          false: 0,
          misleading: 0,
          true: 0
        };
      }
      dailyData[date].total++;
      if (claim.verificationStatus === 'verified') {
        dailyData[date].verified++;
        dailyData[date][claim.verdict]++;
      }
    });

    const timeline = Object.values(dailyData).sort((a, b) => 
      new Date(a.date) - new Date(b.date)
    );

    res.json({ timeline });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Get category distribution
router.get('/categories', async (req, res) => {
  try {
    const categories = await Claim.aggregate([
      {
        $group: {
          _id: '$category',
          count: { $sum: 1 },
          false: {
            $sum: { $cond: [{ $eq: ['$verdict', 'false'] }, 1, 0] }
          },
          misleading: {
            $sum: { $cond: [{ $eq: ['$verdict', 'misleading'] }, 1, 0] }
          }
        }
      },
      {
        $sort: { count: -1 }
      }
    ]);

    res.json(categories);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Get geographic heatmap data
router.get('/heatmap', async (req, res) => {
  try {
    const clusters = await Cluster.find({ status: 'active' })
      .select('geographicDistribution name riskLevel category');

    const heatmapData = [];
    const regionSummary = {};
    const countrySummary = {};

    clusters.forEach(cluster => {
      cluster.geographicDistribution.forEach(geo => {
        // Individual data points
        heatmapData.push({
          country: geo.country,
          region: geo.region,
          count: geo.count,
          clusterName: cluster.name,
          riskLevel: cluster.riskLevel,
          category: cluster.category
        });

        // Region summary
        if (!regionSummary[geo.region]) {
          regionSummary[geo.region] = { count: 0, clusters: new Set(), riskLevels: new Set() };
        }
        regionSummary[geo.region].count += geo.count;
        regionSummary[geo.region].clusters.add(cluster.name);
        regionSummary[geo.region].riskLevels.add(cluster.riskLevel);

        // Country summary
        if (!countrySummary[geo.country]) {
          countrySummary[geo.country] = { count: 0, region: geo.region, clusters: new Set() };
        }
        countrySummary[geo.country].count += geo.count;
        countrySummary[geo.country].clusters.add(cluster.name);
      });
    });

    // Convert sets to arrays and get top countries
    const topCountries = Object.entries(countrySummary)
      .map(([country, data]) => ({
        country,
        region: data.region,
        count: data.count,
        clusters: data.clusters.size
      }))
      .sort((a, b) => b.count - a.count)
      .slice(0, 10);

    const regionData = Object.entries(regionSummary)
      .map(([region, data]) => ({
        region,
        count: data.count,
        clusters: data.clusters.size,
        riskLevels: Array.from(data.riskLevels)
      }))
      .sort((a, b) => b.count - a.count);

    res.json({
      heatmapData,
      topCountries,
      regionData,
      totalClusters: clusters.length
    });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Get top misinformation clusters
router.get('/top-clusters', async (req, res) => {
  try {
    const clusters = await Cluster.find({ status: 'active' })
      .sort({ 'metrics.totalClaims': -1 })
      .limit(10)
      .populate('claims', 'text verdict');

    res.json(clusters);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Generate weekly report
router.get('/weekly-report', authenticateToken, async (req, res) => {
  try {
    if (req.user.role !== 'admin') {
      return res.status(403).json({ error: 'Admin access required' });
    }

    const agents = getAgents();
    if (!agents || !agents.analyst) {
      return res.status(503).json({ error: 'Analyst agent not initialized' });
    }
    
    const report = await agents.analyst.generateWeeklyReport();
    res.json(report);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Generate daily PDF report
router.get('/daily-report-pdf', authenticateToken, async (req, res) => {
  try {
    if (req.user.role !== 'admin') {
      return res.status(403).json({ error: 'Admin access required' });
    }

    console.log('📄 Generating daily PDF report...');

    // Get last 24 hours data
    const last24Hours = new Date();
    last24Hours.setHours(last24Hours.getHours() - 24);

    const claims = await Claim.find({ 
      createdAt: { $gte: last24Hours } 
    }).sort({ createdAt: -1 });

    const stats = {
      totalClaims: claims.length,
      verifiedClaims: claims.filter(c => c.verificationStatus === 'verified').length,
      falseClaims: claims.filter(c => c.verdict === 'false').length,
      trueClaims: claims.filter(c => c.verdict === 'true').length
    };

    const reportData = {
      claims,
      stats,
      period: { start: last24Hours, end: new Date() }
    };

    const result = await PDFGenerator.generatePDF(reportData, 'daily');

    if (result.success) {
      res.setHeader('Content-Type', 'text/html');
      res.setHeader('Content-Disposition', `attachment; filename="${result.filename}"`);
      res.send(result.html);
    } else {
      res.status(500).json({ error: result.error });
    }
  } catch (error) {
    console.error('❌ Daily report error:', error);
    res.status(500).json({ error: error.message });
  }
});

// Generate weekly PDF report
router.get('/weekly-report-pdf', authenticateToken, async (req, res) => {
  try {
    if (req.user.role !== 'admin') {
      return res.status(403).json({ error: 'Admin access required' });
    }

    console.log('📄 Generating weekly PDF report...');

    // Get last 7 days data
    const last7Days = new Date();
    last7Days.setDate(last7Days.getDate() - 7);

    const claims = await Claim.find({ 
      createdAt: { $gte: last7Days } 
    }).sort({ createdAt: -1 });

    const stats = {
      totalClaims: claims.length,
      verifiedClaims: claims.filter(c => c.verificationStatus === 'verified').length,
      falseClaims: claims.filter(c => c.verdict === 'false').length,
      trueClaims: claims.filter(c => c.verdict === 'true').length
    };

    const reportData = {
      claims,
      stats,
      period: { start: last7Days, end: new Date() }
    };

    const result = await PDFGenerator.generatePDF(reportData, 'weekly');

    if (result.success) {
      res.setHeader('Content-Type', 'text/html');
      res.setHeader('Content-Disposition', `attachment; filename="${result.filename}"`);
      res.send(result.html);
    } else {
      res.status(500).json({ error: result.error });
    }
  } catch (error) {
    console.error('❌ Weekly report error:', error);
    res.status(500).json({ error: error.message });
  }
});

module.exports = router;
