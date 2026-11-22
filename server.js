if (process.env.SENTRY_DSN) {
  try { require('@sentry/node').init({ dsn: process.env.SENTRY_DSN, tracesSampleRate: 0.1 }); } catch {}
}

const path = require('path');
const express = require('express');
const cookieParser = require('cookie-parser');
const pinoHttp = require('pino-http');

const { PORT, NODE_ENV, IS_PROD } = require('./config/env');
const connectDB = require('./config/db');
const security = require('./middleware/security');
const { notFound, errorHandler } = require('./middleware/errorHandler');
const logger = require('./services/logger');

const app = express();

app.use(pinoHttp({ logger }));
app.use(express.json({ limit: '5mb' }));
app.use(express.urlencoded({ extended: true, limit: '5mb' }));
app.use(cookieParser());
security(app);

app.use('/uploads', express.static(path.join(__dirname, 'uploads'), { maxAge: '7d' }));
app.use(express.static(path.join(__dirname, 'public')));

app.use('/api/health', require('./routes/health'));
app.use('/api/auth', require('./routes/auth'));
app.use('/api/properties', require('./routes/properties'));
app.use('/api/enquiries', require('./routes/enquiries'));
app.use('/api/reports', require('./routes/reports'));
app.use('/api/admin', require('./routes/admin'));
app.use('/api/contacts', require('./routes/contacts'));
app.use('/api/testimonials', require('./routes/testimonials'));
app.use('/api/search', require('./routes/search'));
app.use('/api/users', require('./routes/users'));
app.use('/api/properties/:id/conditions', require('./routes/conditions'));

app.get('/pages/:page', (req, res, next) => {
  const file = path.join(__dirname, 'public', 'pages', `${req.params.page}.html`);
  res.sendFile(file, (err) => { if (err) next(); });
});

app.get('/', (req, res) => res.sendFile(path.join(__dirname, 'public', 'index.html')));

app.use(notFound);
app.use(errorHandler);

(async () => {
  try {
    await connectDB();
    app.listen(PORT, () => logger.info(`Server on http://localhost:${PORT} [${NODE_ENV}]`));
  } catch (err) {
    logger.error({ err: err.message }, 'Startup failed');
    process.exit(1);
  }
})();

module.exports = app;





