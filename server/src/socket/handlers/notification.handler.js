// Notification socket handler — real-time notifications
const logger = require('../../utils/logger');

const notificationHandler = (io, socket) => {
  socket.on('notification:mark-read', (data) => {
    logger.info(`Notification marked read: ${data.notificationId} by ${socket.userId}`);
  });

  socket.on('notification:subscribe', () => {
    socket.join(`user:${socket.userId}`);
    logger.info(`User ${socket.userId} subscribed to notifications`);
  });
};

// Helper to send notification to specific user
const sendToUser = (io, userId, notification) => {
  io.to(`user:${userId}`).emit('notification:new', notification);
};

module.exports = { notificationHandler, sendToUser };
