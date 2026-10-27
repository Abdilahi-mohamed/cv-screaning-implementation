const express = require('express');
const {
  createCompany,
  deleteCompany,
  getDashboard,
  getSettings,
  listCompanies,
  updateCompany,
  updateHrUser,
  updateSettings,
} = require('../controllers/ownerController');
const { currentOwner, logoutOwner, ownerSetupStatus, setupOwner } = require('../controllers/authController');
const { requireOwner, requireTrustedOrigin } = require('../middleware/authMiddleware');

const router = express.Router();

router.get('/auth/me', currentOwner);
router.post('/auth/logout', requireTrustedOrigin, logoutOwner);
router.get('/auth/setup-status', ownerSetupStatus);
router.post('/auth/setup', requireTrustedOrigin, setupOwner);
router.use(requireOwner);
router.get('/dashboard', getDashboard);
router.get('/settings', getSettings);
router.put('/settings', updateSettings);
router.get('/companies', listCompanies);
router.post('/companies', createCompany);
router.patch('/companies/:companyId', updateCompany);
router.patch('/companies/:companyId/hr-user', updateHrUser);
router.delete('/companies/:companyId', deleteCompany);

module.exports = router;
