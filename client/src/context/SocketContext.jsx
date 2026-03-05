// client/src/context/SocketContext.jsx
// SocketProvider lives OUTSIDE the Router, so useNavigate cannot be used here.
// Instead, we expose `incomingCall` state and `acceptCall` / `rejectCall` handlers
// through context. Any component inside the Router (e.g. IncomingCallBanner)
// can consume these and call useNavigate themselves.

import React, {
    createContext,
    useContext,
    useState,
    useEffect,
    useCallback,
} from 'react';
import { io } from 'socket.io-client';
import { useAuth } from '../hooks/useAuth';

// ─── URL resolved from env var ────────────────────────────────────────────────
// Local dev  : VITE_API_URL=http://localhost:5000  (set in .env)
// Production : VITE_API_URL=https://skillsyncfyp.onrender.com  (set in Vercel dashboard)
const SOCKET_SERVER_URL = import.meta.env.VITE_API_URL || 'http://localhost:5000';

export const SocketContext = createContext();

export const useSocket = () => useContext(SocketContext);

export const SocketProvider = ({ children }) => {
    const { isAuthenticated, user } = useAuth();

    const [socket, setSocket]       = useState(null);
    const [isConnected, setIsConnected] = useState(false);

    // incomingCall: null | { sessionId, callerId, callerName }
    const [incomingCall, setIncomingCall] = useState(null);

    // ── Socket lifecycle ──────────────────────────────────────────────────────
    useEffect(() => {
        if (!isAuthenticated || !user) {
            setSocket((prev) => {
                prev?.disconnect();
                return null;
            });
            setIsConnected(false);
            return;
        }

        // Use polling first, then upgrade to websocket.
        // This is critical for Render (and most cloud hosts) which may not
        // support a cold-start websocket-only connection.
        // auth.userId is read server-side via socket.handshake.auth.userId
        const newSocket = io(SOCKET_SERVER_URL, {
            transports: ['polling', 'websocket'], // polling first → upgrade
            auth: { userId: user._id },
            reconnectionAttempts: 5,
            timeout: 10000,
        });

        newSocket.on('connect', () => {
            setIsConnected(true);
            console.log(`✅ Socket connected (${newSocket.id}) — transport: ${newSocket.io.engine.transport.name}`);
        });

        newSocket.on('disconnect', (reason) => {
            setIsConnected(false);
            console.log(`❌ Socket disconnected: ${reason}`);
        });

        newSocket.on('connect_error', (err) => {
            console.error('Socket connect error:', err.message);
        });

        // ── Incoming call ─────────────────────────────────────────────────────
        newSocket.on('incomingCall', ({ sessionId, callerId, callerName }) => {
            console.log(`📞 Incoming call from ${callerName} (session: ${sessionId})`);
            setIncomingCall({ sessionId, callerId, callerName });
        });

        // If caller ends the call before we answer, clear the UI
        newSocket.on('callEnded', () => {
            setIncomingCall(null);
        });

        // If caller rejects (edge case) clear too
        newSocket.on('callRejected', () => {
            setIncomingCall(null);
        });

        setSocket(newSocket);

        return () => {
            newSocket.off('incomingCall');
            newSocket.off('callEnded');
            newSocket.off('callRejected');
            newSocket.disconnect();
        };
    }, [isAuthenticated, user?._id]);

    // ── acceptCall ────────────────────────────────────────────────────────────
    // Returns sessionId so the consuming component can navigate to /video/:id
    const acceptCall = useCallback(() => {
        if (!incomingCall || !socket) return null;
        const { sessionId } = incomingCall;
        socket.emit('acceptCall', { sessionId });
        setIncomingCall(null);
        return sessionId;
    }, [incomingCall, socket]);

    // ── rejectCall ────────────────────────────────────────────────────────────
    const rejectCall = useCallback(() => {
        if (!incomingCall || !socket) return;
        socket.emit('rejectCall', { sessionId: incomingCall.sessionId });
        setIncomingCall(null);
    }, [incomingCall, socket]);

    const value = {
        socket,
        isConnected,
        incomingCall,   // { sessionId, callerId, callerName } | null
        acceptCall,     // call this, get sessionId back, then navigate
        rejectCall,
    };

    return (
        <SocketContext.Provider value={value}>
            {children}
        </SocketContext.Provider>
    );
};