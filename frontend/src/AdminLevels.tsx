import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { 
    Plus, Edit2, Trash2, X, Save, GraduationCap, Search, AlertCircle, Loader2, 
    LayoutGrid, BookText, ChevronDown, ChevronRight, Layers, Trash, MoreVertical
} from 'lucide-react';
import { useTranslation } from 'react-i18next';

interface ModuleItem {
    id: number;
    name: string;
}

interface LevelItem {
    id: number;
    name: string;
    module_id: number;
    module_name?: string;
}

interface AdminLevelsProps {
    token: string | null;
    onNotify: (message: string, type: 'success' | 'error' | 'info') => void;
    onUnauthorized: () => void;
}

const AdminLevels = ({ token, onNotify, onUnauthorized }: AdminLevelsProps) => {
    const { t } = useTranslation();
    const [modules, setModules] = useState<ModuleItem[]>([]);
    const [levels, setLevels] = useState<LevelItem[]>([]);
    const [loading, setLoading] = useState(true);
    const [searchTerm, setSearchTerm] = useState('');
    const [expandedModules, setExpandedModules] = useState<number[]>([]);
    
    // Modal state
    const [isModuleModalOpen, setIsModuleModalOpen] = useState(false);
    const [isLevelModalOpen, setIsLevelModalOpen] = useState(false);
    const [editingItem, setEditingItem] = useState<any | null>(null);
    const [newName, setNewName] = useState('');
    const [selectedModuleId, setSelectedModuleId] = useState<number | ''>('');
    const [saving, setSaving] = useState(false);

    const fetchData = async () => {
        setLoading(true);
        try {
            const [modRes, levRes] = await Promise.all([
                fetch('/api/admin/meta/modules', { headers: { 'Authorization': `Bearer ${token}` } }),
                fetch('/api/admin/meta/academic-levels', { headers: { 'Authorization': `Bearer ${token}` } })
            ]);

            if (modRes.status === 401 || levRes.status === 401) return onUnauthorized();
            
            if (modRes.ok && levRes.ok) {
                setModules(await modRes.json());
                setLevels(await levRes.json());
            }
        } catch (error) {
            onNotify(t('admin.meta.error_fetch', 'Error loading data'), 'error');
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchData();
    }, []);

    const toggleModule = (id: number) => {
        setExpandedModules(prev => 
            prev.includes(id) ? prev.filter(mid => mid !== id) : [...prev, id]
        );
    };

    const handleSaveModule = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!newName.trim()) return;
        setSaving(true);
        try {
            const url = editingItem ? `/api/admin/meta/modules/${editingItem.id}` : '/api/admin/meta/modules';
            const method = editingItem ? 'PUT' : 'POST';
            const res = await fetch(url, {
                method,
                headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${token}` },
                body: JSON.stringify({ name: newName })
            });

            if (res.ok) {
                onNotify(t('admin.meta.module_saved', 'Module saved'), 'success');
                setIsModuleModalOpen(false);
                fetchData();
            } else {
                onNotify(t('admin.meta.error_save', 'Error saving module'), 'error');
            }
        } catch (error) {
            onNotify(t('admin.meta.error_save', 'Error connection'), 'error');
        } finally {
            setSaving(false);
        }
    };

    const handleSaveLevel = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!newName.trim() || !selectedModuleId) return;
        setSaving(true);
        try {
            const url = editingItem ? `/api/admin/meta/academic-levels/${editingItem.id}` : '/api/admin/meta/academic-levels';
            const method = editingItem ? 'PUT' : 'POST';
            const res = await fetch(url, {
                method,
                headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${token}` },
                body: JSON.stringify({ name: newName, module_id: selectedModuleId })
            });

            if (res.ok) {
                onNotify(t('admin.meta.level_saved', 'Level saved'), 'success');
                setIsLevelModalOpen(false);
                fetchData();
            } else {
                onNotify(t('admin.meta.error_save', 'Error saving level'), 'error');
            }
        } catch (error) {
            onNotify(t('admin.meta.error_save', 'Error connection'), 'error');
        } finally {
            setSaving(false);
        }
    };

    const handleDelete = async (type: 'module' | 'level', id: number) => {
        const confirmMsg = type === 'module' 
            ? t('admin.modules.confirm_delete', 'Deleting a module will leave its tiers unassigned. Continue?')
            : t('admin.levels.confirm_delete', 'Are you sure you want to delete this level?');
        
        if (!confirm(confirmMsg)) return;

        try {
            const path = type === 'module' ? 'modules' : 'academic-levels';
            const res = await fetch(`/api/admin/meta/${path}/${id}`, {
                method: 'DELETE',
                headers: { 'Authorization': `Bearer ${token}` }
            });
            if (res.ok) {
                onNotify(t('admin.meta.deleted', 'Deleted successfully'), 'success');
                fetchData();
            }
        } catch (error) {
            onNotify(t('admin.meta.error_delete', 'Error deleting'), 'error');
        }
    };

    const filteredModules = modules.filter(m => m.name.toLowerCase().includes(searchTerm.toLowerCase()));

    return (
        <div className="space-y-6">
            <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-6">
                <div>
                    <h2 className="text-3xl font-black text-primary tracking-tight flex items-center gap-3">
                        <Layers className="text-accent" size={32} />
                        {t('admin.academic_mgmt.hierarchy_title', 'ACADEMIC STRUCTURE')}
                    </h2>
                    <p className="text-slate-500 font-medium">{t('admin.academic_mgmt.hierarchy_subtitle', 'Manage parent Modules and their child Educational Tiers.')}</p>
                </div>
                
                <div className="flex gap-3">
                    <motion.button
                        whileHover={{ scale: 1.02 }}
                        whileTap={{ scale: 0.98 }}
                        onClick={() => {
                            setEditingItem(null);
                            setNewName('');
                            setIsModuleModalOpen(true);
                        }}
                        className="bg-primary hover:bg-primary-dark text-white px-5 py-3 rounded-xl font-bold flex items-center gap-2 shadow-lg transition-all text-xs tracking-widest"
                    >
                        <Plus size={18} />
                        {t('admin.modules.add_brief', 'ADD MODULE')}
                    </motion.button>
                    <motion.button
                        whileHover={{ scale: 1.02 }}
                        whileTap={{ scale: 0.98 }}
                        onClick={() => {
                            setEditingItem(null);
                            setNewName('');
                            setSelectedModuleId('');
                            setIsLevelModalOpen(true);
                        }}
                        className="bg-accent hover:bg-accent-dark text-white px-5 py-3 rounded-xl font-bold flex items-center gap-2 shadow-premium transition-all text-xs tracking-widest"
                    >
                        <Plus size={18} />
                        {t('admin.levels.add_brief', 'ADD TIER')}
                    </motion.button>
                </div>
            </div>

            {/* Search */}
            <div className="bg-white rounded-2xl border border-slate-200 p-4 flex gap-4 items-center shadow-sm">
                <div className="relative flex-1 group">
                    <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400 group-focus-within:text-accent transition-colors" size={20} />
                    <input
                        type="text"
                        placeholder={t('admin.meta.search_hierarchy', 'Search modules or levels...')}
                        value={searchTerm}
                        onChange={(e) => setSearchTerm(e.target.value)}
                        className="w-full bg-slate-50 border border-slate-200 rounded-xl py-3.5 pl-12 pr-4 outline-none focus:border-accent/50 focus:ring-4 focus:ring-accent/10 transition-all text-slate-900 font-medium placeholder:text-slate-400"
                    />
                </div>
                <div className="flex gap-2">
                    <div className="px-4 py-2.5 bg-indigo-50 rounded-xl border border-indigo-100 text-[10px] font-black uppercase tracking-widest text-primary">
                        {modules.length} {t('common.modules', 'Modules')}
                    </div>
                </div>
            </div>

            {/* Hierarchical Content */}
            {loading ? (
                <div className="py-20 flex flex-col items-center gap-4">
                    <Loader2 className="animate-spin text-accent" size={40} />
                    <span className="text-slate-400 animate-pulse">{t('common.loading', 'Reconstructing hierarchy...')}</span>
                </div>
            ) : (
                <div className="space-y-4">
                    {filteredModules.length > 0 ? (
                        filteredModules.map((mod) => {
                            const modLevels = levels.filter(l => l.module_id === mod.id);
                            const isExpanded = expandedModules.includes(mod.id);

                            return (
                                <div key={mod.id} className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden transition-all">
                                    {/* Module Header */}
                                    <div className={`p-5 flex items-center justify-between group cursor-pointer hover:bg-slate-50/50 transition-colors ${isExpanded ? 'bg-slate-50/30' : ''}`}
                                         onClick={() => toggleModule(mod.id)}>
                                        <div className="flex items-center gap-4">
                                            <div className="p-2.5 bg-primary text-white rounded-xl shadow-md">
                                                <LayoutGrid size={20} />
                                            </div>
                                            <div>
                                                <h3 className="text-lg font-bold text-slate-900 leading-tight">{mod.name}</h3>
                                                <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest">
                                                    {modLevels.length} {modLevels.length === 1 ? 'Tier' : 'Tiers'}
                                                </span>
                                            </div>
                                        </div>
                                        
                                        <div className="flex items-center gap-4">
                                            <div className="hidden group-hover:flex items-center gap-2 opacity-0 group-hover:opacity-100 transition-all">
                                                <button 
                                                    onClick={(e) => {
                                                        e.stopPropagation();
                                                        setEditingItem(mod);
                                                        setNewName(mod.name);
                                                        setIsModuleModalOpen(true);
                                                    }}
                                                    className="p-2 text-slate-400 hover:text-primary hover:bg-white rounded-lg transition-all"
                                                >
                                                    <Edit2 size={16} />
                                                </button>
                                                <button 
                                                    onClick={(e) => {
                                                        e.stopPropagation();
                                                        handleDelete('module', mod.id);
                                                    }}
                                                    className="p-2 text-slate-400 hover:text-red-500 hover:bg-white rounded-lg transition-all"
                                                >
                                                    <Trash2 size={16} />
                                                </button>
                                            </div>
                                            <div className={`p-2 rounded-lg transition-all ${isExpanded ? 'bg-accent text-white rotate-180' : 'text-slate-300'}`}>
                                                <ChevronDown size={20} />
                                            </div>
                                        </div>
                                    </div>

                                    {/* Levels List */}
                                    <AnimatePresence>
                                        {isExpanded && (
                                            <motion.div
                                                initial={{ height: 0, opacity: 0 }}
                                                animate={{ height: 'auto', opacity: 1 }}
                                                exit={{ height: 0, opacity: 0 }}
                                                className="border-t border-slate-100"
                                            >
                                                <div className="p-2 bg-slate-50/50">
                                                    {modLevels.length > 0 ? (
                                                        <div className="space-y-1">
                                                            {modLevels.map(level => (
                                                                <div key={level.id} className="flex items-center justify-between p-4 bg-white rounded-xl border border-slate-100 hover:border-accent/20 hover:shadow-sm transition-all group/level">
                                                                    <div className="flex items-center gap-3">
                                                                        <div className="w-1.5 h-6 bg-accent/20 rounded-full" />
                                                                        <div>
                                                                            <span className="text-slate-800 font-bold block">{level.name}</span>
                                                                            <span className="text-[10px] text-slate-400 font-mono">ID: {level.id}</span>
                                                                        </div>
                                                                    </div>
                                                                    <div className="flex items-center gap-1 opacity-0 group-hover/level:opacity-100 transition-all">
                                                                        <button 
                                                                            onClick={() => {
                                                                                setEditingItem(level);
                                                                                setNewName(level.name);
                                                                                setSelectedModuleId(level.module_id);
                                                                                setIsLevelModalOpen(true);
                                                                            }}
                                                                            className="p-2 text-slate-400 hover:text-primary hover:bg-slate-50 rounded-lg transition-all"
                                                                        >
                                                                            <Edit2 size={14} />
                                                                        </button>
                                                                        <button 
                                                                            onClick={() => handleDelete('level', level.id)}
                                                                            className="p-2 text-slate-400 hover:text-red-500 hover:bg-slate-50 rounded-lg transition-all"
                                                                        >
                                                                            <Trash2 size={14} />
                                                                        </button>
                                                                    </div>
                                                                </div>
                                                            ))}
                                                        </div>
                                                    ) : (
                                                        <div className="py-8 text-center bg-white rounded-xl border border-dashed border-slate-200">
                                                            <BookText className="mx-auto text-slate-200 mb-2" size={32} />
                                                            <p className="text-xs text-slate-400 font-medium">No levels assigned to this module yet.</p>
                                                        </div>
                                                    )}
                                                </div>
                                            </motion.div>
                                        )}
                                    </AnimatePresence>
                                </div>
                            );
                        })
                    ) : (
                        <div className="py-20 text-center bg-white rounded-2xl border border-slate-200 animate-in fade-in duration-500">
                            <Layers className="mx-auto text-slate-200 mb-4" size={64} />
                            <h3 className="text-xl font-bold text-slate-600 mb-2">No modules found</h3>
                            <p className="text-slate-400 max-w-sm mx-auto">Create your first parent module to start building your academic structure.</p>
                        </div>
                    )}
                </div>
            )}

            {/* Module Modal */}
            <AnimatePresence>
                {isModuleModalOpen && (
                    <div className="fixed inset-0 z-[300] flex items-center justify-center p-4">
                        <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} onClick={() => setIsModuleModalOpen(false)} className="absolute inset-0 bg-black/80 backdrop-blur-sm" />
                        <motion.div initial={{ scale: 0.95, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} exit={{ scale: 0.95, opacity: 0 }} className="bg-white w-full max-w-md rounded-3xl shadow-2xl relative z-10 overflow-hidden">
                            <div className="p-6 bg-primary text-white">
                                <h3 className="text-xl font-bold">{editingItem ? 'Edit Module' : 'New Module'}</h3>
                                <p className="text-[10px] text-slate-400 font-black uppercase tracking-widest mt-1">Parent Educational Container</p>
                            </div>
                            <form onSubmit={handleSaveModule} className="p-8 space-y-6">
                                <div>
                                    <label className="block text-[10px] font-black text-slate-400 uppercase tracking-widest mb-2 ml-1">Module Name</label>
                                    <input autoFocus type="text" value={newName} onChange={e => setNewName(e.target.value)} className="w-full bg-slate-50 border-2 border-slate-100 rounded-2xl py-4 px-5 outline-none focus:bg-white focus:border-accent/40 text-slate-900 font-bold transition-all" placeholder="e.g. Mathematics" />
                                </div>
                                <div className="flex justify-end gap-3">
                                    <button type="button" onClick={() => setIsModuleModalOpen(false)} className="px-6 py-3 text-slate-400 font-bold text-xs uppercase tracking-widest">Cancel</button>
                                    <button type="submit" disabled={saving || !newName.trim()} className="bg-accent text-white px-8 py-4 rounded-2xl font-black shadow-lg shadow-accent/20 disabled:opacity-50 transition-all uppercase text-xs tracking-widest">
                                        {saving ? <Loader2 className="animate-spin" size={20} /> : <Save size={20} className="mr-2 inline" />}
                                        Save Module
                                    </button>
                                </div>
                            </form>
                        </motion.div>
                    </div>
                )}
            </AnimatePresence>

            {/* Level Modal */}
            <AnimatePresence>
                {isLevelModalOpen && (
                    <div className="fixed inset-0 z-[300] flex items-center justify-center p-4">
                        <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} onClick={() => setIsLevelModalOpen(false)} className="absolute inset-0 bg-black/80 backdrop-blur-sm" />
                        <motion.div initial={{ scale: 0.95, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} exit={{ scale: 0.95, opacity: 0 }} className="bg-white w-full max-w-md rounded-3xl shadow-2xl relative z-10 overflow-hidden">
                            <div className="p-6 bg-accent text-white">
                                <h3 className="text-xl font-bold">{editingItem ? 'Edit Tier' : 'Enroll New Tier'}</h3>
                                <p className="text-[10px] text-white/60 font-black uppercase tracking-widest mt-1">Child Academic Sub-level</p>
                            </div>
                            <form onSubmit={handleSaveLevel} className="p-8 space-y-6">
                                <div>
                                    <label className="block text-[10px] font-black text-slate-400 uppercase tracking-widest mb-2 ml-1">Tier Designation</label>
                                    <input autoFocus type="text" value={newName} onChange={e => setNewName(e.target.value)} className="w-full bg-slate-50 border-2 border-slate-100 rounded-2xl py-4 px-5 outline-none focus:bg-white focus:border-accent/40 text-slate-900 font-bold transition-all" placeholder="e.g. 1er Año BGU" />
                                </div>
                                <div>
                                    <label className="block text-[10px] font-black text-slate-400 uppercase tracking-widest mb-2 ml-1">Assign to Parent Module</label>
                                    <select value={selectedModuleId} onChange={e => setSelectedModuleId(Number(e.target.value))} className="w-full bg-slate-50 border-2 border-slate-100 rounded-2xl py-4 px-5 outline-none focus:bg-white focus:border-accent/40 text-slate-900 font-bold transition-all appearance-none cursor-pointer">
                                        <option value="">Select a module...</option>
                                        {modules.map(m => <option key={m.id} value={m.id}>{m.name}</option>)}
                                    </select>
                                </div>
                                <div className="bg-amber-50 p-4 rounded-2xl border border-amber-100 flex gap-3 text-amber-700 text-xs font-medium">
                                    <AlertCircle size={20} className="shrink-0" />
                                    <p>Tiers must be assigned to a parent module to be organized correctly in the curriculum.</p>
                                </div>
                                <div className="flex justify-end gap-3">
                                    <button type="button" onClick={() => setIsLevelModalOpen(false)} className="px-6 py-3 text-slate-400 font-bold text-xs uppercase tracking-widest">Cancel</button>
                                    <button type="submit" disabled={saving || !newName.trim() || !selectedModuleId} className="bg-primary text-white px-8 py-4 rounded-2xl font-black shadow-lg shadow-primary/20 disabled:opacity-50 transition-all uppercase text-xs tracking-widest">
                                        {saving ? <Loader2 className="animate-spin" size={20} /> : <Save size={20} className="mr-2 inline" />}
                                        Save Tier
                                    </button>
                                </div>
                            </form>
                        </motion.div>
                    </div>
                )}
            </AnimatePresence>
        </div>
    );
};

export default AdminLevels;
