import React, { useState, useRef, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Play, Square, CheckCircle2, XCircle, RefreshCcw, Volume2 } from 'lucide-react';

interface DictationBlockProps {
    data: {
        audioAssetId?: string; // Or URL
        correctText?: string;
        compact?: boolean;
    };
    onComplete?: (isCorrect: boolean) => void;
    isAdmin?: boolean;
}

const DictationBlock: React.FC<DictationBlockProps> = ({ data, onComplete }) => {
    const [isPlaying, setIsPlaying] = useState(false);
    const [userInput, setUserInput] = useState('');
    const [status, setStatus] = useState<'idle' | 'correct' | 'incorrect'>('idle');
    const audioRef = useRef<HTMLAudioElement | null>(null);

    // Provide a default audio track if none is provided for testing
    const defaultAudio = 'https://actions.google.com/sounds/v1/alarms/digital_watch_alarm_long.ogg';

    useEffect(() => {
        // Stop audio when component unmounts
        return () => {
            if (audioRef.current) {
                audioRef.current.pause();
                audioRef.current.currentTime = 0;
            }
        };
    }, []);

    const togglePlay = () => {
        if (!audioRef.current) return;

        if (isPlaying) {
            audioRef.current.pause();
            audioRef.current.currentTime = 0; // Reset on stop for simplicity
            setIsPlaying(false);
        } else {
            audioRef.current.play().catch(e => console.error("Audio playback failed", e));
            setIsPlaying(true);
        }
    };

    const handleAudioEnded = () => {
        setIsPlaying(false);
    };

    const normalizeText = (text: string) => {
        return text
            .toLowerCase()
            .replace(/[.,\/#!$%\^&\*;:{}=\-_`~()]/g, "") // Remove punctuation
            .replace(/\s{2,}/g, " ")                    // Compress multiple spaces
            .trim();
    };

    const checkAnswer = () => {
        const userNormalized = normalizeText(userInput);
        const correctNormalized = normalizeText(data.correctText || 'Hello world');

        const isCorrect = userNormalized === correctNormalized;
        setStatus(isCorrect ? 'correct' : 'incorrect');

        onComplete?.(isCorrect);
    };

    const reset = () => {
        setUserInput('');
        setStatus('idle');
        if (audioRef.current) {
            audioRef.current.pause();
            audioRef.current.currentTime = 0;
        }
        setIsPlaying(false);
    };

    return (
        <div className={`w-full h-full flex flex-col overflow-y-auto custom-scrollbar ${data.compact ? 'p-2 gap-2' : 'p-4 gap-4'} bg-[#1e293b] border-2 border-[#334155] rounded-3xl shadow-2xl`}>

            <audio
                ref={audioRef}
                src={data.audioAssetId || defaultAudio}
                onEnded={handleAudioEnded}
                preload="auto"
            />

            {/* Header */}
            <div className="text-center mb-1">
                <p className="text-[10px] uppercase font-black tracking-widest text-blue-400 mb-1 flex justify-center items-center gap-1">
                    <Volume2 size={12} /> Listening
                </p>
                <h3 className={`${data.compact ? 'text-xs' : 'text-sm'} font-black text-white leading-tight`}>Type what you hear</h3>
            </div>

            {/* Big Play Button */}
            <div className="flex justify-center items-center my-2">
                <motion.button
                    whileHover={{ scale: 1.05 }}
                    whileTap={{ scale: 0.95 }}
                    onClick={togglePlay}
                    className={`
                        relative flex items-center justify-center 
                        ${data.compact ? 'w-16 h-16' : 'w-24 h-24'} 
                        rounded-full shadow-xl transition-colors
                        ${isPlaying ? 'bg-blue-500 shadow-blue-500/50' : 'bg-white shadow-white/20'}
                    `}
                >
                    {/* Pulsing ring when playing */}
                    {isPlaying && (
                        <motion.div
                            animate={{ scale: [1, 1.2, 1], opacity: [0.5, 0, 0.5] }}
                            transition={{ repeat: Infinity, duration: 2 }}
                            className="absolute inset-0 rounded-full border-4 border-blue-400"
                        />
                    )}

                    {isPlaying ? (
                        <Square className={`text-white ml-0 ${data.compact ? 'w-6 h-6' : 'w-10 h-10'} fill-current`} />
                    ) : (
                        <Play className={`text-blue-500 ml-1 ${data.compact ? 'w-8 h-8' : 'w-12 h-12'} fill-current`} />
                    )}
                </motion.button>
            </div>

            {/* Interaction Area (Textarea) */}
            <div className="flex-1 flex flex-col justify-center w-full max-w-lg mx-auto">
                <textarea
                    value={userInput}
                    onChange={(e) => { setUserInput(e.target.value); setStatus('idle'); }}
                    disabled={status === 'correct'}
                    placeholder="Type the sentence here..."
                    className={`
                        w-full resize-none bg-black/30 border-2 rounded-2xl text-white font-medium outline-none transition-all custom-scrollbar flex-1 min-h-[80px]
                        ${data.compact ? 'p-3 text-xs' : 'p-4 text-sm'} 
                        ${status === 'correct' ? 'border-green-500/50 bg-green-500/10' :
                            status === 'incorrect' ? 'border-red-500/50 bg-red-500/10' :
                                'border-[#334155] focus:border-blue-400 focus:bg-white/5'}
                    `}
                />
            </div>

            {/* Actions & Feedback */}
            <div className={`flex flex-col mt-auto ${data.compact ? 'gap-2' : 'gap-3'} w-full max-w-lg mx-auto`}>
                <div className="flex gap-2">
                    <button
                        onClick={reset}
                        className={`${data.compact ? 'p-2' : 'p-3'} bg-white/5 border border-white/10 rounded-xl text-gray-400 hover:text-white transition-all`}
                        title="Reset"
                    >
                        <RefreshCcw size={data.compact ? 16 : 20} />
                    </button>
                    <button
                        onClick={checkAnswer}
                        disabled={status === 'correct' || !userInput.trim()}
                        className={`flex-1 rounded-xl font-black transition-all flex items-center justify-center gap-2 ${data.compact ? 'p-2 text-[10px]' : 'p-3 text-sm'} uppercase tracking-[0.1em] shadow-lg ${status === 'correct' ? 'bg-green-500 text-white shadow-green-500/20' :
                            status === 'incorrect' ? 'bg-red-500 text-white shadow-red-500/20' :
                                'bg-blue-500 text-white hover:bg-blue-400 shadow-blue-500/20'
                            } disabled:opacity-50 disabled:cursor-not-allowed`}
                    >
                        {status === 'correct' ? 'NAILED IT!' : status === 'incorrect' ? 'CHECK AGAIN' : 'CHECK ANSWER'}
                    </button>
                </div>

                <AnimatePresence>
                    {status !== 'idle' && (
                        <motion.div
                            initial={{ opacity: 0, height: 0 }}
                            animate={{ opacity: 1, height: 'auto' }}
                            exit={{ opacity: 0, height: 0 }}
                            className="overflow-hidden"
                        >
                            <div className={`rounded-xl border flex items-center ${data.compact ? 'p-2 gap-2 text-[10px]' : 'p-3 gap-3 text-xs'} ${status === 'correct' ? 'bg-green-500/20 border-green-500/40 text-green-300' : 'bg-red-500/20 border-red-500/40 text-red-300'}`}>
                                <div className={`p-1.5 rounded-full ${status === 'correct' ? 'bg-green-500/20' : 'bg-red-500/20'}`}>
                                    {status === 'correct' ? <CheckCircle2 size={data.compact ? 16 : 20} /> : <XCircle size={data.compact ? 16 : 20} />}
                                </div>
                                <div className="flex-1">
                                    <p className="font-black uppercase tracking-wider">{status === 'correct' ? 'Excellent!' : 'Pay attention to details'}</p>
                                    {status === 'incorrect' && (
                                        <div className="mt-1 opacity-80 flex flex-col gap-0.5">
                                            <p className="font-medium">Correct answer:</p>
                                            <p className="italic bg-black/20 p-1.5 rounded text-[10px] sm:text-xs">"{data.correctText || 'Hello world'}"</p>
                                        </div>
                                    )}
                                </div>
                            </div>
                        </motion.div>
                    )}
                </AnimatePresence>
            </div>
        </div>
    );
};

export default DictationBlock;
