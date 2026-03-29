import React from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Check, X, ArrowRight } from 'lucide-react';

export type ValidationState = 'idle' | 'correct' | 'incorrect';

interface ValidationFooterProps {
    status: ValidationState;
    message?: string;
    onContinue: () => void;
    onCheck?: () => void;
    isCheckDisabled?: boolean;
}

const ValidationFooter: React.FC<ValidationFooterProps> = ({ status, message, onContinue, onCheck, isCheckDisabled }) => {

    // Play sounds when status changes
    React.useEffect(() => {
        if (status === 'correct') {
            const audio = new Audio('/sounds/correct.mp3');
            audio.play().catch(() => { }); 
        } else if (status === 'incorrect') {
            const audio = new Audio('/sounds/incorrect.mp3');
            audio.play().catch(() => { });
        }
    }, [status]);

    return (
        <AnimatePresence>
            {status !== 'idle' ? (
                <div className="fixed inset-x-0 bottom-6 md:bottom-10 z-[500] pointer-events-none flex justify-center px-4">
                    <motion.div
                        initial={{ y: 50, opacity: 0, scale: 0.9 }}
                        animate={{ y: 0, opacity: 1, scale: 1 }}
                        exit={{ y: 20, opacity: 0, scale: 0.95 }}
                        transition={{ 
                            type: 'spring', 
                            stiffness: 400, 
                            damping: 25,
                            mass: 0.8
                        }}
                        className={`pointer-events-auto relative w-full max-w-lg aspect-auto md:aspect-video md:max-h-[140px] overflow-hidden rounded-[2rem] border shadow-[0_20px_50px_rgba(0,0,0,0.3)] backdrop-blur-2xl ${
                            status === 'correct' 
                            ? 'bg-[#d7ffb8]/90 border-[#b8f28b]/50 shadow-green-500/10' 
                            : 'bg-[#ffdfe0]/90 border-[#ffc1c1]/50 shadow-red-500/10'
                        }`}
                    >
                        {/* Decorative Background Glows */}
                        <div className={`absolute -top-10 -left-10 w-32 h-32 blur-3xl opacity-20 rounded-full ${status === 'correct' ? 'bg-green-400' : 'bg-red-400'}`} />
                        <div className={`absolute -bottom-10 -right-10 w-32 h-32 blur-3xl opacity-20 rounded-full ${status === 'correct' ? 'bg-green-400' : 'bg-red-400'}`} />

                        <div className="h-full px-6 py-5 flex items-center justify-between gap-4 relative z-10">
                            {/* Message Icon & Text */}
                            <div className="flex items-center gap-4 min-w-0">
                                <motion.div 
                                    initial={{ scale: 0.5 }}
                                    animate={{ scale: 1 }}
                                    transition={{ delay: 0.1, type: 'spring' }}
                                    className={`w-12 h-12 md:w-14 md:h-14 rounded-2xl flex items-center justify-center shrink-0 shadow-lg ${
                                        status === 'correct' ? 'bg-[#58cc02] text-white' : 'bg-[#ff4b4b] text-white'
                                    }`}
                                >
                                    {status === 'correct' ? <Check size={28} strokeWidth={4} /> : <X size={28} strokeWidth={4} />}
                                </motion.div>
                                <div className="min-w-0">
                                    <h3 className={`text-xl md:text-2xl font-black truncate ${status === 'correct' ? 'text-green-700' : 'text-red-700'}`}>
                                        {status === 'correct' ? 'Excellent!' : 'Try again!'}
                                    </h3>
                                    {message && (
                                        <p className={`text-sm md:text-base font-bold truncate opacity-80 ${status === 'correct' ? 'text-green-800' : 'text-red-800'}`}>
                                            {message}
                                        </p>
                                    )}
                                </div>
                            </div>

                            {/* Continue Button - Premium Rounded Pill */}
                            <motion.button
                                whileHover={{ scale: 1.05 }}
                                whileTap={{ scale: 0.95 }}
                                onClick={onContinue}
                                className={`shrink-0 h-12 md:h-14 px-6 md:px-8 rounded-2xl font-black text-sm md:text-base text-white shadow-lg transition-all flex items-center justify-center gap-2 ${
                                    status === 'correct' 
                                    ? 'bg-[#58cc02] hover:bg-[#46a302] shadow-green-600/20' 
                                    : 'bg-[#ff4b4b] hover:bg-[#ea2b2b] shadow-red-600/20'
                                }`}
                            >
                                CONTINUE
                                <ArrowRight size={18} strokeWidth={3} />
                            </motion.button>
                        </div>
                    </motion.div>
                </div>
            ) : (
                onCheck && (
                    <div className="fixed inset-x-0 bottom-6 z-[400] pointer-events-none flex justify-center px-4">
                        <motion.div
                            initial={{ y: 20, opacity: 0 }}
                            animate={{ y: 0, opacity: 1 }}
                            className="pointer-events-auto bg-[#161930]/40 backdrop-blur-md border border-white/10 p-2 rounded-2xl shadow-2xl flex gap-2"
                        >
                            <button
                                onClick={onCheck}
                                disabled={isCheckDisabled}
                                className={`px-8 py-3 rounded-xl font-black text-base text-white transition-all flex items-center justify-center gap-2 group ${
                                    isCheckDisabled 
                                    ? 'bg-gray-600/40 opacity-50 cursor-not-allowed text-gray-400' 
                                    : 'bg-accent hover:bg-orange-500 shadow-lg shadow-accent/20 active:scale-95'
                                }`}
                            >
                                CHECK ANSWER
                                <div className={`w-5 h-5 rounded-full border-2 border-current border-t-transparent animate-spin ${isCheckDisabled ? 'block' : 'hidden'}`} />
                            </button>
                        </motion.div>
                    </div>
                )
            )}
        </AnimatePresence>
    );
};

export default ValidationFooter;
