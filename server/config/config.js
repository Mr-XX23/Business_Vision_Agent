import { config } from "dotenv";

config();

const appConfig = {
    // Server Configuration
    PORT: process.env.PORT || 3000,
    NODE_ENV: process.env.NODE_ENV || 'development',
    
    // Basic validation
    validate() {
        const requiredVars = [];
        const missingVars = requiredVars.filter(varName => !process.env[varName]);
        
        if (missingVars.length > 0) {
            console.error('❌ Missing required environment variables:', missingVars);
            if (this.NODE_ENV === 'production') {
                process.exit(1);
            }
        }
        
        console.log('✅ Configuration loaded successfully');
        console.log(`📊 Environment: ${this.NODE_ENV}`);
        console.log(`🚪 Port: ${this.PORT}`);
    }
};

// Validate configuration on import
appConfig.validate();

export default appConfig;
