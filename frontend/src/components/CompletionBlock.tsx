import React, { useState, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { CheckCircle2, XCircle, RefreshCw } from 'lucide-react';

interface CompletionBlockProps {
    data: {
        title?: string;
        correctAnswers?: string[];
        caseSensitive?: boolean;
        preset?: 'classic' | 'modern' | 'glass' | 'neon';
        bgColor?: string;
        textColor?: string;
        titleColor?: string;
        fontFamily?: string;
        fontSize?: number;
        height?: number;
        placeholder?: string;
        inputWidth?: number | string;
        align?: 'left' | 'center' | 'right';
        bold?: boolean;
        italic?: boolean;
        underline?: boolean;
        indicatorPosition?: 'top' | 'bottom' | 'left' | 'right';
        actionPosition?: 'top' | 'bottom' | 'left' | 'right';
        actionStyle?: 'minimal' | 'glass' | 'neon' | 'modern';
        actionVisibleAlways?: boolean;
    };
    isAdmin?: boolean;
    onComplete?: (isCorrect: boolean) => void;
}

const CompletionBlock: React.FC<CompletionBlockProps> = ({ data, isAdmin, onComplete }) => {
    const [inputValue, setInputValue] = useState('');
    const [status, setStatus] = useState<'idle' | 'correct' | 'incorrect'>('idle');
    const [shake, setShake] = useState(false);
    const inputRef = useRef<HTMLInputElement>(null);

    const {
        title = 'Good',
        correctAnswers = ['night'],
        caseSensitive = false,
        preset = 'classic',
        bgColor = '#d1d1a1',
        textColor = '#000000',
        titleColor = '#000000',
        fontFamily = 'serif',
        fontSize = 24,
        placeholder = '...',
        inputWidth = 'auto',
        align = 'center',
        bold = false,
        italic = false,
        underline = false,
    } = data;

    const checkAnswer = () => {
        if (isAdmin || status !== 'idle') return;

        const val = inputValue.trim();
        if (!val) return;

        const isCorrect = correctAnswers.some(ans => {
            const trimmedAns = ans.trim();
            if (!trimmedAns.includes('%')) {
                // Exact matching
                if (caseSensitive) {
                    return trimmedAns === val;
                }
                return trimmedAns.toLowerCase() === val.toLowerCase();
            } else {
                // Wildcard matching (% like SQL LIKE)
                // 1. Escape special characters (\ -> \\, . -> \., etc.)
                // 2. Replace % with .*
                // 3. Match from start to end (^...$)
                const regexPattern = '^' + trimmedAns
                    .replace(/[.*+?^${}()|[\]\\]/g, '\\$&') // escape regex chars
                    .replace(/%/g, '.*') + '$';             // replace % with wildcard
                
                const regex = new RegExp(regexPattern, caseSensitive ? '' : 'i');
                return regex.test(val);
            }
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
        setInputValue('');
        setStatus('idle');
    };

    // Preset styles
    const getPresetStyles = () => {
        switch (preset) {
            case 'modern':
                return {
                    container: 'rounded-2xl shadow-lg border border-white/20 p-8',
                    input: 'border-b-2 border-accent bg-transparent focus:outline-none px-2 py-1',
                    title: 'font-sans font-bold italic'
                };
            case 'glass':
                return {
                    container: 'backdrop-blur-xl bg-white/10 rounded-3xl border border-white/30 p-10 shadow-[0_8px_32px_0_rgba(31,38,135,0.37)]',
                    input: 'border-b border-white/50 bg-white/5 focus:bg-white/10 transition-all rounded-t-lg px-3 py-1 outline-none text-white',
                    title: 'font-sans font-light tracking-widest text-white'
                };
            case 'neon':
                return {
                    container: 'bg-black rounded-xl border-2 border-accent shadow-[0_0_15px_rgba(255,107,0,0.5)] p-8',
                    input: 'bg-transparent border-b-2 border-accent text-accent shadow-[0_5px_10px_rgba(255,107,0,0.2)] focus:outline-none px-2 py-1 placeholder-accent/30',
                    title: 'font-mono uppercase text-accent drop-shadow-[0_0_5px_rgba(255,107,0,0.8)]'
                };
            case 'classic':
            default:
                return {
                    container: 'p-6',
                    input: 'border-b-2 border-black bg-transparent focus:outline-none px-1',
                    title: ''
                };
        }
    };

    const styles = getPresetStyles();
    
    const getIndicatorPositionClasses = () => {
        const pos = data.actionPosition || 'right';
        switch (pos) {
            case 'bottom':
                return 'absolute -bottom-20 left-1/2 -translate-x-1/2 flex flex-col items-center gap-1 z-20';
            case 'left':
                return 'absolute top-1/2 -translate-y-1/2 -left-24 flex flex-col items-center gap-1 z-20';
            case 'right':
                return 'absolute top-1/2 -translate-y-1/2 -right-20 flex flex-col items-center gap-1 z-30';
            case 'top':
            default:
                return 'absolute -top-16 left-1/2 -translate-x-1/2 flex flex-col items-center gap-1 z-20';
        }
    };

    return (
        <div 
            className={`w-full h-full flex items-center overflow-visible transition-all duration-500 block-interactive ${styles.container}`}
            onPointerDown={(e) => { if (!isAdmin) e.stopPropagation(); }}
            onMouseDown={(e) => { if (!isAdmin) e.stopPropagation(); }}
            onTouchStart={(e) => { if (!isAdmin) e.stopPropagation(); }}
            onClick={() => { if (!isAdmin && status === 'idle') inputRef.current?.focus(); }}
            style={{ 
                backgroundColor: preset === 'neon' ? '#000' : (preset === 'glass' ? 'transparent' : bgColor),
                fontFamily: fontFamily,
                justifyContent: align === 'left' ? 'flex-start' : (align === 'right' ? 'flex-end' : 'center'),
                textAlign: align,
                fontWeight: bold ? 'bold' : 'normal',
                fontStyle: italic ? 'italic' : 'normal',
                textDecoration: underline ? 'underline' : 'none'
            }}
        >
            <motion.div 
                animate={shake ? { x: [-5, 5, -5, 5, 0] } : {}}
                className={`flex items-baseline gap-4 flex-wrap relative scale-110 ${align === 'left' ? 'justify-start' : (align === 'right' ? 'justify-end' : 'justify-center')}`}
            >
                <span 
                    className={`block leading-none ${styles.title}`}
                    style={{ 
                        color: preset === 'neon' ? undefined : titleColor,
                        fontSize: `${fontSize}px`
                    }}
                >
                    {title}
                </span>

                <div className="relative group inline-grid">
                    <span 
                        className="invisible pointer-events-none whitespace-pre col-start-1 row-start-1 px-4"
                        style={{ 
                            fontSize: `${fontSize}px`,
                            fontFamily: fontFamily,
                            minWidth: inputWidth === 'auto' ? '60px' : (typeof inputWidth === 'number' ? `${inputWidth}px` : inputWidth),
                            width: inputWidth === 'auto' ? undefined : (typeof inputWidth === 'number' ? `${inputWidth}px` : inputWidth)
                        }}
                    >
                        {inputValue || placeholder}
                    </span>
                    <input
                        ref={inputRef}
                        type="text"
                        value={inputValue}
                        onChange={(e) => setInputValue(e.target.value)}
                        onKeyDown={(e) => {
                            e.stopPropagation();
                            if (e.key === 'Enter') checkAnswer();
                        }}
                        onPointerDown={(e) => e.stopPropagation()}
                        onMouseDown={(e) => e.stopPropagation()}
                        onTouchStart={(e) => e.stopPropagation()}
                        disabled={status === 'correct'}
                        placeholder={placeholder}
                        className={`text-center transition-all col-start-1 row-start-1 w-full bg-transparent outline-none pointer-events-auto ${styles.input}`}
                        style={{ 
                            color: preset === 'neon' ? undefined : textColor,
                            fontSize: `${fontSize}px`,
                        }}
                    />
                    
                    {/* Visual indicators */}
                    <AnimatePresence>
                        {status === 'correct' && (
                            <motion.div 
                                initial={{ scale: 0, opacity: 0 }}
                                animate={{ scale: 1, opacity: 1 }}
                                className={getIndicatorPositionClasses()}
                            >
                                <div className="flex flex-row items-center gap-2 bg-white/20 backdrop-blur-md p-1 pr-3 rounded-full border border-white/30 shadow-xl pointer-events-auto">
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
                                </div>
                            </motion.div>
                        )}
                        {status === 'incorrect' && (
                            <motion.div 
                                initial={{ scale: 0, opacity: 0 }}
                                animate={{ scale: 1, opacity: 1 }}
                                exit={{ scale: 0, opacity: 0 }}
                                className={getIndicatorPositionClasses()}
                            >
                                <div className="flex flex-row items-center gap-2 bg-white/20 backdrop-blur-md p-1 pr-3 rounded-full border border-white/30 shadow-xl pointer-events-auto">
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
                                </div>
                            </motion.div>
                        )}
                        {/* Manual Check Button - Visible when idle, with style variants */}
                        {status === 'idle' && (inputValue.trim().length > 0 || isAdmin || data.actionVisibleAlways !== false) && (
                            <motion.div 
                                initial={{ scale: 0, opacity: 0, y: 10 }}
                                animate={{ 
                                    scale: 1, 
                                    opacity: (inputValue.trim().length > 0 || isAdmin) ? 1 : 0.4, 
                                    y: 0 
                                }}
                                exit={{ scale: 0, opacity: 0 }}
                                className={getIndicatorPositionClasses()}
                            >
                                <div className="flex flex-col items-center gap-2 pointer-events-auto transition-transform active:scale-95">
                                    <button 
                                        onClick={(e) => {
                                            e.stopPropagation();
                                            if (!isAdmin && inputValue.trim().length > 0) checkAnswer();
                                        }}
                                        className={`
                                            group relative p-3 rounded-2xl transition-all duration-300
                                            ${data.actionStyle === 'glass' ? 'bg-white/10 backdrop-blur-md border border-white/20 shadow-xl' : ''}
                                            ${data.actionStyle === 'neon' ? 'bg-accent border-2 border-white/50 shadow-[0_0_20px_rgba(255,107,0,0.6)]' : ''}
                                            ${data.actionStyle === 'modern' ? 'bg-gradient-to-br from-accent to-orange-600 shadow-xl text-white' : ''}
                                            ${(!data.actionStyle || data.actionStyle === 'minimal') ? 'bg-accent text-white shadow-lg' : ''}
                                            ${isAdmin || inputValue.trim().length === 0 ? 'cursor-default' : 'hover:scale-110'}
                                        `}
                                        title={isAdmin ? "Preview" : "Check Answer"}
                                    >
                                        {data.actionStyle === 'neon' && (
                                            <div className="absolute inset-0 rounded-2xl bg-white animate-ping opacity-10 pointer-events-none" />
                                        )}
                                        <CheckCircle2 
                                            size={24} 
                                            className={`${data.actionStyle === 'glass' ? 'text-accent' : 'text-white'} transition-transform`} 
                                        />
                                    </button>
                                    <span className={`
                                        text-[9px] font-black uppercase tracking-tighter px-2 py-1 rounded-full shadow-sm
                                        ${data.actionStyle === 'glass' ? 'bg-white/20 text-white backdrop-blur-sm' : 'bg-white/90 text-accent'}
                                    `}>
                                        Check
                                    </span>
                                </div>
                            </motion.div>
                        )}
                    </AnimatePresence>
                </div>


            </motion.div>
        </div>
    );
};

export default CompletionBlock;
