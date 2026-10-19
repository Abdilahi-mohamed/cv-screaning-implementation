const express = require('express');
const { createJob, updateJob, getJobs, getJobById, updateJobImage, updateBrandLogo } = require('../controllers/jobController');
const { validateJobPayload } = require('../middleware/jobValidation');
const uploadImage = require('../middleware/imageUploadMiddleware');

const router = express.Router();

router.get('/', getJobs);
router.get('/:id', getJobById);
router.post('/:id/image', uploadImage.single('image'), updateJobImage);
router.post('/:id/logo', uploadImage.single('image'), updateBrandLogo);
router.put('/:id', validateJobPayload, updateJob);
router.post('/', validateJobPayload, createJob);

module.exports = router;
