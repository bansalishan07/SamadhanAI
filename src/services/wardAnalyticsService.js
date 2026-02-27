/**
 * Ward Analytics Service
 * Computes ward-level and district-level performance metrics
 * entirely client-side from Firebase complaint data.
 */

const TWO_HOURS_MS = 2 * 60 * 60 * 1000;
const FORTY_EIGHT_HOURS_MS = 48 * 60 * 60 * 1000;

/**
 * Compute per-ward analytics from a flat list of complaints.
 * Each complaint must have: location, status, createdAt, assignedAt, resolvedAt, slaDeadline, urgency
 */
export function computeWardAnalytics(complaints) {
    const wardMap = {};

    for (const c of complaints) {
        const ward = c.location || 'Unknown';
        if (!wardMap[ward]) {
            wardMap[ward] = {
                ward,
                total: 0,
                active: 0,
                resolved: 0,
                escalated: 0,
                assignedOnTime: 0,
                assignable: 0, // complaints that have assignedAt
                resolvedOnTime: 0,
                resolvable: 0, // complaints that have resolvedAt
                totalResolutionMs: 0,
                resolvedCount: 0,
            };
        }
        const w = wardMap[ward];
        w.total++;

        if (c.status === 'Resolved') {
            w.resolved++;
        } else {
            w.active++;
        }

        // Escalated = SLA breached and not resolved
        const now = new Date();
        if (c.status !== 'Resolved' && c.slaDeadline && new Date(c.slaDeadline) < now) {
            w.escalated++;
        }

        // On-Time Assignment (assigned within 2 hours of creation)
        if (c.assignedAt && c.createdAt) {
            w.assignable++;
            const assignDelay = new Date(c.assignedAt) - new Date(c.createdAt);
            if (assignDelay <= TWO_HOURS_MS) {
                w.assignedOnTime++;
            }
        }

        // On-Time Resolution (resolved within 48 hours of creation)
        if (c.resolvedAt && c.createdAt) {
            w.resolvable++;
            const resTime = new Date(c.resolvedAt) - new Date(c.createdAt);
            w.totalResolutionMs += resTime;
            w.resolvedCount++;
            if (resTime <= FORTY_EIGHT_HOURS_MS) {
                w.resolvedOnTime++;
            }
        }
    }

    // Compute derived metrics
    return Object.values(wardMap).map((w) => {
        const onTimeAssignmentRate = w.assignable > 0 ? w.assignedOnTime / w.assignable : 0;
        const onTimeResolutionRate = w.resolvable > 0 ? w.resolvedOnTime / w.resolvable : 0;
        const avgResolutionHours = w.resolvedCount > 0
            ? Math.round(w.totalResolutionMs / w.resolvedCount / (1000 * 60 * 60) * 10) / 10
            : 0;
        const escalationRate = w.total > 0 ? w.escalated / w.total : 0;

        // Speed score: inverse of avg resolution time, normalized 0-1 (48h = 0.5, 0h = 1, 96h+ = 0)
        const speedScore = avgResolutionHours > 0
            ? Math.max(0, Math.min(1, 1 - (avgResolutionHours / 96)))
            : 1;

        // Performance Score
        const performanceScore = Math.round((
            0.4 * onTimeResolutionRate +
            0.3 * onTimeAssignmentRate +
            0.2 * (1 - escalationRate) +
            0.1 * speedScore
        ) * 100);

        const isUnderperforming =
            (w.resolvable > 0 && onTimeResolutionRate < 0.6) ||
            avgResolutionHours > 48 ||
            escalationRate > 0.3;

        return {
            ward: w.ward,
            total: w.total,
            active: w.active,
            resolved: w.resolved,
            escalated: w.escalated,
            avgResolutionHours,
            onTimeAssignmentRate: Math.round(onTimeAssignmentRate * 100),
            onTimeResolutionRate: Math.round(onTimeResolutionRate * 100),
            performanceScore,
            isUnderperforming,
        };
    }).sort((a, b) => b.total - a.total);
}

/**
 * Compute district-level overview KPIs
 */
export function computeDistrictOverview(complaints) {
    const now = new Date();
    const total = complaints.length;
    const active = complaints.filter(c => c.status !== 'Resolved').length;
    const resolved = complaints.filter(c => c.status === 'Resolved').length;
    const escalated = complaints.filter(c =>
        c.status !== 'Resolved' && c.slaDeadline && new Date(c.slaDeadline) < now
    ).length;

    // Avg resolution time
    const resolvedWithTimes = complaints.filter(c => c.resolvedAt && c.createdAt);
    const avgResolutionHours = resolvedWithTimes.length > 0
        ? Math.round(resolvedWithTimes.reduce((acc, c) =>
            acc + (new Date(c.resolvedAt) - new Date(c.createdAt)) / (1000 * 60 * 60), 0
        ) / resolvedWithTimes.length * 10) / 10
        : 0;

    // On-time resolution rate
    const onTimeResolved = resolvedWithTimes.filter(c => {
        const resTime = new Date(c.resolvedAt) - new Date(c.createdAt);
        return resTime <= FORTY_EIGHT_HOURS_MS;
    }).length;
    const onTimeResolutionRate = resolvedWithTimes.length > 0
        ? Math.round(onTimeResolved / resolvedWithTimes.length * 100)
        : 0;

    // Assignment delay rate
    const withAssignment = complaints.filter(c => c.assignedAt && c.createdAt);
    const lateAssignments = withAssignment.filter(c => {
        const delay = new Date(c.assignedAt) - new Date(c.createdAt);
        return delay > TWO_HOURS_MS;
    }).length;
    const assignmentDelayRate = withAssignment.length > 0
        ? Math.round(lateAssignments / withAssignment.length * 100)
        : 0;

    return {
        total,
        active,
        resolved,
        escalated,
        avgResolutionHours,
        onTimeResolutionRate,
        assignmentDelayRate,
    };
}

/**
 * Compute escalation trend for the last 30 days
 */
export function computeEscalationTrend(complaints) {
    const now = new Date();
    const days = [];

    for (let i = 29; i >= 0; i--) {
        const date = new Date(now);
        date.setDate(date.getDate() - i);
        const dateStr = date.toISOString().slice(0, 10);
        const label = date.toLocaleDateString('en-IN', { day: 'numeric', month: 'short' });

        const dayComplaints = complaints.filter(c => {
            if (!c.createdAt) return false;
            return c.createdAt.slice(0, 10) === dateStr;
        });

        const escalated = dayComplaints.filter(c =>
            c.status !== 'Resolved' && c.slaDeadline && new Date(c.slaDeadline) < now
        ).length;

        days.push({ date: label, complaints: dayComplaints.length, escalated });
    }

    return days;
}
