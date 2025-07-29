const winston = require('winston');
const DailyRotateFile = require('winston-daily-rotate-file');
const config = require('../../config/config');

// Define log levels
const logLevels = {
  error: 0,
  warn: 1,
  info: 2,
  http: 3,
  debug: 4,
};

// Define log colors
const logColors = {
  error: 'red',
  warn: 'yellow',
  info: 'green',
  http: 'magenta',
  debug: 'blue',
};

winston.addColors(logColors);

// Create custom format
const logFormat = winston.format.combine(
  winston.format.timestamp({ format: 'YYYY-MM-DD HH:mm:ss' }),
  winston.format.errors({ stack: true }),
  winston.format.json(),
  winston.format.printf((info) => {
    const { timestamp, level, message, ...meta } = info;
    return JSON.stringify({
      timestamp,
      level,
      message,
      ...(Object.keys(meta).length > 0 && { meta })
    });
  })
);

// Console format for development
const consoleFormat = winston.format.combine(
  winston.format.colorize({ all: true }),
  winston.format.timestamp({ format: 'HH:mm:ss' }),
  winston.format.printf((info) => {
    const { timestamp, level, message, ...meta } = info;
    const metaStr = Object.keys(meta).length > 0 ? ` ${JSON.stringify(meta)}` : '';
    return `[${timestamp}] ${level}: ${message}${metaStr}`;
  })
);

// Create transports
const transports = [];

// Console transport for development
if (config.NODE_ENV === 'development') {
  transports.push(
    new winston.transports.Console({
      level: 'debug',
      format: consoleFormat,
    })
  );
} else {
  transports.push(
    new winston.transports.Console({
      level: config.LOG_LEVEL,
      format: logFormat,
    })
  );
}

// File transport for all logs
transports.push(
  new DailyRotateFile({
    filename: 'logs/app-%DATE%.log',
    datePattern: 'YYYY-MM-DD',
    maxSize: '20m',
    maxFiles: '14d',
    level: config.LOG_LEVEL,
    format: logFormat,
  })
);

// Error-only file transport
transports.push(
  new DailyRotateFile({
    filename: 'logs/error-%DATE%.log',
    datePattern: 'YYYY-MM-DD',
    maxSize: '20m',
    maxFiles: '30d',
    level: 'error',
    format: logFormat,
  })
);

// Agent-specific log transport
transports.push(
  new DailyRotateFile({
    filename: 'logs/agents-%DATE%.log',
    datePattern: 'YYYY-MM-DD',
    maxSize: '20m',
    maxFiles: '14d',
    level: 'info',
    format: logFormat,
  })
);

// Create the logger
const logger = winston.createLogger({
  level: config.LOG_LEVEL,
  levels: logLevels,
  format: logFormat,
  transports,
  exitOnError: false,
});

// Add custom logging methods for agents
logger.agentLog = function(agentName, action, data = {}) {
  this.info(`Agent: ${agentName} | Action: ${action}`, {
    agent: agentName,
    action,
    ...data,
    category: 'agent-activity'
  });
};

logger.requestLog = function(req, res, duration) {
  this.http('HTTP Request', {
    method: req.method,
    url: req.originalUrl,
    statusCode: res.statusCode,
    duration: `${duration}ms`,
    userAgent: req.get('User-Agent'),
    ip: req.ip,
    category: 'http-request'
  });
};

logger.errorLog = function(error, context = {}) {
  this.error('Application Error', {
    message: error.message,
    stack: error.stack,
    ...context,
    category: 'application-error'
  });
};

logger.securityLog = function(event, details = {}) {
  this.warn(`Security Event: ${event}`, {
    event,
    ...details,
    category: 'security',
    timestamp: new Date().toISOString()
  });
};

logger.performanceLog = function(operation, duration, details = {}) {
  this.info(`Performance: ${operation}`, {
    operation,
    duration: `${duration}ms`,
    ...details,
    category: 'performance'
  });
};

// Handle uncaught exceptions and unhandled rejections
logger.exceptions.handle(
  new winston.transports.File({ filename: 'logs/exceptions.log' })
);

logger.rejections.handle(
  new winston.transports.File({ filename: 'logs/rejections.log' })
);

// Create a stream for Morgan HTTP logger
logger.stream = {
  write: function(message) {
    logger.http(message.trim());
  },
};

module.exports = logger;
