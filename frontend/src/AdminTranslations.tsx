import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Globe, Search, Save, Activity, LayoutTemplate, MessageSquare, Key, Trash2 } from 'lucide-react';
import { type NotificationType } from './components/Notification';

interface AdminTranslationsProps {
    token: string;
    onNotify: (msg: string, type: NotificationType) => void;
    onUnauthorized: () => void;
}

interface TranslationKey {
    key: string;
    module: string;
    is_active?: boolean;
    updated_at?: string;
    [languageName: string]: any;
}

export default function AdminTranslations({ token, onNotify, onUnauthorized }: AdminTranslationsProps) {
    const [translations, setTranslations] = useState<TranslationKey[]>([]);
    const [isLoading, setIsLoading] = useState(true);
    const [searchTerm, setSearchTerm] = useState('');
    const [selectedModule, setSelectedModule] = useState('all');
    
    // Editor State
    const [editingKey, setEditingKey] = useState<TranslationKey | null>(null);
    const [isSaving, setIsSaving] = useState(false);

    useEffect(() => {
        fetchTranslations();
    }, []);

    const fetchTranslations = async () => {
        try {
            const res = await fetch('/api/i18n/admin/keys', {
                headers: { Authorization: `Bearer ${token}` }
            });
            if (res.status === 401) {
                onUnauthorized();
                return;
            }
            if (res.ok) {
                const data = await res.json();
                setTranslations(data);
            }
        } catch (err) {
            console.error('Failed to load translations', err);
            onNotify('Error loading translations', 'error');
        } finally {
            setIsLoading(false);
        }
    };

    const modules = ['all', ...Array.from(new Set(translations.map(t => t.module)))];

    const languageKeys = translations.length > 0 
        ? Object.keys(translations[0]).filter(k => !['key', 'module', 'is_active', 'updated_at'].includes(k)) 
        : ['en', 'es', 'pt', 'zh', 'ja', 'fr', 'it', 'ht'];

    const filteredKeys = translations.filter(t => {
        let matchesSearch = t.key.toLowerCase().includes(searchTerm.toLowerCase());
        languageKeys.forEach(lang => {
            if (t[lang] && String(t[lang]).toLowerCase().includes(searchTerm.toLowerCase())) {
                matchesSearch = true;
            }
        });
        
        const matchesModule = selectedModule === 'all' || t.module === selectedModule;
        
        return matchesSearch && matchesModule;
    });

    const handleAddNewKey = () => {
        const newObj: TranslationKey = { key: '', module: 'common' };
        languageKeys.forEach(l => newObj[l] = '');
        setEditingKey(newObj);
    };

    const handleSave = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!editingKey?.key || !editingKey?.en) {
            onNotify('Key and English value are required', 'error');
            return;
        }

        setIsSaving(true);
        try {
            const res = await fetch('/api/i18n/admin/keys', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    Authorization: `Bearer ${token}`
                },
                body: JSON.stringify(editingKey)
            });

            if (res.status === 401) {
                onUnauthorized();
                return;
            }

            if (res.ok) {
                onNotify('Translation saved successfully!', 'success');
                fetchTranslations();
                setEditingKey(null);
            } else {
                onNotify('Server error saving translation', 'error');
            }
        } catch (err) {
            console.error(err);
            onNotify('Connection error', 'error');
        } finally {
            setIsSaving(false);
        }
    };

    const handleDelete = async (key: string) => {
        if (!window.confirm(`Are you sure you want to delete ${key}? This could break parts of the UI if hard-referenced.`)) return;
        
        try {
            const res = await fetch(`/api/i18n/admin/keys/${key}`, {
                method: 'DELETE',
                headers: { Authorization: `Bearer ${token}` }
            });
            
            if (res.status === 401) {
                onUnauthorized();
                return;
            }

            if (res.ok) {
                onNotify('Key deleted', 'success');
                fetchTranslations();
            }
        } catch (err) {
            console.error(err);
        }
    }

    if (isLoading) {
        return (
            <div className="flex justify-center items-center h-full">
                <Activity className="w-10 h-10 text-accent animate-spin" />
            </div>
        );
    }

    return (
        <div className="flex flex-col h-full bg-background min-h-[600px] pb-10">
            {/* Header */}
            <div className="flex justify-between items-center mb-6 bg-surface p-5 py-6 rounded-2xl shadow-sm border border-black/5">
                <div className="flex items-center gap-4">
                    <div className="w-12 h-12 rounded-xl bg-accent/10 flex items-center justify-center">
                        <Globe className="w-6 h-6 text-accent" />
                    </div>
                    <div>
                        <h1 className="text-2xl font-serif font-bold text-primary tracking-tight">System i18n Translations</h1>
                        <p className="text-sm text-gray-500">Manage all text labels and messages across the platform.</p>
                    </div>
                </div>
                <button
                    onClick={handleAddNewKey}
                    className="bg-accent hover:bg-accent-dark text-white px-6 py-3 rounded-xl font-bold text-sm uppercase tracking-widest shadow-premium hover:shadow-premium-hover transition-all flex items-center gap-2"
                >
                    + Add New Key
                </button>
            </div>

            <div className="flex gap-8 flex-col lg:flex-row flex-1 min-h-0">
                
                {/* Dictionary Table Pane */}
                <div className="flex-1 bg-surface rounded-2xl shadow-premium border border-black/5 overflow-hidden flex flex-col min-h-[400px]">
                    
                    {/* Filters */}
                    <div className="p-4 border-b border-gray-100 flex items-center gap-4 bg-gray-50/50">
                        <div className="relative flex-1">
                            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                            <input 
                                type="text" 
                                placeholder="Search by key or translation string..." 
                                value={searchTerm}
                                onChange={(e) => setSearchTerm(e.target.value)}
                                className="w-full pl-10 pr-4 py-2 text-sm border border-gray-200 rounded-lg outline-none focus:ring-2 focus:ring-accent/20 focus:border-accent transition-all"
                            />
                        </div>
                        <select 
                            value={selectedModule}
                            onChange={(e) => setSelectedModule(e.target.value)}
                            className="px-4 py-2 border border-gray-200 rounded-lg text-sm font-bold text-gray-600 outline-none focus:ring-2 focus:ring-accent/20 uppercase tracking-widest bg-white"
                        >
                            {modules.map(m => (
                                <option key={m} value={m}>{m === 'all' ? 'All Modules' : m}</option>
                            ))}
                        </select>
                    </div>

                    {/* Table View */}
                    <div className="flex-1 overflow-auto">
                        <table className="w-full text-left border-collapse">
                            <thead className="sticky top-0 bg-surface z-10 shadow-sm border-b border-gray-100">
                                <tr>
                                    <th className="py-4 px-6 text-xs font-bold text-gray-400 uppercase tracking-widest min-w-[200px]">Identifier Key</th>
                                    {languageKeys.map(lang => (
                                        <th key={lang} className="py-4 px-6 text-xs font-bold text-gray-400 uppercase tracking-widest min-w-[150px]">
                                            {lang === 'en' ? '🇬🇧 English (Default)' : 
                                             lang === 'es' ? '🇪🇸 Español' : 
                                             lang === 'pt' ? '🇵🇹 Português' : 
                                             lang === 'zh' ? '🇨🇳 中文 (Chinese)' : 
                                             lang === 'ja' ? '🇯🇵 日本語 (Japanese)' : 
                                             lang === 'fr' ? '🇫🇷 Français (French)' : 
                                             lang === 'it' ? '🇮🇹 Italiano (Italian)' : 
                                             lang === 'ht' ? '🇭🇹 Kreyòl (Haitian)' : 
                                             `🌐 ${lang.toUpperCase()}`}
                                        </th>
                                    ))}
                                    <th className="py-4 px-6 text-xs font-bold text-gray-400 uppercase tracking-widest w-[10%] text-center">Actions</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-gray-50">
                                {filteredKeys.map(item => (
                                    <tr 
                                        key={item.key} 
                                        className="hover:bg-blue-50/30 transition-colors group cursor-pointer"
                                        onClick={() => setEditingKey({...item})}
                                    >
                                        <td className="py-4 px-6">
                                            <div className="flex items-center gap-2">
                                                <Key className="w-3 h-3 text-gray-300" />
                                                <span className="font-mono text-sm font-bold text-primary">{item.key}</span>
                                            </div>
                                            <span className="text-[10px] font-bold uppercase tracking-widest bg-gray-100 text-gray-500 rounded px-2 mt-1 inline-block">{item.module}</span>
                                        </td>
                                        {languageKeys.map(lang => (
                                            <td key={lang} className="py-4 px-6 text-sm text-gray-600 font-medium">
                                                {item[lang] ? item[lang] : <span className="text-amber-500/50 text-xs italic font-bold">MISSING</span>}
                                            </td>
                                        ))}
                                        <td className="py-4 px-6 text-center">
                                            <button 
                                                onClick={(e) => { e.stopPropagation(); handleDelete(item.key); }}
                                                className="opacity-0 group-hover:opacity-100 p-2 text-red-400 hover:text-red-600 hover:bg-red-50 rounded-lg transition-all"
                                            >
                                                <Trash2 className="w-4 h-4" />
                                            </button>
                                        </td>
                                    </tr>
                                ))}
                                {filteredKeys.length === 0 && (
                                    <tr>
                                        <td colSpan={4} className="py-12 text-center text-gray-400">
                                            <MessageSquare className="w-12 h-12 mx-auto mb-3 opacity-20" />
                                            <p className="font-bold">No translations found.</p>
                                        </td>
                                    </tr>
                                )}
                            </tbody>
                        </table>
                    </div>
                </div>

                {/* Editor Pane (Right Sidebar) */}
                <AnimatePresence>
                    {editingKey && (
                        <motion.div
                            initial={{ opacity: 0, x: 20 }}
                            animate={{ opacity: 1, x: 0 }}
                            exit={{ opacity: 0, x: 20 }}
                            className="w-full lg:w-96 bg-surface rounded-2xl shadow-premium border border-black/5 flex flex-col overflow-hidden flex-shrink-0 relative"
                        >
                            <div className="p-5 border-b border-gray-100 bg-surface-low flex justify-between items-center">
                                <h3 className="font-bold text-primary flex items-center gap-2">
                                    <LayoutTemplate className="w-4 h-4 text-accent" />
                                    Translation Editor
                                </h3>
                                <button onClick={() => setEditingKey(null)} className="text-gray-400 hover:text-gray-600 text-xl font-bold">&times;</button>
                            </div>
                            
                            <form onSubmit={handleSave} className="p-6 flex-1 overflow-y-auto space-y-5">
                                <div className="space-y-1">
                                    <label className="text-xs font-bold text-gray-500 uppercase tracking-widest">Translation Key ID</label>
                                    <input 
                                        type="text"
                                        required
                                        value={editingKey.key}
                                        onChange={(e) => setEditingKey({...editingKey, key: e.target.value})}
                                        placeholder="e.g. landing.hero.title" 
                                        className="w-full px-4 py-3 bg-gray-50 border border-gray-200 rounded-xl outline-none focus:ring-2 focus:border-accent text-sm font-mono font-bold"
                                    />
                                    <p className="text-[10px] text-gray-400 mt-1">Use dot notation to organize keys.</p>
                                </div>
                                <div className="space-y-1">
                                    <label className="text-xs font-bold text-gray-500 uppercase tracking-widest">Grouping Module</label>
                                    <select
                                        value={editingKey.module}
                                        onChange={(e) => setEditingKey({...editingKey, module: e.target.value})}
                                        className="w-full px-4 py-3 bg-gray-50 border border-gray-200 rounded-xl outline-none focus:ring-2 focus:border-accent text-sm font-bold"
                                    >
                                        <option value="common">common</option>
                                        <option value="menu">menu</option>
                                        <option value="landing">landing</option>
                                        <option value="login">login</option>
                                        <option value="dashboard">dashboard</option>
                                        <option value="books">books</option>
                                        <option value="messages">messages</option>
                                        <option value="validations">validations</option>
                                        <option value="other">other (custom)</option>
                                    </select>
                                </div>

                                <div className="my-6 border-t border-gray-100"></div>

                                {languageKeys.map(lang => (
                                    <div key={lang} className="space-y-1">
                                        <label className="text-xs font-bold text-gray-500 uppercase tracking-widest flex items-center justify-between">
                                            <span>{lang === 'en' ? 'English (Fallback)' : 
                                                   lang === 'es' ? 'Español' : 
                                                   lang === 'pt' ? 'Português' : 
                                                   lang === 'zh' ? '中文 (Chinese)' : 
                                                   lang === 'ja' ? '日本語 (Japanese)' : 
                                                   lang === 'fr' ? 'Français (French)' : 
                                                   lang === 'it' ? 'Italiano (Italian)' : 
                                                   lang === 'ht' ? 'Kreyòl (Haitian)' : 
                                                   lang.toUpperCase()}</span>
                                            {lang === 'en' && <span className="text-red-400">*</span>}
                                        </label>
                                        <textarea 
                                            required={lang === 'en'}
                                            rows={2}
                                            value={editingKey[lang] || ''}
                                            onChange={(e) => setEditingKey({...editingKey, [lang]: e.target.value})}
                                            placeholder={`Translation for ${lang.toUpperCase()}...`}
                                            className="w-full px-4 py-3 border border-gray-200 rounded-xl outline-none focus:ring-2 focus:border-accent text-sm resize-y"
                                        />
                                    </div>
                                ))}

                                <button 
                                    type="submit"
                                    disabled={isSaving}
                                    className="w-full bg-accent hover:bg-accent-dark text-white py-4 mt-4 rounded-xl font-bold uppercase tracking-widest shadow-premium transition-all flex items-center justify-center gap-2"
                                >
                                    {isSaving ? <Activity className="w-5 h-5 animate-spin" /> : <Save className="w-5 h-5" />}
                                    Save Translation
                                </button>
                            </form>
                        </motion.div>
                    )}
                </AnimatePresence>

            </div>
        </div>
    );
}
