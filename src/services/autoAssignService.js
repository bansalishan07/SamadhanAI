import { getWorkers, incrementWorkerTasks } from './firebaseWorkerService';
import { assignComplaint } from './firebaseComplaintService';
const WEIGHTS = {
    WORKLOAD: 0.30,
    SKILL_MATCH: 0.35,
    AVAILABILITY: 0.20,
    EXPERIENCE: 0.15,
};
const MAX_TASKS = 8;
const CATEGORY_ROLE_MAP = {
    'Roads & Infrastructure': ['Road Contractor', 'Mason', 'Civil Engineer'],
    'Drainage': ['Drainage Worker', 'Pipeline Technician', 'Plumber'],
    'Water Supply': ['Plumber', 'Pipeline Technician', 'Water Inspector'],
    'Electricity': ['Electrician', 'Line Inspector', 'Electrical Engineer'],
    'Sanitation': ['Sanitation Worker', 'Waste Collector', 'Hygiene Inspector'],
    'Pollution': ['Sanitation Worker', 'Waste Collector', 'Drainage Worker'],
    'Traffic': ['Road Contractor', 'Mason'],
    'Encroachment': ['Mason', 'Road Contractor'],
    'Education': ['Civil Engineer', 'Mason'],
    'Social Welfare': ['Sanitation Worker', 'Road Contractor'],
};
const DEPARTMENT_SKILL_MAP = {
    'Electricity Department': ['Electrician', 'Line Inspector', 'Electrical Engineer'],
    'Water Department': ['Plumber', 'Pipeline Technician', 'Water Inspector'],
    'Water Resources Department': ['Plumber', 'Pipeline Technician', 'Water Inspector'],
    'Public Works': ['Road Contractor', 'Mason', 'Drainage Worker', 'Civil Engineer'],
    'Public Works Department': ['Road Contractor', 'Mason', 'Drainage Worker', 'Civil Engineer'],
    'Sanitation Department': ['Sanitation Worker', 'Waste Collector', 'Hygiene Inspector'],
    'Roads & Infrastructure': ['Road Contractor', 'Mason', 'Civil Engineer'],
    'Municipal Corporation': ['Road Contractor', 'Mason', 'Sanitation Worker'],
};
const SKILL_LEVELS = {
    'Junior': 1,
    'Mid': 2,
    'Senior': 3,
};
function workloadScore(worker) {
    const active = worker.activeTasks || 0;
    if (active >= MAX_TASKS) return 0;
    return 1 - (active / MAX_TASKS);
}
function skillMatchScore(worker, department, category) {
    const categoryRoles = CATEGORY_ROLE_MAP[category] || [];
    if (categoryRoles.length > 0) {
        const roleIndex = categoryRoles.indexOf(worker.role);
        if (roleIndex === 0) return 1.0;
        if (roleIndex === 1) return 0.85;
        if (roleIndex >= 2) return 0.7;
    }
    const deptRoles = DEPARTMENT_SKILL_MAP[department] || [];
    if (deptRoles.length > 0) {
        return deptRoles.includes(worker.role) ? 0.6 : 0.3;
    }
    return worker.department === department ? 0.5 : 0.3;
}
function availabilityScore(worker) {
    const status = (worker.status || '').toLowerCase();
    if (status === 'overloaded' || status === 'inactive' || status === 'unavailable') {
        return 0;
    }
    return 1;
}
function experienceScore(worker, urgency) {
    const level = SKILL_LEVELS[worker.skillLevel] || SKILL_LEVELS['Mid'];
    const normalizedLevel = level / 3;
    if (urgency === 'High') {
        return normalizedLevel;
    }
    return 0.5 + (normalizedLevel * 0.5);
}
export function scoreWorker(worker, department, urgency, category = '') {
    const wl = workloadScore(worker);
    const sm = skillMatchScore(worker, department, category);
    const av = availabilityScore(worker);
    const ex = experienceScore(worker, urgency);
    const total =
        (WEIGHTS.WORKLOAD * wl) +
        (WEIGHTS.SKILL_MATCH * sm) +
        (WEIGHTS.AVAILABILITY * av) +
        (WEIGHTS.EXPERIENCE * ex);
    return {
        total: Math.round(total * 100) / 100,
        breakdown: {
            workload: Math.round(wl * 100),
            skillMatch: Math.round(sm * 100),
            availability: Math.round(av * 100),
            experience: Math.round(ex * 100),
        },
    };
}
export function findBestWorker(workers, department, urgency, category = '') {
    if (!workers || workers.length === 0) return null;
    let bestWorker = null;
    let bestScore = -1;
    let bestBreakdown = null;
    for (const worker of workers) {
        const result = scoreWorker(worker, department, urgency, category);
        if (result.breakdown.skillMatch === 0) continue;
        if (result.breakdown.availability === 0) continue;
        if (result.total > bestScore) {
            bestScore = result.total;
            bestWorker = worker;
            bestBreakdown = result;
        }
    }
    if (!bestWorker) return null;
    return { worker: bestWorker, score: bestBreakdown };
}
export async function autoAssignComplaint(complaintId, department, urgency, category = '') {
    try {
        const allWorkers = await getWorkers();
        if (allWorkers.length === 0) {
            console.warn('⚠️ No workers found in the system');
            return { assigned: false, reason: 'No workers available in the system' };
        }
        const result = findBestWorker(allWorkers, department, urgency, category);
        if (!result) {
            console.warn(`⚠️ No matching worker for department: ${department}`);
            return { assigned: false, reason: `No workers available for ${department}` };
        }
        await assignComplaint(complaintId, result.worker.id);
        await incrementWorkerTasks(result.worker.id);
        console.log(`✅ Auto-assigned to ${result.worker.name} (Score: ${result.score.total})`, result.score.breakdown);
        return {
            assigned: true,
            worker: result.worker,
            score: result.score,
        };
    } catch (error) {
        console.error('❌ Auto-assignment failed:', error);
        return { assigned: false, reason: error.message };
    }
}
