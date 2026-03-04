// server/src/websocket.js
const socketIo = require('socket.io');
const Session  = require('./models/Session');

let io;

const userSockets = new Map();

const addUserSocket = (userId, socketId) => {
    if (!userSockets.has(userId)) userSockets.set(userId, new Set());
    userSockets.get(userId).add(socketId);
};

const removeUserSocket = (userId, socketId) => {
    if (userSockets.has(userId)) {
        userSockets.get(userId).delete(socketId);
        if (userSockets.get(userId).size === 0) userSockets.delete(userId);
    }
};

const emitToUser = (userId, event, data) => {
    const sids = userSockets.get(userId.toString());
    if (sids) sids.forEach(sid => io.to(sid).emit(event, data));
};

const validateSessionParticipant = async (sessionId, userId) => {
    const session = await Session.findById(sessionId)
        .populate('teacher', 'name')
        .populate('learner', 'name');

    if (!session) throw new Error('Session not found.');
    if (!['scheduled', 'in_progress'].includes(session.status)) {
        throw new Error(`Session is not active (status: ${session.status}).`);
    }

    const teacherId = session.teacher._id.toString();
    const learnerId = session.learner._id.toString();
    const uid       = userId.toString();

    if (uid !== teacherId && uid !== learnerId) {
        throw new Error('You are not a participant of this session.');
    }

    const partnerId = uid === teacherId ? learnerId : teacherId;
    return { session, partnerId };
};

const activeCalls = new Map(); // sessionId → { callerId }

// Track who is ready in each video room: roomId → Set of userIds
const roomReadyUsers = new Map();

