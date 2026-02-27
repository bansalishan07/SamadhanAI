import { useState, useEffect, useMemo } from 'react';
import { getAllComplaints } from '../../../services/firebaseComplaintService';
import { getWorkers } from '../../../services/firebaseWorkerService';
import { computeWardAnalytics, computeDistrictOverview, computeEscalationTrend } from '../../../services/wardAnalyticsService';
import Card from '../../../components/Card/Card';
import Badge from '../../../components/Badge/Badge';
import Spinner from '../../../components/Spinner/Spinner';
import {
    HiOutlineDocumentText, HiOutlineClock, HiOutlineCheckCircle,
    HiOutlineExclamation, HiOutlineExclamationCircle, HiOutlineTrendingUp,
    HiOutlineShieldCheck, HiOutlineLightningBolt
} from 'react-icons/hi';
import {
    BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer,
    PieChart, Pie, Cell, Legend, LineChart, Line, Area, AreaChart
} from 'recharts';
import './AdminDashboard.css';

const COLORS = ['#3b82f6', '#10b981', '#f59e0b', '#ef4444', '#8b5cf6', '#ec4899', '#06b6d4', '#f97316'];

export default function AdminDashboard() {
    const [complaints, setComplaints] = useState([]);
    const [loading, setLoading] = useState(true);
    const [sortBy, setSortBy] = useState('performanceScore');
    const [sortDir, setSortDir] = useState('asc');

    useEffect(() => {
        async function load() {
            const c = await getAllComplaints();
            setComplaints(c);
            setLoading(false);
        }
        load();
    }, []);

    const overview = useMemo(() => computeDistrictOverview(complaints), [complaints]);
    const wardData = useMemo(() => computeWardAnalytics(complaints), [complaints]);
    const trendData = useMemo(() => computeEscalationTrend(complaints), [complaints]);

    const sortedWards = useMemo(() => {
        return [...wardData].sort((a, b) => {
            const av = a[sortBy] ?? 0;
            const bv = b[sortBy] ?? 0;
            return sortDir === 'asc' ? av - bv : bv - av;
        });
    }, [wardData, sortBy, sortDir]);

    const underperforming = wardData.filter(w => w.isUnderperforming);

    const handleSort = (key) => {
        if (sortBy === key) {
            setSortDir(d => d === 'asc' ? 'desc' : 'asc');
        } else {
            setSortBy(key);
            setSortDir('asc');
        }
    };

    const wardDistribution = wardData
        .filter(w => w.total > 0)
        .sort((a, b) => b.total - a.total)
        .slice(0, 8)
        .map(w => ({ name: w.ward, value: w.total }));

    if (loading) return <Spinner text="Loading Command Center..." />;

    const getSortIcon = (key) => {
        if (sortBy !== key) return '↕';
        return sortDir === 'asc' ? '↑' : '↓';
    };

    const getScoreClass = (score) => {
        if (score >= 70) return 'score-good';
        if (score >= 40) return 'score-warning';
        return 'score-critical';
    };

    return (
        <div className="command-center">
            {/* ─── HEADER ─── */}
            <div className="cc-header">
                <div className="cc-header-badge">🏛️ Command Center</div>
                <h1 className="cc-title">District Civic Administration</h1>
                <p className="cc-subtitle">
                    Real-time governance analytics — {complaints.length} complaints across {wardData.length} wards
                </p>
            </div>

            {/* ─── ALERT BANNER ─── */}
            {underperforming.length > 0 && (
                <div className="cc-alert-banner">
                    <HiOutlineExclamationCircle size={20} />
                    <span>
                        <strong>{underperforming.length} underperforming ward{underperforming.length > 1 ? 's' : ''}</strong> detected —{' '}
                        {underperforming.map(w => w.ward).join(', ')}
                    </span>
                </div>
            )}

            {/* ─── 7 KPI CARDS ─── */}
            <div className="cc-kpi-grid">
                <Card icon={<HiOutlineDocumentText />} value={overview.total} label="Total Complaints" color="blue" />
                <Card icon={<HiOutlineLightningBolt />} value={overview.active} label="Active" color="yellow" />
                <Card icon={<HiOutlineCheckCircle />} value={overview.resolved} label="Resolved" color="green" />
                <Card icon={<HiOutlineExclamation />} value={overview.escalated} label="Escalated (SLA Breach)" color="red" />
                <Card icon={<HiOutlineClock />} value={`${overview.avgResolutionHours}h`} label="Avg Resolution Time" color="purple" />
                <Card icon={<HiOutlineShieldCheck />} value={`${overview.onTimeResolutionRate}%`} label="On-Time Resolution" color="green" />
                <Card icon={<HiOutlineTrendingUp />} value={`${overview.assignmentDelayRate}%`} label="Assignment Delay Rate" color="orange" />
            </div>

            {/* ─── CHARTS ROW ─── */}
            <div className="charts-grid">
                <div className="chart-card">
                    <h3>Ward Avg Resolution Time (hours)</h3>
                    <ResponsiveContainer width="100%" height={300}>
                        {wardData.length > 0 ? (
                            <BarChart data={wardData.sort((a, b) => b.avgResolutionHours - a.avgResolutionHours).slice(0, 10)} layout="vertical">
                                <CartesianGrid strokeDasharray="3 3" stroke="var(--border-color)" />
                                <XAxis type="number" tick={{ fontSize: 11 }} unit="h" />
                                <YAxis dataKey="ward" type="category" tick={{ fontSize: 10 }} width={90} />
                                <Tooltip contentStyle={{ background: 'var(--bg-card)', border: '1px solid var(--border-color)', borderRadius: '8px', fontSize: '0.85rem' }} />
                                <Bar dataKey="avgResolutionHours" name="Avg Hours" radius={[0, 4, 4, 0]}>
                                    {wardData.sort((a, b) => b.avgResolutionHours - a.avgResolutionHours).slice(0, 10).map((w, i) => (
                                        <Cell key={i} fill={w.avgResolutionHours > 48 ? '#ef4444' : w.avgResolutionHours > 24 ? '#f59e0b' : '#10b981'} />
                                    ))}
                                </Bar>
                            </BarChart>
                        ) : <div className="chart-empty">No data</div>}
                    </ResponsiveContainer>
                </div>

                <div className="chart-card">
                    <h3>Complaint Distribution by Ward</h3>
                    <ResponsiveContainer width="100%" height={300}>
                        {wardDistribution.length > 0 ? (
                            <PieChart>
                                <Pie data={wardDistribution} cx="50%" cy="50%" innerRadius={55} outerRadius={100} paddingAngle={3} dataKey="value"
                                    label={({ name, percent }) => `${name} ${(percent * 100).toFixed(0)}%`} labelLine={{ strokeWidth: 1 }}>
                                    {wardDistribution.map((_, i) => (<Cell key={i} fill={COLORS[i % COLORS.length]} />))}
                                </Pie>
                                <Tooltip />
                                <Legend />
                            </PieChart>
                        ) : <div className="chart-empty">No data</div>}
                    </ResponsiveContainer>
                </div>

                <div className="chart-card" style={{ gridColumn: 'span 2' }}>
                    <h3>Escalation & Complaint Trend (Last 30 Days)</h3>
                    <ResponsiveContainer width="100%" height={280}>
                        <AreaChart data={trendData}>
                            <CartesianGrid strokeDasharray="3 3" stroke="var(--border-color)" />
                            <XAxis dataKey="date" tick={{ fontSize: 10 }} interval={4} />
                            <YAxis tick={{ fontSize: 12 }} />
                            <Tooltip contentStyle={{ background: 'var(--bg-card)', border: '1px solid var(--border-color)', borderRadius: '8px', fontSize: '0.85rem' }} />
                            <Area type="monotone" dataKey="complaints" stroke="#3b82f6" fill="rgba(59,130,246,0.1)" strokeWidth={2} name="Complaints" />
                            <Area type="monotone" dataKey="escalated" stroke="#ef4444" fill="rgba(239,68,68,0.1)" strokeWidth={2} name="Escalated" />
                            <Legend />
                        </AreaChart>
                    </ResponsiveContainer>
                </div>
            </div>

            {/* ─── WARD PERFORMANCE TABLE ─── */}
            <div className="cc-ward-section">
                <div className="cc-ward-header">
                    <h2>Ward Performance Scorecard</h2>
                    <div className="cc-sort-buttons">
                        <button className={sortBy === 'performanceScore' ? 'active' : ''} onClick={() => handleSort('performanceScore')}>
                            By Performance {getSortIcon('performanceScore')}
                        </button>
                        <button className={sortBy === 'avgResolutionHours' ? 'active' : ''} onClick={() => handleSort('avgResolutionHours')}>
                            By Resolution Time {getSortIcon('avgResolutionHours')}
                        </button>
                        <button className={sortBy === 'escalated' ? 'active' : ''} onClick={() => handleSort('escalated')}>
                            By Escalations {getSortIcon('escalated')}
                        </button>
                    </div>
                </div>

                <div className="cc-table-wrapper">
                    <table className="cc-ward-table">
                        <thead>
                            <tr>
                                <th>Ward</th>
                                <th onClick={() => handleSort('total')} className="sortable">Total {getSortIcon('total')}</th>
                                <th onClick={() => handleSort('active')} className="sortable">Active {getSortIcon('active')}</th>
                                <th onClick={() => handleSort('resolved')} className="sortable">Resolved {getSortIcon('resolved')}</th>
                                <th onClick={() => handleSort('avgResolutionHours')} className="sortable">Avg Time {getSortIcon('avgResolutionHours')}</th>
                                <th onClick={() => handleSort('onTimeAssignmentRate')} className="sortable">Assign Rate {getSortIcon('onTimeAssignmentRate')}</th>
                                <th onClick={() => handleSort('onTimeResolutionRate')} className="sortable">Resolution Rate {getSortIcon('onTimeResolutionRate')}</th>
                                <th onClick={() => handleSort('escalated')} className="sortable">Escalated {getSortIcon('escalated')}</th>
                                <th onClick={() => handleSort('performanceScore')} className="sortable">Score {getSortIcon('performanceScore')}</th>
                                <th>Status</th>
                            </tr>
                        </thead>
                        <tbody>
                            {sortedWards.map((w) => (
                                <tr key={w.ward} className={w.isUnderperforming ? 'row-underperforming' : ''}>
                                    <td className="ward-name-cell">
                                        <strong>{w.ward}</strong>
                                    </td>
                                    <td>{w.total}</td>
                                    <td>{w.active}</td>
                                    <td>{w.resolved}</td>
                                    <td>
                                        <span className={w.avgResolutionHours > 48 ? 'text-danger' : w.avgResolutionHours > 24 ? 'text-warning' : 'text-success'}>
                                            {w.avgResolutionHours}h
                                        </span>
                                    </td>
                                    <td>{w.onTimeAssignmentRate}%</td>
                                    <td>
                                        <span className={w.onTimeResolutionRate < 60 ? 'text-danger' : 'text-success'}>
                                            {w.onTimeResolutionRate}%
                                        </span>
                                    </td>
                                    <td>
                                        {w.escalated > 0 ? (
                                            <span className="text-danger" style={{ fontWeight: 600 }}>{w.escalated}</span>
                                        ) : <span style={{ color: 'var(--text-tertiary)' }}>0</span>}
                                    </td>
                                    <td>
                                        <span className={`cc-score ${getScoreClass(w.performanceScore)}`}>
                                            {w.performanceScore}
                                        </span>
                                    </td>
                                    <td>
                                        {w.isUnderperforming ? (
                                            <Badge type="high">⚠️ Underperforming</Badge>
                                        ) : (
                                            <Badge type="resolved">✅ Normal</Badge>
                                        )}
                                    </td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>
                {sortedWards.length === 0 && (
                    <div className="chart-empty" style={{ padding: '2rem', textAlign: 'center' }}>
                        No ward data available yet. Complaints will populate this table.
                    </div>
                )}
            </div>
        </div>
    );
}
