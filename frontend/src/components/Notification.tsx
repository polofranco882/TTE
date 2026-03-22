
import { motion, AnimatePresence } from 'framer-motion';
import { CheckCircle, XCircle, AlertCircle, X } from 'lucide-react';
import { useEffect } from 'react';

export type NotificationType = 'success' | 'error' | 'info';

interface NotificationProps {
    message: string;
    type: NotificationType;
    isVisible: boolean;
    onClose: () => void;
}

export default function Notification({ message, type, isVisible, onClose }: NotificationProps) {
    useEffect(() => {
        if (isVisible) {
            const timer = setTimeout(() => {
                onClose();
            }, 4000);
            return () => clearTimeout(timer);
        }
    }, [isVisible, onClose]);

    const variants = {
        initial: { opacity: 0, y: -50, scale: 0.8 },
        animate: {
            opacity: 1,
            y: 0,
            scale: 1,
            transition: { type: "spring" as const, stiffness: 300, damping: 20 }
        },
        exit: { opacity: 0, y: -50, scale: 0.8, transition: { duration: 0.2 } }
    };

    const getIcon = () => {
        switch (type) {
            case 'success': return <CheckCircle className="w-6 h-6 text-emerald-400" />;
            case 'error': return <XCircle className="w-6 h-6 text-rose-500" />;
            case 'info': return <AlertCircle className="w-6 h-6 text-sky-400" />;
        }
    };

    const mainStyles = "fixed top-8 left-0 right-0 mx-auto z-[99999] flex items-center gap-4 px-6 py-4 rounded-2xl shadow-2xl backdrop-blur-xl border w-[90%] max-w-[400px]";

    const getThemeStyles = () => {
        switch (type) {
            case 'success': return 'bg-[#0f172a]/90 border-emerald-500/30 shadow-emerald-500/20';
            case 'error': return 'bg-[#1a1010]/95 border-rose-500/40 shadow-rose-500/30';
            case 'info': return 'bg-[#0f172a]/90 border-sky-500/30 shadow-sky-500/20';
        }
    };

    return (
        <AnimatePresence>
            {isVisible && (
                <motion.div
                    layout
                    variants={variants}
                    initial="initial"
                    animate="animate"
                    exit="exit"
                    className={`${mainStyles} ${getThemeStyles()}`}
                    role="alert"
                    data-testid="notification"
                >
                    <div className="flex-shrink-0 p-1 rounded-full bg-white/5">
                        {getIcon()}
                    </div>
                    <div className="flex-1">
                        <p className="text-white font-semibold text-base leading-tight tracking-wide">{message}</p>
                    </div>
                    <button
                        onClick={onClose}
                        className="flex-shrink-0 text-white/40 hover:text-white/80 transition-colors p-1"
                    >
                        <X className="w-5 h-5" />
                    </button>

                    {/* Premium Glow Effect */}
                    <div className={`absolute inset-0 rounded-2xl opacity-20 ${type === 'success' ? 'bg-gradient-to-r from-emerald-500/0 via-emerald-500/50 to-emerald-500/0' :
                        type === 'error' ? 'bg-gradient-to-r from-rose-500/0 via-rose-500/50 to-rose-500/0' :
                            'bg-gradient-to-r from-sky-500/0 via-sky-500/50 to-sky-500/0'
                        } blur-xl -z-10`} />

                    {/* Progress bar effect */}
                    <motion.div
                        initial={{ width: "100%" }}
                        animate={{ width: "0%" }}
                        transition={{ duration: 4, ease: "linear" }}
                        className={`absolute bottom-0 left-4 right-4 h-0.5 rounded-full ${type === 'success' ? 'bg-emerald-500' :
                            type === 'error' ? 'bg-rose-500' : 'bg-sky-500'
                            } opacity-50`}
                    />
                </motion.div>
            )}
        </AnimatePresence>
    );
}
