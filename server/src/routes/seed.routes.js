// TEMPORARY SEED ROUTE — DELETE AFTER USE
const router = require('express').Router();
const { runSeed } = require('../controllers/seed.controller');
router.get('/', runSeed);
module.exports = router;
