const express = require('express');
const cors = require('cors');
const helmet = require('helmet');
const morgan = require('morgan');
const cookieParser = require('cookie-parser');
const env = require('./config/env');
const errorHandler = require('./middleware/error');
const { apiLimiter } = require('./middleware/rateLimit');

// Route imports
const authRoutes         = require('./routes/auth.routes');
const donationRoutes     = require('./routes/donation.routes');
const productRoutes      = require('./routes/product.routes');
const orderRoutes        = require('./routes/order.routes');
const missionRoutes      = require('./routes/mission.routes');
const volunteerRoutes    = require('./routes/volunteer.routes');
const wasteRoutes        = require('./routes/waste.routes');
const notificationRoutes = require('./routes/notification.routes');
const communityRoutes    = require('./routes/community.routes');
const impactRoutes       = require('./routes/impact.routes');
const adminRoutes        = require('./routes/admin.routes');
const mapRoutes          = require('./routes/map.routes');
const qrRoutes           = require('./routes/qr.routes');
const seedRoutes         = require('./routes/seed.routes');

const app = express();

const allowedOrigins = [
  'http://localhost:5173',
  'http://localhost:3000',
  'https://platepulse-rho.vercel.app',
  env.CLIENT_URL,
].filter(Boolean);

const corsOptions = {
  origin: (origin, callback) => {
    if (!origin) return callback(null, true);
    if (allowedOrigins.includes(origin)) return callback(null, true);
    if (origin.endsWith('.vercel.app')) return callback(null, true);
    return callback(new Error(`CORS blocked: ${origin}`));
  },
  credentials: true,
};

app.use(helmet());
app.use(cors(corsOptions));
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true }));
app.use(cookieParser());
app.use(morgan('dev'));
app.use('/api/', apiLimiter);

app.use('/api/v1/auth',          authRoutes);
app.use('/api/v1/donations',     donationRoutes);
app.use('/api/v1/products',      productRoutes);
app.use('/api/v1/orders',        orderRoutes);
app.use('/api/v1/missions',      missionRoutes);
app.use('/api/v1/volunteers',    volunteerRoutes);
app.use('/api/v1/waste',         wasteRoutes);
app.use('/api/v1/notifications', notificationRoutes);
app.use('/api/v1/community',     communityRoutes);
app.use('/api/v1/impact',        impactRoutes);
app.use('/api/v1/admin',         adminRoutes);
app.use('/api/v1/map',           mapRoutes);
app.use('/api/v1/qr',            qrRoutes);
app.use('/api/v1/seed',          seedRoutes);

app.get('/api/v1/health', (req, res) => {
  res.json({ success: true, message: 'PlatePulse API is running', data: { uptime: process.uptime() } });
});

app.use((req, res) => {
  res.status(404).json({ success: false, message: `Route ${req.originalUrl} not found` });
});

app.use(errorHandler);

module.exports = app;
