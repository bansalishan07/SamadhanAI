export const validateEmail = (email) => {
    const re = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    return re.test(email);
};
export const validateAadhaar = (aadhaar) => {
    return /^\d{12}$/.test(aadhaar);
};
export const validatePassword = (password) => {
    return password.length >= 6;
};
export const formatDate = (dateStr) => {
    const date = new Date(dateStr);
    return date.toLocaleDateString('en-IN', {
        day: '2-digit',
        month: 'short',
        year: 'numeric',
    });
};
export const getUrgencyColor = (urgency) => {
    switch (urgency) {
        case 'High': return { bg: '#fef2f2', color: '#dc2626', border: '#fecaca' };
        case 'Medium': return { bg: '#fffbeb', color: '#d97706', border: '#fde68a' };
        case 'Low': return { bg: '#ecfdf5', color: '#059669', border: '#a7f3d0' };
        default: return { bg: '#f3f4f6', color: '#6b7280', border: '#e5e7eb' };
    }
};
export const getStatusColor = (status) => {
    switch (status) {
        case 'Resolved': return { bg: '#ecfdf5', color: '#059669', border: '#a7f3d0' };
        case 'In Progress': return { bg: '#eff6ff', color: '#2563eb', border: '#bfdbfe' };
        case 'Assigned': return { bg: '#fffbeb', color: '#d97706', border: '#fde68a' };
        case 'Pending': return { bg: '#fef2f2', color: '#dc2626', border: '#fecaca' };
        default: return { bg: '#f3f4f6', color: '#6b7280', border: '#e5e7eb' };
    }
};
