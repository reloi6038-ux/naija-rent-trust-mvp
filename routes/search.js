const router = require('express').Router();
const c = require('../controllers/searchController');

router.get('/advanced', c.advanced);
router.get('/suggestions', c.suggestions);

module.exports = router;
