const mongoose = require('mongoose');
const config = require('../config');
const logger = require('../utils/logger');

class DatabaseConnection {
  constructor() {
    this.isConnected = false;
  }

  async connect() {
    try {
      if (this.isConnected) {
        logger.info('Database already connected');
        return;
      }

      if (config.database.type !== 'mongodb') {
        logger.info('Database type is not MongoDB, skipping connection');
        return;
      }

      if (!config.database.url) {
        const error = new Error('MongoDB URI is not configured. Please set MONGODB_URI or DATABASE_URL environment variable.');
        logger.error('Database configuration error:', error.message);
        throw error;
      }

      logger.info('Connecting to MongoDB Atlas...');
      
      // Set connection timeout
      const connectionTimeout = setTimeout(() => {
        throw new Error('MongoDB connection timeout after 30 seconds');
      }, 30000);
      
      await mongoose.connect(config.database.url, config.database.options);
      clearTimeout(connectionTimeout);
      
      this.isConnected = true;
      logger.info('Successfully connected to MongoDB Atlas');

      // Handle connection events
      mongoose.connection.on('error', (err) => {
        logger.error('MongoDB connection error:', err);
        this.isConnected = false;
      });

      mongoose.connection.on('disconnected', () => {
        logger.warn('MongoDB disconnected');
        this.isConnected = false;
      });

      mongoose.connection.on('reconnected', () => {
        logger.info('MongoDB reconnected');
        this.isConnected = true;
      });

      // Handle process termination
      process.on('SIGINT', async () => {
        await this.disconnect();
        process.exit(0);
      });

    } catch (error) {
      logger.error('Failed to connect to MongoDB Atlas:', error);
      throw error;
    }
  }

  async disconnect() {
    try {
      if (this.isConnected) {
        await mongoose.connection.close();
        this.isConnected = false;
        logger.info('Disconnected from MongoDB Atlas');
      }
    } catch (error) {
      logger.error('Error disconnecting from MongoDB:', error);
    }
  }

  getConnectionStatus() {
    return {
      isConnected: this.isConnected,
      readyState: mongoose.connection.readyState,
      host: mongoose.connection.host,
      port: mongoose.connection.port,
      name: mongoose.connection.name
    };
  }
}

// Create singleton instance
const dbConnection = new DatabaseConnection();

module.exports = dbConnection;
