// client/src/components/chat/ChatWindow.jsx (FIXED - No Infinite Retry Loop)
import React, { useState, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { useSocket } from '../../hooks/useSocket.jsx'; 
import { useAuth } from '../../hooks/useAuth.jsx';
import api from '../../api/axios';
import { FaVideo, FaCalendarAlt, FaEllipsisV, FaTrashAlt, FaCheckCircle, FaSpinner, FaExclamationTriangle } from 'react-icons/fa';
import MessageInput from './MessageInput';
import Button from '../common/Button'; 
import SessionSchedulerModal from './SessionSchedulerModal';


// Helper component for message display
const MessageBubble = ({ message, isCurrentUser, socket, messageId }) => {
    const [isMenuOpen, setIsMenuOpen] = useState(false); 
    
    if (message.status === 'self_deleted') { 
        return (
            <div className="text-xs text-gray-500 text-center italic py-1">
                *Message deleted for you (non-persistent)*
            </div>
        );
    }
    
    const handleDeleteForSelf = () => {
        if (socket && messageId) {
            socket.emit('deleteMessageForSelf', messageId);
        }
        setIsMenuOpen(false);
    };

    return (
        <div className={`flex ${isCurrentUser ? 'justify-end' : 'justify-start'}`}>
            <div className="flex items-start">
                {isCurrentUser && (
                    <div className="relative self-center">
                        <button 
                            onClick={() => setIsMenuOpen(!isMenuOpen)} 
                            className="mr-2 text-gray-400 hover:text-gray-600 transition"
                        >
                            <FaEllipsisV className="w-3 h-3"/>
                        </button>
                        {isMenuOpen && (
                            <div className="absolute right-full top-0 mt-1 w-40 bg-white border rounded-md shadow-lg z-20">
                                <button 
                                    onClick={handleDeleteForSelf}
                                    className="flex items-center w-full px-3 py-2 text-xs text-red-600 hover:bg-red-50"
                                >
                                    <FaTrashAlt className="mr-2"/> Delete for me
                                </button>
                            </div>
                        )}
                    </div>
                )}
                
                <div className={`max-w-xs lg:max-w-md px-4 py-2 rounded-xl shadow-md text-sm ${
                    isCurrentUser 
                        ? 'bg-indigo-600 text-white rounded-br-none' 
                        : 'bg-gray-200 text-gray-800 rounded-tl-none'
                }`}>
                    {message.content}
                    <span className={`block text-xs mt-1 ${isCurrentUser ? 'text-indigo-200' : 'text-gray-500'}`}>
                        {new Date(message.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                    </span>
                </div>
            </div>
        </div>
    );
};


const ChatWindow = ({ conversation }) => {
    const navigate = useNavigate();
    const { socket, isConnected } = useSocket();
    const { user } = useAuth();
    const [messages, setMessages] = useState([]);
    const [currentSession, setCurrentSession] = useState(null); 
    const [isMarkingComplete, setIsMarkingComplete] = useState(false);
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [sessionError, setSessionError] = useState(null);
    const [hasFetchedSession, setHasFetchedSession] = useState(false); // ADDED: Track if we already tried
    const messagesEndRef = useRef(null);

    const chatId = conversation?.chatId;
    const isChatActive = conversation?.status === 'active'; 

    const scrollToBottom = () => {
        messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
    };
    
    // Data Fetching - FIXED to prevent infinite loop
    const fetchChatAndSessionData = async () => {
        if (!chatId || !user?._id) return;

        try {
            // 1. Fetch chat history
            const messagesResponse = await api.get(`/chat/messages/${chatId}`);
            setMessages(messagesResponse.data || []);
            
            // 2. Fetch current active session ONLY ONCE
            if (!hasFetchedSession) {
                try {
                    console.log(`Attempting to fetch session for chatId: ${chatId}`);
                    const sessionResponse = await api.get(`/sessions/active/${chatId}`);
                    setCurrentSession(sessionResponse.data);
                    setSessionError(null);
                    setHasFetchedSession(true); // Mark as fetched
                } catch (sessionError) {
                    // Handle 404 specifically - no session exists yet (this is NORMAL)
                    if (sessionError.response?.status === 404) { 
                        console.log('No active session found for this chat (expected behavior)');
                        setCurrentSession(null);
                        setSessionError(null);
                        setHasFetchedSession(true); // Mark as fetched even if 404
                    } 
                    // Handle 500 errors - backend is having issues
                    else if (sessionError.response?.status === 500) {
                        console.error("Backend error fetching session:", sessionError.response?.data);
                        setSessionError('Unable to load session data. Backend error.');
                        setHasFetchedSession(true); // Don't keep retrying on 500
                    }
                    // Handle network errors (server down)
                    else if (sessionError.code === 'ERR_NETWORK' || sessionError.message.includes('ERR_CONNECTION')) {
                        console.error("Network error - backend may be down:", sessionError);
                        setSessionError('Cannot connect to server. Please check if the backend is running.');
                        setHasFetchedSession(true); // Don't keep retrying if server is down
                    } 
                    else {
                        console.error("Unexpected error fetching session:", sessionError);
                        setSessionError('Failed to load session data.');
                        setHasFetchedSession(true);
                    }
                }
            }
        } catch (error) {
            console.error("Error fetching chat data:", error);
            if (error.code === 'ERR_NETWORK') {
                setSessionError('Cannot connect to server. Please check if the backend is running.');
            }
        }
        scrollToBottom();
    };

    useEffect(() => {
        // Reset fetch flag when chatId changes
        setHasFetchedSession(false);
        setSessionError(null);
        setCurrentSession(null);
    }, [chatId]);

    useEffect(() => {
        if (chatId && user?._id) {
            fetchChatAndSessionData();

            if (socket) {
                socket.emit('joinChat', chatId);
                
                const handleReceiveMessage = (message) => {
                    setMessages((prevMessages) => [...prevMessages, message]);
                    scrollToBottom();
                };
                
                const handleMessageDeleted = ({ messageId }) => {
                    setMessages(prev => prev.map(msg => 
                        msg._id === messageId ? { ...msg, status: 'self_deleted' } : msg
                    ));
                };
                
                const handleNewSessionRequest = (data) => {
                    if (data.partnerId && data.partnerId.toString() === user._id.toString()) {
                        alert(data.message + " Please check your Confirm Sessions page.");
                    }
                    if (data.chatId === chatId) {
                        setHasFetchedSession(false); // Allow refetch after new session
                        fetchChatAndSessionData();
                    }
                };

                const handleSessionFinalized = (data) => {
                    if (data.sessionId) {
                        alert(data.message);
                        navigate(`/feedback/${data.sessionId}`);
                    }
                };
                
                const handleSessionCanceled = (data) => {
                    if (data.sessionId) {
                        alert(data.message);
                        setHasFetchedSession(false); // Allow refetch after cancellation
                        fetchChatAndSessionData();
                    }
                };
     
                socket.on('receiveMessage', handleReceiveMessage);
                socket.on('messageDeleted', handleMessageDeleted); 
                socket.on('newSessionRequest', handleNewSessionRequest);
                socket.on('sessionFinalized', handleSessionFinalized);
                socket.on('sessionCanceled', handleSessionCanceled);

                return () => {
                    socket.off('newSessionRequest', handleNewSessionRequest);
                    socket.off('sessionFinalized', handleSessionFinalized);
                    socket.off('sessionCanceled', handleSessionCanceled);
                    socket.off('receiveMessage', handleReceiveMessage);
                    socket.off('messageDeleted', handleMessageDeleted);
                };
            }
        }
    }, [chatId, socket, user?._id, navigate, hasFetchedSession]); // CHANGED: Use hasFetchedSession instead of retryCount


    const handleScheduleSubmit = async ({ scheduledAt, isBarter }) => {
        if (!isChatActive) { 
            alert('You must accept the connection to schedule.'); 
            return; 
        }
        
        try {
            await api.post('/chat/schedule', { 
                chatId, 
                scheduledAt, 
                isBarter 
            });
            alert(`Session proposed for ${new Date(scheduledAt).toLocaleString()}. Partner notified.`);
            setIsModalOpen(false);
            setHasFetchedSession(false); // Allow refetch after scheduling
            fetchChatAndSessionData();
        } catch (error) {
            console.error('Error scheduling session:', error);
            if (error.code === 'ERR_NETWORK' || error.message.includes('ERR_CONNECTION')) {
                alert('Cannot connect to server. Please check if the backend is running.');
            } else {
                alert('Failed to schedule session: ' + (error.response?.data?.message || 'Server error.'));
            }
        }
    };
    
    const handleMarkAsCompleted = async () => {
        if (!currentSession || currentSession.status !== 'scheduled') {
            alert('No active scheduled session to mark as complete.');
            return;
        }

        if (!window.confirm("Are you sure you want to mark this session as completed? Your partner must also confirm.")) {
            return;
        }

        setIsMarkingComplete(true);
        try {
            const response = await api.post(`/sessions/complete/${currentSession._id}`);
            
            if (response.data.message.includes('Session finalized')) {
                 alert(response.data.message);
                 setHasFetchedSession(false); // Allow refetch
                 fetchChatAndSessionData();
            } else {
                 alert(response.data.message);
            }

        } catch (error) {
            console.error('Error marking session complete:', error);
            alert('Failed to mark session as complete: ' + (error.response?.data?.message || 'Server error.'));
        } finally {
            setIsMarkingComplete(false);
        }
    };
    
    const startVideoCall = () => {
        if (!isChatActive) { 
            alert('You must accept the connection to start a video call.'); 
            return; 
        }
        if (!currentSession) {
            alert('You must schedule a session before starting a video call.');
            return;
        }
        navigate(`/video/${currentSession._id}`);
    };


    if (!conversation) {
        return (
            <div className="flex-grow flex items-center justify-center text-gray-500">
                Select a conversation or check your requests.
            </div>
        );
    }

    return (
        <div className="flex flex-col h-full border-l">
            <SessionSchedulerModal 
                isOpen={isModalOpen} 
                onClose={() => setIsModalOpen(false)}
                onSubmit={handleScheduleSubmit}
            />

            {/* Chat Header */}
            <div className="flex justify-between items-center p-4 border-b bg-white shadow-sm">
                <h3 className="text-lg font-semibold text-gray-800">{conversation.partnerName}</h3>
                <div className="flex space-x-3">
                    {isChatActive && (
                        <>
                            <Button 
                                variant="primary" 
                                className="p-2 bg-pink-600 hover:bg-pink-700" 
                                onClick={handleMarkAsCompleted} 
                                disabled={isMarkingComplete || !currentSession || currentSession.status !== 'scheduled'}
                                title={!currentSession ? "Session must be scheduled first" : "Mark as Completed"}
                            >
                                {isMarkingComplete ? <FaSpinner className="animate-spin"/> : <FaCheckCircle className="w-5 h-5" />}
                            </Button>
                            
                            <Button 
                                variant="secondary" 
                                className="p-2" 
                                onClick={() => setIsModalOpen(true)} 
                                disabled={!!currentSession || !!sessionError}
                                title={currentSession ? "Session already scheduled" : sessionError ? "Cannot schedule - backend error" : "Schedule a new session"}
                            >
                                <FaCalendarAlt className="w-5 h-5 text-indigo-500" />
                            </Button>
                            
                            <Button 
                                variant="secondary" 
                                className="p-2" 
                                onClick={startVideoCall} 
                                disabled={!currentSession}
                                title={!currentSession ? "Schedule a session first" : "Start video call"}
                            >
                                <FaVideo className="w-5 h-5 text-green-500" />
                            </Button>
                        </>
                    )}
                </div>
            </div>
            
            {/* Status Alert for Pending/Rejected Chats */}
            {conversation.status !== 'active' && (
                <div className="p-3 text-center bg-yellow-100 text-yellow-700 font-medium">
                    This chat is <strong>{conversation.status.toUpperCase()}</strong>. It must be accepted to start messaging.
                </div>
            )}
            
            {/* Backend Error Alert */}
            {sessionError && (
                <div className="p-3 text-center bg-red-100 text-red-700 font-medium flex items-center justify-center">
                    <FaExclamationTriangle className="mr-2" />
                    {sessionError} 
                    {sessionError.includes('backend') && (
                        <span className="ml-2 text-sm">
                            (Check server console logs for details)
                        </span>
                    )}
                </div>
            )}
            
            {/* Session Status Alert */}
            {currentSession && !sessionError && (
                <div className={`p-2 text-center font-medium text-sm ${
                    currentSession.status === 'scheduled' ? 'bg-blue-100 text-blue-700' : 
                    currentSession.status === 'completed' ? 'bg-green-100 text-green-700' :
                    'bg-gray-100 text-gray-700'
                }`}>
                    Session Status: <strong>{currentSession.status.toUpperCase()}</strong> | 
                    Scheduled: {new Date(currentSession.scheduledAt).toLocaleString()} 
                    {currentSession.isBarter ? ' (FREE Barter)' : ' (Credit Required)'}
                </div>
            )}

            {/* Message Area */}
            <div className="flex-grow p-6 overflow-y-auto space-y-4 bg-gray-50">
                 {messages.map((msg, index) => (
                    <MessageBubble
                        key={msg._id || index}
                        message={msg}
                        isCurrentUser={msg.sender?.toString() === user?._id?.toString()} 
                        socket={socket}
                        messageId={msg._id}
                    />
                ))}
                <div ref={messagesEndRef} />
            </div>

            {/* Message Input */}
            <MessageInput 
                chatId={chatId}
                senderId={user?._id}
                partnerId={conversation?.partnerId}
                socket={socket}
                disabled={!isChatActive || !isConnected}
            />
        </div>
    );
};

export default ChatWindow;