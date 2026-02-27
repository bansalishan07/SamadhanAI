import {
    collection, doc, addDoc, getDoc, getDocs, updateDoc, query, where, orderBy, serverTimestamp, Timestamp
} from 'firebase/firestore';
import { db } from '../firebase';
const COMPLAINTS_COL = 'complaints';
export async function submitComplaint(data) {
    const docRef = await addDoc(collection(db, COMPLAINTS_COL), {
        ...data,
        status: 'Pending',
        assignedWorker: null,
        assignedAt: null,
        resolvedAt: null,
        createdAt: new Date().toISOString(),
        slaDeadline: new Date(Date.now() + 48 * 60 * 60 * 1000).toISOString(),
    });
    return { id: docRef.id, ...data };
}
export async function getAllComplaints() {
    const snap = await getDocs(query(collection(db, COMPLAINTS_COL), orderBy('createdAt', 'desc')));
    return snap.docs.map((d) => ({ id: d.id, ...d.data() }));
}
export async function getComplaintsByCitizen(citizenId) {
    try {
        const snap = await getDocs(query(collection(db, COMPLAINTS_COL), where('citizenId', '==', citizenId)));
        if (snap.docs.length > 0) {
            return snap.docs.map((d) => ({ id: d.id, ...d.data() }));
        }
    } catch (err) {
        console.warn('Firestore index query failed, falling back to client filter:', err);
    }
    const allSnap = await getDocs(collection(db, COMPLAINTS_COL));
    return allSnap.docs
        .map((d) => ({ id: d.id, ...d.data() }))
        .filter((c) => c.citizenId === citizenId)
        .sort((a, b) => (b.createdAt || '').localeCompare(a.createdAt || ''));
}
export async function getComplaintsByDepartment(department) {
    const snap = await getDocs(query(collection(db, COMPLAINTS_COL), where('department', '==', department)));
    return snap.docs.map((d) => ({ id: d.id, ...d.data() }));
}
export async function getComplaintById(id) {
    const snap = await getDoc(doc(db, COMPLAINTS_COL, id));
    return snap.exists() ? { id: snap.id, ...snap.data() } : null;
}
export async function assignComplaint(complaintId, workerId) {
    await updateDoc(doc(db, COMPLAINTS_COL, complaintId), {
        status: 'Assigned',
        assignedWorker: workerId,
        assignedAt: new Date().toISOString(),
    });
    return getComplaintById(complaintId);
}
export async function resolveComplaint(complaintId) {
    await updateDoc(doc(db, COMPLAINTS_COL, complaintId), {
        status: 'Resolved',
        resolvedAt: new Date().toISOString(),
    });
    return getComplaintById(complaintId);
}
export async function getComplaintStats() {
    const all = await getAllComplaints();
    const now = new Date();
    const total = all.length;
    const pending = all.filter((c) => c.status === 'Pending').length;
    const assigned = all.filter((c) => c.status === 'Assigned' || c.status === 'In Progress').length;
    const resolved = all.filter((c) => c.status === 'Resolved').length;
    const highPriority = all.filter((c) => c.urgency === 'High').length;
    const inProgress = all.filter((c) => c.status === 'In Progress').length;
    const slaBreaches = all.filter((c) => {
        if (c.status === 'Resolved') return false;
        return c.slaDeadline && new Date(c.slaDeadline) < now;
    }).length;
    const resolvedWithTimes = all.filter((c) => c.resolvedAt && c.assignedAt);
    const avgResolutionTime = resolvedWithTimes.length > 0
        ? Math.round(resolvedWithTimes.reduce((acc, c) => {
            return acc + (new Date(c.resolvedAt) - new Date(c.assignedAt)) / (1000 * 60 * 60);
        }, 0) / resolvedWithTimes.length)
        : 0;
    return { total, pending, assigned, resolved, highPriority, inProgress, slaBreaches, avgResolutionTime };
}
