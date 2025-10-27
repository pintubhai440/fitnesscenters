import React, { useState, useEffect, useRef, useCallback } from 'react';
import { createChat, textToSpeech } from '../services/geminiService';
import type { Chat } from '@google/genai';
import { MicrophoneIcon } from './icons';

interface ConversationTurn {
    role: 'user' | 'model';
    text: string;
}

// Audio playback helper
const playAudio = (base64Audio: string, onEnded: () => void): Promise<void> => {
    return new Promise(async (resolve, reject) => {
        try {
            const audioContext = new (window.AudioContext || (window as any).webkitAudioContext)({ sampleRate: 24000 });
            function decode(base64: string) {
                const binaryString = atob(base64);
                const len = binaryString.length;
                const bytes = new Uint8Array(len);
                for (let i = 0; i < len; i++) { bytes[i] = binaryString.charCodeAt(i); }
                return bytes;
            }
            async function decodeAudioData(data: Uint8Array, ctx: AudioContext): Promise<AudioBuffer> {
                const dataInt16 = new Int16Array(data.buffer);
                const frameCount = dataInt16.length;
                const buffer = ctx.createBuffer(1, frameCount, 24000);
                const channelData = buffer.getChannelData(0);
                for (let i = 0; i < frameCount; i++) { channelData[i] = dataInt16[i] / 32768.0; }
                return buffer;
            }
            const audioBuffer = await decodeAudioData(decode(base64Audio), audioContext);
            const source = audioContext.createBufferSource();
            source.buffer = audioBuffer;
            source.connect(audioContext.destination);
            source.onended = () => {
                onEnded();
                resolve();
            };
            source.start();
        } catch (error) {
            console.error("Error playing audio:", error);
            onEnded(); // Ensure queue continues even if playback fails
            resolve(); // Resolve the promise on error to not block the queue
        }
    });
};

