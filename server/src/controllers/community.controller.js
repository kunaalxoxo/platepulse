const CommunityShare = require('../models/CommunityShare');
const Notification = require('../models/Notification');

const asyncHandler = fn => (req, res, next) => Promise.resolve(fn(req, res, next)).catch(next);

// ─── POST /api/v1/community ──────────────────────────────────────────────

const createShare = asyncHandler(async (req, res) => {
  const { name, category, quantity, expiresAt, claimedByLimit } = req.body;
  
  let location;
  try {
    location = typeof req.body.location === 'string'
      ? JSON.parse(req.body.location)
      : req.body.location;
  } catch (e) {
    return res.status(400).json({ success: false, message: 'Invalid location format' });
  }

  const imageUrl = req.uploadedFile?.url;
  const [lng, lat] = location.coordinates;

  const share = await CommunityShare.create({
    postedBy: req.user.id,
    name,
    category,
    quantity: parseFloat(quantity),
    image: imageUrl,
    location: {
      type: 'Point',
      coordinates: [parseFloat(lng), parseFloat(lat)],
      address: location.address
    },
    claimedByLimit: parseInt(claimedByLimit, 10) || 1,
    expiresAt: new Date(expiresAt)
  });

  return res.status(201).json({ success: true, message: 'Shared with community', data: share });
});

// ─── GET /api/v1/community ───────────────────────────────────────────────

const getShares = asyncHandler(async (req, res) => {
  const { lat, lng, radius } = req.query;
  const maxDist = (parseInt(radius, 10) || 10) * 1000; // default 10km

  if (!lat || !lng) {
    return res.status(400).json({ success: false, message: 'Latitude and Longitude required' });
  }

  const shares = await CommunityShare.aggregate([
    {
      $geoNear: {
        near: { type: 'Point', coordinates: [parseFloat(lng), parseFloat(lat)] },
        distanceField: 'distance',
        maxDistance: maxDist,
        spherical: true,
        query: { isActive: true, expiresAt: { $gt: new Date() } }
      }
    },
    { $sort: { distance: 1 } }
  ]);

  await CommunityShare.populate(shares, { path: 'postedBy', select: 'name avatar' });

  return res.status(200).json({ success: true, data: shares });
});

// ─── POST /api/v1/community/:id/claim ────────────────────────────────────

const claimShare = asyncHandler(async (req, res) => {
  const share = await CommunityShare.findById(req.params.id);

  if (!share) return res.status(404).json({ success: false, message: 'Share not found' });
  if (!share.isActive) return res.status(400).json({ success: false, message: 'This share is no longer available' });
  if (share.claimedCount >= share.claimedByLimit) {
    return res.status(400).json({ success: false, message: 'All portions have been claimed' });
  }
  if (share.postedBy.toString() === req.user.id) {
    return res.status(400).json({ success: false, message: 'Cannot claim your own share' });
  }

  share.claimedCount += 1;
  if (share.claimedCount >= share.claimedByLimit) {
    share.isActive = false;
  }
  await share.save();

  // Notify the poster
  await Notification.create({
    user: share.postedBy,
    type: 'claimed',
    title: 'Your share was claimed!',
    body: `Someone just claimed a portion of your "${share.name}"`,
    metadata: { shareId: share._id }
  });

  return res.status(200).json({ success: true, message: 'Claimed successfully', data: share });
});

// ─── GET /api/v1/community/my-shares ─────────────────────────────────────

const getMyShares = asyncHandler(async (req, res) => {
  const shares = await CommunityShare.find({ postedBy: req.user.id }).sort({ createdAt: -1 });
  return res.status(200).json({ success: true, data: shares });
});

module.exports = {
  createShare,
  getShares,
  claimShare,
  getMyShares
};
