const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');

const userSchema = new mongoose.Schema(
  {
    name: { type: String, required: true, trim: true },
    email: { type: String, required: true, unique: true, lowercase: true },
    password: { type: String, required: true, minlength: 8 },
    role: {
      type: String,
      required: true,
      enum: ['donor', 'retail', 'ngo', 'volunteer', 'consumer', 'waste_plant', 'admin'],
    },
    phone: { type: String },
    avatar: { type: String }, // cloudinary URL
    orgName: { type: String }, // for donor/retail/ngo/waste_plant
    location: {
      type: { type: String, default: 'Point' },
      coordinates: { type: [Number], default: [0, 0] }, // [lng, lat]
      address: { type: String },
    },
    trustScore: { type: Number, default: 50, min: 0, max: 100 },
    points: { type: Number, default: 0 },
    badge: {
      type: String,
      enum: ['none', 'bronze', 'silver', 'gold', 'hero'],
      default: 'none',
    },
    isAvailable: { type: Boolean, default: true },
    isVerified: { type: Boolean, default: false },
    verifyOTP: { type: String },
    verifyOTPExpiry: { type: Date },
    resetOTP: { type: String },
    resetOTPExpiry: { type: Date },
    fcmToken: { type: String },
    refreshToken: { type: String },
    isSuspended: { type: Boolean, default: false },
  },
  { timestamps: true }
);

// Indexes
userSchema.index({ location: '2dsphere' });

userSchema.index({ role: 1 });

// Hash password pre-save
userSchema.pre('save', async function (next) {
  if (!this.isModified('password')) return next();
  this.password = await bcrypt.hash(this.password, 12);
  next();
});

// Instance method: compare password
userSchema.methods.comparePassword = async function (candidatePassword) {
  return bcrypt.compare(candidatePassword, this.password);
};

module.exports = mongoose.model('User', userSchema);
