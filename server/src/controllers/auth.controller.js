const jwt = require('jsonwebtoken');
const bcrypt = require('bcryptjs');
const User = require('../models/User');
const env = require('../config/env');
const { sendVerificationOTP, sendPasswordResetOTP } = require('../services/email.service');
const logger = require('../utils/logger');

// ─── Helpers ────────────────────────────────────────────────

const generateTokens = (userId, role) => {
  const accessToken = jwt.sign({ id: userId, role }, env.JWT_SECRET, {
    expiresIn: env.JWT_EXPIRES_IN || '15m',
  });
  const refreshToken = jwt.sign({ id: userId }, env.JWT_REFRESH_SECRET, {
    expiresIn: env.JWT_REFRESH_EXPIRES_IN || '7d',
  });
  return { accessToken, refreshToken };
};

const setRefreshCookie = (res, token) => {
  res.cookie('refreshToken', token, {
    httpOnly: true,
    secure: env.NODE_ENV === 'production',
    sameSite: 'strict',
    maxAge: 7 * 24 * 60 * 60 * 1000, // 7 days
  });
};

const safeUser = (user) => ({
  id: user._id,
  name: user.name,
  email: user.email,
  role: user.role,
  avatar: user.avatar,
  points: user.points,
  badge: user.badge,
  trustScore: user.trustScore,
  orgName: user.orgName,
  phone: user.phone,
  location: user.location,
  isAvailable: user.isAvailable,
});

const generateOTP = () => Math.floor(100000 + Math.random() * 900000).toString();

const asyncHandler = (fn) => (req, res, next) => Promise.resolve(fn(req, res, next)).catch(next);

// ─── POST /api/v1/auth/register ─────────────────────────────

const register = asyncHandler(async (req, res) => {
  const { name, email, password, role, phone, orgName, location } = req.body;

  // Validation
  if (!name || !email || !password || !role) {
    return res.status(400).json({
      success: false,
      message: 'Validation failed',
      errors: [
        ...(!name ? [{ field: 'name', message: 'Name is required' }] : []),
        ...(!email ? [{ field: 'email', message: 'Email is required' }] : []),
        ...(!password ? [{ field: 'password', message: 'Password is required' }] : []),
        ...(!role ? [{ field: 'role', message: 'Role is required' }] : []),
      ],
    });
  }

  if (password.length < 8) {
    return res.status(400).json({
      success: false,
      message: 'Password must be at least 8 characters',
    });
  }

  // Role-specific validation
  const orgRoles = ['donor', 'retail', 'ngo', 'waste_plant'];
  if (orgRoles.includes(role) && !orgName) {
    return res.status(400).json({
      success: false,
      message: 'Organization name is required for this role',
    });
  }

  // Check email uniqueness
  const existingUser = await User.findOne({ email: email.toLowerCase() });
  if (existingUser) {
    return res.status(409).json({
      success: false,
      message: 'An account with this email already exists',
    });
  }

  // Generate OTP
  const otp = generateOTP();
  const hashedOTP = await bcrypt.hash(otp, 10);

  // Create user (password is hashed by pre-save hook)
  const user = await User.create({
    name,
    email: email.toLowerCase(),
    password,
    role,
    phone,
    orgName,
    location,
    verifyOTP: hashedOTP,
    verifyOTPExpiry: new Date(Date.now() + 10 * 60 * 1000),
  });

  // Send OTP email
  await sendVerificationOTP(email, name, otp);

  logger.info(`User registered: ${email} [${role}]`);

  return res.status(201).json({
    success: true,
    message: 'Verification code sent to email',
  });
});

// ─── POST /api/v1/auth/verify-email ─────────────────────────

const verifyEmail = asyncHandler(async (req, res) => {
  const { email, otp } = req.body;

  if (!email || !otp) {
    return res.status(400).json({
      success: false,
      message: 'Email and OTP are required',
    });
  }

  const user = await User.findOne({ email: email.toLowerCase() });
  if (!user) {
    return res.status(404).json({ success: false, message: 'User not found' });
  }

  if (user.isVerified) {
    return res.status(400).json({ success: false, message: 'Email already verified' });
  }

  if (!user.verifyOTPExpiry || user.verifyOTPExpiry < new Date()) {
    return res.status(400).json({ success: false, message: 'OTP has expired. Please request a new one.' });
  }

  const isMatch = await bcrypt.compare(otp.toString(), user.verifyOTP);
  if (!isMatch) {
    return res.status(400).json({ success: false, message: 'Invalid OTP' });
  }

  // Mark verified and clear OTP
  user.isVerified = true;
  user.verifyOTP = undefined;
  user.verifyOTPExpiry = undefined;

  // Generate tokens
  const { accessToken, refreshToken } = generateTokens(user._id, user.role);
  user.refreshToken = await bcrypt.hash(refreshToken, 10);
  await user.save();

  setRefreshCookie(res, refreshToken);

  logger.info(`Email verified: ${email}`);

  return res.status(200).json({
    success: true,
    message: 'Email verified successfully',
    data: { accessToken, user: safeUser(user) },
  });
});

// ─── POST /api/v1/auth/login ────────────────────────────────

