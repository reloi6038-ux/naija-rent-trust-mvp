const bcrypt = require('bcryptjs');
const User = require('../models/User');
const { signAccess, signRefresh, verifyRefresh } = require('../services/tokens');
const { setAuthCookie, clearAuthCookie } = require('../utils/cookie');
const mailer = require('../services/mailer');

const MAX_ATTEMPTS = Number(process.env.MAX_LOGIN_ATTEMPTS || 5);
const LOCKOUT_MS = Number(process.env.LOCKOUT_MINUTES || 15) * 60 * 1000;

function setRefreshCookie(res, token) {
  res.cookie('refresh', token, {
    httpOnly: true,
    sameSite: 'lax',
    secure: process.env.NODE_ENV === 'production',
    maxAge: 30 * 24 * 60 * 60 * 1000,
    path: '/api/auth'
  });
}

exports.register = async (req, res, next) => {
  try {
    const { name, email, phone, password, acceptTerms } = req.body;
    if (!name || !email || !phone || !password) {
      return res.status(400).json({ success: false, message: 'Name, email, phone and password are required' });
    }
    if (!acceptTerms) {
      return res.status(400).json({ success: false, message: 'You must accept the Terms and Privacy Policy' });
    }
    if (password.length < 8) {
      return res.status(400).json({ success: false, message: 'Password must be at least 8 characters' });
    }
    if (await User.findOne({ email: email.toLowerCase() })) {
      return res.status(409).json({ success: false, message: 'Email already registered' });
    }

    const passwordHash = await bcrypt.hash(password, 12);
    const user = await User.create({
      name, email, phone, passwordHash, role: 'lister',
      consentedToTermsAt: new Date(),
      consentedToPrivacyAt: new Date()
    });

    const accessToken = signAccess(user);
    const refreshToken = signRefresh(user);
    setAuthCookie(res, accessToken);
    setRefreshCookie(res, refreshToken);

    res.status(201).json({
      success: true,
      user: user.toSafeJSON(),
      accessToken,
      message: 'Account created. You are now signed in.'
    });
  } catch (e) { next(e); }
};

exports.login = async (req, res, next) => {
  try {
    const { email, password, expectRole, totp } = req.body;
    if (!email || !password) return res.status(400).json({ success: false, message: 'Email and password required' });

    const user = await User.findOne({ email: email.toLowerCase() })
      .select('+passwordHash +failedLoginAttempts +lockedUntil +totpSecret');

    if (!user) return res.status(401).json({ success: false, message: 'Invalid credentials' });

    if (user.lockedUntil && user.lockedUntil > new Date()) {
      const mins = Math.ceil((user.lockedUntil - Date.now()) / 60000);
      return res.status(423).json({ success: false, message: `Account locked. Try again in ${mins} minutes.` });
    }

    const ok = await bcrypt.compare(password, user.passwordHash);
    if (!ok) {
      user.failedLoginAttempts = (user.failedLoginAttempts || 0) + 1;
      if (user.failedLoginAttempts >= MAX_ATTEMPTS) {
        user.lockedUntil = new Date(Date.now() + LOCKOUT_MS);
        user.failedLoginAttempts = 0;
      }
      await user.save();
      return res.status(401).json({ success: false, message: 'Invalid credentials' });
    }

    user.failedLoginAttempts = 0;
    user.lockedUntil = undefined;

    if (expectRole && user.role !== expectRole) {
      await user.save();
      return res.status(403).json({ success: false, message: 'Role mismatch' });
    }

    if (user.role === 'admin' && user.totpEnabled) {
      if (!totp) {
        await user.save();
        return res.status(401).json({ success: false, message: '2FA code required', requires2FA: true });
      }
      const speakeasy = require('speakeasy');
      const valid = speakeasy.totp.verify({ secret: user.totpSecret, encoding: 'base32', token: totp, window: 1 });
      if (!valid) {
        await user.save();
        return res.status(401).json({ success: false, message: 'Invalid 2FA code' });
      }
    }

    await user.save();

    const accessToken = signAccess(user);
    const refreshToken = signRefresh(user);
    setAuthCookie(res, accessToken);
    setRefreshCookie(res, refreshToken);

    res.json({
      success: true, user: user.toSafeJSON(), accessToken
    });
  } catch (e) { next(e); }
};

