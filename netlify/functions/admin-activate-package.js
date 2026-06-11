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

        const { transactionId } = JSON.parse(event.body);
        if (!transactionId) return { statusCode: 400, body: JSON.stringify({ success: false, error: 'transactionId required.' }) };

        const transactionRef = db.collection('transactions').doc(transactionId);
        const transactionDoc = await transactionRef.get();
        if (!transactionDoc.exists) {
            return { statusCode: 404, body: JSON.stringify({ success: false, error: 'Transaction not found.' }) };
        }

        const tData = transactionDoc.data();
        if (tData.status !== 'pending') {
            return { statusCode: 400, body: JSON.stringify({ success: false, error: `Transaction is already ${tData.status}.` }) };
        }

        // Get plan info
        const planData = getDefaultPlanData(tData.plan);

        // Update transaction
        const now = admin.firestore.Timestamp.now();
        const endAtDate = new Date(now.toDate());
        endAtDate.setDate(endAtDate.getDate() + 30); // Add 30 days
        const endAt = admin.firestore.Timestamp.fromDate(endAtDate);

        await transactionRef.update({
            status: 'paid',
            paidAt: now,
            activatedAt: now,
            expiredAt: endAt
        });

        // Update user
        await db.collection('users').doc(tData.uid).update({
            plan: tData.plan,
            status: 'active',
            subscriptionStatus: 'active',
            packageName: tData.packageName,
            packagePrice: tData.amount,
            credit: planData.credit,
            usedCredit: 0,
            subscriptionStartAt: now,
            subscriptionEndAt: endAt,
            updatedAt: now
        });

        return { statusCode: 200, body: JSON.stringify({ success: true, message: 'Package activated successfully.' }) };
    } catch (error) {
        console.error("Error in admin-activate-package:", error);
        return { statusCode: 500, body: JSON.stringify({ success: false, error: error.message }) };
    }
};

function getDefaultPlanData(planId) {
    const plans = {
        basic: { credit: 300 },
        pro: { credit: 800 },
        premium: { credit: 2000 }
    };
    return plans[planId];
}
