const Donation = require('../models/Donation');
const User = require('../models/User');
const { validateFoodImage } = require('../services/ai.service');
const { findMatches } = require('../services/matching.service');
const { updateTrustScore } = require('../services/impact.service');
const logger = require('../utils/logger');

const asyncHandler = fn => (req, res, next) => Promise.resolve(fn(req, res, next)).catch(next);

// ─── POST /api/v1/donations ──────────────────────────────────────────────

const createDonation = asyncHandler(async (req, res) => {
  const {
    name, category, quantity, quantityUnit,
    expiresAt, preparedAt, specialInstructions,
  } = req.body;
  
  // Parse nested location safely
  let pickupLocation;
  try {
    pickupLocation = typeof req.body.pickupLocation === 'string'
      ? JSON.parse(req.body.pickupLocation)
      : req.body.pickupLocation;
  } catch (e) {
    return res.status(400).json({ success: false, message: 'Invalid pickupLocation format' });
  }

  if (!name || !category || !quantity || !quantityUnit || !expiresAt || !pickupLocation?.coordinates) {
    return res.status(400).json({ success: false, message: 'Missing required fields' });
  }

  const imageUrl = req.uploadedFile?.url;
  let aiResult = { isFood: true, confidence: 0, isSafe: true };

  // AI Validation Trigger
  if (imageUrl) {
    aiResult = await validateFoodImage(imageUrl);
  }

  const [lng, lat] = pickupLocation.coordinates;

  const donation = await Donation.create({
    donor: req.user.id,
    name,
    category,
    quantity,
    quantityUnit,
    image: imageUrl,
    aiValidated: aiResult.isFood && aiResult.isSafe,
    aiConfidence: aiResult.confidence,
    preparedAt,
    expiresAt,
    pickupLocation: {
      type: 'Point',
      coordinates: [Number(lng), Number(lat)],
      address: pickupLocation.address,
    },
    specialInstructions,
  });

  logger.info(`Donation created: ${donation._id} by ${req.user.id}`);

  // Run matching engine asynchronously (non-blocking)
  findMatches(donation).catch(err => logger.error(`Background matching failed: ${err.message}`));

  return res.status(201).json({
    success: true,
    message: 'Donation created successfully',
    data: {
      donation,
      aiWarning: aiResult.confidence < 70,
    },
  });
});

// ─── GET /api/v1/donations ───────────────────────────────────────────────

const getDonations = asyncHandler(async (req, res) => {
  const { status, category, lat, lng, radius, page = 1, limit = 10, cursor } = req.query;
  const parsedLimit = Math.min(parseInt(limit, 10), 50);

  // Role-based visibility scoping
  let baseQuery = {};
  if (req.user.role === 'donor') {
    // Donors only see their own listed donations
    baseQuery.donor = req.user.id;
  } else if (req.user.role === 'ngo' || req.user.role === 'volunteer') {
    // Observers see what's available
    baseQuery.status = status || 'available';
  } else if (req.user.role !== 'admin') {
     return res.status(403).json({ success: false, message: 'Invalid role access for list' });
  }

  if (category) baseQuery.category = category;
  
  // Cursor pagination
  if (cursor) {
    baseQuery._id = { $gt: cursor };
  }

  let donations;

  // Geospatial $geoNear routing
  if (lat && lng && (req.user.role === 'ngo' || req.user.role === 'volunteer')) {
    const maxDist = (parseInt(radius, 10) || 25) * 1000; // default 25km

    donations = await Donation.aggregate([
      {
        $geoNear: {
          near: { type: 'Point', coordinates: [parseFloat(lng), parseFloat(lat)] },
          distanceField: 'distance',
          maxDistance: maxDist,
          spherical: true,
          query: baseQuery
        }
      },
      { $limit: parsedLimit }
    ]);
    
    // Aggregation population manual step
    await User.populate(donations, { path: 'donor', select: 'name orgName avatar trustScore phone' });
  } else {
    // Standard Query
    donations = await Donation.find(baseQuery)
      .populate('donor', 'name orgName avatar trustScore phone')
      .populate('assignedTo', 'name role avatar')
      .sort({ _id: 1 })
      .limit(parsedLimit);
  }

  return res.status(200).json({
    success: true,
    data: donations,
    pagination: {
      count: donations.length,
      nextCursor: donations.length === parsedLimit ? donations[donations.length - 1]._id : null
    }
  });
});

// ─── GET /api/v1/donations/:id ───────────────────────────────────────────

const getDonationById = asyncHandler(async (req, res) => {
  const donation = await Donation.findById(req.params.id)
    .populate('donor', 'name orgName avatar trustScore phone')
    .populate('assignedTo', 'name role avatar phone');

  if (!donation) {
    return res.status(404).json({ success: false, message: 'Donation not found' });
  }

  // Security check: If donor, must own it
  if (req.user.role === 'donor' && donation.donor._id.toString() !== req.user.id) {
    return res.status(403).json({ success: false, message: 'Access denied' });
  }

  return res.status(200).json({ success: true, data: donation });
});

// ─── PATCH /api/v1/donations/:id ─────────────────────────────────────────

const updateDonation = asyncHandler(async (req, res) => {
  const donation = await Donation.findById(req.params.id);

  if (!donation) {
    return res.status(404).json({ success: false, message: 'Donation not found' });
  }

  if (donation.donor.toString() !== req.user.id) {
    return res.status(403).json({ success: false, message: 'Not authorized to update this donation' });
  }

  if (donation.status !== 'available') {
    return res.status(400).json({ success: false, message: 'Can only update available donations' });
  }

  // Restrict what can be updated via PATCH vs system logic
  const updates = req.body;
  delete updates.donor;
  delete updates.status;
  delete updates.aiValidated;
  delete updates.aiConfidence;

  Object.assign(donation, updates);
  await donation.save();

  return res.status(200).json({ success: true, data: donation });
});

// ─── DELETE /api/v1/donations/:id ────────────────────────────────────────

const deleteDonation = asyncHandler(async (req, res) => {
  const donation = await Donation.findById(req.params.id);

  if (!donation) {
    return res.status(404).json({ success: false, message: 'Donation not found' });
  }

  if (donation.donor.toString() !== req.user.id && req.user.role !== 'admin') {
    return res.status(403).json({ success: false, message: 'Not authorized to delete' });
  }

  // Prevent deleting mid-transit
  if (['delivered', 'in_transit'].includes(donation.status)) {
    return res.status(400).json({ success: false, message: 'Cannot delete an active or completed donation' });
  }

  donation.status = 'removed';
  await donation.save();

  // Penalty for backing out if someone already matched/accepted
  if (donation.assignedTo) {
    await updateTrustScore(donation.donor, -10);
  }

  return res.status(200).json({ success: true, message: 'Donation removed successfully' });
});

module.exports = {
  createDonation,
  getDonations,
  getDonationById,
  updateDonation,
  deleteDonation
};
