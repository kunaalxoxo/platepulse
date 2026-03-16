const WasteRequest = require('../models/WasteRequest');
const ImpactLog = require('../models/ImpactLog');
const { invalidateCache } = require('./impact.controller');

const asyncHandler = fn => (req, res, next) => Promise.resolve(fn(req, res, next)).catch(next);

// ─── GET /api/v1/waste/my-requests ───────────────────────────────────────

const getMyRequests = asyncHandler(async (req, res) => {
  const { status } = req.query;
  const filter = { wastePlant: req.user.id };
  if (status) filter.status = status;

  const requests = await WasteRequest.find(filter)
    .populate('donation', 'name quantity quantityUnit pickupLocation category')
    .sort({ createdAt: -1 });

  return res.status(200).json({ success: true, data: requests });
});

// ─── POST /api/v1/waste/:requestId/confirm ───────────────────────────────

const confirmPickup = asyncHandler(async (req, res) => {
  const { compostKg, biogasLiters, feedKg } = req.body;
  const { requestId } = req.params;

  const wasteReq = await WasteRequest.findById(requestId).populate('donation');

  if (!wasteReq) return res.status(404).json({ success: false, message: 'Request not found' });
  if (wasteReq.wastePlant.toString() !== req.user.id) {
    return res.status(403).json({ success: false, message: 'Not authorized for this request' });
  }

  // Update Status & Log specific metrics
  wasteReq.status = 'completed';
  wasteReq.compostKg = parseFloat(compostKg) || 0;
  wasteReq.biogasLiters = parseFloat(biogasLiters) || 0;
  wasteReq.feedKg = parseFloat(feedKg) || 0;
  wasteReq.confirmedAt = new Date();
  await wasteReq.save();

  // Flag root donation as officially wasted
  if (wasteReq.donation) {
    wasteReq.donation.status = 'wasted';
    await wasteReq.donation.save();
  }

  // Generate an impact record representing diverted carbon output
  await ImpactLog.create({
    eventType: 'waste_processed',
    quantityKg: wasteReq.compostKg + wasteReq.feedKg,
    compostKg: wasteReq.compostKg,
    biogasLiters: wasteReq.biogasLiters,
    co2PreventedKg: parseFloat((wasteReq.compostKg * 2.5).toFixed(2)), // General compost benchmark
    referenceId: wasteReq._id
  });

  // Purge internal cache since data shifted
  invalidateCache();

  return res.status(200).json({ success: true, message: 'Pickup confirmed and impact logged', data: wasteReq });
});

module.exports = {
  getMyRequests,
  confirmPickup
};
