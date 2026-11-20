const { IS_PROD } = require('../config/env');

function notFound(req, res) {
  res.status(404).json({ success: false, message: 'Route not found' });
}

function errorHandler(err, req, res, next) {
  const status = err.statusCode || err.status || 500;
  const message = IS_PROD && status === 500 ? 'Internal server error' : (err.message || 'Something went wrong');
  if (!IS_PROD) console.error('Error:', err);
  res.status(status).json({
    success: false,
    message,
    ...(IS_PROD ? {} : { stack: err.stack })
  });
}

module.exports = { notFound, errorHandler };
