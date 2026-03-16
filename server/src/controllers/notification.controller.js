const Notification = require('../models/Notification');

const asyncHandler = fn => (req, res, next) => Promise.resolve(fn(req, res, next)).catch(next);

// ─── GET /api/v1/notifications/mine ──────────────────────────────────────

const getMyNotifications = asyncHandler(async (req, res) => {
  const notifications = await Notification.find({ user: req.user.id })
    .sort({ createdAt: -1 })
    .limit(20);
  
  const unreadCount = await Notification.countDocuments({
    user: req.user.id,
    isRead: false
  });
  
  return res.status(200).json({ success: true, data: { notifications, unreadCount } });
});

// ─── PATCH /api/v1/notifications/:id/read ────────────────────────────────

const markAsRead = asyncHandler(async (req, res) => {
  await Notification.findOneAndUpdate(
    { _id: req.params.id, user: req.user.id },
    { isRead: true }
  );
  return res.status(200).json({ success: true });
});

// ─── PATCH /api/v1/notifications/read-all ────────────────────────────────

const markAllAsRead = asyncHandler(async (req, res) => {
  await Notification.updateMany(
    { user: req.user.id, isRead: false },
    { isRead: true }
  );
  return res.status(200).json({ success: true, message: 'All notifications marked as read' });
});

// ─── DELETE /api/v1/notifications/:id ────────────────────────────────────

const deleteNotification = asyncHandler(async (req, res) => {
  await Notification.findOneAndDelete({ _id: req.params.id, user: req.user.id });
  return res.status(200).json({ success: true });
});

module.exports = {
  getMyNotifications,
  markAsRead,
  markAllAsRead,
  deleteNotification
};
