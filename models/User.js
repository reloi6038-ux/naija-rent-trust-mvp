const mongoose = require('mongoose');
const crypto = require('crypto');

const userSchema = new mongoose.Schema({
  name: { type: String, required: true, trim: true, maxlength: 100 },
  email: { type: String, required: true, unique: true, lowercase: true, trim: true, index: true },
  phone: { type: String, required: true, trim: true, index: true },
  passwordHash: { type: String, required: true, select: false },
  role: { type: String, enum: ['renter', 'lister', 'admin'], default: 'lister', index: true },

  // Password reset
  passwordResetToken: { type: String, select: false },
  passwordResetExpires: { type: Date, select: false },

  // Login lockout
  failedLoginAttempts: { type: Number, default: 0, select: false },
  lockedUntil: { type: Date, select: false },

  // Admin 2FA
  totpSecret: { type: String, select: false },
  totpEnabled: { type: Boolean, default: false },

  // Account state
  isSuspended: { type: Boolean, default: false },
  suspendedReason: String,

  // Consent (NDPR)
  consentedToTermsAt: Date,
  consentedToPrivacyAt: Date
}, { timestamps: true });

userSchema.methods.toSafeJSON = function () {
  return {
    id: this._id, name: this.name, email: this.email, phone: this.phone,
    role: this.role, totpEnabled: this.totpEnabled, createdAt: this.createdAt
  };
};

userSchema.statics.generateToken = () => crypto.randomBytes(32).toString('hex');
userSchema.statics.hashToken = (t) => crypto.createHash('sha256').update(t).digest('hex');

module.exports = mongoose.model('User', userSchema);
