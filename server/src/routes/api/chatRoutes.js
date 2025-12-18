// server/src/routes/api/chatRoutes.js (MODIFIED)
const express = require('express');
const { 
    getConversations, 
    getMessages, 
    sendConnectionRequest, 
    acceptConnection,      
    rejectConnection,      
    deleteChatForSelf  
} = require('../../controllers/chatController');
// 🆕 Import the schedule controller
const { scheduleSession } = require('../../controllers/sessionController'); 
const { protect } = require('../../middleware/auth'); 

const router = express.Router();

// --- Connection Request/Initiation ---
router.post('/connect/:partnerId', protect, sendConnectionRequest);

// --- Request Management (Accept/Reject) ---
// NOTE: Connection is accepted here, chat status becomes 'active'.
router.post('/accept/:chatId', protect, acceptConnection); 
router.post('/reject/:chatId', protect, rejectConnection);

// --- Chat and Message History ---
router.get('/conversations', protect, getConversations); 
router.get('/messages/:chatId', protect, getMessages); 

// --- Chat Deletion ---
router.post('/delete-for-self/:chatId', protect, deleteChatForSelf); 

// --- Scheduling (Moved to the new Session Controller) ---
// 🚨 Keep the schedule endpoint in chat routes for user convenience (proposing a session from chat)
router.post('/schedule', protect, scheduleSession); // 🚨 Uses the new sessionController

module.exports = router;