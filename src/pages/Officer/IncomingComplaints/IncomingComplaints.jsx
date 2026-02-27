import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { getAllComplaints, assignComplaint as fbAssignComplaint } from '../../../services/firebaseComplaintService';
import { getWorkers, incrementWorkerTasks } from '../../../services/firebaseWorkerService';
import Table from '../../../components/Table/Table';
import Badge from '../../../components/Badge/Badge';
import Button from '../../../components/Button/Button';
import Modal from '../../../components/Modal/Modal';
import Spinner from '../../../components/Spinner/Spinner';
import { formatDate } from '../../../utils/helpers';
import toast from 'react-hot-toast';
import '../Overview/OfficerPages.css';
export default function IncomingComplaints() {
    const navigate = useNavigate();
    const [complaints, setComplaints] = useState([]);
    const [workers, setWorkers] = useState([]);
    const [loading, setLoading] = useState(true);
    const [search, setSearch] = useState('');
    const [urgencyFilter, setUrgencyFilter] = useState('');
    const [showAssignModal, setShowAssignModal] = useState(false);
    const [selectedComplaint, setSelectedComplaint] = useState(null);
    const [selectedWorker, setSelectedWorker] = useState('');
    const [assigning, setAssigning] = useState(false);
    const loadData = async () => {
        const [c, w] = await Promise.all([getAllComplaints(), getWorkers()]);
        setComplaints(c.filter(item => item.status !== 'Resolved'));
        setWorkers(w);
        setLoading(false);
    };
    useEffect(() => { loadData(); }, []);
    const filtered = complaints.filter((c) => {
        const matchSearch = !search || c.title?.toLowerCase().includes(search.toLowerCase()) || c.id?.toLowerCase().includes(search.toLowerCase());
        const matchUrgency = !urgencyFilter || c.urgency === urgencyFilter;
        return matchSearch && matchUrgency;
    });
    const openAssign = (complaint) => {
        setSelectedComplaint(complaint);
        setSelectedWorker('');
        setShowAssignModal(true);
    };
    const handleAssign = async () => {
        if (!selectedWorker) { toast.error('Please select a worker'); return; }
        setAssigning(true);
        try {
            await fbAssignComplaint(selectedComplaint.id, selectedWorker);
            await incrementWorkerTasks(selectedWorker);
            toast.success('Complaint assigned successfully!');
            setShowAssignModal(false);
            await loadData();
        } catch (err) { toast.error('Assignment failed: ' + err.message); }
        finally { setAssigning(false); }
    };
    const departmentWorkers = selectedComplaint
        ? workers.filter((w) => w.department === selectedComplaint.department)
        : workers;
    const sortedWorkers = [...departmentWorkers].sort((a, b) => (a.activeTasks || 0) - (b.activeTasks || 0));
    const recommendedId = sortedWorkers.length > 0 ? sortedWorkers[0].id : null;
    const getLoadClass = (active) => {
        if (active >= 5) return 'load-high';
        if (active >= 3) return 'load-medium';
        return 'load-low';
    };
    const columns = [
        { key: 'id', label: 'ID' },
        { key: 'title', label: 'Title' },
        { key: 'urgency', label: 'Urgency' },
        { key: 'location', label: 'Location' },
        { key: 'status', label: 'Status' },
        { key: 'created', label: 'Created' },
        { key: 'action', label: 'Action' },
    ];
    if (loading) return <Spinner text="Loading complaints..." />;
    return (
        <div>
            <div className="page-header">
                <h1 className="page-title">Active Complaints</h1>
                <p className="page-subtitle">AI-classified active complaints — data from Firebase</p>
            </div>
            <div className="filters-bar">
                <input type="text" placeholder="Search by title or ID..." value={search}
                    onChange={(e) => setSearch(e.target.value)} className="search-input" />
                <select value={urgencyFilter} onChange={(e) => setUrgencyFilter(e.target.value)} className="filter-select">
                    <option value="">All Urgency</option>
                    <option value="High">High</option>
                    <option value="Medium">Medium</option>
                    <option value="Low">Low</option>
                </select>
            </div>
            <Table columns={columns} data={filtered} emptyMessage="No complaints found. Complaints will appear when citizens submit them."
                renderRow={(c) => (
                    <tr key={c.id} style={{ cursor: 'pointer' }} onClick={() => navigate(`/officer/complaint/${c.id}`)}>
                        <td><strong style={{ fontSize: '0.75rem', fontFamily: 'monospace' }}>{c.id?.slice(0, 8)}...</strong></td>
                        <td>
                            <div>
                                <span style={{ fontWeight: 600 }}>{c.title}</span>
                                <div style={{ fontSize: '0.72rem', color: 'var(--text-tertiary)' }}>by {c.citizenName || 'Citizen'}</div>
                            </div>
                        </td>
                        <td><Badge type={c.urgency?.toLowerCase()}>{c.urgency}</Badge></td>
                        <td style={{ fontSize: '0.8rem' }}>{c.location}</td>
                        <td><Badge type={c.status?.toLowerCase().replace(/\s/g, '')}>{c.status}</Badge></td>
                        <td>{formatDate(c.createdAt)}</td>
                        <td onClick={(e) => e.stopPropagation()}>
                            {c.status === 'Pending' ? (
                                <Button size="sm" onClick={() => openAssign(c)}>Assign</Button>
                            ) : c.assignedWorker ? (
                                <span style={{ fontSize: '0.75rem', color: 'var(--text-tertiary)' }}>
                                    {workers.find((w) => w.id === c.assignedWorker)?.name || 'Assigned'}
                                </span>
                            ) : '-'}
                        </td>
                    </tr>
                )}
            />
            <Modal isOpen={showAssignModal} onClose={() => setShowAssignModal(false)} title="Assign Complaint">
                {selectedComplaint && (
                    <div className="assign-modal-content">
                        <div className="assign-complaint-info">
                            <h4>{selectedComplaint.title}</h4>
                            <p>{selectedComplaint.location} · {selectedComplaint.department} · <Badge type={selectedComplaint.urgency?.toLowerCase()}>{selectedComplaint.urgency}</Badge></p>
                        </div>
                        <div>
                            <h4 style={{ fontSize: '0.85rem', marginBottom: '0.5rem', color: 'var(--text-primary)' }}>
                                Select Worker — {selectedComplaint.department}
                            </h4>
                            {sortedWorkers.length === 0 ? (
                                <p style={{ fontSize: '0.85rem', color: 'var(--text-tertiary)' }}>
                                    No workers found for <strong>{selectedComplaint.department}</strong>. Add workers for this department in Worker Management first.
                                </p>
                            ) : (
                                <div className="worker-options">
                                    {sortedWorkers.map((w) => (
                                        <div key={w.id}
                                            className={`worker-option ${selectedWorker === w.id ? 'selected' : ''} ${w.id === recommendedId ? 'recommended' : ''}`}
                                            onClick={() => setSelectedWorker(w.id)}>
                                            {w.id === recommendedId && <span className="recommended-label">⚡ Recommended by AI</span>}
                                            <div className="worker-option-left">
                                                <div className="worker-opt-avatar">{w.name?.charAt(0)}</div>
                                                <div className="worker-opt-info">
                                                    <span className="worker-opt-name">{w.name}</span>
                                                    <span className="worker-opt-role">{w.role}</span>
                                                </div>
                                            </div>
                                            <span className={`worker-opt-load ${getLoadClass(w.activeTasks || 0)}`}>
                                                {w.activeTasks || 0} active
                                            </span>
                                        </div>
                                    ))}
                                </div>
                            )}
                        </div>
                        <Button fullWidth onClick={handleAssign} loading={assigning} disabled={!selectedWorker}>
                            ✓ Confirm Assignment
                        </Button>
                    </div>
                )}
            </Modal>
        </div>
    );
}
