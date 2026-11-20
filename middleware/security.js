const helmet = require('helmet');
const cors = require('cors');
const rateLimit = require('express-rate-limit');
const mongoSanitize = require('@exortek/express-mongo-sanitize');
const compression = require('compression');
const { CORS_ORIGIN } = require('../config/env');

// Read limits from env with sane defaults
const API_MAX       = Number(process.env.RATE_LIMIT_API_MAX || 300);
const AUTH_MAX      = Number(process.env.RATE_LIMIT_AUTH_MAX || 20);
const WRITE_MAX     = Number(process.env.RATE_LIMIT_WRITE_MAX || 30);
const WINDOW_MS     = Number(process.env.RATE_LIMIT_WINDOW_MINUTES || 15) * 60 * 1000;

const apiLimiter = rateLimit({
  windowMs: WINDOW_MS,
  max: API_MAX,
  standardHeaders: true,
  legacyHeaders: false,
  message: { success: false, message: 'Too many requests, please try again later.' }
});

const authLimiter = rateLimit({
  windowMs: WINDOW_MS,
  max: AUTH_MAX,
  standardHeaders: true,
  legacyHeaders: false,
  message: { success: false, message: 'Too many auth attempts. Try again later.' }
});

const writeLimiter = rateLimit({
  windowMs: 60 * 1000,
  max: WRITE_MAX,
  message: { success: false, message: 'Too many requests. Slow down.' }
});

module.exports = (app) => {
  app.use(helmet({ contentSecurityPolicy: false, crossOriginResourcePolicy: { policy: 'cross-origin' } }));
  app.use(cors({ origin: CORS_ORIGIN, credentials: true }));
  app.use(compression());
  app.use('/api', apiLimiter);
  app.use('/api/auth', authLimiter);
  app.use('/api/enquiries', writeLimiter);
  app.use('/api/reports', writeLimiter);
  app.use(mongoSanitize());
};
