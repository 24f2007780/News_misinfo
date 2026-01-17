const { EventEmitter } = require('events');
const AuditLog = require('../models/AuditLog');

class BaseAgent extends EventEmitter {
  constructor(name, io) {
    super();
    this.name = name;
    this.io = io;
    this.status = 'idle';
    this.lastAction = null;
    this.queueSize = 0;
    this.processedCount = 0;
    this.errorCount = 0;
    this.startTime = Date.now();
  }

  async start() {
    this.status = 'running';
    console.log(`🤖 ${this.name} agent started`);
    await this.logAction('start', { timestamp: new Date() });
  }

  async stop() {
    this.status = 'stopped';
    console.log(`🛑 ${this.name} agent stopped`);
    await this.logAction('stop', { timestamp: new Date() });
  }

  async pause() {
    this.status = 'paused';
    await this.logAction('pause', { timestamp: new Date() });
  }

  async resume() {
    this.status = 'running';
    await this.logAction('resume', { timestamp: new Date() });
  }

  getStatus() {
    return {
      name: this.name,
      status: this.status,
      lastAction: this.lastAction,
      queueSize: this.queueSize,
      processedCount: this.processedCount,
      errorCount: this.errorCount,
      uptime: Date.now() - this.startTime
    };
  }

  async logAction(action, details) {
    this.lastAction = { action, timestamp: new Date() };
    
    try {
      await AuditLog.create({
        action,
        actor: 'agent',
        actorId: this.name,
        actorName: this.name,
        targetType: 'agent',
        targetId: this.name,
        details
      });
    } catch (error) {
      console.error(`Failed to log action for ${this.name}:`, error);
    }
  }

  emitToAdmin(event, data) {
    if (this.io) {
      this.io.to('admin-room').emit(event, {
        agent: this.name,
        timestamp: new Date(),
        ...data
      });
    }
  }

  async handleError(error, context) {
    this.errorCount++;
    console.error(`❌ Error in ${this.name}:`, error);
    
    await this.logAction('error', {
      error: error.message,
      context,
      stack: error.stack
    });

    this.emitToAdmin('agent-error', {
      error: error.message,
      context
    });
  }
}

module.exports = BaseAgent;
