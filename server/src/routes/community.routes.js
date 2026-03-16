const router = require('express').Router();
const { createShare, getShares, claimShare, getMyShares } = require('../controllers/community.controller');
const { verifyToken } = require('../middleware/auth');
const { uploadSingle } = require('../middleware/upload');

// All community actions require baseline authentication
router.use(verifyToken);

router.get('/my-shares', getMyShares);
router.post('/:id/claim', claimShare);

router.route('/')
  .get(getShares)
  .post(uploadSingle('image', 'community'), createShare);

module.exports = router;
