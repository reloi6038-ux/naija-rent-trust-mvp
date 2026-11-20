const router = require('express').Router();
const c = require('../controllers/userController');

router.get('/:id/public', c.publicProfile);
router.get('/:id/properties', c.publicListings);

module.exports = router;
