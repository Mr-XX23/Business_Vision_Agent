const express = require('express');
const config = require('./config/config');
const logger = require('./services/logging/logger');
const databaseConnection = require('./services/database/connection');
const eventBusManager = require('./services/event-bus/eventManager');
const apiGateway = require('./services/api-gateway/gateway');

class BusinessVisionAIServer {
  constructor() {
    this.app = null;
    this.server = null;
    this.isShuttingDown = false;
  }

  async initialize() {
    try {
      logger.info('🚀 Starting Business Vision AI Platform...');

      // Initialize database connection
      await databaseConnection.initialize();
      logger.info('✅ Database initialized successfully');

      // Initialize event bus
      await eventBusManager.initialize();
      logger.info('✅ Event Bus initialized successfully');

      // Get the API Gateway app
      this.app = apiGateway.getApp();

      // Setup graceful shutdown
      this.setupGracefulShutdown();

      logger.info('✅ Business Vision AI Platform initialized successfully');
    } catch (error) {
      logger.errorLog(error, { context: 'Server initialization' });
      process.exit(1);
    }
  }

  async start() {
    try {
      const port = config.PORT;
      
      this.server = this.app.listen(port, () => {
        logger.info(`🌟 Business Vision AI Platform is running on port ${port}`, {
          port,
          environment: config.NODE_ENV,
          timestamp: new Date().toISOString()
        });
        
        logger.info('🔗 Available endpoints:', {
          health: `http://localhost:${port}/health`,
          api: `http://localhost:${port}/api/status`,
          docs: `http://localhost:${port}/api/docs`
        });
      });

      // Handle server errors
      this.server.on('error', (error) => {
        if (error.code === 'EADDRINUSE') {
          logger.errorLog(new Error(`Port ${port} is already in use`), { port });
        } else {
          logger.errorLog(error, { context: 'Server error' });
        }
        process.exit(1);
      });

    } catch (error) {
      logger.errorLog(error, { context: 'Server start' });
      process.exit(1);
    }
  }

  setupGracefulShutdown() {
    const signals = ['SIGTERM', 'SIGINT', 'SIGUSR2'];
    
    signals.forEach(signal => {
      process.on(signal, async () => {
        if (this.isShuttingDown) {
          logger.warn('Forced shutdown initiated');
          process.exit(1);
        }

        this.isShuttingDown = true;
        logger.info(`🛑 ${signal} received, starting graceful shutdown...`);

        await this.gracefulShutdown();
      });
    });

    // Handle uncaught exceptions
    process.on('uncaughtException', (error) => {
      logger.errorLog(error, { context: 'Uncaught Exception' });
      this.gracefulShutdown(1);
    });

    // Handle unhandled promise rejections
    process.on('unhandledRejection', (reason, promise) => {
      logger.errorLog(new Error(`Unhandled Rejection: ${reason}`), { 
        context: 'Unhandled Promise Rejection',
        promise: promise.toString()
      });
      this.gracefulShutdown(1);
    });
  }

  async gracefulShutdown(exitCode = 0) {
    logger.info('Starting graceful shutdown process...');

    try {
      // Set a timeout for forced shutdown
      const shutdownTimeout = setTimeout(() => {
        logger.error('❌ Graceful shutdown timeout, forcing exit');
        process.exit(1);
      }, 30000); // 30 seconds timeout

      // Stop accepting new connections
      if (this.server) {
        logger.info('Closing HTTP server...');
        await new Promise((resolve) => {
          this.server.close(resolve);
        });
        logger.info('✅ HTTP server closed');
      }

      // Disconnect from event bus
      logger.info('Disconnecting from Event Bus...');
      await eventBusManager.gracefulShutdown();
      logger.info('✅ Event Bus disconnected');

      // Disconnect from database
      logger.info('Disconnecting from database...');
      await databaseConnection.disconnect();
      logger.info('✅ Database disconnected');

      clearTimeout(shutdownTimeout);
      logger.info('✅ Graceful shutdown completed successfully');
      
      process.exit(exitCode);
    } catch (error) {
      logger.errorLog(error, { context: 'Graceful shutdown error' });
      process.exit(1);
    }
  }

  // Health check method
  async getHealthStatus() {
    try {
      const [databaseHealth, eventBusHealth] = await Promise.all([
        databaseConnection.healthCheck(),
        Promise.resolve(eventBusManager.getStatus())
      ]);

      return {
        status: 'healthy',
        timestamp: new Date().toISOString(),
        uptime: process.uptime(),
        services: {
          database: databaseHealth,
          eventBus: eventBusHealth,
          server: {
            status: 'healthy',
            port: config.PORT,
            environment: config.NODE_ENV
          }
        }
      };
    } catch (error) {
      logger.errorLog(error, { context: 'Health check' });
      return {
        status: 'unhealthy',
        timestamp: new Date().toISOString(),
        error: error.message
      };
    }
  }
}

// Create and start the server
const server = new BusinessVisionAIServer();

async function startServer() {
  try {
    await server.initialize();
    await server.start();
  } catch (error) {
    logger.errorLog(error, { context: 'Server startup' });
    process.exit(1);
  }
}

// Start the server if this file is run directly
if (require.main === module) {
  startServer();
}

module.exports = server;
