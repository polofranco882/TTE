import React from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { AlertTriangle, Trash2, X } from 'lucide-react';

interface PremiumConfirmModalProps {
    isOpen: boolean;
    onClose: () => void;
    onConfirm: () => void;
    title: string;
    description: string;
    confirmText?: string;
    cancelText?: string;
    isDanger?: boolean;
}

const PremiumConfirmModal: React.FC<PremiumConfirmModalProps> = ({
    isOpen,
    onClose,
    onConfirm,
    title,
    description,
    confirmText = 'Confirm',
    cancelText = 'Cancel',
    isDanger = false
}) => {
    if (!isOpen) return null;

    return (
        <AnimatePresence>
            {isOpen && (
                <div className="fixed inset-0 z-[100000] flex items-center justify-center p-4">
                    <motion.div
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        exit={{ opacity: 0 }}
                        onClick={onClose}
                        className="absolute inset-0 bg-black/80 backdrop-blur-md"
                    />

                    <motion.div
                        initial={{ scale: 0.9, opacity: 0, y: 20 }}
                        animate={{ scale: 1, opacity: 1, y: 0 }}
                        exit={{ scale: 0.9, opacity: 0, y: 20 }}
                        className="relative w-full max-w-sm bg-[#161930]/95 backdrop-blur-xl border border-white/10 rounded-3xl shadow-[0_0_60px_-15px_rgba(0,0,0,0.5)] p-6 flex flex-col items-center text-center overflow-hidden"
                    >
                        {/* Background subtle glow based on danger level */}
                        <div className={`absolute top-0 left-0 right-0 h-32 opacity-20 blur-3xl pointer-events-none ${isDanger ? 'bg-red-500' : 'bg-accent'}`} />

                        <button
                            onClick={onClose}
                            className="absolute right-4 top-4 p-2 rounded-xl hover:bg-white/10 text-gray-400 hover:text-white transition-all z-10"
                        >
                            <X size={18} />
                        </button>

                        <div className={`w-16 h-16 rounded-full flex items-center justify-center mb-6 relative z-10 ${isDanger ? 'bg-red-500/20 text-red-500' : 'bg-accent/20 text-accent'}`}>
                            {isDanger ? <Trash2 size={32} /> : <AlertTriangle size={32} />}
                        </div>

                        <h3 className="text-xl font-black text-white mb-2 tracking-tight z-10">{title}</h3>
                        <p className="text-sm text-gray-400 mb-8 z-10 leading-relaxed">
                            {description}
                        </p>

                        <div className="w-full flex gap-3 z-10">
                            <button
                                onClick={onClose}
                                className="flex-1 py-3 px-4 rounded-xl border border-white/10 font-bold text-sm tracking-wide text-gray-300 hover:bg-white/5 hover:text-white transition-all"
                            >
                                {cancelText}
                            </button>
                            <button
                                onClick={() => {
                                    onConfirm();
                                    onClose();
                                }}
                                className={`flex-1 py-3 px-4 rounded-xl font-bold text-sm tracking-wide text-white shadow-lg transition-transform active:scale-95 ${isDanger ? 'bg-red-500 hover:bg-red-600 shadow-red-500/20' : 'bg-accent hover:bg-orange-500 shadow-accent/20'}`}
                            >
                                {confirmText}
                            </button>
                        </div>
                    </motion.div>
                </div>
            )}
        </AnimatePresence>
    );
};

export default PremiumConfirmModal;
