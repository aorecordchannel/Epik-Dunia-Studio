const admin = require('firebase-admin');
const { verifyAdminToken } = require('./admin-auth');

if (!admin.apps.length) {
    admin.initializeApp({
        credential: admin.credential.applicationDefault()
    });
}
const db = admin.firestore();

exports.handler = async (event, context) => {
    if (event.httpMethod !== 'POST') {
        return { statusCode: 405, body: JSON.stringify({ success: false, error: 'Method Not Allowed' }) };
    }

    try {
        if (!verifyAdminToken(event)) {
            return { statusCode: 401, body: JSON.stringify({ success: false, error: 'Akses admin ditolak' }) };
        }

        const { apiKey, model } = JSON.parse(event.body);
        if (!apiKey) return { statusCode: 400, body: JSON.stringify({ success: false, error: 'API Key diperlukan.' }) };

        // MOCK API TEST CALL
        // TODO: Replace with actual Gemini SDK call (e.g. @google/genai)
        // await genai.generateContent({ model: model, prompt: "Jawab hanya OK" });
        const isMockValid = apiKey.length > 10; 
        
        if (isMockValid) {
            return { statusCode: 200, body: JSON.stringify({ success: true, status: 'valid', message: 'API Key valid' }) };
        } else {
            return { statusCode: 200, body: JSON.stringify({ success: false, status: 'invalid', error: 'Format API Key tidak dikenali oleh sistem (MOCK ERROR)' }) };
        }

    } catch (error) {
        console.error("Error testing user key:", error);
        return { statusCode: 500, body: JSON.stringify({ success: false, error: error.message }) };
    }
};
