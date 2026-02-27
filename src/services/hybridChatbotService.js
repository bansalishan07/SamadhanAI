import { getComplaintById } from './firebaseComplaintService';

const FAQS = {
    'how to': 'To register a complaint, go to the **Dashboard** and click **"Submit New Complaint"**. You can describe your issue, provide the location, and upload a photo.',
    'register': 'To register a complaint, go to the **Dashboard** and click **"Submit New Complaint"**. You can describe your issue, provide the location, and upload a photo.',
    'time': 'Most complaints are assigned within **24 hours**. Resolution times depend on severity: High (24-48h), Medium (3-5 days), Low (up to 7 days).',
    'how long': 'Most complaints are assigned within **24 hours**. Resolution times depend on severity: High (24-48h), Medium (3-5 days), Low (up to 7 days).',
    'escalat': 'If your complaint takes too long, it will be automatically escalated to a higher officer. You can also contact support directly via the Help section.',
    'who are you': 'I am the **Smart Civic AI Assistant**. I can help you answer frequently asked questions, guide you on how to use the platform, and track your existing complaints.',
    'hello': 'Hello! I am your Smart Civic Assistant. How can I help you today? You can ask me how to register a complaint or give me a Complaint ID to track it.',
    'hi': 'Hi there! I am your Smart Civic Assistant. How can I help you today? You can ask me how to verify a complaint or give me a Complaint ID to track its status.',
    'thank': 'You\'re welcome! Happy to help. Let me know if you need anything else.',
};

/**
 * Parses user input and determines the best response.
 * Handles FAQ matching and triggering backend API calls for status checks.
 * @param {string} text - User's chat message
 * @param {string|null} currentContext - The current conversation state
 * @returns {Promise<{reply: string, newContext: string|null, actions?: any[]}>}
 */
export async function processChat(text, currentContext = null) {
    const lowerText = text.toLowerCase().trim();

    // Context switching: User is expected to provide a complaint ID
    if (currentContext === 'AWAITING_COMPLAINT_ID') {
        const idToCheck = text.trim();
        // Basic check: IDs are usually alphanumeric
        if (idToCheck.length < 5) {
            return {
                reply: 'That doesn\'t look like a valid Complaint ID. Please paste the full ID (e.g., 8fK92jaL). Or type "cancel" to stop.',
                newContext: 'AWAITING_COMPLAINT_ID'
            };
        }
        if (lowerText === 'cancel' || lowerText === 'nevermind') {
            return {
                reply: 'Okay, status tracking cancelled. What else can I help you with?',
                newContext: null
            };
        }

        try {
            const complaint = await getComplaintById(idToCheck);
            if (complaint) {
                let reply = `📋 **Detailed Status for ${idToCheck}:**\n\n`;
                reply += `**Title:** ${complaint.title}\n`;
                reply += `**Category:** ${complaint.category} (${complaint.department})\n`;
                if (complaint.description) {
                    reply += `**Description:** ${complaint.description.substring(0, 100)}${complaint.description.length > 100 ? '...' : ''}\n`;
                }
                reply += `**Location:** 📍 ${complaint.location}\n`;
                reply += `**Current Status:** ${complaint.status}\n`;
                reply += `**Urgency:** ${complaint.urgency}\n\n`;

                if (complaint.imageSeverity && complaint.imageSeverity.detectedHazard) {
                    reply += `**AI Image Analysis:** Detected ${complaint.imageSeverity.detectedHazard} (Priority: ${complaint.imageSeverity.priorityLevel})\n\n`;
                }

                if (complaint.assignedWorker) {
                    reply += `👷 An officer has been assigned to resolve this issue.`;
                } else {
                    reply += `⏳ This issue is currently pending manual assignment by the department.`;
                }
                return { reply, newContext: null };
            } else {
                return {
                    reply: `Sorry, I couldn't find a complaint with ID **${idToCheck}**. Please double-check the ID or check "My Complaints".`,
                    newContext: null
                };
            }
        } catch (error) {
            console.error('Chatbot status fetch error:', error);
            return {
                reply: 'Oops, there was an error connecting to the database. Please try again later.',
                newContext: null
            };
        }
    }

    // 1. Direct command: track status
    if (lowerText.includes('track') || lowerText.includes('status')) {
        return {
            reply: 'Sure! I can help you track a complaint. Please paste your **Complaint ID** below:',
            newContext: 'AWAITING_COMPLAINT_ID'
        };
    }

    // 2. Fuzzy FAQ Matching
    for (const [key, answer] of Object.entries(FAQS)) {
        if (lowerText.includes(key)) {
            return {
                reply: answer,
                newContext: null
            };
        }
    }

    // 3. Fallback Response
    return {
        reply: "I'm not quite sure how to answer that yet. I can help you **track a complaint status** or answer questions about **how to register** and **escalation times**.",
        newContext: null,
        actions: ['track', 'how to register']
    };
}
