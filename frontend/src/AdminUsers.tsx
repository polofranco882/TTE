import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { 
    Users, Search, Check, X, ChevronRight, Shield, KeyRound, 
    Eye, EyeOff, BookOpen, Presentation, ServerCog, Filter, GraduationCap, LayoutGrid, Mail,
    Edit3, Trash2, AlertCircle, ChevronDown, BookMarked, Plus
} from 'lucide-react';
import { useTranslation } from 'react-i18next';
import { type NotificationType } from './components/Notification';
import PremiumLoader from './components/PremiumLoader';

interface User {
    id: number;
    name: string;
    email: string;
    status: string;
    created_at: string;
    level_ids?: number[];
    levels?: string[];
    role_name: string;
    module_ids?: number[];
    modules?: string[];
}

interface AcademicLevel {
    id: number;
    name: string;
    module_id: number;
    module_name?: string;
}

interface Module {
    id: number;
    name: string;
}

interface UserBook {
    id: number;
    title: string;
    category: string;
    cover_image?: string;
    assignment_status: 'assigned' | 'inactive';
}

interface AdminUsersProps {
    token: string;
    onNotify: (msg: string, type: NotificationType) => void;
    onUnauthorized: () => void;
}

const AdminUsers = ({ token, onNotify, onUnauthorized }: AdminUsersProps) => {
    const { t } = useTranslation();
    
    // State
    const [users, setUsers] = useState<User[]>([]);
    const [levels, setLevels] = useState<AcademicLevel[]>([]);
    const [allModules, setAllModules] = useState<Module[]>([]);
    const [loading, setLoading] = useState(true);
    const [activeTab, setActiveTab] = useState<'admin' | 'teacher' | 'student' | 'marketing'>('student');
    const [selectedUser, setSelectedUser] = useState<User | null>(null);
    const [userBooks, setUserBooks] = useState<UserBook[]>([]);
    const [booksLoading, setBooksLoading] = useState(false);
    const [userModules, setUserModules] = useState<any[]>([]);
    const [modulesLoading, setModulesLoading] = useState(false);
    const [searchTerm, setSearchTerm] = useState('');
    
    // Filters
    const [filterLevel, setFilterLevel] = useState<string>('');
    const [filterModule, setFilterModule] = useState<string>('');

    // Modals
    const [formModal, setFormModal] = useState<{ isOpen: boolean; editingUser: User | null }>({ isOpen: false, editingUser: null });
    const [resetModal, setResetModal] = useState<{ isOpen: boolean; userId: number; userName: string } | null>(null);

    // Fetch Meta Data
    useEffect(() => {
        const fetchMeta = async () => {
            try {
                const headers = { Authorization: `Bearer ${token}` };
                const [levelsRes, modulesRes] = await Promise.all([
                    fetch('/api/admin/meta/academic-levels', { headers }),
                    fetch('/api/admin/meta/modules', { headers })
                ]);
                if (resUnauthorized(levelsRes)) return;
                if (levelsRes.ok) setLevels(await levelsRes.json());
                if (modulesRes.ok) setAllModules(await modulesRes.json());
            } catch (err) {
                console.error('Error fetching meta:', err);
            }
        };
        fetchMeta();
    }, [token]);

    const resUnauthorized = (res: Response) => {
        if (res.status === 401 || res.status === 403) {
            onUnauthorized();
            return true;
        }
        return false;
    };

    // Fetch Users with active tab
    useEffect(() => {
        fetchUsers();
    }, [activeTab, token, filterLevel, filterModule]);

    const fetchUsers = async () => {
        setLoading(true);
        try {
            let url = `/api/admin/users?role=${activeTab}`;
            if (activeTab === 'student' && filterLevel) url += `&level_id=${filterLevel}`;
            if (activeTab === 'teacher' && filterModule) url += `&module_id=${filterModule}`;

            const res = await fetch(url, {
                headers: { Authorization: `Bearer ${token}` }
            });
            if (resUnauthorized(res)) return;
            if (res.ok) {
                const data = await res.json();
                setUsers(data);
                if (selectedUser) {
                    const updated = data.find((u: User) => u.id === selectedUser.id);
                    if (updated) setSelectedUser(updated);
                }
            }
        } catch (err) {
            onNotify(t('admin.users.error_fetch', 'Error loading users'), 'error');
        } finally {
            setLoading(false);
        }
    };

    // Fetch user books and modules when selected
    useEffect(() => {
        if (selectedUser) {
            fetchUserBooks(selectedUser.id);
            fetchUserModules(selectedUser.id);
        }
    }, [selectedUser]);

    const fetchUserModules = async (userId: number) => {
        setModulesLoading(true);
        setUserModules([]);
        try {
            const res = await fetch(`/api/admin/users/${userId}/modules`, {
                headers: { Authorization: `Bearer ${token}` }
            });
            if (res.ok) setUserModules(await res.json());
        } catch (err) {
            console.error('Error fetching user modules:', err);
        } finally {
            setModulesLoading(false);
        }
    };

    const handleToggleModule = async (userId: number, moduleId: number, currentStatus: string) => {
        const newStatus = currentStatus === 'assigned' ? 'inactive' : 'assigned';
        try {
            const res = await fetch(`/api/admin/users/${userId}/modules`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
                body: JSON.stringify({ moduleId, status: newStatus })
            });
            if (res.ok) {
                onNotify(newStatus === 'assigned' ? 'Module assigned ✓' : 'Module removed', 'success');
                fetchUserModules(userId);
                fetchUsers();
            } else {
                onNotify('Error updating module', 'error');
            }
        } catch (err) {
            onNotify('Connection error', 'error');
        }
    };

    const fetchUserBooks = async (userId: number) => {
        setBooksLoading(true);
        setUserBooks([]); // Clear previous books while loading
        try {
            const res = await fetch(`/api/admin/users/${userId}/books`, {
                headers: { Authorization: `Bearer ${token}` }
            });
            if (res.ok) {
                const data = await res.json();
                setUserBooks(data);
            } else {
                console.error('Failed to fetch user books:', res.status);
                onNotify(t('admin.users.error_books', 'Error loading library access'), 'error');
            }
        } catch (err) {
            console.error('Fetch error in fetchUserBooks:', err);
            onNotify(t('common.error_connection', 'Connection error'), 'error');
        } finally {
            setBooksLoading(false);
        }
    };

    const handleSaveUser = async (formData: any) => {
        try {
            const isEdit = !!formModal.editingUser;
            const url = isEdit ? `/api/admin/users/${formModal.editingUser!.id}` : '/api/admin/users/create';
            const method = isEdit ? 'PUT' : 'POST';

            const res = await fetch(url, {
                method,
                headers: {
                    'Content-Type': 'application/json',
                    Authorization: `Bearer ${token}`
                },
                body: JSON.stringify(formData)
            });

            if (res.ok) {
                onNotify(isEdit ? t('admin.users.updated_success', 'User updated') : t('admin.users.created_success', 'User created'), 'success');
                setFormModal({ isOpen: false, editingUser: null });
                fetchUsers();
            } else {
                const data = await res.json();
                onNotify(data.message || t('admin.users.error_save', 'Error saving user'), 'error');
            }
        } catch (error) {
            onNotify(t('common.error_connection', 'Connection error'), 'error');
        }
    };

    const handleResetPassword = async (userId: number, pass: string) => {
        try {
            const res = await fetch(`/api/admin/users/${userId}/reset-password`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    Authorization: `Bearer ${token}`
                },
                body: JSON.stringify({ newPassword: pass })
            });
            if (res.ok) {
                onNotify(t('admin.users.password_updated', 'Password updated'), 'success');
                setResetModal(null);
            }
        } catch (err) {
            onNotify(t('admin.users.error_password', 'Error resetting password'), 'error');
        }
    };

    const handleToggleBook = async (userId: number, bookId: number, status: string) => {
        const newStatus = status === 'assigned' ? 'inactive' : 'assigned';
        try {
            const res = await fetch(`/api/admin/users/${userId}/books`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    Authorization: `Bearer ${token}`
                },
                body: JSON.stringify({ bookId, status: newStatus })
            });
            if (res.ok) {
                onNotify(t('admin.users.access_updated', 'Access updated'), 'success');
                fetchUserBooks(userId);
            }
        } catch (err) {
            onNotify(t('admin.users.error_access', 'Error updating access'), 'error');
        }
    };

    const filteredUsers = users.filter(u =>
        u.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
        u.email.toLowerCase().includes(searchTerm.toLowerCase())
    );

    return (
        <div className="flex flex-col lg:flex-row h-[calc(100vh-120px)] gap-6 p-2 lg:p-4 bg-[#F8FAFC]">
            {/* Left Panel: Navigation & User List */}
            <div className={`w-full lg:w-[380px] lg:min-w-[340px] shrink-0 flex flex-col gap-4 ${selectedUser ? 'hidden lg:flex' : 'flex'}`}>
                {/* Tabs */}
                <div className="bg-white p-1.5 rounded-2xl shadow-sm border border-slate-200 flex">
                    {(['student', 'teacher', 'admin', 'marketing'] as const).map((tab) => (
                        <button
                            key={tab}
                            onClick={() => { setActiveTab(tab); setSelectedUser(null); }}
                            className={`flex-1 py-2 sm:py-2.5 rounded-xl text-[9px] sm:text-[10px] font-bold transition-all uppercase tracking-wider ${
                                activeTab === tab 
                                ? 'bg-primary text-white shadow-lg' 
                                : 'text-slate-500 hover:bg-slate-50'
                            }`}
                        >
                            {t(`admin.users.tab_${tab}`, tab.charAt(0).toUpperCase() + tab.slice(1))}
                        </button>
                    ))}
                </div>

                {/* Sidebar Header & Filters */}
                <div className="bg-white rounded-2xl shadow-sm border border-slate-200 flex flex-col p-4 gap-4">
                    <div className="flex justify-between items-center">
                        <div className="flex items-center gap-2">
                            <div className="p-2 bg-indigo-50 rounded-lg">
                                <Users className="w-5 h-5 text-primary" />
                            </div>
                            <h2 className="font-bold text-slate-800">{t('admin.users.management', 'DIRECTORY')}</h2>
                        </div>
                        <button 
                            onClick={() => setFormModal({ isOpen: true, editingUser: null })}
                            className="bg-accent text-white px-3 py-1.5 rounded-xl text-xs font-bold hover:scale-105 transition-all shadow-sm shadow-accent/20"
                        >
                            + {t('common.new', 'NEW')}
                        </button>
                    </div>

                    <div className="relative">
                        <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                        <input
                            type="text"
                            placeholder={t('admin.users.search_placeholder', 'Search by name or email...')}
                            value={searchTerm}
                            onChange={e => setSearchTerm(e.target.value)}
                            className="w-full pl-10 pr-4 py-2.5 bg-slate-50 border border-slate-100 rounded-xl text-sm focus:bg-white focus:ring-2 focus:ring-accent/10 focus:border-accent transition-all"
                        />
                    </div>

                    {/* Contextual Filters */}
                    <AnimatePresence mode="wait">
                        {activeTab === 'student' && (
                            <motion.div initial={{ opacity: 0, y: -10 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -10 }}>
                                <select 
                                    className="w-full p-2.5 bg-slate-50 border border-slate-100 rounded-xl text-xs font-bold text-slate-600 focus:outline-none focus:border-accent"
                                    value={filterLevel}
                                    onChange={e => setFilterLevel(e.target.value)}
                                >
                                    <option value="">{t('admin.users.all_levels', 'All levels')}</option>
                                    <option value="unassigned" className="font-bold text-accent">-- {t('admin.users.other', 'Unassigned')} --</option>
                                    {levels.map(l => <option key={l.id} value={l.id}>{l.name}</option>)}
                                </select>
                            </motion.div>
                        )}
                        {activeTab === 'teacher' && (
                            <motion.div initial={{ opacity: 0, y: -10 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -10 }}>
                                <select 
                                    className="w-full p-2.5 bg-slate-50 border border-slate-100 rounded-xl text-xs font-bold text-slate-600 focus:outline-none focus:border-accent"
                                    value={filterModule}
                                    onChange={e => setFilterModule(e.target.value)}
                                >
                                    <option value="">{t('admin.users.all_modules', 'All modules')}</option>
                                    {allModules.map(m => <option key={m.id} value={m.id}>{m.name}</option>)}
                                </select>
                            </motion.div>
                        )}
                    </AnimatePresence>
                </div>

                {/* User List Scroll Area */}
                <div className="flex-1 overflow-y-auto pr-1 space-y-2 custom-scrollbar pb-10">
                    {loading ? (
                        <div className="py-20 text-center space-y-6">
                            <PremiumLoader size="md" />
                            <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest animate-pulse">{t('common.loading_db', 'Accessing directory...')}</p>
                        </div>
                    ) : filteredUsers.length === 0 ? (
                        <div className="py-20 text-center space-y-2">
                            <Filter className="w-8 h-8 text-slate-200 mx-auto" />
                            <p className="text-xs text-slate-400 font-medium">{t('admin.users.no_users', 'No users found matching search')}</p>
                        </div>
                    ) : (
                        filteredUsers.map(user => (
                            <motion.button
                                key={user.id}
                                layoutId={`user-${user.id}`}
                                onClick={() => setSelectedUser(user)}
                                className={`w-full flex items-center gap-3 p-3 rounded-2xl transition-all border ${
                                    selectedUser?.id === user.id 
                                    ? 'bg-white border-accent shadow-premium ring-1 ring-accent/20' 
                                    : 'bg-white border-transparent hover:border-slate-200 hover:shadow-sm'
                                }`}
                            >
                                <div className={`w-10 h-10 rounded-xl flex items-center justify-center font-black ${
                                    selectedUser?.id === user.id ? 'bg-accent text-white shadow-lg' : 'bg-slate-100 text-slate-400'
                                }`}>
                                    {user.name.charAt(0)}
                                </div>
                                <div className="text-left flex-1 min-w-0">
                                    <p className="text-sm font-bold text-slate-700 truncate">{user.name}</p>
                                    <p className="text-[10px] text-slate-400 font-medium truncate">{user.email}</p>
                                </div>
                                <div className="flex flex-col items-end gap-1">
                                    {user.levels && user.levels.length > 0 ? (
                                        <span className="text-[9px] font-black bg-indigo-50 text-indigo-600 px-2 py-0.5 rounded-md uppercase tracking-tighter">
                                            {user.levels.length} {user.levels.length === 1 ? 'Tier' : 'Tiers'}
                                        </span>
                                    ) : (user.role_name === 'student' && (
                                        <span className="text-[9px] font-black bg-amber-50 text-amber-600 px-2 py-0.5 rounded-md uppercase">
                                            {t('admin.users.unassigned', 'UNASSIGNED')}
                                        </span>
                                    ))}
                                </div>
                                <ChevronRight className={`w-4 h-4 text-slate-300 ${selectedUser?.id === user.id ? 'text-accent' : ''}`} />
                            </motion.button>
                        ))
                    )}
                </div>
            </div>

            {/* Right Panel: Details & Content */}
            <div className={`flex-1 min-w-0 bg-white rounded-[32px] shadow-sm border border-slate-200 overflow-hidden flex flex-col ${!selectedUser ? 'hidden lg:flex' : 'flex'}`}>
                {!selectedUser ? (
                    <div className="flex-1 flex flex-col items-center justify-center text-slate-300 gap-6 bg-slate-50/50 relative overflow-hidden">
                        <div className="absolute inset-0 opacity-20 pointer-events-none">
                            <div className="absolute top-1/4 left-1/4 w-64 h-64 bg-accent/20 rounded-full blur-3xl animate-pulse" />
                            <div className="absolute bottom-1/4 right-1/4 w-64 h-64 bg-primary/20 rounded-full blur-3xl" />
                        </div>
                        <div className="w-24 h-24 bg-white rounded-3xl shadow-premium flex items-center justify-center relative z-10 transition-transform hover:scale-110">
                            <Users className="w-12 h-12 text-slate-150" />
                        </div>
                        <div className="text-center relative z-10">
                            <h3 className="text-xl font-black text-slate-400 tracking-tight">{t('admin.users.selection_prompt', 'PROFILE EXPLORER')}</h3>
                            <p className="text-sm text-slate-300 max-w-xs mt-2">{t('admin.users.select_user_hint', 'Select a user from the directory to view permissions, library access, and academic assignments.')}</p>
                        </div>
                    </div>
                ) : (
                    <>
                        {/* === PROFILE IDENTITY CARD HEADER === */}
                        <div className="relative bg-white shrink-0 border-b border-slate-100 overflow-hidden">
                            {/* Gradient banner */}
                            <div className="h-24 bg-gradient-to-br from-primary via-primary/80 to-primary/50" />

                            {/* Back button (mobile only) */}
                            <button
                                onClick={() => setSelectedUser(null)}
                                className="lg:hidden absolute top-3 left-3 p-2 bg-white/20 backdrop-blur text-white rounded-xl hover:bg-white/30 transition-all"
                            >
                                <ChevronRight className="rotate-180 w-4 h-4" />
                            </button>

                            {/* Avatar + Name row */}
                            <div className="px-6 sm:px-8 pb-6">
                                {/* Avatar overlapping banner + action buttons */}
                                <div className="flex items-end justify-between -mt-8 mb-4">
                                    <div className="w-16 h-16 rounded-2xl bg-white shadow-xl border-4 border-white flex items-center justify-center">
                                        {selectedUser.role_name === 'student'
                                            ? <GraduationCap className="w-8 h-8 text-accent" />
                                            : selectedUser.role_name === 'teacher'
                                            ? <Presentation className="w-8 h-8 text-primary" />
                                            : <Shield className="w-8 h-8 text-primary" />}
                                    </div>
                                    {/* Action buttons — always fully visible */}
                                    <div className="flex gap-2">
                                        <motion.button
                                            whileTap={{ scale: 0.95 }}
                                            onClick={() => setFormModal({ isOpen: true, editingUser: selectedUser })}
                                            className="flex items-center gap-2 px-4 py-2 bg-white border border-slate-200 rounded-xl text-slate-600 text-xs font-bold shadow-sm hover:border-accent/50 hover:text-accent transition-all"
                                        >
                                            <Edit3 className="w-3.5 h-3.5" />
                                            {t('common.edit', 'Edit')}
                                        </motion.button>
                                        <motion.button
                                            whileTap={{ scale: 0.95 }}
                                            onClick={() => setResetModal({ isOpen: true, userId: selectedUser.id, userName: selectedUser.name })}
                                            className="flex items-center gap-2 px-4 py-2 bg-white border border-slate-200 rounded-xl text-slate-600 text-xs font-bold shadow-sm hover:border-amber-300 hover:text-amber-600 transition-all group"
                                        >
                                            <KeyRound className="w-3.5 h-3.5 text-amber-400 group-hover:rotate-12 transition-transform" />
                                            {t('admin.users.password', 'Key')}
                                        </motion.button>
                                    </div>
                                </div>

                                {/* Name + role badge */}
                                <h2 className="text-2xl font-black text-slate-800 leading-tight">{selectedUser.name}</h2>
                                <div className="flex items-center gap-2 mt-2 flex-wrap">
                                    <span className="px-3 py-1 bg-primary text-white text-[10px] font-black rounded-lg uppercase tracking-widest">
                                        {selectedUser.role_name}
                                    </span>
                                    <span className="flex items-center gap-1.5 text-xs text-slate-400">
                                        <Mail className="w-3.5 h-3.5 shrink-0" />
                                        <span className="truncate max-w-[220px]">{selectedUser.email}</span>
                                    </span>
                                    <span className="flex items-center gap-1.5 text-[10px] font-bold text-green-500">
                                        <span className="w-2 h-2 bg-green-400 rounded-full animate-pulse inline-block" />
                                        Active
                                    </span>
                                </div>
                            </div>
                        </div>

                        {/* === CONTENT AREA === */}
                        <div className="flex-1 overflow-y-auto custom-scrollbar bg-slate-50/40">
                            <div className="p-5 sm:p-6 space-y-5 pb-28">

                                {/* --- Academic Cards Row --- */}
                                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">

                                    {/* Module Access Card */}
                                    <div className="bg-white rounded-2xl border border-slate-100 shadow-sm p-5 flex flex-col gap-4">
                                        <div className="flex items-start justify-between gap-2">
                                            <div className="flex items-center gap-3">
                                                <div className="w-10 h-10 bg-primary/10 text-primary rounded-xl flex items-center justify-center shrink-0">
                                                    <LayoutGrid className="w-5 h-5" />
                                                </div>
                                                <div>
                                                    <p className="text-[9px] font-black text-slate-400 uppercase tracking-widest">{t('admin.users.hierarchy_context', 'Modules')}</p>
                                                    <p className="text-base font-black text-slate-700 leading-tight">Module Access</p>
                                                </div>
                                            </div>
                                            <span className="shrink-0 text-xs font-black text-primary bg-primary/5 px-3 py-1 rounded-lg tabular-nums border border-primary/10">
                                                {userModules.filter(m => m.assignment_status === 'assigned').length} / {userModules.length}
                                            </span>
                                        </div>
                                        <div className="flex flex-wrap gap-2">
                                            {modulesLoading ? (
                                                [1,2,3].map(i => <div key={i} className="h-8 w-24 bg-slate-100 rounded-xl animate-pulse" />)
                                            ) : userModules.length === 0 ? (
                                                <span className="text-xs text-slate-300 italic">No modules assigned</span>
                                            ) : (
                                                userModules.map((mod: any) => (
                                                    <button
                                                        key={mod.id}
                                                        onClick={() => handleToggleModule(selectedUser.id, mod.id, mod.assignment_status)}
                                                        title={mod.assignment_status === 'assigned' ? 'Click to remove' : 'Click to assign'}
                                                        className={`flex items-center gap-1.5 px-3 py-2 rounded-xl text-xs font-bold border-2 transition-all active:scale-95 ${
                                                            mod.assignment_status === 'assigned'
                                                            ? 'bg-primary border-primary text-white shadow-sm'
                                                            : 'bg-slate-50 border-slate-200 text-slate-500 hover:border-primary/40 hover:text-primary hover:bg-primary/5'
                                                        }`}
                                                    >
                                                        {mod.assignment_status === 'assigned' && <Check size={10} strokeWidth={3}/>}
                                                        {mod.name}
                                                    </button>
                                                ))
                                            )}
                                        </div>
                                    </div>

                                    {/* Enrolled Tiers Card */}
                                    <div className="bg-white rounded-2xl border border-slate-100 shadow-sm p-5 flex flex-col gap-4">
                                        <div className="flex items-center gap-3">
                                            <div className="w-10 h-10 bg-accent/10 text-accent rounded-xl flex items-center justify-center shrink-0">
                                                <GraduationCap className="w-5 h-5" />
                                            </div>
                                            <div>
                                                <p className="text-[9px] font-black text-slate-400 uppercase tracking-widest">{t('admin.users.tier_context', 'Academic Placement')}</p>
                                                <p className="text-base font-black text-slate-700 leading-tight">Enrolled Tiers</p>
                                            </div>
                                        </div>
                                        <div className="flex flex-wrap gap-2">
                                            {selectedUser.levels && selectedUser.levels.length > 0 ? (
                                                selectedUser.levels.map(level => (
                                                    <span key={level} className="px-4 py-2 bg-amber-50 text-amber-700 rounded-xl text-xs font-bold uppercase tracking-wide border border-amber-100">
                                                        {level}
                                                    </span>
                                                ))
                                            ) : (
                                                <span className="text-sm text-slate-300 italic">No tiers assigned</span>
                                            )}
                                        </div>
                                    </div>
                                </div>

                                {/* --- Library Privileges Section --- */}
                                <div className="bg-white rounded-2xl border border-slate-100 shadow-sm overflow-hidden">
                                    <div className="flex items-center justify-between px-5 py-4 border-b border-slate-100">
                                        <div className="flex items-center gap-3">
                                            <div className="w-10 h-10 bg-accent/10 rounded-xl flex items-center justify-center">
                                                <BookOpen className="w-5 h-5 text-accent" />
                                            </div>
                                            <div>
                                                <h3 className="text-sm font-black text-slate-700">{t('admin.users.library_access', 'Library Privileges')}</h3>
                                                <p className="text-xs text-slate-400">Click a book to toggle access</p>
                                            </div>
                                        </div>
                                        <span className="text-xs font-bold px-3 py-1.5 bg-slate-50 border border-slate-100 rounded-xl text-slate-500">
                                            {userBooks.filter(b => b.assignment_status === 'assigned').length} Assigned
                                        </span>
                                    </div>
                                    <div className="p-5">
                                        {booksLoading ? (
                                            <div className="grid grid-cols-2 sm:grid-cols-3 gap-4">
                                                {[1,2,3,4].map(i => (
                                                    <div key={i} className="aspect-[3/4] bg-slate-100 rounded-2xl animate-pulse" />
                                                ))}
                                            </div>
                                        ) : (
                                            <div className="grid grid-cols-2 sm:grid-cols-3 gap-4">
                                                {userBooks.map(book => (
                                                    <motion.div
                                                        key={book.id}
                                                        layout
                                                        initial={{ opacity: 0, scale: 0.9 }}
                                                        animate={{ opacity: 1, scale: 1 }}
                                                        className={`group relative aspect-[3/4] rounded-2xl overflow-hidden cursor-pointer border-4 transition-all duration-500 shadow-sm hover:shadow-xl ${
                                                            book.assignment_status === 'assigned' 
                                                            ? 'border-accent/40 ring-1 ring-accent/10 scale-[1.02]' 
                                                            : 'border-white grayscale opacity-60 hover:grayscale-0 hover:opacity-100'
                                                        }`}
                                                        onClick={() => handleToggleBook(selectedUser.id, book.id, book.assignment_status)}
                                                    >
                                                        <img 
                                                            src={book.cover_image || 'https://placehold.co/400x600?text=BOOK'} 
                                                            className="w-full h-full object-cover transition-transform duration-700 group-hover:scale-110" 
                                                            alt=""
                                                        />
                                                        <div className="absolute inset-0 bg-gradient-to-t from-slate-950 via-slate-900/10 to-transparent opacity-80 group-hover:opacity-90 transition-opacity" />
                                                        <div className="absolute top-3 right-3">
                                                            {book.assignment_status === 'assigned' ? (
                                                                <div className="w-8 h-8 bg-accent text-white rounded-full flex items-center justify-center shadow-lg border-2 border-white/20">
                                                                    <Check className="w-4 h-4" strokeWidth={3} />
                                                                </div>
                                                            ) : (
                                                                <div className="w-8 h-8 bg-white/20 backdrop-blur border border-white/20 rounded-full flex items-center justify-center group-hover:bg-accent group-hover:border-transparent transition-all">
                                                                    <Plus className="w-4 h-4 text-white" />
                                                                </div>
                                                            )}
                                                        </div>
                                                        <div className="absolute bottom-0 inset-x-0 p-3 translate-y-1 group-hover:translate-y-0 transition-transform">
                                                            <p className="text-xs font-black text-white leading-tight drop-shadow-lg">{book.title}</p>
                                                        </div>
                                                    </motion.div>
                                                ))}
                                            </div>
                                        )}
                                    </div>
                                </div>

                            </div>
                        </div>
                    </>
                )}
            </div>

            {/* Hierarchical Form Modal */}
            <UserForm 
                isOpen={formModal.isOpen} 
                onClose={() => setFormModal({ isOpen: false, editingUser: null })} 
                onSubmit={handleSaveUser} 
                levels={levels}
                modules={allModules}
                editingUser={formModal.editingUser}
                forcedRole={activeTab}
                t={t}
            />

            {/* Password Reset Modal */}
            <PasswordResetModal 
                data={resetModal} 
                onClose={() => setResetModal(null)} 
                onSubmit={handleResetPassword} 
                t={t}
            />
        </div>
    );
};