const login = asyncHandler(async (req, res) => {
  const { email, password } = req.body;

  if (!email || !password) {
    return res.status(400).json({
      success: false,
      message: 'Email and password are required',
    });
  }

  const user = await User.findOne({ email: email.toLowerCase() });
  if (!user) {
    return res.status(401).json({ success: false, message: 'Invalid email or password' });
  }

  if (user.isSuspended) {
    return res.status(403).json({ success: false, message: 'Account is suspended. Contact support.' });
  }

  if (!user.isVerified) {
    return res.status(403).json({ success: false, message: 'Please verify your email first' });
  }

  const isMatch = await user.comparePassword(password);
  if (!isMatch) {
    return res.status(401).json({ success: false, message: 'Invalid email or password' });
  }

  // Generate tokens
  const { accessToken, refreshToken } = generateTokens(user._id, user.role);
  user.refreshToken = await bcrypt.hash(refreshToken, 10);
  await user.save();

  setRefreshCookie(res, refreshToken);

  logger.info(`User logged in: ${email}`);

  return res.status(200).json({
    success: true,
    message: 'Login successful',
    data: { accessToken, user: safeUser(user) },
  });
});

// ─── POST /api/v1/auth/refresh ──────────────────────────────

const refreshToken = asyncHandler(async (req, res) => {
  const token = req.cookies?.refreshToken;
  if (!token) {
    return res.status(401).json({ success: false, message: 'No refresh token provided' });
  }

  let decoded;
  try {
    decoded = jwt.verify(token, env.JWT_REFRESH_SECRET);
  } catch {
    return res.status(401).json({ success: false, message: 'Invalid or expired refresh token' });
  }

  const user = await User.findById(decoded.id);
  if (!user || !user.refreshToken) {
    return res.status(401).json({ success: false, message: 'Invalid refresh token' });
  }

  // Verify stored refresh token matches
  const isMatch = await bcrypt.compare(token, user.refreshToken);
  if (!isMatch) {
    // Possible token reuse — invalidate all sessions
    user.refreshToken = undefined;
    await user.save();
    return res.status(401).json({ success: false, message: 'Token reuse detected. Please log in again.' });
  }

  // Token rotation
  const tokens = generateTokens(user._id, user.role);
  user.refreshToken = await bcrypt.hash(tokens.refreshToken, 10);
  await user.save();

  setRefreshCookie(res, tokens.refreshToken);

  return res.status(200).json({
    success: true,
    data: { accessToken: tokens.accessToken },
  });
});

// ─── POST /api/v1/auth/logout ───────────────────────────────

const logout = asyncHandler(async (req, res) => {
  await User.findByIdAndUpdate(req.user.id, { refreshToken: undefined });
  res.clearCookie('refreshToken');
  return res.status(200).json({ success: true, message: 'Logged out' });
});

// ─── POST /api/v1/auth/forgot-password ──────────────────────

const forgotPassword = asyncHandler(async (req, res) => {
  const { email } = req.body;

  // Always return success to prevent email enumeration
  const user = await User.findOne({ email: email?.toLowerCase() });

  if (user) {
    const otp = generateOTP();
    user.resetOTP = await bcrypt.hash(otp, 10);
    user.resetOTPExpiry = new Date(Date.now() + 10 * 60 * 1000);
    await user.save();
    await sendPasswordResetOTP(email, user.name, otp);
    logger.info(`Password reset OTP sent to ${email}`);
  }

  return res.status(200).json({
    success: true,
    message: 'Reset code sent if email exists',
  });
});

// ─── POST /api/v1/auth/reset-password ───────────────────────

const resetPassword = asyncHandler(async (req, res) => {
  const { email, otp, newPassword } = req.body;

  if (!email || !otp || !newPassword) {
    return res.status(400).json({
      success: false,
      message: 'Email, OTP, and new password are required',
    });
  }

  if (newPassword.length < 8) {
    return res.status(400).json({
      success: false,
      message: 'Password must be at least 8 characters',
    });
  }

  const user = await User.findOne({ email: email.toLowerCase() });
  if (!user) {
    return res.status(400).json({ success: false, message: 'Invalid request' });
  }

  if (!user.resetOTPExpiry || user.resetOTPExpiry < new Date()) {
    return res.status(400).json({ success: false, message: 'OTP has expired' });
  }

  const isMatch = await bcrypt.compare(otp.toString(), user.resetOTP);
  if (!isMatch) {
    return res.status(400).json({ success: false, message: 'Invalid OTP' });
  }

  user.password = newPassword; // pre-save hook will hash
  user.resetOTP = undefined;
  user.resetOTPExpiry = undefined;
  await user.save();

  logger.info(`Password reset for ${email}`);

  return res.status(200).json({
    success: true,
    message: 'Password reset successful',
  });
});

// ─── GET /api/v1/auth/me ────────────────────────────────────

const getMe = asyncHandler(async (req, res) => {
  const user = await User.findById(req.user.id);
  if (!user) {
    return res.status(404).json({ success: false, message: 'User not found' });
  }

  return res.status(200).json({
    success: true,
    data: { user: safeUser(user) },
  });
});

module.exports = {
  register,
  verifyEmail,
  login,
  refreshToken,
  logout,
  forgotPassword,
  resetPassword,
  getMe,
};
