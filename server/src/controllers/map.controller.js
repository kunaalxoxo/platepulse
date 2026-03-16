const Donation = require('../models/Donation');
const Product = require('../models/Product');
const CommunityShare = require('../models/CommunityShare');
const User = require('../models/User');

const asyncHandler = fn => (req, res, next) => Promise.resolve(fn(req, res, next)).catch(next);

// ─── GET /api/v1/map/markers ─────────────────────────────────────────────

const getMarkers = asyncHandler(async (req, res) => {
  const { lat, lng, radius, types } = req.query;
  const maxObjDist = ((parseFloat(radius) || 50) / 6371); // Radians
  const parsedLat = parseFloat(lat) || 0;
  const parsedLng = parseFloat(lng) || 0;
  
  if (!types || parsedLat === 0 || parsedLng === 0) {
    return res.status(400).json({ success: false, message: 'lat, lng, and types comma-string required' });
  }

  const requestedTypes = types.split(',');
  const results = {};
  
  const geoQuery = {
    $geoWithin: { $centerSphere: [[parsedLng, parsedLat], maxObjDist] }
  };

  if (requestedTypes.includes('donations')) {
    results.donations = await Donation.find({
      status: 'available',
      pickupLocation: geoQuery
    })
    .select('name category quantity quantityUnit expiresAt pickupLocation status image donor')
    .populate('donor', 'name orgName trustScore')
    .limit(100);
  }

  if (requestedTypes.includes('products')) {
    results.products = await Product.find({
      isActive: true,
      storeLocation: geoQuery
    })
    .select('name category mrp finalPrice discountPercent urgentBadge expiresAt storeLocation image retailer')
    .populate('retailer', 'name orgName')
    .limit(100);
  }

  if (requestedTypes.includes('community')) {
    results.community = await CommunityShare.find({
      isActive: true,
      expiresAt: { $gt: new Date() },
      location: geoQuery
    })
    .select('name category quantity location claimedCount claimedByLimit image postedBy')
    .populate('postedBy', 'name avatar')
    .limit(100);
  }

  if (requestedTypes.includes('waste_plants')) {
    // Waste Plants are fixed POIs. They don't have temporary statuses but must be verified.
    results.wastePlants = await User.find({
      role: 'waste_plant',
      isVerified: true,
      isSuspended: false,
      location: geoQuery
    })
    .select('name orgName location avatar trustScore email phone')
    .limit(50);
  }

  return res.status(200).json({ success: true, data: results });
});

module.exports = { getMarkers };
