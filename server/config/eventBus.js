const Redis = require('redis');
const EventEmitter = require('events');

class EventBusService extends EventEmitter {
  constructor() {
    super();
    this.redisClient = null;
    this.publisher = null;
    this.subscriber = null;
    this.isConnected = false;
  }

  async connect() {
    try {
      const redisConfig = {
        host: process.env.REDIS_HOST || 'localhost',
        port: process.env.REDIS_PORT || 6379,
        password: process.env.REDIS_PASSWORD || undefined,
        retryDelayOnFailover: 100,
        maxRetriesPerRequest: 3,
        lazyConnect: true
      };

      // Create Redis clients
      this.publisher = Redis.createClient(redisConfig);
      this.subscriber = Redis.createClient(redisConfig);
      this.redisClient = Redis.createClient(redisConfig);

      // Connect all clients
      await Promise.all([
        this.publisher.connect(),
        this.subscriber.connect(),
        this.redisClient.connect()
      ]);

      this.isConnected = true;
      console.log('✅ Event Bus (Redis) connected successfully');

      // Handle errors
      [this.publisher, this.subscriber, this.redisClient].forEach(client => {
        client.on('error', (err) => {
          console.error('❌ Redis Client Error:', err);
          this.isConnected = false;
        });

        client.on('reconnecting', () => {
          console.log('🔄 Redis reconnecting...');
        });

        client.on('ready', () => {
          console.log('✅ Redis client ready');
          this.isConnected = true;
        });
      });

      // Set up message handling
      this.setupMessageHandling();

    } catch (error) {
      console.error('❌ Event Bus connection failed:', error);
      this.isConnected = false;
      throw error;
    }
  }

  setupMessageHandling() {
    this.subscriber.on('message', (channel, message) => {
      try {
        const parsedMessage = JSON.parse(message);
        this.emit(channel, parsedMessage);
      } catch (error) {
        console.error('❌ Error parsing message:', error);
        this.emit(channel, message);
      }
    });
  }

  async publish(channel, data) {
    try {
      if (!this.isConnected) {
        throw new Error('Event Bus not connected');
      }

      const message = typeof data === 'string' ? data : JSON.stringify(data);
      await this.publisher.publish(channel, message);
      console.log(`📢 Published to ${channel}:`, data);
    } catch (error) {
      console.error('❌ Error publishing message:', error);
      throw error;
    }
  }

  async subscribe(channel, callback) {
    try {
      if (!this.isConnected) {
        throw new Error('Event Bus not connected');
      }

      await this.subscriber.subscribe(channel);
      this.on(channel, callback);
      console.log(`👂 Subscribed to channel: ${channel}`);
    } catch (error) {
      console.error('❌ Error subscribing to channel:', error);
      throw error;
    }
  }

  async unsubscribe(channel) {
    try {
      await this.subscriber.unsubscribe(channel);
      this.removeAllListeners(channel);
      console.log(`🔇 Unsubscribed from channel: ${channel}`);
    } catch (error) {
      console.error('❌ Error unsubscribing from channel:', error);
      throw error;
    }
  }

  async disconnect() {
    try {
      if (this.publisher) await this.publisher.disconnect();
      if (this.subscriber) await this.subscriber.disconnect();
      if (this.redisClient) await this.redisClient.disconnect();
      
      this.isConnected = false;
      console.log('✅ Event Bus disconnected successfully');
    } catch (error) {
      console.error('❌ Error disconnecting Event Bus:', error);
      throw error;
    }
  }

  getConnectionStatus() {
    return {
      isConnected: this.isConnected,
      publisherReady: this.publisher?.isReady || false,
      subscriberReady: this.subscriber?.isReady || false,
      clientReady: this.redisClient?.isReady || false
    };
  }
}

module.exports = new EventBusService();
