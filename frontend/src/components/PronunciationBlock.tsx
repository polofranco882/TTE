import React, { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Mic, CheckCircle2, RefreshCcw, Activity } from 'lucide-react';

interface PronunciationBlockProps {
    data: {
        targetPhrase?: string;
        compact?: boolean;
    };
    onComplete?: (isCorrect: boolean) => void;
    isAdmin?: boolean;
}

const PronunciationBlock: React.FC<PronunciationBlockProps> = ({ data, onComplete }) => {
    const [isListening, setIsListening] = useState(false);
    const [transcript, setTranscript] = useState('');
    const [status, setStatus] = useState<'idle' | 'correct' | 'incorrect'>('idle');
    const [errorMsg, setErrorMsg] = useState<string | null>(null);

    // SpeechRecognition API type references
    const recognitionRef = useRef<any>(null);

    useEffect(() => {
        // Initialize Web Speech API
        const SpeechRecognition = (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;
        if (SpeechRecognition) {
            recognitionRef.current = new SpeechRecognition();
            recognitionRef.current.continuous = false;
            recognitionRef.current.interimResults = false;
            recognitionRef.current.lang = 'en-US'; // Ideally this should be configurable

            recognitionRef.current.onresult = (event: any) => {
                const text = event.results[0][0].transcript;
                setTranscript(text);
                setIsListening(false);
                validateSpeech(text);
            };

            recognitionRef.current.onerror = (event: any) => {
                console.error("Speech recognition error", event.error);
                setErrorMsg(`Microphone error: ${event.error}`);
                setIsListening(false);
            };

            recognitionRef.current.onend = () => {
                setIsListening(false);
            };
        } else {
            setErrorMsg("Your browser does not support Speech Recognition.");
        }

        return () => {
            if (recognitionRef.current) {
                recognitionRef.current.abort();
            }
        };
    }, []);

    const toggleListen = () => {
        setErrorMsg(null);
        if (isListening) {
            recognitionRef.current?.stop();
            setIsListening(false);
        } else {
            if (!recognitionRef.current) {
                setErrorMsg("Speech recognition not supported.");
                return;
            }
            try {
                setTranscript('');
                setStatus('idle');
                recognitionRef.current.start();
                setIsListening(true);
            } catch (err) {
                console.error("Failed to start listening", err);
                setIsListening(false);
            }
        }
    };

    const normalize = (text: string) => text.toLowerCase().replace(/[.,\/#!$%\^&\*;:{}=\-_`~()]/g, "").trim();

    const validateSpeech = (spokenText: string) => {
        const target = normalize(data.targetPhrase || "Hello world");
        const spoken = normalize(spokenText);

        // Very basic validation - in production you'd use a fuzzy match / acoustic model scoring
        const isCorrect = spoken.includes(target) || target.includes(spoken);

        setStatus(isCorrect ? 'correct' : 'incorrect');
        onComplete?.(isCorrect);
    };

    const reset = () => {
        setTranscript('');
        setStatus('idle');
        setErrorMsg(null);
        if (isListening) {
            recognitionRef.current?.stop();
            setIsListening(false);
        }
    };

    return (
        <div className={`w-full h-full flex flex-col overflow-y-auto custom-scrollbar ${data.compact ? 'p-2 gap-2' : 'p-4 gap-4'} bg-indigo-950/40 border border-indigo-500/20 rounded-3xl shadow-2xl`}>

            {/* Header */}
            <div className="text-center mb-1">
                <p className="text-[10px] uppercase font-black tracking-widest text-indigo-400 mb-1 flex items-center justify-center gap-1">
                    <Mic size={12} /> Speaking
                </p>
                <h3 className={`${data.compact ? 'text-xs' : 'text-sm'} font-black text-white leading-tight`}>Read this out loud</h3>
            </div>

            {/* Target Phrase */}
            <div className="bg-white/5 border border-white/10 rounded-2xl p-4 text-center my-2 shadow-inner">
                <p className={`font-bold text-white ${data.compact ? 'text-base' : 'text-xl'}`}>
                    "{data.targetPhrase || 'Hello world'}"
                </p>
            </div>

            {/* Mic Toggle Button */}
            <div className="flex-1 flex flex-col items-center justify-center gap-4">
                <motion.button
                    whileHover={{ scale: 1.05 }}
                    whileTap={{ scale: 0.95 }}
                    onClick={toggleListen}
                    disabled={status === 'correct'}
                    className={`
                        relative flex items-center justify-center 
                        ${data.compact ? 'w-16 h-16' : 'w-24 h-24'} 
                        rounded-full shadow-lg transition-all duration-300
                        ${status === 'correct' ? 'bg-green-500 text-white cursor-default' :
                            isListening ? 'bg-indigo-500 text-white shadow-indigo-500/50' :
                                'bg-white text-indigo-500 hover:bg-indigo-50'}
                    `}
                >
                    {isListening && (
                        <>
                            <motion.div animate={{ scale: [1, 1.4, 1], opacity: [0.5, 0, 0.5] }} transition={{ repeat: Infinity, duration: 1.2 }} className="absolute inset-0 rounded-full bg-indigo-500" />
                            <motion.div animate={{ scale: [1, 1.2, 1], opacity: [0.3, 0, 0.3] }} transition={{ repeat: Infinity, duration: 1.2, delay: 0.2 }} className="absolute inset-0 rounded-full border-4 border-indigo-400" />
                        </>
                    )}

                    {status === 'correct' ? <CheckCircle2 className={`${data.compact ? 'w-8 h-8' : 'w-12 h-12'}`} /> :
                        isListening ? <Activity className={`${data.compact ? 'w-8 h-8' : 'w-12 h-12'} animate-pulse`} /> :
                            <Mic className={`${data.compact ? 'w-8 h-8' : 'w-12 h-12'}`} />}
                </motion.button>

                <p className={`text-center font-medium ${data.compact ? 'text-[10px]' : 'text-xs'} ${isListening ? 'text-indigo-400 animate-pulse' : 'text-gray-400'}`}>
                    {isListening ? 'Listening...' : status === 'correct' ? 'Great pronunciation!' : 'Tap mic to speak'}
                </p>
            </div>

            {/* Transcribed Text Feedback */}
            <AnimatePresence>
                {transcript && (
                    <motion.div
                        initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }}
                        className={`mt-2 p-3 rounded-xl border flex flex-col items-center text-center text-xs ${status === 'correct' ? 'bg-green-500/10 border-green-500/30 text-green-300' : 'bg-red-500/10 border-red-500/30 text-red-300'}`}
                    >
                        <p className="opacity-80 uppercase tracking-widest text-[8px] mb-1 font-bold">We heard:</p>
                        <p className="italic font-medium">"{transcript}"</p>
                    </motion.div>
                )}
            </AnimatePresence>

            {/* Error Message */}
            {errorMsg && (
                <div className="mt-2 p-2 bg-red-500/20 text-red-300 border border-red-500/30 rounded-lg text-[10px] text-center">
                    {errorMsg}
                </div>
            )}

            {/* Reset */}
            {status !== 'idle' && (
                <div className="flex justify-center mt-2">
                    <button onClick={reset} className="flex items-center gap-1.5 px-4 py-2 bg-white/5 hover:bg-white/10 border border-white/10 rounded-full text-xs text-white font-bold transition-colors">
                        <RefreshCcw size={12} /> Try Again
                    </button>
                </div>
            )}
        </div>
    );
};

export default PronunciationBlock;
