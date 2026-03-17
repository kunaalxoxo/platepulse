const router = require('express').Router();
const { runSeed } = require('../controllers/seed.controller');

router.get('/', runSeed);

module.exports = router;
