const STOP_WORDS = new Set([
    'a', 'an', 'the', 'is', 'are', 'was', 'were', 'be', 'been', 'being',
    'have', 'has', 'had', 'do', 'does', 'did', 'will', 'would', 'could',
    'should', 'may', 'might', 'shall', 'can', 'need', 'dare', 'ought',
    'to', 'of', 'in', 'for', 'on', 'with', 'at', 'by', 'from', 'as',
    'into', 'through', 'during', 'before', 'after', 'above', 'below',
    'between', 'out', 'off', 'over', 'under', 'again', 'further', 'then',
    'and', 'but', 'or', 'nor', 'not', 'so', 'yet', 'both', 'either',
    'neither', 'each', 'every', 'all', 'any', 'few', 'more', 'most',
    'other', 'some', 'such', 'no', 'only', 'own', 'same', 'than',
    'too', 'very', 'just', 'because', 'if', 'while', 'about', 'up',
    'it', 'its', 'i', 'me', 'my', 'we', 'our', 'you', 'your', 'he',
    'him', 'his', 'she', 'her', 'they', 'them', 'their', 'this', 'that',
    'these', 'those', 'here', 'there', 'when', 'where', 'how', 'what',
    'which', 'who', 'whom', 'why',
]);
function tokenize(text) {
    return text
        .toLowerCase()
        .replace(/[^a-z0-9\s]/g, ' ')
        .split(/\s+/)
        .filter((w) => w.length > 1 && !STOP_WORDS.has(w));
}
function computeTF(tokens) {
    const freq = {};
    tokens.forEach((t) => { freq[t] = (freq[t] || 0) + 1; });
    const total = tokens.length || 1;
    const tf = {};
    for (const t in freq) tf[t] = freq[t] / total;
    return tf;
}
function computeIDF(documents) {
    const df = {};
    const N = documents.length;
    documents.forEach((tokens) => {
        const unique = new Set(tokens);
        unique.forEach((t) => { df[t] = (df[t] || 0) + 1; });
    });
    const idf = {};
    for (const t in df) {
        idf[t] = Math.log((N + 1) / (df[t] + 1)) + 1; 
    }
    return idf;
}
function computeTFIDF(tf, idf) {
    const vec = {};
    for (const t in tf) {
        vec[t] = tf[t] * (idf[t] || 1);
    }
    return vec;
}
function cosineSimilarity(vecA, vecB) {
    const allTerms = new Set([...Object.keys(vecA), ...Object.keys(vecB)]);
    let dotProduct = 0;
    let magA = 0;
    let magB = 0;
    allTerms.forEach((term) => {
        const a = vecA[term] || 0;
        const b = vecB[term] || 0;
        dotProduct += a * b;
        magA += a * a;
        magB += b * b;
    });
    const magnitude = Math.sqrt(magA) * Math.sqrt(magB);
    return magnitude === 0 ? 0 : dotProduct / magnitude;
}
const SIMILARITY_THRESHOLD = 0.55; 
const LOCATION_BOOST = 0.15;       
export function checkForDuplicates(newTitle, newDescription, newLocation, existingComplaints) {
    if (!existingComplaints || existingComplaints.length === 0) {
        return { isDuplicate: false, similarityScore: 0, matchedComplaints: [] };
    }
    const newText = `${newTitle} ${newDescription}`;
    const newTokens = tokenize(newText);
    if (newTokens.length < 2) {
        return { isDuplicate: false, similarityScore: 0, matchedComplaints: [] };
    }
    const existingTexts = existingComplaints.map((c) => `${c.title || ''} ${c.description || ''}`);
    const existingTokensList = existingTexts.map(tokenize);
    const allDocs = [newTokens, ...existingTokensList];
    const idf = computeIDF(allDocs);
    const newTF = computeTF(newTokens);
    const newVec = computeTFIDF(newTF, idf);
    const matches = [];
    existingComplaints.forEach((complaint, idx) => {
        const existingTF = computeTF(existingTokensList[idx]);
        const existingVec = computeTFIDF(existingTF, idf);
        let similarity = cosineSimilarity(newVec, existingVec);
        const locationMatch = newLocation && complaint.location &&
            newLocation.toLowerCase().trim() === complaint.location.toLowerCase().trim();
        if (locationMatch) {
            similarity = Math.min(1.0, similarity + LOCATION_BOOST);
        }
        if (similarity >= SIMILARITY_THRESHOLD) {
            matches.push({
                id: complaint.id,
                title: complaint.title,
                description: complaint.description,
                location: complaint.location,
                status: complaint.status,
                department: complaint.department,
                category: complaint.category,
                urgency: complaint.urgency,
                similarity: Math.round(similarity * 100),
                locationMatch,
                createdAt: complaint.createdAt,
            });
        }
    });
    matches.sort((a, b) => b.similarity - a.similarity);
    const topMatch = matches[0];
    const isDuplicate = topMatch ? topMatch.similarity >= 70 : false;
    return {
        isDuplicate,
        similarityScore: topMatch ? topMatch.similarity : 0,
        matchedComplaints: matches.slice(0, 3), 
    };
}
export function getDuplicateStats(allComplaints) {
    const duplicates = allComplaints.filter((c) => c.isDuplicate);
    const totalDuplicates = duplicates.length;
    const catCount = {};
    duplicates.forEach((c) => {
        const cat = c.category || 'Unknown';
        catCount[cat] = (catCount[cat] || 0) + 1;
    });
    const topCategories = Object.entries(catCount)
        .sort((a, b) => b[1] - a[1])
        .slice(0, 5)
        .map(([category, count]) => ({ category, count }));
    const areaCount = {};
    duplicates.forEach((c) => {
        const loc = c.location || 'Unknown';
        areaCount[loc] = (areaCount[loc] || 0) + 1;
    });
    const topAreas = Object.entries(areaCount)
        .sort((a, b) => b[1] - a[1])
        .slice(0, 5)
        .map(([area, count]) => ({ area, count }));
    const workloadReduced = totalDuplicates * 0.5; 
    return { totalDuplicates, topCategories, topAreas, workloadReduced };
}
