// client/src/components/chat/ChatWindow.jsx
import React, { useState, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { useSocket } from '../../hooks/useSocket.jsx';
import { useAuth } from '../../hooks/useAuth.jsx';
import api from '../../api/axios';
import {
    FaVideo, FaCalendarAlt, FaEllipsisV, FaTrashAlt,
    FaCheckCircle, FaSpinner, FaExclamationTriangle, FaClock,
    FaComments, FaWifi,
} from 'react-icons/fa';
import MessageInput from './MessageInput';
import Button from '../common/Button';
import SessionSchedulerModal from './SessionSchedulerModal';


// ─── Message Bubble ───────────────────────────────────────────────────────────
const MessageBubble = ({ message, isCurrentUser, onDeleteForMe, onDeleteForEveryone }) => {
    const [isMenuOpen, setIsMenuOpen] = useState(false);

    if (message.deletedForEveryone) {
        return (
            <div className={`flex ${isCurrentUser ? 'justify-end' : 'justify-start'}`}>
                <div className="max-w-xs px-4 py-2 rounded-xl bg-gray-100 text-gray-400 text-xs italic shadow-sm">
                    🚫 This message was deleted.
                </div>
            </div>
        );
    }

    return (
        <div className={`flex ${isCurrentUser ? 'justify-end' : 'justify-start'} group`}>
            <div className="flex items-start gap-1">
                <div className={`relative self-center opacity-0 group-hover:opacity-100 transition-opacity ${isCurrentUser ? 'order-first' : 'order-last'}`}>
                    <button
                        onClick={() => setIsMenuOpen(!isMenuOpen)}
                        className="text-gray-400 hover:text-gray-600 p-1"
                    >
                        <FaEllipsisV className="w-3 h-3" />
                    </button>
                    {isMenuOpen && (
                        <div className={`absolute ${isCurrentUser ? 'right-full' : 'left-full'} top-0 w-48 bg-white border rounded-lg shadow-xl z-20 overflow-hidden`}>
                            <button
                                onClick={() => { onDeleteForMe(message._id); setIsMenuOpen(false); }}
                                className="flex items-center w-full px-3 py-2 text-xs text-gray-700 hover:bg-gray-50"
                            >
                                <FaTrashAlt className="mr-2 text-gray-400" /> Delete for me
                            </button>
                            {isCurrentUser && (
                                <button
                                    onClick={() => { onDeleteForEveryone(message._id); setIsMenuOpen(false); }}
                                    className="flex items-center w-full px-3 py-2 text-xs text-red-600 hover:bg-red-50"
                                >
                                    <FaTrashAlt className="mr-2" /> Delete for everyone
                                </button>
                            )}
                        </div>
                    )}
                </div>

                <div className={`max-w-xs lg:max-w-md px-4 py-2 rounded-xl shadow-md text-sm ${
                    isCurrentUser
                        ? 'bg-indigo-600 text-white rounded-br-none'
                        : 'bg-gray-200 text-gray-800 rounded-tl-none'
                }`}>
                    {!isCurrentUser && message.sender?.name && (
                        <p className="text-xs font-semibold text-indigo-600 mb-1">{message.sender.name}</p>
                    )}
                    {message.content}
                    <span className={`block text-xs mt-1 ${isCurrentUser ? 'text-indigo-200' : 'text-gray-500'}`}>
                        {new Date(message.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                    </span>
                </div>
            </div>
        </div>
    );
};


// ─── Session Banner ───────────────────────────────────────────────────────────
const SessionBanner = ({ session }) => {
    if (!session) return null;

    const isExpired = session.status === 'expired' ||
        (session.status === 'scheduled' && new Date(session.scheduledAt) < new Date());

    if (isExpired) return null;

    const colors = {
        scheduled:   'bg-blue-50 text-blue-700',
        completed:   'bg-green-50 text-green-700',
        rated:       'bg-purple-50 text-purple-700',
        in_progress: 'bg-yellow-50 text-yellow-700',
    };

    return (
        <div className={`p-2 text-center text-sm font-medium border-b ${colors[session.status] || 'bg-gray-50 text-gray-600'}`}>
            📅 Session: <strong>{session.status.toUpperCase()}</strong> &nbsp;|&nbsp;
            {new Date(session.scheduledAt).toLocaleString()}
            {session.isBarter ? ' · FREE Barter' : ' · Credit Used'}
        </div>
    );
};


// ─── Chat Window ─────────────────────────────────────────────────────────────
const ChatWindow = ({ conversation }) => {
    const navigate = useNavigate();
    const { socket, isConnected } = useSocket();
    const { user } = useAuth();
    const [messages, setMessages]               = useState([]);
    const [currentSession, setCurrentSession]   = useState(null);
    const [isMarkingComplete, setIsMarkingComplete] = useState(false);
    const [isModalOpen, setIsModalOpen]         = useState(false);
    const [sessionError, setSessionError]       = useState(null);
    const [hasFetchedSession, setHasFetchedSession] = useState(false);
    const [isCallingOut, setIsCallingOut]       = useState(false);

    const isCallingOutRef   = useRef(false);
    const currentSessionRef = useRef(null);
    const messagesEndRef    = useRef(null);

    const chatId       = conversation?.chatId;
    const isChatActive = conversation?.status === 'active';

    // FIX: MessageInput disabled only when chat is inactive (not when socket
    // temporarily reconnects). isConnected fluctuates during transport upgrade
    // (polling → websocket) and causes false-positive "disabled" states in
    // production. The socket itself still queues and delivers messages even
    // during brief reconnects.
    const isInputDisabled = !isChatActive;

    useEffect(() => { isCallingOutRef.current   = isCallingOut;   }, [isCallingOut]);
    useEffect(() => { currentSessionRef.current = currentSession; }, [currentSession]);

    const isSessionActive = currentSession &&
        currentSession.status === 'scheduled' &&
        new Date(currentSession.scheduledAt) > new Date();

    const scrollToBottom = () => messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });

    // ── Fetch messages + session ──────────────────────────────────────────────
    const fetchChatAndSessionData = async () => {
        if (!chatId || !user?._id) return;

        try {
            const messagesRes = await api.get(`/chat/messages/${chatId}`);
            setMessages(messagesRes.data || []);
            scrollToBottom();
        } catch (err) {
            console.error('Error fetching messages:', err);
        }

        if (!hasFetchedSession) {
            try {
                const sessionRes = await api.get(`/sessions/active/${chatId}`);
                const session = sessionRes.data;

                if (session && session.status === 'scheduled' && new Date(session.scheduledAt) < new Date()) {
                    try { await api.patch(`/sessions/expire/${session._id}`); } catch (_) {}
                    setCurrentSession(null);
                } else {
                    setCurrentSession(session);
                }
                setSessionError(null);
            } catch (err) {
                if (err.response?.status === 404) {
                    setCurrentSession(null);
                    setSessionError(null);
                } else {
                    setSessionError('Unable to load session data.');
                }
            } finally {
                setHasFetchedSession(true);
            }
        }
    };

    useEffect(() => {
        setHasFetchedSession(false);
        setSessionError(null);
        setCurrentSession(null);
        setMessages([]);
    }, [chatId]);

    // ── Socket setup + initial fetch ──────────────────────────────────────────
    useEffect(() => {
        if (!chatId || !user?._id) return;
        fetchChatAndSessionData();
        if (!socket) return;

        socket.emit('joinChat', chatId);

        const handleReceiveMessage = (message) => {
            setMessages(prev => [...prev, message]);
            scrollToBottom();
        };

        const handleMessageDeletedForEveryone = ({ messageId }) => {
            setMessages(prev => prev.map(msg =>
                msg._id === messageId
                    ? { ...msg, deletedForEveryone: true, content: 'This message was deleted.' }
                    : msg
            ));
        };

        const handleConversationUpdated = ({ chatId: updatedChatId }) => {
            if (updatedChatId === chatId) fetchChatAndSessionData();
        };

        const handleNewSessionRequest = (data) => {
            if (data.chatId === chatId) {
                alert(data.message);
                setHasFetchedSession(false);
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
                setHasFetchedSession(false);
            }
        };

        // ── Call signaling ────────────────────────────────────────────────────
        const handleCallRinging = ({ sessionId }) => {
            console.log('📞 Call ringing — waiting for partner…', sessionId);
        };

        const handleCallAccepted = ({ sessionId }) => {
            setIsCallingOut(false);
            navigate(`/video/${sessionId}`);
        };

        const handleCallRejected = ({ sessionId, message: msg }) => {
            setIsCallingOut(false);
            alert(msg || 'Call was declined by partner.');
        };

        const handleCallEnded = () => {
            if (isCallingOutRef.current) setIsCallingOut(false);
        };

        const handleCallError = ({ message: msg }) => {
            setIsCallingOut(false);
            alert('Call error: ' + msg);
        };

        socket.on('receiveMessage',              handleReceiveMessage);
        socket.on('messageDeletedForEveryone',   handleMessageDeletedForEveryone);
        socket.on('conversationUpdated',         handleConversationUpdated);
        socket.on('newSessionRequest',           handleNewSessionRequest);
        socket.on('sessionFinalized',            handleSessionFinalized);
        socket.on('sessionCanceled',             handleSessionCanceled);
        socket.on('callRinging',                 handleCallRinging);
        socket.on('callAccepted',                handleCallAccepted);
        socket.on('callRejected',                handleCallRejected);
        socket.on('callEnded',                   handleCallEnded);
        socket.on('callError',                   handleCallError);

        return () => {
            socket.off('receiveMessage',            handleReceiveMessage);
            socket.off('messageDeletedForEveryone', handleMessageDeletedForEveryone);
            socket.off('conversationUpdated',       handleConversationUpdated);
            socket.off('newSessionRequest',         handleNewSessionRequest);
            socket.off('sessionFinalized',          handleSessionFinalized);
            socket.off('sessionCanceled',           handleSessionCanceled);
            socket.off('callRinging',               handleCallRinging);
            socket.off('callAccepted',              handleCallAccepted);
            socket.off('callRejected',              handleCallRejected);
            socket.off('callEnded',                 handleCallEnded);
            socket.off('callError',                 handleCallError);
            socket.emit('leaveChat', chatId);
        };
    }, [chatId, socket, user?._id]);

    useEffect(() => {
        if (!hasFetchedSession && chatId) fetchChatAndSessionData();
    }, [hasFetchedSession]);

    // ── Delete for me ─────────────────────────────────────────────────────────
    const handleDeleteForMe = async (messageId) => {
        try {
            await api.delete(`/chat/message/${messageId}/delete-for-me`);
            setMessages(prev => prev.filter(msg => msg._id !== messageId));
        } catch {
            alert('Failed to delete message.');
        }
    };

    // ── Delete for everyone ───────────────────────────────────────────────────
    const handleDeleteForEveryone = async (messageId) => {
        if (!window.confirm('Delete this message for everyone?')) return;
        try {
            await api.delete(`/chat/message/${messageId}/delete-for-everyone`);
            socket?.emit('messageDeletedForEveryone', { chatId, messageId });
            setMessages(prev => prev.map(msg =>
                msg._id === messageId
                    ? { ...msg, deletedForEveryone: true, content: 'This message was deleted.' }
                    : msg
            ));
        } catch (err) {
            alert(err.response?.data?.message || 'Failed to delete message for everyone.');
        }
    };

    // ── Schedule session ──────────────────────────────────────────────────────
    const handleScheduleSubmit = async ({ scheduledAt, isBarter }) => {
        if (!isChatActive) { alert('Connection must be accepted first.'); return; }
        try {
            await api.post('/chat/schedule', { chatId, scheduledAt, isBarter });
            alert(`Session proposed for ${new Date(scheduledAt).toLocaleString()}. Partner notified.`);
            setIsModalOpen(false);
            setHasFetchedSession(false);
        } catch (err) {
            alert('Failed to schedule: ' + (err.response?.data?.message || 'Server error.'));
        }
    };

    // ── Mark as completed ─────────────────────────────────────────────────────
    const handleMarkAsCompleted = async () => {
        if (!isSessionActive) { alert('No valid scheduled session to mark as complete.'); return; }
        if (!window.confirm('Mark session as completed? Partner must also confirm.')) return;
        setIsMarkingComplete(true);
        try {
            const res = await api.post(`/sessions/complete/${currentSession._id}`);
            alert(res.data.message);
            setHasFetchedSession(false);
        } catch (err) {
            alert('Failed: ' + (err.response?.data?.message || 'Server error.'));
        } finally {
            setIsMarkingComplete(false);
        }
    };

    // ── Video call — initiate ─────────────────────────────────────────────────
    const startVideoCall = () => {
        if (!isChatActive)    { alert('Connection must be accepted first.'); return; }
        if (!isSessionActive) { alert('Schedule a valid upcoming session first.'); return; }
        if (!socket)          { alert('Not connected to server.'); return; }

        setIsCallingOut(true);
        socket.emit('initiateCall', { sessionId: currentSession._id });
    };

    const cancelOutgoingCall = () => {
        if (socket && currentSession) {
            socket.emit('endCall', { roomId: currentSession._id.toString() });
        }
        setIsCallingOut(false);
    };

    // ── Empty state ───────────────────────────────────────────────────────────
    if (!conversation) {
        return (
            <div className="flex-grow flex items-center justify-center text-gray-400 h-full flex-col gap-2">
                <FaComments className="text-4xl" />
                <p>Select a conversation to start chatting.</p>
            </div>
        );
    }

    return (
        <div className="flex flex-col h-full">
            <SessionSchedulerModal
                isOpen={isModalOpen}
                onClose={() => setIsModalOpen(false)}
                onSubmit={handleScheduleSubmit}
            />

            {/* ── Header ── */}
            <div className="flex justify-between items-center px-4 py-3 border-b bg-white shadow-sm">
                <div className="flex items-center gap-2">
                    <div>
                        <h3 className="font-semibold text-gray-800 text-base">{conversation.partnerName}</h3>
                        <span className={`text-xs px-2 py-0.5 rounded-full font-medium ${
                            isChatActive ? 'bg-green-100 text-green-700' : 'bg-yellow-100 text-yellow-700'
                        }`}>
                            {conversation.status.toUpperCase()}
                        </span>
                    </div>
                    {/* Connection status indicator — informational only, never blocks chat */}
                    <span
                        title={isConnected ? 'Real-time connected' : 'Reconnecting…'}
                        className={`w-2 h-2 rounded-full flex-shrink-0 ${isConnected ? 'bg-green-400' : 'bg-yellow-400 animate-pulse'}`}
                    />
                </div>

                {isChatActive && (
                    <div className="flex items-center gap-2">
                        {/* Mark Complete */}
                        <button
                            onClick={handleMarkAsCompleted}
                            disabled={isMarkingComplete || !isSessionActive}
                            title={!isSessionActive ? 'No active scheduled session' : 'Mark session as completed'}
                            className={`w-9 h-9 rounded-full flex items-center justify-center transition
                                ${isSessionActive
                                    ? 'bg-pink-500 hover:bg-pink-600 text-white shadow'
                                    : 'bg-gray-100 text-gray-300 cursor-not-allowed'}`}
                        >
                            {isMarkingComplete
                                ? <FaSpinner className="animate-spin w-4 h-4" />
                                : <FaCheckCircle className="w-4 h-4" />}
                        </button>

                        {/* Schedule */}
                        <button
                            onClick={() => setIsModalOpen(true)}
                            disabled={!!isSessionActive}
                            title={isSessionActive ? 'Session already scheduled' : 'Schedule a new session'}
                            className={`w-9 h-9 rounded-full flex items-center justify-center transition
                                ${!isSessionActive
                                    ? 'bg-indigo-100 hover:bg-indigo-200 text-indigo-600 shadow'
                                    : 'bg-gray-100 text-gray-300 cursor-not-allowed'}`}
                        >
                            <FaCalendarAlt className="w-4 h-4" />
                        </button>

                        {/* Video Call */}
                        {isCallingOut ? (
                            <div className="flex items-center gap-2">
                                <span className="text-xs text-green-600 font-medium animate-pulse">Calling…</span>
                                <button
                                    onClick={cancelOutgoingCall}
                                    title="Cancel call"
                                    className="w-9 h-9 rounded-full flex items-center justify-center bg-red-100 hover:bg-red-200 text-red-600 shadow transition"
                                >
                                    ✕
                                </button>
                            </div>
                        ) : (
                            <button
                                onClick={startVideoCall}
                                disabled={!isSessionActive}
                                title={!isSessionActive ? 'Schedule a session first' : 'Start video call'}
                                className={`w-9 h-9 rounded-full flex items-center justify-center transition
                                    ${isSessionActive
                                        ? 'bg-green-100 hover:bg-green-200 text-green-600 shadow'
                                        : 'bg-gray-100 text-gray-300 cursor-not-allowed'}`}
                            >
                                <FaVideo className="w-4 h-4" />
                            </button>
                        )}
                    </div>
                )}
            </div>

            {/* Pending/Rejected Alert */}
            {!isChatActive && (
                <div className="p-3 text-center bg-yellow-50 text-yellow-700 text-sm font-medium border-b">
                    Chat is <strong>{conversation.status.toUpperCase()}</strong>.
                    {conversation.status === 'pending' && ' Waiting for acceptance.'}
                </div>
            )}

            {/* Session Error */}
            {sessionError && (
                <div className="p-2 text-center bg-red-50 text-red-600 text-xs flex items-center justify-center border-b gap-2">
                    <FaExclamationTriangle /> {sessionError}
                </div>
            )}

            {/* Session Banner */}
            <SessionBanner session={isSessionActive ? currentSession : null} />

            {/* Expired session notice */}
            {currentSession && !isSessionActive && currentSession.status === 'scheduled' && (
                <div className="p-2 text-center bg-gray-50 text-gray-400 text-xs border-b flex items-center justify-center gap-1">
                    <FaClock className="w-3 h-3" />
                    Previous session expired. You can schedule a new one.
                </div>
            )}

            {/* Messages */}
            <div className="flex-grow p-4 overflow-y-auto space-y-3 bg-gray-50">
                {messages.length === 0 && isChatActive && (
                    <div className="text-center text-gray-400 text-sm mt-8">
                        No messages yet. Say hello! 👋
                    </div>
                )}
                {messages.map((msg, index) => (
                    <MessageBubble
                        key={msg._id || index}
                        message={msg}
                        isCurrentUser={(msg.sender?._id || msg.sender)?.toString() === user?._id?.toString()}
                        onDeleteForMe={handleDeleteForMe}
                        onDeleteForEveryone={handleDeleteForEveryone}
                    />
                ))}
                <div ref={messagesEndRef} />
            </div>

            {/* Message Input — disabled ONLY when chat is not yet accepted */}
            <MessageInput
                chatId={chatId}
                senderId={user?._id}
                receiverId={conversation?.partnerId}
                socket={socket}
                disabled={isInputDisabled}
            />
        </div>
    );
};

export default ChatWindow;