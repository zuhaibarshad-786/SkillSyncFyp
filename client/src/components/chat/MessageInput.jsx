// client/src/components/chat/MessageInput.jsx
import React, { useState } from 'react';
import { FaPaperPlane } from 'react-icons/fa';
import Button from '../common/Button';

/**
 * @param {string} chatId        - Current conversation room ID
 * @param {string} senderId      - Current authenticated user's ID
 * @param {string} receiverId    - Recipient's user ID
 * @param {object} socket        - Socket.io client instance
 * @param {boolean} disabled     - Disable when chat is not active or disconnected
 */
const MessageInput = ({ chatId, senderId, receiverId, socket, disabled }) => {
    const [message, setMessage] = useState('');

    const handleSend = (e) => {
        e.preventDefault();
        if (!message.trim() || !socket || !chatId || disabled) return;

        socket.emit('sendMessage', {
            chatId,
            senderId,
            receiverId,
            content: message.trim(),
        });

        setMessage('');
    };

    return (
        <form
            onSubmit={handleSend}
            className="p-3 bg-white border-t flex items-center gap-2"
        >
            <input
                type="text"
                value={message}
                onChange={(e) => setMessage(e.target.value)}
                placeholder={disabled ? 'Chat must be active to send messages...' : 'Type your message...'}
                className="flex-grow p-3 border border-gray-300 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-indigo-400 transition disabled:bg-gray-100 disabled:cursor-not-allowed"
                disabled={disabled}
            />
            <Button
                type="submit"
                variant="primary"
                className="w-11 h-11 rounded-full p-0 flex items-center justify-center shrink-0"
                disabled={disabled || !message.trim()}
            >
                <FaPaperPlane className="w-4 h-4" />
            </Button>
        </form>
    );
};

export default MessageInput;