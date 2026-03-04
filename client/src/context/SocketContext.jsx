// client/src/context/SocketContext.jsx
// SocketProvider lives OUTSIDE the Router, so useNavigate cannot be used here.
// Instead, we expose `incomingCall` state and `acceptCall` / `rejectCall` handlers
// through context. Any component inside the Router (e.g. ChatWindow, a global
// IncomingCallBanner) can consume these and call useNavigate themselves.

import React, { createContext, useContext, useState, useEffect, useCallback } from 'react';
import { io } from 'socket.io-client';
import { useAuth } from '../hooks/useAuth';

// for development use this
// const SOCKET_SERVER_URL = import.meta.env.VITE_APP_API_URL || 'http://localhost:5000';

// for production use this
const SOCKET_SERVER_URL = import.meta.env.VITE_API_URL || 'https://skillsyncfyp.onrender.com';

export const SocketContext = createContext();

export const useSocket = () => useContext(SocketContext);

export const SocketProvider = ({ children }) => {
    const { isAuthenticated, user } = useAuth();

    const [socket,      setSocket]      = useState(null);
    const [isConnected, setIsConnected] = useState(false);

    // incomingCall: null | { sessionId, callerId, callerName }
    const [incomingCall, setIncomingCall] = useState(null);

    // ── Socket lifecycle ──────────────────────────────────────────────────────
    useEffect(() => {
        if (!isAuthenticated || !user) {
            setSocket(prev => { prev?.disconnect(); return null; });
            setIsConnected(false);
            return;
        }

        const newSocket = io(SOCKET_SERVER_URL, {
            query:                { userId: user._id },
            reconnectionAttempts: 5,
            timeout:              10000,
        });

        newSocket.on('connect', () => {
            setIsConnected(true);
            // Authenticate immediately so server maps userId → socketId
            newSocket.emit('authenticate', user._id);
            console.log('✅ Socket connected & authenticated.');
        });

        newSocket.on('disconnect', () => {
            setIsConnected(false);
            console.log('❌ Socket disconnected.');
        });

        // ── Incoming call (from server after partner calls initiateCall) ──────
        newSocket.on('incomingCall', ({ sessionId, callerId, callerName }) => {
            console.log(`📞 Incoming call from ${callerName} (session: ${sessionId})`);
            setIncomingCall({ sessionId, callerId, callerName });
        });

        // If caller cancels / ends call before we answer, clear the UI
        newSocket.on('callEnded', () => {
            setIncomingCall(null);
        });

        setSocket(newSocket);

        return () => {
            newSocket.off('incomingCall');
            newSocket.off('callEnded');
            newSocket.disconnect();
        };
    }, [isAuthenticated, user?._id]);

    // ── acceptCall — emits socket event; caller must navigate themselves ──────
    // Returns the sessionId so the caller can navigate to /video/:sessionId
    const acceptCall = useCallback(() => {
        if (!incomingCall || !socket) return null;
        const { sessionId } = incomingCall;
        socket.emit('acceptCall', { sessionId });
        setIncomingCall(null);
        return sessionId;          // ← consumer navigates with this
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