require('dotenv').config();

const config = {
  // Server Configuration
  port: process.env.PORT || 4000,
  nodeEnv: process.env.NODE_ENV || 'development',
  
  // JWT Configuration
  jwt: {
    secret: process.env.JWT_SECRET || (() => {
      if (process.env.NODE_ENV === 'production') {
        throw new Error('JWT_SECRET must be set in production environment');
      }
      return 'dev_secret_change_me_in_production';
    })(),
    expiresIn: process.env.JWT_EXPIRES_IN || '7d'
  },
  
  // Database Configuration
  database: {
    url: process.env.MONGODB_URI || process.env.DATABASE_URL || 'mongodb://localhost:27017/voluntech',
    type: process.env.DATABASE_TYPE || 'mongodb', // 'file', 'mongodb'
    options: {
      useNewUrlParser: true,
      useUnifiedTopology: true,
      maxPoolSize: 10, // Maintain up to 10 socket connections
      serverSelectionTimeoutMS: 5000, // Keep trying to send operations for 5 seconds
      socketTimeoutMS: 45000, // Close sockets after 45 seconds of inactivity
      family: 4 // Use IPv4, skip trying IPv6
    }
  },
  
  // Email Configuration
  email: {
    service: process.env.EMAIL_SERVICE || 'gmail',
    user: process.env.EMAIL_USER || (() => {
      if (process.env.NODE_ENV === 'production') {
        throw new Error('EMAIL_USER must be set in production environment');
      }
      return 'voluntech4@gmail.com';
    })(),
    pass: process.env.EMAIL_PASS || (() => {
      if (process.env.NODE_ENV === 'production') {
        throw new Error('EMAIL_PASS must be set in production environment');
      }
      return 'yqnm uduy dsdx swsm';
    })(),
    from: process.env.EMAIL_FROM || 'VolunTech <noreply@voluntech.com>'
  },
  
  // Security Configuration
  security: {
    bcryptRounds: parseInt(process.env.BCRYPT_ROUNDS) || 12,
    rateLimit: {
      windowMs: parseInt(process.env.RATE_LIMIT_WINDOW_MS) || 15 * 60 * 1000, // 15 minutes
      maxRequests: parseInt(process.env.RATE_LIMIT_MAX_REQUESTS) || 100
    }
  },
  
  // File Upload Configuration
  upload: {
    maxFileSize: parseInt(process.env.MAX_FILE_SIZE) || 5 * 1024 * 1024, // 5MB
    uploadPath: process.env.UPLOAD_PATH || './uploads',
    allowedMimeTypes: ['image/jpeg', 'image/png', 'image/gif', 'image/webp']
  },
  
  // CORS Configuration
  cors: {
    origin: process.env.CORS_ORIGIN ? process.env.CORS_ORIGIN.split(',') : ['http://localhost:3000', 'http://localhost:8081'],
    credentials: true
  },
  
  // Redis Configuration
  redis: {
    url: process.env.REDIS_URL || 'redis://localhost:6379'
  }
};

module.exports = config;
