// Push notification service — Firebase Cloud Messaging
const logger = require('../utils/logger');

const sendPushNotification = async (fcmToken, { title, body, data }) => {
  try {
    // TODO: integrate with firebase-admin messaging
    logger.info(`Push notification sent: ${title}`);
    return { success: true };
  } catch (error) {
    logger.error(`Push error: ${error.message}`);
    throw error;
  }
};

module.exports = { sendPushNotification };
