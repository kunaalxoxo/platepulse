const mongoose = require('mongoose');
const env = require('./env');
const logger = require('../utils/logger');

const connectDB = async () => {
  try {
    if (!env.MONGODB_URI) {
      logger.warn('MONGODB_URI not set — skipping database connection');
      return;
    }
    const conn = await mongoose.connect(env.MONGODB_URI);
    logger.info(`MongoDB connected: ${conn.connection.host}`);
  } catch (error) {
    logger.warn(`MongoDB connection failed: ${error.message} — running without database`);
  }
};

module.exports = connectDB;
