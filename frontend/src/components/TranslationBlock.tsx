import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Languages, CheckCircle2, RefreshCcw } from 'lucide-react';

interface TranslationBlockProps {
    data: {
        sourceText?: string;
        targetLanguage?: string;
        compact?: boolean;
    };
    onComplete?: (isCorrect: boolean) => void;
    isAdmin?: boolean;
}

const TranslationBlock: React.FC<TranslationBlockProps> = ({ data, onComplete }) => {
    const [translation, setTranslation] = useState('');
    const [status, setStatus] = useState<'idle' | 'submitted'>('idle');

    // In a real Duolingo app, translation validation is complex (NLP / multiple correct answers).
    // Here we'll just simulate a successful submit or a simple string check if we had a target string.
    // For this demonstration, we'll auto-validate as 'submitted' so the lesson can continue.

    const checkAnswer = () => {
        if (!translation.trim()) return;
        setStatus('submitted');
        onComplete?.(true); // Always correct for free-form in this demo, unless NLP is added
    };

    const reset = () => {
        setTranslation('');
        setStatus('idle');
    };

    return (
        <div className={`w-full h-full flex flex-col overflow-y-auto custom-scrollbar ${data.compact ? 'p-3 gap-3' : 'p-6 gap-6'} bg-white border-2 border-slate-200 rounded-3xl shadow-sm`}>
            {/* Header & Source Text */}
            <div className="flex flex-col gap-2">
                <div className="flex items-center gap-2 text-slate-400">
                    <Languages size={data.compact ? 14 : 18} />
                    <span className="text-[10px] font-black uppercase tracking-widest">Translate this sentence</span>
                    {data.targetLanguage && (
                        <span className="ml-auto text-[10px] bg-slate-100 text-slate-500 px-2 py-0.5 rounded-full font-bold uppercase">
                            to {data.targetLanguage}
                        </span>
                    )}
                </div>

                {/* Chat bubble tail styling for the source text */}
                <div className="relative mt-2">
                    <div className="absolute -top-2 left-6 w-4 h-4 bg-blue-50 border-t border-l border-blue-100 rotate-45 transform origin-bottom-left"></div>
                    <div className="relative bg-blue-50 border border-blue-100 p-4 rounded-2xl rounded-tl-none text-slate-700 font-medium text-lg shadow-sm">
                        {data.sourceText || 'How are you today?'}
                    </div>
                </div>
            </div>

            {/* Input Area */}
            <div className="flex-1 flex flex-col">
                <textarea
                    value={translation}
                    onChange={(e) => { setTranslation(e.target.value); setStatus('idle'); }}
                    disabled={status === 'submitted'}
                    placeholder="Type translation here..."
                    className={`
                        w-full flex-1 resize-none bg-slate-50 border-2 rounded-2xl text-slate-800 font-medium outline-none transition-all custom-scrollbar min-h-[100px]
                        ${data.compact ? 'p-3 text-sm' : 'p-4 text-base'} 
                        ${status === 'submitted' ? 'border-green-400 bg-green-50' : 'border-slate-200 focus:border-blue-400 focus:bg-white'}
                    `}
                />
            </div>

            {/* Actions & Feedback */}
            <div className={`flex flex-col mt-auto ${data.compact ? 'gap-2' : 'gap-3'}`}>
                <div className="flex gap-2">
                    <button onClick={reset} className="p-3 bg-slate-100 text-slate-400 hover:text-slate-600 rounded-xl transition-colors shrink-0">
                        <RefreshCcw size={20} />
                    </button>
                    <button
                        onClick={checkAnswer}
                        disabled={status === 'submitted' || !translation.trim()}
                        className={`flex-1 rounded-xl font-black transition-all flex items-center justify-center gap-2 ${data.compact ? 'p-3 text-[10px]' : 'p-4 text-sm'} uppercase tracking-[0.1em] shadow-md ${status === 'submitted' ? 'bg-green-500 text-white shadow-green-500/20' :
                            'bg-blue-500 text-white hover:bg-blue-400 shadow-blue-500/20'
                            } disabled:opacity-50 disabled:cursor-not-allowed`}
                    >
                        {status === 'submitted' ? 'SUBMITTED' : 'CHECK'}
                    </button>
                </div>

                <AnimatePresence>
                    {status === 'submitted' && (
                        <motion.div initial={{ opacity: 0, y: 5 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: 5 }}>
                            <div className="rounded-xl border flex items-center p-3 gap-3 text-sm bg-green-50 border-green-200 text-green-700">
                                <CheckCircle2 size={20} className="text-green-500" />
                                <p className="font-bold">Translation accepted!</p>
                            </div>
                        </motion.div>
                    )}
                </AnimatePresence>
            </div>
        </div>
    );
};

export default TranslationBlock;
