const mongoose = require('mongoose');

const missionSchema = new mongoose.Schema(
  {
    donation: { type: mongoose.Schema.Types.ObjectId, ref: 'Donation', required: true },
    ngoId: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
    volunteerId: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
    pickupAddress: String,
    pickupLat: Number,
    pickupLng: Number,
    deliveryAddress: String,
    deliveryLat: Number,
    deliveryLng: Number,
    status: {
      type: String,
      default: 'pending',
      enum: ['pending', 'accepted', 'in_transit', 'delivered', 'expired', 'declined'],
    },
    pointsReward: { type: Number, default: 50 },
    acceptedAt: Date,
    timeoutAt: Date,
    qrCode: String, // data URL for display
    qrToken: String, // JWT for verification
  },
  { timestamps: true }
);

module.exports = mongoose.model('Mission', missionSchema);
