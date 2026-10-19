const express = require('express');
const { getDashboardStats, getRanking } = require('../controllers/dashboardController');

const router = express.Router();

router.get('/:jobId/dashboard', getDashboardStats);
router.get('/:jobId/ranking', getRanking);

module.exports = router;
