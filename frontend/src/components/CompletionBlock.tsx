import React, { useState } from 'react';
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
        placeholder?: string;
        inputWidth?: number | string;
        align?: 'left' | 'center' | 'right';
        bold?: boolean;
        italic?: boolean;
        underline?: boolean;
    };
    isAdmin?: boolean;
    onComplete?: (isCorrect: boolean) => void;
}

const CompletionBlock: React.FC<CompletionBlockProps> = ({ data, isAdmin, onComplete }) => {
    const [inputValue, setInputValue] = useState('');
    const [status, setStatus] = useState<'idle' | 'correct' | 'incorrect'>('idle');
    const [shake, setShake] = useState(false);

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
        underline = false
    } = data;

    const checkAnswer = () => {
        if (isAdmin || status !== 'idle') return;

        const val = inputValue.trim();
        if (!val) return;

        const isCorrect = correctAnswers.some(ans => {
            if (caseSensitive) {
                return ans.trim() === val;
            }
            return ans.trim().toLowerCase() === val.toLowerCase();
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

    return (
        <div 
            className={`w-full h-full flex items-center overflow-hidden transition-all duration-500 ${styles.container}`}
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
                    {/* Hidden span to measure text width and force container size */}
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
                        type="text"
                        value={inputValue}
                        onChange={(e) => setInputValue(e.target.value)}
                        onKeyDown={(e) => e.key === 'Enter' && checkAnswer()}
                        disabled={status === 'correct'}
                        placeholder={placeholder}
                        className={`text-center transition-all col-start-1 row-start-1 w-full bg-transparent outline-none ${styles.input}`}
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
                                className="absolute -top-12 left-1/2 -translate-x-1/2 flex flex-col items-center gap-1"
                            >
                                <div className="bg-green-500 text-white p-2 rounded-full shadow-lg">
                                    <CheckCircle2 size={24} />
                                </div>
                                <span className="text-[10px] font-black uppercase text-green-500 bg-white/90 px-2 py-0.5 rounded-full shadow-sm">Correct!</span>
                            </motion.div>
                        )}
                        {status === 'incorrect' && (
                            <motion.div 
                                initial={{ scale: 0, opacity: 0 }}
                                animate={{ scale: 1, opacity: 1 }}
                                exit={{ scale: 0, opacity: 0 }}
                                className="absolute -top-12 left-1/2 -translate-x-1/2 flex flex-col items-center gap-1"
                            >
                                <div className="bg-red-500 text-white p-2 rounded-full shadow-lg">
                                    <XCircle size={24} />
                                </div>
                                <span className="text-[10px] font-black uppercase text-red-500 bg-white/90 px-2 py-0.5 rounded-full shadow-sm">Incorrect!</span>
                            </motion.div>
                        )}
                    </AnimatePresence>
                </div>

                {!isAdmin && status !== 'idle' && (
                    <button 
                        onClick={reset}
                        className="ml-4 p-2 bg-white/20 hover:bg-white/30 rounded-full transition-colors text-gray-400 hover:text-white"
                    >
                        <RefreshCw size={16} />
                    </button>
                )}
            </motion.div>
        </div>
    );
};

export default CompletionBlock;
