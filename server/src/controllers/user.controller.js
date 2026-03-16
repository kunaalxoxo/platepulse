const User = require('../models/User');
const Donation = require('../models/Donation');
const Mission = require('../models/Mission');
const Order = require('../models/Order');
const WasteRequest = require('../models/WasteRequest');
const mongoose = require('mongoose');

const asyncHandler = fn => (req, res, next) => Promise.resolve(fn(req, res, next)).catch(next);

// ─── GET /api/v1/users/me ────────────────────────────────────────────────
const getMe = asyncHandler(async (req, res) => {
  const user = await User.findById(req.user.id)
    .select('-password -verifyOTP -verifyOTPExpiry -resetOTP -resetOTPExpiry -refreshToken');
  return res.status(200).json({ success: true, data: user });
});

// ─── PATCH /api/v1/users/me ──────────────────────────────────────────────
const updateMe = asyncHandler(async (req, res) => {
  const { name, phone, orgName, location, isAvailable } = req.body;
  const user = await User.findById(req.user.id);

  if (name) user.name = name;
  if (phone) user.phone = phone;
  if (orgName) user.orgName = orgName;
  if (isAvailable !== undefined) user.isAvailable = isAvailable === 'true' || isAvailable === true;

  if (location) {
    try {
      const parsedLoc = typeof location === 'string' ? JSON.parse(location) : location;
      if (parsedLoc.coordinates && parsedLoc.address) {
        user.location = {
          type: 'Point',
          coordinates: [parseFloat(parsedLoc.coordinates[0]), parseFloat(parsedLoc.coordinates[1])],
          address: parsedLoc.address
        };
      }
    } catch (e) {
      // Ignored format exception
    }
  }

  if (req.uploadedFile) {
    user.avatar = req.uploadedFile.url;
  }

  await user.save();
  const safeUserObject = await User.findById(user._id).select('-password -refreshToken');

  return res.status(200).json({ success: true, data: safeUserObject });
});

// ─── GET /api/v1/users/stats ─────────────────────────────────────────────
const getMyStats = asyncHandler(async (req, res) => {
  const userId = req.user.id;
  const role = req.user.role;
  const stats = {};

  if (role === 'donor') {
    stats.totalDonations = await Donation.countDocuments({ donor: userId });
    stats.delivered = await Donation.countDocuments({ donor: userId, status: 'delivered' });
    stats.expired = await Donation.countDocuments({ donor: userId, status: 'expired' });
  } 
  else if (role === 'volunteer' || role === 'ngo') {
    stats.missionsAccepted = await Mission.countDocuments({ 
      $or: [{ volunteerId: userId }, { ngoId: userId }] 
    });
    stats.missionsDelivered = await Mission.countDocuments({ 
      $or: [{ volunteerId: userId }, { ngoId: userId }], status: 'delivered' 
    });
  } 
  else if (role === 'consumer') {
    stats.totalOrders = await Order.countDocuments({ consumer: userId, paymentStatus: 'paid' });
    const spentObj = await Order.aggregate([
      { $match: { consumer: new mongoose.Types.ObjectId(userId), paymentStatus: 'paid' } },
      { $group: { _id: null, total: { $sum: '$totalAmount' } } }
    ]);
    stats.totalSpent = spentObj.length > 0 ? spentObj[0].total : 0;
  } 
  else if (role === 'waste_plant') {
    stats.requestsCompleted = await WasteRequest.countDocuments({ 
      wastePlant: userId, status: 'completed' 
    });
  }

  return res.status(200).json({ success: true, data: stats });
});

module.exports = {
  getMe,
  updateMe,
  getMyStats
};
