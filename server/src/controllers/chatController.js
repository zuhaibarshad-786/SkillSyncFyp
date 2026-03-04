// server/src/controllers/chatController.js
const asyncHandler = require('express-async-handler');
const User = require('../models/User');
const Chat = require('../models/Chat');
const Message = require('../models/Message');

const generateChatId = (id1, id2) => {
    const sortedIds = [id1.toString(), id2.toString()].sort();
    return `${sortedIds[0]}_${sortedIds[1]}`;
};

// @desc    Initiate a conversation request
// @route   POST /api/chat/connect/:partnerId
const sendConnectionRequest = asyncHandler(async (req, res) => {
    console.log('\n====== sendConnectionRequest START ======');
    console.log('req.user:', req.user);
    console.log('req.params.partnerId:', req.params.partnerId);

    if (!req.user || !req.user._id) {
        res.status(401);
        throw new Error('Not authorized - user not found on request.');
    }

    const senderId = req.user._id;
    const partnerId = req.params.partnerId;

    if (!partnerId || partnerId === 'undefined') {
        res.status(400);
        throw new Error('Partner ID is required.');
    }

    const chatId = generateChatId(senderId, partnerId);
    console.log('Generated chatId:', chatId);

    let chat;
    try {
        chat = await Chat.findOne({ chatId });
        console.log('Existing chat:', chat ? 'Found (status: ' + chat.status + ')' : 'Not found');
    } catch (dbErr) {
        console.error('DB error during findOne:', dbErr.message, dbErr.code);
        res.status(500);
        throw new Error('Database error: ' + dbErr.message);
    }

    if (chat) {
        if (chat.status === 'active') {
            return res.status(200).json({ chatId, status: 'active', message: 'Chat is already active.' });
        }
        if (chat.status === 'pending' && chat.requester.toString() !== senderId.toString()) {
            return res.status(200).json({ chatId, status: 'pending', message: 'Request already sent by partner.' });
        }
        try {
            chat.status = 'pending';
            chat.requester = senderId;
            chat.deletedBy = [];
            await chat.save();
            return res.status(200).json({ chatId, status: 'pending', message: 'Connection request re-sent.' });
        } catch (saveErr) {
            console.error('Error saving updated chat:', saveErr.message, saveErr.code);
            res.status(500);
            throw new Error('Database error saving chat: ' + saveErr.message);
        }
    }

    try {
        chat = await Chat.create({
            chatId,
            participants: [senderId, partnerId],
            status: 'pending',
            requester: senderId,
            lastMessageAt: new Date(),
        });
        console.log('New chat created:', chat._id);
    } catch (createErr) {
        console.error('Error creating chat:', createErr.message);
        console.error('Error code:', createErr.code);
        console.error('keyValue:', createErr.keyValue);
        res.status(500);
        throw new Error('Database error creating chat: ' + createErr.message);
    }

    console.log('====== sendConnectionRequest END ======\n');
    res.status(201).json({ chatId, status: 'pending', message: 'Connection request sent.' });
});


// @desc    Accept a pending connection request
// @route   POST /api/chat/accept/:chatId
const acceptConnection = asyncHandler(async (req, res) => {
    const chatId = req.params.chatId;
    const chat = await Chat.findOne({ chatId });

    if (!chat || chat.status !== 'pending') {
        res.status(404);
        throw new Error('Chat not found or already active.');
    }

    chat.status = 'active';
    await chat.save();
    res.json({ chatId, status: 'active', message: 'Connection accepted!' });
});

// @desc    Reject a pending connection request
// @route   POST /api/chat/reject/:chatId
const rejectConnection = asyncHandler(async (req, res) => {
    const chatId = req.params.chatId;
    const chat = await Chat.findOne({ chatId });

    if (!chat) {
        res.status(404);
        throw new Error('Chat not found.');
    }

    chat.status = 'rejected';
    await chat.save();
    res.json({ message: 'Connection request rejected.', chatId });
});


// @desc    Get all chats for the current user
// @route   GET /api/chat/conversations
const getConversations = asyncHandler(async (req, res) => {
    const currentUserId = req.user._id;

    const chats = await Chat.find({
        participants: currentUserId,
        deletedBy: { $ne: currentUserId },
    }).sort({ lastMessageAt: -1 });

    const userChats = await Promise.all(chats.map(async (chat) => {
        const partnerId = chat.participants.find(id => id.toString() !== currentUserId.toString());
        const partner = await User.findById(partnerId).select('name').lean();

        const lastMsg = await Message.findOne({
            chat: chat._id,
            deletedForEveryone: false,
            deletedFor: { $ne: currentUserId },
        }).sort({ createdAt: -1 }).lean();

        return {
            chatId: chat.chatId,
            partnerName: partner ? partner.name : 'Unknown User',
            partnerId: partnerId,
            status: chat.status,
            requesterId: chat.requester,
            isRequesting: chat.status === 'pending' && chat.requester.toString() !== currentUserId.toString(),
            lastMessage: lastMsg
                ? lastMsg.content
                : (chat.status === 'pending' ? 'Pending request' : 'Start a conversation'),
            lastMessageAt: chat.lastMessageAt,
            unread: 0,
        };
    }));

    res.json(userChats);
});

