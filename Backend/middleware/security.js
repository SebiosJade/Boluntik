const helmet = require('helmet');
const cors = require('cors');
const rateLimit = require('express-rate-limit');
const compression = require('compression');
const config = require('../config');

// Helmet security middleware
const helmetMiddleware = helmet({
  contentSecurityPolicy: {
    directives: {
      defaultSrc: ["'self'"],
      styleSrc: ["'self'", "'unsafe-inline'"],
      scriptSrc: ["'self'"],
      imgSrc: ["'self'", "data:", "https:"],
      connectSrc: ["'self'"],
      fontSrc: ["'self'"],
      objectSrc: ["'none'"],
      mediaSrc: ["'self'"],
      frameSrc: ["'none'"],
    },
  },
  crossOriginEmbedderPolicy: false,
});

// CORS middleware
const corsMiddleware = cors({
  origin: config.cors.origin,
  credentials: config.cors.credentials,
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'PATCH', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization', 'X-Requested-With'],
});

// Rate limiting middleware
const generalRateLimit = rateLimit({
  windowMs: config.security.rateLimit.windowMs,
  max: config.security.rateLimit.maxRequests,
  message: {
    error: 'Too many requests from this IP, please try again later.',
    retryAfter: Math.ceil(config.security.rateLimit.windowMs / 1000)
  },
  standardHeaders: true,
  legacyHeaders: false,
});

// Rate limiting for auth endpoints (environment-based)
const isDevelopment = config.nodeEnv === 'development';
const authRateLimit = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: isDevelopment ? 100 : 20, // 100 requests in dev, 20 in production
  message: {
    error: 'Too many authentication attempts, please try again later.',
    retryAfter: 900
  },
  standardHeaders: true,
  legacyHeaders: false,
});

// File upload rate limiting
const uploadRateLimit = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 10, // 10 uploads per 15 minutes
  message: {
    error: 'Too many file uploads, please try again later.',
    retryAfter: 900
  },
  standardHeaders: true,
  legacyHeaders: false,
});

// Compression middleware
const compressionMiddleware = compression();

// Debug endpoint to clear rate limit (development only)
const clearRateLimit = (req, res, next) => {
  if (config.nodeEnv === 'development' && req.path === '/api/debug/clear-rate-limit') {
    // Clear rate limit store (if using memory store)
    if (authRateLimit.store && typeof authRateLimit.store.resetAll === 'function') {
      authRateLimit.store.resetAll();
    }
    if (generalRateLimit.store && typeof generalRateLimit.store.resetAll === 'function') {
      generalRateLimit.store.resetAll();
    }
    if (uploadRateLimit.store && typeof uploadRateLimit.store.resetAll === 'function') {
      uploadRateLimit.store.resetAll();
    }
    res.json({ message: 'Rate limit cleared for development' });
    return;
  }
  next();
};

// Cleanup function for graceful shutdown
const cleanupRateLimit = () => {
  try {
    // Clear all rate limit stores
    [authRateLimit, generalRateLimit, uploadRateLimit].forEach(limiter => {
      if (limiter.store && typeof limiter.store.resetAll === 'function') {
        limiter.store.resetAll();
      }
    });
    logger.info('Rate limit stores cleared');
  } catch (error) {
    logger.error('Error clearing rate limit stores:', error);
  }
};

module.exports = {
  helmetMiddleware,
  corsMiddleware,
  generalRateLimit,
  authRateLimit,
  uploadRateLimit,
  compressionMiddleware,
  clearRateLimit,
  cleanupRateLimit
};
