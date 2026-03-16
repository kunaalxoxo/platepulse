const router = require('express').Router();
const {
  register,
  verifyEmail,
  login,
  refreshToken,
  logout,
  forgotPassword,
  resetPassword,
  getMe,
} = require('../controllers/auth.controller');
const { verifyToken } = require('../middleware/auth');
const { authLimiter } = require('../middleware/rateLimit');

router.post('/register', authLimiter, register);
router.post('/verify-email', authLimiter, verifyEmail);
router.post('/login', authLimiter, login);
router.post('/refresh', refreshToken);
router.post('/logout', verifyToken, logout);
router.post('/forgot-password', authLimiter, forgotPassword);
router.post('/reset-password', authLimiter, resetPassword);
router.get('/me', verifyToken, getMe);

module.exports = router;
