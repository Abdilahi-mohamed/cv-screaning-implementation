const express = require('express');
const { currentHR, loginAny, logoutHR, registerCompany } = require('../controllers/authController');
const { requireHR, requireTrustedOrigin } = require('../middleware/authMiddleware');

const router = express.Router();

router.post('/login', requireTrustedOrigin, loginAny);
router.post('/register-company', requireTrustedOrigin, registerCompany);
router.get('/me', currentHR);
router.post('/logout', requireTrustedOrigin, logoutHR);
router.get('/session', requireHR, (req, res) => res.json({ active: true }));

module.exports = router;
