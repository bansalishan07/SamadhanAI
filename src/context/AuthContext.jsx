import { createContext, useContext, useState, useCallback, useEffect } from 'react';
import { onAuthChange, firebaseLogin, firebaseRegister, firebaseLogout, updateUserProfile } from '../services/firebaseAuthService';
const AuthContext = createContext(null);
export function AuthProvider({ children }) {
    const [user, setUser] = useState(null);
    const [loading, setLoading] = useState(true); 
    const [authLoading, setAuthLoading] = useState(false); 
    useEffect(() => {
        const unsubscribe = onAuthChange((userData) => {
            setUser(userData);
            setLoading(false);
        });
        return unsubscribe;
    }, []);
    const ROLE_MIGRATION = {
        'Officer': 'Ward Supervisor',
        'Admin': 'District Civic Administrator',
    };
    const login = useCallback(async (email, password, role) => {
        setAuthLoading(true);
        try {
            const userData = await firebaseLogin(email, password);
            if (ROLE_MIGRATION[userData.role]) {
                const newRole = ROLE_MIGRATION[userData.role];
                await updateUserProfile(userData.id, { role: newRole });
                userData.role = newRole;
            }
            if (role && userData.role !== role) {
                await firebaseLogout();
                throw new Error(`This account is registered as "${userData.role}", not "${role}"`);
            }
            setUser(userData);
            return userData;
        } finally {
            setAuthLoading(false);
        }
    }, []);
    const register = useCallback(async (userData) => {
        setAuthLoading(true);
        try {
            const newUser = await firebaseRegister(userData);
            await firebaseLogout();
            return newUser;
        } finally {
            setAuthLoading(false);
        }
    }, []);
    const logout = useCallback(async () => {
        await firebaseLogout();
        setUser(null);
    }, []);
    const updateUser = useCallback(async (updatedFields) => {
        if (!user) return;
        const updated = await updateUserProfile(user.id, updatedFields);
        setUser(updated);
    }, [user]);
    if (loading) {
        return (
            <div style={{ height: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                <div style={{ textAlign: 'center' }}>
                    <div className="spinner" style={{ width: 40, height: 40, border: '3px solid var(--border-color)', borderTop: '3px solid var(--primary-600)', borderRadius: '50%', animation: 'spin 0.8s linear infinite', margin: '0 auto 1rem' }} />
                    <p style={{ color: 'var(--text-tertiary)', fontSize: '0.9rem' }}>Loading...</p>
                </div>
            </div>
        );
    }
    return (
        <AuthContext.Provider value={{ user, loading: authLoading, login, register, logout, updateUser }}>
            {children}
        </AuthContext.Provider>
    );
}
export function useAuth() {
    const context = useContext(AuthContext);
    if (!context) throw new Error('useAuth must be used within AuthProvider');
    return context;
}
