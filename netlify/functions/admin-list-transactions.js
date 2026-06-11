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
        const txSnap = await db.collection('transactions').where('status', '==', 'pending').orderBy('createdAt', 'desc').get();
        let transactions = [];
        txSnap.forEach(doc => {
            let data = doc.data();
            transactions.push({
                id: doc.id,
                email: data.email,
                package: data.packageName || data.plan,
                amount: data.amount,
                status: data.status,
                createdAt: data.createdAt
            });
        });

        return { statusCode: 200, body: JSON.stringify({ success: true, transactions }) };
    } catch (e) {
        return { statusCode: 500, body: JSON.stringify({ success: false, error: e.message }) };
    }
};
