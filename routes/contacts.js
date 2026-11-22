const router = require('express').Router();
const c = require('../controllers/contactController');
const { authenticate, requireRole } = require('../middleware/auth');

router.post('/', c.submit);
router.get('/', authenticate, requireRole('admin'), c.getAll);
router.patch('/:id/read', authenticate, requireRole('admin'), c.markRead);

module.exports = router;
