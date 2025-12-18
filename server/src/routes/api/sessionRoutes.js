// server/src/routes/api/sessionRoutes.js (FINALIZED)
const express = require('express');
const { 
    getSessionHistory, 
    getUpcomingSessions, 
    markAsCompleted, 
    submitFeedback,
    getActiveSessionForChat,
    cancelSession
} = require('../../controllers/sessionController');
const { protect } = require('../../middleware/auth'); 

const router = express.Router();

// --- Scheduling Views ---
router.get('/history', protect, getSessionHistory); // Fixes 404 for /sessions/history
router.get('/upcoming', protect, getUpcomingSessions); 

// --- Lifecycle Management ---
// 🆕 FIXES 404 for /sessions/active/:chatId
router.get('/active/:chatId', protect, getActiveSessionForChat); 
router.post('/complete/:sessionId', protect, markAsCompleted);
router.post('/feedback/:sessionId', protect, submitFeedback); 
router.post('/cancel/:sessionId', protect, cancelSession); 

module.exports = router;