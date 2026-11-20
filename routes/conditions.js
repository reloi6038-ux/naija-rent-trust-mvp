const router = require('express').Router({ mergeParams: true });
const c = require('../controllers/conditionController');
const { authenticate } = require('../middleware/auth');
const rateLimit = require('express-rate-limit');

const conditionLimiter = rateLimit({
  windowMs: 60 * 60 * 1000,
  max: 5,
  message: { success: false, message: 'Too many condition reports. Slow down.' }
});

router.get('/checklist', c.getChecklist);
router.get('/summary', c.summary);

// Submission is public (renters are anonymous) but optional-auth
router.post('/', conditionLimiter, (req, res, next) => {
  if (!req.cookies?.token && !req.headers.authorization) return next();
  const { authenticate: a } = require('../middleware/auth');
  a(req, res, () => next());
}, c.submit);

module.exports = router;
