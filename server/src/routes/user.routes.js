const router = require('express').Router();
const { getMe, updateMe, getMyStats } = require('../controllers/user.controller');
const { verifyToken } = require('../middleware/auth');
const { uploadSingle } = require('../middleware/upload');

router.use(verifyToken);

router.get('/me', getMe);
router.patch('/me', uploadSingle('image', 'avatars'), updateMe);
router.get('/stats', getMyStats);

module.exports = router;
