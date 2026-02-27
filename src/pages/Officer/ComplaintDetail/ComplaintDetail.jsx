import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useAuth } from '../../../context/AuthContext';
import { getComplaintById, resolveComplaint as fbResolve, assignComplaint } from '../../../services/firebaseComplaintService';
import { getWorkers, completeWorkerTask, incrementWorkerTasks } from '../../../services/firebaseWorkerService';
import { getUserProfile } from '../../../services/firebaseAuthService';
import { sendResolvedEmail } from '../../../services/emailService';
import Badge from '../../../components/Badge/Badge';
import Button from '../../../components/Button/Button';
import Spinner from '../../../components/Spinner/Spinner';
import toast from 'react-hot-toast';
import '../Overview/OfficerPages.css';

export default function ComplaintDetail() {
    const { id } = useParams();
    const navigate = useNavigate();
    const { user } = useAuth();
    const [complaint, setComplaint] = useState(null);
    const [workers, setWorkers] = useState([]);
    const [loading, setLoading] = useState(true);
    const [resolving, setResolving] = useState(false);
    const [assigning, setAssigning] = useState(false);
    const [selectedWorker, setSelectedWorker] = useState('');

    useEffect(() => {
        async function load() {
            const [c, w] = await Promise.all([getComplaintById(id), getWorkers()]);
            setComplaint(c);
            setWorkers(w);
            setLoading(false);
        }
        load();
    }, [id]);

    const handleAssignWorker = async () => {
        if (!selectedWorker) { toast.error('Please select a worker'); return; }
        setAssigning(true);
        try {
            await assignComplaint(complaint.id, selectedWorker);
            await incrementWorkerTasks(selectedWorker);
            const worker = workers.find(w => w.id === selectedWorker);
            toast.success(`Assigned to ${worker?.name || 'Worker'}`);
            const updated = await getComplaintById(id);
            setComplaint(updated);
            setSelectedWorker('');
        } catch (err) {
            console.error(err);
            toast.error('Failed to assign worker');
        } finally {
            setAssigning(false);
        }
    };

    const handleResolve = async () => {
        setResolving(true);
        try {
            const resolvedData = await fbResolve(complaint.id);
            if (complaint.assignedWorker) {
                await completeWorkerTask(complaint.assignedWorker);
            }
            toast.success('Complaint resolved!');
            try {
                if (!resolvedData.citizenEmail && resolvedData.citizenId) {
                    const citizenProfile = await getUserProfile(resolvedData.citizenId);
                    if (citizenProfile?.email) {
                        resolvedData.citizenEmail = citizenProfile.email;
                        resolvedData.citizenName = resolvedData.citizenName || citizenProfile.name;
                    }
                }
                const response = await sendResolvedEmail(resolvedData);
                if (response?.simulated) {
                    toast('Email sent (Simulation)', { icon: '📧' });
                } else {
                    toast.success('📧 Resolution email sent to citizen!');
                }
            } catch (emailErr) {
                console.error('Email notification failed:', emailErr);
                toast.error(`Email failed: ${emailErr.message || 'Unknown error'}`);
            }
            setComplaint(resolvedData);
        } catch (err) {
            toast.error('Failed to resolve complaint');
            console.error(err);
        } finally {
            setResolving(false);
        }
    };

    if (loading) return <Spinner text="Loading complaint..." />;
    if (!complaint) return (
        <div style={{ textAlign: 'center', padding: '3rem' }}>
            <h2>Complaint not found</h2>
            <Button onClick={() => navigate('/officer/incoming')} style={{ marginTop: '1rem' }}>← Back</Button>
        </div>
    );

    const assignedWorker = workers.find((w) => w.id === complaint.assignedWorker);
    const isResolved = complaint.status === 'Resolved';
    const isAssigned = !!complaint.assignedWorker;
    const isOfficer = ['District Civic Administrator', 'Ward Supervisor'].includes(user?.role);
    const availableWorkers = workers.filter(w => (w.status || 'Active') === 'Active');

    const now = new Date();
    const slaBreach = !isResolved && complaint.slaDeadline && new Date(complaint.slaDeadline) < now;
    const resolutionHours = complaint.resolvedAt && complaint.assignedAt
        ? Math.round((new Date(complaint.resolvedAt) - new Date(complaint.assignedAt)) / (1000 * 60 * 60))
        : null;
    const formatDT = (dt) => dt ? new Date(dt).toLocaleString('en-IN', { dateStyle: 'medium', timeStyle: 'short' }) : '—';

    const timelineSteps = [
        { label: 'Submitted', time: complaint.createdAt, done: true },
        { label: 'Assigned', time: complaint.assignedAt, done: !!complaint.assignedAt },
        { label: 'In Progress', time: complaint.assignedAt, done: complaint.status === 'In Progress' || isResolved },
        { label: 'Resolved', time: complaint.resolvedAt, done: isResolved },
    ];

    return (
        <div className="detail-page">
            <Button variant="ghost" onClick={() => navigate('/officer/incoming')} style={{ marginBottom: '1rem' }}>
                ← Back to Complaints
            </Button>

            <div className="detail-card">
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', flexWrap: 'wrap', gap: '1rem' }}>
                    <div>
                        <h2 style={{ fontSize: '1.25rem', fontWeight: 700, marginBottom: '0.25rem' }}>{complaint.title}</h2>
                        <div style={{ fontSize: '0.85rem', color: 'var(--primary-color)', fontFamily: 'var(--font-mono)', fontWeight: 600, display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                            <span>Complaint ID: </span>
                            <code style={{ background: 'var(--bg-accent)', padding: '0.2rem 0.5rem', borderRadius: '4px' }}>{complaint.id}</code>
                        </div>
                    </div>
                    <div style={{ display: 'flex', gap: '0.5rem', alignItems: 'center' }}>
                        <Badge type={complaint.urgency?.toLowerCase()}>{complaint.urgency}</Badge>
                        <Badge type={complaint.status?.toLowerCase().replace(/\s/g, '')}>{complaint.status}</Badge>
                        {slaBreach && <span className="sla-breach">SLA BREACHED</span>}
                        {!slaBreach && !isResolved && <span className="sla-ok">Within SLA</span>}
                    </div>
                </div>

                <div className="detail-section" style={{ marginTop: '1.5rem' }}>
                    <h3>Description</h3>
                    <div className="detail-description">{complaint.description}</div>
                </div>

                <div className="detail-section">
                    <h3>Details</h3>
                    <div className="detail-grid">
                        <div className="detail-item">
                            <span className="detail-item-label">Category</span>
                            <span className="detail-item-value">{complaint.category}</span>
                        </div>
                        <div className="detail-item">
                            <span className="detail-item-label">Department</span>
                            <span className="detail-item-value">{complaint.department}</span>
                        </div>
                        <div className="detail-item">
                            <span className="detail-item-label">Location</span>
                            <span className="detail-item-value">{complaint.location}</span>
                        </div>
                        <div className="detail-item">
                            <span className="detail-item-label">Filed By</span>
                            <span className="detail-item-value">{complaint.citizenName || 'Citizen'}</span>
                        </div>
                        <div className="detail-item">
                            <span className="detail-item-label">SLA Deadline</span>
                            <span className="detail-item-value" style={{ color: slaBreach ? 'var(--danger)' : 'inherit' }}>{formatDT(complaint.slaDeadline)}</span>
                        </div>
                        {assignedWorker && (
                            <div className="detail-item">
                                <span className="detail-item-label">Assigned Worker</span>
                                <span className="detail-item-value">👷 {assignedWorker.name} ({assignedWorker.role})</span>
                            </div>
                        )}
                        {resolutionHours !== null && (
                            <div className="detail-item">
                                <span className="detail-item-label">Resolution Time</span>
                                <span className="detail-item-value">{resolutionHours} hours</span>
                            </div>
                        )}
                    </div>
                </div>

                <div className="detail-section">
                    <h3>Timeline</h3>
                    <div className="timeline">
                        {timelineSteps.map((step, i) => (
                            <div key={i} className="timeline-item">
                                <div className={`timeline-dot ${step.done ? (i === timelineSteps.length - 1 && step.done ? 'completed' : 'active') : ''}`} />
                                <div className="timeline-label">{step.label}</div>
                                <div className="timeline-time">{step.done ? formatDT(step.time) : 'Pending'}</div>
                            </div>
                        ))}
                    </div>
                </div>

                {!isResolved && isOfficer && (
                    <div style={{
                        marginTop: '1.5rem', padding: '1.25rem', borderRadius: '12px',
                        background: 'var(--bg-card)', border: '1px solid var(--border-color)',
                    }}>
                        <h3 style={{ fontSize: '1rem', fontWeight: 600, marginBottom: '1rem' }}>⚡ Actions</h3>

                        {!isAssigned && (
                            <div style={{ marginBottom: '1rem' }}>
                                <label style={{ fontSize: '0.85rem', fontWeight: 500, color: 'var(--text-secondary)', display: 'block', marginBottom: '0.4rem' }}>
                                    Assign Worker
                                </label>
                                <div style={{ display: 'flex', gap: '0.5rem' }}>
                                    <select
                                        value={selectedWorker}
                                        onChange={(e) => setSelectedWorker(e.target.value)}
                                        className="filter-select"
                                        style={{ flex: 1 }}
                                    >
                                        <option value="">Select a worker...</option>
                                        {availableWorkers.map(w => (
                                            <option key={w.id} value={w.id}>
                                                {w.name} — {w.role} ({w.activeTasks || 0} active)
                                            </option>
                                        ))}
                                    </select>
                                    <Button onClick={handleAssignWorker} loading={assigning} variant="primary">
                                        Assign
                                    </Button>
                                </div>
                            </div>
                        )}

                        {isAssigned && (
                            <div style={{ fontSize: '0.85rem', color: 'var(--text-secondary)', marginBottom: '1rem' }}>
                                Currently assigned to <strong>{assignedWorker?.name}</strong> ({assignedWorker?.role})
                            </div>
                        )}

                        <Button onClick={handleResolve} loading={resolving} variant="success" size="lg" fullWidth>
                            ✓ Mark as Resolved
                        </Button>
                    </div>
                )}

                {isResolved && (
                    <div style={{
                        marginTop: '1.5rem', padding: '1rem', borderRadius: '12px', textAlign: 'center',
                        background: 'linear-gradient(135deg, rgba(16,185,129,0.08), rgba(5,150,105,0.08))',
                        border: '1px solid rgba(16,185,129,0.3)',
                    }}>
                        <span style={{ fontSize: '1.5rem' }}>✅</span>
                        <p style={{ fontWeight: 600, color: 'var(--success)', marginTop: '0.25rem' }}>This complaint has been resolved</p>
                    </div>
                )}
            </div>
        </div>
    );
}
