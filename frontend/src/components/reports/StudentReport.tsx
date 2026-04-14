import { useState, useEffect } from 'react';
import { 
    ResponsiveContainer, LineChart, Line, XAxis, YAxis, CartesianGrid, 
    Tooltip, Legend, PieChart, Pie, Cell, AreaChart, Area
} from 'recharts';
import { 
    GraduationCap, BookOpen, Calendar, Star, 
    CheckCircle2, Clock, Award, TrendingUp 
} from 'lucide-react';
import PremiumLoader from '../PremiumLoader';

interface StudentReportProps {
    token: string;
    userId?: number;
}

const COLORS = ['#10B981', '#EF4444', '#3B82F6', '#F59E0B'];

const StudentReport = ({ token, userId }: StudentReportProps) => {
    const [data, setData] = useState<any>(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);

    useEffect(() => {
        fetchData();
    }, [token, userId]);

    const fetchData = async () => {
        try {
            const url = userId ? `/api/reports/v2/student?userId=${userId}` : '/api/reports/v2/student';
            const res = await fetch(url, {
                headers: { 'Authorization': `Bearer ${token}` }
            });
            if (res.ok) {
                setData(await res.json());
                setError(null);
            } else {
                setError('Unable to load your academic report.');
            }
        } catch (err) {
            console.error('Fetch Student Report error:', err);
            setError('Network error syncing your progress.');
        } finally {
            setLoading(false);
        }
    };

    if (loading) return <div className="h-96 flex items-center justify-center"><PremiumLoader size="lg" /></div>;

    if (error || !data) return (
        <div className="bg-white p-12 rounded-[2.5rem] text-center border border-slate-100 shadow-premium animate-in fade-in slide-in-from-bottom-4 duration-500">
            <div className="w-20 h-20 bg-slate-50 rounded-full flex items-center justify-center mx-auto mb-6">
                <TrendingUp size={32} className="text-slate-300" />
            </div>
            <h3 className="text-slate-800 font-black text-2xl mb-2">Sync Interrupted</h3>
            <p className="text-slate-400 font-medium mb-8 max-w-sm mx-auto">{error || 'There was a hiccup retrieving your learning stats.'}</p>
            <button 
                onClick={() => { setLoading(true); fetchData(); }}
                className="bg-primary text-white px-10 py-4 rounded-2xl font-bold shadow-xl shadow-primary/20 hover:scale-[1.02] transition-all active:scale-95"
            >
                Try Syncing Again
            </button>
        </div>
    );

    const records = data.records || [];
    const attendance = data.attendance || [];
    const books = data.books || [];
    const evolution = data.evolution || [];

    const avgScore = records.length > 0 
        ? (records.reduce((acc: number, curr: any) => acc + parseFloat(curr.score), 0) / records.length).toFixed(1)
        : '0.0';

    return (
        <div className="space-y-8 animate-in fade-in slide-in-from-right-4 duration-700 pb-10">
            {/* Student Header Summary */}
            <div className="bg-white p-8 rounded-[2.5rem] shadow-premium border border-slate-100 flex flex-col md:flex-row justify-between items-center gap-8">
                <div className="flex items-center gap-6">
                    <div className="relative">
                        <div className="w-24 h-24 bg-gradient-to-br from-primary to-indigo-600 rounded-[2rem] flex items-center justify-center shadow-xl">
                            <GraduationCap size={48} className="text-white" />
                        </div>
                        <div className="absolute -bottom-2 -right-2 bg-emerald-500 text-white p-2 rounded-full border-4 border-white">
                            <CheckCircle2 size={16} />
                        </div>
                    </div>
                    <div>
                        <h2 className="text-3xl font-black text-slate-800 tracking-tight">Academic Progress</h2>
                        <div className="flex flex-wrap gap-3 mt-2">
                            <Tag icon={<Star size={12} />} label="Active Student" color="bg-primary/10 text-primary" />
                            <Tag icon={<Award size={12} />} label={`Avg: ${avgScore}`} color="bg-emerald-50 text-emerald-600" />
                        </div>
                    </div>
                </div>
                
                <div className="flex gap-4">
                    <SummaryMetric label="Exercises" value={records.filter((r: any) => r.record_type === 'task').length} />
                    <div className="w-px h-12 bg-slate-100 hidden md:block" />
                    <SummaryMetric label="Attendance" value={`${((attendance.find((a: any) => a.status === 'present')?.count || 0) / Math.max(1, attendance.reduce((acc: any, curr: any) => acc + curr.count, 0)) * 100).toFixed(0)}%`} />
                </div>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
                {/* Evolution & Performance */}
                <div className="lg:col-span-2 space-y-8">
                    {/* Evolution Line Chart */}
                    <div className="bg-white p-8 rounded-[2.5rem] shadow-premium border border-slate-100 h-[400px] flex flex-col">
                        <h3 className="text-xl font-bold text-slate-800 mb-6 flex items-center gap-3">
                            <TrendingUp className="text-primary w-6 h-6" /> Score Evolution
                        </h3>
                        <div className="flex-1 min-h-0">
                            <ResponsiveContainer width="100%" height="100%">
                                <AreaChart data={evolution}>
                                    <defs>
                                        <linearGradient id="colorScore" x1="0" y1="0" x2="0" y2="1">
                                            <stop offset="5%" stopColor="#1E3A8A" stopOpacity={0.2}/>
                                            <stop offset="95%" stopColor="#1E3A8A" stopOpacity={0}/>
                                        </linearGradient>
                                    </defs>
                                    <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
                                    <XAxis dataKey="date" axisLine={false} tickLine={false} tick={{fill: '#94A3B8', fontSize: 11}} dy={10} />
                                    <YAxis domain={[0, 10]} axisLine={false} tickLine={false} tick={{fill: '#94A3B8', fontSize: 11}} />
                                    <Tooltip 
                                        contentStyle={{ borderRadius: '1rem', border: 'none', boxShadow: '0 10px 15px -3px rgba(0, 0, 0, 0.1)' }}
                                    />
                                    <Area type="monotone" dataKey="score" stroke="#1E3A8A" strokeWidth={3} fillOpacity={1} fill="url(#colorScore)" />
                                </AreaChart>
                            </ResponsiveContainer>
                        </div>
                    </div>

                    {/* Records List */}
                    <div className="bg-white rounded-[2.5rem] shadow-premium border border-slate-100 overflow-hidden">
                        <div className="p-8 border-b border-slate-50">
                            <h3 className="text-xl font-bold text-slate-800">Recent Records</h3>
                        </div>
                        <div className="max-h-[400px] overflow-y-auto custom-scrollbar">
                            <table className="w-full text-left">
                                <thead className="bg-slate-50/50 sticky top-0 z-10">
                                    <tr>
                                        <th className="px-8 py-4 text-[10px] font-black text-slate-400 uppercase tracking-widest">Type</th>
                                        <th className="px-8 py-4 text-[10px] font-black text-slate-400 uppercase tracking-widest">Title</th>
                                        <th className="px-8 py-4 text-[10px] font-black text-slate-400 uppercase tracking-widest text-center">Score</th>
                                    </tr>
                                </thead>
                                <tbody className="divide-y divide-slate-50">
                                    {records.map((rec: any, i: number) => (
                                        <tr key={i} className="hover:bg-slate-50/50 transition-colors">
                                            <td className="px-8 py-4">
                                                <span className="px-3 py-1 bg-slate-100 text-[9px] font-black rounded-lg uppercase text-slate-500">
                                                    {rec.record_type}
                                                </span>
                                            </td>
                                            <td className="px-8 py-4 text-sm font-bold text-slate-700">{rec.title}</td>
                                            <td className="px-8 py-4 text-center">
                                                <span className={`font-black text-sm ${parseFloat(rec.score) >= 7 ? 'text-primary' : 'text-accent'}`}>
                                                    {rec.score}/{rec.max_score}
                                                </span>
                                            </td>
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                        </div>
                    </div>
                </div>

                {/* Sidebar Info */}
                <div className="space-y-8">
                    {/* Attendance Pie */}
                    <div className="bg-white p-8 rounded-[2.5rem] shadow-premium border border-slate-100 h-[380px] flex flex-col">
                        <h3 className="text-xl font-bold text-slate-800 mb-6 flex items-center gap-3">
                            <Calendar className="text-accent w-6 h-6" /> Attendance
                        </h3>
                        <div className="flex-1 min-h-0">
                            <ResponsiveContainer width="100%" height="100%">
                                <PieChart>
                                    <Pie
                                        data={attendance}
                                        innerRadius={60}
                                        outerRadius={90}
                                        paddingAngle={5}
                                        dataKey="count"
                                        nameKey="status"
                                    >
                                        {attendance.map((entry: any, index: number) => (
                                            <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                                        ))}
                                    </Pie>
                                    <Tooltip 
                                        contentStyle={{ borderRadius: '1rem', border: 'none', boxShadow: '0 10px 15px -3px rgba(0, 0, 0, 0.1)' }}
                                    />
                                    <Legend />
                                </PieChart>
                            </ResponsiveContainer>
                        </div>
                    </div>

                    {/* Reading Progress */}
                    <div className="bg-white p-8 rounded-[2.5rem] shadow-premium border border-slate-100">
                        <h3 className="text-xl font-bold text-slate-800 mb-6 flex items-center gap-3">
                            <BookOpen className="text-emerald-500 w-6 h-6" /> Library Access
                        </h3>
                        <div className="space-y-4">
                            {books.map((book: any, i: number) => (
                                <div key={i} className="flex items-center gap-4 p-4 bg-slate-50 rounded-2xl">
                                    <div className="w-10 h-12 bg-white rounded-lg shadow-sm flex items-center justify-center">
                                        <BookOpen size={20} className="text-slate-300" />
                                    </div>
                                    <div className="flex-1 min-w-0">
                                        <p className="text-sm font-bold text-slate-800 truncate">{book.title}</p>
                                        <p className={`text-[10px] font-black uppercase tracking-tight ${book.assignment_status === 'assigned' ? 'text-emerald-500' : 'text-slate-400'}`}>
                                            {book.assignment_status}
                                        </p>
                                    </div>
                                </div>
                            ))}
                        </div>
                    </div>

                    {/* Quick Stats */}
                    <div className="bg-primary p-8 rounded-[2.5rem] text-white shadow-xl shadow-primary/20 relative overflow-hidden">
                        <Clock className="absolute top-0 right-0 p-10 opacity-10 w-48 h-48 -mr-10 -mt-10" />
                        <h4 className="text-[10px] font-black uppercase tracking-[0.2em] opacity-60 mb-6">Learning Context</h4>
                        <div className="space-y-6 relative z-10">
                            <div className="flex justify-between items-center">
                                <span className="text-sm font-medium opacity-80">Level Completion</span>
                                <span className="text-lg font-black">78%</span>
                            </div>
                            <div className="flex justify-between items-center">
                                <span className="text-sm font-medium opacity-80">Next Exam</span>
                                <span className="text-lg font-black">Units 4-6</span>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
};

const Tag = ({ icon, label, color }: any) => (
    <div className={`flex items-center gap-1.5 px-3 py-1 rounded-full text-[10px] font-black uppercase ${color}`}>
        {icon}
        {label}
    </div>
);

const SummaryMetric = ({ label, value }: any) => (
    <div className="text-center md:text-left">
        <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1">{label}</p>
        <p className="text-2xl font-black text-slate-800 tracking-tighter leading-none">{value}</p>
    </div>
);

export default StudentReport;
