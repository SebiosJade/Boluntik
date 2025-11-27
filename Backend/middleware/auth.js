const jwt = require('jsonwebtoken');
const config = require('../config');
const logger = require('../utils/logger');

const authenticateToken = (req, res, next) => {
  const authHeader = req.headers['authorization'];
  const token = authHeader && authHeader.split(' ')[1];

  if (!token) {
    return res.status(401).json({ message: 'Access token required' });
  }

  jwt.verify(token, config.jwt.secret, (err, payload) => {
    if (err) {
      logger.error('JWT verification failed:', err);
      return res.status(403).json({ message: 'Invalid or expired token' });
    }
    
    // Set req.user with proper structure
    // JWT payload has { sub: userId, iat: ..., exp: ... }
    req.user = {
      id: payload.sub,  // Map 'sub' to 'id' for consistency
      ...payload
    };
    
    next();
  });
};

// Middleware to restrict access to specific roles
const restrictTo = (...roles) => {
  return (req, res, next) => {
    if (!req.user) {
      return res.status(401).json({ message: 'Not authenticated' });
    }

    if (!roles.includes(req.user.role)) {
      logger.warn(`Access denied for user ${req.user.id} with role ${req.user.role}`);
      return res.status(403).json({ 
        message: 'You do not have permission to perform this action' 
      });
    }

    next();
  };
};

// Optional authentication middleware (doesn't fail if no token)
const optionalAuth = (req, res, next) => {
  const authHeader = req.headers['authorization'];
  const token = authHeader && authHeader.split(' ')[1];

  if (!token) {
    // No token provided, continue as guest user
    req.user = null;
    return next();
  }

  jwt.verify(token, config.jwt.secret, (err, payload) => {
    if (err) {
      // Invalid token, continue as guest user
      logger.warn('Optional auth - invalid token:', err.message);
      req.user = null;
    } else {
      // Valid token, set user
      req.user = {
        id: payload.sub,
        ...payload
      };
    }
    next();
  });
};

// Alias for protect middleware (commonly used in routes)
const protect = authenticateToken;

module.exports = { 
  authenticateToken, 
  protect,
  restrictTo,
  optionalAuth
};
