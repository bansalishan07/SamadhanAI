/**
 * Category Detection — Keyword-based complaint classification
 * Maps spoken text to a complaint category and department.
 * Supports both English AND Hindi (Devanagari script) keywords.
 */

const CATEGORY_RULES = [
    {
        category: 'Electricity',
        department: 'Electricity Department',
        keywords: [
            // English
            'electricity', 'electric', 'power', 'blackout', 'powercut', 'power cut',
            'wire', 'transformer', 'streetlight', 'street light', 'pole', 'meter',
            'voltage', 'current', 'short circuit', 'fuse',
            // Romanized Hindi
            'bijli', 'light nahi', 'bijlee',
            // Devanagari Hindi
            'बिजली', 'बत्ती', 'लाइट', 'करंट', 'ट्रांसफार्मर', 'तार', 'खंभा',
            'बिजली नहीं', 'बिजली कटी', 'बिजली गुल', 'शॉर्ट सर्किट', 'फ्यूज',
            'स्ट्रीट लाइट', 'मीटर', 'वोल्टेज', 'बिजली का तार',
        ],
    },
    {
        category: 'Water Supply',
        department: 'Water Department',
        keywords: [
            // English
            'water', 'pipe', 'pipeline', 'leak', 'tap', 'supply', 'tank', 'boring',
            'water supply', 'dirty water', 'no water', 'sewage water',
            // Romanized Hindi
            'paani', 'nala', 'nal',
            // Devanagari Hindi
            'पानी', 'नल', 'पाइप', 'पाइपलाइन', 'टंकी', 'बोरिंग', 'लीक',
            'पानी नहीं', 'पानी गंदा', 'पानी की', 'सप्लाई', 'जलापूर्ति',
            'पानी बंद', 'नल टूटा', 'पानी का प्रेशर',
        ],
    },
    {
        category: 'Roads & Infrastructure',
        department: 'Public Works',
        keywords: [
            // English
            'road', 'pothole', 'crack', 'broken road', 'footpath', 'bridge',
            'flyover', 'speed breaker', 'construction', 'pavement', 'highway',
            // Romanized Hindi
            'sadak', 'gaddha', 'sarak',
            // Devanagari Hindi
            'सड़क', 'गड्ढा', 'गड्ढे', 'रोड', 'पुल', 'फुटपाथ', 'फ्लाईओवर',
            'स्पीड ब्रेकर', 'टूटी सड़क', 'सड़क खराब', 'सड़क टूटी', 'निर्माण',
            'रास्ता', 'पगडंडी', 'रोड टूटा', 'सड़क पर गड्ढा',
        ],
    },
    {
        category: 'Sanitation',
        department: 'Sanitation Department',
        keywords: [
            // English
            'garbage', 'waste', 'trash', 'dustbin', 'cleaning', 'sweeper', 'dump',
            'dirty', 'unhygienic', 'smell', 'rubbish', 'litter',
            // Romanized Hindi
            'kachra', 'safai', 'ganda', 'gandgi',
            // Devanagari Hindi
            'कचरा', 'कूड़ा', 'सफाई', 'गंदगी', 'गंदा', 'बदबू', 'कूड़ेदान',
            'डस्टबिन', 'स्वीपर', 'सफाईकर्मी', 'झाड़ू', 'कचरा नहीं उठाया',
            'गंदी', 'नाली गंदी', 'बदबू आ रही', 'कचरा पड़ा है',
        ],
    },
    {
        category: 'Drainage',
        department: 'Public Works',
        keywords: [
            // English
            'drain', 'drainage', 'sewage', 'sewer', 'flood', 'waterlog',
            'overflow', 'blocked drain', 'clogged', 'gutter',
            // Romanized Hindi
            'nali', 'naala', 'naali',
            // Devanagari Hindi
            'नाली', 'नाला', 'सीवर', 'सीवेज', 'बाढ़', 'जलभराव', 'पानी भरा',
            'नाली बंद', 'नाली टूटी', 'ओवरफ्लो', 'नाली से बदबू',
            'गटर', 'ड्रेनेज', 'नाली चोक',
        ],
    },
    {
        category: 'Traffic',
        department: 'Public Works',
        keywords: [
            // English
            'traffic', 'signal', 'jam', 'parking', 'zebra crossing', 'divider',
            'accident prone', 'traffic light', 'red light',
            // Romanized Hindi
            'challan',
            // Devanagari Hindi
            'ट्रैफिक', 'सिग्नल', 'जाम', 'पार्किंग', 'दुर्घटना', 'डिवाइडर',
            'ट्रैफिक जाम', 'ट्रैफिक सिग्नल', 'लाल बत्ती', 'चालान',
            'ज़ेबरा क्रॉसिंग', 'ट्रैफिक लाइट',
        ],
    },
    {
        category: 'Pollution',
        department: 'Public Works',
        keywords: [
            // English
            'noise', 'pollution', 'air', 'smoke', 'factory', 'dust', 'chemical',
            'air pollution', 'noise pollution', 'toxic',
            // Romanized Hindi
            'dhuan', 'pradushan',
            // Devanagari Hindi
            'प्रदूषण', 'शोर', 'धुआं', 'धूल', 'फैक्ट्री', 'केमिकल',
            'वायु प्रदूषण', 'ध्वनि प्रदूषण', 'गंध', 'दुर्गंध',
            'हवा खराब', 'सांस लेने में',
        ],
    },
    {
        category: 'Public Safety',
        department: 'Public Works',
        keywords: [
            // English
            'unsafe', 'danger', 'risk', 'collapse', 'fire', 'hazard', 'theft',
            'crime', 'security', 'stray', 'dog', 'animal', 'snake', 'attack',
            // Romanized Hindi
            'khatarnak', 'khatra',
            // Devanagari Hindi
            'खतरनाक', 'खतरा', 'आग', 'चोरी', 'अपराध', 'सुरक्षा', 'कुत्ता',
            'आवारा', 'सांप', 'हमला', 'गिरना', 'टूटना', 'ढहना',
            'असुरक्षित', 'जान का खतरा', 'लूट', 'डकैती',
        ],
    },
];

/**
 * Detect category and department from complaint text using keyword matching.
 * @param {string} text - The complaint text (title + description)
 * @returns {{ category: string, department: string, confidence: number }}
 */
export function detectCategory(text) {
    const lower = text.toLowerCase();

    let bestMatch = null;
    let bestScore = 0;

    for (const rule of CATEGORY_RULES) {
        let score = 0;
        for (const keyword of rule.keywords) {
            const kwLower = keyword.toLowerCase();
            if (lower.includes(kwLower)) {
                // Longer keywords get more weight
                score += keyword.length;
            }
        }
        if (score > bestScore) {
            bestScore = score;
            bestMatch = rule;
        }
    }

    if (bestMatch && bestScore > 0) {
        const confidence = Math.min(0.95, 0.5 + bestScore * 0.04);
        return {
            category: bestMatch.category,
            department: bestMatch.department,
            confidence: Math.round(confidence * 100) / 100,
        };
    }

    return {
        category: 'Roads & Infrastructure',
        department: 'Public Works',
        confidence: 0.3,
    };
}