exports.refresh = async (req, res, next) => {
  try {
    const token = req.cookies?.refresh;
    if (!token) return res.status(401).json({ success: false, message: 'No refresh token' });
    const payload = verifyRefresh(token);
    const user = await User.findById(payload.id);
    if (!user || user.isSuspended) return res.status(401).json({ success: false, message: 'Invalid session' });
    const accessToken = signAccess(user);
    setAuthCookie(res, accessToken);
    res.json({ success: true, accessToken });
  } catch { res.status(401).json({ success: false, message: 'Invalid refresh token' }); }
};

exports.forgotPassword = async (req, res, next) => {
  try {
    const { email } = req.body;
    const user = await User.findOne({ email: (email || '').toLowerCase() });
    if (user) {
      const raw = User.generateToken();
      user.passwordResetToken = User.hashToken(raw);
      user.passwordResetExpires = new Date(Date.now() + 30 * 60 * 1000);
      await user.save();
      await mailer.sendPasswordReset(user, raw);
    }
    res.json({ success: true, message: 'If that email exists, a reset link has been sent.' });
  } catch (e) { next(e); }
};

exports.resetPassword = async (req, res, next) => {
  try {
    const { token, password } = req.body;
    if (!token || !password) return res.status(400).json({ success: false, message: 'Token and password required' });
    if (password.length < 8) return res.status(400).json({ success: false, message: 'Password too short' });
    const hash = User.hashToken(token);
    const user = await User.findOne({
      passwordResetToken: hash,
      passwordResetExpires: { $gt: new Date() }
    }).select('+passwordResetToken +passwordResetExpires');
    if (!user) return res.status(400).json({ success: false, message: 'Invalid or expired token' });
    user.passwordHash = await bcrypt.hash(password, 12);
    user.passwordResetToken = undefined;
    user.passwordResetExpires = undefined;
    user.failedLoginAttempts = 0;
    user.lockedUntil = undefined;
    await user.save();
    res.json({ success: true, message: 'Password updated. You can now log in.' });
  } catch (e) { next(e); }
};

exports.logout = (req, res) => {
  clearAuthCookie(res);
  res.clearCookie('refresh', { path: '/api/auth' });
  res.json({ success: true, message: 'Logged out' });
};

exports.me = (req, res) => res.json({ success: true, user: req.user.toSafeJSON() });

// Admin 2FA
exports.setup2FA = async (req, res, next) => {
  try {
    if (req.user.role !== 'admin') return res.status(403).json({ success: false, message: 'Admins only' });
    const speakeasy = require('speakeasy');
    const qrcode = require('qrcode');
    const secret = speakeasy.generateSecret({ name: `NaijaRent (${req.user.email})`, length: 20 });
    req.user.totpSecret = secret.base32;
    await req.user.save();
    const dataUrl = await qrcode.toDataURL(secret.otpauth_url);
    res.json({ success: true, otpauth: secret.otpauth_url, qr: dataUrl });
  } catch (e) { next(e); }
};

exports.enable2FA = async (req, res, next) => {
  try {
    if (req.user.role !== 'admin') return res.status(403).json({ success: false, message: 'Admins only' });
    const { token } = req.body;
    const speakeasy = require('speakeasy');
    const user = await User.findById(req.user._id).select('+totpSecret');
    const valid = speakeasy.totp.verify({ secret: user.totpSecret, encoding: 'base32', token, window: 1 });
    if (!valid) return res.status(400).json({ success: false, message: 'Invalid code' });
    user.totpEnabled = true;
    await user.save();
    res.json({ success: true, message: '2FA enabled' });
  } catch (e) { next(e); }
};
