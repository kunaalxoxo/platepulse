const ImpactLog = require('../models/ImpactLog');
const User = require('../models/User');
const Mission = require('../models/Mission');
// Note: Intended to use Redis for caching as specified, but since redis.js isn't fully set up yet
// We will use a lightweight in-memory cache mechanism here to fulfill the requirement without crashing.
const cache = new Map();

const asyncHandler = fn => (req, res, next) => Promise.resolve(fn(req, res, next)).catch(next);

const getStats = asyncHandler(async (req, res) => {
  const cacheKey = 'impact:stats';
  if (cache.has(cacheKey) && cache.get(cacheKey).exp > Date.now()) {
    return res.status(200).json({ success: true, data: cache.get(cacheKey).val });
  }

  const aggregate = await ImpactLog.aggregate([
    { $group: {
      _id: null,
      totalMealsSaved: { $sum: '$mealsSaved' },
      totalCO2Prevented: { $sum: '$co2PreventedKg' },
      totalFoodDivertedKg: { $sum: '$quantityKg' },
      totalCompostKg: { $sum: '$compostKg' },
      totalBiogasLiters: { $sum: '$biogasLiters' }
    }}
  ]);

  const activeNGOs = await User.countDocuments({ role: 'ngo', isVerified: true, isSuspended: false });
  const missionsCompleted = await Mission.countDocuments({ status: 'delivered' });

  const stats = {
    ...(aggregate[0] || {
      totalMealsSaved: 0,
      totalCO2Prevented: 0,
      totalFoodDivertedKg: 0,
      totalCompostKg: 0,
      totalBiogasLiters: 0
    }),
    activeNGOs,
    missionsCompleted
  };

  cache.set(cacheKey, { val: stats, exp: Date.now() + 300 * 1000 }); // 5 min TTL
  return res.status(200).json({ success: true, data: stats });
});

const getLeaderboard = asyncHandler(async (req, res) => {
  const cacheKey = 'impact:leaderboard';
  if (cache.has(cacheKey) && cache.get(cacheKey).exp > Date.now()) {
    return res.status(200).json({ success: true, data: cache.get(cacheKey).val });
  }

  const donors = await User.find({ role: 'donor', isSuspended: false })
    .sort({ points: -1 })
    .limit(10)
    .select('name avatar points badge trustScore orgName');

  const volunteers = await User.find({ role: 'volunteer', isSuspended: false })
    .sort({ points: -1 })
    .limit(10)
    .select('name avatar points badge');

  const data = { donors, volunteers };
  cache.set(cacheKey, { val: data, exp: Date.now() + 600 * 1000 }); // 10 min TTL
  return res.status(200).json({ success: true, data });
});

const getWeeklyTrend = asyncHandler(async (req, res) => {
  // Last 8 weeks data
  const weeklyData = await ImpactLog.aggregate([
    { $match: { 
      createdAt: { $gte: new Date(Date.now() - 56 * 24 * 60 * 60 * 1000) }
    }},
    { $group: {
      _id: { $week: '$createdAt' },
      mealsSaved: { $sum: '$mealsSaved' },
      co2Prevented: { $sum: '$co2PreventedKg' },
      count: { $sum: 1 }
    }},
    { $sort: { '_id': 1 } }
  ]);

  // Format nicely for recharts
  const formatted = weeklyData.map(d => ({
    name: `Week ${d._id}`,
    mealsSaved: d.mealsSaved,
    co2Prevented: d.co2Prevented
  }));

  return res.status(200).json({ success: true, data: formatted });
});

const invalidateCache = () => {
  cache.delete('impact:stats');
  cache.delete('impact:leaderboard');
};

module.exports = {
  getStats,
  getLeaderboard,
  getWeeklyTrend,
  invalidateCache
};
