const router = require('express').Router();
const { getMyRequests, confirmPickup } = require('../controllers/waste.controller');
const { verifyToken, requireRole } = require('../middleware/auth');

router.use(verifyToken, requireRole('waste_plant', 'admin'));

router.get('/my-requests', getMyRequests);
router.post('/:requestId/confirm', confirmPickup);

module.exports = router;
