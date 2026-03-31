import React, { useState, useRef, useEffect } from 'react';
import { useSmartBlockFocus } from '../hooks/useSmartBlockFocus';
import { motion, AnimatePresence } from 'framer-motion';
import { CheckCircle2, XCircle, RefreshCw } from 'lucide-react';

interface LetterCompletionBlockProps {
    data: {
        word: string;
        visibleIndices?: string; // e.g. "0,2,4"
        preset?: 'classic' | 'modern' | 'glass' | 'neon' | 'underline';
        bgColor?: string;
        hintColor?: string;
        answerColor?: string;
        fontSize?: number;
        fontFamily?: string;
        bold?: boolean;
        italic?: boolean;
        indicatorPosition?: 'top' | 'bottom' | 'left' | 'right';
        actionPosition?: 'top' | 'bottom' | 'left' | 'right';
        actionStyle?: 'minimal' | 'glass' | 'neon' | 'modern';
        actionLayout?: 'pill' | 'stack';
        actionSolid?: boolean;
        actionVisibleAlways?: boolean;
        gap?: number;
        boxSize?: number;
        height?: number;
        align?: 'left' | 'center' | 'right';
        actionOpacity?: number;
    };
    isAdmin?: boolean;
    onComplete?: (isCorrect: boolean) => void;
}

