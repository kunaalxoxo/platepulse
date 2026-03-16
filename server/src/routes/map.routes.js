const router = require('express').Router();
const { getMarkers } = require('../controllers/map.controller');

// Map markers are public
router.get('/markers', getMarkers);

module.exports = router;
