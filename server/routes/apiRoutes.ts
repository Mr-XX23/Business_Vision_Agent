import express, { Request, Response } from 'express';
import { StatusResponse } from '../serverTypes.js';
import appConfig from '../config/config.js';

const router = express.Router();

// API status route
router.get('/status', (req: Request, res: Response<StatusResponse>) => {
  res.status(200).json({
    message: 'API is working',
    environment: appConfig.NODE_ENV,
    port: appConfig.PORT,
    timestamp: new Date().toISOString(),
    apiVersion: appConfig.API_VERSION
  });
});

// API version route
router.get('/version', (req: Request, res: Response) => {
  res.status(200).json({
    api_version: appConfig.API_VERSION,
    app_name: appConfig.APP_NAME,
    environment: appConfig.NODE_ENV,
    timestamp: new Date().toISOString()
  });
});

export default router;
