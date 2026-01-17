const express = require('express');
const AuditLog = require('../models/AuditLog');
const { getAgents } = require('../agents');
const { authenticateToken } = require('./auth');

const router = express.Router();

// Get audit logs
router.get('/audit-logs', authenticateToken, async (req, res) => {
  try {
    if (req.user.role !== 'admin') {
      return res.status(403).json({ error: 'Admin access required' });
    }

    const {
      actor,
      targetType,
      startDate,
      endDate,
      page = 1,
      limit = 50
    } = req.query;

    const query = {};
    if (actor) query.actor = actor;
    if (targetType) query.targetType = targetType;
    if (startDate || endDate) {
      query.timestamp = {};
      if (startDate) query.timestamp.$gte = new Date(startDate);
      if (endDate) query.timestamp.$lte = new Date(endDate);
    }

    const logs = await AuditLog.find(query)
      .sort({ timestamp: -1 })
      .limit(parseInt(limit))
      .skip((parseInt(page) - 1) * parseInt(limit));

    const total = await AuditLog.countDocuments(query);

    res.json({
      logs,
      pagination: {
        page: parseInt(page),
        limit: parseInt(limit),
        total,
        pages: Math.ceil(total / parseInt(limit))
      }
    });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Get compliance report
router.get('/compliance-report', authenticateToken, async (req, res) => {
  try {
    if (req.user.role !== 'admin') {
      return res.status(403).json({ error: 'Admin access required' });
    }

    const agents = getAgents();
    const report = await agents.governance.generateComplianceReport();

    res.json(report);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Get bias detection report
router.get('/bias-report', authenticateToken, async (req, res) => {
  try {
    if (req.user.role !== 'admin') {
      return res.status(403).json({ error: 'Admin access required' });
    }

    const agents = getAgents();
    const report = await agents.governance.runBiasDetection();

    res.json(report);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

module.exports = router;
