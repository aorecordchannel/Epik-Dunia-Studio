const admin = require('firebase-admin');
const { verifyAdminToken } = require('./admin-auth');

if (!admin.apps.length) {
    admin.initializeApp({ credential: admin.credential.applicationDefault() });
}
const db = admin.firestore();

exports.handler = async (event) => {
    if (!verifyAdminToken(event)) {
        return { statusCode: 401, body: JSON.stringify({ success: false, error: 'Akses admin ditolak' }) };
    }

    try {
        const usersSnap = await db.collection('users').get();
        const txSnap = await db.collection('transactions').where('status', '==', 'pending').get();
        
        let stats = {
            totalUsers: usersSnap.size,
            activeUsers: 0,
            freeUsers: 0,
            expiredUsers: 0,
            pendingTransactions: txSnap.size,
            apiKeysSet: 0,
            apiKeysValid: 0
        };

        usersSnap.forEach(doc => {
            const data = doc.data();
            if (data.status === 'active') stats.activeUsers++;
            if (data.plan === 'free') stats.freeUsers++;
            if (data.status === 'expired') stats.expiredUsers++;
            if (data.apiKeyStatus === 'set' || data.apiKeyStatus === 'valid') stats.apiKeysSet++;
            if (data.apiKeyStatus === 'valid') stats.apiKeysValid++;
        });

        return { statusCode: 200, body: JSON.stringify({ success: true, stats }) };
    } catch (e) {
        return { statusCode: 500, body: JSON.stringify({ success: false, error: e.message }) };
    }
};
