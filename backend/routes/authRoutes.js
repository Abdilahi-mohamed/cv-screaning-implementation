const express = require('express');
const { currentHR, loginAny, logoutHR } = require('../controllers/authController');
const { requireHR, requireTrustedOrigin } = require('../middleware/authMiddleware');

const router = express.Router();

router.post('/login', requireTrustedOrigin, loginAny);
router.get('/me', currentHR);
router.post('/logout', requireTrustedOrigin, logoutHR);
router.get('/session', requireHR, (req, res) => res.json({ active: true }));

module.exports = router;
