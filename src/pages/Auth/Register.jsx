import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import Navbar from '../../components/Navbar/Navbar';
import FormInput from '../../components/FormInput/FormInput';
import Button from '../../components/Button/Button';
import { useAuth } from '../../context/AuthContext';
import { validateEmail, validatePassword, validateAadhaar } from '../../utils/helpers';
import toast from 'react-hot-toast';
import './Auth.css';
export default function Register() {
    const { register, loading } = useAuth();
    const navigate = useNavigate();
    const [form, setForm] = useState({
        name: '', email: '', password: '', role: 'Citizen', aadhaar: ''
    });
    const [errors, setErrors] = useState({});
    const handleChange = (e) => {
        let { name, value } = e.target;
        if (name === 'aadhaar') value = value.replace(/\D/g, '').slice(0, 12);
        setForm({ ...form, [name]: value });
        setErrors({ ...errors, [name]: '' });
    };
    const validate = () => {
        const errs = {};
        if (!form.name.trim()) errs.name = 'Full name is required';
        if (!validateEmail(form.email)) errs.email = 'Valid email is required';
        if (!validatePassword(form.password)) errs.password = 'Password must be at least 6 characters';
        if (!form.role) errs.role = 'Please select a role';
        if (!validateAadhaar(form.aadhaar)) errs.aadhaar = 'Aadhaar must be exactly 12 digits';
        setErrors(errs);
        return Object.keys(errs).length === 0;
    };
    const handleSubmit = async (e) => {
        e.preventDefault();
        if (!validate()) return;
        try {
            await register(form);
            toast.success('Registration successful! Please login.');
            navigate('/login');
        } catch (err) {
            const code = err.code || '';
            const messages = {
                'auth/email-already-in-use': 'This email is already registered. Try logging in instead.',
                'auth/invalid-email': 'Invalid email address format.',
                'auth/weak-password': 'Password is too weak. Use at least 6 characters.',
                'auth/operation-not-allowed': 'Email/Password sign-up is not enabled. Please enable it in Firebase Console → Authentication → Sign-in method.',
                'auth/network-request-failed': 'Network error. Check your internet connection.',
                'auth/configuration-not-found': 'Firebase Auth is not set up. Go to Firebase Console → Authentication → Get Started → Enable Email/Password.',
            };
            toast.error(messages[code] || err.message || 'Registration failed');
            console.error('Register error:', code, err.message);
        }
    };
    const maskedAadhaar = form.aadhaar
        ? form.aadhaar.slice(0, -4).replace(/./g, '●') + form.aadhaar.slice(-4)
        : '';
    return (
        <div className="auth-page">
            <Navbar />
            <div className="auth-container">
                <div className="auth-card animate-fade-in">
                    <div className="auth-header">
                        <div className="auth-icon">📝</div>
                        <h2 className="auth-title">Create Account</h2>
                        <p className="auth-subtitle">Register on समस्या SATHI to submit and track your grievances</p>
                    </div>
                    <form onSubmit={handleSubmit} className="auth-form">
                        <FormInput
                            label="Full Name" name="name"
                            value={form.name} onChange={handleChange}
                            placeholder="Enter your full name" error={errors.name} required
                        />
                        <FormInput
                            label="Email Address" type="email" name="email"
                            value={form.email} onChange={handleChange}
                            placeholder="Enter your email" error={errors.email} required
                        />
                        <FormInput
                            label="Password" type="password" name="password"
                            value={form.password} onChange={handleChange}
                            placeholder="Create a password (min 6 chars)" error={errors.password} required
                        />
                        <FormInput
                            label="Role" type="select" name="role"
                            value={form.role} onChange={handleChange}
                            options={['Citizen', 'Ward Supervisor', 'District Civic Administrator']}
                            error={errors.role} required
                        />
                        <div className="form-group">
                            <label className="form-label">Aadhaar Number <span className="form-required">*</span></label>
                            <input
                                type="text"
                                name="aadhaar"
                                value={form.aadhaar}
                                onChange={handleChange}
                                placeholder="Enter 12-digit Aadhaar number"
                                maxLength={12}
                                className={`form-input ${errors.aadhaar ? 'form-error' : ''}`}
                            />
                            {form.aadhaar && (
                                <span className="aadhaar-masked">Masked: {maskedAadhaar}</span>
                            )}
                            {errors.aadhaar && <span className="form-error-text">{errors.aadhaar}</span>}
                        </div>
                        <Button type="submit" fullWidth loading={loading} size="lg">
                            Create Account
                        </Button>
                    </form>
                    <div className="auth-footer">
                        <p>Already have an account? <Link to="/login" className="auth-link">Sign in</Link></p>
                    </div>
                </div>
            </div>
        </div>
    );
}
