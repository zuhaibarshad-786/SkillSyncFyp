// server/src/websocket.js (PERSISTENT + DELETE FOR EVERYONE BROADCAST)
const socketIo = require('socket.io');
const { saveAndBroadcastMessage } = require('./controllers/chatController');

let io;

const initializeSocket = (server) => {
    io = socketIo(server, {
        cors: {
            origin: process.env.CLIENT_URL || "http://localhost:5173",
            methods: ["GET", "POST"],
            credentials: true,
        }
    });

    io.on('connection', (socket) => {
        console.log(`✅ Socket connected: ${socket.id}`);

        // ---------------- AUTH ----------------
        socket.on('authenticate', (userId) => {
            if (!userId) return;
            socket.join(userId.toString());
            console.log(`🔐 User ${userId} authenticated`);
        });

        // ---------------- CHAT ----------------
        socket.on('joinChat', (chatId) => {
            socket.join(chatId);
        });

        socket.on('leaveChat', (chatId) => {
            socket.leave(chatId);
        });

        // Save to DB + broadcast
        socket.on('sendMessage', async (messageData) => {
            await saveAndBroadcastMessage(io, messageData);
        });

        // ---------------- DELETE MESSAGE FOR EVERYONE ----------------
        // After REST API call succeeds, frontend emits this to notify others in room
        socket.on('messageDeletedForEveryone', ({ chatId, messageId }) => {
            // Broadcast to everyone in the chat room
            io.to(chatId).emit('messageDeletedForEveryone', { messageId });
        });

        // ===============================
        // 🎥 VIDEO CALL SIGNALING
        // ===============================
        socket.on('joinVideoRoom', (roomId) => {
            socket.join(roomId);
            socket.to(roomId).emit('userJoinedVideo', socket.id);
        });

        socket.on('offer', ({ roomId, offer }) => {
            socket.to(roomId).emit('offer', offer);
        });

        socket.on('answer', ({ roomId, answer }) => {
            socket.to(roomId).emit('answer', answer);
        });

        socket.on('ice-candidate', ({ roomId, candidate }) => {
            socket.to(roomId).emit('ice-candidate', candidate);
        });

        socket.on('leaveVideoRoom', (roomId) => {
            socket.leave(roomId);
            socket.to(roomId).emit('userLeftVideo');
        });

        socket.on('disconnect', () => {
            console.log(`❌ Socket disconnected: ${socket.id}`);
        });
    });

    return io;
};

const getIo = () => {
    if (!io) throw new Error('Socket.io not initialized!');
    return io;
};

module.exports = { initializeSocket, getIo };