import { useState, useEffect } from 'react';
import { useAuth } from '../../../context/AuthContext';
import { getComplaintsByCitizen } from '../../../services/firebaseComplaintService';
import { useNavigate } from 'react-router-dom';
import Card from '../../../components/Card/Card';
import Table from '../../../components/Table/Table';
import Badge from '../../../components/Badge/Badge';
import Spinner from '../../../components/Spinner/Spinner';
import { formatDate } from '../../../utils/helpers';
import { HiOutlineDocumentText, HiOutlineClock, HiOutlineCheckCircle, HiOutlineExclamation } from 'react-icons/hi';
export default function CitizenDashboard() {
    const { user } = useAuth();
    const navigate = useNavigate();
    const [stats, setStats] = useState(null);
    const [recentComplaints, setRecentComplaints] = useState([]);
    const [loading, setLoading] = useState(true);
    useEffect(() => {
        async function load() {
            const complaints = await getComplaintsByCitizen(user.id);
            const total = complaints.length;
            const pending = complaints.filter((c) => c.status === 'Pending' || c.status === 'Assigned').length;
            const resolved = complaints.filter((c) => c.status === 'Resolved').length;
            const highPriority = complaints.filter((c) => c.urgency === 'High').length;

            const recent = [...complaints]
                .sort((a, b) => new Date(b.createdAt || 0) - new Date(a.createdAt || 0))
                .slice(0, 3);

            setStats({ total, pending, resolved, highPriority });
            setRecentComplaints(recent);
            setLoading(false);
        }
        load();
    }, [user.id]);
    if (loading) return <Spinner text="Loading dashboard..." />;
    return (
        <div>
            <div className="page-header">
                <h1 className="page-title">Welcome, {user.name}</h1>
                <p className="page-subtitle">Here's an overview of your grievance activity</p>
            </div>
            <div className="stats-grid">
                <Card icon={<HiOutlineDocumentText />} value={stats.total} label="Total Complaints" color="blue" />
                <Card icon={<HiOutlineClock />} value={stats.pending} label="Pending" color="yellow" />
                <Card icon={<HiOutlineCheckCircle />} value={stats.resolved} label="Resolved" color="green" />
                <Card icon={<HiOutlineExclamation />} value={stats.highPriority} label="High Priority" color="red" />
            </div>

            <div style={{ marginTop: '2rem' }}>
                <h2 style={{ fontSize: '1.2rem', fontWeight: 600, marginBottom: '1rem', color: 'var(--text-primary)' }}>
                    Recent Activity
                </h2>
                <Table
                    columns={[
                        { key: 'title', label: 'Title' },
                        { key: 'urgency', label: 'Urgency' },
                        { key: 'status', label: 'Status' },
                        { key: 'createdAt', label: 'Date' }
                    ]}
                    data={recentComplaints}
                    emptyMessage="No recent complaints found."
                    renderRow={(c) => (
                        <tr
                            key={c.id}
                            onClick={() => navigate(`/citizen/complaint/${c.id}`)}
                            style={{ cursor: 'pointer' }}
                            className="clickable-row"
                        >
                            <td>
                                <strong>{c.title || c.description?.slice(0, 40) + (c.description?.length > 40 ? '...' : '') || 'No Title Provided'}</strong>
                                <div style={{ fontSize: '0.75rem', color: 'var(--primary-color)', fontFamily: 'var(--font-mono)' }}>{c.id}</div>
                            </td>
                            <td><Badge type={(c.urgency || 'low').toLowerCase()}>{c.urgency || 'Low'}</Badge></td>
                            <td><Badge type={(c.status || 'pending').toLowerCase().replace(/\s/g, '')}>{c.status || 'Pending'}</Badge></td>
                            <td>{formatDate(c.createdAt)}</td>
                        </tr>
                    )}
                />
            </div>

            <div className="dashboard-tips" style={{ marginTop: '2rem' }}>
                <div className="tip-card">
                    <h3>📋 Quick Actions</h3>
                    <ul>
                        <li>Submit a new complaint from the sidebar</li>
                        <li>Track all your complaints in "My Complaints"</li>
                        <li>Update your profile information</li>
                    </ul>
                </div>
            </div>
        </div>
    );
}
