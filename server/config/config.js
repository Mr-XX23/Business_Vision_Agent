require('dotenv').config();

const config = {
  // Server Configuration
  PORT: process.env.PORT || 3000,
  NODE_ENV: process.env.NODE_ENV || 'development',
  
  // Database Configuration
  DATABASE_URL: process.env.DATABASE_URL || 'mongodb://localhost:27017/business_vision_ai',
  
  // Redis/Event Bus Configuration
  REDIS_HOST: process.env.REDIS_HOST || 'localhost',
  REDIS_PORT: process.env.REDIS_PORT || 6379,
  REDIS_PASSWORD: process.env.REDIS_PASSWORD || undefined,
  
  // JWT Configuration
  JWT_SECRET: process.env.JWT_SECRET || 'your-super-secret-jwt-key-change-in-production',
  JWT_EXPIRES_IN: process.env.JWT_EXPIRES_IN || '24h',
  JWT_REFRESH_SECRET: process.env.JWT_REFRESH_SECRET || 'your-refresh-secret-key',
  JWT_REFRESH_EXPIRES_IN: process.env.JWT_REFRESH_EXPIRES_IN || '7d',
  
  // OpenAI Configuration
  OPENAI_API_KEY: process.env.OPENAI_API_KEY,
  OPENAI_MODEL: process.env.OPENAI_MODEL || 'gpt-4',
  OPENAI_MAX_TOKENS: process.env.OPENAI_MAX_TOKENS || 2000,
  OPENAI_TEMPERATURE: process.env.OPENAI_TEMPERATURE || 0.7,
  
  // Rate Limiting Configuration
  RATE_LIMIT_WINDOW_MS: process.env.RATE_LIMIT_WINDOW_MS || 15 * 60 * 1000, // 15 minutes
  RATE_LIMIT_MAX_REQUESTS: process.env.RATE_LIMIT_MAX_REQUESTS || 100,
  
  // Subscription Limits
  FREE_TIER_REQUESTS_PER_MONTH: process.env.FREE_TIER_REQUESTS_PER_MONTH || 10,
  PREMIUM_TIER_REQUESTS_PER_MONTH: process.env.PREMIUM_TIER_REQUESTS_PER_MONTH || 1000,
  ENTERPRISE_TIER_REQUESTS_PER_MONTH: process.env.ENTERPRISE_TIER_REQUESTS_PER_MONTH || 10000,
  
  // Logging Configuration
  LOG_LEVEL: process.env.LOG_LEVEL || 'info',
  LOG_FILE_PATH: process.env.LOG_FILE_PATH || './logs/app.log',
  
  // CORS Configuration
  CORS_ORIGIN: process.env.CORS_ORIGIN || 'http://localhost:3000',
  
  // Email Configuration (for notifications)
  EMAIL_SERVICE: process.env.EMAIL_SERVICE || 'gmail',
  EMAIL_USER: process.env.EMAIL_USER,
  EMAIL_PASSWORD: process.env.EMAIL_PASSWORD,
  
  // File Upload Configuration
  MAX_FILE_SIZE: process.env.MAX_FILE_SIZE || 10 * 1024 * 1024, // 10MB
  ALLOWED_FILE_TYPES: process.env.ALLOWED_FILE_TYPES || 'pdf,doc,docx,txt,csv,xlsx',
  
  // Agent Configuration
  AGENTS: {
    BUSINESS_STRATEGY: {
      NAME: 'Business Strategy Agent',
      ENDPOINT: '/api/agents/business-strategy',
      ENABLED: process.env.BUSINESS_STRATEGY_AGENT_ENABLED !== 'false'
    },
    ASSET_CURATOR: {
      NAME: 'Asset Curator Agent',
      ENDPOINT: '/api/agents/asset-curator',
      ENABLED: process.env.ASSET_CURATOR_AGENT_ENABLED !== 'false'
    },
    USAGE_GUARDIAN: {
      NAME: 'Usage Guardian Agent',
      ENDPOINT: '/api/agents/usage-guardian',
      ENABLED: process.env.USAGE_GUARDIAN_AGENT_ENABLED !== 'false'
    }
  },
  
  // Health Check Configuration
  HEALTH_CHECK_INTERVAL: process.env.HEALTH_CHECK_INTERVAL || 30000, // 30 seconds
  
  // Security Configuration
  BCRYPT_SALT_ROUNDS: process.env.BCRYPT_SALT_ROUNDS || 12,
  SESSION_SECRET: process.env.SESSION_SECRET || 'your-session-secret-key',
  
  // Monitoring & Analytics
  ENABLE_ANALYTICS: process.env.ENABLE_ANALYTICS === 'true',
  ANALYTICS_API_KEY: process.env.ANALYTICS_API_KEY,
  
  // Development Configuration
  ENABLE_DEBUG_LOGS: process.env.NODE_ENV === 'development',
  ENABLE_REQUEST_LOGGING: process.env.ENABLE_REQUEST_LOGGING !== 'false',
  
  // API Gateway Configuration
  API_GATEWAY_TIMEOUT: process.env.API_GATEWAY_TIMEOUT || 30000, // 30 seconds
  API_GATEWAY_RETRY_ATTEMPTS: process.env.API_GATEWAY_RETRY_ATTEMPTS || 3,
  
  // Microservices URLs (for future scaling)
  MICROSERVICES: {
    AUTH_SERVICE_URL: process.env.AUTH_SERVICE_URL || 'http://localhost:3001',
    BUSINESS_STRATEGY_SERVICE_URL: process.env.BUSINESS_STRATEGY_SERVICE_URL || 'http://localhost:3002',
    ASSET_CURATOR_SERVICE_URL: process.env.ASSET_CURATOR_SERVICE_URL || 'http://localhost:3003',
    USAGE_GUARDIAN_SERVICE_URL: process.env.USAGE_GUARDIAN_SERVICE_URL || 'http://localhost:3004'
  }
};

// Validation for required environment variables
const requiredEnvVars = ['OPENAI_API_KEY'];

if (config.NODE_ENV === 'production') {
  requiredEnvVars.push('JWT_SECRET', 'DATABASE_URL', 'JWT_REFRESH_SECRET');
}

const missingEnvVars = requiredEnvVars.filter(envVar => !process.env[envVar]);

if (missingEnvVars.length > 0) {
  console.error('❌ Missing required environment variables:', missingEnvVars);
  if (config.NODE_ENV === 'production') {
    process.exit(1);
  }
}

module.exports = config;
