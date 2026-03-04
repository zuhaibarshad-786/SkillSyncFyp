// server/src/routes/api/chatRoutes.js
const express = require('express');
const {
    getConversations,
    getMessages,
    sendConnectionRequest,
    acceptConnection,
    rejectConnection,
    deleteChatForSelf,
    deleteMessageForMe,
    deleteMessageForEveryone,
} = require('../../controllers/chatController');

const { scheduleSession } = require('../../controllers/sessionController');
const { protect } = require('../../middleware/auth');

const router = express.Router();

// --- Connection Request / Initiation ---
router.post('/connect/:partnerId', protect, sendConnectionRequest);

// --- Request Management (Accept / Reject) ---
router.post('/accept/:chatId', protect, acceptConnection);
router.post('/reject/:chatId', protect, rejectConnection);

// --- Chat and Message History ---
router.get('/conversations', protect, getConversations);
router.get('/messages/:chatId', protect, getMessages);

// --- Chat Deletion (Soft Delete for Self) ---
router.post('/delete-for-self/:chatId', protect, deleteChatForSelf);

// --- Message Deletion ---
router.delete('/message/:messageId/delete-for-me', protect, deleteMessageForMe);
router.delete('/message/:messageId/delete-for-everyone', protect, deleteMessageForEveryone);

// --- Scheduling (uses sessionController) ---
router.post('/schedule', protect, scheduleSession);

module.exports = router;