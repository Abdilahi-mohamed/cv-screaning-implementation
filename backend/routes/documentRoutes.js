const express = require('express');
const { serveCandidateDocument } = require('../controllers/documentController');
const { requireHR, requirePermission } = require('../middleware/authMiddleware');

const router = express.Router();

router.get('/:fileName', requireHR, requirePermission('candidates:manage'), serveCandidateDocument);

module.exports = router;
