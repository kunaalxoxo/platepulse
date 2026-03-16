const User = require('../models/User');
const Notification = require('../models/Notification');
const { haversine } = require('./geo.service');
const { sendMatchNotification } = require('./email.service');
const { getIO } = require('../socket/socket.server');
const logger = require('../utils/logger');

const findMatches = async (donation) => {
  try {
    // Basic filtering — find verified NGOs and volunteers in active state
    const candidates = await User.find({
      role: { $in: ['ngo', 'volunteer'] },
      isAvailable: true,
      isVerified: true,
      isSuspended: false
    });

    const donationLat = donation.pickupLocation.coordinates[1];
    const donationLng = donation.pickupLocation.coordinates[0];
    
    // Urgency heuristic (0 to 1)
    const hoursLeft = (new Date(donation.expiresAt) - Date.now()) / 3600000;
    const urgencyScore = hoursLeft < 6 ? 1.0 : hoursLeft < 24 ? 0.7 : 0.3;

    const scored = [];
    
    for (const candidate of candidates) {
      const candidateLat = candidate.location.coordinates[1];
      const candidateLng = candidate.location.coordinates[0];
      
      let distance = haversine(donationLat, donationLng, candidateLat, candidateLng);
      
      // Radius limit — do not match if > 25km away
      if (distance > 25) continue;
      
      // Clamp distance to avoid div by zero giving Infinity MatchScore
      if (distance < 0.1) distance = 0.1;

      // Trust heuristic (0 to 1)
      const trustNorm = candidate.trustScore / 100;

      // Smart Matching Formula
      // Weightage: Distance 40%, Urgency 35%, Trust Score 25%
      const matchScore = (1 / distance * 0.4) + (urgencyScore * 0.35) + (trustNorm * 0.25);
      
      scored.push({ candidate, distance, matchScore });
    }

    // Sort descending by score, take Top 3
    const top3 = scored.sort((a, b) => b.matchScore - a.matchScore).slice(0, 3);
    const io = getIO();

    for (const match of top3) {
      // 1. In-App Notification
      await Notification.create({
        user: match.candidate._id,
        type: 'match',
        title: 'New donation nearby',
        body: `${donation.name} — ${match.distance.toFixed(1)}km away. Expires in ${Math.round(hoursLeft)}h`,
        metadata: { donationId: donation._id }
      });

      // 2. Email (background, don't block loop)
      sendMatchNotification(
        match.candidate.email,
        match.candidate.name,
        donation.name,
        match.distance.toFixed(1)
      ).catch(err => logger.error(`Match email failed: ${err.message}`));

      // 3. Real-time Socket.io Emission
      io.to(match.candidate._id.toString()).emit('new_match', {
        donationId: donation._id,
        donationName: donation.name,
        distance: match.distance.toFixed(1)
      });
    }

    return top3;
  } catch (error) {
    logger.error(`Matching error: ${error.message}`);
    throw error; // Or re-throw if caller needs to know
  }
};

module.exports = { findMatches };
