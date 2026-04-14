
import { useState, useEffect } from 'react';
import { 
    Users, Search, BookOpen, Plus, Trash2, 
    CheckCircle2, ArrowRight, UserPlus, ShieldCheck,
    Loader2, XCircle
} from 'lucide-react';
import PremiumLoader from '../PremiumLoader';

interface EnrollmentManagerProps {
    token: string;
    onNotify?: (msg: string, type: 'success' | 'error' | 'info') => void;
}

interface Module {
    id: number;
    name: string;
}

interface Student {
    id: number;
    name: string;
    email: string;
}

const EnrollmentManager = ({ token, onNotify }: EnrollmentManagerProps) => {
    const [modules, setModules] = useState<Module[]>([]);
    const [selectedModuleId, setSelectedModuleId] = useState<number | null>(null);
    const [studentsPool, setStudentsPool] = useState<Student[]>([]);
    const [enrolledStudents, setEnrolledStudents] = useState<Student[]>([]);
    const [loading, setLoading] = useState(true);
    const [actionLoading, setActionLoading] = useState<number | null>(null);
    const [searchTerm, setSearchTerm] = useState('');

    useEffect(() => {
        fetchInitialData();
    }, [token]);

    useEffect(() => {
        if (selectedModuleId) {
            fetchEnrollments(selectedModuleId);
        }
    }, [selectedModuleId]);

    const fetchInitialData = async () => {
        setLoading(true);
        try {
            const headers = { 'Authorization': `Bearer ${token}` };
            const [modRes, poolRes] = await Promise.all([
                fetch('/api/teacher/my-modules', { headers }),
                fetch('/api/teacher/students-pool', { headers })
            ]);

            if (modRes.ok) {
                const mods = await modRes.json();
                setModules(mods);
                if (mods.length > 0) setSelectedModuleId(mods[0].id);
            }
            if (poolRes.ok) setStudentsPool(await poolRes.json());
        } catch (err) {
            console.error('Error fetching enrollment data:', err);
            onNotify?.('Error loading course data.', 'error');
        } finally {
            setLoading(false);
        }
    };

    const fetchEnrollments = async (moduleId: number) => {
        try {
            const res = await fetch(`/api/teacher/module-enrollments/${moduleId}`, {
                headers: { 'Authorization': `Bearer ${token}` }
            });
            if (res.ok) setEnrolledStudents(await res.json());
        } catch (err) {
            console.error('Error fetching enrollments:', err);
        }
    };

    const handleEnroll = async (studentId: number) => {
        if (!selectedModuleId) return;
        setActionLoading(studentId);
        try {
            const res = await fetch('/api/teacher/enroll', {
                method: 'POST',
                headers: { 
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${token}` 
                },
                body: JSON.stringify({ studentId, moduleId: selectedModuleId })
            });
            if (res.ok) {
                onNotify?.('Student enrolled successfully!', 'success');
                fetchEnrollments(selectedModuleId);
            } else {
                const err = await res.json();
                onNotify?.(err.message || 'Enrollment failed.', 'error');
            }
        } catch (err) {
            onNotify?.('Connection error.', 'error');
        } finally {
            setActionLoading(null);
        }
    };

    const handleUnenroll = async (studentId: number) => {
        if (!selectedModuleId) return;
        if (!window.confirm('Are you sure you want to remove this student from the course?')) return;
        
        setActionLoading(studentId);
        try {
            const res = await fetch(`/api/teacher/unenroll/${studentId}/${selectedModuleId}`, {
                method: 'DELETE',
                headers: { 'Authorization': `Bearer ${token}` }
            });
            if (res.ok) {
                onNotify?.('Student unenrolled successfully.', 'info');
                fetchEnrollments(selectedModuleId);
            } else {
                onNotify?.('Unenrollment failed.', 'error');
            }
        } catch (err) {
            onNotify?.('Connection error.', 'error');
        } finally {
            setActionLoading(null);
        }
    };

    if (loading) return <div className="h-96 flex items-center justify-center"><PremiumLoader size="lg" /></div>;

    if (modules.length === 0) {
        return (
            <div className="bg-white p-20 rounded-[3rem] text-center border border-slate-100 shadow-premium">
                <div className="w-20 h-20 bg-slate-50 rounded-3xl flex items-center justify-center mx-auto mb-6 text-slate-300">
                    <XCircle size={40} />
                </div>
                <h3 className="text-2xl font-black text-slate-800 mb-2">No Modules Assigned</h3>
                <p className="text-slate-400 max-w-sm mx-auto">You must be assigned to at least one module by an administrator to manage student enrollments.</p>
            </div>
        );
    }

    const enrolledIds = new Set(enrolledStudents.map(s => s.id));
    const studentsNotInModule = studentsPool.filter(s => !enrolledIds.has(s.id));
    
    const filteredPool = studentsNotInModule.filter(s => 
        s.name.toLowerCase().includes(searchTerm.toLowerCase()) || 
        s.email.toLowerCase().includes(searchTerm.toLowerCase())
    );

    return (
        <div className="space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-700">
            {/* Control Bar */}
            <div className="flex flex-col lg:flex-row gap-6">
                <div className="flex-1 bg-white p-6 rounded-[2rem] border border-slate-100 shadow-sm flex flex-col md:flex-row items-center gap-6">
                    <div className="p-4 bg-primary/10 text-primary rounded-2xl">
                        <BookOpen size={24} />
                    </div>
                    <div className="flex-1 w-full">
                        <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-2">Active Course Management</p>
                        <select 
                            value={selectedModuleId || ''} 
                            onChange={(e) => setSelectedModuleId(Number(e.target.value))}
                            className="w-full bg-slate-50 border-transparent focus:bg-white focus:ring-2 focus:ring-primary/20 rounded-xl px-4 py-2 font-bold text-slate-700 outline-none transition-all cursor-pointer"
                        >
                            {modules.map(m => (
                                <option key={m.id} value={m.id}>{m.name.toUpperCase()}</option>
                            ))}
                        </select>
                    </div>
                </div>

                <div className="bg-white p-6 rounded-[2rem] border border-slate-100 shadow-sm flex items-center gap-6 px-10">
                    <div className="text-center">
                        <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1">Enrolled</p>
                        <p className="text-3xl font-black text-primary">{enrolledStudents.length}</p>
                    </div>
                    <div className="w-px h-10 bg-slate-100" />
                    <div className="text-center">
                        <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1">Available</p>
                        <p className="text-3xl font-black text-slate-300">{studentsNotInModule.length}</p>
                    </div>
                </div>
            </div>

            <div className="grid grid-cols-1 xl:grid-cols-2 gap-8">
                {/* Available Students Pool */}
                <div className="bg-white rounded-[2.5rem] border border-slate-100 shadow-premium overflow-hidden flex flex-col min-h-[500px]">
                    <div className="p-8 border-b border-slate-50 flex flex-col sm:flex-row justify-between items-center gap-4 bg-slate-50/30">
                        <div className="flex items-center gap-3">
                            <UserPlus className="text-primary w-6 h-6" />
                            <h3 className="text-xl font-bold text-slate-800">Enroll Students</h3>
                        </div>
                        <div className="relative w-full sm:w-64">
                            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                            <input 
                                type="text" 
                                placeholder="Search by name..."
                                value={searchTerm}
                                onChange={e => setSearchTerm(e.target.value)}
                                className="w-full pl-10 pr-4 py-2.5 bg-white border border-slate-200 focus:ring-2 focus:ring-primary/10 focus:border-primary/50 text-sm rounded-xl transition-all outline-none"
                            />
                        </div>
                    </div>
                    
                    <div className="flex-1 overflow-y-auto custom-scrollbar p-4 space-y-3">
                        {filteredPool.length === 0 ? (
                            <div className="h-full flex flex-col items-center justify-center text-slate-300 gap-4 py-20">
                                <Users size={48} className="opacity-20" />
                                <p className="text-sm font-medium">No students available for enrollment</p>
                            </div>
                        ) : (
                            filteredPool.map(student => (
                                <div key={student.id} className="flex items-center justify-between p-4 bg-slate-50 hover:bg-white rounded-2xl border border-transparent hover:border-slate-100 hover:shadow-sm transition-all group">
                                    <div className="flex items-center gap-4">
                                        <div className="w-10 h-10 bg-white rounded-xl shadow-sm flex items-center justify-center font-black text-slate-400 group-hover:text-primary transition-colors">
                                            {student.name.charAt(0)}
                                        </div>
                                        <div>
                                            <p className="font-bold text-slate-800 text-sm leading-tight">{student.name}</p>
                                            <p className="text-[10px] text-slate-400 font-medium uppercase tracking-tight">{student.email}</p>
                                        </div>
                                    </div>
                                    <button 
                                        onClick={() => handleEnroll(student.id)}
                                        disabled={actionLoading !== null}
                                        className="p-2 bg-white text-primary border border-slate-100 rounded-xl hover:bg-primary hover:text-white hover:border-primary transition-all shadow-sm active:scale-90 disabled:opacity-50"
                                    >
                                        {actionLoading === student.id ? <Loader2 className="w-5 h-5 animate-spin" /> : <Plus size={20} />}
                                    </button>
                                </div>
                            ))
                        )}
                    </div>
                </div>

                {/* Currently Enrolled Students */}
                <div className="bg-slate-900 rounded-[2.5rem] shadow-2xl overflow-hidden flex flex-col min-h-[500px]">
                    <div className="p-8 border-b border-white/5 flex items-center justify-between bg-white/[0.02]">
                        <div className="flex items-center gap-3">
                            <ShieldCheck className="text-emerald-400 w-6 h-6" />
                            <h3 className="text-xl font-bold text-white">Course Directory</h3>
                        </div>
                        <div className="px-4 py-1.5 bg-emerald-500/10 text-emerald-400 text-[10px] font-black uppercase tracking-[0.2em] rounded-full border border-emerald-500/20">
                            Active Roster
                        </div>
                    </div>

                    <div className="flex-1 overflow-y-auto custom-scrollbar p-4 space-y-3">
                        {enrolledStudents.length === 0 ? (
                            <div className="h-full flex flex-col items-center justify-center text-slate-600 gap-4 py-20">
                                <Search size={48} className="opacity-20" />
                                <p className="text-sm font-medium">This course roster is currently empty</p>
                            </div>
                        ) : (
                            enrolledStudents.map(student => (
                                <div key={student.id} className="flex items-center justify-between p-4 bg-white/[0.03] hover:bg-white/[0.06] rounded-2xl border border-transparent hover:border-white/10 transition-all group">
                                    <div className="flex items-center gap-4">
                                        <div className="w-10 h-10 bg-white/5 rounded-xl flex items-center justify-center font-black text-emerald-400 group-hover:scale-110 transition-transform">
                                            {student.name.charAt(0)}
                                        </div>
                                        <div>
                                            <p className="font-bold text-slate-200 text-sm leading-tight">{student.name}</p>
                                            <p className="text-[10px] text-slate-500 font-medium uppercase tracking-tight">{student.email}</p>
                                        </div>
                                    </div>
                                    <button 
                                        onClick={() => handleUnenroll(student.id)}
                                        disabled={actionLoading !== null}
                                        className="p-2 bg-white/5 text-slate-400 hover:bg-red-500 hover:text-white rounded-xl transition-all active:scale-90 disabled:opacity-50"
                                    >
                                        {actionLoading === student.id ? <Loader2 className="w-5 h-5 animate-spin" /> : <Trash2 size={18} />}
                                    </button>
                                </div>
                            ))
                        )}
                    </div>
                    
                    <div className="p-6 bg-white/[0.02] border-t border-white/5 text-center">
                        <p className="text-[9px] font-black text-slate-500 uppercase tracking-widest flex items-center justify-center gap-2">
                            <CheckCircle2 size={12} className="text-emerald-500" /> Students here have full access to module content
                        </p>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default EnrollmentManager;
