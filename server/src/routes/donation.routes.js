const router = require('express').Router();
const { createDonation, getDonations, getDonationById, updateDonation, deleteDonation } = require('../controllers/donation.controller');
const { verifyToken, requireRole } = require('../middleware/auth');
const { uploadSingle } = require('../middleware/upload');

router.route('/')
  .get(verifyToken, getDonations)
  .post(verifyToken, requireRole('donor'), uploadSingle('image', 'donations'), createDonation);

router.route('/:id')
  .get(verifyToken, getDonationById)
  .patch(verifyToken, requireRole('donor'), updateDonation)
  .delete(verifyToken, requireRole('donor', 'admin'), deleteDonation);

module.exports = router;
