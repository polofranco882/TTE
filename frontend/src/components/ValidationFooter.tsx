import React from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Check, X } from 'lucide-react';

export type ValidationState = 'idle' | 'correct' | 'incorrect';

interface ValidationFooterProps {
    status: ValidationState;
    message?: string;
    onContinue: () => void;
    onCheck?: () => void;
    isCheckDisabled?: boolean; // When waiting for user input
}

const ValidationFooter: React.FC<ValidationFooterProps> = ({ status, message, onContinue, onCheck, isCheckDisabled }) => {

    // Play sounds when status changes
    React.useEffect(() => {
        if (status === 'correct') {
            const audio = new Audio('/sounds/correct.mp3');
            audio.play().catch(() => { }); // Ignore error if file absent
        } else if (status === 'incorrect') {
            const audio = new Audio('/sounds/incorrect.mp3');
            audio.play().catch(() => { });
        }
    }, [status]);

    return (
        <AnimatePresence>
            {status !== 'idle' ? (
                <motion.div
                    initial={{ y: '100%' }}
                    animate={{ y: 0 }}
                    exit={{ y: '100%' }}
                    transition={{ type: 'spring', stiffness: 300, damping: 30 }}
                    className={`fixed bottom-0 left-0 right-0 z-[200] border-t-2 shadow-[0_-10px_40px_rgba(0,0,0,0.2)] ${status === 'correct' ? 'bg-[#d7ffb8] border-[#b8f28b]' : 'bg-[#ffdfe0] border-[#ffc1c1]'
                        }`}
                >
                    <div className="max-w-7xl mx-auto px-6 py-6 md:py-8 flex flex-col md:flex-row items-center justify-between gap-6">
                        {/* Message Icon & Text */}
                        <div className="flex items-center gap-5">
                            <div className={`w-16 h-16 rounded-full flex items-center justify-center shrink-0 shadow-lg ${status === 'correct' ? 'bg-[#58cc02] text-white' : 'bg-[#ff4b4b] text-white'
                                }`}>
                                {status === 'correct' ? <Check size={36} strokeWidth={4} /> : <X size={36} strokeWidth={4} />}
                            </div>
                            <div>
                                <h3 className={`text-2xl font-black mb-1 ${status === 'correct' ? 'text-[#58cc02]' : 'text-[#ff4b4b]'
                                    }`}>
                                    {status === 'correct' ? '¡Excelente!' : 'Solución correcta:'}
                                </h3>
                                {message && (
                                    <p className={`text-lg font-bold ${status === 'correct' ? 'text-[#46a302]' : 'text-[#ea2b2b]'
                                        }`}>
                                        {message}
                                    </p>
                                )}
                            </div>
                        </div>

                        {/* Continue Button */}
                        <button
                            onClick={onContinue}
                            className={`w-full md:w-auto px-10 py-4 rounded-xl font-black text-xl text-white shadow-[0_4px_0_0_rgba(0,0,0,0.2)] hover:shadow-none hover:translate-y-1 transition-all flex items-center justify-center gap-3 ${status === 'correct' ? 'bg-[#58cc02] hover:bg-[#46a302]' : 'bg-[#ff4b4b] hover:bg-[#ea2b2b]'
                                }`}
                        >
                            CONTINUAR
                        </button>
                    </div>
                </motion.div>
            ) : (
                /* Default Idle Footer for checking answers, if needed. Usually hidden until an answer is clicked */
                onCheck && (
                    <motion.div
                        initial={{ y: '100%' }}
                        animate={{ y: 0 }}
                        className="fixed bottom-0 left-0 right-0 z-[200] bg-white/5 backdrop-blur-md border-t border-white/10"
                    >
                        <div className="max-w-7xl mx-auto px-6 py-4 flex justify-end">
                            <button
                                onClick={onCheck}
                                disabled={isCheckDisabled}
                                className={`px-10 py-4 rounded-xl font-black text-xl text-white shadow-[0_4px_0_0_rgba(0,0,0,0.2)] transition-all flex items-center justify-center gap-3 ${isCheckDisabled ? 'bg-gray-600 opacity-50 cursor-not-allowed text-gray-400' : 'bg-accent hover:bg-orange-500 hover:shadow-none hover:translate-y-1'
                                    }`}
                            >
                                COMPROBAR
                            </button>
                        </div>
                    </motion.div>
                )
            )}
        </AnimatePresence>
    );
};

export default ValidationFooter;
