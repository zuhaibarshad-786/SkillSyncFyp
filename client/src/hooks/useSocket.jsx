// client/src/hooks/useSocket.js
import { useContext } from 'react';
import { SocketContext } from '../context/SocketContext';

/**
 * Custom hook to consume the socket context.
 * Returns the socket instance and connection status (isConnected).
 */
export const useSocket = () => {
    const context = useContext(SocketContext);

    if (context === undefined) {
        throw new Error('useSocket must be used within a SocketProvider');
    }

    return context;
};

export default useSocket;

// NOTE: Ensure you update SocketContext.js to remove the direct export of useSocket 
// if you want to enforce using this file structure.