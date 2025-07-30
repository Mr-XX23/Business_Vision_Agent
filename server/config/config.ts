import { config } from "dotenv";
import { AppConfig } from './configTypes.js';

config();

// Validate required environment variables
const validateConfig = (): AppConfig => {

    const requiredVars = ['NODE_ENV', 'PORT'];
    const missing = requiredVars.filter(varName => !process.env[varName]);

    if (missing.length > 0) {
    console.error('❌ Missing required environment variables:', missing);
    process.exit(1);
  }

  return {
    NODE_ENV: process.env.NODE_ENV || 'development',
    PORT: process.env.PORT || '3000',
    API_VERSION: process.env.API_VERSION || 'v1',
    APP_NAME: process.env.APP_NAME || 'Business Vision AI Platform',
    LOG_LEVEL: process.env.LOG_LEVEL || 'info',
    CORS_ORIGIN: process.env.CORS_ORIGIN || '*'
  };
};

const appConfig = validateConfig();

// Log configuration on startup
console.log('📋 Configuration loaded:');
console.log(`   Environment: ${appConfig.NODE_ENV}`);
console.log(`   Port: ${appConfig.PORT}`);
console.log(`   API Version: ${appConfig.API_VERSION}`);
console.log(`   App Name: ${appConfig.APP_NAME}`);
console.log(`   Log Level: ${appConfig.LOG_LEVEL}`);
console.log('=' .repeat(50));

export default appConfig;
export type { AppConfig };