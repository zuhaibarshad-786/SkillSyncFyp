// client/src/context/SocketContext.js
import React, { createContext, useContext, useState, useEffect } from 'react';
import { io } from 'socket.io-client';
import { useAuth } from '../hooks/useAuth';

// 1. Define the backend URL for the socket connection
const SOCKET_SERVER_URL = import.meta.env.VITE_APP_API_URL || 'http://localhost:5000';

// 2. Create the Context
export const SocketContext = createContext();

// 3. Create a custom hook for easy access
export const useSocket = () => {
    return useContext(SocketContext);
};

// 4. Create the Provider Component
export const SocketProvider = ({ children }) => {
    const { isAuthenticated, user } = useAuth();
    const [socket, setSocket] = useState(null);
    const [isConnected, setIsConnected] = useState(false);

    useEffect(() => {
        // Only connect the socket if the user is authenticated
        if (isAuthenticated && user) {
            
            // Connect the socket client to the server endpoint
            const newSocket = io(SOCKET_SERVER_URL, {
                query: { userId: user._id }, // Pass user ID for server-side tracking/authentication
                reconnectionAttempts: 5,
                timeout: 10000,
            });

            newSocket.on('connect', () => {
                setIsConnected(true);
                console.log('Socket connected successfully.');
            });

            newSocket.on('disconnect', () => {
                setIsConnected(false);
                console.log('Socket disconnected.');
            });

            // Set the socket instance in state
            setSocket(newSocket);

            // Cleanup function: runs when the component unmounts or dependencies change
            return () => {
                newSocket.disconnect();
            };
        } else if (socket) {
            // If the user logs out, disconnect the existing socket
            socket.disconnect();
            setSocket(null);
        }
    }, [isAuthenticated, user]);

    const value = {
        socket,
        isConnected,
    };

    return (
        <SocketContext.Provider value={value}>
            {children}
        </SocketContext.Provider>
    );
};