// --- Helper Components ---

const UserForm = ({ isOpen, onClose, onSubmit, levels, modules, editingUser, forcedRole, t }: any) => {
    const defaultForm = { 
        name: '', email: '', password: '', role: (forcedRole || 'student') as any, 
        level_ids: [] as number[], module_ids: [] as number[] 
    };
    const [form, setForm] = useState(defaultForm);
    const [saving, setSaving] = useState(false);

    useEffect(() => {
        if (editingUser) {
            setForm({
                name: editingUser.name,
                email: editingUser.email,
                password: '', // Always empty on edit
                role: editingUser.role_name,
                level_ids: editingUser.level_ids || [],
                module_ids: editingUser.module_ids || []
            });
        } else {
            setForm({
                ...defaultForm,
                role: forcedRole || 'student'
            });
        }
    }, [editingUser, isOpen, forcedRole]);

    if (!isOpen) return null;

    const toggleLevel = (id: number) => {
        setForm(prev => ({
            ...prev,
            level_ids: prev.level_ids.includes(id) 
                ? prev.level_ids.filter(lid => lid !== id) 
                : [...prev.level_ids, id]
        }));
    };

    const toggleModule = (id: number) => {
        setForm(prev => ({
            ...prev,
            module_ids: prev.module_ids.includes(id) 
                ? prev.module_ids.filter(mid => mid !== id) 
                : [...prev.module_ids, id]
        }));
    };

    const handleFormSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setSaving(true);
        await onSubmit(form);
        setSaving(false);
    };

    // Group levels by module for the hierarchical selector
    const groupedLevels = modules.map((mod: Module) => ({
        ...mod,
        levels: levels.filter((l: AcademicLevel) => Number(l.module_id) === mod.id)
    }));

    return (
        <div className="fixed inset-0 z-[300] flex items-center justify-center p-4">
            <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} onClick={onClose} className="absolute inset-0 bg-slate-950/80 backdrop-blur-xl" />
            <motion.div 
                initial={{ scale: 0.95, opacity: 0, y: 20 }} 
                animate={{ scale: 1, opacity: 1, y: 0 }} 
                exit={{ scale: 0.95, opacity: 0, y: 20 }}
                className="bg-white w-full max-w-2xl rounded-[48px] shadow-2xl relative z-10 overflow-hidden flex flex-col max-h-[95vh]"
            >
                <div className="p-8 bg-primary text-white flex justify-between items-center relative overflow-hidden">
                    <div className="absolute inset-0 opacity-10 pointer-events-none">
                        <Users className="absolute -bottom-10 -left-10 w-48 h-48 rotate-12" />
                    </div>
                    <div className="relative z-10">
                        <h3 className="text-3xl font-black tracking-tight">{editingUser ? 'REFINE PROFILE' : 'ENROLL NEW MEMBER'}</h3>
                        <p className="text-[10px] font-black text-slate-300 uppercase tracking-[0.3em] mt-1">Academic Access Control Protocol</p>
                    </div>
                    <button onClick={onClose} className="p-4 bg-white/10 rounded-3xl hover:bg-white/20 transition-all border border-white/5 relative z-10"><X size={24} /></button>
                </div>
                
                <form onSubmit={handleFormSubmit} className="flex-1 overflow-y-auto p-10 space-y-10 custom-scrollbar">
                    {/* Identification Section */}
                    <div className="space-y-6">
                        <div className="flex items-center gap-3 mb-2">
                            <div className="w-1.5 h-6 bg-accent rounded-full" />
                            <h4 className="text-xs font-black text-slate-800 uppercase tracking-widest">Identification & Credentials</h4>
                        </div>
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                            <InputField label="FULL NAME" value={form.name} onChange={(v: string) => setForm({...form, name: v})} placeholder="e.g. Gabriel García" />
                            <InputField label="INSTITUTIONAL EMAIL" value={form.email} onChange={(v: string) => setForm({...form, email: v})} placeholder="gabriel@ttesol.com" type="email" />
                            <InputField label={editingUser ? "CHANGE PASSWORD (OPTIONAL)" : "ACCOUNT PASSWORD"} value={form.password} onChange={(v: string) => setForm({...form, password: v})} placeholder="Min 4 characters" type="password" />
                            
                            <div>
                                <label className="text-[10px] font-black text-slate-400 uppercase tracking-[0.1em] mb-2 block ml-1">ASSIGNED PROTOCOL (ROLE)</label>
                                <div className="relative group">
                                    <select 
                                        className={`w-full p-4 bg-slate-50 border-2 border-slate-100 rounded-[24px] focus:bg-white focus:border-accent transition-all text-sm font-bold text-slate-700 outline-none appearance-none ${!editingUser ? 'bg-slate-100/50 cursor-not-allowed text-slate-400' : 'cursor-pointer hover:border-slate-200'}`}
                                        value={form.role}
                                        onChange={e => setForm({...form, role: e.target.value as any})}
                                        disabled={!editingUser}
                                    >
                                        <option value="student">STUDENT - LEARNER</option>
                                        <option value="teacher">TEACHER - MENTOR</option>
                                        <option value="marketing">MARKETING - ANALYST</option>
                                        <option value="manager">MANAGER - COORDINATOR</option>
                                        <option value="admin">ADMIN - SYSTEM OVERSEER</option>
                                    </select>
                                    <div className="absolute right-5 top-1/2 -translate-y-1/2 flex items-center gap-2 pointer-events-none">
                                        {!editingUser && <Shield size={14} className="text-slate-300" />}
                                        <ChevronDown className="text-slate-400" size={20} />
                                    </div>
                                    {!editingUser && (
                                        <div className="absolute -bottom-5 left-1 opacity-0 group-hover:opacity-100 transition-opacity">
                                            <p className="text-[8px] font-black text-accent uppercase tracking-widest">{t('admin.users.role_context_locked', 'Role locked to active tab context')}</p>
                                        </div>
                                    )}
                                </div>
                            </div>
                        </div>
                    </div>

                    {/* Hierarchy Assignment Section */}
                    <AnimatePresence mode="wait">
                        {(form.role === 'student' || form.role === 'teacher') && (
                            <motion.div 
                                initial={{ opacity: 0, y: 20 }} 
                                animate={{ opacity: 1, y: 0 }} 
                                exit={{ opacity: 0, y: 20 }}
                                className="space-y-8"
                            >
                                <div className="flex items-center gap-3 mb-2">
                                    <div className="w-1.5 h-6 bg-primary rounded-full" />
                                    <h4 className="text-xs font-black text-slate-800 uppercase tracking-widest">Academic Hierarchy Assignment</h4>
                                </div>

                                {/* Multi-Module Selector for Teachers AND Students */}
                                {(form.role === 'teacher' || form.role === 'student') && (
                                    <div className="space-y-4 bg-slate-50 p-6 rounded-[32px] border border-slate-100">
                                        <label className="text-[10px] font-black text-slate-500 uppercase tracking-widest block ml-1">
                                            {form.role === 'teacher' ? 'Specialty Modules' : 'Enrolled Modules'}
                                        </label>
                                        <div className="flex flex-wrap gap-2">
                                            {modules.map((m: any) => (
                                                <button 
                                                    key={m.id} 
                                                    type="button"
                                                    onClick={() => toggleModule(m.id)}
                                                    className={`px-5 py-2.5 rounded-2xl text-[10px] font-black border-2 transition-all ${
                                                        form.module_ids.includes(m.id) 
                                                        ? 'bg-primary border-primary text-white shadow-lg' 
                                                        : 'bg-white border-white text-slate-400 hover:border-primary/30'
                                                    }`}
                                                >
                                                    {m.name.toUpperCase()}
                                                </button>
                                            ))}
                                        </div>
                                    </div>
                                )}

                                {/* Hierarchical Level Selector for Students/Teachers */}
                                <div className="space-y-6">
                                    <div className="flex items-center justify-between ml-1">
                                        <label className="text-[10px] font-black text-slate-500 uppercase tracking-widest block">Enrollment Tiers (Grouped by Module)</label>
                                        <div className="text-[10px] font-black text-accent uppercase tracking-widest">{form.level_ids.length} Selected</div>
                                    </div>
                                    
                                    <div className="grid grid-cols-1 gap-4">
                                        {groupedLevels.map((group: any) => (
                                            <div key={group.id} className="bg-white border-2 border-slate-50 rounded-[32px] overflow-hidden">
                                                <div className="bg-slate-50/50 px-6 py-3 border-b border-slate-100 flex items-center gap-3">
                                                    <LayoutGrid size={14} className="text-slate-400" />
                                                    <span className="text-[10px] font-black text-slate-500 uppercase tracking-widest">{group.name}</span>
                                                </div>
                                                <div className="p-4 flex flex-wrap gap-2">
                                                    {group.levels.length > 0 ? (
                                                        group.levels.map((l: any) => (
                                                            <button 
                                                                key={l.id} 
                                                                type="button"
                                                                onClick={() => toggleLevel(l.id)}
                                                                className={`flex items-center gap-2 pl-2 pr-4 py-2 rounded-xl text-[10px] font-bold border-2 transition-all ${
                                                                    form.level_ids.includes(l.id) 
                                                                    ? 'bg-accent/10 border-accent text-accent' 
                                                                    : 'bg-white border-slate-100 text-slate-400 hover:border-slate-200'
                                                                }`}
                                                            >
                                                                <div className={`w-4 h-4 rounded-md flex items-center justify-center transition-colors ${form.level_ids.includes(l.id) ? 'bg-accent' : 'border border-slate-200 bg-white'}`}>
                                                                    {form.level_ids.includes(l.id) && <Check size={10} className="text-white" strokeWidth={5} />}
                                                                </div>
                                                                {l.name}
                                                            </button>
                                                        ))
                                                    ) : (
                                                        <span className="text-[10px] text-slate-300 italic px-2">No tiers defined for this module</span>
                                                    )}
                                                </div>
                                            </div>
                                        ))}
                                    </div>
                                </div>
                            </motion.div>
                        )}
                    </AnimatePresence>
                </form>

                <div className="p-10 bg-slate-50 border-t border-slate-100 flex gap-4 shrink-0 mt-auto">
                    <button type="button" onClick={onClose} className="flex-1 py-4 font-black text-slate-400 hover:text-slate-600 uppercase tracking-[0.2em] text-xs transition-colors">ABORT MISSION</button>
                    <button 
                        onClick={handleFormSubmit}
                        disabled={saving || !form.name || !form.email}
                        className="flex-[2] py-5 bg-accent text-white rounded-[24px] font-black shadow-2xl shadow-accent/40 hover:scale-[1.02] active:scale-95 disabled:opacity-50 transition-all uppercase tracking-[0.2em] text-xs flex items-center justify-center gap-3"
                    >
                        {saving ? <LocalLoader className="animate-spin" /> : <LocalSave size={20} />}
                        {editingUser ? 'COMMIT CHANGES' : 'AUTHORIZE ACCOUNT'}
                    </button>
                </div>
            </motion.div>
        </div>
    );
};

