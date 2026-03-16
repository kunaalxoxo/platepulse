const Razorpay = require('razorpay');
const logger = require('../utils/logger');
const env = require('./env');

let razorpay = null;

if (env.RAZORPAY_KEY_ID && env.RAZORPAY_KEY_SECRET) {
  razorpay = new Razorpay({
    key_id: env.RAZORPAY_KEY_ID,
    key_secret: env.RAZORPAY_KEY_SECRET,
  });
} else {
  logger.warn('Razorpay keys not configured. Mocking payments for dev environment.');
  razorpay = {
    orders: {
      create: async (options) => {
        return {
          id: `order_mock_${Date.now()}`,
          entity: 'order',
          amount: options.amount,
          amount_paid: 0,
          amount_due: options.amount,
          currency: options.currency || 'INR',
          receipt: options.receipt,
          status: 'created',
          attempts: 0,
          created_at: Math.floor(Date.now() / 1000)
        };
      }
    }
  };
}

module.exports = razorpay;
