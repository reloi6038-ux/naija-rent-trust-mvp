const { IS_PROD } = require('../config/env');

exports.setAuthCookie = (res, token) => {
  res.cookie('token', token, {
    httpOnly: true,
    sameSite: 'lax',
    secure: IS_PROD,
    maxAge: 7 * 24 * 60 * 60 * 1000
  });
};

exports.clearAuthCookie = (res) => res.clearCookie('token');
