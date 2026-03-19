import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { CheckCircle2, XCircle, RefreshCcw } from 'lucide-react';

interface WordBankBlockProps {
    data: {
        prompt?: string;
        correctSentence?: string;
        distractors?: string[];
        hideQuestion?: boolean;
        compact?: boolean;
    };
    onComplete?: (isCorrect: boolean) => void;
    isAdmin?: boolean;
}

const WordBankBlock: React.FC<WordBankBlockProps> = ({ data, onComplete, isAdmin }) => {
    const [scrambled, setScrambled] = useState<string[]>([]);
    const [selected, setSelected] = useState<string[]>([]);
    const [status, setStatus] = useState<'idle' | 'correct' | 'incorrect'>('idle');

    // Initialize block words
    useEffect(() => {
        const correctWords = (data.correctSentence || "Hello world").split(' ').filter(w => w.trim());
        const extraWords = (data.distractors || []).filter(w => w.trim());
        const allWords = [...correctWords, ...extraWords].sort(() => Math.random() - 0.5);

        setScrambled(allWords);
        setSelected([]);
        setStatus('idle');
    }, [data.correctSentence, data.distractors]);

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
    };

    return (
        <div className={`w-full h-full flex flex-col overflow-y-auto custom-scrollbar ${data.compact ? 'p-1 gap-1' : 'p-3 gap-3'} bg-black/40 border border-white/5 rounded-2xl`}>
            {/* Header / Prompt */}
            {!data.hideQuestion && (
                <div className="text-center mb-2">
                    <p className={`text-[10px] uppercase font-black tracking-widest text-accent mb-1`}>Translate This</p>
                    <h3 className={`${data.compact ? 'text-xs' : 'text-sm'} font-black text-white leading-tight`}>{data.prompt || 'Translate the sentence'}</h3>
                </div>
            )}

            {/* Interaction Area */}
            <div className={`flex-1 flex flex-col justify-center ${data.compact ? 'gap-2' : 'gap-4'}`}>
                {/* Selected Words (Target Line) */}
                <div className={`${data.compact ? 'min-h-[40px] p-1.5' : 'min-h-[60px] p-3'} border-b-2 border-white/20 flex flex-wrap gap-1.5 items-end pb-2`}>
                    <AnimatePresence>
                        {selected.map((word, i) => (
                            <motion.button
                                layoutId={`word-${word}-${i}`}
                                key={`sel-${i}-${word}`}
                                initial={{ scale: 0, opacity: 0 }}
                                animate={{ scale: 1, opacity: 1 }}
                                exit={{ scale: 0, opacity: 0 }}
                                onClick={() => handleSelectedClick(word, i)}
                                className={`${data.compact ? 'px-2 py-1 text-[10px]' : 'px-4 py-2 text-sm'} bg-white text-[#161930] rounded-xl font-bold shadow-sm cursor-pointer hover:bg-gray-200 transition-colors`}
                            >
                                {word}
                            </motion.button>
                        ))}
                    </AnimatePresence>
                    {selected.length === 0 && !isAdmin && (
                        <span className="text-[10px] font-bold text-gray-500 uppercase tracking-widest pl-2 opacity-50">
                            Drop words here
                        </span>
                    )}
                </div>

                {/* Available Words (Source Bank) */}
                <div className="flex flex-wrap gap-2 justify-center mt-2">
                    <AnimatePresence>
                        {scrambled.map((word, i) => (
                            <motion.button
                                layoutId={`word-source-${word}-${i}`}
                                key={`scr-${i}-${word}`}
                                whileHover={{ scale: 1.05, y: -2 }}
                                whileTap={{ scale: 0.95 }}
                                onClick={() => handleScrambleClick(word, i)}
                                className={`${data.compact ? 'px-2 py-1 text-[10px]' : 'px-4 py-2 text-sm'} bg-white/10 border border-white/20 text-white rounded-xl font-bold transition-all shadow-md hover:shadow-white/10`}
                            >
                                {word}
                            </motion.button>
                        ))}
                    </AnimatePresence>
                </div>
            </div>

            {/* Actions & Feedback */}
            <div className={`flex flex-col mt-auto ${data.compact ? 'gap-1' : 'gap-2'}`}>
                <div className="flex gap-2">
                    <button
                        onClick={reset}
                        className={`${data.compact ? 'p-1.5' : 'p-2.5'} bg-white/5 border border-white/10 rounded-xl text-gray-400 hover:text-white transition-all`}
                        title="Reset"
                    >
                        <RefreshCcw size={data.compact ? 14 : 18} />
                    </button>
                    <button
                        onClick={checkAnswer}
                        disabled={status === 'correct' || selected.length === 0}
                        className={`flex-1 rounded-xl font-black transition-all flex items-center justify-center gap-1 ${data.compact ? 'p-1.5 text-[9px]' : 'p-2.5 text-xs'} uppercase tracking-[0.1em] shadow-lg ${status === 'correct' ? 'bg-green-500 text-white shadow-green-500/20' :
                            status === 'incorrect' ? 'bg-red-500 text-white' :
                                'bg-accent text-white hover:bg-orange-500 shadow-accent/20'
                            } disabled:opacity-50 disabled:cursor-not-allowed`}
                    >
                        {status === 'correct' ? 'EXCELLENT!' : status === 'incorrect' ? 'TRY AGAIN' : 'CHECK ANSWER'}
                    </button>
                </div>

                <AnimatePresence>
                    {status !== 'idle' && (
                        <motion.div
                            initial={{ opacity: 0, y: 5 }}
                            animate={{ opacity: 1, y: 0 }}
                            exit={{ opacity: 0, y: 5 }}
                            className={`rounded-xl border flex items-center ${data.compact ? 'p-1.5 gap-2 text-[10px]' : 'p-3 gap-3 text-xs'} ${status === 'correct' ? 'bg-green-500/20 border-green-500/40 text-green-300' : 'bg-red-500/20 border-red-500/40 text-red-300'}`}
                        >
                            <div className={`p-1 rounded-full ${status === 'correct' ? 'bg-green-500/20' : 'bg-red-500/20'}`}>
                                {status === 'correct' ? <CheckCircle2 size={data.compact ? 12 : 16} /> : <XCircle size={data.compact ? 12 : 16} />}
                            </div>
                            <div>
                                <p className="font-black uppercase tracking-wider">{status === 'correct' ? 'Correct!' : 'Incorrect'}</p>
                                {status === 'incorrect' && <p className="opacity-80 mt-0.5">The correct answer is: {data.correctSentence}</p>}
                            </div>
                        </motion.div>
                    )}
                </AnimatePresence>
            </div>
        </div >
    );
};

export default WordBankBlock;