const LetterCompletionBlock: React.FC<LetterCompletionBlockProps> = ({ data, isAdmin, onComplete }) => {
    const {
        word = 'ENGLISH',
        visibleIndices = '0,6',
        preset = 'underline',
        bgColor = 'transparent',
        hintColor = '#000000',
        answerColor = '#2563eb',
        fontSize = 32,
        fontFamily = 'serif',
        bold = true,
        italic = false,
        actionStyle = 'minimal',
        actionLayout = 'pill',
        actionSolid = false,
        actionVisibleAlways = true,
        gap = 10,
        boxSize = 60,
        height = 80,
        align = 'left',
        actionOpacity = 100,
    } = data;

    // Auto-scaling factor based on default height of 120px
    const scaleFactor = height / 120;
    const scaledFontSize = fontSize * scaleFactor;
    const scaledBoxSize = boxSize * scaleFactor;
    const scaledGap = gap * scaleFactor;

    const [status, setStatus] = useState<'idle' | 'correct' | 'incorrect'>('idle');
    const [shake, setShake] = useState(false);
    
    // Auto-focus logic
    const containerRef = useRef<HTMLDivElement>(null);
    const { isFocused } = useSmartBlockFocus(containerRef, { disabled: isAdmin });
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
            e.stopPropagation();
            checkAnswer();
        } else if (e.key === ' ' || e.key === 'Spacebar') {
            e.preventDefault();
            e.stopPropagation();
            // Move to next field
            if (index < characters.length - 1) {
                let nextIndex = index + 1;
                while (nextIndex < characters.length && (visibleSet.has(nextIndex) || characters[nextIndex] === ' ')) {
                    nextIndex++;
                }
                if (nextIndex < characters.length) {
                    inputRefs.current[nextIndex]?.focus();
                }
            }
        } else {
            e.stopPropagation();
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
        const pos = data.actionPosition || 'right';
        switch (pos) {
            case 'bottom':
                return 'absolute -bottom-12 left-1/2 -translate-x-1/2 flex flex-row items-center gap-2 z-20';
            case 'left':
                return 'absolute top-1/2 -translate-y-1/2 -left-28 flex flex-row-reverse items-center gap-2 z-20';
            case 'right':
                return 'absolute top-1/2 -translate-y-1/2 -right-24 flex flex-row items-center gap-2 z-30';
            case 'top':
            default:
                return 'absolute -top-12 left-1/2 -translate-x-1/2 flex flex-row items-center gap-2 z-20';
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
                return `border-b-4 transition-all ${isInput ? (isFilled ? 'border-accent' : 'border-black/30') : 'border-transparent'}`;
            case 'classic':
            default:
                return `border-b-4 transition-all ${isInput ? 'border-black' : 'border-transparent text-gray-500'}`;
        }
    };

    const getAlignClasses = (type: 'container' | 'content') => {
        const a = align || 'left';
        if (type === 'container') {
            switch (a) {
                case 'left': return 'justify-start pl-2';
                case 'right': return 'justify-end pr-2';
                case 'center':
                default: return 'justify-center';
            }
        } else { // content (flex-wrap container)
            switch (a) {
                case 'left': return 'justify-start';
                case 'right': return 'justify-end';
                case 'center':
                default: return 'justify-center';
            }
        }
    };

    return (
        <div 
            ref={containerRef}
            className={`w-full h-full flex items-center relative block-interactive transition-all duration-500 ${getAlignClasses('container')} ${isFocused && !isAdmin ? 'scale-[1.05] md:scale-[1.02] z-[50] shadow-[0_10px_40px_rgba(255,100,0,0.15)] ring-2 ring-accent/40 rounded-[1.5rem]' : 'z-0'}`}
            onPointerDown={(e) => { if (!isAdmin) { e.stopPropagation(); e.nativeEvent.stopImmediatePropagation(); } }}
            onMouseDown={(e) => { if (!isAdmin) { e.stopPropagation(); e.nativeEvent.stopImmediatePropagation(); } }}
            onTouchStart={(e) => { if (!isAdmin) { e.stopPropagation(); e.nativeEvent.stopImmediatePropagation(); } }}
            onClick={(e) => {
                if (!isAdmin) {
                    // Stop event if it hits the container or its children (except the actual inputs handled below)
                    e.stopPropagation();
                    e.nativeEvent.stopImmediatePropagation();
                    
                    // If the user didn't click an input, find the MOST REASONABLE input to focus
                    if ((e.target as HTMLElement).tagName !== 'INPUT') {
                        const firstInputIndex = characters.findIndex((char, i) => !visibleSet.has(i) && char !== ' ');
                        if (firstInputIndex !== -1) {
                            inputRefs.current[firstInputIndex]?.focus();
                        }
                    }
                }
            }}
            style={{ backgroundColor: bgColor }}
        >
            <motion.div 
                animate={shake ? { x: [-5, 5, -5, 5, 0] } : {}}
                className={`flex flex-wrap items-center relative ${getAlignClasses('content')}`}
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
                            className={`flex items-center justify-center transition-all ${getBoxStyles(i, isHidden)}`}
                            style={{ 
                                width: scaledBoxSize, 
                                height: scaledBoxSize, 
                                fontSize: scaledFontSize,
                                fontFamily: fontFamily,
                                fontWeight: bold ? '900' : 'normal',
                                fontStyle: italic ? 'italic' : 'normal',
                                color: isHidden ? answerColor : hintColor
                            }}
                        >
                            {isHidden ? (
                                <input
                                    ref={el => { inputRefs.current[i] = el; }}
                                    type="text"
                                    inputMode="text"
                                    autoComplete="off"
                                    autoCorrect="off"
                                    autoCapitalize="characters"
                                    spellCheck={false}
                                    value={userInputs[i] || ''}
                                    onFocus={(e) => e.currentTarget.select()}
                                    onChange={(e) => {
                                        e.stopPropagation();
                                        handleInputChange(i, e.target.value);
                                    }}
                                    onKeyDown={(e) => handleKeyDown(i, e)}
                                    onClick={(e) => {
                                        e.stopPropagation();
                                        inputRefs.current[i]?.focus();
                                    }}
                                    onPointerDown={(e) => e.stopPropagation()}
                                    onMouseDown={(e) => e.stopPropagation()}
                                    onTouchStart={(e) => e.stopPropagation()}
                                    disabled={status === 'correct' || isAdmin}
                                    className={`w-full h-full bg-transparent text-center outline-none uppercase pointer-events-auto cursor-text text-inherit transition-all md:hover:bg-white/5 ${isFocused && document.activeElement === inputRefs.current[i] ? 'bg-white/10 rounded border-b-2 border-accent' : ''}`}
                                    style={{ 
                                        color: answerColor,
                                        fontWeight: bold ? '900' : 'normal',
                                        fontStyle: italic ? 'italic' : 'normal'
                                    }}
                                />
                            ) : (
                                <span>{char.toUpperCase()}</span>
                            )}
                        </div>
                    );
                })}

                <AnimatePresence>
                    {/* Status Feedback */}
                    {status !== 'idle' && (
                        <motion.div 
                            initial={{ scale: 0, opacity: 0 }}
                            animate={{ scale: 1, opacity: 1 }}
                            exit={{ scale: 0, opacity: 0 }}
                            className={getIndicatorPositionClasses()}
                        >
                            <div className="flex flex-row items-center gap-2 bg-white/20 backdrop-blur-md p-1 pr-3 rounded-full border border-white/30 shadow-xl pointer-events-auto min-w-max">
                                {status === 'correct' ? (
                                    <>
                                        <div className="bg-green-500 text-white p-1.5 rounded-full shadow-lg shrink-0">
                                            <CheckCircle2 size={18} />
                                        </div>
                                        <div className="flex flex-col -gap-1">
                                            <span className="text-[8px] font-black uppercase tracking-tighter text-green-600 block leading-none">Correct!</span>
                                            {!isAdmin && (
                                                <button 
                                                    onClick={reset}
                                                    className="text-[7px] font-bold uppercase text-gray-500 hover:text-green-600 transition-colors text-left"
                                                >
                                                    Tap to Reset
                                                </button>
                                            )}
                                        </div>
                                    </>
                                ) : (
                                    <>
                                        <div className="bg-red-500 text-white p-1.5 rounded-full shadow-lg shrink-0">
                                            <XCircle size={18} />
                                        </div>
                                        <div className="flex flex-col -gap-1">
                                            <span className="text-[8px] font-black uppercase tracking-tighter text-red-600 block leading-none">Incorrect!</span>
                                            {!isAdmin && (
                                                <button 
                                                    onClick={reset}
                                                    className="text-[7px] font-bold uppercase text-gray-500 hover:text-red-600 transition-colors text-left"
                                                >
                                                    Tap to Retry
                                                </button>
                                            )}
                                        </div>
                                    </>
                                )}
                            </div>
                        </motion.div>
                    )}

                    {/* Manual Check Button (for Mobile) - Visible when idle, with style variants */}
                    {status === 'idle' && (Object.keys(userInputs).length > 0 || isAdmin || actionVisibleAlways !== false) && (
                        <motion.div 
                            initial={{ scale: 0, opacity: 0, y: 10 }}
                            animate={{ 
                                scale: 1, 
                                opacity: (Object.keys(userInputs).length > 0 || isAdmin) ? (actionOpacity / 100) : (actionOpacity / 250), 
                                y: 0 
                            }}
                            exit={{ scale: 0, opacity: 0 }}
                            className={getIndicatorPositionClasses()}
                            style={{ opacity: actionOpacity / 100 }}
                        >
                            <button 
                                onClick={(e) => {
                                    e.stopPropagation();
                                    if (!isAdmin && Object.keys(userInputs).length > 0) checkAnswer();
                                }}
                                className={`flex items-center gap-2 pointer-events-auto transition-all transform hover:scale-105 active:scale-95 ${
                                    actionLayout === 'stack' ? 'flex-col gap-1' : 'flex-row gap-2'
                                } ${
                                    actionStyle === 'glass' && !actionSolid ? 'bg-black/40 backdrop-blur-xl border border-white/30 p-1.5 rounded-3xl shadow-[0_8px_32px_rgba(0,0,0,0.3),0_0_1px_rgba(255,255,255,0.4)]' :
                                    actionStyle === 'neon' ? 'bg-accent/20 border border-accent/50 p-1.5 rounded-3xl shadow-[0_0_15px_rgba(255,107,0,0.5)]' :
                                    actionStyle === 'modern' ? 'bg-gradient-to-r from-accent to-orange-600 text-white p-1.5 rounded-3xl shadow-lg' :
                                    'bg-accent text-white p-1.5 rounded-3xl shadow-lg'
                                } ${
                                    actionLayout === 'pill' ? 'pr-4' : 'pt-2 px-2 pb-1.5'
                                } ${actionSolid ? 'bg-accent/100 border-accent/20' : ''}`}
                                style={{ transform: `scale(${Math.max(0.7, Math.min(1.2, scaleFactor))})` }}
                            >
                                <div className={`p-1.5 rounded-2xl shadow-sm shrink-0 ${
                                    actionLayout === 'stack' ? 'w-10 h-10 flex items-center justify-center' : ''
                                } ${
                                    actionStyle === 'glass' && !actionSolid ? 'bg-white/10 text-white' :
                                    actionStyle === 'neon' ? 'bg-accent text-white shadow-[0_0_10px_rgba(255,107,0,0.5)]' :
                                    actionStyle === 'modern' ? 'bg-white text-accent' :
                                    'bg-white text-accent'
                                }`}>
                                    <CheckCircle2 size={actionLayout === 'stack' ? 20 : 16} />
                                </div>
                                <span className={`text-[9px] font-black uppercase tracking-widest ${
                                    actionLayout === 'stack' ? 'bg-white/10 px-2 py-0.5 rounded-md text-white' : 'text-white'
                                }`}>Check</span>
                            </button>
                        </motion.div>
                    )}
                </AnimatePresence>
            </motion.div>
        </div>
    );
};

export default LetterCompletionBlock;
