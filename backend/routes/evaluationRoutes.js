const express = require('express');
const { evaluateCV, analyzeJobCVs, matchJobCVs, generateJobQuestions, generateCandidateQuestions } = require('../controllers/evaluationController');
const { getCandidateChat, postCandidateChat, getCandidateChats, createCandidateChat, getCandidateChatById, deleteCandidateChat, postCandidateChatMessage } = require('../controllers/recruitmentChatController');

const router = express.Router();

router.post('/', evaluateCV);
router.post('/:jobId/analyze', analyzeJobCVs);
router.post('/:jobId/match', matchJobCVs);
router.post('/:jobId/questions', generateJobQuestions);
router.post('/:jobId/candidates/:candidateId/questions', generateCandidateQuestions);
router.get('/:jobId/candidates/:candidateId/chats', getCandidateChats);
router.post('/:jobId/candidates/:candidateId/chats', createCandidateChat);
router.get('/:jobId/candidates/:candidateId/chats/:conversationId', getCandidateChatById);
router.delete('/:jobId/candidates/:candidateId/chats/:conversationId', deleteCandidateChat);
router.post('/:jobId/candidates/:candidateId/chats/:conversationId', postCandidateChatMessage);
router.get('/:jobId/candidates/:candidateId/chat', getCandidateChat);
router.post('/:jobId/candidates/:candidateId/chat', postCandidateChat);

module.exports = router;
