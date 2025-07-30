import { Request, Response, NextFunction } from 'express';
import appConfig from '../config/config.js';

// Request logging middleware
export const requestLogger = (req: Request, res: Response, next: NextFunction): void => {
  const start = Date.now();
  
  // Log the incoming request
  console.log(`📝 ${req.method} ${req.originalUrl} - ${new Date().toISOString()}`);
  
  // Log response time when request completes
  res.on('finish', () => {
    const duration = Date.now() - start;
    const status = res.statusCode;
    const statusEmoji = status >= 400 ? '❌' : status >= 300 ? '⚠️' : '✅';
    
    if (appConfig.LOG_LEVEL === 'debug' || status >= 400) {
      console.log(`${statusEmoji} ${req.method} ${req.originalUrl} - ${status} - ${duration}ms`);
    }
  });
  
  next();
};

// Error logging middleware
export const errorLogger = (err: Error, req: Request, res: Response, next: NextFunction): void => {
  console.error('❌ Server Error:', {
    message: err.message,
    stack: appConfig.NODE_ENV === 'development' ? err.stack : undefined,
    url: req.originalUrl,
    method: req.method,
    timestamp: new Date().toISOString()
  });
  
  next(err);
};

// Security headers middleware
export const securityHeaders = (req: Request, res: Response, next: NextFunction): void => {
  res.setHeader('X-Content-Type-Options', 'nosniff');
  res.setHeader('X-Frame-Options', 'DENY');
  res.setHeader('X-XSS-Protection', '1; mode=block');
  res.setHeader('Referrer-Policy', 'strict-origin-when-cross-origin');
  
  next();
};
