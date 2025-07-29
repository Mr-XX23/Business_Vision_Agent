const mongoose = require('mongoose');
const config = require('../../config/config');
const logger = require('../logging/logger');

class DatabaseConnection {
  constructor() {
    this.connection = null;
    this.isConnected = false;
    this.connectionRetries = 0;
    this.maxRetries = 5;
  }

  async initialize() {
    try {
      await this.connect();
      this.setupEventHandlers();
      return this.connection;
    } catch (error) {
      logger.errorLog(error, { context: 'Database initialization' });
      throw error;
    }
  }

  async connect() {
    try {
      if (this.isConnected && this.connection) {
        return this.connection;
      }

      const options = {
        useNewUrlParser: true,
        useUnifiedTopology: true,
        maxPoolSize: 10,
        serverSelectionTimeoutMS: 5000,
        socketTimeoutMS: 45000,
        family: 4,
        bufferCommands: false,
        bufferMaxEntries: 0,
      };

      logger.info('Connecting to database...', { url: config.DATABASE_URL });
      
      this.connection = await mongoose.connect(config.DATABASE_URL, options);
      this.isConnected = true;
      this.connectionRetries = 0;

      logger.info('✅ Database connected successfully', {
        host: mongoose.connection.host,
        port: mongoose.connection.port,
        name: mongoose.connection.name
      });

      return this.connection;
    } catch (error) {
      this.isConnected = false;
      logger.errorLog(error, { context: 'Database connection' });
      
      if (this.connectionRetries < this.maxRetries) {
        this.connectionRetries++;
        logger.info(`Retrying database connection... (${this.connectionRetries}/${this.maxRetries})`);
        await this.delay(5000 * this.connectionRetries); // Exponential backoff
        return this.connect();
      }
      
      throw error;
    }
  }

  setupEventHandlers() {
    mongoose.connection.on('error', (err) => {
      logger.errorLog(err, { context: 'Database connection error' });
      this.isConnected = false;
    });

    mongoose.connection.on('disconnected', () => {
      logger.warn('Database disconnected');
      this.isConnected = false;
      
      // Attempt to reconnect
      if (this.connectionRetries < this.maxRetries) {
        setTimeout(() => {
          this.connect().catch(err => {
            logger.errorLog(err, { context: 'Database reconnection attempt' });
          });
        }, 5000);
      }
    });

    mongoose.connection.on('reconnected', () => {
      logger.info('✅ Database reconnected');
      this.isConnected = true;
      this.connectionRetries = 0;
    });

    mongoose.connection.on('connected', () => {
      logger.info('Database connected');
      this.isConnected = true;
    });
  }

  async disconnect() {
    try {
      if (this.connection) {
        await mongoose.disconnect();
        this.isConnected = false;
        logger.info('✅ Database disconnected successfully');
      }
    } catch (error) {
      logger.errorLog(error, { context: 'Database disconnection' });
      throw error;
    }
  }

  getStatus() {
    return {
      isConnected: this.isConnected,
      readyState: mongoose.connection.readyState,
      host: mongoose.connection.host,
      port: mongoose.connection.port,
      name: mongoose.connection.name,
      connectionRetries: this.connectionRetries
    };
  }

  async healthCheck() {
    try {
      if (!this.isConnected) {
        return { status: 'disconnected', healthy: false };
      }

      // Perform a simple database operation to verify connection
      await mongoose.connection.db.admin().ping();
      
      return {
        status: 'connected',
        healthy: true,
        details: this.getStatus()
      };
    } catch (error) {
      logger.errorLog(error, { context: 'Database health check' });
      return {
        status: 'error',
        healthy: false,
        error: error.message
      };
    }
  }

  delay(ms) {
    return new Promise(resolve => setTimeout(resolve, ms));
  }
}

module.exports = new DatabaseConnection();
