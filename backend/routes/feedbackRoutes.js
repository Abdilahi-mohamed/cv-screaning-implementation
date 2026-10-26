const express = require('express');
const { saveFeedback } = require('../controllers/feedbackController');
const { requireHR, requireJobAccess, requirePermission } = require('../middleware/authMiddleware');

const router = express.Router();

router.post('/', requireHR, requirePermission('candidates:manage'), requireJobAccess('job_id'), saveFeedback);

module.exports = router;
