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
        actionLayout?: 'pill' | 'stack';
        actionSolid?: boolean;
        actionVisibleAlways?: boolean;
        actionOpacity?: number;
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
        actionStyle = 'minimal',
        actionLayout = 'pill',
        actionSolid = false,
        actionVisibleAlways = true,
        actionOpacity = 100,
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
                        {actionVisibleAlways !== false && status === 'idle' && (
                            <motion.div 
                                initial={{ opacity: 0, x: 10 }}
                                animate={{ opacity: inputValue ? (actionOpacity / 100) : (actionOpacity / 250), x: 0 }}
                                className={getIndicatorPositionClasses()}
                                style={{ opacity: actionOpacity / 100 }}
                            >
                                <button 
                                    onClick={checkAnswer}
                                    className={`flex items-center gap-2 pointer-events-auto transition-all transform hover:scale-105 active:scale-95 ${
                                        actionLayout === 'stack' ? 'flex-col gap-1' : 'flex-row gap-2'
                                    } ${
                                        actionStyle === 'glass' && !actionSolid ? 'bg-black/40 backdrop-blur-xl border border-white/30 p-1.5 rounded-3xl shadow-[0_8px_32px_rgba(0,0,0,0.3),0_0_1px_rgba(255,255,255,0.4)]' :
                                        actionStyle === 'neon' ? 'bg-blue-500/20 border border-blue-500/50 p-1.5 rounded-3xl shadow-[0_0_15px_rgba(59,130,246,0.5)]' :
                                        actionStyle === 'modern' ? 'bg-black text-white p-1.5 rounded-3xl shadow-lg' :
                                        'bg-accent text-white p-1.5 rounded-3xl shadow-lg'
                                    } ${
                                        actionLayout === 'pill' ? 'pr-4' : 'pt-2 px-2 pb-1.5'
                                    } ${actionSolid ? 'bg-accent/100 border-accent/20' : ''}`}
                                >
                                    <div className={`p-1.5 rounded-2xl shadow-sm shrink-0 ${
                                        actionLayout === 'stack' ? 'w-10 h-10 flex items-center justify-center' : ''
                                    } ${
                                        actionStyle === 'glass' && !actionSolid ? 'bg-white/10 text-white' :
                                        actionStyle === 'neon' ? 'bg-blue-500 text-white shadow-[0_0_10px_rgba(59,130,246,0.5)]' :
                                        actionStyle === 'modern' ? 'bg-white text-black' :
                                        'bg-white text-accent'
                                    }`}>
                                        <CheckCircle2 size={actionLayout === 'stack' ? 20 : 16} />
                                    </div>
                                    <span className={`text-[9px] font-black uppercase tracking-widest ${
                                        actionLayout === 'stack' ? 'bg-white/10 px-2 py-0.5 rounded-md' : ''
                                    } ${
                                        (actionStyle === 'glass' || actionStyle === 'modern' || actionStyle === 'neon') ? 'text-white' : 'text-white'
                                    }`}>Check</span>
                                </button>
                            </motion.div>
                        )}
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
                    </AnimatePresence>
                </div>


            </motion.div>
        </div>
    );
};

export default CompletionBlock;