const SpeechRecognition = (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;

const VoiceAssistant: React.FC = () => {
    const [chat, setChat] = useState<Chat | null>(null);
    const [conversation, setConversation] = useState<ConversationTurn[]>([]);
    const [status, setStatus] = useState<'idle' | 'listening' | 'thinking' | 'speaking'>('idle');
    const [liveTranscript, setLiveTranscript] = useState('');

    const recognitionRef = useRef<any>(null);
    const conversationEndRef = useRef<HTMLDivElement>(null);
    
    // Refs for audio queue
    const audioQueueRef = useRef<string[]>([]);
    const isSpeakingRef = useRef(false);

    const processAudioQueue = useCallback(async () => {
        if (isSpeakingRef.current || audioQueueRef.current.length === 0) {
            isSpeakingRef.current = false;
            setStatus('idle');
            return;
        }

        isSpeakingRef.current = true;
        setStatus('speaking');

        const textToPlay = audioQueueRef.current.shift();
        if (textToPlay) {
            try {
                const audioData = await textToSpeech(textToPlay);
                if (audioData) {
                    await playAudio(audioData, processAudioQueue);
                } else {
                    processAudioQueue(); // If no audio, process next
                }
            } catch (err) {
                console.error("TTS Error:", err);
                processAudioQueue(); // Continue on error
            }
        }
    }, []);
    
    const speak = useCallback((text: string) => {
        if (!text) return;
        audioQueueRef.current.push(text);
        if (!isSpeakingRef.current) {
            processAudioQueue();
        }
    }, [processAudioQueue]);

    const handleUserInput = useCallback(async (text: string) => {
        if (!chat || !text) return;
        
        setStatus('thinking');
        setConversation(prev => [...prev, { role: 'user', text }]);
        
        try {
            const stream = await chat.sendMessageStream({ message: text });
            let modelResponse = '';
            let currentSentence = '';
            
            // Add placeholder for model response
            const responseIndex = conversation.length + 1;
            setConversation(prev => [...prev, { role: 'model', text: '' }]);

            for await (const chunk of stream) {
                const chunkText = chunk.text;
                modelResponse += chunkText;
                currentSentence += chunkText;
                
                // Update conversation with streaming text
                setConversation(prev => {
                    const newConvo = [...prev];
                    if (newConvo[responseIndex]) {
                       newConvo[responseIndex].text = modelResponse;
                    }
                    return newConvo;
                });
                
                if (/[.!?]/.test(currentSentence)) {
                    speak(currentSentence.trim());
                    currentSentence = '';
                }
            }
            if (currentSentence.trim()) {
                speak(currentSentence.trim());
            }

        } catch (error) {
            console.error("Chat error:", error);
            const errorMsg = "Sorry, I encountered an error.";
            setConversation(prev => [...prev, { role: 'model', text: errorMsg }]);
            speak(errorMsg);
        }
    }, [chat, speak, conversation.length]);


    useEffect(() => {
        setChat(createChat());
        setConversation([{ role: 'model', text: "Hello! Press the microphone and I'll start listening." }]);
        
        if (SpeechRecognition) {
            const recognition = new SpeechRecognition();
            recognitionRef.current = recognition;
            recognition.continuous = true;
            recognition.interimResults = true;
            
            recognition.onstart = () => setStatus('listening');
            recognition.onend = () => setStatus('idle');
            recognition.onerror = (event: any) => console.error('Speech recognition error:', event.error);
            
            recognition.onresult = (event: any) => {
                const transcript = Array.from(event.results)
                    .map((result: any) => result[0])
                    .map((result) => result.transcript)
                    .join('');
                setLiveTranscript(transcript);
            };
        }
    }, []);
    
    useEffect(() => {
        conversationEndRef.current?.scrollIntoView({ behavior: 'smooth' });
    }, [conversation, liveTranscript]);


    const toggleListen = useCallback(() => {
        if (!SpeechRecognition) {
            alert("Speech recognition is not supported in your browser.");
            return;
        }
        if (status === 'listening') {
            recognitionRef.current.stop();
            if (liveTranscript.trim()) {
                handleUserInput(liveTranscript.trim());
            }
            setLiveTranscript('');
        } else if (status === 'idle') {
            recognitionRef.current.start();
        }
    }, [status, liveTranscript, handleUserInput]);
    
    const getStatusInfo = () => {
        switch(status) {
            case 'listening': return 'Listening... Press mic to stop.';
            case 'thinking': return 'Thinking...';
            case 'speaking': return 'Speaking...';
            default: return 'Press the mic to talk';
        }
    }

    return (
        <div className="flex flex-col h-[85vh] max-w-4xl mx-auto bg-white rounded-xl shadow-md border border-slate-200">
            <header className="p-4 border-b border-slate-200 text-center">
                <h1 className="text-xl font-bold text-slate-800">AI Voice Assistant</h1>
            </header>
            <div className="flex-1 overflow-y-auto p-6 space-y-4">
                {conversation.map((turn, index) => (
                    <div key={index} className={`flex ${turn.role === 'user' ? 'justify-end' : 'justify-start'}`}>
                        <div className={`max-w-lg px-4 py-3 rounded-2xl ${turn.role === 'user' ? 'bg-sky-500 text-white' : 'bg-slate-200 text-slate-800'}`}>
                           <p className="text-sm whitespace-pre-wrap">{turn.text}</p>
                        </div>
                    </div>
                ))}
                {liveTranscript && (
                    <div className="flex justify-end">
                        <div className="max-w-lg px-4 py-3 rounded-2xl bg-sky-100 text-slate-600 border border-sky-200">
                           <p className="text-sm italic">{liveTranscript}</p>
                        </div>
                    </div>
                )}
                 <div ref={conversationEndRef} />
            </div>
            <div className="p-6 border-t border-slate-200 flex flex-col items-center justify-center">
                 <button 
                    onClick={toggleListen}
                    disabled={status === 'thinking' || status === 'speaking'}
                    className={`rounded-full h-20 w-20 flex items-center justify-center text-white transition-all duration-300 focus:outline-none focus:ring-4
                    ${status === 'listening' ? 'bg-red-500 ring-red-300 animate-pulse' : 'bg-sky-600 hover:bg-sky-700 ring-sky-300'}
                    disabled:bg-slate-400 disabled:cursor-not-allowed`}
                 >
                     <MicrophoneIcon />
                </button>
                <p className="text-slate-500 mt-4 text-sm font-medium h-5">{getStatusInfo()}</p>
            </div>
        </div>
    );
};

export default VoiceAssistant;