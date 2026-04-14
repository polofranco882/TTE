import { useState } from 'react';
import { 
    LayoutDashboard, Users, UserCheck, 
    Target, GraduationCap, ArrowLeft 
} from 'lucide-react';
import AdminReport from './AdminReport';
import TeacherReport from './TeacherReport';
import MarketingReport from './MarketingReport';
import StudentReport from './StudentReport';
import EnrollmentManager from '../teacher/EnrollmentManager';
import Notification, { type NotificationType } from '../Notification';

interface DashboardManagerProps {
    userRole: string | null;
    token: string;
}

const DashboardManager = ({ userRole, token }: DashboardManagerProps) => {
    // Admins and managers can toggle between all role views
    const isAdmin = ['admin', 'manager'].includes(userRole || '');
    
    // Default tab based on role
    const getDefaultTab = () => {
        if (isAdmin) return 'admin';
        if (userRole === 'teacher') return 'teacher';
        if (userRole === 'marketing') return 'marketing';
        if (userRole === 'student') return 'student';
        return 'student';
    };

    const [activeTab, setActiveTab] = useState(getDefaultTab());
    const [teacherView, setTeacherView] = useState<'reports' | 'enrollment'>('reports');
    const [selectedStudentId, setSelectedStudentId] = useState<number | null>(null);
    const [studentsPool, setStudentsPool] = useState<any[]>([]);
    const [notification, setNotification] = useState<{ msg: string; type: NotificationType } | null>(null);

    const onNotify = (msg: string, type: NotificationType) => {
        setNotification({ msg, type });
        setTimeout(() => setNotification(null), 5000);
    };

    const fetchStudents = async () => {
        try {
            const res = await fetch('/api/teacher/students-pool', {
                headers: { 'Authorization': `Bearer ${token}` }
            });
            if (res.ok) {
                const data = await res.json();
                setStudentsPool(data);
            }
        } catch (err) {
            console.error('Error fetching students:', err);
        }
    };

    const renderDashboard = () => {
        switch (activeTab) {
            case 'admin': return <AdminReport token={token} />;
            case 'teacher': 
                return teacherView === 'reports' 
                    ? <TeacherReport token={token} /> 
                    : <EnrollmentManager token={token} onNotify={onNotify} />;
            case 'marketing': return <MarketingReport token={token} />;
            case 'student': return <StudentReport token={token} userId={selectedStudentId || undefined} />;
            default: return <div className="p-20 text-center font-bold text-slate-400">Select a valid dashboard view.</div>;
        }
    };

    return (
        <div className="min-h-screen bg-[#F8FAFC] pb-20">
            {/* Context Navigation for Admins */}
            {isAdmin && (
                <div className="sticky top-0 z-[100] bg-white/80 backdrop-blur-xl border-b border-slate-100 px-8 py-4 mb-8">
                    <div className="max-w-7xl mx-auto flex items-center justify-between">
                        <div className="flex items-center gap-8">
                            <h1 className="text-xl font-black text-slate-800 tracking-tight hidden md:block">REPORTS HUB</h1>
                            <div className="flex bg-slate-100 p-1.5 rounded-2xl gap-1">
                                <TabButton 
                                    active={activeTab === 'admin'} 
                                    onClick={() => setActiveTab('admin')} 
                                    label="Global" 
                                    icon={<LayoutDashboard size={14} />} 
                                />
                                <TabButton 
                                    active={activeTab === 'teacher'} 
                                    onClick={() => setActiveTab('teacher')} 
                                    label="Teacher" 
                                    icon={<UserCheck size={14} />} 
                                />
                                <TabButton 
                                    active={activeTab === 'marketing'} 
                                    onClick={() => setActiveTab('marketing')} 
                                    label="Marketing" 
                                    icon={<Target size={14} />} 
                                />
                                <TabButton 
                                    active={activeTab === 'student'} 
                                    onClick={() => setActiveTab('student')} 
                                    label="Student" 
                                    icon={<GraduationCap size={14} />} 
                                />
                            </div>
                        </div>
                        <div className="text-[10px] font-black text-primary uppercase tracking-[0.2em] bg-primary/5 px-4 py-2 rounded-full hidden lg:block">
                            Supervised Control Active
                        </div>
                    </div>
                </div>
            )}

            {/* Teacher Specific Sub-navigation */}
            {activeTab === 'teacher' && (
                <div className="max-w-7xl mx-auto px-6 mb-8 flex justify-center lg:justify-start">
                    <div className="inline-flex bg-white/50 backdrop-blur-md p-1 rounded-2xl border border-slate-200 shadow-sm">
                        <button 
                            onClick={() => setTeacherView('reports')}
                            className={`px-6 py-2 rounded-xl text-[10px] font-black uppercase tracking-widest transition-all ${teacherView === 'reports' ? 'bg-primary text-white shadow-lg' : 'text-slate-400 hover:text-slate-600'}`}
                        >
                            Performance
                        </button>
                        <button 
                            onClick={() => setTeacherView('enrollment')}
                            className={`px-6 py-2 rounded-xl text-[10px] font-black uppercase tracking-widest transition-all ${teacherView === 'enrollment' ? 'bg-accent text-white shadow-lg' : 'text-slate-400 hover:text-slate-600'}`}
                        >
                            Enrolment
                        </button>
                    </div>
                </div>
            )}

            {/* Notification Area */}
            {notification && (
                <div className="fixed bottom-10 left-1/2 -translate-x-1/2 z-[500] w-full max-w-md px-4">
                    <Notification 
                        message={notification.msg} 
                        type={notification.type} 
                        isVisible={true}
                        onClose={() => setNotification(null)} 
                    />
                </div>
            )}

            {/* Admin Student Selection View */}
            {isAdmin && activeTab === 'student' && (
                <div className="max-w-7xl mx-auto px-6 mb-8 flex flex-col md:flex-row items-center gap-4 bg-white/50 p-4 rounded-3xl border border-slate-200">
                    <div className="flex items-center gap-3 px-4">
                        <Users size={20} className="text-primary" />
                        <span className="text-xs font-black text-slate-400 uppercase tracking-widest">Inspection Mode</span>
                    </div>
                    <select 
                        className="flex-1 w-full bg-white border border-slate-200 rounded-xl px-4 py-2 font-bold text-slate-700 outline-none focus:ring-2 focus:ring-primary/20"
                        value={selectedStudentId || ''}
                        onChange={(e) => setSelectedStudentId(e.target.value ? Number(e.target.value) : null)}
                        onClick={() => studentsPool.length === 0 && fetchStudents()}
                    >
                        <option value="">View my own profile (Self)</option>
                        {studentsPool.map(s => (
                            <option key={s.id} value={s.id}>{s.name} ({s.email})</option>
                        ))}
                    </select>
                </div>
            )}

            {/* Content Area */}
            <div className={`max-w-7xl mx-auto px-6 ${!isAdmin ? 'pt-8' : ''}`}>
                {renderDashboard()}
            </div>
        </div>
    );
};

const TabButton = ({ active, onClick, label, icon }: any) => (
    <button
        onClick={onClick}
        className={`flex items-center gap-2 px-4 py-2 rounded-xl text-[10px] font-black uppercase tracking-wider transition-all ${
            active 
            ? 'bg-white text-primary shadow-sm shadow-black/5' 
            : 'text-slate-400 hover:text-slate-600 hover:bg-white/50'
        }`}
    >
        {icon}
        {label}
    </button>
);

export default DashboardManager;
