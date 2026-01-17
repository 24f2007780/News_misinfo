const express = require('express');
const { getAgents } = require('../agents');
const AgentOrchestrator = require('../services/AgentOrchestrator');
const { authenticateToken } = require('./auth');

const router = express.Router();

// Get all agent statuses
router.get('/status', async (req, res) => {
  try {
    const agents = getAgents();
    console.log('📊 Agent status requested. Agents object keys:', Object.keys(agents));
    
    const status = AgentOrchestrator.getAgentStatus();
    console.log('📊 Status object keys:', Object.keys(status));
    
    // If no agents, return helpful message
    if (Object.keys(status).length === 0) {
      return res.json({
        _message: 'Agents are initializing. Please refresh in a moment.',
        _agentsFound: Object.keys(agents).length
      });
    }
    
    res.json(status);
  } catch (error) {
    console.error('❌ Agent status error:', error);
    res.status(500).json({ error: error.message, stack: error.stack });
  }
});

// Control agent (admin only)
router.post('/:agentName/:action', authenticateToken, async (req, res) => {
  try {
    if (req.user.role !== 'admin') {
      return res.status(403).json({ error: 'Admin access required' });
    }

    const { agentName, action } = req.params;
    const agents = getAgents();

    if (!agents[agentName]) {
      return res.status(404).json({ error: 'Agent not found' });
    }

    const agent = agents[agentName];

    switch (action) {
      case 'start':
        await agent.start();
        break;
      case 'stop':
        await agent.stop();
        break;
      case 'pause':
        await agent.pause();
        break;
      case 'resume':
        await agent.resume();
        break;
      default:
        return res.status(400).json({ error: 'Invalid action' });
    }

    res.json({ message: `Agent ${agentName} ${action} successful`, status: agent.getStatus() });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Chat with fact-checker assistant
router.post('/chat', async (req, res) => {
  try {
    const { message, userId, context } = req.body;

    if (!message) {
      return res.status(400).json({ error: 'Message is required' });
    }

    const response = await AgentOrchestrator.chatWithAssistant(
      userId || 'anonymous',
      message,
      context
    );

    res.json({ response });
  } catch (error) {
    console.error('❌ Chat endpoint error:', error.message);
    console.error('Full error:', error);
    
    // Return more helpful error message
    let errorMessage = error.message;
    if (error.message.includes('not configured')) {
      errorMessage = 'AI service not configured. Please add GEMINI_API_KEY or OPENAI_API_KEY to your .env file.';
    }
    
    res.status(500).json({ 
      error: errorMessage,
      details: 'Check server logs for more information'
    });
  }
});

// Trigger daily brief generation
router.post('/analyst/daily-brief', authenticateToken, async (req, res) => {
  try {
    if (req.user.role !== 'admin') {
      return res.status(403).json({ error: 'Admin access required' });
    }

    const brief = await AgentOrchestrator.generateDailyBrief();
    res.json(brief);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Run bias detection
router.post('/governance/bias-detection', authenticateToken, async (req, res) => {
  try {
    if (req.user.role !== 'admin') {
      return res.status(403).json({ error: 'Admin access required' });
    }

    const agents = getAgents();
    if (!agents || !agents.governance) {
      return res.status(503).json({ error: 'Governance agent not initialized' });
    }
    
    const report = await agents.governance.runBiasDetection();
    res.json(report);
  } catch (error) {
    console.error('❌ Bias detection error:', error);
    res.status(500).json({ error: error.message });
  }
});

module.exports = router;
