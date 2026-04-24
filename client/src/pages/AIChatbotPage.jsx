// client/src/pages/AIChatbotPage.jsx
import React, { useState, useEffect, useRef } from 'react';
import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';
import { FaRobot, FaPaperPlane, FaUser, FaYoutube } from 'react-icons/fa';
import api from '../api/axios';
import useAuth from '../hooks/useAuth.jsx';

const getYouTubeThumbnail = (url) => {
    const regExp = /^.*(youtu.be\/|v\/|u\/\w\/|embed\/|watch\?v=|&v=)([^#&?]*).*/;
    const match  = url.match(regExp);
    return (match && match[2].length === 11)
        ? `https://img.youtube.com/vi/${match[2]}/mqdefault.jpg`
        : null;
};

const ChatMessage = ({ content, isAI, sender }) => (
    <div className={`flex w-full mb-4 sm:mb-6 ${isAI ? 'justify-start' : 'justify-end'}`}>
        <div className={`flex max-w-[90%] sm:max-w-[85%] ${isAI ? 'flex-row' : 'flex-row-reverse'}`}>
            {/* Avatar */}
            <div className={`flex-shrink-0 flex items-center justify-center w-8 h-8 sm:w-10 sm:h-10 rounded-full shadow-md ${
                isAI ? 'bg-indigo-100 text-indigo-600 mr-2 sm:mr-3' : 'bg-indigo-600 text-white ml-2 sm:ml-3'
            }`}>
                {isAI ? <FaRobot size={16} /> : <FaUser size={14} />}
            </div>

            {/* Bubble */}
            <div className={`relative px-3 sm:px-5 py-2.5 sm:py-3 rounded-2xl shadow-sm border ${
                isAI
                    ? 'bg-white border-gray-200 text-gray-800 rounded-tl-none'
                    : 'bg-indigo-600 border-indigo-500 text-white rounded-tr-none'
            }`}>
                <p className="text-[9px] sm:text-[10px] font-bold mb-1 opacity-60 uppercase tracking-widest">
                    {sender}
                </p>
                <div className={`prose prose-sm max-w-none text-sm ${isAI ? 'text-gray-700' : 'text-white'}`}>
                    <ReactMarkdown
                        remarkPlugins={[remarkGfm]}
                        components={{
                            a: ({ node, ...props }) => {
                                const isYouTube = props.href?.includes('youtube.com') || props.href?.includes('youtu.be');
                                const thumb     = isYouTube ? getYouTubeThumbnail(props.href) : null;
                                if (thumb) {
                                    return (
                                        <div className="my-3">
                                            <a href={props.href} target="_blank" rel="noopener noreferrer" className="block group">
                                                <div className="relative overflow-hidden rounded-xl border border-gray-200 shadow-md bg-white transition-all group-hover:shadow-lg">
                                                    <div className="relative">
                                                        <img src={thumb} alt="Thumbnail" className="w-full h-32 sm:h-40 object-cover" />
                                                        <div className="absolute inset-0 flex items-center justify-center bg-black/10 group-hover:bg-black/0 transition-all">
                                                            <FaYoutube className="text-red-600 bg-white rounded-full p-1" size={36} />
                                                        </div>
                                                    </div>
                                                    <div className="p-2 sm:p-3 text-gray-900 text-xs sm:text-sm font-bold flex items-center truncate">
                                                        {props.children}
                                                    </div>
                                                </div>
                                            </a>
                                        </div>
                                    );
                                }
                                return (
                                    <a {...props} target="_blank" rel="noopener noreferrer"
                                        className={`${isAI ? 'text-indigo-600 underline font-semibold' : 'text-yellow-300 underline font-bold'} hover:opacity-80`}
                                    />
                                );
                            },
                            ul:     ({ node, ...props }) => <ul {...props} className="list-disc ml-4 mt-2 space-y-1" />,
                            hr:     () => <hr className="my-4 border-gray-300 opacity-40" />,
                            strong: ({ node, ...props }) => <strong {...props} className={isAI ? 'text-indigo-900 font-bold' : 'text-white font-bold'} />,
                        }}
                    >
                        {content}
                    </ReactMarkdown>
                </div>
            </div>
        </div>
    </div>
);

const AIChatbotPage = () => {
    const { user } = useAuth();
    const [messages, setMessages] = useState([{
        sender:  'SkillSync AI',
        content: "Welcome! I'm your **SkillSync Assistant**. Ready to boost your skills? Type a skill you want to master!",
        isAI:    true,
    }]);
    const [inputMessage, setInputMessage] = useState('');
    const [isSending, setIsSending]       = useState(false);
    const messagesEndRef                  = useRef(null);

    useEffect(() => { messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' }); }, [messages]);

    const handleSend = async (e) => {
        e.preventDefault();
        const content = inputMessage.trim();
        if (!content || isSending) return;

        setMessages(prev => [...prev, { sender: user?.name || 'You', content, isAI: false }]);
        setInputMessage('');
        setIsSending(true);

        const placeholderId = Date.now();
        setMessages(prev => [...prev, { sender: 'SkillSync AI', content: '✨ Thinking...', isAI: true, id: placeholderId }]);

        try {
            const response = await api.post('/ai/chat', { message: content });
            setMessages(prev => prev.map(msg =>
                msg.id === placeholderId ? { ...msg, content: response.data.response, id: undefined } : msg
            ));
        } catch {
            setMessages(prev => prev.map(msg =>
                msg.id === placeholderId ? { ...msg, content: '❌ **Oops!** Connection issue. Please try again.', id: undefined } : msg
            ));
        } finally {
            setIsSending(false);
        }
    };

    return (
        // Use dvh for mobile browser chrome safety
        <div className="flex flex-col bg-white rounded-2xl sm:rounded-3xl shadow-2xl overflow-hidden border border-gray-100"
            style={{ height: 'calc(100dvh - 120px)', minHeight: '400px', maxHeight: '85vh' }}
        >
            {/* Header */}
            <div className="bg-gradient-to-r from-indigo-600 to-violet-700 px-4 sm:px-8 py-3 sm:py-5 flex items-center gap-3 sm:gap-4 shadow-lg shrink-0">
                <div className="p-2 bg-white/20 backdrop-blur-md rounded-xl text-white">
                    <FaRobot size={22} />
                </div>
                <div>
                    <h2 className="text-base sm:text-xl font-extrabold text-white tracking-tight">SkillSync AI</h2>
                    <div className="flex items-center text-xs text-indigo-100 font-medium">
                        <span className="w-1.5 h-1.5 sm:w-2 sm:h-2 bg-green-400 rounded-full mr-1.5 animate-pulse" />
                        Expert Recommendations Active
                    </div>
                </div>
            </div>

            {/* Chat area */}
            <div className="flex-grow overflow-y-auto p-4 sm:p-8 bg-slate-50/50">
                {messages.map((msg, index) => (
                    <ChatMessage key={index} {...msg} />
                ))}
                <div ref={messagesEndRef} />
            </div>

            {/* Input */}
            <div className="p-3 sm:p-6 bg-white border-t border-gray-100 shrink-0">
                <form onSubmit={handleSend} className="relative flex items-center gap-2">
                    <input
                        type="text"
                        placeholder="What do you want to learn today?"
                        value={inputMessage}
                        onChange={(e) => setInputMessage(e.target.value)}
                        className="flex-1 pl-4 sm:pl-12 pr-2 py-3 sm:py-4 bg-gray-50 border-2 border-transparent rounded-xl sm:rounded-2xl focus:bg-white focus:border-indigo-500 focus:outline-none text-gray-700 text-sm transition-all"
                        disabled={isSending}
                    />
                    <button
                        type="submit"
                        disabled={!inputMessage.trim() || isSending}
                        className={`shrink-0 px-4 sm:px-6 py-3 sm:py-4 rounded-xl font-bold text-sm transition-all ${
                            !inputMessage.trim() || isSending
                                ? 'bg-gray-200 text-gray-400 cursor-not-allowed'
                                : 'bg-indigo-600 text-white hover:bg-indigo-700 active:scale-95'
                        }`}
                    >
                        {isSending ? '...' : <FaPaperPlane className="rotate-45" />}
                    </button>
                </form>
            </div>
        </div>
    );
};

export default AIChatbotPage;