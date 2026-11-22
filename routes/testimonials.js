const router = require('express').Router();
const c = require('../controllers/testimonialController');
const { authenticate, requireRole } = require('../middleware/auth');

router.get('/', c.listPublic);
router.post('/', c.create); // Allow anonymous submissions
router.get('/admin', authenticate, requireRole('admin'), c.listAdmin);
router.patch('/:id/status', authenticate, requireRole('admin'), c.updateStatus);

module.exports = router;
