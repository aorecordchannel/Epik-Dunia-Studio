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

        const { targetUid, apiKey, model } = JSON.parse(event.body);
        if (!targetUid || !apiKey) {
            return { statusCode: 400, body: JSON.stringify({ success: false, error: 'Data tidak lengkap.' }) };
        }

        const targetUserRef = db.collection('users').doc(targetUid);
        const targetUserSnap = await targetUserRef.get();
        if (!targetUserSnap.exists) {
            return { statusCode: 404, body: JSON.stringify({ success: false, error: 'User tidak ditemukan.' }) };
        }
        
        const ownerEmail = targetUserSnap.data().email;
        const now = admin.firestore.FieldValue.serverTimestamp();
        
        // Mask the key
        const maskedApiKey = "AIzaSy************" + apiKey.slice(-4);
        
        const keyRef = db.collection('gemini_api_keys').doc();
        
        await keyRef.set({
            ownerUid: targetUid,
            ownerEmail: ownerEmail,
            apiKey: apiKey,
            maskedApiKey: maskedApiKey,
            model: model || 'gemini-1.5-flash',
            status: 'active',
            testStatus: 'not_tested',
            usedThisMonth: 0,
            createdAt: now,
            updatedAt: now
        });

        await targetUserRef.update({
            apiKeyId: keyRef.id,
            apiKeyStatus: 'valid',
            updatedAt: now
        });

        return { statusCode: 200, body: JSON.stringify({ success: true, message: 'API Key berhasil disimpan dan diaktifkan.' }) };

    } catch (error) {
        console.error("Error saving user key:", error);
        return { statusCode: 500, body: JSON.stringify({ success: false, error: error.message }) };
    }
};
