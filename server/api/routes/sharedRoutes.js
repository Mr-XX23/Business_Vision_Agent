const express = require('express');
const router = express.Router();
const logger = require('../../services/logging/logger');
const UtilityService = require('../../services/utils/utilities');
const databaseConnection = require('../../services/database/connection');
const eventBusManager = require('../../services/event-bus/eventManager');

// Health check endpoint
router.get('/health', async (req, res) => {
  try {
    const healthChecks = await Promise.all([
      UtilityService.checkServiceHealth('database', () => databaseConnection.healthCheck()),
      UtilityService.checkServiceHealth('eventBus', () => eventBusManager.getStatus()),
      UtilityService.checkServiceHealth('logger', () => ({ status: 'operational' }))
    ]);

    const overallStatus = healthChecks.every(check => check.status === 'healthy') ? 'healthy' : 'degraded';

    res.status(overallStatus === 'healthy' ? 200 : 503).json(
      UtilityService.formatResponse({
        overall: overallStatus,
        services: healthChecks,
        timestamp: new Date().toISOString(),
        uptime: process.uptime()
      }, 'Health check completed')
    );
  } catch (error) {
    res.status(500).json(UtilityService.formatError(error));
  }
});

// System status endpoint
router.get('/status', (req, res) => {
  try {
    const status = {
      server: 'running',
      environment: process.env.NODE_ENV || 'development',
      version: process.env.npm_package_version || '1.0.0',
      uptime: process.uptime(),
      memory: process.memoryUsage(),
      timestamp: new Date().toISOString()
    };

    res.json(UtilityService.formatResponse(status, 'System status retrieved'));
  } catch (error) {
    res.status(500).json(UtilityService.formatError(error));
  }
});

// API documentation endpoint
router.get('/docs', (req, res) => {
  try {
    const apiDocs = {
      title: 'Business Vision AI Platform API',
      version: '1.0.0',
      description: 'Microservices-based Agentic AI Platform API Documentation',
      endpoints: {
        authentication: {
          baseUrl: '/api/auth',
          endpoints: [
            'POST /register - User registration',
            'POST /login - User login',
            'POST /refresh - Refresh access token',
            'POST /logout - User logout'
          ]
        },
        agents: {
          businessStrategy: {
            baseUrl: '/api/agents/business-strategy',
            endpoints: [
              'POST /generate - Generate business strategy',
              'GET /history - Get strategy history',
              'GET /:id - Get specific strategy'
            ]
          },
          assetCurator: {
            baseUrl: '/api/agents/asset-curator',
            endpoints: [
              'POST /curate - Curate user assets',
              'GET /assets - Get curated assets',
              'GET /assets/:id - Get specific asset'
            ]
          },
          usageGuardian: {
            baseUrl: '/api/agents/usage-guardian',
            endpoints: [
              'GET /usage - Get current usage',
              'GET /limits - Get usage limits',
              'POST /validate - Validate usage request'
            ]
          }
        },
        shared: {
          baseUrl: '/api',
          endpoints: [
            'GET /health - Health check',
            'GET /status - System status',
            'GET /docs - API documentation'
          ]
        }
      }
    };

    res.json(UtilityService.formatResponse(apiDocs, 'API documentation retrieved'));
  } catch (error) {
    res.status(500).json(UtilityService.formatError(error));
  }
});

// Error testing endpoint (development only)
if (process.env.NODE_ENV === 'development') {
  router.get('/test-error', (req, res) => {
    throw new Error('This is a test error for development purposes');
  });
}

// Rate limit info endpoint
router.get('/rate-limit-info', (req, res) => {
  try {
    const rateLimitInfo = {
      windowMs: process.env.RATE_LIMIT_WINDOW_MS || 900000, // 15 minutes
      maxRequests: process.env.RATE_LIMIT_MAX_REQUESTS || 100,
      message: 'Rate limit information retrieved'
    };

    res.json(UtilityService.formatResponse(rateLimitInfo, 'Rate limit info retrieved'));
  } catch (error) {
    res.status(500).json(UtilityService.formatError(error));
  }
});

// System metrics endpoint
router.get('/metrics', (req, res) => {
  try {
    const metrics = {
      process: {
        pid: process.pid,
        uptime: process.uptime(),
        memory: process.memoryUsage(),
        cpu: process.cpuUsage()
      },
      system: {
        platform: process.platform,
        arch: process.arch,
        nodeVersion: process.version
      },
      timestamp: new Date().toISOString()
    };

    res.json(UtilityService.formatResponse(metrics, 'System metrics retrieved'));
  } catch (error) {
    res.status(500).json(UtilityService.formatError(error));
  }
});

// Ping endpoint
router.get('/ping', (req, res) => {
  res.json({
    message: 'pong',
    timestamp: new Date().toISOString()
  });
});

// Version endpoint
router.get('/version', (req, res) => {
  try {
    const version = {
      api: process.env.npm_package_version || '1.0.0',
      node: process.version,
      environment: process.env.NODE_ENV || 'development'
    };

    res.json(UtilityService.formatResponse(version, 'Version information retrieved'));
  } catch (error) {
    res.status(500).json(UtilityService.formatError(error));
  }
});

module.exports = router;
