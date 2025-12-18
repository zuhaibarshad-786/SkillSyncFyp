// server/src/routes/api/aiRoutes.js (MODIFIED)

const express = require('express');
const { getRecommendations } = require('../../controllers/aiController'); 
const { handleAIChat } = require('../../controllers/aiChatbotController'); // 👈 NEW IMPORT
const { protect } = require('../../middleware/auth'); 

const router = express.Router();

// GET /api/ai/recommendations (Structured, used by MatchingPage)
router.get('/recommendations', protect, getRecommendations); 

// POST /api/ai/chat (Interactive Chatbot)
router.post('/chat', protect, handleAIChat); // 👈 NEW ROUTE

module.exports = router;