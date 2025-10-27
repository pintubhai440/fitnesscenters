
import React, { useState, useEffect, useRef, useCallback } from 'react';
import { createChat } from '../services/geminiService';
import type { ChatMessage } from '../types';
import type { Chat } from '@google/genai';
import { PaperAirplaneIcon, ChatbotMicrophoneIcon } from './icons';

// Check for browser speech recognition support
// FIX: Cast window to 'any' to access non-standard SpeechRecognition properties.
const SpeechRecognition = (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;
const isSpeechRecognitionSupported = !!SpeechRecognition;

const AiChatbot: React.FC = () => {
    const [chat, setChat] = useState<Chat | null>(null);
    const [messages, setMessages] = useState<ChatMessage[]>([]);
    const [currentInput, setCurrentInput] = useState('');
    const [isLoading, setIsLoading] = useState(false);
    const [isListening, setIsListening] = useState(false);

    const chatContainerRef = useRef<HTMLDivElement>(null);
    const recognitionRef = useRef<any>(null); // Using 'any' for SpeechRecognition instance

    useEffect(() => {
        const initChat = () => {
            const newChat = createChat();
            setChat(newChat);
            setMessages([{
                role: 'model',
                text: "Hello! I'm your AI Fitness expert. Ask me anything about workouts, nutrition, or your health goals."
            }]);
        };
        initChat();
    }, []);

    useEffect(() => {
        if (isSpeechRecognitionSupported) {
            recognitionRef.current = new SpeechRecognition();
            const recognition = recognitionRef.current;
            recognition.continuous = true;
            recognition.interimResults = true;

            recognition.onstart = () => setIsListening(true);
            recognition.onend = () => setIsListening(false);
            recognition.onerror = (event: any) => console.error('Speech recognition error:', event.error);

            recognition.onresult = (event: any) => {
                const transcript = Array.from(event.results)
                    .map((result: any) => result[0])
                    .map((result) => result.transcript)
                    .join('');
                setCurrentInput(transcript);
            };
        }
    }, []);

    useEffect(() => {
        if (chatContainerRef.current) {
            chatContainerRef.current.scrollTop = chatContainerRef.current.scrollHeight;
        }
    }, [messages]);

    const sendMessage = useCallback(async (messageText: string) => {
        if (!chat || isLoading || !messageText.trim()) return;

        if (isListening) {
            recognitionRef.current?.stop();
        }

        setIsLoading(true);
        const userMessage: ChatMessage = { role: 'user', text: messageText.trim() };
        setMessages(prev => [...prev, userMessage]);
        setCurrentInput('');

        try {
            const stream = await chat.sendMessageStream({ message: messageText });
            let modelResponse = '';
            setMessages(prev => [...prev, { role: 'model', text: '' }]);

            for await (const chunk of stream) {
                modelResponse += chunk.text;
                setMessages(prev => {
                    const newMessages = [...prev];
                    newMessages[newMessages.length - 1].text = modelResponse;
                    return newMessages;
                });
            }
        } catch (error) {
            console.error("Chat error:", error);
            setMessages(prev => [...prev, { role: 'model', text: "Sorry, I encountered an error. Please try again." }]);
        } finally {
            setIsLoading(false);
        }
    }, [chat, isLoading, isListening]);
    
    const handleKeyPress = (e: React.KeyboardEvent<HTMLInputElement>) => {
        if (e.key === 'Enter' && !e.shiftKey) {
            e.preventDefault();
            sendMessage(currentInput);
        }
    }

    const toggleListening = () => {
        if (!isSpeechRecognitionSupported) return;
        if (isListening) {
            recognitionRef.current?.stop();
        } else {
            recognitionRef.current?.start();
        }
    };

    return (
        <div className="flex flex-col h-[85vh] max-w-4xl mx-auto bg-white rounded-xl shadow-md border border-slate-200">
            <header className="p-4 border-b border-slate-200">
                <h1 className="text-xl font-bold text-slate-800">AI Fitness Chatbot</h1>
                <p className="text-sm text-slate-500">Your personal fitness assistant</p>
            </header>
            <div ref={chatContainerRef} className="flex-1 overflow-y-auto p-6 space-y-4">
                {messages.map((msg, index) => (
                    <div key={index} className={`flex ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`}>
                        <div className={`max-w-lg px-4 py-3 rounded-2xl ${msg.role === 'user' ? 'bg-sky-500 text-white' : 'bg-slate-200 text-slate-800'}`}>
                           <p className="text-sm whitespace-pre-wrap">{msg.text}</p>
                        </div>
                    </div>
                ))}
                {isLoading && messages[messages.length - 1].role === 'user' && (
                     <div className="flex justify-start">
                        <div className="max-w-lg px-4 py-3 rounded-2xl bg-slate-200 text-slate-800">
                           <div className="flex items-center space-x-2">
                                <div className="w-2 h-2 bg-slate-500 rounded-full animate-pulse [animation-delay:-0.3s]"></div>
                                <div className="w-2 h-2 bg-slate-500 rounded-full animate-pulse [animation-delay:-0.15s]"></div>
                                <div className="w-2 h-2 bg-slate-500 rounded-full animate-pulse"></div>
                           </div>
                        </div>
                    </div>
                )}
            </div>
            <div className="p-4 border-t border-slate-200">
                <div className="flex items-center space-x-2">
                    <input
                        type="text"
                        value={currentInput}
                        onChange={(e) => setCurrentInput(e.target.value)}
                        onKeyPress={handleKeyPress}
                        placeholder="Ask or press the mic to talk..."
                        className="flex-1 block w-full px-4 py-2 bg-white border border-slate-300 rounded-full shadow-sm placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-sky-500 sm:text-sm"
                        disabled={isLoading}
                    />
                    {isSpeechRecognitionSupported && (
                        <button
                            onClick={toggleListening}
                            className={`inline-flex items-center justify-center rounded-full h-10 w-10 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-sky-500 ${
                                isListening ? 'bg-red-500 text-white' : 'bg-slate-200 text-slate-600 hover:bg-slate-300'
                            }`}
                        >
                            <ChatbotMicrophoneIcon />
                        </button>
                    )}
                    <button
                        onClick={() => sendMessage(currentInput)}
                        disabled={isLoading || !currentInput.trim()}
                        className="inline-flex items-center justify-center rounded-full h-10 w-10 text-white bg-sky-600 hover:bg-sky-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-sky-500 disabled:bg-slate-400"
                    >
                        <PaperAirplaneIcon />
                    </button>
                </div>
            </div>
        </div>
    );
};

export default AiChatbot;
