const User = require('../models/User');
const Donation = require('../models/Donation');
const Mission = require('../models/Mission');
const ImpactLog = require('../models/ImpactLog');
const Notification = require('../models/Notification');

const asyncHandler = fn => (req, res, next) => Promise.resolve(fn(req, res, next)).catch(next);

const getAdminStats = asyncHandler(async (req, res) => {
  const weekAgo = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000);

  const [
    totalUsers,
    totalDonations,
    activeMissions,
    wasteLogs,
    newUsersThisWeek,
    donationsByCategory,
    signupsByWeek
  ] = await Promise.all([
    User.countDocuments({ isSuspended: false }),
    Donation.countDocuments(),
    Mission.countDocuments({ status: { $in: ['pending', 'accepted', 'in_transit'] } }),
    ImpactLog.aggregate([
      { $match: { eventType: 'waste_processed' } },
      { $group: { _id: null, sum: { $sum: '$quantityKg' } } }
    ]),
    User.countDocuments({ createdAt: { $gte: weekAgo } }),
    Donation.aggregate([
      { $group: { _id: '$category', count: { $sum: 1 } } }
    ]),
    User.aggregate([
      { $match: { createdAt: { $gte: new Date(Date.now() - 56 * 24 * 60 * 60 * 1000) } } },
      { $group: { _id: { $week: '$createdAt' }, count: { $sum: 1 } } },
      { $sort: { '_id': 1 } }
    ])
  ]);

  return res.status(200).json({
    success: true,
    data: {
      totalUsers,
      totalDonations,
      activeMissions,
      wasteProcessedKg: wasteLogs[0]?.sum || 0,
      newUsersThisWeek,
      donationsByCategory,
      signupsByWeek
    }
  });
});

const getUsers = asyncHandler(async (req, res) => {
  const { page = 1, limit = 20, role, search, isSuspended } = req.query;
  const skip = (page - 1) * limit;

  const filter = {};
  if (role) filter.role = role;
  if (search) {
    filter.$or = [
      { name: { $regex: search, $options: 'i' } },
      { email: { $regex: search, $options: 'i' } }
    ];
  }
  if (isSuspended !== undefined) filter.isSuspended = isSuspended === 'true';

  const users = await User.find(filter)
    .select('-password -refreshToken -verifyOTP -resetOTP')
    .sort({ createdAt: -1 })
    .skip(skip)
    .limit(parseInt(limit, 10));

  const count = await User.countDocuments(filter);

  return res.status(200).json({ 
    success: true, 
    data: users,
    pagination: { count, page: Number(page), hasNext: skip + users.length < count }
  });
});

const verifyUser = asyncHandler(async (req, res) => {
  const user = await User.findByIdAndUpdate(req.params.id, { isVerified: true }, { new: true });
  if (!user) return res.status(404).json({ success: false, message: 'User not found' });

  await Notification.create({
    user: user._id,
    type: 'verified',
    title: 'Account verified',
    body: 'Your PlatePulse account has been verified by admin. You can now access full features.'
  });

  return res.status(200).json({ success: true, message: 'User verified successfully', data: user });
});

const suspendUser = asyncHandler(async (req, res) => {
  const user = await User.findById(req.params.id);
  if (!user) return res.status(404).json({ success: false, message: 'User not found' });

  user.isSuspended = !user.isSuspended;
  await user.save();

  return res.status(200).json({ 
    success: true, 
    message: user.isSuspended ? 'User suspended' : 'User restored',
    data: { isSuspended: user.isSuspended }
  });
});

const getDonations = asyncHandler(async (req, res) => {
  const { status, limit = 50, page = 1 } = req.query;
  const skip = (page - 1) * limit;
  const filter = status ? { status } : {};

  const donations = await Donation.find(filter)
    .populate('donor', 'name email orgName')
    .populate('assignedTo', 'name email role')
    .sort({ createdAt: -1 })
    .skip(skip)
    .limit(parseInt(limit, 10));

  return res.status(200).json({ success: true, data: donations });
});

module.exports = {
  getAdminStats,
  getUsers,
  verifyUser,
  suspendUser,
  getDonations
};
