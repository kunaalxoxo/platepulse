const router = require('express').Router();
const { verifyQRCode } = require('../controllers/mission.controller');
const { verifyToken } = require('../middleware/auth');

router.post('/verify', verifyToken, verifyQRCode);

module.exports = router;
