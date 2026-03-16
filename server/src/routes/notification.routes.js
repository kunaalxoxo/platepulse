const router = require('express').Router();
const { getMyNotifications, markAsRead, markAllAsRead, deleteNotification } = require('../controllers/notification.controller');
const { verifyToken } = require('../middleware/auth');

router.use(verifyToken);

router.get('/mine', getMyNotifications);
router.patch('/read-all', markAllAsRead);
router.patch('/:id/read', markAsRead);
router.delete('/:id', deleteNotification);

module.exports = router;
