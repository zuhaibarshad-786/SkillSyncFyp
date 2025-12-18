// client/src/components/chat/MessageInput.jsx
import React, { useState } from 'react';
import { FaPaperPlane } from 'react-icons/fa';
import Button from '../common/Button'; 

/**
 * Input field for composing and sending chat messages.
 * @param {string} chatId - The ID of the current conversation room.
 * @param {string} senderId - The ID of the current authenticated user.
 * @param {string} receiverId - The ID of the recipient.
 * @param {object} socket - The Socket.io client instance.
 */
const MessageInput = ({ chatId, senderId, receiverId, socket }) => {
    const [message, setMessage] = useState('');

    const handleSend = (e) => {
        e.preventDefault();
        if (!message.trim() || !socket || !chatId) return;

        // Emit the message to the server via Socket.io
        socket.emit('sendMessage', {
            chatId,
            senderId,
            receiverId,
            content: message.trim(),
        });

        setMessage(''); // Clear the input field
    };

    return (
        <form onSubmit={handleSend} className="p-4 bg-gray-50 border-t flex items-center space-x-3">
            <input
                type="text"
                value={message}
                onChange={(e) => setMessage(e.target.value)}
                placeholder="Type your message..."
                className="flex-grow p-3 border border-gray-300 rounded-xl focus:ring-indigo-500 focus:border-indigo-500 transition duration-150"
                disabled={!socket || !chatId}
            />
            <Button
                type="submit"
                variant="primary"
                className="w-12 h-12 rounded-full p-0 flex items-center justify-center"
                disabled={!socket || !chatId || !message.trim()}
            >
                <FaPaperPlane className="w-4 h-4" />
            </Button>
        </form>
    );
};

export default MessageInput;