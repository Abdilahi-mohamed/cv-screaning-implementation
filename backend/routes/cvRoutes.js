const express = require('express');
const upload = require('../middleware/uploadMiddleware');
const { uploadCV, uploadManagerCVs, listFilteredCandidates, getCandidateById, getCandidatesForJob, deleteCandidate } = require('../controllers/cvController');

const router = express.Router();

router.post('/:jobId/apply', upload.application.any(), uploadCV);
router.post('/:jobId/upload', upload.array('cv_files', 20), uploadManagerCVs);
router.get('/:jobId/candidates', getCandidatesForJob);
router.delete('/:jobId/candidates/:candidateId', deleteCandidate);
router.get('/:jobId/candidates/filtered', listFilteredCandidates);
router.get('/candidate/:id', getCandidateById);

module.exports = router;
