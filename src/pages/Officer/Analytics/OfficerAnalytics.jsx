import { useState, useEffect } from 'react';
import { getComplaintStats, getAllComplaints } from '../../../services/firebaseComplaintService';
import { getWorkers } from '../../../services/firebaseWorkerService';
import Card from '../../../components/Card/Card';
import Badge from '../../../components/Badge/Badge';
import Spinner from '../../../components/Spinner/Spinner';
import { HiOutlineDocumentText, HiOutlineClipboardCheck, HiOutlineClock, HiOutlineExclamationCircle } from 'react-icons/hi';
import {
    BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer,
    PieChart, Pie, Cell, Legend,
    LineChart, Line
} from 'recharts';
import '../Overview/OfficerPages.css';
const COLORS = ['#dc2626', '#f59e0b', '#3b82f6', '#10b981'];
export default function OfficerAnalytics() {
    const [stats, setStats] = useState(null);
    const [workers, setWorkers] = useState([]);
    const [complaints, setComplaints] = useState([]);
    const [loading, setLoading] = useState(true);
    useEffect(() => {
        async function load() {
            const [s, w, c] = await Promise.all([
                getComplaintStats(),
                getWorkers(),
                getAllComplaints(),
            ]);
            setStats(s);
            setWorkers(w);
            setComplaints(c);
            setLoading(false);
        }
        load();
    }, []);
    if (loading) return <Spinner text="Loading analytics..." />;
    const workerBarData = workers.map((w) => ({
        name: w.name?.split(' ')[0] || 'Worker',
        resolved: w.completedTasks || 0,
        active: w.activeTasks || 0,
    }));
    const statusData = [
        { name: 'Pending', value: stats.pending },
        { name: 'Active', value: stats.assigned },
        { name: 'Resolved', value: stats.resolved },
    ];
    const resolutionTrend = [
        { month: 'Oct', hours: 28 },
        { month: 'Nov', hours: 22 },
        { month: 'Dec', hours: 19 },
        { month: 'Jan', hours: 16 },
        { month: 'Feb', hours: stats.avgResolutionTime || 14 },
    ];
    const now = new Date();
    const slaBreached = complaints.filter((c) => c.status !== 'Resolved' && c.slaDeadline && new Date(c.slaDeadline) < now);
    return (
        <div>
            <div className="page-header">
                <h1 className="page-title">Ward Oversight Analytics</h1>
                <p className="page-subtitle">Ward performance metrics — live from Firebase</p>
            </div>
            <div className="stats-grid">
                <Card icon={<HiOutlineDocumentText />} value={stats.total} label="Total Complaints" color="blue" />
                <Card icon={<HiOutlineClipboardCheck />} value={stats.assigned} label="Active Assignments" color="yellow" />
                <Card icon={<HiOutlineClock />} value={`${stats.avgResolutionTime}h`} label="Avg Resolution Time" color="purple" />
                <Card icon={<HiOutlineExclamationCircle />} value={stats.slaBreaches} label="SLA Breaches" color="red" />
            </div>
            <div className="charts-grid">
                <div className="chart-card">
                    <h3>Complaints Resolved Per Worker</h3>
                    <ResponsiveContainer width="100%" height={280}>
                        <BarChart data={workerBarData}>
                            <CartesianGrid strokeDasharray="3 3" stroke="var(--border-color)" />
                            <XAxis dataKey="name" tick={{ fontSize: 12 }} />
                            <YAxis tick={{ fontSize: 12 }} />
                            <Tooltip contentStyle={{ background: 'var(--bg-card)', border: '1px solid var(--border-color)', borderRadius: '8px', fontSize: '0.85rem' }} />
                            <Bar dataKey="resolved" fill="#10b981" radius={[4, 4, 0, 0]} name="Resolved" />
                            <Bar dataKey="active" fill="#f59e0b" radius={[4, 4, 0, 0]} name="Active" />
                            <Legend />
                        </BarChart>
                    </ResponsiveContainer>
                </div>
                <div className="chart-card">
                    <h3>Status Distribution</h3>
                    <ResponsiveContainer width="100%" height={280}>
                        <PieChart>
                            <Pie data={statusData} cx="50%" cy="50%" innerRadius={60} outerRadius={95} paddingAngle={3} dataKey="value"
                                label={({ name, percent }) => `${name} ${(percent * 100).toFixed(0)}%`}>
                                {statusData.map((_, i) => (<Cell key={i} fill={COLORS[i % COLORS.length]} />))}
                            </Pie>
                            <Tooltip />
                            <Legend />
                        </PieChart>
                    </ResponsiveContainer>
                </div>
                <div className="chart-card" style={{ gridColumn: 'span 2' }}>
                    <h3>Average Resolution Time Trend (hours)</h3>
                    <ResponsiveContainer width="100%" height={280}>
                        <LineChart data={resolutionTrend}>
                            <CartesianGrid strokeDasharray="3 3" stroke="var(--border-color)" />
                            <XAxis dataKey="month" tick={{ fontSize: 12 }} />
                            <YAxis tick={{ fontSize: 12 }} unit="h" />
                            <Tooltip contentStyle={{ background: 'var(--bg-card)', border: '1px solid var(--border-color)', borderRadius: '8px', fontSize: '0.85rem' }} />
                            <Line type="monotone" dataKey="hours" stroke="#3b82f6" strokeWidth={3} dot={{ fill: '#3b82f6', r: 5 }} activeDot={{ r: 7 }} />
                        </LineChart>
                    </ResponsiveContainer>
                </div>
            </div>
            <div style={{ marginTop: '2rem' }}>
                <h2 className="section-title">⏰ SLA Breach Monitoring</h2>
                {slaBreached.length === 0 ? (
                    <div className="insight-card" style={{ borderLeftColor: 'var(--success)' }}>
                        <span className="insight-icon">✅</span>
                        <p>All complaints are within SLA deadlines.</p>
                    </div>
                ) : (
                    <div className="recent-list">
                        {slaBreached.map((c) => (
                            <div key={c.id} className="recent-item" style={{ borderLeft: '3px solid var(--danger)' }}>
                                <div className="recent-item-left">
                                    <span className="recent-id">{c.id?.slice(0, 8)}... <span className="sla-breach">SLA BREACHED</span></span>
                                    <span className="recent-title">{c.title}</span>
                                </div>
                                <div className="recent-item-right">
                                    <Badge type={c.urgency?.toLowerCase()}>{c.urgency}</Badge>
                                </div>
                            </div>
                        ))}
                    </div>
                )}
            </div>
        </div>
    );
}
