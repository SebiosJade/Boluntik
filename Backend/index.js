const express = require('express');
const cors = require('cors');
const helmet = require('helmet');
const compression = require('compression');
const rateLimit = require('express-rate-limit');
const { createServer } = require('http');
const { Server: SocketIOServer } = require('socket.io');
const path = require('path');
const fs = require('fs');

// Import configuration
const config = require('./config');

// Import database connection
const dbConnection = require('./database/connection');

// Import middleware
const errorHandler = require('./middleware/errorHandler');
const security = require('./middleware/security');

// Import routes
const authRoutes = require('./auth/routes');
const calendarRoutes = require('./calendar/routes');
const adminRoutes = require('./admin/routes');
const crowdfundingRoutes = require('./crowdfunding/routes');
const emergencyRoutes = require('./emergency/routes');
const chatRoutes = require('./chat/routes');
const resourceRoutes = require('./resources/routes');
const certificateRoutes = require('./certificates/routes');
const notificationRoutes = require('./notifications/routes');
const virtualHubRoutes = require('./virtualHub/routes');

// Import socket handler
const socketHandler = require('./socket/socketHandler');

// Import scheduler service
const schedulerService = require('./services/scheduler');

// Import logger
const logger = require('./utils/logger');

class Server {
  constructor() {
    this.app = express();
    this.server = createServer(this.app);
    this.io = new SocketIOServer(this.server, {
      cors: {
        origin: config.cors.origin,
        methods: ['GET', 'POST'],
        credentials: true
      }
    });
    this.port = config.port;
  }

  async initialize() {
    try {
      // Connect to database
      await dbConnection.connect();
      logger.info('Database connected successfully');

      // Setup middleware
      this.setupMiddleware();

      // Setup routes
      this.setupRoutes();

      // Setup socket.io
      this.setupSocketIO();

      // Setup error handling
      this.setupErrorHandling();

      // Create uploads directory if it doesn't exist
      this.ensureUploadsDirectory();

      // Start scheduler service
      this.startScheduler();

      logger.info('Server initialization completed');
    } catch (error) {
      logger.error('Server initialization failed:', error);
      throw error;
    }
  }

  setupMiddleware() {
    // Security middleware
    this.app.use(helmet({
      crossOriginEmbedderPolicy: false,
      contentSecurityPolicy: {
        directives: {
          defaultSrc: ["'self'"],
          styleSrc: ["'self'", "'unsafe-inline'"],
          scriptSrc: ["'self'"],
          imgSrc: ["'self'", "data:", "https:"],
        },
      },
    }));

    // CORS configuration
    this.app.use(cors(config.cors));

    // Compression middleware
    this.app.use(compression());

    // Rate limiting
    const limiter = rateLimit({
      windowMs: config.security.rateLimit.windowMs,
      max: config.security.rateLimit.maxRequests,
      message: {
        error: 'Too many requests from this IP, please try again later.',
        retryAfter: Math.ceil(config.security.rateLimit.windowMs / 1000)
      },
      standardHeaders: true,
      legacyHeaders: false,
    });
    this.app.use('/api/', limiter);

    // Body parsing middleware
    this.app.use(express.json({ limit: '10mb' }));
    this.app.use(express.urlencoded({ extended: true, limit: '10mb' }));

    // Static file serving
    this.app.use('/uploads', express.static(path.join(__dirname, 'uploads')));

    // Request logging middleware
    this.app.use((req, res, next) => {
      logger.info(`${req.method} ${req.path} - ${req.ip}`);
      next();
    });

    logger.info('Middleware setup completed');
  }

