import emailjs from '@emailjs/browser';
const SERVICE_ID = import.meta.env.VITE_EMAILJS_SERVICE_ID || '';
const TEMPLATE_ID = import.meta.env.VITE_EMAILJS_TEMPLATE_ID || '';
const PUBLIC_KEY = import.meta.env.VITE_EMAILJS_PUBLIC_KEY || '';
try {
    if (PUBLIC_KEY && PUBLIC_KEY !== 'your_public_key') {
        emailjs.init({ publicKey: PUBLIC_KEY });
        console.log('✅ EmailJS initialized | Service:', SERVICE_ID, '| Template:', TEMPLATE_ID);
    }
} catch (e) {
    console.warn('EmailJS init warning:', e);
}
export const sendResolvedEmail = async (complaint) => {
    const isMock = !PUBLIC_KEY || PUBLIC_KEY === 'your_public_key' ||
        SERVICE_ID === 'your_service_id' || TEMPLATE_ID === 'your_template_id';
    if (isMock) {
        console.warn('⚠️ EmailJS SIMULATION — set real keys in .env');
        return { status: 200, text: 'OK', simulated: true };
    }
    const templateParams = {
        to_email: complaint.citizenEmail || '',
        user_email: complaint.citizenEmail || '',
        email: complaint.citizenEmail || '',
        to_name: complaint.citizenName || 'Citizen',
        user_name: complaint.citizenName || 'Valued Citizen',
        complaint_id: complaint.id || 'N/A',
        category: complaint.category || 'General',
        location: complaint.location || 'Not specified',
        resolution_date: new Date().toLocaleDateString('en-IN', {
            day: 'numeric', month: 'long', year: 'numeric',
        }),
        message: `Your complaint "${complaint.title || complaint.id}" regarding ${complaint.category || 'your issue'} at ${complaint.location || 'your area'} has been successfully resolved.`,
    };
    console.log('📧 Sending email...', { SERVICE_ID, TEMPLATE_ID, to: complaint.citizenEmail });
    try {
        const response = await emailjs.send(SERVICE_ID, TEMPLATE_ID, templateParams, PUBLIC_KEY);
        console.log('✅ Email sent:', response.status, response.text);
        return { status: response.status, text: response.text, simulated: false };
    } catch (error) {
        const errorMsg = error?.text || error?.message || JSON.stringify(error);
        console.error('❌ EmailJS Error:', errorMsg);
        throw new Error(errorMsg);
    }
};
