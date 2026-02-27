import { NavLink, useNavigate } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import { HiX } from 'react-icons/hi';
import './Sidebar.css';
export default function Sidebar({ links, isOpen, onClose }) {
    const { logout } = useAuth();
    const navigate = useNavigate();
    const handleLogout = () => {
        logout();
        navigate('/');
    };
    return (
        <>
            {isOpen && <div className="sidebar-overlay" onClick={onClose} />}
            <aside className={`sidebar ${isOpen ? 'sidebar-open' : ''}`}>
                <div className="sidebar-header">
                    <h3 className="sidebar-heading">Navigation</h3>
                    <button className="sidebar-close" onClick={onClose}>
                        <HiX size={20} />
                    </button>
                </div>
                <nav className="sidebar-nav">
                    {links.map((link) => (
                        <NavLink
                            key={link.path}
                            to={link.path}
                            className={({ isActive }) => `sidebar-link ${isActive ? 'sidebar-link-active' : ''} ${link.highlight ? 'sidebar-link-highlight' : ''}`}
                            onClick={onClose}
                        >
                            <span className="sidebar-link-icon">{link.icon}</span>
                            <span className="sidebar-link-text">{link.label}</span>
                            {link.highlight && <span className="sidebar-ai-badge">AI</span>}
                        </NavLink>
                    ))}
                </nav>
                <div className="sidebar-footer">
                    <button onClick={handleLogout} className="sidebar-logout">
                        <span>🚪</span>
                        <span>Logout</span>
                    </button>
                </div>
            </aside>
        </>
    );
}
