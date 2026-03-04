// client/src/pages/ChatPage.jsx
import React, { useState, useEffect } from 'react';
import ChatWindow from '../components/chat/ChatWindow';
import api from '../api/axios';
import { FaCheck, FaTimes, FaSpinner, FaTrashAlt, FaComments } from 'react-icons/fa';
import useAuth from '../hooks/useAuth.jsx';
import useSocket from '../hooks/useSocket.jsx';

const ChatPage = () => {
    const { user } = useAuth();
    const { socket } = useSocket();
    const [conversations, setConversations] = useState([]);
    const [selectedConversation, setSelectedConversation] = useState(null);
    const [isLoading, setIsLoading] = useState(true);

    const fetchConversations = async () => {
        try {
            const response = await api.get('/chat/conversations');
            const chats = response.data;
            setConversations(chats);

            // Keep selected chat selected after refresh
            if (selectedConversation) {
                const freshChat = chats.find(c => c.chatId === selectedConversation.chatId);
                if (freshChat) setSelectedConversation(freshChat);
            } else if (chats.length > 0) {
                setSelectedConversation(chats[0]);
            }
        } catch (error) {
            console.error('Failed to fetch conversations:', error);
        } finally {
            setIsLoading(false);
        }
    };

    useEffect(() => {
        if (user?._id) fetchConversations();
    }, [user?._id]);

    // KEY FIX: conversationUpdated event sunna
    // Jab koi naya message aaye aur chat delete-for-me se restore ho,
    // conversation list refresh ho jaaye aur chat wapas dikhne lage
    useEffect(() => {
        if (!socket) return;

        const handleConversationUpdated = ({ chatId }) => {
            // Refresh conversation list so restored chats reappear
            fetchConversations();
        };

        socket.on('conversationUpdated', handleConversationUpdated);
        return () => socket.off('conversationUpdated', handleConversationUpdated);
    }, [socket]);

    const handleAccept = async (chatId, e) => {
        e.stopPropagation();
        try {
            await api.post(`/chat/accept/${chatId}`);
            fetchConversations();
        } catch {
            alert('Failed to accept request.');
        }
    };

    const handleReject = async (chatId, e) => {
        e.stopPropagation();
        try {
            await api.post(`/chat/reject/${chatId}`);
            setConversations(prev => prev.filter(c => c.chatId !== chatId));
            if (selectedConversation?.chatId === chatId) setSelectedConversation(null);
        } catch {
            alert('Failed to reject request.');
        }
    };

    // Persistent soft-delete: sirf is user ke liye chat hide karo
    const handleDeleteChat = async () => {
        if (!selectedConversation) return;
        if (!window.confirm(`"${selectedConversation.partnerName}" ke saath chat hide karein? Agar partner naya message bheje to wापas dikhe ga.`)) return;

        try {
            await api.post(`/chat/delete-for-self/${selectedConversation.chatId}`);
            setConversations(prev => prev.filter(c => c.chatId !== selectedConversation.chatId));
            setSelectedConversation(null);
        } catch {
            alert('Failed to delete chat.');
        }
    };

    if (isLoading) {
        return (
            <div className="p-8 text-center text-gray-500">
                <FaSpinner className="animate-spin mr-2 inline" /> Loading conversations...
            </div>
        );
    }

    return (
        <div className="flex h-[82vh] bg-white rounded-xl shadow-xl overflow-hidden border border-gray-200">

            {/* Sidebar */}
            <div className="w-1/3 border-r flex flex-col">
                <div className="p-4 bg-gray-50 border-b flex items-center gap-2">
                    <FaComments className="text-indigo-500" />
                    <span className="font-semibold text-gray-800">
                        Chats ({conversations.length})
                    </span>
                </div>

                <div className="overflow-y-auto flex-grow">
                    {conversations.length === 0 && (
                        <div className="p-6 text-center text-gray-400 text-sm">
                            No chats yet. Find a match to get started!
                        </div>
                    )}

                    {conversations.map(conv => (
                        <div
                            key={conv.chatId}
                            onClick={() => setSelectedConversation(conv)}
                            className={`p-4 cursor-pointer border-b transition-all duration-150
                                ${selectedConversation?.chatId === conv.chatId
                                    ? 'bg-indigo-50 border-l-4 border-indigo-500'
                                    : 'hover:bg-gray-50 border-l-4 border-transparent'}
                            `}
                        >
                            <div className="flex justify-between items-start">
                                <p className="font-semibold text-gray-800 truncate">{conv.partnerName}</p>

                                {conv.status === 'pending' && (
                                    <span className={`text-xs font-bold px-2 py-0.5 rounded-full ml-2 shrink-0 ${
                                        conv.isRequesting
                                            ? 'bg-green-100 text-green-700'
                                            : 'bg-yellow-100 text-yellow-700'
                                    }`}>
                                        {conv.isRequesting ? 'NEW' : 'SENT'}
                                    </span>
                                )}
                                {conv.status === 'active' && (
                                    <span className="text-xs font-bold px-2 py-0.5 rounded-full ml-2 bg-blue-100 text-blue-700 shrink-0">
                                        ACTIVE
                                    </span>
                                )}
                            </div>

                            <p className="text-sm text-gray-500 truncate mt-1">{conv.lastMessage}</p>

                            {/* Accept/Reject for incoming pending requests */}
                            {conv.isRequesting && conv.status === 'pending' && (
                                <div className="flex gap-2 mt-2">
                                    <button
                                        onClick={(e) => handleAccept(conv.chatId, e)}
                                        className="flex-1 text-xs py-1.5 bg-green-500 text-white rounded-lg flex items-center justify-center hover:bg-green-600 transition"
                                    >
                                        <FaCheck className="mr-1" /> Accept
                                    </button>
                                    <button
                                        onClick={(e) => handleReject(conv.chatId, e)}
                                        className="flex-1 text-xs py-1.5 bg-red-500 text-white rounded-lg flex items-center justify-center hover:bg-red-600 transition"
                                    >
                                        <FaTimes className="mr-1" /> Reject
                                    </button>
                                </div>
                            )}
                        </div>
                    ))}
                </div>
            </div>

            {/* Chat Window */}
            <div className="w-2/3 flex flex-col">
                <ChatWindow conversation={selectedConversation} />

                {selectedConversation && (
                    <div className="flex justify-end p-2 bg-white border-t">
                        <button
                            onClick={handleDeleteChat}
                            className="text-xs px-3 py-1.5 bg-gray-100 text-gray-500 rounded-lg hover:bg-red-50 hover:text-red-600 transition flex items-center gap-1"
                            title="Chat hide ho jaayegi. Partner ka naya message aane par wapas dikhe gi."
                        >
                            <FaTrashAlt /> Hide chat (for me)
                        </button>
                    </div>
                )}
            </div>
        </div>
    );
};

export default ChatPage;