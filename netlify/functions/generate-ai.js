const admin = require('firebase-admin');

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
        const authHeader = event.headers.authorization || '';
        const token = authHeader.split('Bearer ')[1];
        if (!token) return { statusCode: 401, body: JSON.stringify({ success: false, error: 'Unauthorized' }) };
        
        const decodedToken = await admin.auth().verifyIdToken(token);
        const uid = decodedToken.uid;
        
        const { appId, prompt, inputData, selectedModel } = JSON.parse(event.body);
        
        // Cek App Id
        if (appId !== 'lyricshot' && appId !== 'workspace') {
             return { statusCode: 403, body: JSON.stringify({ success: false, error: 'App ini masih segera hadir.' }) };
        }
        
        const userRef = db.collection('users').doc(uid);
        const userDoc = await userRef.get();
        if (!userDoc.exists) return { statusCode: 404, body: JSON.stringify({ success: false, error: 'User not found' }) };
        
        const userData = userDoc.data();
        const generateCost = 10;
        
        // Expiration check
        if (userData.subscriptionStatus === 'expired') {
            return { statusCode: 403, body: JSON.stringify({ success: false, error: 'Paket Anda sudah expired. Silakan perpanjang paket.' }) };
        }
        if (userData.status === 'inactive') {
            return { statusCode: 403, body: JSON.stringify({ success: false, error: 'Paket belum aktif. Silakan pilih paket atau hubungi admin.' }) };
        }
        
        // Credit check
        if (userData.credit < generateCost) {
            if (userData.plan === 'free') {
                return { statusCode: 403, body: JSON.stringify({ success: false, error: 'Credit gratis hari ini sudah habis. Silakan coba besok atau upgrade paket.' }) };
            }
            return { statusCode: 403, body: JSON.stringify({ success: false, error: 'Credit Anda tidak cukup. Silakan upgrade paket.' }) };
        }

        // Ambil Gemini API key milik user
        let targetApiKey = null;
        if (userData.apiKeyId) {
            const keyDoc = await db.collection('gemini_api_keys').doc(userData.apiKeyId).get();
            if (keyDoc.exists && keyDoc.data().ownerUid === uid) {
                targetApiKey = keyDoc.data().apiKey;
                // update usage logic here if needed
            }
        }
        
        // Fallback jika tidak ada API key
        if (!targetApiKey) {
            // Opsional: Boleh ditolak atau gunakan kunci bawaan (fallback key server)
            // return { statusCode: 403, body: JSON.stringify({ success: false, error: 'API Key Anda belum dipasang. Hubungi admin.' }) };
        }

        // --- MOCK GEMINI GENERATION BASED ON APP ID ---
        let aiResponse = "";
        if (appId === 'lyricshot') {
            aiResponse = `[Storyboard Concept generated for: "${prompt}"]\n\nMood: Cinematic\nCamera: Slow Dolly\nVisual: Epic cinematic view.\nPrompt: Masterpiece, 8k, highly detailed.`;
        } else if (appId === 'workspace') {
            aiResponse = `[App Plan generated for: "${prompt}"]\n\nApp Name: MyIdea App\nPRD: This app will solve the user's problem.\nChecklist: - Setup DB\n- Build UI.`;
        }
        
        // Deduct Credits
        const newCredit = userData.credit - generateCost;
        const newUsedCredit = (userData.usedCredit || 0) + generateCost;
        
        await userRef.update({
            credit: newCredit,
            usedCredit: newUsedCredit,
            updatedAt: admin.firestore.FieldValue.serverTimestamp()
        });
        
        // Return result
        return {
            statusCode: 200,
            body: JSON.stringify({
                success: true,
                aiResponse: aiResponse,
                remainingCredit: newCredit
            })
        };

    } catch (error) {
        console.error("Error in generate-ai:", error);
        return { statusCode: 500, body: JSON.stringify({ success: false, error: error.message }) };
    }
};
