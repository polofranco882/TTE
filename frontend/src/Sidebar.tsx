
import { motion, AnimatePresence } from 'framer-motion';
import { useState, useEffect } from 'react';
import {
    Book, LayoutDashboard, PieChart, Settings, LogOut,
    ChevronLeft, Menu, BookOpen
} from 'lucide-react';

interface SidebarProps {
    activeTab: string;
    setActiveTab: (tab: string) => void;
    isOpen: boolean;
    setIsOpen: (isOpen: boolean) => void;
    userRole: string | null;
    onLogout: () => void;
}

const Sidebar = ({ activeTab, setActiveTab, isOpen, setIsOpen, userRole, onLogout }: SidebarProps) => {
    const [isMobile, setIsMobile] = useState(window.innerWidth < 1024);
    const [isEditorActive, setIsEditorActive] = useState(document.body.classList.contains('editor-active'));

    // Hide sidebar when the Interactive Page Editor is open
    useEffect(() => {
        const observer = new MutationObserver(() => {
            setIsEditorActive(document.body.classList.contains('editor-active'));
        });
        observer.observe(document.body, { attributes: true, attributeFilter: ['class'] });
        return () => observer.disconnect();
    }, []);

    useEffect(() => {
        let prevIsMobile = window.innerWidth < 1024;
        const handleResize = () => {
            const currentIsMobile = window.innerWidth < 1024;
            setIsMobile(currentIsMobile);
            
            if (prevIsMobile && !currentIsMobile) {
                setIsOpen(true); // Always open when transitioning to desktop
            } else if (!prevIsMobile && currentIsMobile) {
                setIsOpen(false); // Closed when transitioning to mobile/tablet
            }
            prevIsMobile = currentIsMobile;
        };

        window.addEventListener('resize', handleResize);
        return () => window.removeEventListener('resize', handleResize);
    }, [setIsOpen]);

    // Completely hide sidebar when editor is active
    if (isEditorActive) return null;

    const menuItems = [
        { id: 'dashboard', label: 'Dashboard', icon: <LayoutDashboard size={20} />, roles: ['admin', 'manager'] },
        { id: 'books', label: 'Library', icon: <Book size={20} />, roles: ['user', 'admin', 'manager'] },
        { id: 'admin-books', label: 'Manage Books', icon: <BookOpen size={20} />, roles: ['admin', 'manager'] },
        { id: 'reports', label: 'Reports', icon: <PieChart size={20} />, roles: ['admin', 'manager'] },
        // { id: 'users', label: 'Users', icon: <Users size={20} />, roles: ['admin'] }, // Moved to Settings
        { id: 'settings', label: 'Settings', icon: <Settings size={20} />, roles: ['admin', 'manager', 'user'] },
    ];

    const filteredItems = menuItems.filter(item => !item.roles || item.roles.includes(userRole || ''));

    return (
        <>
            {/* Mobile Overlay */}
            <AnimatePresence>
                {isMobile && isOpen && (
                    <motion.div
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        exit={{ opacity: 0 }}
                        onClick={() => setIsOpen(false)}
                        className="fixed inset-0 bg-black/60 backdrop-blur-sm z-[140] lg:hidden"
                    />
                )}
            </AnimatePresence>

            {/* Sidebar toggle button (Mobile/Tablet Only) */}
            <div className="lg:hidden fixed top-4 left-4 z-[150]">
                <button
                    onClick={() => setIsOpen(!isOpen)}
                    className="p-2.5 bg-primary text-white rounded-xl shadow-xl border border-white/10"
                >
                    <Menu size={24} />
                </button>
            </div>

            <motion.div
                className={`fixed lg:static inset-y-0 left-0 h-screen bg-primary/95 backdrop-blur-xl text-white shadow-2xl z-[160] flex flex-col border-r border-white/10 font-sans overflow-hidden`}
                initial={false}
                animate={{
                    x: isMobile ? (isOpen ? 0 : -300) : 0,
                    width: isOpen && !isMobile ? 288 : (isMobile ? 288 : 96)
                }}
                transition={{ duration: 0.3, ease: 'easeInOut' }}
            >
                {/* Header */}
                <div className={`h-24 flex items-center ${isOpen ? 'justify-between px-6' : 'justify-center'} border-b border-white/10`}>
                    <AnimatePresence>
                        {isOpen && (
                            <motion.div
                                initial={{ opacity: 0, width: 0 }}
                                animate={{ opacity: 1, width: 'auto' }}
                                exit={{ opacity: 0, width: 0 }}
                                className="flex items-center gap-3 font-bold text-2xl tracking-tight whitespace-nowrap overflow-hidden"
                            >
                                <div className="bg-accent p-2 rounded-xl shadow-lg shadow-accent/20 flex-shrink-0">
                                    <Book size={24} className="text-white" />
                                </div>
                                <span className="bg-clip-text text-transparent bg-gradient-to-r from-white to-gray-400">TTE Portal</span>
                            </motion.div>
                        )}
                    </AnimatePresence>

                    {!isMobile && (
                        <button
                            onClick={() => setIsOpen(!isOpen)}
                            className="p-2 rounded-xl hover:bg-white/10 transition-colors text-gray-400 hover:text-white border border-transparent hover:border-white/10 flex-shrink-0"
                            title={isOpen ? "Collapse Sidebar" : "Expand Sidebar"}
                        >
                            {isOpen ? <ChevronLeft size={20} /> : <Menu size={20} />}
                        </button>
                    )}
                </div>

                {/* Menu Items */}
                <div className="flex-1 py-8 space-y-2 overflow-y-auto overflow-x-hidden custom-scrollbar px-4">
                    {filteredItems.map((item) => {
                        const isActive = activeTab === item.id;

                        return (
                            <button
                                key={item.id}
                                onClick={() => {
                                    setActiveTab(item.id);
                                    if (isMobile) setIsOpen(false);
                                }}
                                className={`w-full relative flex items-center h-14 px-4 rounded-xl transition-all duration-300 group ${isActive
                                    ? 'bg-accent text-white shadow-lg shadow-accent/25'
                                    : 'text-gray-400 hover:text-white hover:bg-white/5'
                                    }`}
                            >
                                <div className={`relative z-10 flex items-center gap-4 ${!isOpen && 'justify-center w-full'}`}>
                                    <div className={`${isActive ? 'text-white' : 'text-gray-400 group-hover:text-white'} transition-colors duration-200`}>
                                        {item.icon}
                                    </div>

                                    <AnimatePresence>
                                        {isOpen && (
                                            <motion.span
                                                initial={{ opacity: 0, width: 0, x: -10 }}
                                                animate={{ opacity: 1, width: 'auto', x: 0 }}
                                                exit={{ opacity: 0, width: 0, x: -10 }}
                                                className="whitespace-nowrap font-medium text-base overflow-hidden"
                                            >
                                                {item.label}
                                            </motion.span>
                                        )}
                                    </AnimatePresence>
                                </div>

                                {/* Tooltip for collapsed state */}
                                {!isOpen && !isMobile && (
                                    <div className="absolute left-full ml-4 px-3 py-1.5 bg-gray-900 text-white text-xs rounded-md opacity-0 group-hover:opacity-100 transition-opacity whitespace-nowrap z-[200] pointer-events-none shadow-xl border border-white/10">
                                        {item.label}
                                    </div>
                                )}
                            </button>
                        );
                    })}
                </div>

                {/* User Profile / Logout */}
                <div className="p-4 border-t border-white/10 bg-black/20">
                    <button
                        onClick={onLogout}
                        className={`w-full flex items-center ${isOpen ? 'justify-start px-4' : 'justify-center'} gap-3 p-3 rounded-xl hover:bg-red-500/10 hover:text-red-400 text-gray-400 transition-all group`}
                    >
                        <LogOut size={20} className="group-hover:rotate-12 transition-transform" />

                        <AnimatePresence>
                            {isOpen && (
                                <motion.span
                                    initial={{ opacity: 0, width: 0 }}
                                    animate={{ opacity: 1, width: 'auto' }}
                                    exit={{ opacity: 0, width: 0 }}
                                    className="font-medium whitespace-nowrap overflow-hidden"
                                >
                                    Log Out
                                </motion.span>
                            )}
                        </AnimatePresence>
                    </button>
                </div>
            </motion.div>
        </>
    );
};

export default Sidebar;
