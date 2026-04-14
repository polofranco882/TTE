
import { User, Shield, Info, BookOpen, Sparkles } from 'lucide-react';
import AdminUsers from './AdminUsers';
import AdminBooks from './AdminBooks';
import AIConfigPanel from './components/AIConfigPanel';
import MyProfile from './components/MyProfile';
import { type NotificationType } from './components/Notification';

interface SettingsProps {
    token: string;
    userRole: string | null;
    onNotify: (msg: string, type: NotificationType) => void;
    onUnauthorized: () => void;
    activeSection: 'profile' | 'users' | 'books' | 'ai' | 'about';
}

const Settings = ({ token, userRole, onNotify, onUnauthorized, activeSection }: SettingsProps) => {
    return (
        <div className="bg-white rounded-2xl shadow-sm border border-gray-100 min-h-[calc(100vh-100px)] flex flex-col overflow-hidden">
            {/* Content Area */}
            <div className="flex-1 p-6 md:p-8 overflow-y-auto">
                {activeSection === 'profile' && (
                    <MyProfile 
                        token={token} 
                        onNotify={onNotify} 
                        onUnauthorized={onUnauthorized} 
                    />
                )}

                {activeSection === 'users' && (userRole === 'admin' || userRole === 'manager') && (
                    <div className="h-full">
                        <div className="mb-6">
                            <h3 className="text-2xl font-bold text-gray-800 mb-1">User Management</h3>
                            <p className="text-gray-500">Control user access and book assignments.</p>
                        </div>
                        <AdminUsers token={token} onNotify={onNotify} onUnauthorized={onUnauthorized} />
                    </div>
                )}

                {activeSection === 'books' && (userRole === 'admin' || userRole === 'manager') && (
                    <div className="h-full flex flex-col">
                        <div className="mb-6">
                            <h3 className="text-2xl font-bold text-gray-800 mb-1">Book Catalog</h3>
                            <p className="text-gray-500">Manage system titles, covers, and descriptions.</p>
                        </div>
                        <AdminBooks token={token} onNotify={onNotify} onUnauthorized={onUnauthorized} />
                    </div>
                )}

                {activeSection === 'ai' && userRole === 'admin' && (
                    <div className="h-full flex flex-col">
                        <div className="mb-6">
                            <h3 className="text-2xl font-bold text-gray-800 mb-1">AI Configuration</h3>
                            <p className="text-gray-500">Configure AI provider, API keys, and generation policies.</p>
                        </div>
                        <AIConfigPanel token={token} onNotify={onNotify} onUnauthorized={onUnauthorized} />
                    </div>
                )}

                {activeSection === 'about' && (
                    <div className="max-w-2xl text-center py-20">
                         <div className="flex justify-center mb-6">
                             <div className="p-6 bg-slate-50 rounded-full">
                                <Info size={48} className="text-slate-300" />
                             </div>
                         </div>
                         <h3 className="text-2xl font-bold text-gray-800 mb-2">TTESOL Scholarly Portal</h3>
                         <p className="text-gray-500">Version 1.0.0 (Production Build)</p>
                         <p className="mt-8 text-sm text-gray-400">© 2026 TTESOL. All rights reserved.</p>
                    </div>
                )}
            </div>
        </div>
    );
};

export default Settings;
