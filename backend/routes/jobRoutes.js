const express = require('express');
const { createJob, updateJob, getJobs, getJobById, updateJobImage, updateBrandLogo } = require('../controllers/jobController');
const { validateJobPayload } = require('../middleware/jobValidation');
const uploadImage = require('../middleware/imageUploadMiddleware');
const { optionalAuth, requireAnyPermission, requireHR, requireJobAccess, requirePermission } = require('../middleware/authMiddleware');

const router = express.Router();

router.get('/', requireHR, requireAnyPermission('jobs:manage', 'candidates:manage'), getJobs);
router.get('/:id', optionalAuth, getJobById);
router.post('/:id/image', requireHR, requirePermission('jobs:manage'), requireJobAccess('id'), uploadImage.single('image'), updateJobImage);
router.post('/:id/logo', requireHR, requirePermission('jobs:manage'), requireJobAccess('id'), uploadImage.single('image'), updateBrandLogo);
router.put('/:id', requireHR, requirePermission('jobs:manage'), requireJobAccess('id'), validateJobPayload, updateJob);
router.post('/', requireHR, requirePermission('jobs:manage'), validateJobPayload, createJob);

module.exports = router;
