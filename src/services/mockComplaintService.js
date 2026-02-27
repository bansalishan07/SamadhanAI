import { complaints } from '../mockData/complaints';
const delay = (ms) => new Promise((resolve) => setTimeout(resolve, ms));
let complaintsList = [...complaints];
export const mockComplaintService = {
    async getAll() {
        await delay(500);
        return [...complaintsList];
    },
    async getByCitizen(citizenId) {
        await delay(500);
        return complaintsList.filter((c) => c.citizenId === citizenId);
    },
    async getBySupervisor(supervisorId) {
        await delay(500);
        return complaintsList.filter((c) => c.supervisorId === supervisorId);
    },
    async submit(complaintData) {
        await delay(1200);
        const newComplaint = {
            id: `GRV-2026-${String(complaintsList.length + 1).padStart(3, '0')}`,
            ...complaintData,
            status: 'Assigned',
            createdAt: new Date().toISOString().split('T')[0],
            updatedAt: new Date().toISOString().split('T')[0],
        };
        complaintsList = [newComplaint, ...complaintsList];
        return newComplaint;
    },
    async resolve(complaintId) {
        await delay(800);
        complaintsList = complaintsList.map((c) =>
            c.id === complaintId
                ? { ...c, status: 'Resolved', updatedAt: new Date().toISOString().split('T')[0] }
                : c
        );
        return complaintsList.find((c) => c.id === complaintId);
    },
    async getStats() {
        await delay(300);
        const total = complaintsList.length;
        const pending = complaintsList.filter((c) => c.status === 'Pending').length;
        const resolved = complaintsList.filter((c) => c.status === 'Resolved').length;
        const highPriority = complaintsList.filter((c) => c.urgency === 'High').length;
        const assigned = complaintsList.filter((c) => c.status === 'Assigned').length;
        const inProgress = complaintsList.filter((c) => c.status === 'In Progress').length;
        return { total, pending, resolved, highPriority, assigned, inProgress };
    },
};
