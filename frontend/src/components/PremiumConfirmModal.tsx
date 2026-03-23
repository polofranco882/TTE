
import { motion, AnimatePresence } from 'framer-motion';
import { AlertTriangle, X } from 'lucide-react';

interface PremiumConfirmModalProps {
    isOpen: boolean;
    title: string;
    message: string;
    confirmLabel?: string;
    cancelLabel?: string;
    onConfirm: () => void;
    onCancel: () => void;
    variant?: 'danger' | 'info';
}

export default function PremiumConfirmModal({
    isOpen,
    title,
    message,
    confirmLabel = 'Confirm',
    cancelLabel = 'Cancel',
    onConfirm,
    onCancel,
    variant = 'info'
}: PremiumConfirmModalProps) {
    return (
        <AnimatePresence>
            {isOpen && (
                <div className="fixed inset-0 z-[10000] flex items-center justify-center p-4">
                    {/* Backdrop */}
                    <motion.div
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        exit={{ opacity: 0 }}
                        onClick={onCancel}
                        className="absolute inset-0 bg-primary/40 backdrop-blur-sm"
                    />

                    {/* Modal Content */}
                    <motion.div
                        initial={{ opacity: 0, scale: 0.9, y: 20 }}
                        animate={{ opacity: 1, scale: 1, y: 0 }}
                        exit={{ opacity: 0, scale: 0.9, y: 20 }}
                        className="relative w-full max-w-md bg-surface border border-black/10 rounded-3xl shadow-premium overflow-hidden z-10"
                    >
                        {/* Header Decoration */}
                        <div className={`h-2 w-full ${variant === 'danger' ? 'bg-red-500' : 'bg-accent'}`} />
                        
                        <div className="p-8">
                            <div className="flex items-start gap-4 mb-6">
                                <div className={`p-3 rounded-2xl ${variant === 'danger' ? 'bg-red-50 text-red-500' : 'bg-accent/10 text-accent'}`}>
                                    <AlertTriangle className="w-6 h-6" />
                                </div>
                                <div className="flex-1">
                                    <h3 className="text-2xl font-serif font-bold text-primary tracking-tight">
                                        {title}
                                    </h3>
                                    <p className="text-gray-500 mt-2 leading-relaxed">
                                        {message}
                                    </p>
                                </div>
                                <button 
                                    onClick={onCancel}
                                    className="p-2 text-gray-400 hover:text-primary transition-colors hover:bg-gray-50 rounded-lg"
                                >
                                    <X className="w-5 h-5" />
                                </button>
                            </div>

                            <div className="flex gap-3 mt-8">
                                <button
                                    onClick={onCancel}
                                    className="flex-1 px-6 py-3.5 rounded-2xl border border-gray-200 text-gray-500 font-bold text-sm uppercase tracking-widest hover:bg-gray-50 transition-all"
                                >
                                    {cancelLabel}
                                </button>
                                <button
                                    onClick={() => {
                                        onConfirm();
                                        onCancel();
                                    }}
                                    className={`flex-1 px-6 py-3.5 rounded-2xl text-white font-bold text-sm uppercase tracking-widest shadow-lg transition-all transform hover:scale-[1.02] active:scale-[0.98] ${
                                        variant === 'danger' 
                                            ? 'bg-red-500 hover:bg-red-600 shadow-red-500/20' 
                                            : 'bg-accent hover:bg-accent-dark shadow-accent/20'
                                    }`}
                                >
                                    {confirmLabel}
                                </button>
                            </div>
                        </div>

                        {/* Background subtle glow */}
                        <div className={`absolute -bottom-20 -right-20 w-40 h-40 rounded-full blur-[80px] opacity-10 ${variant === 'danger' ? 'bg-red-500' : 'bg-accent'}`} />
                    </motion.div>
                </div>
            )}
        </AnimatePresence>
    );
}
