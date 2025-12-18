// server/src/websocket.js (CRITICAL FIX - User Room Management)
const socketIo = require('socket.io');

let io;

const initializeSocket = (server) => {
    io = socketIo(server, {
        cors: {
            origin: process.env.CLIENT_URL || "http://localhost:5173",
            methods: ["GET", "POST"],
            credentials: true
        }
    });

    // CRITICAL: Track user-to-socket mapping for notifications
    const userSockets = new Map(); // userId -> Set of socketIds

    io.on('connection', (socket) => {
        console.log(`✅ Socket connected: ${socket.id}`);

        // CRITICAL: User joins their personal room for notifications
        socket.on('authenticate', (userId) => {
            if (!userId) return;
            
            console.log(`🔐 User ${userId} authenticated with socket ${socket.id}`);
            
            // Join user's personal room (for targeted notifications)
            socket.join(userId.toString());
            
            // Track multiple sockets per user (multiple tabs/devices)
            if (!userSockets.has(userId.toString())) {
                userSockets.set(userId.toString(), new Set());
            }
            userSockets.get(userId.toString()).add(socket.id);
            
            console.log(`👤 User ${userId} now has ${userSockets.get(userId.toString()).size} active connection(s)`);
        });

        // Join specific chat room
        socket.on('joinChat', (chatId) => {
            socket.join(chatId);
            console.log(`💬 Socket ${socket.id} joined chat: ${chatId}`);
        });

        // Leave chat room
        socket.on('leaveChat', (chatId) => {
            socket.leave(chatId);
            console.log(`👋 Socket ${socket.id} left chat: ${chatId}`);
        });

        // Handle chat messages
        socket.on('sendMessage', async (messageData) => {
            try {
                // Emit to all users in the chat room
                io.to(messageData.chatId).emit('receiveMessage', messageData);
            } catch (error) {
                console.error('Error sending message:', error);
            }
        });

        // Delete message for self (non-persistent)
        socket.on('deleteMessageForSelf', (messageId) => {
            socket.emit('messageDeleted', { messageId });
        });

        // Handle disconnection
        socket.on('disconnect', () => {
            console.log(`❌ Socket disconnected: ${socket.id}`);
            
            // Clean up user socket tracking
            userSockets.forEach((sockets, userId) => {
                sockets.delete(socket.id);
                if (sockets.size === 0) {
                    userSockets.delete(userId);
                }
            });
        });
    });

    return io;
};

const getIo = () => {
    if (!io) {
        throw new Error('Socket.io not initialized! Call initializeSocket first.');
    }
    return io;
};

module.exports = { initializeSocket, getIo };