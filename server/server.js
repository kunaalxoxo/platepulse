const http = require('http');
const app = require('./src/app');
const env = require('./src/config/env');
const logger = require('./src/utils/logger');
const connectDB = require('./src/config/db');
const { initializeSocket } = require('./src/socket/socket.server');
const { startExpiryJob } = require('./src/jobs/expiry.job');
const { startDiscountJob } = require('./src/jobs/discount.job');
const { startWasteJob } = require('./src/jobs/waste.job');
const { startNotificationJob } = require('./src/jobs/notification.job');

const server = http.createServer(app);

// Initialize Socket.io
const io = initializeSocket(server);
app.set('io', io);

const startServer = async () => {
  // Connect to MongoDB
  await connectDB();

  // Start cron jobs
  startExpiryJob();
  startDiscountJob();
  startWasteJob();
  startNotificationJob();

  server.listen(env.PORT, () => {
    logger.info(`🚀 PlatePulse server running on port ${env.PORT} [${env.NODE_ENV}]`);
    logger.info(`📡 API: http://localhost:${env.PORT}/api/v1/health`);
  });
};

startServer().catch((error) => {
  logger.error(`Failed to start server: ${error.message}`);
  process.exit(1);
});

// Graceful shutdown
process.on('SIGTERM', () => {
  logger.info('SIGTERM received. Shutting down gracefully...');
  server.close(() => process.exit(0));
});
