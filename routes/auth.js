const router = require('express').Router();
const c = require('../controllers/authController');
const { authenticate } = require('../middleware/auth');

router.post('/register', c.register);
router.post('/login', c.login);
router.post('/refresh', c.refresh);
router.post('/forgot-password', c.forgotPassword);
router.post('/reset-password', c.resetPassword);
router.post('/logout', c.logout);
router.get('/me', authenticate, c.me);
router.post('/2fa/setup', authenticate, c.setup2FA);
router.post('/2fa/enable', authenticate, c.enable2FA);

module.exports = router;
