const router = require('express').Router();
const { getVolunteerProfile, getAvailableMissions, acceptMission, getLeaderboard } = require('../controllers/volunteer.controller');
const { verifyToken } = require('../middleware/auth');

router.get('/profile', verifyToken, getVolunteerProfile);
router.get('/missions', verifyToken, getAvailableMissions);
router.post('/missions/:id/accept', verifyToken, acceptMission);
router.get('/leaderboard', verifyToken, getLeaderboard);

module.exports = router;
