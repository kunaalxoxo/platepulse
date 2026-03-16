// Notification service — in-app notification management
const Notification = require('../models/Notification');
const logger = require('../utils/logger');

const createNotification = async ({ recipient, type, title, message, data }) => {
  try {
    const notification = await Notification.create({ recipient, type, title, message, data });
    // TODO: emit via Socket.io
    return notification;
  } catch (error) {
    logger.error(`Notification create error: ${error.message}`);
    throw error;
  }
};

const getUserNotifications = async (userId, page = 1, limit = 20) => {
  const skip = (page - 1) * limit;
  const notifications = await Notification.find({ recipient: userId })
    .sort({ createdAt: -1 })
    .skip(skip)
    .limit(limit);
  const total = await Notification.countDocuments({ recipient: userId });
  return { notifications, total, page, pages: Math.ceil(total / limit) };
};

module.exports = { createNotification, getUserNotifications };
