import { useState, useEffect } from 'react';
import { 
    ResponsiveContainer, BarChart, Bar, XAxis, YAxis, CartesianGrid, 
    Tooltip, Legend, Cell
} from 'recharts';
import { 
    GraduationCap, UserCheck, AlertOctagon, Search, 
    ChevronRight, Download, FileSpreadsheet, PieChart as PieIcon 
} from 'lucide-react';
import PremiumLoader from '../PremiumLoader';
import { exportToExcel } from '../../utils/ReportExporter';

interface TeacherReportProps {
    token: string;
}

const GRADE_COLORS: Record<string, string> = {
    '9-10 (Excellent)': '#10B981',
    '7-8.9 (Good)': '#3B82F6',
    '5-6.9 (Notice)': '#F59E0B',
    '0-4.9 (At Risk)': '#EF4444'
};

const TeacherReport = ({ token }: TeacherReportProps) => {
    const [data, setData] = useState<any>(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);
    const [searchTerm, setSearchTerm] = useState('');

    useEffect(() => {
        fetchData();
    }, [token]);

    const fetchData = async () => {
        try {
            const res = await fetch('/api/reports/v2/teacher', {
                headers: { 'Authorization': `Bearer ${token}` }
            });
            if (res.ok) {
                setData(await res.json());
                setError(null);
            } else {
                setError('Failed to load academic reports.');
            }
        } catch (err) {
            console.error('Fetch Teacher Report error:', err);
            setError('Connection error.');
        } finally {
            setLoading(false);
        }
    };

    const handleExport = () => {
        if (!data?.students) return;
        exportToExcel(data.students, 'Teacher_Student_Progress', 'Students');
    };

    if (loading) return <div className="h-96 flex items-center justify-center"><PremiumLoader size="lg" /></div>;

    if (error || !data) return (
        <div className="bg-slate-50 p-10 rounded-[2rem] text-center border border-slate-100 animate-in fade-in duration-500">
            <h3 className="text-slate-800 font-black text-2xl mb-2">Reports Unavailable</h3>
            <p className="text-slate-400 font-medium mb-6">{error || 'Data could not be retrieved.'}</p>
            <button 
                onClick={() => { setLoading(true); fetchData(); }}
                className="bg-primary text-white px-8 py-3 rounded-2xl font-bold shadow-lg shadow-primary/20 transition-all active:scale-95"
            >
                Try Again
            </button>
        </div>
    );

    const students = data.students || [];
    const gradeDistribution = data.gradeDistribution || [];

    const filteredStudents = students.filter((s: any) => 
        s.name.toLowerCase().includes(searchTerm.toLowerCase()) || 
        s.email.toLowerCase().includes(searchTerm.toLowerCase())
    );

    const atRiskCount = students.filter((s: any) => (s.avg_score || 0) < 5).length;

    return (
        <div className="space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-700">
            {/* Header */}
            <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-6 bg-white p-8 rounded-[2.5rem] shadow-premium border border-slate-100">
                <div className="flex items-center gap-6">
                    <div className="p-5 bg-primary text-white rounded-[1.5rem] shadow-lg shadow-primary/20">
                        <UserCheck size={32} />
                    </div>
                    <div>
                        <h2 className="text-3xl font-black text-slate-800 tracking-tight leading-none">Academic Tracking</h2>
                        <p className="text-slate-400 font-medium mt-2">Monitor student progress and identify pedagogical alerts.</p>
                    </div>
                </div>
                <div className="flex gap-3 w-full md:w-auto">
                    <button 
                        onClick={handleExport}
                        className="flex-1 md:flex-none flex items-center justify-center gap-2 px-6 py-4 bg-emerald-50 text-emerald-700 border border-emerald-100 rounded-2xl font-bold hover:bg-emerald-100 transition-all active:scale-95"
                    >
                        <FileSpreadsheet size={20} />
                        Export Data
                    </button>
                </div>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
                {/* Stats Dashboard */}
                <div className="lg:col-span-1 space-y-6">
                    <div className="bg-white p-6 rounded-[2rem] border border-slate-100 shadow-sm">
                        <h4 className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-6">Pedagogical Summary</h4>
                        <div className="space-y-4">
                            <StatTile 
                                label="Monitored Students" 
                                value={students.length} 
                                icon={<GraduationCap className="text-primary" />} 
                            />
                            <StatTile 
                                label="At Risk Alerts" 
                                value={atRiskCount} 
                                icon={<AlertOctagon className="text-accent" />} 
                                color={atRiskCount > 0 ? 'bg-red-50 text-red-600' : 'bg-slate-50 text-slate-400'}
                            />
                        </div>
                    </div>

                    <div className="bg-white p-8 rounded-[2rem] border border-slate-100 shadow-sm h-[350px] flex flex-col">
                        <h4 className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-6 flex items-center gap-2">
                           <PieIcon size={14} /> Performance Distribution
                        </h4>
                        <div className="flex-1 min-h-0">
                            <ResponsiveContainer width="100%" height="100%">
                                <BarChart data={gradeDistribution} layout="vertical" margin={{ left: -20 }}>
                                    <XAxis type="number" hide />
                                    <YAxis dataKey="range" type="category" width={100} axisLine={false} tickLine={false} tick={{fill: '#475569', fontSize: 10, fontWeight: 'bold'}} />
                                    <Tooltip 
                                        cursor={{fill: 'transparent'}}
                                        contentStyle={{ borderRadius: '1rem', border: 'none', boxShadow: '0 10px 15px -3px rgba(0, 0, 0, 0.1)' }}
                                    />
                                    <Bar dataKey="count" radius={[0, 4, 4, 0]} barSize={20}>
                                        {gradeDistribution.map((entry: any, index: number) => (
                                            <Cell key={`cell-${index}`} fill={GRADE_COLORS[entry.range] || '#CBD5E1'} />
                                        ))}
                                    </Bar>
                                </BarChart>
                            </ResponsiveContainer>
                        </div>
                    </div>
                </div>

                {/* Students List */}
                <div className="lg:col-span-2 bg-white rounded-[2.5rem] border border-slate-100 shadow-premium flex flex-col overflow-hidden min-h-[500px]">
                    <div className="p-8 border-b border-slate-50 flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
                        <h3 className="text-xl font-bold text-slate-800">Student Directory</h3>
                        <div className="relative w-full sm:w-64">
                            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                            <input 
                                type="text" 
                                placeholder="Search students..."
                                value={searchTerm}
                                onChange={e => setSearchTerm(e.target.value)}
                                className="w-full pl-10 pr-4 py-2 bg-slate-50 border-transparent focus:bg-white focus:ring-2 focus:ring-primary/10 focus:border-primary/50 text-sm rounded-xl transition-all outline-none"
                            />
                        </div>
                    </div>

                    <div className="flex-1 overflow-x-auto custom-scrollbar">
                        <table className="w-full text-left border-collapse">
                            <thead>
                                <tr className="bg-slate-50/50">
                                    <th className="px-8 py-4 text-[10px] font-black text-slate-400 uppercase tracking-widest">Student</th>
                                    <th className="px-8 py-4 text-[10px] font-black text-slate-400 uppercase tracking-widest text-center">Avg. Grade</th>
                                    <th className="px-8 py-4 text-[10px] font-black text-slate-400 uppercase tracking-widest text-center">Attendance</th>
                                    <th className="px-8 py-4 text-[10px] font-black text-slate-400 uppercase tracking-widest">Status</th>
                                    <th className="px-8 py-4"></th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-slate-50">
                                {filteredStudents.map((student: any) => (
                                    <tr key={student.id} className="hover:bg-slate-50/50 transition-colors group">
                                        <td className="px-8 py-5">
                                            <div className="flex items-center gap-3">
                                                <div className="w-10 h-10 bg-slate-100 rounded-xl flex items-center justify-center font-black text-slate-400 group-hover:bg-primary group-hover:text-white transition-colors">
                                                    {student.name.charAt(0)}
                                                </div>
                                                <div>
                                                    <p className="font-bold text-slate-800 text-sm">{student.name}</p>
                                                    <p className="text-xs text-slate-400">{student.email}</p>
                                                </div>
                                            </div>
                                        </td>
                                        <td className="px-8 py-5 text-center">
                                            <span className={`text-sm font-black ${getScoreColor(student.avg_score)}`}>
                                                {student.avg_score ? student.avg_score.toFixed(1) : '—'}
                                            </span>
                                        </td>
                                        <td className="px-8 py-5 text-center">
                                            <div className="flex flex-col items-center gap-1">
                                                <div className="w-24 h-1.5 bg-slate-100 rounded-full overflow-hidden">
                                                    <div 
                                                        className="h-full bg-indigo-500 rounded-full" 
                                                        style={{ width: `${Math.min(100, (student.days_present / Math.max(1, student.total_attendance_records)) * 100)}%` }} 
                                                    />
                                                </div>
                                                <span className="text-[10px] font-bold text-slate-400">
                                                    {student.days_present}/{student.total_attendance_records}
                                                </span>
                                            </div>
                                        </td>
                                        <td className="px-8 py-5">
                                            <div className="flex items-center gap-2">
                                                <div className={`w-2 h-2 rounded-full ${student.avg_score < 5 ? 'bg-red-500 animate-pulse' : 'bg-green-500'}`} />
                                                <span className="text-[10px] font-black uppercase tracking-tight text-slate-500">
                                                    {student.avg_score < 5 ? 'Risk' : 'Active'}
                                                </span>
                                            </div>
                                        </td>
                                        <td className="px-8 py-5 text-right">
                                            <button className="p-2 hover:bg-white rounded-lg transition-all border border-transparent hover:border-slate-100 hover:shadow-sm">
                                                <ChevronRight size={18} className="text-slate-300" />
                                            </button>
                                        </td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>
                </div>
            </div>
        </div>
    );
};

const StatTile = ({ label, value, icon, color = 'bg-slate-50 text-primary' }: any) => (
    <div className={`flex items-center gap-4 p-4 rounded-2xl border border-slate-100 ${color === 'bg-slate-50 text-primary' ? 'bg-white' : color}`}>
        <div className={`p-2.5 rounded-xl ${color === 'bg-slate-50 text-primary' ? 'bg-slate-50' : 'bg-white/20'}`}>
            {icon}
        </div>
        <div>
            <p className="text-[10px] font-bold opacity-60 uppercase">{label}</p>
            <p className="text-xl font-black">{value}</p>
        </div>
    </div>
);

const getScoreColor = (score: number) => {
    if (!score) return 'text-slate-300';
    if (score >= 9) return 'text-emerald-600';
    if (score >= 7) return 'text-primary';
    if (score >= 5) return 'text-amber-600';
    return 'text-accent';
};

export default TeacherReport;
