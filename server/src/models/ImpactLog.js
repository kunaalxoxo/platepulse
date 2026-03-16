const mongoose = require('mongoose');

const impactLogSchema = new mongoose.Schema(
  {
    eventType: {
      type: String,
      required: true,
      enum: ['donation_delivered', 'waste_processed', 'order_completed'],
    },
    quantityKg: { type: Number, default: 0 },
    mealsSaved: { type: Number, default: 0 },
    co2PreventedKg: { type: Number, default: 0 },
    compostKg: { type: Number, default: 0 },
    biogasLiters: { type: Number, default: 0 },
    referenceId: { type: mongoose.Schema.Types.ObjectId },
  },
  { timestamps: true }
);

module.exports = mongoose.model('ImpactLog', impactLogSchema);
