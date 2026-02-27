import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import Navbar from '../../components/Navbar/Navbar';
import FormInput from '../../components/FormInput/FormInput';
import Button from '../../components/Button/Button';
import { useAuth } from '../../context/AuthContext';
import { validateEmail, validatePassword } from '../../utils/helpers';
import toast from 'react-hot-toast';
import './Auth.css';
export default function Login() {
    const { login, loading } = useAuth();
    const navigate = useNavigate();
    const [form, setForm] = useState({ email: '', password: '', role: 'Citizen' });
    const [errors, setErrors] = useState({});
    const handleChange = (e) => {
        setForm({ ...form, [e.target.name]: e.target.value });
        setErrors({ ...errors, [e.target.name]: '' });
    };
    const validate = () => {
        const errs = {};
        if (!validateEmail(form.email)) errs.email = 'Valid email is required';
        if (!validatePassword(form.password)) errs.password = 'Password must be at least 6 characters';
        if (!form.role) errs.role = 'Please select a role';
        setErrors(errs);
        return Object.keys(errs).length === 0;
    };
    const handleSubmit = async (e) => {
        e.preventDefault();
        if (!validate()) return;
        try {
            const user = await login(form.email, form.password, form.role);
            toast.success(`Welcome back, ${user.name}!`);
            const routes = { Citizen: '/citizen/dashboard', 'Ward Supervisor': '/officer/overview', 'District Civic Administrator': '/admin/dashboard' };
            navigate(routes[user.role]);
        } catch (err) {
            toast.error(err.message);
        }
    };
    return (
        <div className="auth-page">
            <Navbar />
            <div className="auth-container">
                <div className="auth-card animate-fade-in">
                    <div className="auth-header">
                        <div className="auth-icon">🔐</div>
                        <h2 className="auth-title">Welcome Back</h2>
                        <p className="auth-subtitle">Sign in to your समस्या SATHI account</p>
                    </div>
                    <form onSubmit={handleSubmit} className="auth-form">
                        <FormInput
                            label="Email Address" type="email" name="email"
                            value={form.email} onChange={handleChange}
                            placeholder="Enter your email" error={errors.email} required
                        />
                        <FormInput
                            label="Password" type="password" name="password"
                            value={form.password} onChange={handleChange}
                            placeholder="Enter your password" error={errors.password} required
                        />
                        <FormInput
                            label="Login As" type="select" name="role"
                            value={form.role} onChange={handleChange}
                            options={['Citizen', 'Ward Supervisor', 'District Civic Administrator']}
                            error={errors.role} required
                        />
                        <Button type="submit" fullWidth loading={loading} size="lg">
                            Sign In
                        </Button>
                    </form>
                    <div className="auth-footer">
                        <p>Don't have an account? <Link to="/register" className="auth-link">Register here</Link></p>
                    </div>
                </div>
            </div>
        </div>
    );
}
