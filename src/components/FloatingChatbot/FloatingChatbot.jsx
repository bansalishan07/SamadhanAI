import { useState, useRef, useEffect } from 'react';
import { processChat } from '../../services/hybridChatbotService';
import './FloatingChatbot.css';
import { HiChat, HiX, HiPaperAirplane, HiPhone } from 'react-icons/hi';

export default function FloatingChatbot() {
    const [isOpen, setIsOpen] = useState(false);
    const [messages, setMessages] = useState([
        { role: 'assistant', text: 'Hello! I am your Smart Civic Assistant. How can I help you today? You can ask me how to register a complaint or give me a Complaint ID to track it.' }
    ]);
    const [input, setInput] = useState('');
    const [context, setContext] = useState(null);
    const [isTyping, setIsTyping] = useState(false);
    const [isContactOpen, setIsContactOpen] = useState(false);
    const chatEndRef = useRef(null);
    const inputRef = useRef(null);

    // Auto-scroll to bottom of chat
    useEffect(() => {
        if (isOpen) {
            chatEndRef.current?.scrollIntoView({ behavior: 'smooth' });
        }
    }, [messages, isOpen, isTyping]);

    // Focus input when opened
    useEffect(() => {
        if (isOpen) {
            setTimeout(() => inputRef.current?.focus(), 100);
        }
    }, [isOpen]);

    const handleSend = async (textOverride) => {
        const textToProcess = textOverride || input;
        if (!textToProcess.trim() || isTyping) return;

        // Add user message
        const newMessages = [...messages, { role: 'user', text: textToProcess }];
        setMessages(newMessages);
        setInput('');
        setIsTyping(true);

        try {
            // Simulated network delay for realism (300-800ms)
            await new Promise(r => setTimeout(r, 300 + Math.random() * 500));

            const result = await processChat(textToProcess, context);
            setContext(result.newContext);
            setMessages(prev => [...prev, { role: 'assistant', text: result.reply, actions: result.actions }]);
        } catch (err) {
            setMessages(prev => [...prev, { role: 'assistant', text: 'Sorry, I am having trouble connecting right now.' }]);
        } finally {
            setIsTyping(false);
        }
    };

    const handleActionClick = (actionText) => {
        handleSend(actionText);
    };

    return (
        <div className="floating-chatbot-container">
            {/* The Chat Window */}
            {isOpen && (
                <div className="chatbot-window slide-up">
                    <div className="chatbot-header">
                        <div className="chatbot-header-info">
                            <span className="chatbot-icon">🤖</span>
                            <div>
                                <h3 className="chatbot-title">Civic Assistant</h3>
                                <span className="chatbot-status">Online • Free</span>
                            </div>
                        </div>
                        <button className="chatbot-close-btn" onClick={() => setIsOpen(false)}>
                            <HiX />
                        </button>
                    </div>

                    <div className="chatbot-messages">
                        {messages.map((msg, idx) => (
                            <div key={idx} className={`chat-bubble-wrapper ${msg.role}`}>
                                {msg.role === 'assistant' && <div className="chat-avatar">🤖</div>}
                                <div className={`chat-bubble ${msg.role}`}>
                                    {/* Note: ReactMarkdown could be used here to render the **bold** text, but for zero dependencies we just render text */}
                                    <div className="chat-text">
                                        {msg.text.split('**').map((part, i) => i % 2 === 1 ? <strong key={i}>{part}</strong> : part)}
                                    </div>

                                    {/* Quick action chips if any */}
                                    {msg.actions && msg.actions.length > 0 && (
                                        <div className="chat-actions">
                                            {msg.actions.map((act, i) => (
                                                <button key={i} className="chat-action-chip" onClick={() => handleActionClick(act)}>
                                                    {act}
                                                </button>
                                            ))}
                                        </div>
                                    )}
                                </div>
                            </div>
                        ))}

                        {isTyping && (
                            <div className="chat-bubble-wrapper assistant">
                                <div className="chat-avatar">🤖</div>
                                <div className="chat-bubble assistant typing">
                                    <span className="dot"></span>
                                    <span className="dot"></span>
                                    <span className="dot"></span>
                                </div>
                            </div>
                        )}
                        <div ref={chatEndRef} />
                    </div>

                    <div className="chatbot-input-area">
                        <input
                            ref={inputRef}
                            type="text"
                            placeholder="Type a message or ID..."
                            value={input}
                            onChange={(e) => setInput(e.target.value)}
                            onKeyDown={(e) => e.key === 'Enter' && handleSend()}
                            disabled={isTyping}
                        />
                        <button
                            className="chatbot-send-btn"
                            onClick={() => handleSend()}
                            disabled={!input.trim() || isTyping}
                        >
                            <HiPaperAirplane />
                        </button>
                    </div>
                </div>
            )}

            {/* The Floating Action Buttons */}
            {!isOpen && (
                <div className="floating-actions-wrapper">
                    <div className="contact-wrapper">
                        {isContactOpen && (
                            <div className="contact-popover bounce">
                                <button className="contact-close" onClick={() => setIsContactOpen(false)}>
                                    <HiX />
                                </button>
                                <h4>Customer Support</h4>
                                <div className="contact-detail">
                                    <span>📞</span> 1800-111-222
                                </div>
                                <div className="contact-detail">
                                    <span>✉️</span> help@samasyasathi.in
                                </div>
                            </div>
                        )}
                        <button
                            className="chatbot-toggle-btn call-btn bounce"
                            onClick={() => setIsContactOpen(!isContactOpen)}
                            title="Support Contact"
                        >
                            <HiPhone />
                        </button>
                    </div>
                    <button className="chatbot-toggle-btn bounce" onClick={() => setIsOpen(true)} title="Open Chat">
                        <HiChat />
                    </button>
                </div>
            )}
        </div>
    );
}
