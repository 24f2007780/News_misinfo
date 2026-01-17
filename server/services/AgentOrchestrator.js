const { getAgents } = require('../agents');

class AgentOrchestrator {
  static async verifyClaim(claimText) {
    const agents = getAgents();
    
    // Step 1: Ingest the claim
    const normalized = await agents.ingestor.ingestFromSource('manual', { text: claimText });
    
    // Step 2: Extract claims
    const claims = await agents.claimExtractor.extractClaims(normalized.text, normalized);
    
    if (claims.length === 0) {
      return { error: 'No verifiable claims found' };
    }

    const claim = claims[0];

    // Step 3: Detect language and translate if needed
    await agents.multilingual.processMultilingualClaim(claim._id);

    // Step 4: Verify the claim
    const verified = await agents.verification.verifyClaim(claim._id);

    // Step 5: Cluster with similar claims
    await agents.cluster.clusterClaims();

    return verified;
  }

  static async quickVerify(claimText) {
    const agents = getAgents();
    return await agents.verification.quickVerify(claimText);
  }

  static async generateDailyBrief() {
    const agents = getAgents();
    return await agents.analyst.generateDailyBrief();
  }

  static async detectSpikes() {
    const agents = getAgents();
    const trends = await agents.analyst.analyzeTrends();
    return trends.spikes || [];
  }

  static getAgentStatus() {
    const agents = getAgents();
    const status = {};
    
    if (!agents || Object.keys(agents).length === 0) {
      console.warn('⚠️  No agents initialized yet');
      return status;
    }
    
    Object.entries(agents).forEach(([name, agent]) => {
      try {
        status[name] = agent.getStatus();
      } catch (error) {
        console.error(`❌ Error getting status for ${name}:`, error.message);
        status[name] = { status: 'error', error: error.message };
      }
    });

    return status;
  }

  static async chatWithAssistant(userId, message, context) {
    const agents = getAgents();
    if (!agents || !agents.factChecker) {
      throw new Error('FactChecker agent not initialized. Please wait for server startup to complete.');
    }
    return await agents.factChecker.chat(userId, message, context);
  }
}

module.exports = AgentOrchestrator;
