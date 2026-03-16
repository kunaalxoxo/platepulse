const { Server } = require('socket.io');
const jwt = require('jsonwebtoken');
const env = require('../config/env');
const logger = require('../utils/logger');

const initializeSocket = (httpServer) => {
  const io = new Server(httpServer, {
    cors: {
      origin: env.CLIENT_URL,
      methods: ['GET', 'POST'],
      credentials: true,
    },
  });

  // Attach to global scope for background CRON jobs and controllers
  global.io = io;

  // Auth middleware for socket connections
  io.use((socket, next) => {
    const token = socket.handshake.auth?.token;
    if (!token) {
      return next(new Error('Authentication required'));
    }
    try {
      const decoded = jwt.verify(token, env.JWT_ACCESS_SECRET || env.JWT_SECRET);
      socket.userId = decoded.id;
      next();
    } catch (error) {
      next(new Error('Invalid token'));
    }
  });

  io.on('connection', (socket) => {
    logger.info(`Socket connected: ${socket.userId}`);
    // Room mapping matches user._id for targeted 1:1 notifications
    if (socket.userId) {
      socket.join(socket.userId.toString());
    }

    socket.on('disconnect', () => {
      logger.info(`Socket disconnected: ${socket.userId}`);
    });
  });

  logger.info('Socket.io initialized');
  return io;
};

const getIO = () => {
  if (!global.io) throw new Error('Socket.io not initialized');
  return global.io;
};

module.exports = { initializeSocket, getIO };
