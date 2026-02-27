import { useState, useEffect } from 'react';
import { useAuth } from '../../../context/AuthContext';
import { mockComplaintService } from '../../../services/mockComplaintService';
import { getUserProfile } from '../../../services/firebaseAuthService';
import Card from '../../../components/Card/Card';
import Table from '../../../components/Table/Table';
import Badge from '../../../components/Badge/Badge';
import Button from '../../../components/Button/Button';
import Spinner from '../../../components/Spinner/Spinner';
import { formatDate } from '../../../utils/helpers';
import { HiOutlineClipboardList, HiOutlineExclamation, HiOutlineClock, HiOutlineCheckCircle } from 'react-icons/hi';
import toast from 'react-hot-toast';
import { sendResolvedEmail } from '../../../services/emailService';

export default function OfficerDashboard() {
    const { user } = useAuth();
    const [complaints, setComplaints] = useState([]);
    const [loading, setLoading] = useState(true);
    const [resolving, setResolving] = useState(null);

    const loadData = async () => {
        const data = await mockComplaintService.getBySupervisor(user.id);
        setComplaints(data);
        setLoading(false);
    };

    useEffect(() => { loadData(); }, [user.id]);

    const handleResolve = async (id) => {
        setResolving(id);
        try {
            const resolvedComplaint = await mockComplaintService.resolve(id);
            toast.success('Complaint marked as resolved!');
            try {
                if (!resolvedComplaint.citizenEmail && resolvedComplaint.citizenId) {
                    const citizenProfile = await getUserProfile(resolvedComplaint.citizenId);
                    if (citizenProfile?.email) {
                        resolvedComplaint.citizenEmail = citizenProfile.email;
                        resolvedComplaint.citizenName = resolvedComplaint.citizenName || citizenProfile.name;
                    }
                }
                const response = await sendResolvedEmail(resolvedComplaint);
                if (response?.simulated) {
                    toast('Email sent (Simulation)', { icon: '📧' });
                } else {
                    toast.success('📧 Resolution email sent to citizen!');
                }
            } catch (emailErr) {
                console.error('Email notification failed:', emailErr);
                toast.error(`Email failed: ${emailErr.message || 'Unknown error'}`);
            }
            await loadData();
        } catch {
            toast.error('Failed to resolve');
        } finally {
            setResolving(null);
        }
    };

    if (loading) return <Spinner text="Loading assignments..." />;

    const highPriorityPending = complaints.filter((c) => c.urgency === 'High' && c.status === 'Pending');
    const pendingComplaints = complaints.filter((c) => c.status === 'Pending');
    const assignedNotCompleted = complaints.filter((c) => c.status === 'Assigned' || c.status === 'In Progress');
    const resolved = complaints.filter((c) => c.status === 'Resolved');

    const columns = [
        { key: 'title', label: 'Title' },
        { key: 'category', label: 'Category' },
        { key: 'urgency', label: 'Urgency' },
        { key: 'status', label: 'Status' },
        { key: 'date', label: 'Date' },
        { key: 'action', label: 'Action' },
    ];

    const renderRow = (c) => (
        <tr key={c.id}>
            <td>
                <div>
                    <strong>{c.title}</strong>
                    <div style={{ fontSize: '0.75rem', color: 'var(--text-tertiary)' }}>{c.id}</div>
                </div>
            </td>
            <td>{c.category}</td>
            <td><Badge type={c.urgency.toLowerCase()}>{c.urgency}</Badge></td>
            <td><Badge type={c.status.toLowerCase().replace(/\s/g, '')}>{c.status}</Badge></td>
            <td>{formatDate(c.createdAt)}</td>
            <td>
                {c.status !== 'Resolved' ? (
                    <Button
                        variant="success"
                        size="sm"
                        onClick={() => handleResolve(c.id)}
                        loading={resolving === c.id}
                    >
                        ✓ Resolve
                    </Button>
                ) : (
                    <span style={{ fontSize: '0.8rem', color: 'var(--success)' }}>✅ Done</span>
                )}
            </td>
        </tr>
    );

    return (
        <div>
            <div className="page-header">
                <h1 className="page-title">Ward Supervisor Dashboard</h1>
                <p className="page-subtitle">Manage and resolve assigned complaints</p>
            </div>

            <div className="stats-grid">
                <Card icon={<HiOutlineClipboardList />} value={complaints.length} label="Total Assigned" color="blue" />
                <Card icon={<HiOutlineExclamation />} value={highPriorityPending.length} label="High Priority Pending" color="red" />
                <Card icon={<HiOutlineClock />} value={pendingComplaints.length} label="Pending" color="yellow" />
                <Card icon={<HiOutlineCheckCircle />} value={resolved.length} label="Resolved" color="green" />
            </div>

            {highPriorityPending.length > 0 && (
                <>
                    <h2 className="section-title" style={{ marginTop: '1.5rem', color: 'var(--danger)' }}>
                        🚨 High Priority — Pending
                    </h2>
                    <Table columns={columns} data={highPriorityPending}
                        emptyMessage="" renderRow={renderRow} />
                </>
            )}

            <h2 className="section-title" style={{ marginTop: '1.5rem' }}>
                ⏳ Pending Complaints
            </h2>
            <Table columns={columns} data={pendingComplaints}
                emptyMessage="No pending complaints" renderRow={renderRow} />

            {assignedNotCompleted.length > 0 && (
                <>
                    <h2 className="section-title" style={{ marginTop: '1.5rem' }}>
                        🔧 Assigned — Not Completed
                    </h2>
                    <Table columns={columns} data={assignedNotCompleted}
                        emptyMessage="" renderRow={renderRow} />
                </>
            )}
        </div>
    );
}
