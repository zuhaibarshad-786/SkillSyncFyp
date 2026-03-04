import React, { useState, useEffect, useRef } from 'react';
import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';
import { FaRobot, FaPaperPlane, FaUser, FaYoutube } from 'react-icons/fa';
import Input from '../components/common/Input';
import Button from '../components/common/Button';
import api from '../api/axios';
import useAuth from '../hooks/useAuth.jsx';

/**
 * Extracts YouTube Video ID to generate a thumbnail URL
 */
const getYouTubeThumbnail = (url) => {
    const regExp = /^.*(youtu.be\/|v\/|u\/\w\/|embed\/|watch\?v=|&v=)([^#&?]*).*/;
    const match = url.match(regExp);
    return (match && match[2].length === 11) 
        ? `https://img.youtube.com/vi/${match[2]}/mqdefault.jpg` 
        : null;
};

const ChatMessage = ({ content, isAI, sender }) => {
    return (
        <div className={`flex w-full mb-6 ${isAI ? 'justify-start' : 'justify-end'}`}>
            <div className={`flex max-w-[85%] ${isAI ? 'flex-row' : 'flex-row-reverse'}`}>
                {/* Avatar */}
                <div className={`flex-shrink-0 flex items-center justify-center w-10 h-10 rounded-full shadow-md 
                    ${isAI ? 'bg-indigo-100 text-indigo-600 mr-3' : 'bg-indigo-600 text-white ml-3'}`}>
                    {isAI ? <FaRobot size={20} /> : <FaUser size={18} />}
                </div>

                {/* Bubble */}
                <div className={`relative px-5 py-3 rounded-2xl shadow-sm border transition-all
                    ${isAI 
                        ? 'bg-white border-gray-200 text-gray-800 rounded-tl-none' 
                        : 'bg-indigo-600 border-indigo-500 text-white rounded-tr-none'}`}>
                    
                    <p className="text-[10px] font-bold mb-1 opacity-60 uppercase tracking-widest">
                        {sender}
                    </p>

                    <div className={`prose prose-sm max-w-none ${isAI ? 'text-gray-700' : 'text-white'}`}>
                        <ReactMarkdown 
                            remarkPlugins={[remarkGfm]}
                            components={{
                                a: ({ node, ...props }) => {
                                    const isYouTube = props.href?.includes('youtube.com') || props.href?.includes('youtu.be');
                                    const thumb = isYouTube ? getYouTubeThumbnail(props.href) : null;

                                    if (thumb) {
                                        return (
                                            <div className="my-4 no-underline">
                                                <a href={props.href} target="_blank" rel="noopener noreferrer" className="block group">
                                                    <div className="relative overflow-hidden rounded-xl border border-gray-200 shadow-md bg-white transition-all group-hover:shadow-lg group-hover:scale-[1.01]">
                                                        <div className="relative">
                                                            <img src={thumb} alt="Thumbnail" className="w-full h-40 object-cover" />
                                                            <div className="absolute inset-0 flex items-center justify-center bg-black/10 group-hover:bg-black/0 transition-all">
                                                                <FaYoutube className="text-red-600 bg-white rounded-full p-1" size={40} />
                                                            </div>
                                                        </div>
                                                        <div className="p-3 text-gray-900 text-sm font-bold flex items-center truncate">
                                                            {props.children}
                                                        </div>
                                                    </div>
                                                </a>
                                            </div>
                                        );
                                    }
                                    return (
                                        <a 
                                            {...props} 
                                            target="_blank" 
                                            rel="noopener noreferrer"
                                            className={`${isAI ? 'text-indigo-600 underline font-semibold' : 'text-yellow-300 underline font-bold'} hover:opacity-80 transition-opacity`}
                                        />
                                    );
                                },
                                ul: ({node, ...props}) => <ul {...props} className="list-disc ml-4 mt-2 space-y-1" />,
                                hr: () => <hr className="my-4 border-gray-300 opacity-40" />,
                                strong: ({node, ...props}) => <strong {...props} className={isAI ? 'text-indigo-900 font-bold' : 'text-white font-bold'} />
                            }}
                        >
                            {content}
                        </ReactMarkdown>
                    </div>
                </div>
            </div>
        </div>
    );
};

const AIChatbotPage = () => {
    const { user } = useAuth();
    const [messages, setMessages] = useState([
        { 
            sender: 'SkillSync AI', 
            content: "Welcome! I'm your **SkillSync Assistant**. Ready to boost your skills? Type a skill you want to master, and I'll find you the best guides and videos!", 
            isAI: true 
        }
    ]);
    const [inputMessage, setInputMessage] = useState('');
    const [isSending, setIsSending] = useState(false);
    const messagesEndRef = useRef(null);

    const scrollToBottom = () => {
        messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
    };

    useEffect(scrollToBottom, [messages]);

    const handleSend = async (e) => {
        e.preventDefault();
        const content = inputMessage.trim();
        if (!content || isSending) return;

        const newUserMessage = { sender: user?.name || 'You', content: content, isAI: false };
        setMessages(prev => [...prev, newUserMessage]);
        setInputMessage('');
        setIsSending(true);

        const placeholderId = Date.now();
        setMessages(prev => [...prev, { sender: 'SkillSync AI', content: '✨ Thinking...', isAI: true, id: placeholderId }]);

        try {
            const response = await api.post('/ai/chat', { message: content });
            setMessages(prev => prev.map(msg => 
                msg.id === placeholderId ? { ...msg, content: response.data.response, id: undefined } : msg
            ));
        } catch (error) {
            setMessages(prev => prev.map(msg => 
                msg.id === placeholderId ? { ...msg, content: '❌ **Oops!** I ran into a connection issue. Please try again.', id: undefined } : msg
            ));
        } finally {
            setIsSending(false);
        }
    };

    return (
        <div className="max-w-5xl mx-auto h-[85vh] flex flex-col bg-white rounded-3xl shadow-2xl overflow-hidden border border-gray-100">
            {/* Header */}
            <div className="bg-gradient-to-r from-indigo-600 to-violet-700 px-8 py-5 flex items-center justify-between shadow-lg">
                <div className="flex items-center space-x-4">
                    <div className="p-2.5 bg-white/20 backdrop-blur-md rounded-xl text-white">
                        <FaRobot size={28} />
                    </div>
                    <div>
                        <h2 className="text-xl font-extrabold text-white tracking-tight">SkillSync AI</h2>
                        <div className="flex items-center text-xs text-indigo-100 font-medium">
                            <span className="w-2 h-2 bg-green-400 rounded-full mr-2 animate-pulse"></span>
                            Expert Recommendations Active
                        </div>
                    </div>
                </div>
            </div>

            {/* Chat Area */}
            <div className="flex-grow overflow-y-auto p-8 bg-slate-50/50 scrollbar-thin scrollbar-thumb-indigo-200">
                {messages.map((msg, index) => (
                    <ChatMessage key={index} {...msg} />
                ))}
                <div ref={messagesEndRef} />
            </div>

            {/* Input Bar */}
            <div className="p-6 bg-white border-t border-gray-100">
                <form onSubmit={handleSend} className="relative flex items-center group">
                    <div className="absolute left-5 text-indigo-400 group-focus-within:text-indigo-600 transition-colors">
                        <FaPaperPlane size={16} className="rotate-45" />
                    </div>
                    <input
                        type="text"
                        placeholder="What do you want to learn today?"
                        value={inputMessage}
                        onChange={(e) => setInputMessage(e.target.value)}
                        className="w-full pl-12 pr-20 py-4 bg-gray-50 border-2 border-transparent rounded-2xl focus:bg-white focus:border-indigo-500 focus:outline-none text-gray-700 transition-all shadow-inner"
                        disabled={isSending}
                    />
                    <button
                        type="submit"
                        disabled={!inputMessage.trim() || isSending}
                        className={`absolute right-2 px-6 py-2.5 rounded-xl font-bold transition-all ${
                            !inputMessage.trim() || isSending 
                            ? 'bg-gray-200 text-gray-400 cursor-not-allowed' 
                            : 'bg-indigo-600 text-white hover:bg-indigo-700 hover:shadow-lg active:scale-95'
                        }`}
                    >
                        {isSending ? '...' : 'Send'}
                    </button>
                </form>
            </div>
        </div>
    );
};

export default AIChatbotPage;