const initializeSocket = (server) => {
    io = socketIo(server, {
        cors: {
            origin: process.env.CLIENT_URL || 'http://localhost:5173',
            methods: ['GET', 'POST'],
            credentials: true,
        },
    });

    io.on('connection', (socket) => {
        console.log(`✅ Socket connected: ${socket.id}`);

        // ── AUTH ──────────────────────────────────────────────────────────────
        socket.on('authenticate', (userId) => {
            if (!userId) return;
            socket.join(userId.toString());
            addUserSocket(userId.toString(), socket.id);
            socket.data.userId = userId.toString();
            console.log(`🔐 User ${userId} authenticated on socket ${socket.id}`);
        });

        // ── CHAT ──────────────────────────────────────────────────────────────
        socket.on('joinChat', (chatId) => socket.join(chatId));
        socket.on('leaveChat', (chatId) => socket.leave(chatId));

        socket.on('sendMessage', async (messageData) => {
            try {
                const { saveAndBroadcastMessage } = require('./controllers/chatController');
                await saveAndBroadcastMessage(io, messageData);
            } catch (err) {
                console.error('sendMessage error:', err.message);
            }
        });

        socket.on('messageDeletedForEveryone', ({ chatId, messageId }) => {
            io.to(chatId).emit('messageDeletedForEveryone', { messageId });
        });

        // ══════════════════════════════════════════════════════════════════════
        // 📞 VIDEO CALL SIGNALING
        // ══════════════════════════════════════════════════════════════════════

        // Step 1: Caller initiates — ring the partner
        socket.on('initiateCall', async ({ sessionId }) => {
            const callerId = socket.data.userId;
            if (!callerId) { socket.emit('callError', { message: 'Not authenticated.' }); return; }

            try {
                const { session, partnerId } = await validateSessionParticipant(sessionId, callerId);

                if (activeCalls.has(sessionId)) {
                    socket.emit('callError', { message: 'A call is already in progress for this session.' });
                    return;
                }

                activeCalls.set(sessionId, { callerId });

                const callerName = session.teacher._id.toString() === callerId
                    ? session.teacher.name
                    : session.learner.name;

                emitToUser(partnerId, 'incomingCall', { sessionId, callerId, callerName });
                socket.emit('callRinging', { sessionId, partnerId });
                console.log(`📞 Call initiated: session=${sessionId} caller=${callerId} partner=${partnerId}`);
            } catch (err) {
                socket.emit('callError', { message: err.message });
                activeCalls.delete(sessionId);
            }
        });

        // Step 2a: Receiver accepts — notify caller to navigate to video page
        socket.on('acceptCall', async ({ sessionId }) => {
            const accepterId = socket.data.userId;
            if (!accepterId) return;

            try {
                await validateSessionParticipant(sessionId, accepterId);
                const callMeta = activeCalls.get(sessionId);
                if (callMeta) {
                    emitToUser(callMeta.callerId, 'callAccepted', { sessionId });
                }
                console.log(`✅ Call accepted: session=${sessionId} accepter=${accepterId}`);
            } catch (err) {
                socket.emit('callError', { message: err.message });
            }
        });

        // Step 2b: Receiver rejects
        socket.on('rejectCall', async ({ sessionId }) => {
            const rejecterId = socket.data.userId;
            try {
                const callMeta = activeCalls.get(sessionId);
                if (callMeta) {
                    emitToUser(callMeta.callerId, 'callRejected', {
                        sessionId,
                        message: 'The other user declined the call.',
                    });
                    activeCalls.delete(sessionId);
                }
                console.log(`❌ Call rejected: session=${sessionId} by=${rejecterId}`);
            } catch (err) {
                console.error('rejectCall error:', err.message);
            }
        });

        // Step 3: Join video room
        socket.on('joinVideoRoom', async ({ roomId }) => {
            const userId = socket.data.userId;
            if (!userId) return;

            try {
                await validateSessionParticipant(roomId, userId);
                socket.join(roomId);

                if (!roomReadyUsers.has(roomId)) roomReadyUsers.set(roomId, new Set());
                const readySet = roomReadyUsers.get(roomId);

                // If this user is already tracked (StrictMode double-emit / reconnect),
                // just re-send their current state without incrementing the count
                if (readySet.has(userId)) {
                    console.log(`🔄 User ${userId} re-joined room ${roomId} (already counted)`);
                    if (readySet.size === 1) {
                        socket.emit('waitingForPeer', { roomId });
                    } else if (readySet.size >= 2) {
                        // Partner already waiting — this user is the initiator
                        socket.emit('startWebRTC', { roomId, isInitiator: true });
                    }
                    return;
                }

                readySet.add(userId);
                console.log(`🎥 User ${userId} joined video room ${roomId} (${readySet.size}/2 ready)`);

                if (readySet.size === 1) {
                    socket.emit('waitingForPeer', { roomId });
                } else if (readySet.size >= 2) {
                    // Both ready — second joiner is initiator (sends offer)
                    socket.emit('startWebRTC', { roomId, isInitiator: true });
                    // First joiner is receiver (waits for offer)
                    socket.to(roomId).emit('startWebRTC', { roomId, isInitiator: false });
                }
            } catch (err) {
                socket.emit('callError', { message: err.message });
            }
        });

        // Step 4: WebRTC signaling relay
        socket.on('webrtcOffer', ({ roomId, offer }) => {
            socket.to(roomId).emit('webrtcOffer', { offer });
        });

        socket.on('webrtcAnswer', ({ roomId, answer }) => {
            socket.to(roomId).emit('webrtcAnswer', { answer });
        });

        socket.on('webrtcIceCandidate', ({ roomId, candidate }) => {
            socket.to(roomId).emit('webrtcIceCandidate', { candidate });
        });

        // Step 5: End call — notify partner, clean up room
        socket.on('endCall', ({ roomId }) => {
            const userId = socket.data.userId;
            socket.to(roomId).emit('callEnded', { by: userId });
            socket.leave(roomId);
            activeCalls.delete(roomId);
            // Clean up ready set
            if (roomReadyUsers.has(roomId)) {
                roomReadyUsers.get(roomId).delete(userId);
                if (roomReadyUsers.get(roomId).size === 0) roomReadyUsers.delete(roomId);
            }
            console.log(`📵 Call ended in room ${roomId} by ${userId}`);
        });

        // ── Disconnect cleanup ─────────────────────────────────────────────────
        socket.on('disconnect', () => {
            const userId = socket.data.userId;
            if (userId) {
                removeUserSocket(userId, socket.id);
                // Clean up any video rooms this user was in
                for (const [roomId, users] of roomReadyUsers.entries()) {
                    if (users.has(userId)) {
                        users.delete(userId);
                        // Notify others in the room
                        io.to(roomId).emit('callEnded', { by: userId });
                        if (users.size === 0) roomReadyUsers.delete(roomId);
                    }
                }
            }
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