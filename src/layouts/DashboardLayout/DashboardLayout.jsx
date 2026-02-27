import { useState } from 'react';
import { Outlet } from 'react-router-dom';
import Navbar from '../../components/Navbar/Navbar';
import Sidebar from '../../components/Sidebar/Sidebar';
import { HiOutlineMenuAlt2 } from 'react-icons/hi';
import './DashboardLayout.css';
export default function DashboardLayout({ sidebarLinks }) {
    const [sidebarOpen, setSidebarOpen] = useState(false);
    return (
        <div className="dashboard-layout">
            <Navbar />
            <div className="dashboard-body">
                <Sidebar
                    links={sidebarLinks}
                    isOpen={sidebarOpen}
                    onClose={() => setSidebarOpen(false)}
                />
                <main className="dashboard-main">
                    <button className="sidebar-toggle-btn" onClick={() => setSidebarOpen(true)}>
                        <HiOutlineMenuAlt2 size={20} />
                    </button>
                    <Outlet />
                </main>
            </div>
        </div>
    );
}
