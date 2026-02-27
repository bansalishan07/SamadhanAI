import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import { HiOutlineMenuAlt3, HiX } from 'react-icons/hi';
import { useState } from 'react';
import './Navbar.css';
export default function Navbar() {
    const { user, logout } = useAuth();
    const navigate = useNavigate();
    const [mobileOpen, setMobileOpen] = useState(false);
    const handleLogout = () => {
        logout();
        navigate('/');
    };
    const getDashboardPath = () => {
        if (!user) return '/';
        switch (user.role) {
            case 'Citizen': return '/citizen/dashboard';
            case 'Ward Supervisor': return '/officer/overview';
            case 'District Civic Administrator': return '/admin/dashboard';
            default: return '/';
        }
    };
    return (
        <nav className="navbar">
            <div className="navbar-container">
                <Link to={user ? getDashboardPath() : '/'} className="navbar-brand">
                    <div className="navbar-logo">
                        <svg width="34" height="34" viewBox="0 0 34 34" fill="none">
                            <rect width="34" height="34" rx="8" fill="#1a56db" />
                            {}
                            <circle cx="17" cy="17" r="9" stroke="white" strokeWidth="1.5" fill="none" />
                            <circle cx="17" cy="17" r="3" fill="white" />
                            {}
                            {[...Array(12)].map((_, i) => {
                                const angle = (i * 30) * Math.PI / 180;
                                const x1 = 17 + 3.5 * Math.cos(angle);
                                const y1 = 17 + 3.5 * Math.sin(angle);
                                const x2 = 17 + 8.5 * Math.cos(angle);
                                const y2 = 17 + 8.5 * Math.sin(angle);
                                return <line key={i} x1={x1} y1={y1} x2={x2} y2={y2} stroke="white" strokeWidth="1.2" />;
                            })}
                        </svg>
                    </div>
                    <div className="navbar-brand-text">
                        <span className="navbar-title">समस्या SATHI</span>
                    </div>
                </Link>
                <div className={`navbar-links ${mobileOpen ? 'open' : ''}`}>
                    {!user ? (
                        <>
                            <Link to="/login" className="navbar-link" onClick={() => setMobileOpen(false)}>Login</Link>
                            <Link to="/register" className="navbar-link navbar-link-primary" onClick={() => setMobileOpen(false)}>Register</Link>
                        </>
                    ) : (
                        <>
                            <span className="navbar-user">
                                <span className="navbar-user-avatar">{user.name.charAt(0)}</span>
                                {user.name}
                            </span>
                            <button onClick={handleLogout} className="navbar-link navbar-link-danger">
                                Logout
                            </button>
                        </>
                    )}
                </div>
                <button className="navbar-mobile-toggle" onClick={() => setMobileOpen(!mobileOpen)}>
                    {mobileOpen ? <HiX size={24} /> : <HiOutlineMenuAlt3 size={24} />}
                </button>
            </div>
        </nav>
    );
}
