// client/src/pages/ChatPage.jsx
import React, { useState, useEffect } from 'react';
import ChatWindow from '../components/chat/ChatWindow';
import api from '../api/axios';
import { FaCheck, FaTimes, FaSpinner, FaClock, FaTrashAlt } from 'react-icons/fa';
import useAuth from '../hooks/useAuth.jsx';
import useSocket from '../hooks/useSocket.jsx';

const ChatPage = () => {
    const { user } = useAuth();
    const { socket } = useSocket();
    const [conversations, setConversations] = useState([]);
    const [selectedConversation, setSelectedConversation] = useState(null);
    const [isLoading, setIsLoading] = useState(true);

    const fetchConversations = async () => {
        setIsLoading(true);
        try {
            const response = await api.get('/chat/conversations');
            const chats = response.data;
            setConversations(chats);
            
            const currentChatId = selectedConversation?.chatId;
            const freshChat = chats.find(c => c.chatId === currentChatId);

            if (freshChat) {
                // If previously selected chat exists, keep it selected.
                setSelectedConversation(freshChat);
            } else if (chats.length > 0) {
                // Select the newest (first) chat in the list.
                setSelectedConversation(chats[0]);
            } else {
                 setSelectedConversation(null);
            }
            
        } catch (error) {
            console.error("Failed to fetch conversations:", error);
        } finally {
            setIsLoading(false);
        }
    };
    
    useEffect(() => {
        if (user?._id) {
            fetchConversations();
        }
    }, [user?._id]);
    
    
    const handleAccept = async (chatId) => {
        try {
            await api.post(`/chat/accept/${chatId}`);
            fetchConversations(); // Reload to update status to 'active'
        } catch (error) {
            alert('Failed to accept request.');
        }
    };

    const handleReject = async (chatId) => {
        try {
            await api.post(`/chat/reject/${chatId}`);
            fetchConversations(); // Reload to show status as 'rejected'
            setSelectedConversation(null); 
            alert('Connection rejected.');
        } catch (error) {
            alert('Failed to reject request.');
        }
    };

    // --- NON-PERSISTENT Chat Deletion ---
    const handleDeleteChat = async () => {
        if (!selectedConversation) return;

        if (window.confirm(`Are you sure you want to hide the chat history with ${selectedConversation.partnerName}? (Note: History is non-persistent and will clear on server restart/refresh)`)) {
            try {
                // Call the API (mostly for consistency, backend logic is non-persistent)
                await api.post(`/chat/delete-for-self/${selectedConversation.chatId}`);
                
                // Locally remove the chat upon success
                setConversations(prev => prev.filter(c => c.chatId !== selectedConversation.chatId));
                setSelectedConversation(null);
                alert("Chat successfully deleted from view.");
            } catch (error) {
                alert('Failed to delete chat locally.');
            }
        }
    };


    if (isLoading) {
        return <div className="p-8 text-center"><FaSpinner className="animate-spin mr-2 inline"/> Loading conversations...</div>;
    }

    return (
        <div className="flex h-[80vh] bg-white rounded-lg shadow-xl overflow-hidden">
            {/* Conversation List Sidebar */}
            <div className="w-1/3 border-r overflow-y-auto">
                <div className="p-4 bg-gray-100 text-lg font-semibold border-b">
                    Chats & Requests ({conversations.length})
                </div>
                {conversations.map(conv => (
                    <div 
                        key={conv.chatId}
                        onClick={() => setSelectedConversation(conv)}
                        className={`p-4 cursor-pointer border-b transition duration-150 
                            ${selectedConversation?.chatId === conv.chatId ? 'bg-indigo-50 border-l-4 border-indigo-600' : 'hover:bg-gray-50'}
                            ${conv.status === 'rejected' ? 'opacity-50 italic text-gray-500' : ''}
                        `}
                    >
                        <div className="flex justify-between items-center">
                            <p className="font-medium text-gray-800">{conv.partnerName}</p>
                            
                            {conv.status === 'pending' && (
                                <span className={`text-xs font-semibold px-2 py-0.5 rounded-full ${conv.isRequesting ? 'bg-green-100 text-green-700' : 'bg-yellow-100 text-yellow-700'}`}>
                                    {conv.isRequesting ? 'NEW REQUEST' : 'PENDING'}
                                </span>
                            )}
                        </div>
                        <p className="text-sm text-gray-500 truncate mt-1">
                            {conv.status === 'rejected' ? 'Request Rejected' : conv.lastMessage}
                        </p>

                        {/* Accept/Reject Buttons for incoming requests */}
                        {conv.isRequesting && conv.status === 'pending' && (
                            <div className="flex space-x-2 mt-2">
                                <button 
                                    onClick={(e) => { e.stopPropagation(); handleAccept(conv.chatId); }}
                                    className="text-sm px-3 py-1 bg-green-500 text-white rounded-md flex items-center hover:bg-green-600"
                                >
                                    <FaCheck className="mr-1"/> Accept
                                </button>
                                <button 
                                    onClick={(e) => { e.stopPropagation(); handleReject(conv.chatId); }}
                                    className="text-sm px-3 py-1 bg-red-500 text-white rounded-md flex items-center hover:bg-red-600"
                                >
                                    <FaTimes className="mr-1"/> Reject
                                </button>
                            </div>
                        )}
                    </div>
                ))}
                {!conversations.length && (
                    <div className="p-4 text-center text-gray-500">No chats yet. Find a match to start!</div>
                )}
            </div>
            
            {/* Chat Window */}
            <div className="w-2/3 flex flex-col">
                <ChatWindow conversation={selectedConversation} />
                
                {/* Chat Deletion Button (for selected chat) */}
                {selectedConversation && (
                     <div className="flex justify-end p-2 bg-white border-t">
                         <button 
                             onClick={handleDeleteChat}
                             className="text-xs px-3 py-1 bg-gray-100 text-gray-600 rounded-lg hover:bg-gray-200"
                         >
                             <FaTrashAlt className="mr-1 inline"/> Delete Chat History (for me)
                         </button>
                     </div>
                )}
            </div>
        </div>
    );
};

export default ChatPage;