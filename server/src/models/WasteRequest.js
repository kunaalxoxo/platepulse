const mongoose = require('mongoose');

const wasteRequestSchema = new mongoose.Schema(
  {
    donation: { type: mongoose.Schema.Types.ObjectId, ref: 'Donation', required: true },
    wastePlant: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
    status: {
      type: String,
      default: 'pending',
      enum: ['pending', 'confirmed', 'completed'],
    },
    compostKg: Number,
    biogasLiters: Number,
    feedKg: Number,
    confirmedAt: Date,
  },
  { timestamps: true }
);

module.exports = mongoose.model('WasteRequest', wasteRequestSchema);
