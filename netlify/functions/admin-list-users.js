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
        const usersSnap = await db.collection('users').orderBy('createdAt', 'desc').limit(100).get();
        let users = [];
        usersSnap.forEach(doc => {
            let data = doc.data();
            // Don't send sensitive info
            users.push({
                uid: doc.id,
                email: data.email,
                displayName: data.displayName,
                packageName: data.packageName || 'Free',
                status: data.status || 'active',
                credit: data.credit || 0,
                subscriptionEndAt: data.subscriptionEndAt || null,
                apiKeyStatus: data.apiKeyStatus || 'not_set'
            });
        });

        return { statusCode: 200, body: JSON.stringify({ success: true, users }) };
    } catch (e) {
        return { statusCode: 500, body: JSON.stringify({ success: false, error: e.message }) };
    }
};
