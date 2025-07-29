const crypto = require('crypto');
const jwt = require('jsonwebtoken');
const config = require('../../config/config');
const logger = require('../logging/logger');

class UtilityService {
  // Encryption utilities
  static encrypt(text, key = config.JWT_SECRET) {
    const algorithm = 'aes-256-cbc';
    const iv = crypto.randomBytes(16);
    const cipher = crypto.createCipher(algorithm, key);
    let encrypted = cipher.update(text, 'utf8', 'hex');
    encrypted += cipher.final('hex');
    return `${iv.toString('hex')}:${encrypted}`;
  }

  static decrypt(encryptedText, key = config.JWT_SECRET) {
    const algorithm = 'aes-256-cbc';
    const [ivHex, encrypted] = encryptedText.split(':');
    const iv = Buffer.from(ivHex, 'hex');
    const decipher = crypto.createDecipher(algorithm, key);
    let decrypted = decipher.update(encrypted, 'hex', 'utf8');
    decrypted += decipher.final('utf8');
    return decrypted;
  }

  // Hash utilities
  static generateHash(data) {
    return crypto.createHash('sha256').update(data).digest('hex');
  }

  static generateSecureRandom(length = 32) {
    return crypto.randomBytes(length).toString('hex');
  }

  // JWT utilities
  static generateToken(payload, expiresIn = config.JWT_EXPIRES_IN) {
    return jwt.sign(payload, config.JWT_SECRET, { expiresIn });
  }

  static generateRefreshToken(payload) {
    return jwt.sign(payload, config.JWT_REFRESH_SECRET, { 
      expiresIn: config.JWT_REFRESH_EXPIRES_IN 
    });
  }

  static verifyToken(token, secret = config.JWT_SECRET) {
    try {
      return jwt.verify(token, secret);
    } catch (error) {
      throw new Error('Invalid or expired token');
    }
  }

  // Validation utilities
  static validateEmail(email) {
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    return emailRegex.test(email);
  }

  static validatePassword(password) {
    // At least 8 characters, one uppercase, one lowercase, one number
    const passwordRegex = /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)[a-zA-Z\d@$!%*?&]{8,}$/;
    return passwordRegex.test(password);
  }

  static sanitizeInput(input) {
    if (typeof input !== 'string') return input;
    return input.trim().replace(/<script\b[^<]*(?:(?!<\/script>)<[^<]*)*<\/script>/gi, '');
  }

  // Data transformation utilities
  static formatResponse(data, message = 'Success', statusCode = 200) {
    return {
      success: statusCode < 400,
      statusCode,
      message,
      data,
      timestamp: new Date().toISOString()
    };
  }

  static formatError(error, statusCode = 500) {
    logger.errorLog(error, { statusCode });
    
    return {
      success: false,
      statusCode,
      error: error.message || 'Internal Server Error',
      timestamp: new Date().toISOString(),
      ...(config.NODE_ENV === 'development' && { stack: error.stack })
    };
  }

  // Pagination utilities
  static getPaginationOptions(query) {
    const page = parseInt(query.page) || 1;
    const limit = parseInt(query.limit) || 10;
    const skip = (page - 1) * limit;
    
    return {
      page,
      limit: Math.min(limit, 100), // Max 100 items per page
      skip,
      sort: query.sort || '-createdAt'
    };
  }

  static formatPaginatedResponse(data, total, page, limit) {
    const totalPages = Math.ceil(total / limit);
    
    return {
      data,
      pagination: {
        currentPage: page,
        totalPages,
        totalItems: total,
        itemsPerPage: limit,
        hasNextPage: page < totalPages,
        hasPrevPage: page > 1
      }
    };
  }

  // Date utilities
  static formatDate(date, format = 'ISO') {
    const d = new Date(date);
    
    switch (format) {
      case 'ISO':
        return d.toISOString();
      case 'short':
        return d.toLocaleDateString();
      case 'long':
        return d.toLocaleDateString('en-US', { 
          year: 'numeric', 
          month: 'long', 
          day: 'numeric' 
        });
      default:
        return d.toISOString();
    }
  }

  static isDateInRange(date, startDate, endDate) {
    const d = new Date(date);
    const start = new Date(startDate);
    const end = new Date(endDate);
    return d >= start && d <= end;
  }

  // File utilities
  static getFileExtension(filename) {
    return filename.slice((filename.lastIndexOf('.') - 1 >>> 0) + 2);
  }

  static isAllowedFileType(filename) {
    const extension = this.getFileExtension(filename).toLowerCase();
    const allowedTypes = config.ALLOWED_FILE_TYPES.split(',');
    return allowedTypes.includes(extension);
  }

  static formatFileSize(bytes) {
    if (bytes === 0) return '0 Bytes';
    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
  }

  // Performance utilities
  static measureExecutionTime(fn) {
    return async function(...args) {
      const start = Date.now();
      const result = await fn.apply(this, args);
      const duration = Date.now() - start;
      logger.performanceLog(fn.name, duration);
      return result;
    };
  }

  static debounce(func, wait, immediate) {
    let timeout;
    return function executedFunction(...args) {
      const later = () => {
        timeout = null;
        if (!immediate) func(...args);
      };
      const callNow = immediate && !timeout;
      clearTimeout(timeout);
      timeout = setTimeout(later, wait);
      if (callNow) func(...args);
    };
  }

  static throttle(func, limit) {
    let inThrottle;
    return function(...args) {
      if (!inThrottle) {
        func.apply(this, args);
        inThrottle = true;
        setTimeout(() => inThrottle = false, limit);
      }
    };
  }

  // String utilities
  static generateSlug(text) {
    return text
      .toLowerCase()
      .trim()
      .replace(/[^\w\s-]/g, '')
      .replace(/[\s_-]+/g, '-')
      .replace(/^-+|-+$/g, '');
  }

  static truncateText(text, maxLength = 100, suffix = '...') {
    if (text.length <= maxLength) return text;
    return text.substring(0, maxLength - suffix.length) + suffix;
  }

  static capitalize(text) {
    return text.charAt(0).toUpperCase() + text.slice(1).toLowerCase();
  }

  // Error handling utilities
  static asyncHandler(fn) {
    return (req, res, next) => {
      Promise.resolve(fn(req, res, next)).catch(next);
    };
  }

  static createError(message, statusCode = 500, details = {}) {
    const error = new Error(message);
    error.statusCode = statusCode;
    error.details = details;
    return error;
  }

  // Health check utilities
  static async checkServiceHealth(serviceName, healthCheckFn) {
    try {
      const startTime = Date.now();
      const result = await healthCheckFn();
      const responseTime = Date.now() - startTime;
      
      return {
        service: serviceName,
        status: 'healthy',
        responseTime: `${responseTime}ms`,
        details: result
      };
    } catch (error) {
      return {
        service: serviceName,
        status: 'unhealthy',
        error: error.message,
        timestamp: new Date().toISOString()
      };
    }
  }
}

module.exports = UtilityService;
