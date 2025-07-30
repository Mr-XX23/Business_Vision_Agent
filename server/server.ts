import express, { Request, Response, Application , NextFunction} from 'express';
import cors from 'cors';
import appConfig from './config/config.js';
import { ErrorResponse } from './serverTypes.js';
import { requestLogger, errorLogger, securityHeaders } from './middleware/common.js';
import healthRoutes from './routes/healthRoutes.js';
import apiRoutes from './routes/apiRoutes.js';
import { databaseManager } from './services/database/index.js';

// Create Express app
const app: Application = express();
const PORT = parseInt(appConfig.PORT);

// Security and common middleware
app.use(securityHeaders);

// Basic middleware
app.use(cors({
  origin: appConfig.CORS_ORIGIN,
  credentials: true
}));

app.use(express.json({ limit: '20mb' }));
app.use(express.urlencoded({ extended: true, limit: '10mb' }));

// Request logging middleware
app.use(requestLogger);

// Routes
app.use('/', healthRoutes);
app.use('/api', apiRoutes);

// Error handling middleware
app.use(errorLogger);
app.use((err: Error, req: Request, res: Response<ErrorResponse>, next: NextFunction) => {
  res.status(500).json({
    error: 'Internal Server Error',
    message: appConfig.NODE_ENV === 'development' ? err.message : 'Something went wrong',
    timestamp: new Date().toISOString(),
    stack: appConfig.NODE_ENV === 'development' ? err.stack : undefined
  });
});

// 404 handler
app.use((req: Request, res: Response<ErrorResponse>) => {
  res.status(404).json({
    error: 'Route Not Found',
    message: `Route ${req.originalUrl} not found`,
    timestamp: new Date().toISOString()
  });
});

// startup function to initialize services
const startServer = async () => {

  try {
    console.log('\n🎉 Starting Business Vision AI Platform...');

    console.log('\n🎉 Connecting to databases...');
    // Connect to all databases first
    await databaseManager.connectAllDatabases();
    // Start the server
    console.log('\n🎉 Starting server...');
    app.listen(PORT, () => {
      console.log('\n🎉 Business Vision AI Platform Started!');
      console.log(`🚀 Server is running on port ${PORT}`);
      console.log(`🌍 Environment: ${appConfig.NODE_ENV}`);
      console.log(`📍 Health check: http://localhost:${PORT}/health`);
      console.log(`📍 API status: http://localhost:${PORT}/api/status`);

      // Log database connection status
      const dbStatus = databaseManager.getConnectionStatus();
      console.log('📊 Database Status:', dbStatus);
      console.log('='.repeat(50));
    });
    //
  } catch (error) {
    console.error('❌ Failed to start server:', error);
    process.exit(1);
  }
}

// Graceful shutdown handlers
process.on('SIGTERM', async () => {
  console.log('\n🛑 SIGTERM received, shutting down gracefully...');
  await databaseManager.disconnectAllDatabases();
  process.exit(0);
});

process.on('SIGINT', async () => {
  console.log('\n🛑 SIGINT received, shutting down gracefully...');
  await databaseManager.disconnectAllDatabases();
  process.exit(0);
});

// Start the server
startServer();

export default app;
