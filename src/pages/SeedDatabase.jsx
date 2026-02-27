import { useState } from 'react';
import { createUserWithEmailAndPassword } from 'firebase/auth';
import { doc, setDoc, collection, addDoc } from 'firebase/firestore';
import { auth, db } from '../firebase';
import Button from '../components/Button/Button';
import toast from 'react-hot-toast';
const SEED_USERS = [
    { email: 'citizen@demo.com', password: 'password123', name: 'Rahul Sharma', role: 'Citizen', aadhaar: '123456789012' },
    { email: 'citizen2@demo.com', password: 'password123', name: 'Priya Patel', role: 'Citizen', aadhaar: '234567890123' },
    { email: 'supervisor@demo.com', password: 'password123', name: 'Vikram Singh', role: 'Ward Supervisor', aadhaar: '345678901234' },
    { email: 'admin-sathi@demo.com', password: 'password123', name: 'Anita Desai', role: 'District Civic Administrator', aadhaar: '456789012345' },
];
const SEED_WORKERS = [
    { name: 'Ramesh Kumar', role: 'Electrician', department: 'Electricity Department', phone: '+91 98765 43210', activeTasks: 2, completedTasks: 18, totalTasks: 20, avgResolutionTime: 14, status: 'Active', skillLevel: 'Senior' },
    { name: 'Suresh Yadav', role: 'Electrician', department: 'Electricity Department', phone: '+91 98765 43211', activeTasks: 5, completedTasks: 12, totalTasks: 17, avgResolutionTime: 22, status: 'Overloaded', skillLevel: 'Mid' },
    { name: 'Dinesh Meena', role: 'Electrician', department: 'Electricity Department', phone: '+91 98765 43212', activeTasks: 1, completedTasks: 25, totalTasks: 26, avgResolutionTime: 10, status: 'Active', skillLevel: 'Senior' },
    { name: 'Prakash Singh', role: 'Line Inspector', department: 'Electricity Department', phone: '+91 98765 43213', activeTasks: 3, completedTasks: 8, totalTasks: 11, avgResolutionTime: 30, status: 'Active', skillLevel: 'Mid' },
    { name: 'Anil Verma', role: 'Electrician', department: 'Electricity Department', phone: '+91 98765 43214', activeTasks: 0, completedTasks: 15, totalTasks: 15, avgResolutionTime: 12, status: 'Active', skillLevel: 'Junior' },
    { name: 'Rajendra Pal', role: 'Plumber', department: 'Water Department', phone: '+91 98765 55001', activeTasks: 1, completedTasks: 20, totalTasks: 21, avgResolutionTime: 16, status: 'Active', skillLevel: 'Senior' },
    { name: 'Mohan Lal', role: 'Pipeline Technician', department: 'Water Department', phone: '+91 98765 55002', activeTasks: 3, completedTasks: 14, totalTasks: 17, avgResolutionTime: 20, status: 'Active', skillLevel: 'Mid' },
    { name: 'Bharat Bhushan', role: 'Water Inspector', department: 'Water Department', phone: '+91 98765 55003', activeTasks: 0, completedTasks: 10, totalTasks: 10, avgResolutionTime: 18, status: 'Active', skillLevel: 'Junior' },
    { name: 'Harish Chandra', role: 'Road Contractor', department: 'Public Works', phone: '+91 98765 66001', activeTasks: 2, completedTasks: 22, totalTasks: 24, avgResolutionTime: 36, status: 'Active', skillLevel: 'Senior' },
    { name: 'Vijay Shankar', role: 'Mason', department: 'Public Works', phone: '+91 98765 66002', activeTasks: 4, completedTasks: 9, totalTasks: 13, avgResolutionTime: 40, status: 'Active', skillLevel: 'Mid' },
    { name: 'Gopal Das', role: 'Drainage Worker', department: 'Public Works', phone: '+91 98765 66003', activeTasks: 1, completedTasks: 16, totalTasks: 17, avgResolutionTime: 24, status: 'Active', skillLevel: 'Junior' },
    { name: 'Kailash Nath', role: 'Sanitation Worker', department: 'Sanitation Department', phone: '+91 98765 77001', activeTasks: 2, completedTasks: 30, totalTasks: 32, avgResolutionTime: 8, status: 'Active', skillLevel: 'Senior' },
    { name: 'Shyam Sundar', role: 'Waste Collector', department: 'Sanitation Department', phone: '+91 98765 77002', activeTasks: 1, completedTasks: 25, totalTasks: 26, avgResolutionTime: 6, status: 'Active', skillLevel: 'Mid' },
];
const SEED_COMPLAINTS = [
    { title: 'Frequent power cuts in Sector 8', description: 'Residents face daily power outages lasting 3-4 hours.', category: 'Electricity', department: 'Electricity Department', urgency: 'High', status: 'Pending', location: 'Sector 8, Main Market', citizenName: 'Rahul Sharma', confidence: 0.92 },
    { title: 'Exposed wires near school', description: 'Dangerous exposed wires near school entrance.', category: 'Electricity', department: 'Electricity Department', urgency: 'High', status: 'Pending', location: 'Govt School, Sector 7', citizenName: 'Priya Patel', confidence: 0.95 },
    { title: 'Streetlights not working', description: 'Multiple streetlights on main road non-functional for a week.', category: 'Electricity', department: 'Electricity Department', urgency: 'Medium', status: 'Pending', location: 'Sector 12, Main Road', citizenName: 'Amit Kumar', confidence: 0.88 },
    { title: 'Transformer sparking at night', description: 'Transformer near Rose Garden sparks at night, fire risk.', category: 'Electricity', department: 'Electricity Department', urgency: 'High', status: 'Pending', location: 'Rose Garden Colony', citizenName: 'Sunita Devi', confidence: 0.91 },
    { title: 'Water pipeline leaking on main road', description: 'Major leak on MG Road causing water wastage.', category: 'Water Supply', department: 'Water Department', urgency: 'High', status: 'Pending', location: 'MG Road, Ward 3', citizenName: 'Rahul Sharma', confidence: 0.89 },
    { title: 'Pothole causing accidents', description: 'Deep pothole near bus stand causing bike accidents.', category: 'Roads', department: 'Public Works', urgency: 'High', status: 'Pending', location: 'Bus Stand Area', citizenName: 'Priya Patel', confidence: 0.93 },
    { title: 'Garbage not collected for 5 days', description: 'No garbage collection in Nehru Nagar since Monday.', category: 'Sanitation', department: 'Sanitation Department', urgency: 'Medium', status: 'Pending', location: 'Nehru Nagar', citizenName: 'Rahul Sharma', confidence: 0.87 },
    { title: 'Broken drainage causing flooding', description: 'Blocked drain causes street flooding during rain.', category: 'Drainage', department: 'Public Works', urgency: 'Medium', status: 'Pending', location: 'Sector 5, Block C', citizenName: 'Priya Patel', confidence: 0.82 },
];
export default function SeedDatabase() {
    const [log, setLog] = useState([]);
    const [seeding, setSeeding] = useState(false);
    const addLog = (msg) => setLog((prev) => [...prev, `${new Date().toLocaleTimeString()} — ${msg}`]);
    const seedAll = async () => {
        setSeeding(true);
        setLog([]);
        addLog('🔐 Creating users in Firebase Auth...');
        const userIds = {};
        for (const u of SEED_USERS) {
            try {
                const cred = await createUserWithEmailAndPassword(auth, u.email, u.password);
                await setDoc(doc(db, 'users', cred.user.uid), {
                    uid: cred.user.uid, name: u.name, email: u.email, role: u.role, aadhaar: u.aadhaar, createdAt: new Date().toISOString(),
                });
                userIds[u.email] = cred.user.uid;
                addLog(`  ✅ Created ${u.role}: ${u.email}`);
            } catch (err) {
                if (err.code === 'auth/email-already-in-use') {
                    addLog(`  ⚠️ ${u.email} already exists — skipping`);
                } else {
                    addLog(`  ❌ Error creating ${u.email}: ${err.message}`);
                }
            }
        }
        addLog('👷 Creating workers in Firestore (all departments)...');
        for (const w of SEED_WORKERS) {
            try {
                const ref = await addDoc(collection(db, 'workers'), { ...w, joinedAt: '2025-06-15' });
                addLog(`  ✅ [${w.department}] ${w.name} — ${w.role}`);
            } catch (err) {
                addLog(`  ❌ Error creating worker ${w.name}: ${err.message}`);
            }
        }
        addLog('📋 Creating complaints in Firestore...');
        for (const c of SEED_COMPLAINTS) {
            try {
                const data = {
                    ...c,
                    citizenId: userIds['citizen@demo.com'] || 'unknown',
                    citizenEmail: 'citizen@demo.com',
                    createdAt: new Date().toISOString(),
                    slaDeadline: new Date(Date.now() + 48 * 60 * 60 * 1000).toISOString(),
                    assignedWorker: null,
                    assignedAt: null,
                    resolvedAt: null,
                };
                await addDoc(collection(db, 'complaints'), data);
                addLog(`  ✅ [${c.department}] ${c.title}`);
            } catch (err) {
                addLog(`  ❌ Error: ${err.message}`);
            }
        }
        addLog('');
        addLog('🎉 DATABASE SEEDING COMPLETE!');
        addLog(`   📊 ${SEED_USERS.length} users, ${SEED_WORKERS.length} workers, ${SEED_COMPLAINTS.length} complaints`);
        addLog('');
        addLog('Demo credentials:');
        addLog('  Citizen: citizen@demo.com / password123');
        addLog('  Ward Supervisor: supervisor@demo.com / password123');
        addLog('  Administrator:   admin-sathi@demo.com / password123');
        toast.success('Database seeded successfully!');
        setSeeding(false);
    };
    return (
        <div style={{ maxWidth: 700, margin: '2rem auto', padding: '2rem', fontFamily: 'Inter, sans-serif' }}>
            <h1 style={{ fontSize: '1.5rem', fontWeight: 700, marginBottom: '0.5rem' }}>🔧 Seed Firebase Database</h1>
            <p style={{ color: '#666', marginBottom: '1.5rem', fontSize: '0.9rem' }}>
                Creates demo users, multi-department workers, and complaints. Run this only once.
            </p>
            <div style={{ background: '#fef3c7', border: '1px solid #f59e0b', borderRadius: 8, padding: '1rem', marginBottom: '1.5rem', fontSize: '0.85rem' }}>
                <strong>⚠️ Before clicking, make sure you have:</strong>
                <ol style={{ marginTop: '0.5rem', paddingLeft: '1.2rem' }}>
                    <li>Enabled <strong>Email/Password</strong> in Firebase Console → Authentication → Sign-in method</li>
                    <li>Created a <strong>Firestore Database</strong> in Firebase Console → Firestore → Create database (test mode)</li>
                    <li>Set rules to: <code>match /&#123;document=**&#125; &#123; allow read, write: if true; &#125;</code></li>
                </ol>
            </div>
            <Button onClick={seedAll} loading={seeding} size="lg" fullWidth disabled={seeding}>
                {seeding ? 'Seeding...' : '🚀 Seed Database Now'}
            </Button>
            {log.length > 0 && (
                <div style={{
                    marginTop: '1.5rem', background: '#1e1e1e', color: '#d4d4d4', borderRadius: 8,
                    padding: '1rem', fontFamily: 'monospace', fontSize: '0.8rem', maxHeight: 400,
                    overflow: 'auto', lineHeight: 1.8,
                }}>
                    {log.map((l, i) => (
                        <div key={i}>{l}</div>
                    ))}
                </div>
            )}
        </div>
    );
}
