import { useState, useEffect } from 'react';
import { getWorkers, addWorker as fbAddWorker, updateWorker as fbUpdateWorker, removeWorker as fbRemoveWorker } from '../../../services/firebaseWorkerService';
import Table from '../../../components/Table/Table';
import Button from '../../../components/Button/Button';
import Modal from '../../../components/Modal/Modal';
import FormInput from '../../../components/FormInput/FormInput';
import Spinner from '../../../components/Spinner/Spinner';
import toast from 'react-hot-toast';
import '../Overview/OfficerPages.css';
export default function WorkerManagement() {
    const [workers, setWorkers] = useState([]);
    const [loading, setLoading] = useState(true);
    const [showAddModal, setShowAddModal] = useState(false);
    const [showEditModal, setShowEditModal] = useState(false);
    const [editWorker, setEditWorker] = useState(null);
    const [form, setForm] = useState({ name: '', role: 'Electrician', phone: '', department: 'Electricity Department' });
    const [saving, setSaving] = useState(false);
    const loadWorkers = async () => {
        const data = await getWorkers();
        setWorkers(data);
        setLoading(false);
    };
    useEffect(() => { loadWorkers(); }, []);
    const handleChange = (e) => setForm({ ...form, [e.target.name]: e.target.value });
    const handleAdd = async () => {
        if (!form.name.trim()) { toast.error('Name is required'); return; }
        setSaving(true);
        await fbAddWorker(form);
        toast.success('Worker added!');
        setShowAddModal(false);
        setForm({ name: '', role: 'Electrician', phone: '', department: 'Electricity Department' });
        setSaving(false);
        await loadWorkers();
    };
    const handleEdit = async () => {
        setSaving(true);
        await fbUpdateWorker(editWorker.id, { name: form.name, role: form.role, phone: form.phone });
        toast.success('Worker updated!');
        setShowEditModal(false);
        setSaving(false);
        await loadWorkers();
    };
    const handleRemove = async (id, name) => {
        if (!window.confirm(`Remove ${name}? This action cannot be undone.`)) return;
        await fbRemoveWorker(id);
        toast.success('Worker removed');
        await loadWorkers();
    };
    const openEdit = (w) => {
        setEditWorker(w);
        setForm({ name: w.name, role: w.role, phone: w.phone || '', department: w.department || '' });
        setShowEditModal(true);
    };
    const columns = [
        { key: 'name', label: 'Worker Name' },
        { key: 'role', label: 'Role' },
        { key: 'active', label: 'Active Tasks' },
        { key: 'completed', label: 'Completed' },
        { key: 'avgTime', label: 'Avg Resolution' },
        { key: 'status', label: 'Status' },
        { key: 'actions', label: 'Actions' },
    ];
    if (loading) return <Spinner text="Loading workers..." />;
    return (
        <div>
            <div className="worker-mgmt-header">
                <div>
                    <h1 className="page-title">Worker Management</h1>
                    <p className="page-subtitle">Manage field workers — data stored in Firebase</p>
                </div>
                <Button onClick={() => {
                    setForm({ name: '', role: 'Electrician', phone: '', department: 'Electricity Department' });
                    setShowAddModal(true);
                }}>+ Add Worker</Button>
            </div>
            <Table columns={columns} data={workers} emptyMessage="No workers found. Add workers to start assigning complaints."
                renderRow={(w) => {
                    return (
                        <tr key={w.id}>
                            <td>
                                <div style={{ display: 'flex', alignItems: 'center', gap: '0.6rem' }}>
                                    <div className="worker-opt-avatar">{w.name?.charAt(0)}</div>
                                    <strong>{w.name}</strong>
                                </div>
                            </td>
                            <td>{w.role}</td>
                            <td><strong>{w.activeTasks || 0}</strong></td>
                            <td>{w.completedTasks || 0}</td>
                            <td>{w.avgResolutionTime || 0}h</td>
                            <td>
                                <span className={(w.status || 'Active') === 'Active' ? 'worker-status-active' : 'worker-status-overloaded'}>
                                    {(w.status || 'Active') === 'Active' ? '● Active' : '● Overloaded'}
                                </span>
                            </td>
                            <td>
                                <div style={{ display: 'flex', gap: '0.4rem' }}>
                                    <Button size="sm" variant="secondary" onClick={() => openEdit(w)}>Edit</Button>
                                    <Button size="sm" variant="danger" onClick={() => handleRemove(w.id, w.name)}>Remove</Button>
                                </div>
                            </td>
                        </tr>
                    );
                }}
            />
            <Modal isOpen={showAddModal} onClose={() => setShowAddModal(false)} title="Add New Worker">
                <div className="worker-form">
                    <FormInput label="Worker Name" name="name" value={form.name} onChange={handleChange} placeholder="Full name" required />
                    <FormInput label="Role" type="select" name="role" value={form.role} onChange={handleChange}
                        options={['Electrician', 'Line Inspector', 'Technician', 'Supervisor']} />
                    <FormInput label="Phone" name="phone" value={form.phone} onChange={handleChange} placeholder="+91 XXXXX XXXXX" />
                    <Button fullWidth onClick={handleAdd} loading={saving}>Add Worker</Button>
                </div>
            </Modal>
            <Modal isOpen={showEditModal} onClose={() => setShowEditModal(false)} title="Edit Worker">
                <div className="worker-form">
                    <FormInput label="Worker Name" name="name" value={form.name} onChange={handleChange} required />
                    <FormInput label="Role" type="select" name="role" value={form.role} onChange={handleChange}
                        options={['Electrician', 'Line Inspector', 'Technician', 'Supervisor']} />
                    <FormInput label="Phone" name="phone" value={form.phone} onChange={handleChange} />
                    <Button fullWidth onClick={handleEdit} loading={saving}>Save Changes</Button>
                </div>
            </Modal>
        </div>
    );
}
