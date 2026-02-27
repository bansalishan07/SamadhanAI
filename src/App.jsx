import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { Toaster } from 'react-hot-toast';
import { AuthProvider } from './context/AuthContext';
import ProtectedRoute from './components/ProtectedRoute/ProtectedRoute';
import FloatingChatbot from './components/FloatingChatbot/FloatingChatbot';
import DashboardLayout from './layouts/DashboardLayout/DashboardLayout';
import Landing from './pages/Landing/Landing';
import Login from './pages/Auth/Login';
import Register from './pages/Auth/Register';
import CitizenDashboard from './pages/Citizen/Dashboard/CitizenDashboard';
import SubmitComplaint from './pages/Citizen/SubmitComplaint/SubmitComplaint';
import MyComplaints from './pages/Citizen/MyComplaints/MyComplaints';
import Profile from './pages/Citizen/Profile/Profile';
import OfficerOverview from './pages/Officer/Overview/OfficerOverview';
import IncomingComplaints from './pages/Officer/IncomingComplaints/IncomingComplaints';
import WorkerManagement from './pages/Officer/WorkerManagement/WorkerManagement';
import OfficerAnalytics from './pages/Officer/Analytics/OfficerAnalytics';
import ComplaintDetail from './pages/Officer/ComplaintDetail/ComplaintDetail';
import SeedDatabase from './pages/SeedDatabase';
import AdminDashboard from './pages/Admin/Dashboard/AdminDashboard';
import GeoIntelligence from './pages/Admin/GeoIntelligence/GeoIntelligence';
import VoiceComplaint from './pages/Citizen/VoiceComplaint/VoiceComplaint';
import {
    HiOutlineHome, HiOutlinePlusCircle, HiOutlineClipboardList,
    HiOutlineUser, HiOutlineChartBar, HiOutlineOfficeBuilding,
    HiOutlineViewGrid, HiOutlineUserGroup, HiOutlineInbox, HiOutlineLocationMarker,
    HiOutlineMicrophone
} from 'react-icons/hi';
const citizenLinks = [
    { path: '/citizen/dashboard', label: 'Dashboard', icon: <HiOutlineHome /> },
    { path: '/citizen/submit', label: 'Submit Complaint', icon: <HiOutlinePlusCircle /> },
    { path: '/citizen/voice-complaint', label: 'AI Voice Register', icon: <HiOutlineMicrophone />, highlight: true },
    { path: '/citizen/complaints', label: 'My Complaints', icon: <HiOutlineClipboardList /> },
    { path: '/citizen/profile', label: 'Profile', icon: <HiOutlineUser /> },
];
const supervisorLinks = [
    { path: '/officer/overview', label: 'Overview', icon: <HiOutlineViewGrid /> },
    { path: '/officer/incoming', label: 'Active Complaints', icon: <HiOutlineInbox /> },
    { path: '/officer/workers', label: 'Worker Management', icon: <HiOutlineUserGroup /> },
    { path: '/officer/analytics', label: 'Performance Analytics', icon: <HiOutlineChartBar /> },
    { path: '/officer/profile', label: 'Profile', icon: <HiOutlineUser /> },
];
const adminLinks = [
    { path: '/admin/dashboard', label: 'Overview', icon: <HiOutlineViewGrid /> },
    { path: '/admin/geo', label: 'Geo-Intelligence', icon: <HiOutlineLocationMarker /> },
    { path: '/admin/complaints', label: 'All Complaints', icon: <HiOutlineClipboardList /> },
];
export default function App() {
    return (
        <AuthProvider>
            <BrowserRouter>
                <Toaster
                    position="top-right"
                    toastOptions={{
                        duration: 3000,
                        style: {
                            background: 'var(--bg-card)',
                            color: 'var(--text-primary)',
                            border: '1px solid var(--border-color)',
                            borderRadius: '8px',
                            fontSize: '0.875rem',
                        },
                    }}
                />
                <Routes>
                    { }
                    <Route path="/" element={<Landing />} />
                    <Route path="/login" element={<Login />} />
                    <Route path="/register" element={<Register />} />
                    <Route path="/seed" element={<SeedDatabase />} />
                    { }
                    <Route
                        element={
                            <ProtectedRoute allowedRoles={['Citizen']}>
                                <DashboardLayout sidebarLinks={citizenLinks} />
                            </ProtectedRoute>
                        }
                    >
                        <Route path="/citizen/dashboard" element={<CitizenDashboard />} />
                        <Route path="/citizen/submit" element={<SubmitComplaint />} />
                        <Route path="/citizen/voice-complaint" element={<VoiceComplaint />} />
                        <Route path="/citizen/complaints" element={<MyComplaints />} />
                        <Route path="/citizen/complaint/:id" element={<ComplaintDetail />} />
                        <Route path="/citizen/profile" element={<Profile />} />
                    </Route>
                    { }
                    <Route
                        element={
                            <ProtectedRoute allowedRoles={['Ward Supervisor']}>
                                <DashboardLayout sidebarLinks={supervisorLinks} />
                            </ProtectedRoute>
                        }
                    >
                        <Route path="/officer/overview" element={<OfficerOverview />} />
                        <Route path="/officer/incoming" element={<IncomingComplaints />} />
                        <Route path="/officer/workers" element={<WorkerManagement />} />
                        <Route path="/officer/analytics" element={<OfficerAnalytics />} />
                        <Route path="/officer/complaint/:id" element={<ComplaintDetail />} />
                        <Route path="/officer/profile" element={<Profile />} />
                    </Route>
                    { }
                    <Route
                        element={
                            <ProtectedRoute allowedRoles={['District Civic Administrator']}>
                                <DashboardLayout sidebarLinks={adminLinks} />
                            </ProtectedRoute>
                        }
                    >
                        <Route path="/admin/dashboard" element={<AdminDashboard />} />
                        <Route path="/admin/geo" element={<GeoIntelligence />} />
                        <Route path="/admin/complaints" element={<MyComplaints />} />
                    </Route>
                    { }
                    <Route path="*" element={<Navigate to="/" replace />} />
                </Routes>
                <FloatingChatbot />
            </BrowserRouter>
        </AuthProvider>
    );
}
