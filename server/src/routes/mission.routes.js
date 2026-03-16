const router = require('express').Router();
const { acceptMission, declineMission, getMyMissions } = require('../controllers/mission.controller');
const { verifyToken, requireRole } = require('../middleware/auth');

router.get('/my-missions', verifyToken, getMyMissions);
router.post('/accept/:donationId', verifyToken, requireRole('ngo', 'volunteer'), acceptMission);
router.post('/decline/:missionId', verifyToken, requireRole('ngo', 'volunteer'), declineMission);

module.exports = router;