// @desc    Get messages for a chat
// @route   GET /api/chat/messages/:chatId
const getMessages = asyncHandler(async (req, res) => {
    const { chatId } = req.params;
    const currentUserId = req.user._id;

    const chat = await Chat.findOne({ chatId });
    if (!chat) return res.json([]);

    const messages = await Message.find({
        chat: chat._id,
        deletedForEveryone: false,
        deletedFor: { $ne: currentUserId },
    })
    .populate('sender', 'name')
    .sort({ createdAt: 1 })
    .lean();

    res.json(messages);
});

// @desc    Delete message for self only
// @route   DELETE /api/chat/message/:messageId/delete-for-me
const deleteMessageForMe = asyncHandler(async (req, res) => {
    const { messageId } = req.params;
    const currentUserId = req.user._id;

    const message = await Message.findById(messageId);
    if (!message) {
        res.status(404);
        throw new Error('Message not found.');
    }

    if (!message.deletedFor.includes(currentUserId)) {
        message.deletedFor.push(currentUserId);
        await message.save();
    }

    res.json({ message: 'Message deleted for you.' });
});

// @desc    Delete message for everyone
// @route   DELETE /api/chat/message/:messageId/delete-for-everyone
const deleteMessageForEveryone = asyncHandler(async (req, res) => {
    const { messageId } = req.params;
    const currentUserId = req.user._id;

    const message = await Message.findById(messageId);
    if (!message) {
        res.status(404);
        throw new Error('Message not found.');
    }

    if (message.sender.toString() !== currentUserId.toString()) {
        res.status(403);
        throw new Error('Only the sender can delete for everyone.');
    }

    message.deletedForEveryone = true;
    message.content = 'This message was deleted.';
    await message.save();

    res.json({ message: 'Message deleted for everyone.', messageId });
});

// @desc    Soft delete chat for self
// @route   POST /api/chat/delete-for-self/:chatId
const deleteChatForSelf = asyncHandler(async (req, res) => {
    const { chatId } = req.params;
    const currentUserId = req.user._id;

    const chat = await Chat.findOne({ chatId });
    if (!chat) {
        res.status(404);
        throw new Error('Chat not found.');
    }

    if (!chat.deletedBy.includes(currentUserId)) {
        chat.deletedBy.push(currentUserId);
        await chat.save();
    }

    res.json({ message: 'Chat removed from your view.' });
});

// Socket: Save message to DB and broadcast
// KEY FIX: Jab naya message aaye, chat ko recipient ke liye
// deletedBy se hata do taake woh dobara dikh sake (WhatsApp behavior)
const saveAndBroadcastMessage = async (io, messageData) => {
    const { chatId, senderId, content } = messageData;

    try {
        const chat = await Chat.findOne({ chatId, status: 'active' });
        if (!chat) {
            console.warn('No active chat for chatId:', chatId);
            return;
        }

        // Auto-restore chat for all participants when new message arrives
        // Sirf recipient ke liye restore karo (sender ka apna delete waise bhi reset ho)
        if (chat.deletedBy && chat.deletedBy.length > 0) {
            chat.deletedBy = [];
        }

        const newMessage = await Message.create({
            chat: chat._id,
            sender: senderId,
            content,
        });

        chat.lastMessageAt = newMessage.createdAt;
        await chat.save();

        const populatedMsg = await Message.findById(newMessage._id).populate('sender', 'name');

        // Broadcast message to chat room
        io.to(chatId).emit('receiveMessage', {
            _id: populatedMsg._id,
            sender: populatedMsg.sender,
            content: populatedMsg.content,
            createdAt: populatedMsg.createdAt,
            chatId,
        });

        // Notify all participants to refresh conversation list
        // so chat reappears for anyone who had deleted it
        chat.participants.forEach(participantId => {
            io.to(participantId.toString()).emit('conversationUpdated', { chatId });
        });

    } catch (err) {
        console.error('saveAndBroadcastMessage error:', err);
    }
};

const scheduleSession = asyncHandler(async (req, res) => {
    res.status(201).json({ message: 'Session scheduling confirmed.' });
});

module.exports = {
    sendConnectionRequest,
    acceptConnection,
    rejectConnection,
    getConversations,
    getMessages,
    saveAndBroadcastMessage,
    deleteChatForSelf,
    deleteMessageForMe,
    deleteMessageForEveryone,
    scheduleSession,
};