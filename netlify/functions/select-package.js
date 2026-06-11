const admin = require('firebase-admin');

// Initialize Firebase Admin (Using placeholder or environment variables)
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
        // Extract token
        const authHeader = event.headers.authorization || '';
        const token = authHeader.split('Bearer ')[1];
        if (!token) {
            return { statusCode: 401, body: JSON.stringify({ success: false, error: 'Unauthorized' }) };
        }

        // Verify token
        const decodedToken = await admin.auth().verifyIdToken(token);
        const uid = decodedToken.uid;
        
        // Parse body
        const { planId } = JSON.parse(event.body);
        if (!['free', 'basic', 'pro', 'premium'].includes(planId)) {
            return { statusCode: 400, body: JSON.stringify({ success: false, error: 'Invalid plan selected.' }) };
        }

        const userRef = db.collection('users').doc(uid);
        const userDoc = await userRef.get();
        if (!userDoc.exists) {
            return { statusCode: 404, body: JSON.stringify({ success: false, error: 'User not found.' }) };
        }

        const planRef = db.collection('plans').doc(planId);
        const planDoc = await planRef.get();
        // Fallback data if collection 'plans' isn't initialized yet
        const planData = planDoc.exists ? planDoc.data() : getDefaultPlanData(planId);

        if (planId === 'free') {
            // Directly update user to free
            await userRef.update({
                plan: 'free',
                packageName: 'Free',
                packagePrice: 0,
                credit: 100,
                dailyCredit: 100,
                subscriptionStatus: 'free',
                subscriptionEndAt: null,
                status: 'active',
                updatedAt: admin.firestore.FieldValue.serverTimestamp()
            });
            return {
                statusCode: 200,
                body: JSON.stringify({ success: true, message: 'Paket Free berhasil diaktifkan.' })
            };
        } else {
            // Create pending transaction
            const transactionRef = db.collection('transactions').doc();
            await transactionRef.set({
                uid: uid,
                email: decodedToken.email,
                plan: planId,
                packageName: planData.name,
                amount: planData.price,
                status: 'pending',
                paymentMethod: 'manual',
                createdAt: admin.firestore.FieldValue.serverTimestamp()
            });

            return {
                statusCode: 200,
                body: JSON.stringify({ 
                    success: true, 
                    message: 'Paket berhasil dipilih. Menunggu aktivasi admin.',
                    transactionId: transactionRef.id
                })
            };
        }
    } catch (error) {
        console.error("Error in select-package:", error);
        return { statusCode: 500, body: JSON.stringify({ success: false, error: error.message }) };
    }
};

function getDefaultPlanData(planId) {
    const plans = {
        free: { name: 'Free', price: 0, credit: 100 },
        basic: { name: 'Basic', price: 10000, credit: 300 },
        pro: { name: 'Pro', price: 20000, credit: 800 },
        premium: { name: 'Premium', price: 30000, credit: 2000 }
    };
    return plans[planId];
}
