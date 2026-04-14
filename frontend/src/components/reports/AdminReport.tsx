import { useState, useEffect } from 'react';
import { 
    ResponsiveContainer, PieChart, Pie, Cell, Tooltip, 
    BarChart, Bar, XAxis, YAxis, CartesianGrid, Legend,
    LineChart, Line, AreaChart, Area
} from 'recharts';
import { TrendingUp, Users, BookOpen, Target, Download, FileSpreadsheet, FileText } from 'lucide-react';
import PremiumLoader from '../PremiumLoader';
import { exportMultiSheetExcel, exportToPDF } from '../../utils/ReportExporter';

interface AdminReportProps {
    token: string;
}

const COLORS = ['#1E3A8A', '#EF4444', '#10B981', '#F59E0B', '#8B5CF6'];

const AdminReport = ({ token }: AdminReportProps) => {
    const [data, setData] = useState<any>(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);

    useEffect(() => {
        fetchData();
    }, [token]);

    const fetchData = async () => {
        try {
            const res = await fetch('/api/reports/v2/admin', {
                headers: { 'Authorization': `Bearer ${token}` }
            });
            if (res.ok) {
                setData(await res.json());
                setError(null);
            } else {
                setError('Failed to load global report. Server returned ' + res.status);
            }
        } catch (err) {
            console.error('Fetch Admin Report error:', err);
            setError('Connection error while fetching report.');
        } finally {
            setLoading(false);
        }
    };

    const handleExportExcel = () => {
        if (!data) return;
        const sheets = [
            { data: data.userDistribution, name: 'User Distribution' },
            { data: data.topBooks, name: 'Top Books' },
            { data: data.growth, name: 'Growth' }
        ];
        exportMultiSheetExcel(sheets, 'Administrator_Global_Report');
    };

    if (loading) return <div className="h-96 flex items-center justify-center"><PremiumLoader size="lg" /></div>;

    if (error || !data) return (
        <div className="bg-red-50 p-10 rounded-[2rem] text-center border border-red-100 animate-in fade-in zoom-in duration-500">
            <h3 className="text-red-900 font-black text-2xl mb-2">Oops! Analytics Offline</h3>
            <p className="text-red-600 font-medium mb-6">{error || 'Unable to retrieve dashboard data.'}</p>
            <button 
                onClick={() => { setLoading(true); fetchData(); }}
                className="bg-red-600 text-white px-8 py-3 rounded-2xl font-bold shadow-lg shadow-red-200 hover:bg-red-700 transition-all active:scale-95"
            >
                Try Again
            </button>
        </div>
    );

    return (
        <div className="space-y-8 animate-in fade-in duration-700">
            {/* Header / Actions */}
            <div className="flex justify-between items-center bg-white p-6 rounded-[2rem] shadow-premium border border-slate-100">
                <div>
                    <h2 className="text-3xl font-black text-slate-800 tracking-tight">Institutional Overview</h2>
                    <p className="text-slate-400 font-medium">Global KPIs and strategic institution performance.</p>
                </div>
                <div className="flex gap-3">
                    <button 
                        onClick={handleExportExcel}
                        className="flex items-center gap-2 px-6 py-3 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-2xl font-bold transition-all active:scale-95"
                    >
                        <FileSpreadsheet size={18} className="text-emerald-600" />
                        Excel
                    </button>
                    <button 
                        onClick={() => exportToPDF('TTE_Institutional_Report')}
                        className="flex items-center gap-2 px-6 py-3 bg-primary text-white rounded-2xl font-bold shadow-lg shadow-primary/20 hover:scale-105 transition-all active:scale-95"
                    >
                        <FileText size={18} />
                        PDF Report
                    </button>
                </div>
            </div>

            {/* Top Cards */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
                <KPICard 
                    title="Total Leads" 
                    value={data.marketing?.total_leads || 0} 
                    icon={<Target className="text-accent" />} 
                    trend="+12%" 
                    subtitle="Last 30 days"
                />
                <KPICard 
                    title="Enrolled Students" 
                    value={data.marketing?.total_students || 0} 
                    icon={<Users className="text-primary" />} 
                    trend="+5.4%" 
                    subtitle="Retention: 94%"
                />
                <KPICard 
                    title="Avg. Academic Success" 
                    value={`${(data.academic?.averageGrade || 0).toFixed(1)}/10`} 
                    icon={<BookOpen className="text-emerald-500" />} 
                    trend="Stable" 
                    subtitle="Global grade average"
                />
                <KPICard 
                    title="Active Campaigns" 
                    value={data.marketing?.total_campaigns || 0} 
                    icon={<TrendingUp className="text-indigo-500" />} 
                    trend="Live" 
                    subtitle="Marketing reach"
                />
            </div>

            {/* Charts Grid */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
                {/* User Distribution Pie */}
                <div className="bg-white p-8 rounded-[2.5rem] shadow-premium border border-slate-100 h-[450px] flex flex-col">
                    <h3 className="text-xl font-bold text-slate-800 mb-6 flex items-center gap-3">
                        <Users className="text-primary w-6 h-6" /> User Ecosystem
                    </h3>
                    <div className="flex-1 min-h-0">
                        <ResponsiveContainer width="100%" height="100%">
                            <PieChart>
                                <Pie
                                    data={data.userDistribution || []}
                                    cx="50%" cy="50%"
                                    innerRadius={80}
                                    outerRadius={120}
                                    paddingAngle={5}
                                    dataKey="value"
                                    nameKey="name"
                                    label
                                >
                                    {(data.userDistribution || []).map((entry: any, index: number) => (
                                        <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                                    ))}
                                </Pie>
                                <Tooltip 
                                    contentStyle={{ borderRadius: '1rem', border: 'none', boxShadow: '0 10px 25px -5px rgba(0,0,0,0.1)' }}
                                />
                                <Legend verticalAlign="bottom" height={36}/>
                            </PieChart>
                        </ResponsiveContainer>
                    </div>
                </div>

                {/* User Growth Area Chart */}
                <div className="bg-white p-8 rounded-[2.5rem] shadow-premium border border-slate-100 h-[450px] flex flex-col">
                    <h3 className="text-xl font-bold text-slate-800 mb-6 flex items-center gap-3">
                        <TrendingUp className="text-accent w-6 h-6" /> Growth Velocity
                    </h3>
                    <div className="flex-1 min-h-0">
                        <ResponsiveContainer width="100%" height="100%">
                            <AreaChart data={data.growth || []}>
                                <defs>
                                    <linearGradient id="colorGrowth" x1="0" y1="0" x2="0" y2="1">
                                        <stop offset="5%" stopColor="#EF4444" stopOpacity={0.3}/>
                                        <stop offset="95%" stopColor="#EF4444" stopOpacity={0}/>
                                    </linearGradient>
                                </defs>
                                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#E2E8F0" />
                                <XAxis dataKey="month" axisLine={false} tickLine={false} tick={{fill: '#94A3B8', fontSize: 12}} dy={10} />
                                <YAxis axisLine={false} tickLine={false} tick={{fill: '#94A3B8', fontSize: 12}} />
                                <Tooltip 
                                    contentStyle={{ borderRadius: '1rem', border: 'none', boxShadow: '0 10px 15px -3px rgba(0, 0, 0, 0.1)' }}
                                />
                                <Area type="monotone" dataKey="count" stroke="#EF4444" strokeWidth={4} fillOpacity={1} fill="url(#colorGrowth)" />
                            </AreaChart>
                        </ResponsiveContainer>
                    </div>
                </div>

                {/* Top Books Bar Chart */}
                <div className="lg:col-span-2 bg-white p-8 rounded-[2.5rem] shadow-premium border border-slate-100 h-[400px]">
                    <h3 className="text-xl font-bold text-slate-800 mb-6 flex items-center gap-3">
                        <BookOpen className="text-indigo-500 w-6 h-6" /> Most Popular Educational Resources
                    </h3>
                    <ResponsiveContainer width="100%" height={280}>
                        <BarChart data={data.topBooks || []} layout="vertical">
                            <CartesianGrid strokeDasharray="3 3" horizontal={false} stroke="#E2E8F0" />
                            <XAxis type="number" hide />
                            <YAxis dataKey="title" type="category" width={150} axisLine={false} tickLine={false} tick={{fill: '#475569', fontWeight: 'bold', fontSize: 11}} />
                            <Tooltip 
                                cursor={{fill: 'transparent'}}
                                contentStyle={{ borderRadius: '1rem', border: 'none', boxShadow: '0 10px 15px -3px rgba(0, 0, 0, 0.1)' }}
                            />
                            <Bar dataKey="readers" fill="#1E3A8A" radius={[0, 10, 10, 0]} barSize={30} />
                        </BarChart>
                    </ResponsiveContainer>
                </div>
            </div>
        </div>
    );
};

const KPICard = ({ title, value, icon, trend, subtitle }: any) => (
    <div className="bg-white p-6 rounded-[2rem] shadow-sm border border-slate-100 hover:shadow-premium transition-all group">
        <div className="flex justify-between items-start mb-4">
            <div className="p-3 bg-slate-50 group-hover:bg-primary/5 rounded-2xl transition-colors">
                {icon}
            </div>
            <span className={`text-[10px] font-black px-2 py-1 rounded-lg ${trend.includes('+') ? 'bg-emerald-50 text-emerald-600' : 'bg-slate-50 text-slate-500'}`}>
                {trend}
            </span>
        </div>
        <h4 className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1">{title}</h4>
        <div className="text-3xl font-black text-slate-800">{value}</div>
        <p className="text-[10px] text-slate-400 mt-2 font-medium">{subtitle}</p>
    </div>
);

export default AdminReport;
