const router = require('express').Router();
const { getStats, getLeaderboard, getWeeklyTrend } = require('../controllers/impact.controller');

// All impact metrics are fully public for external visibility
router.get('/stats', getStats);
router.get('/leaderboard', getLeaderboard);
router.get('/weekly-trend', getWeeklyTrend);

module.exports = router;
