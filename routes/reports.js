const router = require('express').Router();
const c = require('../controllers/reportController');
const { authenticate, requireRole } = require('../middleware/auth');

router.post('/', c.create);
router.get('/', authenticate, requireRole('admin'), c.listAdmin);
router.patch('/:id', authenticate, requireRole('admin'), c.update);

module.exports = router;
