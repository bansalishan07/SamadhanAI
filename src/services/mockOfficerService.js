import { workers as initialWorkers, officerComplaints as initialComplaints } from '../mockData/officerData';
const delay = (ms) => new Promise((r) => setTimeout(r, ms));
let workersList = [...initialWorkers];
let complaintsList = [...initialComplaints];
export const mockOfficerService = {
    async getComplaints() {
        await delay(500);
        return [...complaintsList];
    },
    async assignComplaint(complaintId, workerId) {
        await delay(800);
        complaintsList = complaintsList.map((c) =>
            c.id === complaintId
                ? { ...c, status: 'Assigned', assignedWorker: workerId, assignedAt: new Date().toISOString() }
                : c
        );
        workersList = workersList.map((w) =>
            w.id === workerId
                ? { ...w, activeTasks: w.activeTasks + 1, totalTasks: w.totalTasks + 1, status: w.activeTasks + 1 >= 5 ? 'Overloaded' : 'Active' }
                : w
        );
        return complaintsList.find((c) => c.id === complaintId);
    },
    async resolveComplaint(complaintId) {
        await delay(800);
        const complaint = complaintsList.find((c) => c.id === complaintId);
        if (!complaint) throw new Error('Complaint not found');
        const resolvedAt = new Date().toISOString();
        complaintsList = complaintsList.map((c) =>
            c.id === complaintId ? { ...c, status: 'Resolved', resolvedAt } : c
        );
        if (complaint.assignedWorker) {
            workersList = workersList.map((w) =>
                w.id === complaint.assignedWorker
                    ? { ...w, activeTasks: Math.max(0, w.activeTasks - 1), completedTasks: w.completedTasks + 1 }
                    : w
            );
        }
        return complaintsList.find((c) => c.id === complaintId);
    },
    async getComplaintById(id) {
        await delay(300);
        return complaintsList.find((c) => c.id === id) || null;
    },
    async getWorkers() {
        await delay(400);
        return [...workersList];
    },
    async addWorker(workerData) {
        await delay(600);
        const newWorker = {
            id: `worker-${Date.now()}`,
            ...workerData,
            activeTasks: 0,
            completedTasks: 0,
            totalTasks: 0,
            avgResolutionTime: 0,
            status: 'Active',
            joinedAt: new Date().toISOString().split('T')[0],
        };
        workersList = [...workersList, newWorker];
        return newWorker;
    },
    async removeWorker(workerId) {
        await delay(500);
        workersList = workersList.filter((w) => w.id !== workerId);
        return true;
    },
    async updateWorker(workerId, updates) {
        await delay(500);
        workersList = workersList.map((w) =>
            w.id === workerId ? { ...w, ...updates } : w
        );
        return workersList.find((w) => w.id === workerId);
    },
    async getStats() {
        await delay(300);
        const total = complaintsList.length;
        const pending = complaintsList.filter((c) => c.status === 'Pending').length;
        const assigned = complaintsList.filter((c) => c.status === 'Assigned' || c.status === 'In Progress').length;
        const resolved = complaintsList.filter((c) => c.status === 'Resolved').length;
        const highPriority = complaintsList.filter((c) => c.urgency === 'High').length;
        const now = new Date();
        const slaBreaches = complaintsList.filter((c) => {
            if (c.status === 'Resolved') return false;
            return new Date(c.slaDeadline) < now;
        }).length;
        const resolvedComplaints = complaintsList.filter((c) => c.resolvedAt && c.assignedAt);
        const avgResTime = resolvedComplaints.length > 0
            ? resolvedComplaints.reduce((acc, c) => {
                const hours = (new Date(c.resolvedAt) - new Date(c.assignedAt)) / (1000 * 60 * 60);
                return acc + hours;
            }, 0) / resolvedComplaints.length
            : 0;
        return { total, pending, assigned, resolved, highPriority, slaBreaches, avgResolutionTime: Math.round(avgResTime) };
    },
    async getInsights() {
        await delay(400);
        const avgTimes = workersList.map((w) => ({ name: w.name, avg: w.avgResolutionTime }));
        const deptAvg = avgTimes.reduce((a, b) => a + b.avg, 0) / avgTimes.length;
        const fastest = avgTimes.reduce((a, b) => a.avg < b.avg ? a : b);
        const now = new Date();
        const atRisk = complaintsList.filter((c) => {
            if (c.status === 'Resolved') return false;
            const deadline = new Date(c.slaDeadline);
            const hoursLeft = (deadline - now) / (1000 * 60 * 60);
            return hoursLeft > 0 && hoursLeft < 12;
        }).length;
        const slaBreaches = complaintsList.filter((c) => c.status !== 'Resolved' && new Date(c.slaDeadline) < now).length;
        return [
            `${fastest.name} is resolving complaints ${Math.round(((deptAvg - fastest.avg) / deptAvg) * 100)}% faster than department average.`,
            atRisk > 0 ? `${atRisk} complaint${atRisk > 1 ? 's are' : ' is'} at risk of SLA breach within 12 hours.` : 'All complaints are within SLA timelines.',
            slaBreaches > 0 ? `⚠️ ${slaBreaches} complaint${slaBreaches > 1 ? 's have' : ' has'} already breached SLA deadline.` : '✅ No SLA breaches detected.',
        ];
    },
};
