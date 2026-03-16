const mongoose = require('mongoose');

const productSchema = new mongoose.Schema(
  {
    retailer: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
    name: { type: String, required: true },
    category: { type: String },
    mrp: { type: Number, required: true },
    finalPrice: { type: Number },
    discountPercent: { type: Number, default: 0 },
    image: { type: String },
    quantity: { type: Number, required: true },
    expiresAt: { type: Date, required: true },
    storeLocation: {
      type: { type: String, default: 'Point' },
      coordinates: { type: [Number], default: [0, 0] },
      address: { type: String },
    },
    isActive: { type: Boolean, default: false },
    urgentBadge: { type: Boolean, default: false },
  },
  { timestamps: true }
);

productSchema.index({ storeLocation: '2dsphere' });

module.exports = mongoose.model('Product', productSchema);
