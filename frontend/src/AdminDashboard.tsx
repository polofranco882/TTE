import { useEffect, useState } from 'react';
import { motion } from 'framer-motion';
import {
    BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer,
    PieChart, Pie, Cell
} from 'recharts';
import { Users, BookOpen, Activity, TrendingUp, AlertCircle } from 'lucide-react';
import { type NotificationType } from './components/Notification';
import PremiumLoader from './components/PremiumLoader';
import { useTranslation } from 'react-i18next';

interface BookStat {
    name: string;
    completed: number;
    active: number;
    total: number;
}

interface KPI {
    totalUsers: number;
    totalAssignments: number;
    activeUsers24h: number;
    statusDistribution: { name: string; value: number }[];
    bookStats: BookStat[];
}

const COLORS = ['#b7672a', '#50677c', '#FFBB28', '#FF8042'];

const AdminDashboard = ({ token, onNotify, onUnauthorized }: { token: string; onNotify: (msg: string, type: NotificationType) => void; onUnauthorized: () => void }) => {
    const { t } = useTranslation();
    const [data, setData] = useState<KPI | null>(null);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        fetch('/api/reports/kpi', {
            headers: { Authorization: `Bearer ${token} ` }
        })
            .then(res => {
                if (res.status === 401) {
                    onUnauthorized();
                    throw new Error('Unauthorized');
                }
                return res.json();
            })
            .then(data => {
                setData(data);
                setLoading(false);
            })
            .catch(err => {
                if (err.message !== 'Unauthorized') {
                    console.error(err);
                    onNotify('Failed to load dashboard metrics', 'error');
                }
                setLoading(false);
            });
    }, [token]);

    if (loading) return (
        <div className="flex flex-col items-center justify-center p-20 space-y-4">
            <PremiumLoader size="md" />
            <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest animate-pulse">
                {t('dashboard.admin.loading', 'Compiling Metrics...')}
            </p>
        </div>
    );
    if (!data) return <div className="text-center p-10 text-red-500">Failed to load data</div>;

    return (
        <div className="space-y-8">
            {/* Header */}
            <motion.div
                initial={{ opacity: 0, y: -20 }}
                animate={{ opacity: 1, y: 0 }}
                className="mb-8"
            >
                <h1 className="text-4xl font-serif font-bold text-primary tracking-tight">{t('dashboard.admin.title', 'Executive Dashboard')}</h1>
                <p className="text-secondary mt-2">{t('dashboard.admin.subtitle', 'Real-time insights on user engagement and reading progress.')}</p>
            </motion.div>

            {/* KPI Cards */}
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 md:gap-6">
                <KPICard
                    title={t('dashboard.kpi.totalUsers', 'Total Users')}
                    value={data.totalUsers}
                    icon={<Users className="w-6 h-6 text-white" />}
                    color="bg-primary"
                    delay={0.1}
                />
                <KPICard
                    title={t('dashboard.kpi.activeReaders', 'Active Readers (24h)')}
                    value={data.activeUsers24h}
                    icon={<Activity className="w-6 h-6 text-white" />}
                    color="bg-accent"
                    delay={0.2}
                />
                <KPICard
                    title={t('dashboard.kpi.totalAssignments', 'Total Assignments')}
                    value={data.totalAssignments}
                    icon={<BookOpen className="w-6 h-6 text-white" />}
                    color="bg-secondary"
                    delay={0.3}
                />
            </div>

            {/* Charts Row 1 */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
                {/* Reading Progress Bar Chart */}
                <motion.div
                    initial={{ opacity: 0, scale: 0.95 }}
                    animate={{ opacity: 1, scale: 1 }}
                    transition={{ delay: 0.4 }}
                    className="bg-surface p-6 rounded-2xl shadow-premium border border-black/5"
                >
                    <h3 className="text-xl font-serif font-bold text-primary mb-6 flex items-center gap-2">
                        <TrendingUp className="w-5 h-5 text-accent flex-shrink-0" />
                        <span className="truncate">{t('dashboard.charts.completionRates', 'Book Completion Rates')}</span>
                    </h3>
                    <div className="h-[250px] sm:h-[300px] w-full">
                        <ResponsiveContainer width="100%" height="100%">
                            <BarChart data={data.bookStats}>
                                <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
                                <XAxis dataKey="name" tick={{ fontSize: 10 }} angle={-45} textAnchor="end" height={60} />
                                <YAxis />
                                <Tooltip
                                    contentStyle={{ borderRadius: '12px', border: 'none', boxShadow: '0 4px 12px rgba(0,0,0,0.1)' }}
                                    cursor={{ fill: 'rgba(183, 103, 42, 0.1)' }}
                                />
                                <Legend wrapperStyle={{ fontSize: '12px', paddingTop: '10px' }} />
                                <Bar dataKey="completed" name="Completed" stackId="a" fill="#161930" radius={[0, 0, 4, 4]} />
                                <Bar dataKey="active" name="In Progress" stackId="a" fill="#b7672a" radius={[4, 4, 0, 0]} />
                            </BarChart>
                        </ResponsiveContainer>
                    </div>
                </motion.div>

                {/* Status Distribution Pie Chart */}
                <motion.div
                    initial={{ opacity: 0, scale: 0.95 }}
                    animate={{ opacity: 1, scale: 1 }}
                    transition={{ delay: 0.5 }}
                    className="bg-surface p-6 rounded-2xl shadow-premium border border-black/5"
                >
                    <h3 className="text-xl font-serif font-bold text-primary mb-6 flex items-center gap-2">
                        <AlertCircle className="w-5 h-5 text-secondary" />
                        {t('dashboard.charts.assignmentStatus', 'Overall Assignment Status')}
                    </h3>
                    <div className="h-[300px] w-full flex justify-center items-center">
                        <ResponsiveContainer width="100%" height="100%">
                            <PieChart>
                                <Pie
                                    data={data.statusDistribution}
                                    cx="50%"
                                    cy="50%"
                                    innerRadius={60}
                                    outerRadius={100}
                                    paddingAngle={5}
                                    dataKey="value"
                                >
                                    {data.statusDistribution.map((_, index) => (
                                        <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                                    ))}
                                </Pie>
                                <Tooltip />
                                <Legend />
                            </PieChart>
                        </ResponsiveContainer>
                    </div>
                </motion.div>
            </div>
        </div>
    );
};

interface KPICardProps {
    title: string;
    value: number;
    icon: React.ReactNode;
    color: string;
    delay: number;
}

const KPICard = ({ title, value, icon, color, delay }: KPICardProps) => (
    <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay }}
        className="bg-surface p-6 rounded-2xl shadow-premium hover:shadow-premium-hover transition-all duration-300 border border-black/5 relative overflow-hidden group"
    >
        <div className={`absolute top-0 right-0 p-4 opacity-5 group-hover:opacity-10 transition-opacity`}>
            <div className={`p-16 rounded-full ${color}`}></div>
        </div>

        <div className="flex items-center gap-5">
            <div className={`${color} p-4 rounded-xl shadow-lg shadow-black/5`}>
                {icon}
            </div>
            <div>
                <p className="text-gray-500 text-xs font-bold uppercase tracking-wider">{title}</p>
                <h4 className="text-3xl font-serif font-bold text-primary mt-1">{value}</h4>
            </div>
        </div>
    </motion.div>
);

export default AdminDashboard;
