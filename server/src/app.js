const express = require('express');
const cors = require('cors');
const helmet = require('helmet');
const morgan = require('morgan');
const cookieParser = require('cookie-parser');
const env = require('./config/env');
const errorHandler = require('./middleware/error');
const { apiLimiter } = require('./middleware/rateLimit');

// Route imports
const authRoutes = require('./routes/auth.routes');
const donationRoutes = require('./routes/donation.routes');
const productRoutes = require('./routes/product.routes');
const orderRoutes = require('./routes/order.routes');
const missionRoutes = require('./routes/mission.routes');
const volunteerRoutes = require('./routes/volunteer.routes');
const wasteRoutes = require('./routes/waste.routes');
const notificationRoutes = require('./routes/notification.routes');
const communityRoutes = require('./routes/community.routes');
const impactRoutes = require('./routes/impact.routes');
const adminRoutes = require('./routes/admin.routes');
const mapRoutes = require('./routes/map.routes');
const qrRoutes = require('./routes/qr.routes');
const app = express();

// Security & parsing middleware
app.use(helmet());
app.use(cors({ origin: env.CLIENT_URL, credentials: true }));
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true }));
app.use(cookieParser());
app.use(morgan('dev'));

// Rate limiting
app.use('/api/', apiLimiter);

// API routes — all prefixed /api/v1/
app.use('/api/v1/auth', authRoutes);
app.use('/api/v1/donations', donationRoutes);
app.use('/api/v1/products', productRoutes);
app.use('/api/v1/orders', orderRoutes);
app.use('/api/v1/missions', missionRoutes);
app.use('/api/v1/volunteers', volunteerRoutes);
app.use('/api/v1/waste', wasteRoutes);
app.use('/api/v1/notifications', notificationRoutes);
app.use('/api/v1/community', communityRoutes);
app.use('/api/v1/impact', impactRoutes);
app.use('/api/v1/admin', adminRoutes);
app.use('/api/v1/map', mapRoutes);
app.use('/api/v1/qr', qrRoutes);
// Health check
app.get('/api/v1/health', (req, res) => {
  res.json({ success: true, message: 'PlatePulse API is running', data: { uptime: process.uptime() } });
});

// 404 handler
app.use((req, res) => {
  res.status(404).json({ success: false, message: `Route ${req.originalUrl} not found` });
});

// Global error handler
app.use(errorHandler);

module.exports = app;
