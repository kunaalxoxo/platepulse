const mongoose = require('mongoose');

const orderSchema = new mongoose.Schema(
  {
    consumer: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
    items: [
      {
        product: { type: mongoose.Schema.Types.ObjectId, ref: 'Product' },
        quantity: Number,
        price: Number,
      },
    ],
    totalAmount: { type: Number, required: true },
    paymentStatus: {
      type: String,
      default: 'pending',
      enum: ['pending', 'paid', 'failed'],
    },
    paymentId: { type: String },
    razorpayOrderId: { type: String },
  },
  { timestamps: true }
);

module.exports = mongoose.model('Order', orderSchema);
