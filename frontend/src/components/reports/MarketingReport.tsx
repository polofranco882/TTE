import { useState, useEffect } from 'react';
import { 
    ResponsiveContainer, BarChart, Bar, XAxis, YAxis, CartesianGrid, 
    Tooltip, Legend, FunnelChart, Funnel, LabelList, Cell
} from 'recharts';
import { 
    Target, MousePointer2, Mail, Briefcase, 
    ArrowRight, TrendingUp, Filter, Share2 
} from 'lucide-react';
import PremiumLoader from '../PremiumLoader';

interface MarketingReportProps {
    token: string;
}

const COLORS = ['#1E3A8A', '#3B82F6', '#60A5FA', '#93C5FD', '#BFDBFE'];

const MarketingReport = ({ token }: MarketingReportProps) => {
    const [data, setData] = useState<any>(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);

    useEffect(() => {
        fetchData();
    }, [token]);

    const fetchData = async () => {
        try {
            const res = await fetch('/api/reports/v2/marketing', {
                headers: { 'Authorization': `Bearer ${token}` }
            });
            if (res.ok) {
                setData(await res.json());
                setError(null);
            } else {
                setError('Failed to load marketing analytics.');
            }
        } catch (err) {
            console.error('Fetch Marketing Report error:', err);
            setError('Connection error.');
        } finally {
            setLoading(false);
        }
    };

    if (loading) return <div className="h-96 flex items-center justify-center"><PremiumLoader size="lg" /></div>;

    if (error || !data) return (
        <div className="bg-indigo-50/50 p-10 rounded-[2rem] text-center border border-indigo-100 animate-in fade-in zoom-in duration-500">
            <h3 className="text-indigo-900 font-black text-2xl mb-2">Marketing Data Unavailable</h3>
            <p className="text-indigo-400 font-medium mb-6">We couldn't reach the growth metrics right now.</p>
            <button 
                onClick={() => { setLoading(true); fetchData(); }}
                className="bg-indigo-600 text-white px-8 py-3 rounded-2xl font-bold shadow-lg shadow-indigo-100 transition-all active:scale-95"
            >
                Retry Fetch
            </button>
        </div>
    );

    return (
        <div className="space-y-8 animate-in fade-in duration-700">
            {/* Header */}
            <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-6 bg-white p-8 rounded-[2.5rem] shadow-premium border border-slate-100">
                <div>
                    <h2 className="text-3xl font-black text-slate-800 tracking-tight">Growth & Funnel</h2>
                    <p className="text-slate-400 font-medium">Marketing reach and conversion performance.</p>
                </div>
                <div className="flex gap-3">
                    <div className="p-3 bg-indigo-50 text-indigo-600 rounded-2xl flex items-center gap-2 font-bold text-sm px-4">
                        <Share2 size={16} /> Link Tracking: Active
                    </div>
                </div>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
                {/* Conversion Funnel */}
                <div className="bg-white p-8 rounded-[2.5rem] shadow-premium border border-slate-100 h-[500px] flex flex-col">
                    <h3 className="text-xl font-bold text-slate-800 mb-6 flex items-center gap-3">
                        <Filter className="text-primary w-6 h-6" /> Enrollment Funnel
                    </h3>
                    <div className="flex-1 min-h-0">
                        <ResponsiveContainer width="100%" height="100%">
                            <FunnelChart>
                                <Tooltip 
                                    contentStyle={{ borderRadius: '1rem', border: 'none', boxShadow: '0 10px 15px -3px rgba(0, 0, 0, 0.1)' }}
                                />
                                <Funnel
                                    data={data.funnel || []}
                                    dataKey="count"
                                    nameKey="stage"
                                >
                                    {(data.funnel || []).map((entry: any, index: number) => (
                                        <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                                    ))}
                                    <LabelList position="right" fill="#475569" stroke="none" dataKey="stage" />
                                    <LabelList position="center" fill="#fff" stroke="none" dataKey="count" />
                                </Funnel>
                            </FunnelChart>
                        </ResponsiveContainer>
                    </div>
                    <div className="mt-4 p-4 bg-slate-50 rounded-2xl">
                        <p className="text-xs text-slate-500 font-medium text-center">
                            Lead-to-Student Conversion Rate: 
                            <span className="font-black text-primary ml-1">
                                {data.funnel && data.funnel[0]?.count > 0 
                                    ? ((data.funnel[2]?.count / data.funnel[0]?.count) * 100).toFixed(1) 
                                    : '0.0'}%
                            </span>
                        </p>
                    </div>
                </div>

                {/* KPI Cards / Recent activity */}
                <div className="space-y-6">
                    <div className="grid grid-cols-2 gap-4">
                        <StatCard 
                            label="Total Leads" 
                            value={data.funnel?.[0]?.count || 0} 
                            icon={<Target />} 
                            sub="Captured contacts" 
                        />
                        <StatCard 
                            label="Conversion" 
                            value={`${(data.funnel && data.funnel[0]?.count > 0 ? (data.funnel[2]?.count / data.funnel[0]?.count) * 100 : 0).toFixed(1)}%`} 
                            icon={<MousePointer2 />} 
                            sub="Enrollment velocity" 
                            color="bg-emerald-500"
                        />
                    </div>

                    <div className="bg-white p-8 rounded-[2.5rem] shadow-premium border border-slate-100 flex-1">
                        <h3 className="text-xl font-bold text-slate-800 mb-6 flex items-center justify-between">
                            <span className="flex items-center gap-3"><Mail className="text-indigo-500 w-6 h-6" /> Recent Campaigns</span>
                            <button className="text-xs font-black text-primary uppercase tracking-widest hover:underline">View All</button>
                        </h3>
                        <div className="space-y-4">
                            {(data.campaigns || []).map((camp: any, idx: number) => (
                                <div key={idx} className="flex items-center justify-between p-4 bg-slate-50 rounded-2xl hover:bg-slate-100 transition-all group">
                                    <div className="flex items-center gap-4">
                                        <div className="w-10 h-10 bg-white rounded-xl shadow-sm flex items-center justify-center">
                                            <Briefcase size={20} className="text-slate-400 group-hover:text-primary transition-colors" />
                                        </div>
                                        <div>
                                            <p className="font-bold text-slate-800 text-sm">{camp.name}</p>
                                            <p className="text-[10px] text-slate-400 font-medium">Sent to {camp.sent_count} contacts</p>
                                        </div>
                                    </div>
                                    <div className="flex gap-4 text-right">
                                        <div>
                                            <p className="text-xs font-black text-slate-700">{(camp.actual_sent > 0 ? (camp.opens / camp.actual_sent) * 100 : 0).toFixed(1)}%</p>
                                            <p className="text-[9px] font-bold text-slate-400 uppercase">Opens</p>
                                        </div>
                                        <div>
                                            <p className="text-xs font-black text-slate-700">{(camp.opens > 0 ? (camp.clicks / camp.opens) * 100 : 0).toFixed(1)}%</p>
                                            <p className="text-[9px] font-bold text-slate-400 uppercase">CTR</p>
                                        </div>
                                    </div>
                                </div>
                            ))}
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
};

const StatCard = ({ label, value, icon, sub, color = 'bg-primary' }: any) => (
    <div className="bg-white p-6 rounded-[2rem] border border-slate-100 shadow-sm relative overflow-hidden group">
        <div className={`absolute top-0 right-0 p-8 opacity-[0.03] group-hover:opacity-[0.08] transition-opacity`}>
            {icon}
        </div>
        <div className={`w-12 h-12 ${color} text-white rounded-2xl flex items-center justify-center shadow-lg mb-4`}>
            {icon}
        </div>
        <h4 className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1">{label}</h4>
        <div className="text-2xl font-black text-slate-800">{value}</div>
        <p className="text-[10px] text-slate-400 font-medium mt-1">{sub}</p>
    </div>
);

export default MarketingReport;
