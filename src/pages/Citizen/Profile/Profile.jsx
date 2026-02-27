import { useState } from 'react';
import { useAuth } from '../../../context/AuthContext';
import { validateEmail, validateAadhaar } from '../../../utils/helpers';
import Button from '../../../components/Button/Button';
import toast from 'react-hot-toast';
import './Profile.css';
export default function Profile() {
    const { user, updateUser } = useAuth();
    const [editing, setEditing] = useState(false);
    const [form, setForm] = useState({
        name: user.name,
        email: user.email,
        aadhaar: user.aadhaar || '',
    });
    const [errors, setErrors] = useState({});
    const [saving, setSaving] = useState(false);
    const handleChange = (e) => {
        let { name, value } = e.target;
        if (name === 'aadhaar') value = value.replace(/\D/g, '').slice(0, 12);
        setForm({ ...form, [name]: value });
        setErrors({ ...errors, [name]: '' });
    };
    const validate = () => {
        const errs = {};
        if (!form.name.trim()) errs.name = 'Name is required';
        if (!validateEmail(form.email)) errs.email = 'Valid email is required';
        if (form.aadhaar && !validateAadhaar(form.aadhaar)) errs.aadhaar = 'Must be 12 digits';
        setErrors(errs);
        return Object.keys(errs).length === 0;
    };
    const handleSave = async () => {
        if (!validate()) return;
        setSaving(true);
        await new Promise((r) => setTimeout(r, 600));
        updateUser({
            name: form.name,
        });
        setSaving(false);
        setEditing(false);
        toast.success('Profile updated successfully!');
    };
    const handleCancel = () => {
        setForm({ name: user.name, email: user.email, aadhaar: user.aadhaar || '' });
        setErrors({});
        setEditing(false);
    };
    return (
        <div className="profile-page-wrapper">
            <div className="page-header">
                <h1 className="page-title">My Profile</h1>
                <p className="page-subtitle">View and manage your account information</p>
            </div>
            <div className="profile-card">
                <div className="profile-top">
                    <div className="profile-avatar">
                        {(editing ? form.name : user.name).charAt(0)}
                    </div>
                    {!editing && (
                        <Button variant="secondary" size="sm" onClick={() => setEditing(true)}>
                            ✏️ Edit Profile
                        </Button>
                    )}
                </div>
                <div className="profile-details">
                    {}
                    <div className="profile-row">
                        <span className="profile-label">Full Name</span>
                        {editing ? (
                            <div className="profile-edit-field">
                                <input
                                    type="text" name="name" value={form.name}
                                    onChange={handleChange}
                                    className={`profile-input ${errors.name ? 'profile-input-error' : ''}`}
                                />
                                {errors.name && <span className="profile-field-error">{errors.name}</span>}
                            </div>
                        ) : (
                            <span className="profile-value">{user.name}</span>
                        )}
                    </div>
                    {}
                    <div className="profile-row">
                        <span className="profile-label">Email 🔒</span>
                        <span className="profile-value">{user.email}</span>
                    </div>
                    {}
                    <div className="profile-row">
                        <span className="profile-label">Role</span>
                        <span className="profile-value">
                            <span className="profile-role-badge">{user.role}</span>
                        </span>
                    </div>
                    {}
                    <div className="profile-row">
                        <span className="profile-label">Aadhaar 🔒</span>
                        <span className="profile-value">{'●●●●●●●●' + (user.aadhaar?.slice(-4) || '****')}</span>
                    </div>
                    {}
                    <div className="profile-row">
                        <span className="profile-label">User ID</span>
                        <span className="profile-value profile-mono">{user.id}</span>
                    </div>
                </div>
                {}
                {editing && (
                    <div className="profile-actions">
                        <Button variant="primary" onClick={handleSave} loading={saving}>
                            💾 Save Changes
                        </Button>
                        <Button variant="secondary" onClick={handleCancel}>
                            Cancel
                        </Button>
                    </div>
                )}
            </div>
        </div>
    );
}
