import React, { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Play, Square, CheckCircle2, XCircle, RefreshCcw, Volume2 } from 'lucide-react';

interface ListenTapBlockProps {
    data: {
        audioAssetId?: string;
        correctSentence?: string;
        distractors?: string[];
        compact?: boolean;
    };
    onComplete?: (isCorrect: boolean) => void;
    isAdmin?: boolean;
}

const ListenTapBlock: React.FC<ListenTapBlockProps> = ({ data, onComplete, isAdmin }) => {
    // Audio Player State
    const [isPlaying, setIsPlaying] = useState(false);
    const audioRef = useRef<HTMLAudioElement | null>(null);
    const defaultAudio = 'https://actions.google.com/sounds/v1/alarms/digital_watch_alarm_long.ogg';

    // Word Bank State
    const [scrambled, setScrambled] = useState<string[]>([]);
    const [selected, setSelected] = useState<string[]>([]);
    const [status, setStatus] = useState<'idle' | 'correct' | 'incorrect'>('idle');

    useEffect(() => {
        // Init words
        const correctWords = (data.correctSentence || "Hello world").split(' ').filter(w => w.trim());
        const extraWords = (data.distractors || []).filter(w => w.trim());
        const allWords = [...correctWords, ...extraWords].sort(() => Math.random() - 0.5);

        setScrambled(allWords);
        setSelected([]);
        setStatus('idle');

        // Cleanup audio
        return () => {
            if (audioRef.current) {
                audioRef.current.pause();
                audioRef.current.currentTime = 0;
            }
        };
    }, [data.correctSentence, data.distractors]);

    const togglePlay = () => {
        if (!audioRef.current) return;
        if (isPlaying) {
            audioRef.current.pause();
            audioRef.current.currentTime = 0;
            setIsPlaying(false);
        } else {
            audioRef.current.play().catch(e => console.error("Playback failed", e));
            setIsPlaying(true);
        }
    };

    const handleScrambleClick = (word: string, index: number) => {
        if (status === 'correct') return;
        const newScrambled = [...scrambled];
        newScrambled.splice(index, 1);
        setScrambled(newScrambled);
        setSelected([...selected, word]);
        setStatus('idle');
    };

    const handleSelectedClick = (word: string, index: number) => {
        if (status === 'correct') return;
        const newSelected = [...selected];
        newSelected.splice(index, 1);
        setSelected(newSelected);
        setScrambled([...scrambled, word]);
        setStatus('idle');
    };

    const checkAnswer = () => {
        const currentAnswer = selected.join(' ');
        const targetAnswer = (data.correctSentence || '').trim();
        const isCorrect = currentAnswer.toLowerCase() === targetAnswer.toLowerCase();

        setStatus(isCorrect ? 'correct' : 'incorrect');
        onComplete?.(isCorrect);
    };

    const reset = () => {
        const correctWords = (data.correctSentence || "Hello world").split(' ').filter(w => w.trim());
        const extraWords = (data.distractors || []).filter(w => w.trim());
        const allWords = [...correctWords, ...extraWords].sort(() => Math.random() - 0.5);

        setScrambled(allWords);
        setSelected([]);
        setStatus('idle');

        if (audioRef.current) {
            audioRef.current.pause();
            audioRef.current.currentTime = 0;
        }
        setIsPlaying(false);
    };

    return (
        <div className={`w-full h-full flex flex-col overflow-y-auto custom-scrollbar ${data.compact ? 'p-2 gap-2' : 'p-4 gap-4'} bg-black/40 border border-white/5 rounded-2xl`}>
            <audio ref={audioRef} src={data.audioAssetId || defaultAudio} onEnded={() => setIsPlaying(false)} />

            {/* Header & Play Button */}
            <div className="flex flex-col items-center gap-3">
                <div className="text-center">
                    <p className={`text-[10px] uppercase font-black tracking-widest text-[#0ea5e9] mb-1 flex items-center justify-center gap-1`}>
                        <Volume2 size={12} /> Listen & Tap
                    </p>
                    <h3 className={`${data.compact ? 'text-xs' : 'text-sm'} font-black text-white leading-tight`}>Reconstruct what you hear</h3>
                </div>

                <motion.button
                    whileHover={{ scale: 1.05 }}
                    whileTap={{ scale: 0.95 }}
                    onClick={togglePlay}
                    className={`
                        relative flex items-center justify-center 
                        ${data.compact ? 'w-12 h-12' : 'w-16 h-16'} 
                        rounded-full shadow-lg transition-colors
                        ${isPlaying ? 'bg-[#0ea5e9]' : 'bg-white text-[#0ea5e9]'}
                    `}
                >
                    {isPlaying && (
                        <motion.div
                            animate={{ scale: [1, 1.3, 1], opacity: [0.5, 0, 0.5] }}
                            transition={{ repeat: Infinity, duration: 1.5 }}
                            className="absolute inset-0 rounded-full border-2 border-[#0ea5e9]"
                        />
                    )}
                    {isPlaying ? <Square className={`ml-0 ${data.compact ? 'w-4 h-4' : 'w-6 h-6'} text-white fill-current`} /> : <Play className={`ml-1 ${data.compact ? 'w-5 h-5' : 'w-8 h-8'} fill-current`} />}
                </motion.button>
            </div>

            {/* Interaction Area */}
            <div className={`flex-1 flex flex-col justify-center ${data.compact ? 'gap-2' : 'gap-4'}`}>
                {/* Target Line */}
                <div className={`${data.compact ? 'min-h-[40px] p-1.5' : 'min-h-[50px] p-2'} border-b-2 border-white/10 flex flex-wrap gap-1.5 items-end pb-2`}>
                    <AnimatePresence>
                        {selected.map((word, i) => (
                            <motion.button
                                layoutId={`lt-word-${word}-${i}`}
                                key={`sel-${i}-${word}`}
                                initial={{ scale: 0, opacity: 0 }}
                                animate={{ scale: 1, opacity: 1 }}
                                exit={{ scale: 0, opacity: 0 }}
                                onClick={() => handleSelectedClick(word, i)}
                                className={`${data.compact ? 'px-2 py-1 text-[10px]' : 'px-3 py-1.5 text-sm'} bg-[#0ea5e9] text-white rounded-lg font-bold shadow-sm cursor-pointer hover:bg-[#0284c7] transition-colors`}
                            >
                                {word}
                            </motion.button>
                        ))}
                    </AnimatePresence>
                    {selected.length === 0 && !isAdmin && (
                        <span className="text-[10px] font-bold text-gray-500 uppercase tracking-widest pl-2 opacity-50">Tap words below</span>
                    )}
                </div>

                {/* Source Bank */}
                <div className="flex flex-wrap gap-1.5 justify-center mt-2">
                    <AnimatePresence>
                        {scrambled.map((word, i) => (
                            <motion.button
                                layoutId={`lt-word-source-${word}-${i}`}
                                key={`scr-${i}-${word}`}
                                whileHover={{ scale: 1.05, y: -2 }}
                                whileTap={{ scale: 0.95 }}
                                onClick={() => handleScrambleClick(word, i)}
                                className={`${data.compact ? 'px-2 py-1 text-[10px]' : 'px-3 py-1.5 text-sm'} bg-white/10 border border-white/20 text-white rounded-lg font-bold transition-all hover:bg-white/20`}
                            >
                                {word}
                            </motion.button>
                        ))}
                    </AnimatePresence>
                </div>
            </div>

            {/* Control & Feedback */}
            <div className={`flex flex-col mt-auto ${data.compact ? 'gap-1' : 'gap-2'}`}>
                <div className="flex gap-2">
                    <button onClick={reset} className={`p-2 bg-white/5 border border-white/10 rounded-xl text-gray-400 hover:text-white transition-all`}><RefreshCcw size={16} /></button>
                    <button
                        onClick={checkAnswer}
                        disabled={status === 'correct' || selected.length === 0}
                        className={`flex-1 rounded-xl font-black transition-all flex items-center justify-center gap-1 ${data.compact ? 'p-2 text-[10px]' : 'p-3 text-sm'} uppercase tracking-[0.1em] shadow-lg ${status === 'correct' ? 'bg-green-500 text-white' :
                            status === 'incorrect' ? 'bg-red-500 text-white' : 'bg-[#0ea5e9] text-white hover:bg-[#0284c7]'
                            } disabled:opacity-50 disabled:cursor-not-allowed`}
                    >
                        {status === 'correct' ? 'GREAT!' : status === 'incorrect' ? 'TRY AGAIN' : 'CHECK'}
                    </button>
                </div>
                {status !== 'idle' && (
                    <motion.div initial={{ opacity: 0, y: 5 }} animate={{ opacity: 1, y: 0 }} className={`rounded-xl border flex items-center p-2 gap-2 text-xs ${status === 'correct' ? 'bg-green-500/20 border-green-500/40 text-green-300' : 'bg-red-500/20 border-red-500/40 text-red-300'}`}>
                        {status === 'correct' ? <CheckCircle2 size={16} /> : <XCircle size={16} />}
                        <p className="font-bold">{status === 'correct' ? 'Correct!' : 'Incorrect answer'}</p>
                    </motion.div>
                )}
            </div>
        </div>
    );
};

export default ListenTapBlock;
