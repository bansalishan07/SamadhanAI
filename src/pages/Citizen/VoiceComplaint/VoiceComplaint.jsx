import { useState, useRef, useCallback, useEffect } from 'react';
import { useAuth } from '../../../context/AuthContext';
import { useNavigate } from 'react-router-dom';
import { createSpeechRecognizer, isSpeechSupported } from '../../../services/speechService';
import { detectCategory } from '../../../services/categoryDetection';
import { estimateSeverity } from '../../../services/severityLogic';
import { submitComplaint } from '../../../services/firebaseComplaintService';
import { autoAssignComplaint } from '../../../services/autoAssignService';
import { locations } from '../../../mockData/departments';
import Badge from '../../../components/Badge/Badge';
import Button from '../../../components/Button/Button';
import toast from 'react-hot-toast';
import { HiMicrophone, HiStop, HiCheckCircle, HiRefresh, HiTranslate } from 'react-icons/hi';
import './VoiceComplaint.css';

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

export default function VoiceComplaint() {
    const { user } = useAuth();
    const navigate = useNavigate();
    const recognizerRef = useRef(null);

    const [isListening, setIsListening] = useState(false);
    const [transcript, setTranscript] = useState('');
    const [language, setLanguage] = useState('en-IN');
    const [phase, setPhase] = useState('idle'); // idle → listening → preview → submitting → done
    const [location, setLocation] = useState('');
    const [submitting, setSubmitting] = useState(false);
    const [error, setError] = useState('');

    // Auto-detected fields
    const [detected, setDetected] = useState({
        category: '',
        department: '',
        severity: '',
        confidence: 0,
    });

    const supported = isSpeechSupported();

    // Cleanup on unmount
    useEffect(() => {
        return () => {
            if (recognizerRef.current) {
                try { recognizerRef.current.stop(); } catch { }
            }
        };
    }, []);

    const handleStartListening = useCallback(() => {
        setError('');
        setTranscript('');
        setDetected({ category: '', department: '', severity: '', confidence: 0 });

        const recognizer = createSpeechRecognizer({
            language,
            onInterimResult: (text) => setTranscript(text),
            onFinalResult: (text) => setTranscript(text),
            onError: (err) => {
                if (err === 'not-allowed') {
                    setError('Microphone permission denied. Please allow microphone access in your browser settings.');
                } else if (err === 'no-speech') {
                    setError('No speech detected. Please try again.');
                } else {
                    setError(`Speech recognition error: ${err}`);
                }
                setIsListening(false);
                setPhase('idle');
            },
            onEnd: () => {
                setIsListening(false);
            },
        });

        if (!recognizer) {
            setError('Your browser does not support speech recognition. Please use Chrome or Edge.');
            return;
        }

        recognizerRef.current = recognizer;
        recognizer.start();
        setIsListening(true);
        setPhase('listening');
    }, [language]);

    const handleStopListening = useCallback(() => {
        if (recognizerRef.current) {
            recognizerRef.current.stop();
        }
        setIsListening(false);

        if (transcript.trim().length > 5) {
            // Run detection
            const cat = detectCategory(transcript);
            const sev = estimateSeverity(transcript);
            setDetected({
                category: cat.category,
                department: cat.department,
                severity: sev.severity,
                confidence: cat.confidence,
            });
            setPhase('preview');
        } else {
            setPhase('idle');
            if (transcript.trim().length > 0) {
                setError('Text too short. Please speak a bit more about your complaint.');
            }
        }
    }, [transcript]);

    const handleReset = () => {
        setTranscript('');
        setPhase('idle');
        setDetected({ category: '', department: '', severity: '', confidence: 0 });
        setLocation('');
        setError('');
    };

    const handleSubmit = async () => {
        if (!location) {
            toast.error('Please select a location before submitting.');
            return;
        }
        setSubmitting(true);
        setPhase('submitting');

        try {
            const coords = SECTOR_COORDINATES[location] || {
                lat: 28.4595 + (Math.random() - 0.5) * 0.05,
                lng: 77.0266 + (Math.random() - 0.5) * 0.05,
            };

            // Generate a title from the first sentence or first 60 chars
            const title = transcript.split(/[.!?]/)[0].trim().substring(0, 60) || 'Voice Complaint';

            const complaint = await submitComplaint({
                title,
                description: transcript,
                location,
                ...coords,
                citizenId: user.id,
                citizenName: user.name,
                citizenEmail: user.email,
                category: detected.category,
                department: detected.department,
                urgency: detected.severity,
                confidence: detected.confidence,
                needsManualReview: detected.confidence < 0.5,
                submittedVia: 'voice-ai',
                isDuplicate: false,
                duplicateOf: null,
                imageSeverity: null,
            });

            try {
                const assignment = await autoAssignComplaint(
                    complaint.id,
                    detected.department,
                    detected.severity,
                    detected.category
                );
                if (assignment?.assigned) {
                    toast.success(`👷 Assigned to ${assignment.worker.name}`);
                } else {
                    toast('Pending manual assignment', { icon: '⚠️' });
                }
            } catch {
                toast('Worker assignment pending', { icon: '⚠️' });
            }

            setPhase('done');
            toast.success('✅ Voice complaint registered successfully!');
            setTimeout(() => navigate('/citizen/complaints'), 2000);
        } catch (err) {
            console.error('Voice complaint error:', err);
            toast.error(err.message || 'Failed to register complaint');
            setPhase('preview');
        } finally {
            setSubmitting(false);
        }
    };

    const toggleLanguage = () => {
        const newLang = language === 'en-IN' ? 'hi-IN' : 'en-IN';
        setLanguage(newLang);
        if (recognizerRef.current) {
            recognizerRef.current.setLanguage(newLang);
        }
    };

    const getSeverityColor = (sev) => {
        switch (sev) {
            case 'Critical': return 'critical';
            case 'High': return 'high';
            case 'Medium': return 'medium';
            case 'Low': return 'low';
            default: return 'medium';
        }
    };

    if (!supported) {
        return (
            <div className="voice-page">
                <div className="voice-unsupported">
                    <h2>⚠️ Browser Not Supported</h2>
                    <p>Your browser does not support the Web Speech API. Please use <strong>Google Chrome</strong> or <strong>Microsoft Edge</strong> for voice complaint registration.</p>
                </div>
            </div>
        );
    }

    return (
        <div className="voice-page">
            <div className="voice-header">
                <div className="voice-header-badge">🎙️ AI-Powered</div>
                <h1 className="voice-title">Register Complaint Using AI</h1>
                <p className="voice-subtitle">
                    Speak your complaint naturally — our AI will automatically detect the category, severity, and register it for you.
                </p>
            </div>

            {/* Language Toggle */}
            <div className="voice-lang-toggle">
                <button
                    className={`lang-btn ${language === 'en-IN' ? 'active' : ''}`}
                    onClick={() => { setLanguage('en-IN'); }}
                    disabled={isListening}
                >
                    English
                </button>
                <button
                    className={`lang-btn ${language === 'hi-IN' ? 'active' : ''}`}
                    onClick={() => { setLanguage('hi-IN'); }}
                    disabled={isListening}
                >
                    हिन्दी
                </button>
            </div>

            {/* Error Display */}
            {error && (
                <div className="voice-error">
                    <span>⚠️</span> {error}
                </div>
            )}

            {/* ─── PHASE: IDLE / LISTENING ─── */}
            {(phase === 'idle' || phase === 'listening') && (
                <div className="voice-mic-section">
                    <button
                        className={`voice-mic-btn ${isListening ? 'listening' : ''}`}
                        onClick={isListening ? handleStopListening : handleStartListening}
                    >
                        {isListening ? <HiStop /> : <HiMicrophone />}
                    </button>
                    <p className="voice-mic-label">
                        {isListening ? 'Listening... Tap to stop' : 'Tap to start speaking'}
                    </p>

                    {/* Live Transcript */}
                    {transcript && (
                        <div className="voice-live-transcript">
                            <h4>📝 Live Transcript</h4>
                            <p>{transcript}<span className="voice-cursor">|</span></p>
                        </div>
                    )}
                </div>
            )}

            {/* ─── PHASE: PREVIEW ─── */}
            {phase === 'preview' && (
                <div className="voice-preview slide-up">
                    <h2 className="preview-title">📋 Complaint Preview</h2>
                    <p className="preview-subtitle">Review and confirm the details below</p>

                    <div className="preview-card">
                        <div className="preview-row">
                            <span className="preview-label">Category</span>
                            <span className="preview-value">
                                <Badge type="blue">{detected.category}</Badge>
                            </span>
                        </div>
                        <div className="preview-row">
                            <span className="preview-label">Department</span>
                            <span className="preview-value">{detected.department}</span>
                        </div>
                        <div className="preview-row">
                            <span className="preview-label">Severity</span>
                            <span className="preview-value">
                                <Badge type={getSeverityColor(detected.severity)}>{detected.severity}</Badge>
                            </span>
                        </div>
                        <div className="preview-row">
                            <span className="preview-label">Confidence</span>
                            <span className="preview-value">{Math.round(detected.confidence * 100)}%</span>
                        </div>
                    </div>

                    {/* Editable Description */}
                    <div className="voice-edit-section">
                        <label className="voice-edit-label">Description (editable)</label>
                        <textarea
                            className="voice-edit-textarea"
                            value={transcript}
                            onChange={(e) => {
                                setTranscript(e.target.value);
                                // Re-detect on edit
                                const cat = detectCategory(e.target.value);
                                const sev = estimateSeverity(e.target.value);
                                setDetected({
                                    category: cat.category,
                                    department: cat.department,
                                    severity: sev.severity,
                                    confidence: cat.confidence,
                                });
                            }}
                            rows={4}
                        />
                    </div>

                    {/* Location Picker */}
                    <div className="voice-edit-section">
                        <label className="voice-edit-label">Select Location</label>
                        <select
                            className="voice-location-select"
                            value={location}
                            onChange={(e) => setLocation(e.target.value)}
                        >
                            <option value="">— Choose location —</option>
                            {locations.map((loc) => (
                                <option key={loc} value={loc}>{loc}</option>
                            ))}
                        </select>
                    </div>

                    {/* Action buttons */}
                    <div className="voice-actions">
                        <Button variant="ghost" onClick={handleReset}>
                            <HiRefresh style={{ marginRight: 6 }} /> Start Over
                        </Button>
                        <Button
                            variant="primary"
                            onClick={handleSubmit}
                            loading={submitting}
                            disabled={!location}
                        >
                            <HiCheckCircle style={{ marginRight: 6 }} /> Confirm & Register
                        </Button>
                    </div>
                </div>
            )}

            {/* ─── PHASE: DONE ─── */}
            {phase === 'done' && (
                <div className="voice-done slide-up">
                    <div className="voice-done-icon">✅</div>
                    <h2>Complaint Registered!</h2>
                    <p>Redirecting to your complaints...</p>
                </div>
            )}
        </div>
    );
}
