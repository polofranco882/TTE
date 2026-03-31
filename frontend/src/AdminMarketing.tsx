import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Mail, Settings as SettingsIcon, LayoutTemplate, Plus, Activity, ArrowRight, BarChart3, Database } from 'lucide-react';
import AdminMarketingCampaigns from './AdminMarketingCampaigns';
import AdminMarketingConfigs from './AdminMarketingConfigs';
import type { NotificationType } from './components/Notification';
import { useTranslation } from 'react-i18next';

interface AdminMarketingProps {
    token: string;
    onNotify: (msg: string, type: NotificationType) => void;
    onUnauthorized: () => void;
}

const AdminMarketing: React.FC<AdminMarketingProps> = ({ token, onNotify, onUnauthorized }) => {
    const { t } = useTranslation();
    const [activeTab, setActiveTab] = useState<'campaigns' | 'configs'>('campaigns');

    return (
        <div className="w-full h-full flex flex-col gap-6 md:gap-8 pt-4 md:pt-12">
            {/* Header Section */}
            <div className="flex flex-col md:flex-row md:items-end justify-between gap-4 px-2 md:px-0">
                <div>
                    <h2 className="text-xl md:text-3xl font-black text-[#2E49AC] tracking-tighter flex items-center gap-3">
                        <Mail className="w-8 h-8 md:w-10 md:h-10 text-[#AC2425]" />
                        EMAIL MARKETING
                    </h2>
                    <p className="text-sm md:text-base text-gray-500 mt-1 max-w-2xl">
                        Gestiona listas de contactos, diseña correos con plantillas interactivas y envía campañas de forma masiva y automatizada.
                    </p>
                </div>

                {/* Sub-navigation Tabs */}
                <div className="flex bg-white rounded-xl shadow-sm border border-gray-100 p-1">
                    <button
                        onClick={() => setActiveTab('campaigns')}
                        className={`px-5 py-2.5 rounded-lg text-sm font-bold flex items-center gap-2 transition-all ${activeTab === 'campaigns'
                                ? 'bg-[#2E49AC] text-white shadow-md'
                                : 'text-gray-500 hover:bg-gray-50'
                            }`}
                    >
                        <LayoutTemplate className="w-4 h-4" />
                        Campañas
                    </button>
                    <button
                        onClick={() => setActiveTab('configs')}
                        className={`px-5 py-2.5 rounded-lg text-sm font-bold flex items-center gap-2 transition-all ${activeTab === 'configs'
                                ? 'bg-[#2E49AC] text-white shadow-md'
                                : 'text-gray-500 hover:bg-gray-50'
                            }`}
                    >
                        <SettingsIcon className="w-4 h-4" />
                        Configuración SMTP
                    </button>
                </div>
            </div>

            {/* Content Area */}
            <div className="flex-1 bg-white rounded-3xl border border-gray-100 shadow-premium overflow-hidden flex flex-col relative">
                <AnimatePresence mode="wait">
                    {activeTab === 'campaigns' ? (
                        <motion.div
                            key="campaigns"
                            initial={{ opacity: 0, y: 10 }}
                            animate={{ opacity: 1, y: 0 }}
                            exit={{ opacity: 0, y: -10 }}
                            transition={{ duration: 0.2 }}
                            className="flex-1 flex flex-col h-full overflow-hidden"
                        >
                            <AdminMarketingCampaigns token={token} onNotify={onNotify} onUnauthorized={onUnauthorized} />
                        </motion.div>
                    ) : (
                        <motion.div
                            key="configs"
                            initial={{ opacity: 0, y: 10 }}
                            animate={{ opacity: 1, y: 0 }}
                            exit={{ opacity: 0, y: -10 }}
                            transition={{ duration: 0.2 }}
                            className="flex-1 flex flex-col h-full overflow-y-auto"
                        >
                            <AdminMarketingConfigs token={token} onNotify={onNotify} onUnauthorized={onUnauthorized} />
                        </motion.div>
                    )}
                </AnimatePresence>
            </div>
        </div>
    );
};

export default AdminMarketing;
