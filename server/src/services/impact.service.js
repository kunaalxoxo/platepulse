const User = require('../models/User');
const logger = require('../utils/logger');

const awardPoints = async (userId, points) => {
  try {
    const user = await User.findById(userId);
    if (!user) return;

    user.points += points;

    // Update badge tier based on total points
    if (user.points >= 1000) user.badge = 'hero';
    else if (user.points >= 500) user.badge = 'gold';
    else if (user.points >= 200) user.badge = 'silver';
    else if (user.points >= 50) user.badge = 'bronze';
    
    await user.save();
    logger.info(`Awarded ${points} points to user ${userId}`);
  } catch (error) {
    logger.error(`Error awarding points: ${error.message}`);
  }
};

const updateTrustScore = async (userId, delta) => {
  try {
    const user = await User.findById(userId);
    if (!user) return;

    // Bound trust score between 0 and 100
    user.trustScore = Math.min(100, Math.max(0, user.trustScore + delta));
    await user.save();
    logger.info(`Updated trust score for user ${userId} by ${delta}`);
  } catch (error) {
    logger.error(`Error updating trust score: ${error.message}`);
  }
};

module.exports = { awardPoints, updateTrustScore };
