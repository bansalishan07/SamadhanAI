import { useState, useEffect } from 'react';
import { getComplaintStats, getAllComplaints } from '../../../services/firebaseComplaintService';
import { getDuplicateStats } from '../../../services/duplicateDetectionService';
import { getWorkers } from '../../../services/firebaseWorkerService';
import Card from '../../../components/Card/Card';
import Badge from '../../../components/Badge/Badge';
import Table from '../../../components/Table/Table';
import Spinner from '../../../components/Spinner/Spinner';
import { formatDate } from '../../../utils/helpers';
import { HiOutlineDocumentText, HiOutlineClock, HiOutlineCheckCircle, HiOutlineExclamation } from 'react-icons/hi';
import {
    BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer,
    PieChart, Pie, Cell, Legend,
    LineChart, Line
} from 'recharts';
import '../../Admin/Dashboard/AdminDashboard.css';

const COLORS = ['#dc2626', '#f59e0b', '#3b82f6', '#10b981'];

export default function OfficerOverview() {
    const [stats, setStats] = useState(null);
    const [complaints, setComplaints] = useState([]);
    const [workers, setWorkers] = useState([]);
    const [dupStats, setDupStats] = useState(null);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        async function load() {
            const [s, c, w] = await Promise.all([getComplaintStats(), getAllComplaints(), getWorkers()]);
            setStats(s);
            setComplaints(c);
            setWorkers(w);
            setDupStats(getDuplicateStats(c));
            setLoading(false);
        }
        load();
    }, []);

    if (loading) return <Spinner text="Loading analytics..." />;

    const categoryData = complaints.reduce((acc, c) => {
        if (!c.category) return acc;
        const existing = acc.find((x) => x.name === c.category);
        if (existing) existing.count++;
        else acc.push({ name: c.category, count: 1 });
        return acc;
    }, []).sort((a, b) => b.count - a.count).slice(0, 8);

    const statusData = [
        { name: 'Pending', value: stats.pending },
        { name: 'In Progress', value: stats.assigned },
        { name: 'Resolved', value: stats.resolved },
    ];

    const monthlyData = [
        { month: 'Oct', complaints: 12 },
        { month: 'Nov', complaints: 18 },
        { month: 'Dec', complaints: 15 },
        { month: 'Jan', complaints: 22 },
        { month: 'Feb', complaints: stats.total },
    ];

    const columns = [
        { key: 'id', label: 'ID' },
        { key: 'title', label: 'Title' },
        { key: 'category', label: 'Category' },
        { key: 'urgency', label: 'Urgency' },
        { key: 'status', label: 'Status' },
        { key: 'date', label: 'Date' },
    ];

    return (
        <div>
            <div className="page-header">
                <h1 className="page-title">Ward Supervisor Dashboard</h1>
                <p className="page-subtitle">System-wide analytics — live from Firebase</p>
            </div>
            <div className="stats-grid">
                <Card icon={<HiOutlineDocumentText />} value={stats.total} label="Total Complaints" color="blue" />
                <Card icon={<HiOutlineClock />} value={stats.pending} label="Pending" color="yellow" />
                <Card icon={<HiOutlineCheckCircle />} value={stats.resolved} label="Resolved" color="green" />
                <Card icon={<HiOutlineExclamation />} value={stats.highPriority} label="High Priority" color="red" />
            </div>
            <h2 className="section-title">Analytics</h2>
            <div className="charts-grid">
                <div className="chart-card">
                    <h3>Complaints by Category</h3>
                    <ResponsiveContainer width="100%" height={280}>
                        {categoryData.length > 0 ? (
                            <BarChart data={categoryData}>
                                <CartesianGrid strokeDasharray="3 3" stroke="var(--border-color)" />
                                <XAxis dataKey="name" tick={{ fontSize: 11 }} angle={-20} textAnchor="end" height={60} />
                                <YAxis tick={{ fontSize: 12 }} />
                                <Tooltip contentStyle={{ background: 'var(--bg-card)', border: '1px solid var(--border-color)', borderRadius: '8px', fontSize: '0.85rem' }} />
                                <Bar dataKey="count" fill="#3b82f6" radius={[4, 4, 0, 0]} />
                            </BarChart>
                        ) : <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', height: '100%', color: 'var(--text-tertiary)' }}>No data yet</div>}
                    </ResponsiveContainer>
                </div>
                <div className="chart-card">
                    <h3>Status Distribution</h3>
                    <ResponsiveContainer width="100%" height={280}>
                        <PieChart>
                            <Pie data={statusData} cx="50%" cy="50%" innerRadius={60} outerRadius={100} paddingAngle={3} dataKey="value"
                                label={({ name, percent }) => `${name} ${(percent * 100).toFixed(0)}%`}>
                                {statusData.map((_, i) => (<Cell key={i} fill={COLORS[i % COLORS.length]} />))}
                            </Pie>
                            <Tooltip />
                            <Legend />
                        </PieChart>
                    </ResponsiveContainer>
                </div>
                <div className="chart-card" style={{ gridColumn: 'span 2' }}>
                    <h3>Monthly Complaint Trends</h3>
                    <ResponsiveContainer width="100%" height={280}>
                        <LineChart data={monthlyData}>
                            <CartesianGrid strokeDasharray="3 3" stroke="var(--border-color)" />
                            <XAxis dataKey="month" tick={{ fontSize: 12 }} />
                            <YAxis tick={{ fontSize: 12 }} />
                            <Tooltip contentStyle={{ background: 'var(--bg-card)', border: '1px solid var(--border-color)', borderRadius: '8px', fontSize: '0.85rem' }} />
                            <Line type="monotone" dataKey="complaints" stroke="#3b82f6" strokeWidth={3} dot={{ fill: '#3b82f6', r: 5 }} activeDot={{ r: 7 }} />
                        </LineChart>
                    </ResponsiveContainer>
                </div>
            </div>
            { }
            {dupStats && (
                <>
                    <h2 className="section-title" style={{ marginTop: '2rem' }}>🤖 AI Duplicate Detection</h2>
                    <div className="stats-grid">
                        <Card icon={<HiOutlineDocumentText />} value={dupStats.totalDuplicates} label="Duplicates Detected" color="yellow" />
                        <Card icon={<HiOutlineClock />} value={`${dupStats.workloadReduced.toFixed(1)}h`} label="Audit Hours Saved" color="green" />
                        <Card icon={<HiOutlineExclamation />} value={dupStats.topCategories?.[0]?.category || 'N/A'} label="Most Repeated Issue" color="red" />
                        <Card icon={<HiOutlineCheckCircle />} value={dupStats.topAreas?.[0]?.area || 'N/A'} label="Most Duplicate Area" color="blue" />
                    </div>
                    {dupStats.topCategories.length > 0 && (
                        <div className="charts-grid" style={{ marginTop: '1rem' }}>
                            <div className="chart-card">
                                <h3>Top Repeated Categories</h3>
                                <ResponsiveContainer width="100%" height={220}>
                                    <BarChart data={dupStats.topCategories}>
                                        <CartesianGrid strokeDasharray="3 3" stroke="var(--border-color)" />
                                        <XAxis dataKey="category" tick={{ fontSize: 11 }} />
                                        <YAxis tick={{ fontSize: 12 }} />
                                        <Tooltip />
                                        <Bar dataKey="count" fill="#f59e0b" radius={[4, 4, 0, 0]} />
                                    </BarChart>
                                </ResponsiveContainer>
                            </div>
                            <div className="chart-card">
                                <h3>Areas with Most Duplicates</h3>
                                <ResponsiveContainer width="100%" height={220}>
                                    <BarChart data={dupStats.topAreas}>
                                        <CartesianGrid strokeDasharray="3 3" stroke="var(--border-color)" />
                                        <XAxis dataKey="area" tick={{ fontSize: 11 }} />
                                        <YAxis tick={{ fontSize: 12 }} />
                                        <Tooltip />
                                        <Bar dataKey="count" fill="#ef4444" radius={[4, 4, 0, 0]} />
                                    </BarChart>
                                </ResponsiveContainer>
                            </div>
                        </div>
                    )}
                </>
            )}
            { }
            {workers.length > 0 && (
                <>
                    <h2 className="section-title" style={{ marginTop: '2rem' }}>🤖 Workforce Optimization Engine</h2>
                    <div className="stats-grid">
                        <Card icon={<HiOutlineCheckCircle />}
                            value={workers.filter(w => w.status === 'Active').length}
                            label="Active Workers" color="green" />
                        <Card icon={<HiOutlineExclamation />}
                            value={workers.filter(w => w.status === 'Overloaded').length}
                            label="Overloaded Workers" color="red" />
                        <Card icon={<HiOutlineClock />}
                            value={`${Math.round(workers.reduce((a, w) => a + (w.avgResolutionTime || 0), 0) / workers.length)}h`}
                            label="Avg Resolution Time" color="purple" />
                        <Card icon={<HiOutlineDocumentText />}
                            value={`${complaints.filter(c => c.assignedWorker).length}/${complaints.length}`}
                            label="Auto-Assigned" color="blue" />
                    </div>
                    <div className="charts-grid">
                        <div className="chart-card">
                            <h3>Worker Workload Distribution</h3>
                            <ResponsiveContainer width="100%" height={280}>
                                <BarChart data={workers.map(w => ({
                                    name: w.name?.split(' ')[0] || 'Worker',
                                    active: w.activeTasks || 0,
                                    completed: w.completedTasks || 0,
                                }))} layout="vertical">
                                    <CartesianGrid strokeDasharray="3 3" stroke="var(--border-color)" />
                                    <XAxis type="number" tick={{ fontSize: 12 }} />
                                    <YAxis dataKey="name" type="category" tick={{ fontSize: 11 }} width={80} />
                                    <Tooltip contentStyle={{ background: 'var(--bg-card)', border: '1px solid var(--border-color)', borderRadius: '8px', fontSize: '0.85rem' }} />
                                    <Bar dataKey="active" fill="#f59e0b" name="Active Tasks" radius={[0, 4, 4, 0]} />
                                    <Bar dataKey="completed" fill="#10b981" name="Completed" radius={[0, 4, 4, 0]} />
                                    <Legend />
                                </BarChart>
                            </ResponsiveContainer>
                        </div>
                        <div className="chart-card">
                            <h3>Response Time by Worker (hours)</h3>
                            <ResponsiveContainer width="100%" height={280}>
                                <BarChart data={workers.map(w => ({
                                    name: w.name?.split(' ')[0] || 'Worker',
                                    hours: w.avgResolutionTime || 0,
                                }))}>
                                    <CartesianGrid strokeDasharray="3 3" stroke="var(--border-color)" />
                                    <XAxis dataKey="name" tick={{ fontSize: 11 }} />
                                    <YAxis tick={{ fontSize: 12 }} unit="h" />
                                    <Tooltip contentStyle={{ background: 'var(--bg-card)', border: '1px solid var(--border-color)', borderRadius: '8px', fontSize: '0.85rem' }} />
                                    <Bar dataKey="hours" fill="#3b82f6" radius={[4, 4, 0, 0]} name="Avg Hours" />
                                </BarChart>
                            </ResponsiveContainer>
                        </div>
                    </div>
                    { }
                    <div className="chart-card" style={{ marginTop: '1rem' }}>
                        <h3>Worker Assignment Status</h3>
                        <table style={{ width: '100%', fontSize: '0.85rem', borderCollapse: 'collapse', marginTop: '0.5rem' }}>
                            <thead>
                                <tr style={{ borderBottom: '1px solid var(--border-color)', textAlign: 'left' }}>
                                    <th style={{ padding: '0.5rem' }}>Worker</th>
                                    <th style={{ padding: '0.5rem' }}>Role</th>
                                    <th style={{ padding: '0.5rem' }}>Department</th>
                                    <th style={{ padding: '0.5rem' }}>Active</th>
                                    <th style={{ padding: '0.5rem' }}>Completed</th>
                                    <th style={{ padding: '0.5rem' }}>Level</th>
                                    <th style={{ padding: '0.5rem' }}>Status</th>
                                </tr>
                            </thead>
                            <tbody>
                                {workers.map(w => (
                                    <tr key={w.id} style={{ borderBottom: '1px solid var(--border-color)' }}>
                                        <td style={{ padding: '0.5rem', fontWeight: 500 }}>{w.name}</td>
                                        <td style={{ padding: '0.5rem' }}>{w.role}</td>
                                        <td style={{ padding: '0.5rem', fontSize: '0.8rem' }}>{w.department}</td>
                                        <td style={{ padding: '0.5rem', fontWeight: 600 }}>{w.activeTasks || 0}</td>
                                        <td style={{ padding: '0.5rem' }}>{w.completedTasks || 0}</td>
                                        <td style={{ padding: '0.5rem' }}>
                                            <Badge type={w.skillLevel === 'Senior' ? 'high' : w.skillLevel === 'Mid' ? 'medium' : 'low'}>
                                                {w.skillLevel || 'Mid'}
                                            </Badge>
                                        </td>
                                        <td style={{ padding: '0.5rem' }}>
                                            <Badge type={w.status === 'Active' ? 'resolved' : 'high'}>
                                                {w.status}
                                            </Badge>
                                        </td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>
                </>
            )}
            <h2 className="section-title" style={{ marginTop: '2rem' }}>All Complaints</h2>
            <Table columns={columns} data={complaints.slice(0, 15)} emptyMessage="No complaints in the system yet"
                renderRow={(c) => (
                    <tr key={c.id}>
                        <td><strong style={{ fontSize: '0.75rem', fontFamily: 'monospace' }}>{c.id?.slice(0, 10)}...</strong></td>
                        <td>{c.title}</td>
                        <td>{c.category}</td>
                        <td><Badge type={c.urgency?.toLowerCase()}>{c.urgency}</Badge></td>
                        <td><Badge type={c.status?.toLowerCase().replace(/\s/g, '')}>{c.status}</Badge></td>
                        <td>{formatDate(c.createdAt)}</td>
                    </tr>
                )}
            />
        </div>
    );
}
