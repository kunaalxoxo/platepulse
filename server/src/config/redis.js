const Redis = require('ioredis');
const env = require('./env');
const logger = require('../utils/logger');

let redisClient = null;

const connectRedis = async () => {
  try {
    if (!env.REDIS_URL) {
      logger.warn('REDIS_URL not set — skipping Redis connection');
      return null;
    }
    redisClient = new Redis(env.REDIS_URL, {
      maxRetriesPerRequest: 3,
      lazyConnect: true,
    });

    redisClient.on('error', (err) => logger.error(`Redis error: ${err.message}`));
    redisClient.on('connect', () => logger.info('Redis connected'));

    await redisClient.connect();
    return redisClient;
  } catch (error) {
    logger.warn(`Redis connection failed: ${error.message}`);
    return null;
  }
};

const getRedisClient = () => redisClient;

module.exports = { connectRedis, getRedisClient };
