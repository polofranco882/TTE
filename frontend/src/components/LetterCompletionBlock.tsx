import React, { useState, useRef, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { CheckCircle2, XCircle, RefreshCw } from 'lucide-react';

interface LetterCompletionBlockProps {
    data: {
        word: string;
        visibleIndices?: string; // e.g. "0,2,4"
        preset?: 'classic' | 'modern' | 'glass' | 'neon' | 'underline';
        bgColor?: string;
        textColor?: string;
        fontSize?: number;
        fontFamily?: string;
        indicatorPosition?: 'top' | 'bottom' | 'left' | 'right';
        gap?: number;
        boxSize?: number;
        height?: number; // Used for auto-scaling
    };
    isAdmin?: boolean;
    onComplete?: (isCorrect: boolean) => void;
}

const LetterCompletionBlock: React.FC<LetterCompletionBlockProps> = ({ data, isAdmin, onComplete }) => {
    const {
        word = 'ENGLISH',
        visibleIndices = '0,6',
        preset = 'modern',
        bgColor = 'transparent',
        textColor = '#ffffff',
        fontSize = 32,
        fontFamily = 'monospace',
        indicatorPosition = 'right',
        gap = 8,
        boxSize = 50,
        height = 120
    } = data;

    // Auto-scaling factor based on default height of 120px
    const scaleFactor = height / 120;
    const scaledFontSize = fontSize * scaleFactor;
    const scaledBoxSize = boxSize * scaleFactor;
    const scaledGap = gap * scaleFactor;

    const [status, setStatus] = useState<'idle' | 'correct' | 'incorrect'>('idle');
    const [shake, setShake] = useState(false);
    
    // Parse visible indices
    const visibleSet = new Set(
        visibleIndices.split(',').map(i => parseInt(i.trim())).filter(i => !isNaN(i))
    );

    // Initial user inputs state
    const [userInputs, setUserInputs] = useState<Record<number, string>>({});
    const inputRefs = useRef<Record<number, HTMLInputElement | null>>({});

    const characters = word.split('');

    const handleInputChange = (index: number, value: string) => {
        if (isAdmin || status === 'correct') return;
        
        const char = value.slice(-1).toUpperCase();
        setUserInputs(prev => ({ ...prev, [index]: char }));

        if (char && index < characters.length - 1) {
            // Find next hidden index
            let nextIndex = index + 1;
            while (nextIndex < characters.length && (visibleSet.has(nextIndex) || characters[nextIndex] === ' ')) {
                nextIndex++;
            }
            if (nextIndex < characters.length) {
                inputRefs.current[nextIndex]?.focus();
            }
        }
    };

    const handleKeyDown = (index: number, e: React.KeyboardEvent) => {
        if (e.key === 'Backspace' && !userInputs[index] && index > 0) {
            // Find previous hidden index
            let prevIndex = index - 1;
            while (prevIndex >= 0 && (visibleSet.has(prevIndex) || characters[prevIndex] === ' ')) {
                prevIndex--;
            }
            if (prevIndex >= 0) {
                inputRefs.current[prevIndex]?.focus();
            }
        } else if (e.key === 'Enter') {
            checkAnswer();
        }
    };

    const checkAnswer = () => {
        if (isAdmin || status === 'correct') return;

        const isCorrect = characters.every((char, i) => {
            if (char === ' ') return true;
            if (visibleSet.has(i)) return true;
            return (userInputs[i] || '').toUpperCase() === char.toUpperCase();
        });

        if (isCorrect) {
            setStatus('correct');
            onComplete?.(true);
        } else {
            setStatus('incorrect');
            setShake(true);
            setTimeout(() => setShake(false), 500);
            onComplete?.(false);
        }
    };

    const reset = () => {
        setUserInputs({});
        setStatus('idle');
    };

    const getIndicatorPositionClasses = () => {
        switch (indicatorPosition) {
            case 'bottom': return 'absolute -bottom-20 left-1/2 -translate-x-1/2 flex flex-col items-center gap-1 z-30';
            case 'left': return 'absolute top-1/2 -translate-y-1/2 -left-28 flex flex-col items-center gap-1 z-30';
            case 'right': return 'absolute top-1/2 -translate-y-1/2 -right-28 flex flex-col items-center gap-1 z-30';
            case 'top':
            default: return 'absolute -top-20 left-1/2 -translate-x-1/2 flex flex-col items-center gap-1 z-30';
        }
    };

    const getBoxStyles = (index: number, isInput: boolean) => {
        const isFilled = isInput ? !!userInputs[index] : true;
        
        switch (preset) {
            case 'modern':
                return `rounded-xl border-2 transition-all ${isInput ? (isFilled ? 'border-accent bg-accent/10' : 'border-white/10 bg-white/5') : 'border-transparent text-gray-400'}`;
            case 'glass':
                return `backdrop-blur-md border transition-all ${isInput ? 'bg-white/10 border-white/30' : 'bg-transparent border-transparent text-white/50'}`;
            case 'neon':
                return `border-2 transition-all ${isInput ? 'border-accent shadow-[0_0_10px_rgba(255,107,0,0.3)] bg-black' : 'border-transparent text-accent/50'}`;
            case 'underline':
                return `border-b-4 transition-all ${isInput ? (isFilled ? 'border-accent' : 'border-black/30') : 'border-transparent text-gray-400'}`;
            case 'classic':
            default:
                return `border-b-4 transition-all ${isInput ? 'border-black' : 'border-transparent text-gray-500'}`;
        }
    };

    return (
        <div 
            className="w-full h-full flex items-center justify-center p-4 relative block-interactive"
            style={{ backgroundColor: bgColor }}
        >
            <motion.div 
                animate={shake ? { x: [-5, 5, -5, 5, 0] } : {}}
                className="flex flex-wrap items-center justify-center relative"
                style={{ gap: `${scaledGap}px` }}
            >
                {characters.map((char, i) => {
                    if (char === ' ') {
                        return <div key={i} style={{ width: scaledBoxSize / 2 }} />;
                    }

                    const isHidden = !visibleSet.has(i);

                    return (
                        <div 
                            key={i}
                            className={`flex items-center justify-center font-black transition-all ${getBoxStyles(i, isHidden)}`}
                            style={{ 
                                width: scaledBoxSize, 
                                height: scaledBoxSize, 
                                fontSize: scaledFontSize,
                                fontFamily: fontFamily,
                                color: isHidden ? textColor : undefined
                            }}
                        >
                            {isHidden ? (
                                <input
                                    ref={el => { inputRefs.current[i] = el; }}
                                    type="text"
                                    maxLength={1}
                                    value={userInputs[i] || ''}
                                    onChange={(e) => handleInputChange(i, e.target.value)}
                                    onKeyDown={(e) => handleKeyDown(i, e)}
                                    disabled={status === 'correct' || isAdmin}
                                    className="w-full h-full bg-transparent text-center outline-none uppercase font-black"
                                    style={{ color: textColor }}
                                />
                            ) : (
                                <span>{char.toUpperCase()}</span>
                            )}
                        </div>
                    );
                })}

                <AnimatePresence>
                    {status !== 'idle' && (
                        <motion.div 
                            initial={{ scale: 0, opacity: 0 }}
                            animate={{ scale: 1, opacity: 1 }}
                            exit={{ scale: 0, opacity: 0 }}
                            className={getIndicatorPositionClasses()}
                        >
                            <div className="flex flex-col items-center gap-2">
                                {status === 'correct' ? (
                                    <>
                                        <div className="bg-green-500 text-white p-2 rounded-full shadow-lg">
                                            <CheckCircle2 size={24} />
                                        </div>
                                        <span className="text-[10px] font-black uppercase text-green-500 bg-white/90 px-2 py-0.5 rounded-full shadow-sm">Correct!</span>
                                    </>
                                ) : (
                                    <>
                                        <div className="bg-red-500 text-white p-2 rounded-full shadow-lg">
                                            <XCircle size={24} />
                                        </div>
                                        <span className="text-[10px] font-black uppercase text-red-500 bg-white/90 px-2 py-0.5 rounded-full shadow-sm">Incorrect!</span>
                                    </>
                                )}
                                {!isAdmin && (
                                    <button 
                                        onClick={reset}
                                        className={`p-1.5 bg-white/20 hover:bg-white/40 rounded-full transition-colors pointer-events-auto border shadow-sm ${status === 'correct' ? 'text-green-600 border-green-500/20' : 'text-red-600 border-red-500/20'}`}
                                        title="Retry"
                                    >
                                        <RefreshCw size={14} />
                                    </button>
                                )}
                            </div>
                        </motion.div>
                    )}
                </AnimatePresence>
            </motion.div>
        </div>
    );
};

export default LetterCompletionBlock;
