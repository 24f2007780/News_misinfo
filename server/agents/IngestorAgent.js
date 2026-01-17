const BaseAgent = require('./BaseAgent');

class IngestorAgent extends BaseAgent {
  constructor(io) {
    super('Ingestor', io);
    this.sources = [];
  }

  async ingestFromSource(source, data) {
    try {
      this.queueSize++;
      this.status = 'processing';

      // Normalize data based on source
      const normalized = this.normalizeData(source, data);

      this.processedCount++;
      this.queueSize--;
      this.status = 'idle';

      await this.logAction('ingest', {
        source,
        itemsIngested: Array.isArray(data) ? data.length : 1
      });

      this.emitToAdmin('data-ingested', {
        source,
        count: Array.isArray(normalized) ? normalized.length : 1
      });

      return normalized;
    } catch (error) {
      await this.handleError(error, { source });
      this.queueSize--;
      return null;
    }
  }

  normalizeData(source, data) {
    const timestamp = new Date();

    switch (source) {
      case 'twitter':
        return {
          text: data.text || data.full_text,
          platform: 'Twitter',
          url: data.url,
          author: data.user?.screen_name,
          timestamp: new Date(data.created_at)
        };

      case 'telegram':
        return {
          text: data.message || data.text,
          platform: 'Telegram',
          url: data.link,
          author: data.from?.username,
          timestamp: new Date(data.date)
        };

      case 'reddit':
        return {
          text: data.title + '\n' + (data.selftext || ''),
          platform: 'Reddit',
          url: data.url,
          author: data.author,
          timestamp: new Date(data.created_utc * 1000)
        };

      case 'news':
        return {
          text: data.title + '\n' + (data.description || ''),
          platform: 'News',
          url: data.url,
          author: data.source?.name,
          timestamp: new Date(data.publishedAt)
        };

      case 'manual':
        return {
          text: data.text,
          platform: 'Manual',
          url: data.url || null,
          author: data.author || 'Unknown',
          timestamp
        };

      default:
        return {
          text: typeof data === 'string' ? data : JSON.stringify(data),
          platform: source,
          url: null,
          author: 'Unknown',
          timestamp
        };
    }
  }

  addSource(source) {
    this.sources.push(source);
  }

  removeSource(source) {
    this.sources = this.sources.filter(s => s !== source);
  }
}

module.exports = IngestorAgent;
