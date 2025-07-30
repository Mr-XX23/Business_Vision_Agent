import express, { Request, Response } from 'express';
import { HealthResponse } from '../serverTypes.js';
import { databaseManager } from '../services/database/index.js';

const router = express.Router();

// Health check route with database status
router.get('/health', (req: Request, res: Response<HealthResponse>) => {

  // Check database connections
  const dbStatus = databaseManager.getConnectionStatus();

  // Check if all databases are connected
  const allDatabasesHealthy = Object.values(dbStatus).every( status => status === 'connected');

  res.status(200).json({
    status: allDatabasesHealthy ? 'healthy' : 'degraded',
    message: allDatabasesHealthy 
      ? 'Business Vision AI Platform is running' 
      : 'Business Vision AI Platform is running with database issues',
    timestamp: new Date().toISOString(),
    version: '1.0.0',
    uptime: process.uptime()
  });

});

// Database health check route
router.get('/health/database', (req: Request, res: Response) => {
  const dbStatus = databaseManager.getConnectionStatus();
  const allDatabasesHealthy = Object.values(dbStatus).every(status => status === 'connected');
  
  res.status(allDatabasesHealthy ? 200 : 503).json({
    status: allDatabasesHealthy ? 'healthy' : 'unhealthy',
    databases: dbStatus,
    timestamp: new Date().toISOString()
  });
});

// System info route
router.get('/info', (req: Request, res: Response) => {
  res.status(200).json({
    application: 'Business Vision AI Platform',
    version: '1.0.0',
    node_version: process.version,
    platform: process.platform,
    architecture: process.arch,
    memory_usage: process.memoryUsage(),
    uptime: process.uptime(),
    timestamp: new Date().toISOString()
  });
});

export default router;
