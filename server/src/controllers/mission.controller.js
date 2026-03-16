const Mission = require('../models/Mission');
const Donation = require('../models/Donation');
const Notification = require('../models/Notification');
const { generateQR, verifyQR } = require('../services/qr.service');
const { findMatches } = require('../services/matching.service');
const { getIO } = require('../socket/socket.server');
const logger = require('../utils/logger');

const asyncHandler = fn => (req, res, next) => Promise.resolve(fn(req, res, next)).catch(next);

// ─── POST /api/v1/missions/accept/:donationId ──────────────────────────

const acceptMission = asyncHandler(async (req, res) => {
  const donation = await Donation.findById(req.params.donationId);

  if (!donation) return res.status(404).json({ success: false, message: 'Donation not found' });
  if (donation.status !== 'available') {
    return res.status(400).json({ success: false, message: 'Donation has already been accepted or is unavailable' });
  }

  // 1. Update Donation
  donation.status = 'matched';
  donation.assignedTo = req.user.id;
  await donation.save();

  // 2. Generate Initial QR Code
  // Mission ID is not generated yet, so pass null first, then regenerate to link them
  const initialQr = await generateQR(donation._id, null, req.user.id);

  // 3. Create Mission
  const mission = await Mission.create({
    donation: donation._id,
    ...(req.user.role === 'ngo' ? { ngoId: req.user.id } : { volunteerId: req.user.id }),
    pickupAddress: donation.pickupLocation.address,
    pickupLat: donation.pickupLocation.coordinates[1],
    pickupLng: donation.pickupLocation.coordinates[0],
    timeoutAt: new Date(Date.now() + 10 * 60 * 1000), // 10 minutes to verify pickup
    qrCode: initialQr.qrDataUrl,
    qrToken: initialQr.token,
    pointsReward: 50
  });

  // regenerate QR properly tied to newly made Mission ID
  const finalQr = await generateQR(donation._id, mission._id, req.user.id);
  mission.qrCode = finalQr.qrDataUrl;
  mission.qrToken = finalQr.token;
  await mission.save();

  // 4. Notify Donor
  await Notification.create({
    user: donation.donor,
    type: 'accepted',
    title: 'Donation accepted!',
    body: `Your donation "${donation.name}" has been accepted for pickup.`,
    metadata: { donationId: donation._id, missionId: mission._id }
  });

  const io = getIO();
  io.to(donation.donor.toString()).emit('donation_accepted', {
    donationId: donation._id,
    missionId: mission._id
  });

  logger.info(`Mission ${mission._id} accepted by ${req.user.id} for Donation ${donation._id}`);

  return res.status(200).json({ success: true, data: { mission } });
});

// ─── POST /api/v1/missions/decline/:missionId ──────────────────────────

const declineMission = asyncHandler(async (req, res) => {
  const mission = await Mission.findById(req.params.missionId).populate('donation');

  if (!mission) return res.status(404).json({ success: false, message: 'Mission not found' });
  if (mission.status === 'delivered') return res.status(400).json({ success: false, message: 'Cannot decline delivered mission' });

  // Update Mission
  mission.status = 'declined';
  await mission.save();

  // Free the Donation
  const donation = mission.donation;
  if (donation) {
    donation.status = 'available';
    donation.assignedTo = undefined;
    await donation.save();

    // Re-run matching async
    findMatches(donation).catch(err => logger.error(`Re-matching failed: ${err.message}`));
  }

  logger.info(`Mission ${mission._id} declined by ${req.user.id}`);

  return res.status(200).json({ success: true, message: 'Mission declined, reassigning to network' });
});

// ─── GET /api/v1/missions/my-missions ────────────────────────────────────

const getMyMissions = asyncHandler(async (req, res) => {
  const query = req.user.role === 'ngo' 
    ? { ngoId: req.user.id } 
    : { volunteerId: req.user.id };

  const missions = await Mission.find(query)
    .populate('donation', 'name image category quantity pickupLocation status')
    .sort({ createdAt: -1 });

  return res.status(200).json({ success: true, data: missions });
});

// ─── POST /api/v1/qr/verify ─────────────────────────────────────────────

const verifyQRCode = asyncHandler(async (req, res) => {
  const { token } = req.body;
  if (!token) return res.status(400).json({ success: false, message: 'QR token is required' });

  const result = await verifyQR(token);
  return res.status(200).json({ success: true, data: result });
});

module.exports = {
  acceptMission,
  declineMission,
  getMyMissions,
  verifyQRCode
};
