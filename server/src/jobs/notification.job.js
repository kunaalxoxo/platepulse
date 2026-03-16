// Notification cleanup / digest job
const cron = require('node-cron');
const logger = require('../utils/logger');

const startNotificationJob = () => {
  // Run daily at 8 AM — send digest emails
  cron.schedule('0 8 * * *', async () => {
    try {
      logger.info('[CRON] Sending notification digests...');
      // TODO: Aggregate unread notifications and send digest email
    } catch (error) {
      logger.error(`[CRON] Notification job error: ${error.message}`);
    }
  });

  logger.info('[CRON] Notification job scheduled');
};

module.exports = { startNotificationJob };
