
import { useState } from 'react';
import { User, Shield, Info, BookOpen, Sparkles } from 'lucide-react';
import AdminUsers from './AdminUsers';
import AdminBooks from './AdminBooks';
import AIConfigPanel from './components/AIConfigPanel';
import { type NotificationType } from './components/Notification';

interface SettingsProps {
    token: string;
    userRole: string | null;
    onNotify: (msg: string, type: NotificationType) => void;
    onUnauthorized: () => void;
}

const Settings = ({ token, userRole, onNotify, onUnauthorized }: SettingsProps) => {
    const [activeSection, setActiveSection] = useState<'profile' | 'users' | 'books' | 'ai'>(
        userRole === 'admin' ? 'users' : 'profile'
    );

    return (
        <div className="bg-white rounded-2xl shadow-sm border border-gray-100 min-h-[calc(100vh-100px)] flex flex-col md:flex-row overflow-hidden">
            {/* Settings Sidebar */}
            <div className="w-full md:w-64 bg-gray-50/50 border-r border-gray-100 p-4">
                <h2 className="text-xl font-bold text-gray-800 mb-6 px-2">Settings</h2>

                <div className="space-y-1">
                    <button
                        onClick={() => setActiveSection('profile')}
                        className={`w-full flex items-center gap-3 px-4 py-3 rounded-xl transition-colors ${activeSection === 'profile'
                            ? 'bg-white shadow-sm border border-gray-100 text-accent font-medium'
                            : 'text-gray-600 hover:bg-gray-100 hover:text-gray-900'
                            }`}
                    >
                        <User size={18} />
                        Profile
                    </button>

                    {userRole === 'admin' && (
                        <>
                            <button
                                onClick={() => setActiveSection('users')}
                                className={`w-full flex items-center gap-3 px-4 py-3 rounded-xl transition-colors ${activeSection === 'users'
                                    ? 'bg-white shadow-sm border border-gray-100 text-accent font-medium'
                                    : 'text-gray-600 hover:bg-gray-100 hover:text-gray-900'
                                    }`}
                            >
                                <Shield size={18} />
                                User Management
                            </button>
                            <button
                                onClick={() => setActiveSection('books')}
                                className={`w-full flex items-center gap-3 px-4 py-3 rounded-xl transition-colors ${activeSection === 'books'
                                    ? 'bg-white shadow-sm border border-gray-100 text-accent font-medium'
                                    : 'text-gray-600 hover:bg-gray-100 hover:text-gray-900'
                                    }`}
                            >
                                <BookOpen size={18} />
                                Book Management
                            </button>
                            <button
                                onClick={() => setActiveSection('ai')}
                                className={`w-full flex items-center gap-3 px-4 py-3 rounded-xl transition-colors ${activeSection === 'ai'
                                    ? 'bg-white shadow-sm border border-gray-100 text-accent font-medium'
                                    : 'text-gray-600 hover:bg-gray-100 hover:text-gray-900'
                                    }`}
                            >
                                <Sparkles size={18} />
                                AI Configuration
                            </button>
                        </>
                    )}

                    <button
                        disabled
                        className="w-full flex items-center gap-3 px-4 py-3 rounded-xl text-gray-400 cursor-not-allowed hover:bg-transparent"
                    >
                        <Info size={18} />
                        About (v1.0.0)
                    </button>
                </div>
            </div>

            {/* Content Area */}
            <div className="flex-1 p-6 overflow-y-auto">
                {activeSection === 'profile' && (
                    <div className="max-w-2xl">
                        <h3 className="text-2xl font-bold text-gray-800 mb-1">My Profile</h3>
                        <p className="text-gray-500 mb-8">Manage your account settings and preferences.</p>

                        <div className="bg-blue-50 border border-blue-100 rounded-xl p-6 text-blue-800 flex items-start gap-4">
                            <Info className="w-6 h-6 flex-shrink-0 mt-0.5" />
                            <div>
                                <h4 className="font-bold mb-1">Profile View Under Construction</h4>
                                <p className="text-sm opacity-80">
                                    This section will allow you to change your password and update your personal details in a future update.
                                </p>
                            </div>
                        </div>
                    </div>
                )}

                {activeSection === 'users' && userRole === 'admin' && (
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
            </div>
        </div>
    );
};

export default Settings;
