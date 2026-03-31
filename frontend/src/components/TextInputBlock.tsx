import React, { useState, useRef } from 'react';
import { useSmartBlockFocus } from '../hooks/useSmartBlockFocus';
import { motion, AnimatePresence } from 'framer-motion';
import { CheckCircle2, XCircle, Sparkles } from 'lucide-react';

interface TextInputBlockProps {
    data: any;
    isAdmin?: boolean;
    onComplete?: (isCorrect: boolean) => void;
}

const TextInputBlock: React.FC<TextInputBlockProps> = ({ data, isAdmin, onComplete }) => {
    const [value, setValue] = useState('');
    const [isCorrect, setIsCorrect] = useState<boolean | null>(null);
    const [hasAttempted, setHasAttempted] = useState(false);

    const containerRef = useRef<HTMLDivElement>(null);
    const { isFocused } = useSmartBlockFocus(containerRef, { disabled: isAdmin });

    const {
        placeholder = 'Type here...',
        fontSize = 16,
        color = '#ffffff',
        bgColor = 'transparent',
        align = 'left',
        correctAnswer = '',
        showValidation = false,
        successMessage = '',
    } = data;

    const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const val = e.target.value;
        setValue(val);

        if (showValidation && correctAnswer) {
            // Support multiple answers separated by | e.g. "Good morning|Buenos dias"
            const acceptedAnswers = correctAnswer.split('|').map((a: string) => a.trim().toLowerCase()).filter((a: string) => a.length > 0);
            const userVal = val.toLowerCase().trim();
            const correct = acceptedAnswers.some((ans: string) => ans === userVal);
            setIsCorrect(correct);
            if (val.trim().length > 0) setHasAttempted(true);
            if (onComplete) onComplete(correct);
        } else {
            setIsCorrect(null);
            if (onComplete) onComplete(true);
        }
    };

    // Determine visual state
    const isValidationActive = showValidation && correctAnswer && hasAttempted && !isAdmin;
    const showCorrectState = isValidationActive && isCorrect === true;
    const showIncorrectState = isValidationActive && isCorrect === false;

    // Dynamic border and glow colors
    const getBorderStyle = () => {
        if (showCorrectState) return { borderColor: '#22c55e', boxShadow: '0 0 20px rgba(34,197,94,0.3), 0 0 60px rgba(34,197,94,0.1), inset 0 0 20px rgba(34,197,94,0.05)' };
        if (showIncorrectState) return { borderColor: '#ef4444', boxShadow: '0 0 20px rgba(239,68,68,0.3), 0 0 60px rgba(239,68,68,0.1), inset 0 0 20px rgba(239,68,68,0.05)' };
        return { borderColor: bgColor === 'transparent' ? `${color}40` : 'transparent', boxShadow: 'none' };
    };

    const glowStyles = getBorderStyle();

    return (
        <div 
            ref={containerRef}
            className={`w-full h-full relative transition-all duration-500 group ${isFocused && !isAdmin ? 'scale-[1.02] z-[50] shadow-[0_10px_40px_rgba(255,100,0,0.15)] ring-2 ring-accent/40 rounded-[1.2rem]' : 'z-0'}`}
        >
            {/* Ambient glow behind input when correct */}
            <AnimatePresence>
                {showCorrectState && (
                    <motion.div
                        initial={{ opacity: 0, scale: 0.8 }}
                        animate={{ opacity: 1, scale: 1 }}
                        exit={{ opacity: 0, scale: 0.8 }}
                        className="absolute inset-0 rounded-xl bg-green-500/10 blur-xl -z-10"
                    />
                )}
            </AnimatePresence>

            {/* Main Input */}
            <motion.div
                className="w-full h-full relative"
                animate={showIncorrectState ? { x: [0, -4, 4, -4, 4, 0] } : {}}
                transition={{ duration: 0.4 }}
            >
                <input
                    type="text"
                    value={value}
                    onChange={handleChange}
                    placeholder={placeholder}
                    disabled={isAdmin || showCorrectState}
                    className={`w-full h-full outline-none transition-all duration-500 ${isAdmin ? 'pointer-events-none' : ''}`}
                    style={{
                        fontSize: `${fontSize}px`,
                        color: showCorrectState ? '#22c55e' : showIncorrectState ? '#ef4444' : color,
                        backgroundColor: showCorrectState ? 'rgba(34,197,94,0.08)' : showIncorrectState ? 'rgba(239,68,68,0.08)' : bgColor,
                        textAlign: align as any,
                        border: `2px solid ${glowStyles.borderColor}`,
                        borderRadius: bgColor === 'transparent' ? '12px' : '12px',
                        padding: '8px 16px',
                        boxShadow: glowStyles.boxShadow,
                        fontWeight: showCorrectState ? 700 : 500,
                        letterSpacing: showCorrectState ? '0.02em' : 'normal',
                    }}
                />

                {/* Inline status icon */}
                <AnimatePresence>
                    {isValidationActive && (
                        <motion.div
                            initial={{ opacity: 0, scale: 0, rotate: -180 }}
                            animate={{ opacity: 1, scale: 1, rotate: 0 }}
                            exit={{ opacity: 0, scale: 0, rotate: 180 }}
                            transition={{ type: 'spring', stiffness: 300, damping: 20 }}
                            className={`absolute right-3 top-1/2 -translate-y-1/2 p-1 rounded-full ${showCorrectState
                                ? 'bg-green-500/20 text-green-400'
                                : 'bg-red-500/20 text-red-400'
                                }`}
                        >
                            {showCorrectState
                                ? <CheckCircle2 size={Math.max(fontSize * 0.9, 16)} />
                                : <XCircle size={Math.max(fontSize * 0.9, 16)} />
                            }
                        </motion.div>
                    )}
                </AnimatePresence>
            </motion.div>

            {/* Success Message Banner */}
            <AnimatePresence>
                {showCorrectState && successMessage && (
                    <motion.div
                        initial={{ opacity: 0, y: -8, scale: 0.95 }}
                        animate={{ opacity: 1, y: 0, scale: 1 }}
                        exit={{ opacity: 0, y: -8 }}
                        transition={{ type: 'spring', stiffness: 200, damping: 15, delay: 0.15 }}
                        className="absolute top-full left-0 right-0 mt-2 z-20"
                    >
                        <div className="bg-gradient-to-r from-green-500/20 via-green-500/10 to-emerald-500/20 backdrop-blur-xl text-green-300 border border-green-500/30 px-4 py-2.5 rounded-xl text-sm font-bold shadow-[0_8px_30px_rgba(34,197,94,0.15)] flex items-center gap-2">
                            <div className="p-1 bg-green-500/20 rounded-full">
                                <Sparkles size={14} className="text-green-400" />
                            </div>
                            <span>{successMessage}</span>
                        </div>
                    </motion.div>
                )}
            </AnimatePresence>

            {/* Incorrect hint */}
            <AnimatePresence>
                {showIncorrectState && value.trim().length > 0 && (
                    <motion.div
                        initial={{ opacity: 0, y: -8 }}
                        animate={{ opacity: 1, y: 0 }}
                        exit={{ opacity: 0, y: -8 }}
                        className="absolute top-full left-0 right-0 mt-2 z-20"
                    >
                        <div className="bg-red-500/10 backdrop-blur-xl text-red-300 border border-red-500/20 px-4 py-2 rounded-xl text-xs font-bold shadow-lg flex items-center gap-2">
                            <div className="p-1 bg-red-500/20 rounded-full">
                                <XCircle size={12} className="text-red-400" />
                            </div>
                            <span>Not quite right. Try again!</span>
                        </div>
                    </motion.div>
                )}
            </AnimatePresence>

            {/* Admin hint showing correct answer */}
            {isAdmin && correctAnswer && (
                <div className="absolute -top-7 left-0 flex items-center gap-1 flex-wrap">
                    {correctAnswer.split('|').map((ans: string, i: number) => (
                        <span key={i} className="bg-accent/20 text-accent text-[9px] font-black uppercase px-2 py-0.5 rounded-lg border border-accent/30 whitespace-nowrap flex items-center gap-1 shadow-sm">
                            <CheckCircle2 size={8} />
                            {ans.trim()}
                        </span>
                    ))}
                </div>
            )}
        </div>
    );
};

export default TextInputBlock;
