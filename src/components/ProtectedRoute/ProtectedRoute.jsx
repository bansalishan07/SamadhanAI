import { Navigate } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
export default function ProtectedRoute({ children, allowedRoles }) {
    const { user } = useAuth();
    if (!user) {
        return <Navigate to="/login" replace />;
    }
    if (allowedRoles && !allowedRoles.includes(user.role)) {
        const dashboardMap = {
            Citizen: '/citizen/dashboard',
            'Ward Supervisor': '/officer/overview',
            'District Civic Administrator': '/admin/dashboard',
        };
        return <Navigate to={dashboardMap[user.role] || '/'} replace />;
    }
    return children;
}
