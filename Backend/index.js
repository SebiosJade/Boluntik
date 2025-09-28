require('dotenv').config();
const express = require('express');
const path = require('path');
const fs = require('fs');

// Import configurations and middleware
const config = require('./config');
const logger = require('./utils/logger');
const dbConnection = require('./database/connection');
const {
  helmetMiddleware,
  corsMiddleware,
  generalRateLimit,
  authRateLimit,
  uploadRateLimit,
  compressionMiddleware,
  clearRateLimit,
  cleanupRateLimit
} = require('./middleware/security');
const { globalErrorHandler, handleUnhandledRejection, handleUncaughtException } = require('./middleware/errorHandler');

// Import routes
const authRoutes = require('./auth/routes');
const eventRoutes = require('./calendar/routes');

const app = express();

// Create necessary directories
const createDirectories = () => {
  const dirs = ['uploads', 'uploads/avatars', 'logs', 'data'];
  dirs.forEach(dir => {
    const dirPath = path.join(__dirname, dir);
    if (!fs.existsSync(dirPath)) {
      fs.mkdirSync(dirPath, { recursive: true });
      logger.info(`Created directory: ${dir}`);
    }
  });
};

// Initialize directories
createDirectories();

// Security middleware
app.use(helmetMiddleware);
app.use(corsMiddleware);
app.use(compressionMiddleware);

// Rate limiting
app.use('/api/auth', authRateLimit);
app.use('/api/auth/profile/avatar', uploadRateLimit);
app.use(generalRateLimit);

// Debug endpoint for development (clear rate limit)
app.use(clearRateLimit);

// Body parsing middleware
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true, limit: '10mb' }));

// Serve static files from uploads directory
app.use('/uploads', express.static(path.join(__dirname, 'uploads')));

const PORT = config.port;

// Health check endpoint
app.get('/health', (_req, res) => {
  res.json({ 
    status: 'ok', 
    timestamp: new Date().toISOString(),
    environment: config.nodeEnv,
    version: '1.0.0'
  });
});

// API routes
app.use('/api/auth', authRoutes);
app.use('/api/events', eventRoutes);

// Handle 404 routes
app.all('*', (req, res, next) => {
  const error = new Error(`Can't find ${req.originalUrl} on this server!`);
  error.statusCode = 404;
  error.status = 'fail';
  next(error);
});

// Global error handling middleware (must be last)
app.use(globalErrorHandler);

// Handle unhandled rejections and exceptions
handleUnhandledRejection();
handleUncaughtException();

// Start server
const server = app.listen(PORT, '0.0.0.0', async () => {
  logger.info(`🚀 Server running on http://localhost:${PORT}`);
  logger.info(`📱 Environment: ${config.nodeEnv}`);
  logger.info(`🔒 Security middleware enabled`);
  
  // Connect to MongoDB if configured
  if (config.database.type === 'mongodb') {
    try {
      await dbConnection.connect();
      const status = dbConnection.getConnectionStatus();
      logger.info(`🗄️  Database: Connected to MongoDB Atlas`);
      logger.info(`📡 Connection Status: ${JSON.stringify(status)}`);
    } catch (error) {
      logger.error('Failed to connect to MongoDB Atlas:', error);
      logger.warn('Server will continue running with file-based storage');
    }
  } else {
    logger.info(`📁 Database: Using file-based storage (JSON)`);
  }
}).on('error', (error) => {
  logger.error('Server error:', error);
});

// Graceful shutdown
const gracefulShutdown = (signal) => {
  logger.info(`Received ${signal}. Starting graceful shutdown...`);
  
  // Cleanup rate limit stores
  cleanupRateLimit();
  
  // Close database connection if connected
  if (config.database.type === 'mongodb') {
    dbConnection.disconnect().then(() => {
      logger.info('Database connection closed');
    }).catch((error) => {
      logger.error('Error closing database connection:', error);
    });
  }
  
  server.close(() => {
    logger.info('Process terminated');
    process.exit(0);
  });
};

process.on('SIGTERM', () => gracefulShutdown('SIGTERM'));
process.on('SIGINT', () => gracefulShutdown('SIGINT'));