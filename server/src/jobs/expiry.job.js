const cron = require('node-cron');
const Donation = require('../models/Donation');
const Notification = require('../models/Notification');
const { getIO } = require('../socket/socket.server');
const logger = require('../utils/logger');

// Run every 5 minutes
const startExpiryJob = () => {
  cron.schedule('*/5 * * * *', async () => {
    try {
      const now = new Date();
      
      const expiredDonations = await Donation.find({
        expiresAt: { $lte: now },
        status: 'available'
      });

      if (expiredDonations.length === 0) return;

      const io = getIO();
      let expiredCount = 0;

      for (const donation of expiredDonations) {
        donation.status = 'expired';
        await donation.save();
        expiredCount++;

        // Notify Donor
        await Notification.create({
          user: donation.donor,
          type: 'expired',
          title: 'Donation expired',
          body: `Unfortunately, your donation "${donation.name}" has expired without being matched.`,
          metadata: { donationId: donation._id }
        });

        // Emit
        io.to(donation.donor.toString()).emit('donation_expired', { donationId: donation._id });
      }

      logger.info(`[EXPIRY JOB] Marked ${expiredCount} donations as expired`);
    } catch (error) {
      logger.error(`[EXPIRY JOB] Error: ${error.message}`);
    }
  });

  logger.info('[CRON] Expiry job scheduled (Every 5 minutes)');
};

module.exports = { startExpiryJob };
