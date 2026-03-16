const router = require('express').Router();
const { createOrder, verifyPayment, getMyOrders } = require('../controllers/order.controller');
const { verifyToken, requireRole } = require('../middleware/auth');

router.post('/create-order', verifyToken, requireRole('consumer'), createOrder);
router.post('/verify-payment', verifyToken, requireRole('consumer'), verifyPayment);
router.get('/my-orders', verifyToken, requireRole('consumer', 'retail'), getMyOrders);

module.exports = router;