  setupRoutes() {
    // Health check endpoint
    this.app.get('/health', (req, res) => {
      res.status(200).json({
        status: 'OK',
        timestamp: new Date().toISOString(),
        uptime: process.uptime(),
        environment: config.nodeEnv,
        database: dbConnection.getConnectionStatus()
      });
    });

    // API routes
    this.app.use('/api/auth', authRoutes);
    this.app.use('/api/events', calendarRoutes);
    this.app.use('/api/admin', adminRoutes);
    this.app.use('/api/crowdfunding', crowdfundingRoutes);
    this.app.use('/api/emergency', emergencyRoutes);
    this.app.use('/api/chat', chatRoutes);
    this.app.use('/api/resources', resourceRoutes);
    this.app.use('/api/certificates', certificateRoutes);
    this.app.use('/api/notifications', notificationRoutes);
    this.app.use('/api/virtual', virtualHubRoutes);

    // Root endpoint
    this.app.get('/', (req, res) => {
      res.json({
        message: 'VolunTech API Server',
        version: '1.0.0',
        status: 'running',
        timestamp: new Date().toISOString(),
        endpoints: {
          health: '/health',
          auth: '/api/auth',
          events: '/api/events',
          admin: '/api/admin',
          crowdfunding: '/api/crowdfunding',
          emergency: '/api/emergency',
          chat: '/api/chat',
          resources: '/api/resources',
          certificates: '/api/certificates',
          notifications: '/api/notifications',
          virtual: '/api/virtual'
        }
      });
    });

    // 404 handler for API routes
    this.app.use('/api/*', (req, res) => {
      res.status(404).json({
        error: 'API endpoint not found',
        path: req.path,
        method: req.method,
        timestamp: new Date().toISOString()
      });
    });

    logger.info('Routes setup completed');
  }

  setupSocketIO() {
    socketHandler(this.io);
    logger.info('Socket.IO setup completed');
  }

  setupErrorHandling() {
    // Global error handler
    this.app.use(errorHandler.globalErrorHandler);

    // Handle uncaught exceptions
    process.on('uncaughtException', (error) => {
      logger.error('Uncaught Exception:', error);
      process.exit(1);
    });

    // Handle unhandled promise rejections
    process.on('unhandledRejection', (reason, promise) => {
      logger.error('Unhandled Rejection at:', promise, 'reason:', reason);
      process.exit(1);
    });

    // Graceful shutdown
    process.on('SIGTERM', () => {
      logger.info('SIGTERM received, shutting down gracefully');
      this.shutdown();
    });

    process.on('SIGINT', () => {
      logger.info('SIGINT received, shutting down gracefully');
      this.shutdown();
    });

    logger.info('Error handling setup completed');
  }

  ensureUploadsDirectory() {
    const uploadsDir = path.join(__dirname, 'uploads');
    const subdirs = ['avatars', 'certificates', 'campaigns', 'donations'];

    if (!fs.existsSync(uploadsDir)) {
      fs.mkdirSync(uploadsDir, { recursive: true });
    }

    subdirs.forEach(subdir => {
      const subdirPath = path.join(uploadsDir, subdir);
      if (!fs.existsSync(subdirPath)) {
        fs.mkdirSync(subdirPath, { recursive: true });
      }
    });

    logger.info('Upload directories ensured');
  }

  startScheduler() {
    try {
      schedulerService.start();
      logger.info('Scheduler service started');
    } catch (error) {
      logger.error('Failed to start scheduler service:', error);
    }
  }

  stopScheduler() {
    try {
      schedulerService.stop();
      logger.info('Scheduler service stopped');
    } catch (error) {
      logger.error('Failed to stop scheduler service:', error);
    }
  }

  async start() {
    try {
      await this.initialize();
      
      this.server.listen(this.port, () => {
        logger.info(`🚀 VolunTech Server running on port ${this.port}`);
        logger.info(`📊 Environment: ${config.nodeEnv}`);
        logger.info(`🌐 API Base URL: http://localhost:${this.port}/api`);
        logger.info(`🔗 Health Check: http://localhost:${this.port}/health`);
        logger.info(`📡 Socket.IO: Enabled`);
        
        if (config.nodeEnv === 'development') {
          logger.info('🔧 Development mode - CORS enabled for all origins');
        }
      });

      return this.server;
    } catch (error) {
      logger.error('Failed to start server:', error);
      throw error;
    }
  }

  async shutdown() {
    try {
      logger.info('Shutting down server...');
      
      // Close HTTP server
      this.server.close(() => {
        logger.info('HTTP server closed');
      });

      // Close database connection
      await dbConnection.disconnect();
      logger.info('Database connection closed');

      // Close Socket.IO
      this.io.close(() => {
        logger.info('Socket.IO server closed');
      });

      // Stop scheduler service
      this.stopScheduler();

      logger.info('Server shutdown completed');
      process.exit(0);
    } catch (error) {
      logger.error('Error during shutdown:', error);
      process.exit(1);
    }
  }
}

// Create and start server
const server = new Server();

// Start server if this file is run directly
if (require.main === module) {
  server.start().catch((error) => {
    logger.error('Server startup failed:', error);
    process.exit(1);
  });
}

module.exports = server;
