const express = require('express');
const cors = require('cors');
const rateLimit = require('express-rate-limit');
const compression = require('compression');
const helmet = require('helmet');
const config = require('../../config/config');
const logger = require('../logging/logger');
const { authenticateToken } = require('../../auth/middlewares/authMiddleware');

class APIGateway {
  constructor() {
    this.app = express();
    this.setupMiddleware();
    this.setupRoutes();
  }

  setupMiddleware() {
    // Security middleware
    this.app.use(helmet());
    
    // CORS configuration
    this.app.use(cors({
      origin: config.CORS_ORIGIN,
      credentials: true,
      methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
      allowedHeaders: ['Content-Type', 'Authorization', 'X-Requested-With']
    }));

    // Compression middleware
    this.app.use(compression());

    // Body parsing middleware
    this.app.use(express.json({ limit: '10mb' }));
    this.app.use(express.urlencoded({ extended: true, limit: '10mb' }));

    // Rate limiting
    const limiter = rateLimit({
      windowMs: config.RATE_LIMIT_WINDOW_MS,
      max: config.RATE_LIMIT_MAX_REQUESTS,
      message: {
        error: 'Too many requests from this IP, please try again later.',
        retryAfter: config.RATE_LIMIT_WINDOW_MS / 1000
      },
      standardHeaders: true,
      legacyHeaders: false,
    });
    this.app.use('/api/', limiter);

    // Request logging middleware
    if (config.ENABLE_REQUEST_LOGGING) {
      this.app.use((req, res, next) => {
        const start = Date.now();
        
        res.on('finish', () => {
          const duration = Date.now() - start;
          logger.info(`${req.method} ${req.originalUrl} - ${res.statusCode} - ${duration}ms`, {
            method: req.method,
            url: req.originalUrl,
            statusCode: res.statusCode,
            duration,
            userAgent: req.get('User-Agent'),
            ip: req.ip
          });
        });
        
        next();
      });
    }
  }

  setupRoutes() {
    // Health check endpoint
    this.app.get('/health', (req, res) => {
      res.status(200).json({
        status: 'healthy',
        timestamp: new Date().toISOString(),
        uptime: process.uptime(),
        version: process.env.npm_package_version || '1.0.0'
      });
    });

    // API status endpoint
    this.app.get('/api/status', (req, res) => {
      res.status(200).json({
        status: 'API Gateway is running',
        timestamp: new Date().toISOString(),
        services: {
          authService: config.AGENTS.BUSINESS_STRATEGY.ENABLED,
          businessStrategyAgent: config.AGENTS.BUSINESS_STRATEGY.ENABLED,
          assetCuratorAgent: config.AGENTS.ASSET_CURATOR.ENABLED,
          usageGuardianAgent: config.AGENTS.USAGE_GUARDIAN.ENABLED
        }
      });
    });

    // Authentication routes
    this.app.use('/api/auth', require('../../auth/routes/authRoutes'));

    // Agent routes with authentication
    this.app.use('/api/agents/business-strategy', 
      authenticateToken, 
      require('../../agents/business-strategy-agent/routes/businessStrategyRoutes')
    );
    
    this.app.use('/api/agents/asset-curator', 
      authenticateToken, 
      require('../../agents/asset-curator-agent/routes/assetCuratorRoutes')
    );
    
    this.app.use('/api/agents/usage-guardian', 
      authenticateToken, 
      require('../../agents/usage-guardian-agent/routes/usageGuardianRoutes')
    );

    // Shared API routes
    this.app.use('/api', require('../../api/routes/sharedRoutes'));

    // 404 handler
    this.app.use('*', (req, res) => {
      res.status(404).json({
        error: 'Endpoint not found',
        message: `Cannot ${req.method} ${req.originalUrl}`,
        timestamp: new Date().toISOString()
      });
    });

    // Global error handler
    this.app.use((error, req, res, next) => {
      logger.error('Unhandled error:', error);
      
      res.status(error.status || 500).json({
        error: error.message || 'Internal Server Error',
        timestamp: new Date().toISOString(),
        ...(config.NODE_ENV === 'development' && { stack: error.stack })
      });
    });
  }

  async forwardRequest(serviceUrl, req, res) {
    try {
      const axios = require('axios');
      
      const response = await axios({
        method: req.method,
        url: `${serviceUrl}${req.path}`,
        data: req.body,
        headers: {
          ...req.headers,
          host: undefined // Remove host header to avoid conflicts
        },
        timeout: config.API_GATEWAY_TIMEOUT,
        validateStatus: () => true // Don't throw on HTTP error status codes
      });

      // Forward the response
      res.status(response.status).json(response.data);
      
    } catch (error) {
      logger.error('Service forwarding error:', error);
      res.status(503).json({
        error: 'Service Unavailable',
        message: 'The requested service is currently unavailable',
        timestamp: new Date().toISOString()
      });
    }
  }

  getApp() {
    return this.app;
  }
}

module.exports = new APIGateway();
