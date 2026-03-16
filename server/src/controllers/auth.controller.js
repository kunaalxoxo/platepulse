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
    sameSite: 'none',
    maxAge: 7 * 24 * 60 * 60 * 1000,
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
    return res.status(400).json({ success: false, message: 'Password must be at least 8 characters' });
  }

  const orgRoles = ['donor', 'retail', 'ngo', 'waste_plant'];
  if (orgRoles.includes(role) && !orgName) {
    return res.status(400).json({ success: false, message: 'Organization name is required for this role' });
  }

  const existingUser = await User.findOne({ email: email.toLowerCase() });
  if (existingUser) {
    return res.status(409).json({ success: false, message: 'An account with this email already exists' });
  }

  const otp = generateOTP();
  const hashedOTP = await bcrypt.hash(otp, 10);

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

  // Send OTP email — catch error so it never crashes registration
  try {
    await sendVerificationOTP(email, name, otp);
  } catch (emailErr) {
    logger.error(`Email send failed (non-fatal): ${emailErr.message}`);
    // Log OTP to server logs so it can be used during testing
    logger.info(`[FALLBACK] OTP for ${email}: ${otp}`);
  }

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
    return res.status(400).json({ success: false, message: 'Email and OTP are required' });
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

  user.isVerified = true;
  user.verifyOTP = undefined;
  user.verifyOTPExpiry = undefined;

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
    return res.status(400).json({ success: false, message: 'Email and password are required' });
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

  const isMatch = await bcrypt.compare(token, user.refreshToken);
  if (!isMatch) {
    user.refreshToken = undefined;
    await user.save();
    return res.status(401).json({ success: false, message: 'Token reuse detected. Please log in again.' });
  }

  const tokens = generateTokens(user._id, user.role);
  user.refreshToken = await bcrypt.hash(tokens.refreshToken, 10);
  await user.save();

  setRefreshCookie(res, tokens.refreshToken);

  return res.status(200).json({ success: true, data: { accessToken: tokens.accessToken } });
});

// ─── POST /api/v1/auth/logout ───────────────────────────────

const logout = asyncHandler(async (req, res) => {
  await User.findByIdAndUpdate(req.user.id, { refreshToken: undefined });
  res.clearCookie('refreshToken');
  return res.status(200).json({ success: true, message: 'Logged out' });
});

// ─── POST /api/v1/auth/forgot-password ──────────────────────

const forgotPassword = asyncHandler(async (req, res) => {
  const user = await User.findOne({ email: req.body.email?.toLowerCase() });

  if (user) {
    const otp = generateOTP();
    user.resetOTP = await bcrypt.hash(otp, 10);
    user.resetOTPExpiry = new Date(Date.now() + 10 * 60 * 1000);
    await user.save();
    try {
      await sendPasswordResetOTP(req.body.email, user.name, otp);
    } catch (emailErr) {
      logger.error(`Reset email failed (non-fatal): ${emailErr.message}`);
      logger.info(`[FALLBACK] Reset OTP for ${req.body.email}: ${otp}`);
    }
    logger.info(`Password reset OTP sent to ${req.body.email}`);
  }

  return res.status(200).json({ success: true, message: 'Reset code sent if email exists' });
});

// ─── POST /api/v1/auth/reset-password ───────────────────────

const resetPassword = asyncHandler(async (req, res) => {
  const { email, otp, newPassword } = req.body;

  if (!email || !otp || !newPassword) {
    return res.status(400).json({ success: false, message: 'Email, OTP, and new password are required' });
  }

  if (newPassword.length < 8) {
    return res.status(400).json({ success: false, message: 'Password must be at least 8 characters' });
  }

  const user = await User.findOne({ email: email.toLowerCase() });
  if (!user) return res.status(400).json({ success: false, message: 'Invalid request' });

  if (!user.resetOTPExpiry || user.resetOTPExpiry < new Date()) {
    return res.status(400).json({ success: false, message: 'OTP has expired' });
  }

  const isMatch = await bcrypt.compare(otp.toString(), user.resetOTP);
  if (!isMatch) return res.status(400).json({ success: false, message: 'Invalid OTP' });

  user.password = newPassword;
  user.resetOTP = undefined;
  user.resetOTPExpiry = undefined;
  await user.save();

  logger.info(`Password reset for ${email}`);
  return res.status(200).json({ success: true, message: 'Password reset successful' });
});

// ─── GET /api/v1/auth/me ────────────────────────────────────

const getMe = asyncHandler(async (req, res) => {
  const user = await User.findById(req.user.id);
  if (!user) return res.status(404).json({ success: false, message: 'User not found' });
  return res.status(200).json({ success: true, data: { user: safeUser(user) } });
});

module.exports = { register, verifyEmail, login, refreshToken, logout, forgotPassword, resetPassword, getMe };
