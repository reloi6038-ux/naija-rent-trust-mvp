const router = require('express').Router();
const c = require('../controllers/propertyController');
const { authenticate, requireRole } = require('../middleware/auth');
const upload = require('../middleware/upload');

router.get('/', c.listPublished);
router.get('/mine', authenticate, requireRole('lister'), c.myListings);

// GET /:id optionally authenticated
router.get('/:id', (req, res, next) => {
  const { authenticate: a } = require('../middleware/auth');
  if (!req.cookies?.token && !req.headers.authorization) return c.getById(req, res, next);
  a(req, res, () => c.getById(req, res, next));
});

router.post('/', authenticate, requireRole('lister'), upload.array('photos', 5), c.create);
router.patch('/:id', authenticate, requireRole('lister'), upload.array('photos', 5), c.updateOwn);
router.post('/:id/rented', authenticate, requireRole('lister'), c.markRented);

module.exports = router;
