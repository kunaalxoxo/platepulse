const mongoose = require('mongoose');

const communityShareSchema = new mongoose.Schema(
  {
    postedBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
    name: { type: String, required: true },
    category: String,
    quantity: Number,
    image: String,
    location: {
      type: { type: String, default: 'Point' },
      coordinates: { type: [Number], default: [0, 0] },
      address: String,
    },
    claimedByLimit: { type: Number, default: 1 },
    claimedCount: { type: Number, default: 0 },
    expiresAt: Date,
    isActive: { type: Boolean, default: true },
  },
  { timestamps: true }
);

communityShareSchema.index({ location: '2dsphere' });

module.exports = mongoose.model('CommunityShare', communityShareSchema);
