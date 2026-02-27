import { useState, useMemo, useRef, useCallback, useEffect } from 'react';
import { useAuth } from '../../../context/AuthContext';

import { submitComplaint, getComplaintsByCitizen } from '../../../services/firebaseComplaintService';
import { checkForDuplicates } from '../../../services/duplicateDetectionService';
import { autoAssignComplaint } from '../../../services/autoAssignService';
import FormInput from '../../../components/FormInput/FormInput';
import Button from '../../../components/Button/Button';
import Modal from '../../../components/Modal/Modal';
import Badge from '../../../components/Badge/Badge';
import { locations } from '../../../mockData/departments';
import { users } from '../../../mockData/users';
import toast from 'react-hot-toast';
import { useNavigate } from 'react-router-dom';
import './SubmitComplaint.css';
const SEVERITY_API = 'http://localhost:8000/api/analyze-image';
const SEVERITY_API_MOCK = 'http://localhost:8000/api/analyze-image/mock';
const locationSupervisorMap = {
    'Sector 1': 'supervisor-001', 'Sector 2': 'supervisor-002', 'Sector 3': 'supervisor-001',
    'Sector 4': 'supervisor-002', 'Sector 5': 'supervisor-001', 'Sector 6': 'supervisor-002',
    'Sector 7': 'supervisor-001', 'Sector 8': 'supervisor-002', 'Sector 9': 'supervisor-001',
    'Sector 10': 'supervisor-002', 'Sector 11': 'supervisor-001', 'Sector 12': 'supervisor-002',
    'Sector 15': 'supervisor-001', 'MG Road': 'supervisor-001', 'Main Market': 'supervisor-002',
    'Old Town': 'supervisor-001', 'Nehru Nagar': 'supervisor-002', 'Green Valley': 'supervisor-001',
    'Rose Garden Colony': 'supervisor-002', 'Bus Stand Area': 'supervisor-001',
    'NH-48 Toll Plaza': 'supervisor-002', 'Central Park': 'supervisor-001', 'District Office': 'supervisor-002',
};
const SECTOR_COORDINATES = {
    'Sector 1': { lat: 28.4595, lng: 77.0266 },
    'Sector 2': { lat: 28.4650, lng: 77.0320 },
    'Sector 3': { lat: 28.4720, lng: 77.0150 },
    'Sector 4': { lat: 28.4780, lng: 77.0220 },
    'Sector 5': { lat: 28.4850, lng: 77.0300 },
    'Sector 6': { lat: 28.4900, lng: 77.0400 },
    'Sector 7': { lat: 28.4500, lng: 77.0500 },
    'Sector 8': { lat: 28.4400, lng: 77.0450 },
    'Sector 12': { lat: 28.4700, lng: 77.0400 },
    'Sector 15': { lat: 28.4600, lng: 77.0500 },
    'MG Road': { lat: 28.4795, lng: 77.0801 },
    'Main Market': { lat: 28.4570, lng: 77.0260 },
    'Old Town': { lat: 28.4500, lng: 77.0100 },
    'Nehru Nagar': { lat: 28.4450, lng: 77.0200 },
    'Green Valley': { lat: 28.4350, lng: 77.0600 },
    'District Office': { lat: 28.4500, lng: 77.0300 },
};
export default function SubmitComplaint() {
    const { user } = useAuth();
    const navigate = useNavigate();
    const [form, setForm] = useState({ title: '', description: '', location: '' });
    const [errors, setErrors] = useState({});
    const [loading, setLoading] = useState(false);
    const [aiResult, setAiResult] = useState(null);
    const [showModal, setShowModal] = useState(false);
    const [assignmentResult, setAssignmentResult] = useState(null);
    const [imageFile, setImageFile] = useState(null);
    const [imagePreview, setImagePreview] = useState(null);
    const [analyzingImage, setAnalyzingImage] = useState(false);
    const [severityResult, setSeverityResult] = useState(null);
    const fileInputRef = useRef(null);
    const [duplicateResult, setDuplicateResult] = useState(null);
    const [checkingDuplicate, setCheckingDuplicate] = useState(false);
    const [userExistingComplaints, setUserExistingComplaints] = useState([]);
    const [duplicateDismissed, setDuplicateDismissed] = useState(false);
    const debounceRef = useRef(null);
    useEffect(() => {
        if (user?.id) {
            getComplaintsByCitizen(user.id).then(setUserExistingComplaints).catch(() => { });
        }
    }, [user?.id]);
    const runDuplicateCheck = useCallback(() => {
        if (debounceRef.current) clearTimeout(debounceRef.current);
        setDuplicateDismissed(false);
        debounceRef.current = setTimeout(() => {
            const { title, description, location } = form;
            if (title.trim().length < 5 || description.trim().length < 10) {
                setDuplicateResult(null);
                return;
            }
            setCheckingDuplicate(true);
            const result = checkForDuplicates(title, description, location, userExistingComplaints);
            setDuplicateResult(result.isDuplicate ? result : null);
            setCheckingDuplicate(false);
        }, 800);
    }, [form, userExistingComplaints]);
    const assignedSupervisor = useMemo(() => {
        if (!form.location) return null;
        const supervisorId = locationSupervisorMap[form.location] || 'supervisor-001';
        return users.find((u) => u.id === supervisorId) || null;
    }, [form.location]);
    const handleChange = (e) => {
        const updated = { ...form, [e.target.name]: e.target.value };
        setForm(updated);
        setErrors({ ...errors, [e.target.name]: '' });
    };
    const handleFieldBlur = () => {
        runDuplicateCheck();
    };
    const handleImageSelect = async (e) => {
        const file = e.target.files[0];
        if (!file) return;
        if (!file.type.startsWith('image/')) {
            toast.error('Please select an image file');
            return;
        }
        if (file.size > 10 * 1024 * 1024) {
            toast.error('Image too large (max 10MB)');
            return;
        }
        setImageFile(file);
        setImagePreview(URL.createObjectURL(file));
        setSeverityResult(null);
        analyzeImage(file);
    };
    const analyzeImage = async (file) => {
        setAnalyzingImage(true);
        const formData = new FormData();
        formData.append('file', file);
        try {
            const response = await fetch(SEVERITY_API, { method: 'POST', body: formData });
            if (response.ok) {
                const data = await response.json();
                setSeverityResult(data);
                toast.success('AI severity analysis complete!');
            }
        } catch {
            console.log('AI backend not available — skipping severity analysis');
        } finally {
            setAnalyzingImage(false);
        }
    };
    const removeImage = () => {
        setImageFile(null);
        setImagePreview(null);
        setSeverityResult(null);
        if (fileInputRef.current) fileInputRef.current.value = '';
    };
    const validate = () => {
        const errs = {};
        if (!form.title.trim()) errs.title = 'Title is required';
        if (!form.description.trim()) errs.description = 'Description is required';
        if (!form.location) errs.location = 'Location is required';
        setErrors(errs);
        return Object.keys(errs).length === 0;
    };
    const handleVoiceSubmit = async (voiceData) => {
        setLoading(true);
        try {
            setForm({ title: voiceData.title, description: voiceData.description, location: voiceData.location });

            const ai = await mockAIService.classifyComplaint(voiceData.title, voiceData.description);

            let finalCategory = ai.category;
            let finalDepartment = ai.department;
            let finalUrgency = ai.urgency;

            if (ai.needsManualReview || ai.category === 'Uncategorized') {
                const titleLower = voiceData.title.toLowerCase();
                if (titleLower.includes('power') || titleLower.includes('electric') || titleLower.includes('wire') || titleLower.includes('streetlight') || titleLower.includes('transformer')) {
                    finalCategory = 'Electricity';
                    finalDepartment = 'Electricity Department';
                } else if (titleLower.includes('water') || titleLower.includes('pipe') || titleLower.includes('leak') || titleLower.includes('tap')) {
                    finalCategory = 'Water Supply';
                    finalDepartment = 'Water Department';
                } else if (titleLower.includes('pothole') || titleLower.includes('road')) {
                    finalCategory = 'Roads & Infrastructure';
                    finalDepartment = 'Public Works';
                } else if (titleLower.includes('garbage') || titleLower.includes('waste') || titleLower.includes('sanit')) {
                    finalCategory = 'Sanitation';
                    finalDepartment = 'Sanitation Department';
                } else if (titleLower.includes('drain') || titleLower.includes('sewage') || titleLower.includes('flood')) {
                    finalCategory = 'Drainage';
                    finalDepartment = 'Public Works';
                } else if (titleLower.includes('traffic') || titleLower.includes('signal')) {
                    finalCategory = 'Traffic';
                    finalDepartment = 'Public Works';
                } else if (titleLower.includes('noise') || titleLower.includes('pollution')) {
                    finalCategory = 'Pollution';
                    finalDepartment = 'Public Works';
                } else {
                    finalCategory = 'Roads & Infrastructure';
                    finalDepartment = 'Public Works';
                }
                finalUrgency = ai.urgency !== 'Low' ? ai.urgency : 'Medium';
            }

            const coords = SECTOR_COORDINATES[voiceData.location] || {
                lat: 28.4595 + (Math.random() - 0.5) * 0.05,
                lng: 77.0266 + (Math.random() - 0.5) * 0.05
            };

            const complaint = await submitComplaint({
                title: voiceData.title,
                description: voiceData.description,
                location: voiceData.location,
                ...coords,
                citizenId: user.id,
                citizenName: user.name,
                citizenEmail: user.email,
                category: finalCategory,
                department: finalDepartment,
                urgency: finalUrgency,
                confidence: ai.confidence,
                needsManualReview: false,
                submittedVia: 'voice',
                isDuplicate: false,
                duplicateOf: null,
                imageSeverity: null,
            });

            try {
                const assignment = await autoAssignComplaint(complaint.id, finalDepartment, finalUrgency, finalCategory);
                if (assignment?.assigned) {
                    toast.success(`Assigned to ${assignment.worker.name} (${assignment.worker.role})`);
                } else {
                    toast('Pending manual assignment', { icon: '⚠️' });
                }
            } catch (e) {
                console.warn('Auto-assign failed:', e);
                toast('Worker assignment pending', { icon: '⚠️' });
            }

            setAiResult({ category: finalCategory, department: finalDepartment, urgency: finalUrgency, complaintId: complaint.id });
            toast.success('Voice complaint registered!');
            setForm({ title: '', description: '', location: '' });
        } catch (err) {
            console.error('Voice submit error:', err);
            toast.error(err.message || 'Failed to submit');
            throw err;
        } finally {
            setLoading(false);
        }
    };


    const handleSubmit = async (e) => {
        e.preventDefault();
        if (!validate()) return;
        setLoading(true);
        try {
            // Local fallback classification for manual form text
            const text = (form.title + ' ' + form.description).toLowerCase();
            let finalCategory = 'Roads & Infrastructure';
            let finalDepartment = 'Public Works';
            let finalUrgency = 'Medium';
            let confidence = 0.5;

            if (text.includes('power') || text.includes('electric') || text.includes('wire') || text.includes('light')) {
                finalCategory = 'Electricity';
                finalDepartment = 'Electricity Department';
                confidence = 0.8;
            } else if (text.includes('water') || text.includes('pipe') || text.includes('leak')) {
                finalCategory = 'Water Supply';
                finalDepartment = 'Water Department';
                confidence = 0.8;
            } else if (text.includes('garbage') || text.includes('waste') || text.includes('clean')) {
                finalCategory = 'Sanitation';
                finalDepartment = 'Sanitation Department';
                confidence = 0.8;
            } else if (text.includes('drain') || text.includes('sewage') || text.includes('flood')) {
                finalCategory = 'Drainage';
                finalDepartment = 'Public Works';
                confidence = 0.8;
            }

            if (severityResult && severityResult.urgency) {
                const urgencyRank = { High: 3, Medium: 2, Low: 1 };
                if ((urgencyRank[severityResult.urgency] || 0) > (urgencyRank[finalUrgency] || 0)) {
                    finalUrgency = severityResult.urgency;
                }
            }

            const isLowConfidence = confidence < 0.6;
            if (isLowConfidence) {
                finalUrgency = 'Low';
            }

            const coords = SECTOR_COORDINATES[form.location] || {
                lat: 28.4595 + (Math.random() - 0.5) * 0.05,
                lng: 77.0266 + (Math.random() - 0.5) * 0.05
            };

            const complaint = await submitComplaint({
                ...form,
                ...coords,
                citizenId: user.id,
                citizenName: user.name,
                citizenEmail: user.email,
                category: finalCategory,
                department: finalDepartment,
                urgency: finalUrgency,
                confidence: confidence,
                needsManualReview: isLowConfidence,
                isDuplicate: duplicateResult ? true : false,
                duplicateOf: duplicateResult?.matchedComplaints?.[0]?.id || null,
                imageSeverity: severityResult ? {
                    detectedHazard: severityResult.detected_hazard,
                    severityScore: severityResult.severity_score,
                    priorityLevel: severityResult.priority_level,
                    confidence: severityResult.confidence,
                    description: severityResult.description,
                } : null,
            });

            let assignment = null;
            if (!isLowConfidence) {
                try {
                    assignment = await autoAssignComplaint(complaint.id, finalDepartment, finalUrgency, finalCategory);
                    if (assignment.assigned) {
                        toast.success(`Assigned to ${assignment.worker.name} (${assignment.worker.role})`);
                    } else {
                        toast('No matching worker found — pending manual assignment', { icon: '⚠️' });
                    }
                } catch (assignErr) {
                    console.warn('Auto-assignment failed, complaint still created:', assignErr);
                }
            } else {
                toast('AI could not classify clearly — sent for manual review', { icon: '📋' });
            }

            setAssignmentResult(assignment);
            setAiResult({ ...ai, urgency: finalUrgency, complaintId: complaint.id, needsManualReview: isLowConfidence });
            setShowModal(true);
            setForm({ title: '', description: '', location: '' });
            removeImage();
            toast.success('Complaint submitted successfully!');
        } catch (err) {
            console.error('Submit error:', err);
            toast.error(err.message || 'Failed to submit complaint');
        } finally {
            setLoading(false);
        }
    };
    const getSeverityColor = (score) => {
        if (score >= 8) return '#dc2626';
        if (score >= 5) return '#f59e0b';
        if (score >= 3) return '#3b82f6';
        return '#6b7280';
    };
    const getPriorityBadgeType = (level) => {
        if (level === 'Critical') return 'high';
        if (level === 'High') return 'high';
        if (level === 'Medium') return 'medium';
        return 'low';
    };
    return (
        <div className="submit-page-wrapper">
            <div className="page-header" style={{ textAlign: 'center' }}>
                <h1 className="page-title">Submit Complaint</h1>
                <p className="page-subtitle">Describe your grievance and upload a photo — AI will analyze severity automatically</p>
            </div>
            <div className="submit-form-card">
                <form onSubmit={handleSubmit} className="submit-form">
                    <div style={{ textAlign: 'center', fontSize: '0.9rem', color: 'var(--text-secondary)', marginBottom: '1.5rem', fontWeight: 500 }}>
                        Please fill in the details of your grievance below
                    </div>
                    <FormInput
                        label="Complaint Title" name="title"
                        value={form.title} onChange={handleChange}
                        onBlur={handleFieldBlur}
                        placeholder="Brief title describing your complaint"
                        error={errors.title} required
                    />
                    <FormInput
                        label="Complaint Description" type="textarea" name="description"
                        value={form.description} onChange={handleChange}
                        onBlur={handleFieldBlur}
                        placeholder="Provide detailed description of your grievance or use voice input above..."
                        rows={5} error={errors.description} required
                    />
                    <FormInput
                        label="Location" type="select" name="location"
                        value={form.location} onChange={handleChange}
                        placeholder="Select location"
                        options={locations}
                        error={errors.location} required
                    />
                    { }
                    {assignedSupervisor && (
                        <div className="officer-preview">
                            <div className="officer-preview-header">
                                <span className="officer-preview-icon">👮</span>
                                <span className="officer-preview-title">Assigned Ward Supervisor</span>
                            </div>
                            <div className="officer-preview-details">
                                <div className="officer-avatar">{assignedSupervisor.name.charAt(0)}</div>
                                <div className="officer-info">
                                    <span className="officer-name">{assignedSupervisor.name}</span>
                                    <span className="officer-email">{assignedSupervisor.email}</span>
                                    <span className="officer-location">📍 Jurisdiction: {form.location}</span>
                                </div>
                            </div>
                        </div>
                    )}
                    { }
                    <div className="form-group">
                        <label className="form-label">📸 Upload Image for AI Severity Analysis</label>
                        <div
                            className={`image-upload-zone ${imagePreview ? 'has-image' : ''}`}
                            onClick={() => !imagePreview && fileInputRef.current?.click()}
                        >
                            {!imagePreview ? (
                                <div className="upload-placeholder">
                                    <span className="upload-icon">📷</span>
                                    <span className="upload-text">Click to upload an image of the issue</span>
                                    <span className="upload-hint">JPEG, PNG — Max 10MB — AI will auto-analyze</span>
                                </div>
                            ) : (
                                <div className="image-preview-container">
                                    <img src={imagePreview} alt="Preview" className="image-preview" />
                                    <button type="button" className="image-remove-btn" onClick={(e) => { e.stopPropagation(); removeImage(); }}>
                                        ✕
                                    </button>
                                </div>
                            )}
                            <input
                                ref={fileInputRef}
                                type="file"
                                accept="image/*"
                                onChange={handleImageSelect}
                                style={{ display: 'none' }}
                            />
                        </div>
                    </div>
                    { }
                    {analyzingImage && (
                        <div className="severity-card severity-loading">
                            <div className="severity-spinner" />
                            <span>🤖 AI is analyzing the image for hazards...</span>
                        </div>
                    )}
                    {severityResult && !analyzingImage && (
                        <div className="severity-card" style={{ borderLeftColor: getSeverityColor(severityResult.severity_score) }}>
                            <div className="severity-header">
                                <h4>🤖 AI Severity Analysis</h4>
                                <Badge type={getPriorityBadgeType(severityResult.priority_level)}>
                                    {severityResult.priority_level}
                                </Badge>
                            </div>
                            <p className="severity-description">{severityResult.description}</p>
                            <div className="severity-metrics">
                                <div className="severity-metric">
                                    <span className="severity-metric-label">Hazard</span>
                                    <span className="severity-metric-value">{severityResult.detected_hazard?.replace('_', ' ')}</span>
                                </div>
                                <div className="severity-metric">
                                    <span className="severity-metric-label">Severity</span>
                                    <span className="severity-metric-value" style={{ color: getSeverityColor(severityResult.severity_score) }}>
                                        {severityResult.severity_score}/10
                                    </span>
                                </div>
                                <div className="severity-metric">
                                    <span className="severity-metric-label">Confidence</span>
                                    <span className="severity-metric-value">{(severityResult.confidence * 100).toFixed(0)}%</span>
                                </div>
                            </div>
                            <div className="severity-bar">
                                <div
                                    className="severity-bar-fill"
                                    style={{
                                        width: `${severityResult.severity_score * 10}%`,
                                        background: getSeverityColor(severityResult.severity_score),
                                    }}
                                />
                            </div>
                        </div>
                    )}
                    { }
                    {checkingDuplicate && (
                        <div className="duplicate-card duplicate-checking">
                            <div className="severity-spinner" />
                            <span>🔍 Checking for similar complaints...</span>
                        </div>
                    )}
                    {duplicateResult && !duplicateDismissed && !checkingDuplicate && (
                        <div className="duplicate-card">
                            <div className="duplicate-header">
                                <span className="duplicate-icon">⚠️</span>
                                <div>
                                    <h4>Potential Duplicate Detected</h4>
                                    <p>We found a similar complaint you've already submitted ({duplicateResult.similarityScore}% match)</p>
                                </div>
                            </div>
                            <div className="duplicate-matches">
                                {duplicateResult.matchedComplaints.map((m) => (
                                    <div key={m.id} className="duplicate-match-item">
                                        <div className="duplicate-match-top">
                                            <span className="duplicate-match-title">{m.title}</span>
                                            <Badge type={m.status?.toLowerCase()}>{m.status}</Badge>
                                        </div>
                                        <div className="duplicate-match-meta">
                                            <span>📍 {m.location}</span>
                                            <span>📊 {m.similarity}% similar</span>
                                            {m.department && <span>🏢 {m.department}</span>}
                                        </div>
                                    </div>
                                ))}
                            </div>
                            <div className="duplicate-actions">
                                <Button size="sm" variant="primary" onClick={() => {
                                    setShowModal(false);
                                    window.location.href = `/citizen/complaints`;
                                }}>
                                    View Existing Complaint
                                </Button>
                            </div>
                        </div>
                    )}
                    <Button
                        type="submit"
                        loading={loading}
                        size="lg"
                        fullWidth
                        disabled={duplicateResult && !duplicateDismissed}
                    >
                        {loading ? 'AI is processing...' : (duplicateResult && !duplicateDismissed ? '⚠️ Duplicate Detected' : 'Submit Complaint')}
                    </Button>
                </form>
            </div>
            {/* AI Result Modal */}
            <Modal isOpen={showModal} onClose={() => setShowModal(false)} title="✅ Complaint Submitted">
                {aiResult && (
                    <div className="ai-result">
                        <div className="ai-result-header">
                            <span className="ai-result-icon">🤖</span>
                            <div>
                                <h4>AI Classification Result</h4>
                                <p>Confidence: <strong>{(aiResult.confidence * 100).toFixed(0)}%</strong></p>
                            </div>
                        </div>
                        <div className="ai-result-grid">
                            <div className="ai-result-item">
                                <span className="ai-result-label">Complaint ID</span>
                                <span className="ai-result-value" style={{ fontSize: '0.75rem', fontFamily: 'monospace' }}>{aiResult.complaintId}</span>
                            </div>
                            <div className="ai-result-item">
                                <span className="ai-result-label">Predicted Category</span>
                                <span className="ai-result-value">{aiResult.category}</span>
                            </div>
                            <div className="ai-result-item">
                                <span className="ai-result-label">Assigned Department</span>
                                <span className="ai-result-value">{aiResult.department}</span>
                            </div>
                            <div className="ai-result-item">
                                <span className="ai-result-label">Urgency Level</span>
                                <Badge type={aiResult.urgency.toLowerCase()}>{aiResult.urgency}</Badge>
                            </div>
                            {severityResult && (
                                <div className="ai-result-item">
                                    <span className="ai-result-label">Image Severity</span>
                                    <Badge type={getPriorityBadgeType(severityResult.priority_level)}>
                                        {severityResult.detected_hazard?.replace('_', ' ')} — {severityResult.severity_score}/10
                                    </Badge>
                                </div>
                            )}
                        </div>
                        {/* AI Auto-Assignment Result */}
                        {assignmentResult && assignmentResult.assigned && (
                            <div className="ai-assignment-card" style={{
                                marginTop: '1rem', padding: '1rem', borderRadius: '12px',
                                background: 'linear-gradient(135deg, rgba(16,185,129,0.1), rgba(59,130,246,0.1))',
                                border: '1px solid rgba(16,185,129,0.3)',
                            }}>
                                <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '0.5rem' }}>
                                    <span style={{ fontSize: '1.3rem' }}>🤖</span>
                                    <strong style={{ color: 'var(--success)' }}>AI Auto-Assigned</strong>
                                </div>
                                <div className="ai-result-grid">
                                    <div className="ai-result-item">
                                        <span className="ai-result-label">Worker</span>
                                        <span className="ai-result-value">{assignmentResult.worker.name}</span>
                                    </div>
                                    <div className="ai-result-item">
                                        <span className="ai-result-label">Role</span>
                                        <span className="ai-result-value">{assignmentResult.worker.role}</span>
                                    </div>
                                    <div className="ai-result-item">
                                        <span className="ai-result-label">Status</span>
                                        <Badge type="assigned">Assigned</Badge>
                                    </div>
                                </div>
                            </div>
                        )}
                        {aiResult.needsManualReview && (
                            <div style={{
                                marginTop: '1rem', padding: '1rem', borderRadius: '12px',
                                background: 'linear-gradient(135deg, rgba(245,158,11,0.1), rgba(239,68,68,0.1))',
                                border: '1px solid rgba(245,158,11,0.4)',
                            }}>
                                <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '0.3rem' }}>
                                    <span style={{ fontSize: '1.3rem' }}>📋</span>
                                    <strong style={{ color: 'var(--warning)' }}>Sent for Manual Review</strong>
                                </div>
                                <p style={{ fontSize: '0.85rem', color: 'var(--text-secondary)', margin: 0 }}>
                                    Our AI couldn't classify this complaint clearly. A Ward Supervisor will review and assign the right worker manually.
                                </p>
                            </div>
                        )}
                    </div>
                )}
            </Modal>
        </div>
    );
}
