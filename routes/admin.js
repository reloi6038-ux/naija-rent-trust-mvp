const router = require('express').Router();
const admin = require('../controllers/adminController');
const prop = require('../controllers/propertyController');
const { authenticate, requireRole } = require('../middleware/auth');

router.use(authenticate, requireRole('admin'));

router.get('/stats', admin.stats);
router.get('/properties', admin.listProperties);
router.get('/properties/pending', admin.listPending);
router.get('/recent-activity', admin.recentActivity);
router.patch('/properties/:id/approve', prop.adminApprove);
router.patch('/properties/:id/reject', prop.adminReject);
router.patch('/properties/:id/unpublish', prop.adminUnpublish);
router.patch('/properties/:id/restore', prop.adminRestore);
router.delete('/properties/:id', prop.adminDelete);

module.exports = router;


