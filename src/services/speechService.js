/**
 * Speech Service — Free Web Speech API wrapper
 * Uses browser's built-in SpeechRecognition (Chrome/Edge)
 */

const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;

/**
 * Check if the browser supports the Web Speech API
 */
export function isSpeechSupported() {
    return !!SpeechRecognition;
}

/**
 * Create a new speech recognition instance
 * @param {Object} options
 * @param {string} options.language - Language code ('en-IN' or 'hi-IN')
 * @param {function} options.onInterimResult - Called with interim transcript text
 * @param {function} options.onFinalResult - Called with final transcript text
 * @param {function} options.onError - Called with error event
 * @param {function} options.onEnd - Called when recognition ends
 * @returns {{ start, stop, recognition }}
 */
export function createSpeechRecognizer({
    language = 'en-IN',
    onInterimResult = () => { },
    onFinalResult = () => { },
    onError = () => { },
    onEnd = () => { },
} = {}) {
    if (!isSpeechSupported()) {
        return null;
    }

    const recognition = new SpeechRecognition();
    recognition.continuous = true;
    recognition.interimResults = true;
    recognition.lang = language;
    recognition.maxAlternatives = 1;

    let finalTranscript = '';

    recognition.onresult = (event) => {
        let interim = '';
        for (let i = event.resultIndex; i < event.results.length; i++) {
            const transcript = event.results[i][0].transcript;
            if (event.results[i].isFinal) {
                finalTranscript += transcript + ' ';
                onFinalResult(finalTranscript.trim());
            } else {
                interim += transcript;
            }
        }
        if (interim) {
            onInterimResult(finalTranscript + interim);
        }
    };

    recognition.onerror = (event) => {
        console.error('Speech recognition error:', event.error);
        onError(event.error);
    };

    recognition.onend = () => {
        onEnd();
    };

    return {
        start: () => {
            finalTranscript = '';
            recognition.start();
        },
        stop: () => {
            recognition.stop();
        },
        setLanguage: (lang) => {
            recognition.lang = lang;
        },
        reset: () => {
            finalTranscript = '';
        },
        recognition,
    };
}
