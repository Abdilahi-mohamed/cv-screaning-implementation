const express = require('express');
const { evaluateCV, analyzeJobCVs, matchJobCVs, generateJobQuestions, generateCandidateQuestions } = require('../controllers/evaluationController');
const { getCandidateChat, postCandidateChat, getCandidateChats, createCandidateChat, getCandidateChatById, deleteCandidateChat, postCandidateChatMessage } = require('../controllers/recruitmentChatController');
const { requireHR, requireJobAccess, requirePermission } = require('../middleware/authMiddleware');

const router = express.Router();

router.use(requireHR, requirePermission('candidates:manage'));
router.post('/', requireJobAccess(), evaluateCV);
router.post('/:jobId/analyze', requireJobAccess(), analyzeJobCVs);
router.post('/:jobId/match', requireJobAccess(), matchJobCVs);
router.post('/:jobId/questions', requireJobAccess(), generateJobQuestions);
router.post('/:jobId/candidates/:candidateId/questions', requireJobAccess(), generateCandidateQuestions);
router.get('/:jobId/candidates/:candidateId/chats', requireJobAccess(), getCandidateChats);
router.post('/:jobId/candidates/:candidateId/chats', requireJobAccess(), createCandidateChat);
router.get('/:jobId/candidates/:candidateId/chats/:conversationId', requireJobAccess(), getCandidateChatById);
router.delete('/:jobId/candidates/:candidateId/chats/:conversationId', requireJobAccess(), deleteCandidateChat);
router.post('/:jobId/candidates/:candidateId/chats/:conversationId', requireJobAccess(), postCandidateChatMessage);
router.get('/:jobId/candidates/:candidateId/chat', requireJobAccess(), getCandidateChat);
router.post('/:jobId/candidates/:candidateId/chat', requireJobAccess(), postCandidateChat);

module.exports = router;
