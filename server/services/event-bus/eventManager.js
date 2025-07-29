const eventBus = require('../../config/eventBus');
const logger = require('../logging/logger');

class EventBusManager {
  constructor() {
    this.channels = new Map();
    this.isInitialized = false;
  }

  async initialize() {
    try {
      await eventBus.connect();
      this.setupGlobalEventHandlers();
      this.isInitialized = true;
      logger.info('✅ Event Bus Manager initialized successfully');
    } catch (error) {
      logger.errorLog(error, { context: 'Event Bus Manager initialization' });
      throw error;
    }
  }

  setupGlobalEventHandlers() {
    // Business Strategy Agent Events
    this.subscribe('business-strategy.request', this.handleBusinessStrategyRequest.bind(this));
    this.subscribe('business-strategy.completed', this.handleBusinessStrategyCompleted.bind(this));
    this.subscribe('business-strategy.error', this.handleBusinessStrategyError.bind(this));

    // Asset Curator Agent Events
    this.subscribe('asset-curator.request', this.handleAssetCuratorRequest.bind(this));
    this.subscribe('asset-curator.completed', this.handleAssetCuratorCompleted.bind(this));
    this.subscribe('asset-curator.error', this.handleAssetCuratorError.bind(this));

    // Usage Guardian Agent Events
    this.subscribe('usage-guardian.check', this.handleUsageCheck.bind(this));
    this.subscribe('usage-guardian.limit-exceeded', this.handleUsageLimitExceeded.bind(this));
    this.subscribe('usage-guardian.usage-updated', this.handleUsageUpdated.bind(this));

    // System Events
    this.subscribe('system.health-check', this.handleSystemHealthCheck.bind(this));
    this.subscribe('system.shutdown', this.handleSystemShutdown.bind(this));
    
    // User Events
    this.subscribe('user.login', this.handleUserLogin.bind(this));
    this.subscribe('user.logout', this.handleUserLogout.bind(this));
    this.subscribe('user.subscription-changed', this.handleUserSubscriptionChanged.bind(this));
  }

  async subscribe(channel, handler) {
    try {
      await eventBus.subscribe(channel, handler);
      this.channels.set(channel, handler);
      logger.info(`Subscribed to channel: ${channel}`);
    } catch (error) {
      logger.errorLog(error, { context: `Subscribing to channel: ${channel}` });
    }
  }

  async publish(channel, data) {
    try {
      await eventBus.publish(channel, {
        ...data,
        timestamp: new Date().toISOString(),
        eventId: this.generateEventId()
      });
      logger.info(`Published event to ${channel}`, { data });
    } catch (error) {
      logger.errorLog(error, { context: `Publishing to channel: ${channel}` });
    }
  }

  // Business Strategy Agent Event Handlers
  async handleBusinessStrategyRequest(data) {
    logger.agentLog('Business Strategy', 'Request Received', data);
    
    // Forward to business strategy service
    await this.publish('internal.business-strategy.process', data);
  }

  async handleBusinessStrategyCompleted(data) {
    logger.agentLog('Business Strategy', 'Process Completed', data);
    
    // Update usage statistics
    await this.publish('usage-guardian.update-usage', {
      userId: data.userId,
      agentType: 'business-strategy',
      action: 'generate-strategy',
      tokensUsed: data.tokensUsed || 0
    });
  }

  async handleBusinessStrategyError(data) {
    logger.agentLog('Business Strategy', 'Process Error', data);
    
    // Log error and notify relevant systems
    await this.publish('system.agent-error', {
      agent: 'business-strategy',
      error: data.error,
      userId: data.userId
    });
  }

  // Asset Curator Agent Event Handlers
  async handleAssetCuratorRequest(data) {
    logger.agentLog('Asset Curator', 'Request Received', data);
    
    await this.publish('internal.asset-curator.process', data);
  }

  async handleAssetCuratorCompleted(data) {
    logger.agentLog('Asset Curator', 'Process Completed', data);
    
    await this.publish('usage-guardian.update-usage', {
      userId: data.userId,
      agentType: 'asset-curator',
      action: 'curate-assets',
      assetsRetrieved: data.assetsRetrieved || 0
    });
  }

  async handleAssetCuratorError(data) {
    logger.agentLog('Asset Curator', 'Process Error', data);
    
    await this.publish('system.agent-error', {
      agent: 'asset-curator',
      error: data.error,
      userId: data.userId
    });
  }

  // Usage Guardian Agent Event Handlers
  async handleUsageCheck(data) {
    logger.agentLog('Usage Guardian', 'Usage Check', data);
    
    await this.publish('internal.usage-guardian.check', data);
  }

  async handleUsageLimitExceeded(data) {
    logger.securityLog('Usage Limit Exceeded', data);
    
    // Notify relevant systems about usage limit breach
    await this.publish('system.usage-limit-exceeded', data);
  }

  async handleUsageUpdated(data) {
    logger.agentLog('Usage Guardian', 'Usage Updated', data);
  }

  // System Event Handlers
  async handleSystemHealthCheck(data) {
    logger.info('System health check requested', data);
    
    // Perform health checks and publish results
    const healthStatus = await this.performHealthCheck();
    await this.publish('system.health-status', healthStatus);
  }

  async handleSystemShutdown(data) {
    logger.warn('System shutdown requested', data);
    
    // Perform graceful shutdown procedures
    await this.gracefulShutdown();
  }

  // User Event Handlers
  async handleUserLogin(data) {
    logger.info('User login event', { userId: data.userId });
    
    // Track user activity
    await this.publish('analytics.user-activity', {
      userId: data.userId,
      action: 'login',
      timestamp: new Date().toISOString()
    });
  }

  async handleUserLogout(data) {
    logger.info('User logout event', { userId: data.userId });
    
    await this.publish('analytics.user-activity', {
      userId: data.userId,
      action: 'logout',
      timestamp: new Date().toISOString()
    });
  }

  async handleUserSubscriptionChanged(data) {
    logger.info('User subscription changed', data);
    
    // Update usage limits and notify relevant agents
    await this.publish('usage-guardian.subscription-updated', data);
  }

  async performHealthCheck() {
    return {
      status: 'healthy',
      timestamp: new Date().toISOString(),
      eventBus: eventBus.getConnectionStatus(),
      channels: Array.from(this.channels.keys())
    };
  }

  async gracefulShutdown() {
    try {
      logger.info('Starting graceful shutdown...');
      
      // Unsubscribe from all channels
      for (const channel of this.channels.keys()) {
        await eventBus.unsubscribe(channel);
      }
      
      // Disconnect from event bus
      await eventBus.disconnect();
      
      logger.info('✅ Event Bus Manager shutdown completed');
    } catch (error) {
      logger.errorLog(error, { context: 'Event Bus Manager shutdown' });
    }
  }

  generateEventId() {
    return `event_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
  }

  getStatus() {
    return {
      isInitialized: this.isInitialized,
      channelCount: this.channels.size,
      channels: Array.from(this.channels.keys()),
      eventBusStatus: eventBus.getConnectionStatus()
    };
  }
}

module.exports = new EventBusManager();
