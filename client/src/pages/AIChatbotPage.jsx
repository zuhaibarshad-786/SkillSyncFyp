// client/src/pages/AIChatbotPage.jsx (NEW)

import React, { useState, useEffect, useRef } from 'react';
import { FaRobot, FaPaperPlane, FaCommentDots } from 'react-icons/fa';
import Input from '../components/common/Input';
import Button from '../components/common/Button';
import api from '../api/axios';
import useAuth from '../hooks/useAuth.jsx';

// Simple component to render AI response safely (handles Markdown formatting)
const ChatMessage = ({ sender, content, isAI }) => {
    const messageClass = isAI 
        ? 'bg-gray-100 text-gray-800 self-start rounded-tr-xl' 
        : 'bg-indigo-600 text-white self-end rounded-tl-xl';
    
    // NOTE: Uses basic pre-wrap for preserving markdown formatting
    const formattedContent = content.split('\n').map((line, index) => (
        <span key={index}>{line}<br /></span>
    ));

    return (
        <div className={`flex flex-col max-w-lg mb-4 ${isAI ? 'items-start' : 'items-end'}`}>
            <div className={`px-4 py-3 rounded-xl shadow-md whitespace-pre-wrap ${messageClass}`}>
                {formattedContent}
            </div>
        </div>
    );
};


const AIChatbotPage = () => {
    const { user } = useAuth();
    const [messages, setMessages] = useState([
        { sender: 'AI', content: "Hello! I'm your SkillSync AI Assistant. Tell me what skill you want to learn, and I'll find relevant resources!", isAI: true }
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

        // 1. Add user message to state
        const newUserMessage = { sender: user?.name || 'You', content: content, isAI: false };
        setMessages(prev => [...prev, newUserMessage]);
        setInputMessage('');
        setIsSending(true);

        // 2. Add AI typing placeholder
        const placeholderId = Date.now();
        const placeholderMessage = { sender: 'AI', content: '...', isAI: true, id: placeholderId };
        setMessages(prev => [...prev, placeholderMessage]);

        try {
            // 3. Call the backend API
            const response = await api.post('/ai/chat', { message: content });
            
            const aiResponse = response.data.response;

            // 4. Replace placeholder with actual AI response
            setMessages(prev => prev.map(msg => 
                msg.id === placeholderId ? { ...msg, content: aiResponse, id: undefined } : msg
            ));
            
        } catch (error) {
            console.error("AI Chatbot Error:", error);
            // 5. Replace placeholder with error message
            setMessages(prev => prev.map(msg => 
                msg.id === placeholderId ? { ...msg, content: 'Sorry, I hit an error. Please try again later.', id: undefined } : msg
            ));
        } finally {
            setIsSending(false);
        }
    };

    return (
        <div className="flex flex-col h-[80vh] bg-white rounded-lg shadow-xl overflow-hidden">
            {/* Chatbot Header */}
            <div className="flex items-center p-4 border-b bg-indigo-600 text-white">
                <FaRobot className="mr-3 w-6 h-6" />
                <h2 className="text-xl font-semibold">SkillSync AI Chatbot</h2>
            </div>

            {/* Message Area */}
            <div className="flex-grow p-6 overflow-y-auto space-y-4 bg-gray-50">
                {messages.map((msg, index) => (
                    <ChatMessage 
                        key={index} 
                        sender={msg.sender} 
                        content={msg.content} 
                        isAI={msg.isAI} 
                    />
                ))}
                <div ref={messagesEndRef} />
            </div>

            {/* Input Area */}
            <form onSubmit={handleSend} className="p-4 bg-white border-t flex items-center space-x-3">
                <Input
                    type="text"
                    placeholder="Ask the AI what you want to learn..."
                    value={inputMessage}
                    onChange={(e) => setInputMessage(e.target.value)}
                    className="flex-grow p-3"
                    required
                />
                <Button
                    type="submit"
                    variant="primary"
                    isLoading={isSending}
                    disabled={!inputMessage.trim()}
                    className="w-12 h-12 rounded-full p-0 flex items-center justify-center"
                >
                    <FaPaperPlane className="w-4 h-4" />
                </Button>
            </form>
        </div>
    );
};

export default AIChatbotPage;