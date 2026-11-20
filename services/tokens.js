const jwt = require('jsonwebtoken');

exports.signAccess = (user) => jwt.sign(
  { id: user._id, role: user.role, typ: 'access' },
  process.env.JWT_SECRET,
  { expiresIn: process.env.JWT_EXPIRES_IN || '15m' }
);

exports.signRefresh = (user) => jwt.sign(
  { id: user._id, typ: 'refresh' },
  process.env.JWT_REFRESH_SECRET,
  { expiresIn: process.env.JWT_REFRESH_EXPIRES_IN || '30d' }
);

exports.verifyAccess = (t) => jwt.verify(t, process.env.JWT_SECRET);
exports.verifyRefresh = (t) => jwt.verify(t, process.env.JWT_REFRESH_SECRET);
