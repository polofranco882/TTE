import React, { useState, useEffect, useRef } from 'react';
import { useSmartBlockFocus } from '../hooks/useSmartBlockFocus';
import { motion, AnimatePresence } from 'framer-motion';
import { CheckCircle2, XCircle, RefreshCcw } from 'lucide-react';

interface ClozeBlockProps {
    data: {
        textWithBlanks?: string; // e.g. "The quick brown [fox] jumps."
        hideQuestion?: boolean;
        compact?: boolean;
    };
    onComplete?: (isCorrect: boolean) => void;
    isAdmin?: boolean;
}

interface ParsedToken {
    type: 'text' | 'blank';
    value: string; // Display value (first answer)
    answers: string[]; // All valid answers for this blank
    id: string;
}

const ClozeBlock: React.FC<ClozeBlockProps> = ({ data, onComplete, isAdmin }) => {
    const [tokens, setTokens] = useState<ParsedToken[]>([]);
    const [inputs, setInputs] = useState<Record<string, string>>({});
    const [status, setStatus] = useState<'idle' | 'correct' | 'incorrect'>('idle');
    const [blankResults, setBlankResults] = useState<Record<string, boolean>>({});

    const containerRef = useRef<HTMLDivElement>(null);
    const { isFocused } = useSmartBlockFocus(containerRef, { disabled: isAdmin });

    useEffect(() => {
        // Parse "Hello [world]" into [{type:'text', value:'Hello '}, {type:'blank', value:'world'}]
        const rawText = data.textWithBlanks || "Fill in the [blank]";
        const regex = /\[(.*?)\]/g;
        let lastIndex = 0;
        let match;
        const newTokens: ParsedToken[] = [];
        let blankCounter = 0;

        while ((match = regex.exec(rawText)) !== null) {
            if (match.index > lastIndex) {
                newTokens.push({
                    type: 'text',
                    value: rawText.substring(lastIndex, match.index),
                    answers: [],
                    id: `text-${lastIndex}`
                });
            }
            // Support multiple answers separated by | e.g. [fox|dog|cat]
            const rawAnswer = match[1];
            const answers = rawAnswer.split('|').map(a => a.trim()).filter(a => a.length > 0);
            newTokens.push({
                type: 'blank',
                value: answers[0] || rawAnswer, // Display value = first answer
                answers,
                id: `blank-${blankCounter++}`
            });
            lastIndex = regex.lastIndex;
        }

        if (lastIndex < rawText.length) {
            newTokens.push({
                type: 'text',
                value: rawText.substring(lastIndex),
                answers: [],
                id: `text-${lastIndex}`
            });
        }

        setTokens(newTokens);
        setInputs({});
        setStatus('idle');
        setBlankResults({});
    }, [data.textWithBlanks]);

    const handleInputChange = (id: string, val: string) => {
        if (status === 'correct') return;
        setInputs(prev => ({ ...prev, [id]: val }));
        setStatus('idle');
        setBlankResults({}); // Clear individual errors on type
    };

    const checkAnswer = () => {
        let allCorrect = true;
        const newResults: Record<string, boolean> = {};

        tokens.forEach(token => {
            if (token.type === 'blank') {
                const userAnswer = (inputs[token.id] || '').trim().toLowerCase();
                // Check against all valid answers
                const isMatch = token.answers.some(ans => ans.trim().toLowerCase() === userAnswer);
                newResults[token.id] = isMatch;
                if (!isMatch) allCorrect = false;
            }
        });

        setBlankResults(newResults);
        setStatus(allCorrect ? 'correct' : 'incorrect');

        onComplete?.(allCorrect);
    };

    const reset = () => {
        setInputs({});
        setStatus('idle');
        setBlankResults({});
    };

    const isCheckDisabled = status === 'correct' || tokens.filter(t => t.type === 'blank').some(t => !(inputs[t.id] || '').trim());

    return (
        <div 
            ref={containerRef}
            className={`w-full h-full flex flex-col overflow-y-auto custom-scrollbar ${data.compact ? 'p-1 gap-1' : 'p-4 gap-4'} border border-white/5 rounded-2xl transition-all duration-500 ${isFocused && !isAdmin ? 'scale-[1.02] z-[50] ring-2 ring-accent/40 shadow-[0_10px_40px_rgba(255,100,0,0.15)] bg-black/70 backdrop-blur-md' : 'bg-black/40 z-0'}`}
        >
            {/* Header */}
            {!data.hideQuestion && (
                <div className="text-center mb-2">
                    <p className={`text-[10px] uppercase font-black tracking-widest text-accent mb-1`}>Fill in the blanks</p>
                    <h3 className={`${data.compact ? 'text-xs' : 'text-sm'} font-bold text-white leading-tight`}>Complete the sentence</h3>
                </div>
            )}

            {/* Interaction Area */}
            <div className="flex-1 flex flex-col justify-center items-center">
                <div className={`leading-loose ${data.compact ? 'text-xs' : 'text-lg'} text-center max-w-2xl px-4`}>
                    {tokens.map(token => {
                        if (token.type === 'text') {
                            return <span key={token.id} className="text-white font-medium">{token.value}</span>;
                        } else {
                            const isCorrect = blankResults[token.id] === true;
                            const isIncorrect = blankResults[token.id] === false;

                            return (
                                <span key={token.id} className="inline-block mx-1">
                                    <input
                                        type="text"
                                        value={inputs[token.id] || ''}
                                        onChange={(e) => handleInputChange(token.id, e.target.value)}
                                        onKeyDown={(e) => e.key === 'Enter' && !isCheckDisabled && checkAnswer()}
                                        disabled={status === 'correct'}
                                        style={{ width: `${Math.max(Math.max(...token.answers.map(a => a.length)) * 0.8, 3)}em` }}
                                        className={`
                                            bg-black/30 border-b-2 text-center text-white font-bold outline-none px-1 rounded-sm
                                            transition-all duration-300 placeholder:text-white/20
                                            ${isCorrect ? 'border-green-500 text-green-400 bg-green-500/10' :
                                                isIncorrect ? 'border-red-500 text-red-400 bg-red-500/10' :
                                                    'border-white/30 focus:border-accent focus:bg-white/10 focus:scale-[1.15] focus:shadow-xl focus:z-10 focus:-translate-y-1 relative'}
                                        `}
                                    />
                                    {isAdmin && !inputs[token.id] && status === 'idle' && (
                                        <span className="absolute -mt-6 ml-[-2em] text-[8px] text-accent/50 opacity-0 hover:opacity-100 transition-opacity pointer-events-none">
                                            {token.value}
                                        </span>
                                    )}
                                </span>
                            );
                        }
                    })}
                </div>
            </div>

            {/* Actions & Feedback */}
            <div className={`flex flex-col mt-auto ${data.compact ? 'gap-1' : 'gap-3'} px-2`}>
                <div className="flex gap-2">
                    <button
                        onClick={reset}
                        className={`${data.compact ? 'p-1.5' : 'p-3'} bg-white/5 border border-white/10 rounded-xl text-gray-400 hover:text-white transition-all`}
                        title="Reset"
                    >
                        <RefreshCcw size={data.compact ? 14 : 18} />
                    </button>
                    <button
                        onClick={checkAnswer}
                        disabled={isCheckDisabled}
                        className={`flex-1 rounded-xl font-black transition-all flex items-center justify-center gap-2 ${data.compact ? 'p-1.5 text-[9px]' : 'p-3 text-sm'} uppercase tracking-[0.1em] shadow-lg ${status === 'correct' ? 'bg-green-500 text-white shadow-green-500/20' :
                            status === 'incorrect' ? 'bg-red-500 text-white' :
                                'bg-accent text-white hover:bg-orange-500 shadow-accent/20'
                            } disabled:opacity-50 disabled:cursor-not-allowed`}
                    >
                        {status === 'correct' ? 'PERFECT!' : status === 'incorrect' ? 'CHECK AGAIN' : 'CHECK ANSWER'}
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
                            <div className={`rounded-xl border flex items-center ${data.compact ? 'p-2 gap-2 text-[10px]' : 'p-3 gap-3 text-sm'} ${status === 'correct' ? 'bg-green-500/20 border-green-500/40 text-green-300' : 'bg-red-500/20 border-red-500/40 text-red-300'}`}>
                                <div className={`p-1 rounded-full ${status === 'correct' ? 'bg-green-500/20' : 'bg-red-500/20'}`}>
                                    {status === 'correct' ? <CheckCircle2 size={data.compact ? 14 : 18} /> : <XCircle size={data.compact ? 14 : 18} />}
                                </div>
                                <div>
                                    <p className="font-black uppercase tracking-wider">{status === 'correct' ? 'Correct!' : 'Almost there'}</p>
                                    {status === 'incorrect' && <p className="opacity-80 mt-0.5 text-xs">Review the highlighted fields.</p>}
                                </div>
                            </div>
                        </motion.div>
                    )}
                </AnimatePresence>
            </div>
        </div>
    );
};

export default ClozeBlock;
