// server/src/controllers/chatController.js (FIXED - Proper Export)
const asyncHandler = require('express-async-handler');
const User = require('../models/User'); 

// 📢 NON-PERSISTENT MOCK DATA STRUCTURES (Clears on server restart)
const mockChats = new Map(); // Key: chatId (e.g., 'u1_u2'), Value: { participants: [u1, u2], status: 'active/pending', messages: [] }

const generateChatId = (id1, id2) => {
    // Generates a unique, sorted ID to ensure consistency regardless of sender/receiver order
    const sortedIds = [id1.toString(), id2.toString()].sort();
    return `${sortedIds[0]}_${sortedIds[1]}`;
};

// @desc    Initiate a conversation request (FIXED LOGIC)
// @route   POST /api/chat/connect/:partnerId
// @access  Private
const sendConnectionRequest = asyncHandler(async (req, res) => {
    const senderId = req.user._id;
    const partnerId = req.params.partnerId;
    const chatId = generateChatId(senderId, partnerId);

    // 1. Check if chat already exists in memory
    if (mockChats.has(chatId)) {
        const chat = mockChats.get(chatId);
        if (chat.status === 'active') {
            return res.status(200).json({ chatId, status: 'active', message: 'Chat is already active. Redirecting...' });
        }
        if (chat.status === 'pending' && chat.requester !== senderId.toString()) {
            return res.status(200).json({ chatId, status: 'pending', message: 'Request already sent by partner.' });
        }
        
        // If it was rejected, we reset it to pending for a new request.
    }

    // 2. Create/Reset to PENDING chat
    mockChats.set(chatId, {
        chatId: chatId,
        participants: [senderId.toString(), partnerId],
        status: 'pending',
        requester: senderId.toString(),
        messages: [], // Reset messages for the new session
        lastMessageAt: new Date(),
    });

    res.status(201).json({ chatId, status: 'pending', message: 'Connection request sent.' });
});


// @desc    Accept a pending connection request
// @route   POST /api/chat/accept/:chatId
// @access  Private
const acceptConnection = asyncHandler(async (req, res) => {
    const chatId = req.params.chatId;
    const chat = mockChats.get(chatId);

    if (!chat || chat.status !== 'pending') {
        res.status(404);
        throw new Error('Chat not found or already active.');
    }
    
    chat.status = 'active';
    res.json({ chatId, status: 'active', message: 'Connection accepted!' });
});

// @desc    Reject a pending connection request
// @route   POST /api/chat/reject/:chatId
// @access  Private
const rejectConnection = asyncHandler(async (req, res) => {
    const chatId = req.params.chatId;
    
    if (mockChats.has(chatId)) {
        // Change status to rejected instead of immediate deletion
        mockChats.get(chatId).status = 'rejected';
        res.json({ message: 'Connection request rejected.', chatId });
    } else {
        res.status(404);
        throw new Error('Chat not found.');
    }
});


// @desc    Get all chats/conversations for the current user (SCALABILITY REMOVED)
// @route   GET /api/chat/conversations
// @access  Private
const getConversations = asyncHandler(async (req, res) => {
    const currentUserId = req.user._id.toString();
    const userChats = [];

    for (const [chatId, chat] of mockChats.entries()) {
        if (chat.participants.includes(currentUserId)) {
            // Find the partner and fetch their name (requires DB call, kept for functionality)
            const partnerId = chat.participants.find(id => id !== currentUserId);
            const partner = await User.findById(partnerId).select('name').lean(); 

            userChats.push({
                chatId: chatId,
                partnerName: partner ? partner.name : 'Unknown User',
                partnerId: partnerId,
                status: chat.status,
                requesterId: chat.requester,
                isRequesting: chat.status === 'pending' && chat.requester !== currentUserId,
                lastMessage: chat.messages.length > 0 ? chat.messages.slice(-1)[0].content : (chat.status === 'pending' ? 'Pending request' : 'Start a conversation'),
                unread: 0, 
            });
        }
    }

    res.json(userChats.sort((a, b) => new Date(b.lastMessageAt) - new Date(a.lastMessageAt)));
});

// @desc    Get all messages for a specific chat (NON-PERSISTENT)
// @route   GET /api/chat/messages/:chatId
// @access  Private
const getMessages = asyncHandler(async (req, res) => {
    const chatId = req.params.chatId;
    const chat = mockChats.get(chatId);
    
    // Return messages from in-memory mock data
    res.json(chat ? chat.messages : []);
});

// @desc    Handle incoming messages from socket and save (NON-PERSISTENT)
const saveAndBroadcastMessage = (io, messageData) => {
    const { chatId, senderId, content } = messageData;
    const chat = mockChats.get(chatId);

    if (chat && chat.status === 'active') {
        const newMessage = {
            sender: senderId,
            content: content,
            createdAt: new Date(),
            _id: Date.now() + Math.random(), // Mock ID
        };
        
        // 📢 Save to in-memory mock array (will be lost on restart/refresh)
        chat.messages.push(newMessage);
        chat.lastMessageAt = newMessage.createdAt;

        // Broadcast to chat room
        io.to(chatId).emit('receiveMessage', {
            sender: newMessage.sender,
            content: newMessage.content,
            createdAt: newMessage.createdAt,
            _id: newMessage._id,
        });
    }
};

// @desc    Delete chat history (REMOVED: Only local view delete is supported now)
const deleteChatForSelf = asyncHandler(async (req, res) => {
    const chatId = req.params.chatId;
    // Since history is non-persistent (in-memory), we just confirm success.
    // The frontend must handle removing it from its local list.
    res.json({ message: 'Chat history deleted from view (non-persistent mode).' });
});

// @desc    Scheduling is handled by frontend prompts, kept as placeholder
const scheduleSession = asyncHandler(async (req, res) => {
    // ... (logic remains the same)
    res.status(201).json({ message: 'Session scheduling confirmed (non-persistent).' });
});

// EXPORT ALL FUNCTIONS AND mockChats
module.exports = {
    sendConnectionRequest,
    acceptConnection,
    rejectConnection,
    getConversations,
    getMessages,
    saveAndBroadcastMessage,
    deleteChatForSelf,
    scheduleSession,
    mockChats // Export the Map itself
};