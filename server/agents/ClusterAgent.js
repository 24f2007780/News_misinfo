const BaseAgent = require('./BaseAgent');
const { getAIService } = require('../services/AIService');
const Claim = require('../models/Claim');
const Cluster = require('../models/Cluster');

class ClusterAgent extends BaseAgent {
  constructor(io) {
    super('Cluster', io);
    this.aiService = getAIService();
  }

  async clusterClaims() {
    try {
      this.status = 'processing';

      // Get uncluster claims
      const unclustered = await Claim.find({ clusterId: null }).limit(100);

      if (unclustered.length === 0) {
        this.status = 'idle';
        return;
      }

      // Generate embeddings for claims
      for (const claim of unclustered) {
        if (!claim.embedding || claim.embedding.length === 0) {
          claim.embedding = await this.generateEmbedding(claim.text);
          await claim.save();
        }
      }

      // Find similar claims and create clusters
      const clusters = await this.findClusters(unclustered);

      for (const clusterData of clusters) {
        const cluster = await Cluster.create({
          name: clusterData.name,
          description: clusterData.description,
          claims: clusterData.claimIds,
          keywords: clusterData.keywords,
          category: clusterData.category,
          timeline: {
            firstSeen: clusterData.firstSeen,
            lastSeen: clusterData.lastSeen
          },
          metrics: {
            totalClaims: clusterData.claimIds.length
          },
          aiSummary: clusterData.summary
        });

        // Update claims with cluster ID
        await Claim.updateMany(
          { _id: { $in: clusterData.claimIds } },
          { clusterId: cluster._id }
        );
      }

      this.processedCount += unclustered.length;
      this.status = 'idle';

      await this.logAction('cluster_claims', {
        claimsProcessed: unclustered.length,
        clustersCreated: clusters.length
      });

      this.emitToAdmin('claims-clustered', {
        claimsProcessed: unclustered.length,
        clustersCreated: clusters.length
      });

    } catch (error) {
    }
  }

  async generateEmbedding(text) {
    try {
      // Simple text-based embedding fallback (since embeddings need OpenAI)
      // For production, use a proper embedding service
      const words = text.toLowerCase().split(/\s+/);
      const embedding = new Array(384).fill(0); // Standard embedding size
      
      // Simple hash-based embedding
      for (let i = 0; i < words.length; i++) {
        const word = words[i];
        for (let j = 0; j < word.length; j++) {
          const charCode = word.charCodeAt(j);
          const index = (charCode + j * 37) % embedding.length;
          embedding[index] += 1 / (i + 1); // Weight by position
        }
      }
      
      // Normalize
      const magnitude = Math.sqrt(embedding.reduce((sum, val) => sum + val * val, 0));
      return embedding.map(val => val / (magnitude || 1));
    } catch (error) {
      console.error('Embedding generation error:', error);
      return [];
    }
  }
  async findClusters(claims) {
    // Simple clustering based on similarity
    const clusters = [];
    const processed = new Set();

    for (let i = 0; i < claims.length; i++) {
      if (processed.has(i)) continue;

      const cluster = {
        claimIds: [claims[i]._id],
        texts: [claims[i].text],
        category: claims[i].category,
        firstSeen: claims[i].createdAt,
        lastSeen: claims[i].createdAt
      };

      processed.add(i);

      // Find similar claims
      for (let j = i + 1; j < claims.length; j++) {
        if (processed.has(j)) continue;

        const similarity = this.cosineSimilarity(
          claims[i].embedding,
          claims[j].embedding
        );

        if (similarity > 0.85) {
          cluster.claimIds.push(claims[j]._id);
          cluster.texts.push(claims[j].text);
          cluster.lastSeen = claims[j].createdAt;
          processed.add(j);
        }
      }

      if (cluster.claimIds.length >= 2) {
        // Generate cluster metadata using AI
        const metadata = await this.generateClusterMetadata(cluster.texts);
        clusters.push({
          ...cluster,
          ...metadata
        });
      }
    }

    return clusters;
  }

  cosineSimilarity(vec1, vec2) {
    if (!vec1 || !vec2 || vec1.length === 0 || vec2.length === 0) return 0;

    let dotProduct = 0;
    let norm1 = 0;
    let norm2 = 0;

    for (let i = 0; i < vec1.length; i++) {
      dotProduct += vec1[i] * vec2[i];
      norm1 += vec1[i] * vec1[i];
      norm2 += vec2[i] * vec2[i];
    }

    return dotProduct / (Math.sqrt(norm1) * Math.sqrt(norm2));
  }

  async generateClusterMetadata(texts) {
    try {
      const messages = [
        {
          role: "system",
          content: "Generate a concise name and description for a cluster of similar claims."
        },
        {
          role: "user",
          content: `Claims:\n${texts.join('\n\n')}`
        }
      ];
      
      const response = await this.aiService.chat(messages, { maxTokens: 200 });
      
      // Parse response (expecting format like "Name: X\nDescription: Y")
      const lines = response.split('\n');
      return {
        name: lines[0]?.replace('Name:', '').trim() || 'Unnamed Cluster',
        description: lines[1]?.replace('Description:', '').trim() || 'No description'
      };
    } catch (error) {
      console.error('Cluster metadata generation error:', error);
      return {
        name: 'Cluster',
        description: 'Similar claims grouped together'
      };
    }
  }

}

module.exports = ClusterAgent;
