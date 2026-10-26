const express = require('express');
const upload = require('../middleware/uploadMiddleware');
const { uploadCV, uploadManagerCVs, listFilteredCandidates, getCandidateById, getCandidatesForJob, deleteCandidate } = require('../controllers/cvController');
const { requireCandidateAccess, requireHR, requireJobAccess, requirePermission } = require('../middleware/authMiddleware');

const router = express.Router();

router.post('/:jobId/apply', upload.application.any(), uploadCV);
router.post('/:jobId/upload', requireHR, requirePermission('candidates:manage'), requireJobAccess(), upload.array('cv_files', 20), uploadManagerCVs);
router.get('/:jobId/candidates', requireHR, requirePermission('candidates:manage'), requireJobAccess(), getCandidatesForJob);
router.delete('/:jobId/candidates/:candidateId', requireHR, requirePermission('candidates:manage'), requireJobAccess(), deleteCandidate);
router.get('/:jobId/candidates/filtered', requireHR, requirePermission('candidates:manage'), requireJobAccess(), listFilteredCandidates);
router.get('/candidate/:id', requireHR, requirePermission('candidates:manage'), requireCandidateAccess(), getCandidateById);

module.exports = router;
