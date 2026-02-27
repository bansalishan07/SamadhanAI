import {
    collection, doc, addDoc, getDoc, getDocs, updateDoc, deleteDoc, query, where
} from 'firebase/firestore';
import { db } from '../firebase';
const WORKERS_COL = 'workers';
export async function getWorkers() {
    const snap = await getDocs(collection(db, WORKERS_COL));
    const all = snap.docs.map((d) => ({ id: d.id, ...d.data() }));
    const seen = new Map();
    for (const w of all) {
        if (!seen.has(w.name)) seen.set(w.name, w);
    }
    return Array.from(seen.values());
}
export async function getWorkersByDepartment(department) {
    const snap = await getDocs(query(collection(db, WORKERS_COL), where('department', '==', department)));
    const all = snap.docs.map((d) => ({ id: d.id, ...d.data() }));
    const seen = new Map();
    for (const w of all) {
        if (!seen.has(w.name)) seen.set(w.name, w);
    }
    return Array.from(seen.values());
}
export async function getWorkerById(id) {
    const snap = await getDoc(doc(db, WORKERS_COL, id));
    return snap.exists() ? { id: snap.id, ...snap.data() } : null;
}
export async function addWorker(workerData) {
    const docRef = await addDoc(collection(db, WORKERS_COL), {
        ...workerData,
        activeTasks: 0,
        completedTasks: 0,
        totalTasks: 0,
        avgResolutionTime: 0,
        status: 'Active',
        joinedAt: new Date().toISOString().split('T')[0],
    });
    return { id: docRef.id, ...workerData };
}
export async function updateWorker(workerId, updates) {
    await updateDoc(doc(db, WORKERS_COL, workerId), updates);
    return getWorkerById(workerId);
}
export async function removeWorker(workerId) {
    await deleteDoc(doc(db, WORKERS_COL, workerId));
    return true;
}
export async function incrementWorkerTasks(workerId) {
    const worker = await getWorkerById(workerId);
    if (!worker) return;
    const newActive = (worker.activeTasks || 0) + 1;
    const newTotal = (worker.totalTasks || 0) + 1;
    await updateDoc(doc(db, WORKERS_COL, workerId), {
        activeTasks: newActive,
        totalTasks: newTotal,
        status: newActive >= 5 ? 'Overloaded' : 'Active',
    });
}
export async function completeWorkerTask(workerId) {
    const worker = await getWorkerById(workerId);
    if (!worker) return;
    await updateDoc(doc(db, WORKERS_COL, workerId), {
        activeTasks: Math.max(0, (worker.activeTasks || 0) - 1),
        completedTasks: (worker.completedTasks || 0) + 1,
        status: Math.max(0, (worker.activeTasks || 0) - 1) >= 5 ? 'Overloaded' : 'Active',
    });
}
