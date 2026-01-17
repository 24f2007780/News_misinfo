const IngestorAgent = require('./IngestorAgent');
const ClaimExtractorAgent = require('./ClaimExtractorAgent');
const ClusterAgent = require('./ClusterAgent');
const VerificationAgent = require('./VerificationAgent');
const MultilingualAgent = require('./MultilingualAgent');
const FactCheckerAssistantAgent = require('./FactCheckerAssistantAgent');
const AnalystAgent = require('./AnalystAgent');
const GovernanceAgent = require('./GovernanceAgent');

let agents = {};

function initializeAgents(io) {
  console.log('🤖 Initializing AI Agents...');
  
  try {
    agents = {
      ingestor: new IngestorAgent(io),
      claimExtractor: new ClaimExtractorAgent(io),
      cluster: new ClusterAgent(io),
      verification: new VerificationAgent(io),
      multilingual: new MultilingualAgent(io),
      factChecker: new FactCheckerAssistantAgent(io),
      analyst: new AnalystAgent(io),
      governance: new GovernanceAgent(io)
    };

    // Start agents
    Object.entries(agents).forEach(([name, agent]) => {
      try {
        agent.start();
        console.log(`✅ ${name} agent initialized`);
      } catch (error) {
        console.error(`❌ Failed to start ${name} agent:`, error.message);
      }
    });

    console.log(`✅ All ${Object.keys(agents).length} agents initialized`);
    return agents;
  } catch (error) {
    console.error('❌ Agent initialization failed:', error);
    throw error;
  }
}

function getAgents() {
  return agents;
}

module.exports = {
  initializeAgents,
  getAgents
};
