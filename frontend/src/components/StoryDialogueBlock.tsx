import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { MessageSquare, Check } from 'lucide-react';

interface StoryDialogueBlockProps {
    data: {
        characterId?: string;
        dialogueText?: string;
        userOptions?: { id: string; text: string; isCorrect: boolean }[];
        compact?: boolean;
    };
    onComplete?: (isCorrect: boolean) => void;
    isAdmin?: boolean;
}

const StoryDialogueBlock: React.FC<StoryDialogueBlockProps> = ({ data, onComplete, isAdmin }) => {
    const [selectedOptionId, setSelectedOptionId] = useState<string | null>(null);
    const [status, setStatus] = useState<'idle' | 'correct' | 'incorrect'>('idle');

    const defaultOptions = data.userOptions?.length ? data.userOptions : [
        { id: '1', text: 'Option 1 (Correct)', isCorrect: true },
        { id: '2', text: 'Option 2 (Wrong)', isCorrect: false }
    ];

    const handleSelect = (option: { id: string; text: string; isCorrect: boolean }) => {
        if (status === 'correct') return;

        setSelectedOptionId(option.id);
        setStatus(option.isCorrect ? 'correct' : 'incorrect');
        onComplete?.(option.isCorrect);
    };

    return (
        <div className={`w-full h-full flex flex-col overflow-y-auto custom-scrollbar ${data.compact ? 'p-2' : 'p-4'} bg-[#f9fafb] border border-gray-200 rounded-[2rem]`}>

            <div className="flex items-center gap-2 mb-4 px-2 text-gray-400">
                <MessageSquare size={14} />
                <span className="text-[10px] font-black uppercase tracking-widest text-gray-400">Interactive Story</span>
            </div>

            <div className="flex-1 flex flex-col gap-6 w-full max-w-md mx-auto">
                {/* Character Profile & Dialogue Bubble */}
                <div className="flex gap-3 items-end">
                    <div className="w-12 h-12 bg-purple-200 rounded-full flex-shrink-0 flex items-center justify-center border-2 border-purple-300 shadow-sm overflow-hidden">
                        {/* Mock Avatar */}
                        <img src="https://api.dicebear.com/7.x/avataaars/svg?seed=Felix&backgroundColor=e9d5ff" alt="Character" className="w-full h-full object-cover" />
                    </div>

                    <div className="flex-1">
                        <motion.div
                            initial={{ opacity: 0, scale: 0.9, x: -20 }}
                            animate={{ opacity: 1, scale: 1, x: 0 }}
                            className="bg-white border-2 border-gray-200 p-4 rounded-2xl rounded-bl-none text-gray-700 shadow-sm relative"
                        >
                            <p className="font-medium">{data.dialogueText || "Hello there! How are you doing today?"}</p>
                        </motion.div>
                    </div>
                </div>

                {/* User Response Options */}
                <div className="flex flex-col gap-2 mt-auto">
                    <AnimatePresence>
                        {defaultOptions.map((opt) => {
                            const isSelected = selectedOptionId === opt.id;
                            const isCorrect = isSelected && status === 'correct';
                            const isError = isSelected && status === 'incorrect';

                            // If correct, hide other options
                            if (status === 'correct' && !isSelected) return null;

                            return (
                                <motion.button
                                    layout
                                    initial={{ opacity: 0, y: 10 }}
                                    animate={{ opacity: 1, y: 0 }}
                                    exit={{ opacity: 0, scale: 0.9 }}
                                    key={opt.id}
                                    onClick={() => handleSelect(opt)}
                                    disabled={status === 'correct'}
                                    className={`
                                        w-full text-left p-4 rounded-2xl border-2 font-bold transition-all flex items-center justify-between
                                        ${isCorrect ? 'bg-green-50 border-green-400 text-green-700 shadow-md' :
                                            isError ? 'bg-red-50 border-red-300 text-red-600' :
                                                'bg-white border-gray-200 text-gray-600 hover:border-blue-400 hover:bg-blue-50'}
                                    `}
                                >
                                    <span>{opt.text}</span>
                                    {isCorrect && <Check size={20} className="text-green-500" />}
                                </motion.button>
                            );
                        })}
                    </AnimatePresence>

                    {isAdmin && status === 'idle' && (
                        <div className="text-center mt-2 opacity-50 text-[10px] uppercase font-bold text-gray-400">(Options are previewed above)</div>
                    )}
                </div>
            </div>
        </div>
    );
};

export default StoryDialogueBlock;
