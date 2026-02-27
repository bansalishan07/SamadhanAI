/**
 * Severity Logic — Estimate complaint severity from text intensity.
 * Uses keyword matching to determine urgency level.
 * Supports both English AND Hindi (Devanagari script) keywords.
 */

const SEVERITY_KEYWORDS = {
    critical: [
        // English
        'death', 'died', 'killed', 'collapsed', 'collapsing', 'life threatening',
        'electrocution', 'drowning', 'fire', 'explosion', 'emergency',
        // Romanized Hindi
        'maut', 'mar gaya', 'jaan ka khatra', 'aag lagi',
        // Devanagari Hindi
        'मौत', 'मर गया', 'मर गए', 'जान का खतरा', 'आग लगी', 'धमाका',
        'विस्फोट', 'ढह गया', 'गिर गया', 'करंट लगा', 'इमरजेंसी',
        'बचाओ', 'जानलेवा', 'डूब', 'एमरजेंसी',
    ],
    high: [
        // English
        'dangerous', 'urgent', 'severe', 'major', 'broken completely', 'flooded',
        'overflowing', 'sparking', 'exposed wire', 'no supply', 'children at risk',
        'health hazard', 'epidemic', 'immediately', 'critical', 'serious', 'accident',
        // Romanized Hindi
        'khatarnak', 'bahut bura', 'turant', 'jaldi',
        // Devanagari Hindi
        'खतरनाक', 'बहुत बुरा', 'तुरंत', 'जल्दी', 'गंभीर', 'भयंकर',
        'बहुत खराब', 'पूरा टूटा', 'बाढ़ आ गई', 'ओवरफ्लो हो रहा',
        'बच्चों को खतरा', 'दुर्घटना', 'एक्सीडेंट', 'फौरन', 'जरूरी',
        'बहुत ज्यादा', 'परेशान', 'बहुत परेशानी',
    ],
    medium: [
        // English
        'problem', 'issue', 'complaint', 'not working', 'bad condition',
        'needs repair', 'irregular', 'sometimes', 'partially', 'inconvenience',
        // Romanized Hindi
        'dikkat', 'pareshani', 'theek nahi', 'kharab',
        // Devanagari Hindi
        'दिक्कत', 'परेशानी', 'ठीक नहीं', 'खराब', 'समस्या', 'शिकायत',
        'काम नहीं कर रहा', 'बंद है', 'कभी कभी', 'हालत खराब',
        'मरम्मत', 'रिपेयर', 'असुविधा', 'तकलीफ',
    ],
    low: [
        // English
        'minor', 'small', 'request', 'suggestion', 'improvement', 'cosmetic',
        'paint', 'slightly',
        // Romanized Hindi
        'chhota', 'thoda',
        // Devanagari Hindi
        'छोटा', 'थोड़ा', 'सुझाव', 'अनुरोध', 'सुधार', 'पेंट', 'रंगाई',
        'मामूली', 'हल्का',
    ],
};

/**
 * Estimate the severity of a complaint based on text analysis.
 * @param {string} text - The complaint text
 * @returns {{ severity: 'Low' | 'Medium' | 'High' | 'Critical', score: number }}
 */
export function estimateSeverity(text) {
    const lower = text.toLowerCase();

    const scores = {};
    for (const [level, keywords] of Object.entries(SEVERITY_KEYWORDS)) {
        scores[level] = 0;
        for (const kw of keywords) {
            const kwLower = kw.toLowerCase();
            if (lower.includes(kwLower)) {
                scores[level] += kw.length;
            }
        }
    }

    // Prioritize Critical > High > Medium > Low
    if (scores.critical > 0) return { severity: 'Critical', score: scores.critical };
    if (scores.high > 0) return { severity: 'High', score: scores.high };
    if (scores.medium > 0) return { severity: 'Medium', score: scores.medium };
    if (scores.low > 0) return { severity: 'Low', score: scores.low };

    return { severity: 'Medium', score: 0 };
}
