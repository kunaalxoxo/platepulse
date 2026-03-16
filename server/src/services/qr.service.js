const jwt = require('jsonwebtoken');
const QRCode = require('qrcode');
const Donation = require('../models/Donation');
const ImpactLog = require('../models/ImpactLog');
const { awardPoints, updateTrustScore } = require('./impact.service');
const env = require('../config/env');
const logger = require('../utils/logger');
const { getIO } = require('../socket/socket.server');

const generateQR = async (donationId, missionId, userId) => {
  const payload = { donationId, missionId, userId, type: 'pickup', iat: Date.now() };
  const token = jwt.sign(payload, env.JWT_SECRET, { expiresIn: '24h' });
  
  const qrDataUrl = await QRCode.toDataURL(token, {
    width: 300,
    margin: 2,
    color: { dark: '#2E7D32', light: '#FFFFFF' },
  });
  
  return { token, qrDataUrl };
};

const verifyQR = async (token) => {
  try {
    const decoded = jwt.verify(token, env.JWT_SECRET);
    
    // In strict mode we'd do a transaction here
    const donation = await Donation.findById(decoded.donationId).populate('donor assignedTo');
    
    if (!donation) {
      throw new Error('Donation not found');
    }

    const io = getIO();

    if (donation.status === 'matched') {
      donation.status = 'in_transit';
      donation.pickupConfirmedAt = new Date();
      await donation.save();
      
      // Notify via Socket.io
      io.to(donation.donor._id.toString()).emit('pickup_confirmed', { donationId: donation._id });
      if (donation.assignedTo) {
        io.to(donation.assignedTo._id.toString()).emit('pickup_confirmed', { donationId: donation._id });
      }

      logger.info(`Donation ${donation._id} pickup confirmed via QR`);
      return { action: 'pickup_confirmed', donation };
    }

    if (donation.status === 'in_transit') {
      donation.status = 'delivered';
      donation.deliveryConfirmedAt = new Date();
      await donation.save();

      // Calculate logic for Impact Log
      const quantityKg = donation.quantityUnit === 'kg' ? donation.quantity :
                         donation.quantityUnit === 'portions' ? donation.quantity * 0.3 :
                         donation.quantity * 0.5; // boxes/liters approx
                         
      await ImpactLog.create({
        eventType: 'donation_delivered',
        quantityKg,
        mealsSaved: Math.round(donation.quantity),
        co2PreventedKg: parseFloat((quantityKg * 2.5).toFixed(2)),
        referenceId: donation._id
      });

      // Award Points to Donor (Base quantity * freshness multiplier)
      const hoursLeft = (donation.expiresAt - donation.createdAt) / 3600000;
      const freshness = hoursLeft > 24 ? 2 : hoursLeft > 6 ? 1.5 : 1;
      const donorPoints = Math.round(donation.quantity * freshness * 10);
      await awardPoints(donation.donor._id, donorPoints);
      await updateTrustScore(donation.donor._id, 5);

      // Award Points to NGO/Volunteer
      if (donation.assignedTo) {
        await awardPoints(donation.assignedTo._id, 50);
        await updateTrustScore(donation.assignedTo._id, 5);
      }

      // Notify via Socket.io
      io.to(donation.donor._id.toString()).emit('delivery_confirmed', { donationId: donation._id });
      if (donation.assignedTo) {
        io.to(donation.assignedTo._id.toString()).emit('delivery_confirmed', { donationId: donation._id });
      }

      logger.info(`Donation ${donation._id} delivery confirmed via QR`);
      return { action: 'delivery_confirmed', donation };
    }

    throw new Error('QR already used or invalid donation status');
  } catch (error) {
    if (error.name === 'TokenExpiredError') {
      throw new Error('QR code has expired');
    }
    throw error;
  }
};

module.exports = { generateQR, verifyQR };
