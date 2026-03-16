const mongoose = require('mongoose');

const donationSchema = new mongoose.Schema(
  {
    donor: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
    name: { type: String, required: true },
    category: {
      type: String,
      required: true,
      enum: ['cooked', 'raw', 'packaged', 'bakery', 'dairy', 'other'],
    },
    quantity: { type: Number, required: true },
    quantityUnit: {
      type: String,
      required: true,
      enum: ['kg', 'portions', 'boxes', 'liters'],
    },
    image: { type: String },
    aiValidated: { type: Boolean, default: false },
    aiConfidence: { type: Number, default: 0 },
    preparedAt: { type: Date },
    expiresAt: { type: Date, required: true },
    pickupLocation: {
      type: { type: String, default: 'Point' },
      coordinates: { type: [Number], default: [0, 0] },
      address: { type: String },
    },
    status: {
      type: String,
      default: 'available',
      enum: ['available', 'matched', 'in_transit', 'delivered', 'expired', 'wasted', 'removed'],
    },
    assignedTo: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
    qrCode: { type: String },
    qrPayload: { type: String },
    pickupConfirmedAt: { type: Date },
    deliveryConfirmedAt: { type: Date },
    ngoRating: { type: Number, min: 1, max: 5 },
    specialInstructions: { type: String },
  },
  { timestamps: true }
);

donationSchema.index({ pickupLocation: '2dsphere' });
donationSchema.index({ status: 1, expiresAt: 1 });
donationSchema.index({ donor: 1, status: 1 });

module.exports = mongoose.model('Donation', donationSchema);
