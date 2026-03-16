const router = require('express').Router();
const { getAdminStats, getUsers, verifyUser, suspendUser, getDonations } = require('../controllers/admin.controller');
const { verifyToken, requireRole } = require('../middleware/auth');

router.use(verifyToken, requireRole('admin'));

router.get('/stats', getAdminStats);
router.get('/users', getUsers);
router.patch('/users/:id/verify', verifyUser);
router.patch('/users/:id/suspend', suspendUser);
router.get('/donations', getDonations);

module.exports = router;
