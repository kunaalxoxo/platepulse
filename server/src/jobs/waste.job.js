const cron = require('node-cron');
const Donation = require('../models/Donation');
const User = require('../models/User');
const WasteRequest = require('../models/WasteRequest');
const Notification = require('../models/Notification');
const { haversine } = require('../services/geo.service');
const { getIO } = require('../socket/socket.server');
const logger = require('../utils/logger');

// Run every 30 minutes
const startWasteJob = () => {
  cron.schedule('*/30 * * * *', async () => {
    try {
      // 1. Find expired/uncollected donations with no waste request yet
      const existingWasteDonationIds = await WasteRequest.distinct('donation');
      
      const expiredDonations = await Donation.find({ 
        status: 'expired',
        _id: { $nin: existingWasteDonationIds }
      });

      if (expiredDonations.length === 0) return;

      // 2. Load Active Waste Plants
      const wastePlants = await User.find({ 
        role: 'waste_plant', 
        isVerified: true,
        isSuspended: false
      });

      if (wastePlants.length === 0) {
        logger.warn('[WASTE JOB] No active waste plants registered to receive requests');
        return;
      }

      const io = getIO();

      for (const donation of expiredDonations) {
        // Find nearest waste plant using haversine routing
        const donLat = donation.pickupLocation.coordinates[1];
        const donLng = donation.pickupLocation.coordinates[0];

        const nearest = wastePlants.reduce((best, plant) => {
          const plantLat = plant.location.coordinates[1];
          const plantLng = plant.location.coordinates[0];
          const dist = haversine(donLat, donLng, plantLat, plantLng);
          
          return dist < best.dist ? { plant, dist } : best;
        }, { plant: wastePlants[0], dist: Infinity });

        // Create Waste Recovery Request
        const wasteReq = await WasteRequest.create({
          donation: donation._id,
          wastePlant: nearest.plant._id
        });

        // Notify Plant
        await Notification.create({
          user: nearest.plant._id,
          type: 'waste_assigned',
          title: 'New waste pickup assigned',
          body: `Pickup required for expired donation: ${donation.name}. Distance: ${nearest.dist.toFixed(1)}km`,
          metadata: { wasteRequestId: wasteReq._id, donationId: donation._id }
        });

        io.to(nearest.plant._id.toString()).emit('waste_assigned', {
          wasteRequestId: wasteReq._id
        });
      }

      logger.info(`[WASTE JOB] Created ${expiredDonations.length} new waste requests`);
    } catch (error) {
      logger.error(`[WASTE JOB] Error: ${error.message}`);
    }
  });

  logger.info('[CRON] Waste job scheduled (Every 30 minutes)');
};

module.exports = { startWasteJob };