const PasswordResetModal = ({ data, onClose, onSubmit, t }: any) => {
    const [pass, setPass] = useState('');
    const [show, setShow] = useState(false);
    const [saving, setSaving] = useState(false);
    if (!data) return null;

    return (
        <div className="fixed inset-0 z-[400] flex items-center justify-center p-4">
            <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} onClick={onClose} className="absolute inset-0 bg-slate-950/90 backdrop-blur-xl" />
            <motion.div initial={{ scale: 0.9, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} className="bg-white rounded-[40px] p-10 w-full max-w-sm shadow-2xl relative z-10 border border-slate-100">
                <div className="flex items-center gap-5 mb-8">
                    <div className="p-5 bg-amber-50 rounded-[24px] shadow-sm">
                        <KeyRound className="text-amber-500 w-8 h-8" />
                    </div>
                    <div>
                        <h3 className="text-xl font-black text-slate-800 tracking-tight leading-none">{t('admin.users.reset_pass', 'KEY RESET')}</h3>
                        <p className="text-[10px] text-amber-600 font-black uppercase tracking-widest mt-1 mt-2">{data.userName}</p>
                    </div>
                </div>
                <div className="relative mb-8 group">
                    <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-2 block ml-1">New Operational Password</label>
                    <div className="relative">
                        <input 
                            type={show ? 'text' : 'password'} 
                            autoFocus
                            value={pass} 
                            onChange={e => setPass(e.target.value)} 
                            className="w-full p-5 bg-slate-50 border-2 border-slate-50 rounded-[20px] focus:bg-white focus:border-amber-500 transition-all text-sm font-bold outline-none pr-14 shadow-sm"
                            placeholder="Min 4 symbols..."
                        />
                        <button onClick={() => setShow(!show)} className="absolute right-5 top-1/2 -translate-y-1/2 text-slate-400 hover:text-amber-500 transition-colors">
                            {show ? <EyeOff size={20} /> : <Eye size={20} />}
                        </button>
                    </div>
                </div>
                <div className="flex flex-col gap-3">
                    <button 
                        onClick={async () => {
                            setSaving(true);
                            await onSubmit(data.userId, pass);
                            setSaving(false);
                        }} 
                        disabled={saving || pass.length < 4}
                        className="w-full py-5 bg-amber-500 text-white rounded-[24px] font-black text-xs uppercase tracking-widest shadow-xl shadow-amber-500/30 hover:scale-[1.02] active:scale-95 disabled:opacity-50 transition-all flex items-center justify-center gap-2"
                    >
                        {saving ? <LocalLoader className="animate-spin" /> : <LocalSave size={18} />}
                        UPDATE KEY
                    </button>
                    <button onClick={onClose} className="w-full py-3 text-[10px] font-black text-slate-300 hover:text-slate-500 uppercase tracking-widest transition-colors">DISCARD</button>
                </div>
            </motion.div>
        </div>
    );
};

const InputField = ({ label, value, onChange, placeholder, type = 'text' }: any) => (
    <div>
        <label className="text-[10px] font-black text-slate-400 uppercase tracking-[0.1em] mb-2 block ml-1">{label}</label>
        <div className="relative group">
            <input 
                type={type} 
                value={value} 
                onChange={e => onChange(e.target.value)}
                placeholder={placeholder}
                className="w-full p-4 bg-slate-50 border-2 border-slate-100 rounded-[24px] focus:bg-white focus:border-accent transition-all text-sm font-bold text-slate-700 outline-none placeholder:text-slate-300 shadow-sm"
            />
        </div>
    </div>
);

const LocalLoader = ({ className, size = 20 }: { className?: string; size?: number }) => (
    <ServerCog className={`${className} animate-spin`} size={size} />
);

const LocalSave = ({ className, size = 20 }: { className?: string; size?: number }) => (
    <Check className={className} size={size} />
);

export default AdminUsers;
