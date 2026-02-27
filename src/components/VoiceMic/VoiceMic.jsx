import { useState, useRef, useCallback, useEffect } from 'react';
import { createVoiceRecognition, isSpeechSupported, VOICE_LANGUAGES } from '../../services/voiceService';
import { HiMicrophone, HiStop } from 'react-icons/hi';
import toast from 'react-hot-toast';
import './VoiceMic.css';

export default function VoiceMic({ onTranscript, onInterim, disabled = false }) {
    const [recording, setRecording] = useState(false);
    const [language, setLanguage] = useState('en-IN');
    const recognitionRef = useRef(null);
    const supported = isSpeechSupported();

    useEffect(() => {
        return () => { recognitionRef.current?.stop(); };
    }, []);

    const startRecording = useCallback(() => {
        if (recognitionRef.current) {
            recognitionRef.current.stop();
        }

        const rec = createVoiceRecognition({
            language,
            onResult: (text) => { onTranscript?.(text); },
            onInterim: (text) => { onInterim?.(text); },
            onEnd: (text) => {
                setRecording(false);
                if (text) onTranscript?.(text);
            },
            onError: (msg) => {
                setRecording(false);
                toast.error(msg);
            },
        });

        if (rec) {
            recognitionRef.current = rec;
            rec.start();
            setRecording(true);
            toast('🎙️ Listening... Speak now', { duration: 2000 });
        }
    }, [language, onTranscript, onInterim]);

    const stopRecording = useCallback(() => {
        recognitionRef.current?.stop();
        setRecording(false);
    }, []);

    const toggleRecording = () => {
        if (recording) stopRecording();
        else startRecording();
    };

    const switchLanguage = (lang) => {
        if (recording) {
            stopRecording();
        }
        setLanguage(lang);
        recognitionRef.current?.setLanguage(lang);
    };

    if (!supported) {
        return <div className="voice-unsupported">🎤 Voice input requires Chrome browser</div>;
    }

    return (
        <div className="voice-controls">
            <button
                type="button"
                className={`voice-mic-btn ${recording ? 'recording' : ''}`}
                onClick={toggleRecording}
                disabled={disabled}
                title={recording ? 'Stop recording' : 'Start voice input'}
            >
                {recording ? <HiStop /> : <HiMicrophone />}
            </button>

            <div style={{ flex: 1 }}>
                {recording ? (
                    <div className="voice-status listening">
                        <div className="voice-listening-dots">
                            <span /><span /><span />
                        </div>
                        Listening in {VOICE_LANGUAGES.find(l => l.code === language)?.label}...
                    </div>
                ) : (
                    <div className="voice-status">
                        Speak your complaint
                    </div>
                )}
            </div>

            <div className="voice-lang-toggle">
                {VOICE_LANGUAGES.map((lang) => (
                    <button
                        key={lang.code}
                        type="button"
                        className={`voice-lang-btn ${language === lang.code ? 'active' : ''}`}
                        onClick={() => switchLanguage(lang.code)}
                    >
                        {lang.flag} {lang.label}
                    </button>
                ))}
            </div>
        </div>
    );
}
