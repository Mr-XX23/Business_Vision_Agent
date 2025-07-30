import express, { Request, Response } from 'express';
import { HealthResponse } from '../serverTypes.js';

const router = express.Router();

// Health check route
router.get('/health', (req: Request, res: Response<HealthResponse>) => {
  res.status(200).json({
    status: 'healthy',
    message: 'Business Vision AI Platform is running',
    timestamp: new Date().toISOString(),
    version: '1.0.0',
    uptime: process.uptime()
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
