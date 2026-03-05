// server/src/websocket.js
const socketIo = require('socket.io');
const Session  = require('./models/Session');

let io;

// userId (string) → Set<socketId>
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

// Emit to ALL sockets of a given user (they may have multiple tabs open)
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

// sessionId → { callerId }
const activeCalls = new Map();

// roomId → Set<userId>
const roomReadyUsers = new Map();

// ─────────────────────────────────────────────────────────────────────────────
// initializeSocket
//   server     : http.Server
//   corsOptions: cors config object (same one used by Express, so origins match)
// ─────────────────────────────────────────────────────────────────────────────
const initializeSocket = (server, corsOptions) => {
    io = socketIo(server, {
        // Re-use the same CORS config passed to Express so origins stay in sync
        cors: corsOptions || {
            origin: process.env.CLIENT_URL || 'http://localhost:5173',
            methods: ['GET', 'POST'],
            credentials: true,
        },
        // Allow polling transport so Render's cold-start works and clients can
        // upgrade to websocket once the connection is established.
        transports: ['polling', 'websocket'],
    });

    io.on('connection', (socket) => {
        // ── AUTH ──────────────────────────────────────────────────────────────
        // userId is passed via socket.handshake.auth.userId (set by the client)
        const userId = socket.handshake.auth?.userId;

        if (userId) {
            socket.join(userId.toString());
            addUserSocket(userId.toString(), socket.id);
            socket.data.userId = userId.toString();
            console.log(`🔐 User ${userId} connected (socket ${socket.id})`);
        } else {
            console.warn(`⚠️  Socket ${socket.id} connected without userId — will not receive targeted events`);
        }

        // ── CHAT ──────────────────────────────────────────────────────────────
        socket.on('joinChat',  (chatId) => socket.join(chatId));
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
        // Flow: initiateCall → incomingCall → acceptCall / rejectCall
        //       → callAccepted / callRejected → joinVideoRoom → startWebRTC
        //       → webrtcOffer ↔ webrtcAnswer ↔ webrtcIceCandidate → endCall
        // ══════════════════════════════════════════════════════════════════════

        // Step 1 — Caller starts; ring the partner
        socket.on('initiateCall', async ({ sessionId }) => {
            const callerId = socket.data.userId;
            if (!callerId) {
                socket.emit('callError', { message: 'Not authenticated.' });
                return;
            }

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

                // Tell the partner their phone is ringing
                emitToUser(partnerId, 'incomingCall', { sessionId, callerId, callerName });
                // Tell the caller we found the partner and are ringing
                socket.emit('callRinging', { sessionId, partnerId });

                console.log(`📞 initiateCall: session=${sessionId} caller=${callerId} partner=${partnerId}`);
            } catch (err) {
                socket.emit('callError', { message: err.message });
                activeCalls.delete(sessionId);
            }
        });

        // Step 2a — Receiver accepts → notify caller to navigate to /video/:id
        socket.on('acceptCall', async ({ sessionId }) => {
            const accepterId = socket.data.userId;
            if (!accepterId) return;

            try {
                await validateSessionParticipant(sessionId, accepterId);
                const callMeta = activeCalls.get(sessionId);
                if (callMeta) {
                    emitToUser(callMeta.callerId, 'callAccepted', { sessionId });
                }
                console.log(`✅ acceptCall: session=${sessionId} by=${accepterId}`);
            } catch (err) {
                socket.emit('callError', { message: err.message });
            }
        });

        // Step 2b — Receiver rejects
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
                console.log(`❌ rejectCall: session=${sessionId} by=${rejecterId}`);
            } catch (err) {
                console.error('rejectCall error:', err.message);
            }
        });

        // Step 3 — Join video room after navigation
        socket.on('joinVideoRoom', async ({ roomId }) => {
            const uid = socket.data.userId;
            if (!uid) return;

            try {
                await validateSessionParticipant(roomId, uid);
                socket.join(roomId);

                if (!roomReadyUsers.has(roomId)) roomReadyUsers.set(roomId, new Set());
                const readySet = roomReadyUsers.get(roomId);

                // Handle StrictMode double-fire / reconnects gracefully
                if (readySet.has(uid)) {
                    console.log(`🔄 User ${uid} re-joined room ${roomId} (already counted, size=${readySet.size})`);
                    if (readySet.size === 1) {
                        socket.emit('waitingForPeer', { roomId });
                    } else if (readySet.size >= 2) {
                        socket.emit('startWebRTC', { roomId, isInitiator: true });
                    }
                    return;
                }

                readySet.add(uid);
                console.log(`🎥 joinVideoRoom: user=${uid} room=${roomId} (${readySet.size}/2 ready)`);

                if (readySet.size === 1) {
                    // First user in — wait
                    socket.emit('waitingForPeer', { roomId });
                } else if (readySet.size >= 2) {
                    // Both users ready — second joiner creates offer (isInitiator=true)
                    socket.emit('startWebRTC', { roomId, isInitiator: true });
                    // First joiner waits for offer (isInitiator=false)
                    socket.to(roomId).emit('startWebRTC', { roomId, isInitiator: false });
                }
            } catch (err) {
                socket.emit('callError', { message: err.message });
            }
        });

        // Step 4 — WebRTC signaling relay (server never inspects SDP/ICE)
        socket.on('webrtcOffer', ({ roomId, offer }) => {
            socket.to(roomId).emit('webrtcOffer', { offer });
        });

        socket.on('webrtcAnswer', ({ roomId, answer }) => {
            socket.to(roomId).emit('webrtcAnswer', { answer });
        });

        socket.on('webrtcIceCandidate', ({ roomId, candidate }) => {
            socket.to(roomId).emit('webrtcIceCandidate', { candidate });
        });

        // Step 5 — End call
        socket.on('endCall', ({ roomId }) => {
            const uid = socket.data.userId;
            socket.to(roomId).emit('callEnded', { by: uid });
            socket.leave(roomId);
            activeCalls.delete(roomId);

            if (roomReadyUsers.has(roomId)) {
                roomReadyUsers.get(roomId).delete(uid);
                if (roomReadyUsers.get(roomId).size === 0) roomReadyUsers.delete(roomId);
            }

            console.log(`📵 endCall: room=${roomId} by=${uid}`);
        });

        // ── Disconnect cleanup ─────────────────────────────────────────────────
        socket.on('disconnect', () => {
            const uid = socket.data.userId;
            if (uid) {
                removeUserSocket(uid, socket.id);

                // If this user was in any video room, notify the peer
                for (const [roomId, users] of roomReadyUsers.entries()) {
                    if (users.has(uid)) {
                        users.delete(uid);
                        io.to(roomId).emit('callEnded', { by: uid });
                        if (users.size === 0) roomReadyUsers.delete(roomId);
                    }
                }
            }
            console.log(`🔌 Socket disconnected: ${socket.id}`);
        });
    });

    return io;
};

const getIo = () => {
    if (!io) throw new Error('Socket.io not initialized!');
    return io;
};

module.exports = { initializeSocket, getIo };