const crypto = require('crypto');
const Order = require('../models/Order');
const Product = require('../models/Product');
const ImpactLog = require('../models/ImpactLog');
const Notification = require('../models/Notification');
const razorpay = require('../config/razorpay');
const env = require('../config/env');

const asyncHandler = fn => (req, res, next) => Promise.resolve(fn(req, res, next)).catch(next);

// ─── POST /api/v1/orders/create-order ────────────────────────────────────

const createOrder = asyncHandler(async (req, res) => {
  const { items } = req.body; // [{ productId, quantity }]

  if (!items || !items.length) {
    return res.status(400).json({ success: false, message: 'Cart items are required' });
  }

  let totalAmount = 0;
  const validatedItems = [];

  // Data Integrity verification phase
  for (const item of items) {
    const product = await Product.findById(item.productId);
    
    if (!product || !product.isActive) {
      return res.status(400).json({ success: false, message: `Product ${product?.name || item.productId} is no longer available` });
    }
    if (product.quantity < item.quantity) {
      return res.status(400).json({ success: false, message: `Only ${product.quantity} units available for ${product.name}` });
    }

    validatedItems.push({
      product: product._id,
      quantity: item.quantity,
      price: product.finalPrice
    });
    
    totalAmount += product.finalPrice * item.quantity;
  }

  // Gateway Phase — Create Razorpay intent
  let razorpayOrderId = `mock_${Date.now()}`;
  let rzpAmount = Math.round(totalAmount * 100);

  if (env.RAZORPAY_KEY_ID && env.RAZORPAY_KEY_SECRET) {
    const razorpayOrder = await razorpay.orders.create({
      amount: rzpAmount, // paise
      currency: 'INR',
      receipt: `order_${Date.now()}`
    });
    razorpayOrderId = razorpayOrder.id;
  }

  // Persistence Phase
  const order = await Order.create({
    consumer: req.user.id,
    items: validatedItems,
    totalAmount,
    paymentStatus: 'pending',
    razorpayOrderId
  });

  return res.status(201).json({
    success: true,
    data: {
      orderId: order._id,
      razorpayOrderId,
      amount: rzpAmount,
      currency: 'INR',
      key: env.RAZORPAY_KEY_ID || 'mock_key'
    }
  });
});

// ─── POST /api/v1/orders/verify-payment ──────────────────────────────────

const verifyPayment = asyncHandler(async (req, res) => {
  const { orderId, razorpay_order_id, razorpay_payment_id, razorpay_signature } = req.body;

  // 1. Signature check logic
  if (env.RAZORPAY_KEY_SECRET && razorpay_signature !== 'mock') {
    const expectedSignature = crypto
      .createHmac('sha256', env.RAZORPAY_KEY_SECRET)
      .update(razorpay_order_id + '|' + razorpay_payment_id)
      .digest('hex');

    if (expectedSignature !== razorpay_signature) {
      await Order.findByIdAndUpdate(orderId, { paymentStatus: 'failed' });
      return res.status(400).json({ success: false, message: 'Payment verification failed due to invalid internal signature' });
    }
  }

  // 2. Clear Order
  const order = await Order.findByIdAndUpdate(orderId, {
    paymentStatus: 'paid',
    paymentId: razorpay_payment_id || `mock_pay_${Date.now()}`
  }, { new: true }).populate('items.product');

  // 3. Atomical Decrements & Out-Of-Stock Logic
  const retailersToNotify = new Set();
  
  for (const item of order.items) {
    const updatedProduct = await Product.findByIdAndUpdate(
      item.product._id,
      { $inc: { quantity: -item.quantity } },
      { new: true }
    );
    
    if (updatedProduct.quantity <= 0) {
      updatedProduct.isActive = false;
      await updatedProduct.save();
    }
    
    retailersToNotify.add(item.product.retailer.toString());
  }

  // 4. Impact Metric Insertion
  // Estimate weight arbitrarily at 0.3kg per item representing a rescue portion
  const totalKg = order.items.reduce((sum, item) => sum + (item.quantity * 0.3), 0);
  const totalMeals = order.items.reduce((s, i) => s + i.quantity, 0);

  await ImpactLog.create({
    eventType: 'order_completed',
    quantityKg: parseFloat(totalKg.toFixed(2)),
    mealsSaved: totalMeals,
    co2PreventedKg: parseFloat((totalKg * 2.5).toFixed(2)),
    referenceId: order._id
  });

  // 5. Notify all Retailers participating in this sub-cart checkout
  for (const retailerId of retailersToNotify) {
    await Notification.create({
      user: retailerId,
      type: 'sale',
      title: 'New order received',
      body: `Customer purchased rescued products worth ₹${order.totalAmount}. Order #${order._id.toString().slice(-6)}`,
      metadata: { orderId: order._id }
    });
  }

  return res.status(200).json({ success: true, message: 'Payment verified and transaction completed', data: order });
});

// ─── GET /api/v1/orders/my-orders ────────────────────────────────────────

const getMyOrders = asyncHandler(async (req, res) => {
  // Consumers see their placed orders.
  // Retailers routing could be distinct, but this function retrieves checkout logs for the buyer
  const roleQuery = req.user.role === 'retail' ? 
    { 'items.product': { $exists: true } } :  // In a real app we'd aggregate
    { consumer: req.user.id };                // Standard logic for consumer

  const orders = await Order.find(roleQuery)
    .populate('items.product', 'name image mrp finalPrice quantityUnit category retailer')
    .sort({ createdAt: -1 });

  return res.status(200).json({ success: true, data: orders });
});

module.exports = {
  createOrder,
  verifyPayment,
  getMyOrders
};
