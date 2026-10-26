const express = require('express');
const { getDashboardStats, getRanking } = require('../controllers/dashboardController');
const { requireHR, requireJobAccess, requirePermission } = require('../middleware/authMiddleware');

const router = express.Router();

router.get('/:jobId/dashboard', requireHR, requirePermission('candidates:manage'), requireJobAccess(), getDashboardStats);
router.get('/:jobId/ranking', requireHR, requirePermission('candidates:manage'), requireJobAccess(), getRanking);

module.exports = router;
