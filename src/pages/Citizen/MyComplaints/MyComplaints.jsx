import { useState, useEffect } from 'react';
import { useAuth } from '../../../context/AuthContext';
import { getComplaintsByCitizen } from '../../../services/firebaseComplaintService';
import { useNavigate } from 'react-router-dom';
import Table from '../../../components/Table/Table';
import Badge from '../../../components/Badge/Badge';
import Spinner from '../../../components/Spinner/Spinner';
import { formatDate } from '../../../utils/helpers';
export default function MyComplaints() {
    const { user } = useAuth();
    const navigate = useNavigate();
    const [complaints, setComplaints] = useState([]);
    const [filtered, setFiltered] = useState([]);
    const [loading, setLoading] = useState(true);
    const [search, setSearch] = useState('');
    const [statusFilter, setStatusFilter] = useState('');
    const [dateSort, setDateSort] = useState('desc');
    useEffect(() => {
        async function load() {
            const data = await getComplaintsByCitizen(user.id);
            setComplaints(data);
            setFiltered(data);
            setLoading(false);
        }
        load();
    }, [user.id]);
    useEffect(() => {
        let result = complaints;
        if (statusFilter) result = result.filter((c) => c.status === statusFilter);
        if (search) {
            const q = search.toLowerCase();
            result = result.filter(
                (c) => c.title.toLowerCase().includes(q) || c.id.toLowerCase().includes(q)
            );
        }
        result = [...result].sort((a, b) => {
            const da = new Date(a.createdAt || 0);
            const db = new Date(b.createdAt || 0);
            return dateSort === 'asc' ? da - db : db - da;
        });
        setFiltered(result);
    }, [search, statusFilter, dateSort, complaints]);
    if (loading) return <Spinner text="Loading complaints..." />;
    const columns = [
        { key: 'title', label: 'Title' },
        { key: 'category', label: 'Category' },
        { key: 'department', label: 'Department' },
        { key: 'urgency', label: 'Urgency' },
        { key: 'status', label: 'Status' },
        { key: 'createdAt', label: 'Created' },
    ];
    const getBadgeType = (urgency) => urgency.toLowerCase();
    const getStatusType = (status) => status.toLowerCase().replace(/\s/g, '');
    return (
        <div>
            <div className="page-header">
                <h1 className="page-title">My Complaints</h1>
                <p className="page-subtitle">View and track all your submitted grievances</p>
            </div>
            <div className="filters-bar">
                <input
                    type="text"
                    placeholder="Search by title or ID..."
                    value={search}
                    onChange={(e) => setSearch(e.target.value)}
                    className="search-input"
                />
                <select
                    value={statusFilter}
                    onChange={(e) => setStatusFilter(e.target.value)}
                    className="filter-select"
                >
                    <option value="">All Status</option>
                    <option value="Pending">Pending</option>
                    <option value="Assigned">Assigned</option>
                    <option value="In Progress">In Progress</option>
                    <option value="Resolved">Resolved</option>
                </select>
                <select
                    value={dateSort}
                    onChange={(e) => setDateSort(e.target.value)}
                    className="filter-select"
                >
                    <option value="desc">Newest First</option>
                    <option value="asc">Oldest First</option>
                </select>
            </div>
            <Table
                columns={columns}
                data={filtered}
                emptyMessage="No complaints found. Submit your first complaint!"
                renderRow={(complaint) => (
                    <tr
                        key={complaint.id}
                        onClick={() => navigate(`/citizen/complaint/${complaint.id}`)}
                        style={{ cursor: 'pointer' }}
                        className="clickable-row"
                    >
                        <td><strong>{complaint.title || (complaint.description ? complaint.description.slice(0, 40) + (complaint.description.length > 40 ? '...' : '') : 'No Title Provided')}</strong></td>
                        <td>{complaint.category || '—'}</td>
                        <td style={{ fontSize: '0.8rem' }}>{complaint.department || '—'}</td>
                        <td><Badge type={getBadgeType(complaint.urgency || 'low')}>{complaint.urgency || 'Low'}</Badge></td>
                        <td><Badge type={getStatusType(complaint.status || 'pending')}>{complaint.status || 'Pending'}</Badge></td>
                        <td>{formatDate(complaint.createdAt)}</td>
                    </tr>
                )}
            />
        </div>
    );
}
