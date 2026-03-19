import React, { useState } from 'react';
import { motion } from 'framer-motion';
import { BookOpen, CheckCircle2, XCircle } from 'lucide-react';

interface ReadingCompBlockProps {
    data: {
        storyText?: string;
        question?: string;
        options?: { id: string; text: string; isCorrect: boolean }[];
        compact?: boolean;
    };
    onComplete?: (isCorrect: boolean) => void;
    isAdmin?: boolean;
}

const ReadingCompBlock: React.FC<ReadingCompBlockProps> = ({ data, onComplete }) => {
    const [selectedOptionId, setSelectedOptionId] = useState<string | null>(null);
    const [status, setStatus] = useState<'idle' | 'correct' | 'incorrect'>('idle');

    const defaultOptions = data.options?.length ? data.options : [
        { id: '1', text: 'Option A (Correct)', isCorrect: true },
        { id: '2', text: 'Option B (Wrong)', isCorrect: false },
        { id: '3', text: 'Option C (Wrong)', isCorrect: false }
    ];

    const handleSelect = (option: { id: string; text: string; isCorrect: boolean }) => {
        if (status === 'correct') return;

        setSelectedOptionId(option.id);
        setStatus(option.isCorrect ? 'correct' : 'incorrect');
        onComplete?.(option.isCorrect);
    };

    return (
        <div className={`w-full h-full flex flex-col overflow-hidden ${data.compact ? '' : ''} bg-white border border-slate-200 rounded-3xl`}>

            {/* Split View: Top is Reading, Bottom is Quiz */}

            {/* Reading Pane */}
            <div className={`flex-1 overflow-y-auto custom-scrollbar ${data.compact ? 'p-3' : 'p-6'} bg-amber-50/30 border-b border-slate-200`}>
                <div className="flex items-center gap-2 mb-4 text-amber-700">
                    <BookOpen size={data.compact ? 16 : 20} />
                    <span className="text-[10px] font-black uppercase tracking-widest text-amber-700/80">Read and answer</span>
                </div>

                <div className={`prose prose-slate max-w-none ${data.compact ? 'text-sm' : 'text-base font-medium leading-relaxed text-slate-700'}`}>
                    <p>
                        {data.storyText || "Once upon a time in a digital kingdom, there lived a humble developer who sought to build the most interactive and engaging learning platform the world had ever seen. Every day, they wrote lines of code, fighting off menacing bugs and navigating the complex architecture of their application."}
                    </p>
                </div>
            </div>

            {/* Quiz Pane */}
            <div className={`flex flex-col flex-shrink-0 ${data.compact ? 'p-3 gap-3' : 'p-6 gap-4'} bg-slate-50`}>
                <h3 className={`font-bold text-slate-800 ${data.compact ? 'text-sm' : 'text-lg'}`}>
                    {data.question || "What did the developer do every day?"}
                </h3>

                <div className="flex flex-col gap-2">
                    {defaultOptions.map((opt) => {
                        const isSelected = selectedOptionId === opt.id;
                        const isCorrect = isSelected && status === 'correct';
                        const isError = isSelected && status === 'incorrect';

                        return (
                            <motion.button
                                whileHover={{ scale: status === 'correct' ? 1 : 1.01 }}
                                whileTap={{ scale: status === 'correct' ? 1 : 0.98 }}
                                key={opt.id}
                                onClick={() => handleSelect(opt)}
                                disabled={status === 'correct'}
                                className={`
                                    w-full text-left p-3 rounded-2xl border-2 font-bold transition-all flex items-center gap-3
                                    ${isCorrect ? 'bg-green-50 border-green-500 text-green-700 shadow-sm' :
                                        isError ? 'bg-red-50 border-red-300 text-red-600' :
                                            'bg-white border-slate-200 text-slate-600 hover:border-blue-400 hover:bg-blue-50'}
                                `}
                            >
                                {/* Radio Circle */}
                                <div className={`w-5 h-5 rounded-full border-2 flex items-center justify-center
                                    ${isCorrect ? 'border-green-500 bg-green-500' :
                                        isError ? 'border-red-400 bg-red-400' :
                                            'border-slate-300 bg-white group-hover:border-blue-400'}
                                `}>
                                    {isCorrect && <CheckCircle2 size={12} className="text-white" />}
                                    {isError && <XCircle size={12} className="text-white" />}
                                </div>
                                <span className={`flex-1 ${isCorrect || isError ? 'text-inherit' : 'text-slate-700'}`}>
                                    {opt.text}
                                </span>
                            </motion.button>
                        );
                    })}
                </div>
            </div>

        </div>
    );
};

export default ReadingCompBlock;
