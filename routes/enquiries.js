const router = require('express').Router();
const c = require('../controllers/enquiryController');
const { authenticate, requireRole } = require('../middleware/auth');

router.post('/', c.create);
router.get('/mine', authenticate, requireRole('lister'), c.myEnquiries);
router.patch('/:id/contacted', authenticate, requireRole('lister'), c.markContacted);

module.exports = router;
