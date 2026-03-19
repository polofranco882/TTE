import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { CheckCircle2, XCircle, RefreshCcw } from 'lucide-react';

interface InteractiveActivityProps {
    data: {
        mode: 'scramble' | 'input';
        question: string;
        correctAnswer: string;
        options?: string[]; // For scramble mode
        feedback?: string;
        hideQuestion?: boolean;
        hideCheckButton?: boolean;
        hideResetButton?: boolean;
        compact?: boolean;
    };
    onComplete?: (isCorrect: boolean) => void;
    isAdmin?: boolean;
}

const InteractiveActivity: React.FC<InteractiveActivityProps> = ({ data, onComplete, isAdmin }) => {
    const [scrambled, setScrambled] = useState<string[]>([]);
    const [selected, setSelected] = useState<string[]>([]);
    const [userInput, setUserInput] = useState('');
    const [status, setStatus] = useState<'idle' | 'correct' | 'incorrect'>('idle');

    useEffect(() => {
        if (data.mode === 'scramble') {
            const initialOptions = data.options && data.options.length > 0
                ? [...data.options]
                : data.correctAnswer.split(' ').sort(() => Math.random() - 0.5);
            setScrambled(initialOptions);
            setSelected([]);
            setStatus('idle');
        } else {
            setUserInput('');
            setStatus('idle');
        }
    }, [data.mode, data.correctAnswer, data.options]);

    const handleScrambleClick = (word: string, index: number, e: React.MouseEvent) => {
        if (!isAdmin) e.stopPropagation();
        if (isAdmin || status === 'correct') return;

        // Remove from scrambled, add to selected
        const newScrambled = [...scrambled];
        newScrambled.splice(index, 1);
        setScrambled(newScrambled);
        setSelected([...selected, word]);
        setStatus('idle');
    };

    const handleSelectedClick = (word: string, index: number, e: React.MouseEvent) => {
        if (!isAdmin) e.stopPropagation();
        if (isAdmin || status === 'correct') return;

        // Remove from selected, add back to scrambled
        const newSelected = [...selected];
        newSelected.splice(index, 1);
        setSelected(newSelected);
        setScrambled([...scrambled, word]);
        setStatus('idle');
    };

    const checkAnswer = (e?: React.MouseEvent) => {
        if (!isAdmin && e) e.stopPropagation();
        if (isAdmin) return;
        let isCorrect = false;
        if (data.mode === 'scramble') {
            const currentAnswer = selected.join(' ');
            isCorrect = currentAnswer.trim().toLowerCase() === data.correctAnswer.trim().toLowerCase();
        } else {
            isCorrect = userInput.trim().toLowerCase() === data.correctAnswer.trim().toLowerCase();
        }

        setStatus(isCorrect ? 'correct' : 'incorrect');
        if (isCorrect) {
            onComplete?.(true);
        }
    };

    const reset = (e: React.MouseEvent) => {
        if (!isAdmin) e.stopPropagation();
        if (isAdmin) return;
        if (data.mode === 'scramble') {
            const initialOptions = data.options && data.options.length > 0
                ? [...data.options]
                : data.correctAnswer.split(' ').sort(() => Math.random() - 0.5);
            setScrambled(initialOptions);
            setSelected([]);
        } else {
            setUserInput('');
        }
        setStatus('idle');
    };

    return (
        <div className={`w-full h-full flex flex-col overflow-y-auto custom-scrollbar ${data.compact ? 'p-1 gap-1' : 'p-3 gap-3'}`}>
            {/* Header / Question */}
            {!data.hideQuestion && (
                <div className="text-center">
                    <h3 className={`${data.compact ? 'text-[10px]' : 'text-xs'} font-black text-white leading-tight`}>{data.question || 'Activity'}</h3>
                </div>
            )}

            {/* Interaction Area */}
            <div className={`flex-1 flex flex-col justify-center ${data.compact ? 'gap-2' : 'gap-4'}`}>
                {data.mode === 'scramble' ? (
                    <>
                        {/* Selected Words (Target) */}
                        <div className={`${data.compact ? 'min-h-[30px] p-1' : 'min-h-[45px] p-3'} bg-black/20 rounded-xl border-2 border-dashed border-white/10 flex flex-wrap gap-1.5 items-center justify-center transition-colors`}>
                            <AnimatePresence>
                                {selected.map((word, i) => (
                                    <motion.button
                                        key={`sel-${i}-${word}`}
                                        initial={{ scale: 0, opacity: 0 }}
                                        animate={{ scale: 1, opacity: 1 }}
                                        exit={{ scale: 0, opacity: 0 }}
                                        onClick={(e) => handleSelectedClick(word, i, e)}
                                        className={`${data.compact ? 'px-1.5 py-0.5 text-[10px]' : 'px-3 py-1.5 text-xs'} bg-accent text-white rounded-lg font-bold shadow-lg shadow-accent/20 cursor-pointer`}
                                    >
                                        {word}
                                    </motion.button>
                                ))}
                            </AnimatePresence>
                            {selected.length === 0 && !isAdmin && <span className="text-[8px] font-bold text-gray-600 uppercase tracking-widest italic">{data.compact ? '...' : 'Drag here'}</span>}
                        </div>

                        {/* Available Words (Source) */}
                        <div className="flex flex-wrap gap-1.5 justify-center">
                            {scrambled.map((word, i) => (
                                <motion.button
                                    key={`scr-${i}-${word}`}
                                    whileHover={{ scale: 1.05 }}
                                    whileTap={{ scale: 0.95 }}
                                    onClick={(e) => handleScrambleClick(word, i, e)}
                                    className={`${data.compact ? 'px-1.5 py-0.5 text-[10px]' : 'px-3 py-1.5 text-xs'} bg-white/5 border border-white/10 text-white rounded-lg font-bold transition-colors`}
                                >
                                    {word}
                                </motion.button>
                            ))}
                        </div>
                    </>
                ) : (
                    /* Input Mode */
                    <div className="relative">
                        <input
                            type="text"
                            value={userInput}
                            onChange={(e) => { e.stopPropagation(); setUserInput(e.target.value); setStatus('idle'); }}
                            onKeyDown={(e) => { 
                                e.stopPropagation();
                                if (e.key === 'Enter') checkAnswer();
                            }}
                            disabled={status === 'correct'}
                            placeholder={data.compact ? "..." : "Type here..."}
                            className={`w-full bg-black/20 border-2 rounded-xl text-white font-bold outline-none transition-all ${data.compact ? 'p-1.5 text-xs' : 'p-3 text-sm'} ${status === 'correct' ? 'border-green-500/50 bg-green-500/5' : status === 'incorrect' ? 'border-red-500/50 bg-red-500/5' : 'border-white/10 focus:border-accent'}`}
                        />
                        {status === 'correct' && <CheckCircle2 className={`absolute right-2 top-1/2 -translate-y-1/2 text-green-500 ${data.compact ? 'w-3 h-3' : 'w-4 h-4'}`} />}
                    </div>
                )}
            </div>

            {/* Actions & Feedback */}
            <div className={`flex flex-col ${data.compact ? 'gap-1' : 'gap-2'}`}>
                {(!data.hideCheckButton || !data.hideResetButton) && (
                    <div className="flex gap-1.5">
                        {!data.hideResetButton && (
                            <button
                                onClick={(e) => reset(e)}
                                className={`${data.compact ? 'p-1' : 'p-2'} bg-white/5 border border-white/10 rounded-lg text-gray-400 hover:text-white transition-all`}
                                title="Reset"
                            >
                                <RefreshCcw size={data.compact ? 12 : 16} />
                            </button>
                        )}
                        {!data.hideCheckButton && (
                            <button
                                onClick={(e) => checkAnswer(e)}
                                disabled={status === 'correct' || (data.mode === 'scramble' ? selected.length === 0 : !userInput)}
                                className={`flex-1 rounded-lg font-black transition-all flex items-center justify-center gap-1 ${data.compact ? 'p-1 text-[7px]' : 'p-2 text-[8px]'} uppercase tracking-[0.1em] ${status === 'correct' ? 'bg-green-500 text-white' : 'bg-accent text-white'}`}
                            >
                                {status === 'correct' ? 'OK' : 'CHECK'}
                            </button>
                        )}
                    </div>
                )}

                <AnimatePresence>
                    {status !== 'idle' && (
                        <motion.div
                            initial={{ opacity: 0, y: 5 }}
                            animate={{ opacity: 1, y: 0 }}
                            exit={{ opacity: 0, y: 5 }}
                            className={`rounded-lg border flex items-center ${data.compact ? 'p-1 gap-1 text-[8px]' : 'p-2 gap-2 text-[10px]'} ${status === 'correct' ? 'bg-green-500/10 border-green-500/20 text-green-400' : 'bg-red-500/10 border-red-500/20 text-red-400'}`}
                        >
                            {status === 'correct' ? <CheckCircle2 size={data.compact ? 10 : 12} /> : <XCircle size={data.compact ? 10 : 12} />}
                            <p className="font-bold truncate">{status === 'correct' ? (data.feedback || "Correct!") : "Try again"}</p>
                        </motion.div>
                    )}
                </AnimatePresence>
            </div>
        </div>
    );
};

export default InteractiveActivity;
