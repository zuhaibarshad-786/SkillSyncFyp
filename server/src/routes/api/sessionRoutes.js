// server/src/routes/api/sessionRoutes.js
const express = require('express');
const {
    getSessionHistory,
    getUpcomingSessions,
    markAsCompleted,
    submitFeedback,
    getActiveSessionForChat,
    cancelSession,
    verifySession,        // ← NEW: used by VideoCallPage before joining
} = require('../../controllers/sessionController');
const { protect } = require('../../middleware/auth');

const router = express.Router();

// ── Views ─────────────────────────────────────────────────────────────────────
router.get('/history',  protect, getSessionHistory);
router.get('/upcoming', protect, getUpcomingSessions);

// ── Lifecycle ─────────────────────────────────────────────────────────────────
router.get('/active/:chatId',       protect, getActiveSessionForChat);
router.get('/verify/:sessionId',    protect, verifySession);        // ← NEW
router.post('/complete/:sessionId', protect, markAsCompleted);
router.post('/feedback/:sessionId', protect, submitFeedback);
router.post('/cancel/:sessionId',   protect, cancelSession);

module.exports = router;