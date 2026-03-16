// Mission socket handler — real-time mission updates
const logger = require('../../utils/logger');

const missionHandler = (io, socket) => {
  socket.on('mission:accept', (data) => {
    logger.info(`Mission accepted: ${data.missionId} by ${socket.userId}`);
    io.emit('mission:updated', data);
  });

  socket.on('mission:update-location', (data) => {
    io.emit('mission:location', { missionId: data.missionId, location: data.location });
  });

  socket.on('mission:complete', (data) => {
    logger.info(`Mission completed: ${data.missionId}`);
    io.emit('mission:completed', data);
  });
};

module.exports = missionHandler;
