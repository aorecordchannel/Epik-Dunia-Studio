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
        
        const userRef = db.collection('users').doc(uid);
        const userDoc = await userRef.get();
        if (!userDoc.exists) return { statusCode: 404, body: JSON.stringify({ success: false, error: 'User not found' }) };

        let userData = userDoc.data();
        let needsUpdate = false;
        let updateData = {};
        
        const now = admin.firestore.Timestamp.now();
        
        // 1. Check expiration for paid plans
        if (userData.plan !== 'free' && userData.subscriptionEndAt) {
            if (now.toMillis() > userData.subscriptionEndAt.toMillis()) {
                userData.subscriptionStatus = 'expired';
                userData.status = 'inactive';
                userData.credit = 0;
                
                updateData.subscriptionStatus = 'expired';
                updateData.status = 'inactive';
                updateData.credit = 0;
                needsUpdate = true;
            }
        }
        
        // 2. Check daily reset for Free plan
        if (userData.plan === 'free') {
            const lastReset = userData.lastCreditResetAt ? userData.lastCreditResetAt.toDate() : new Date(0);
            const today = new Date(now.toDate());
            
            // Check if last reset was on a different date (ignoring time)
            if (lastReset.getFullYear() !== today.getFullYear() || 
                lastReset.getMonth() !== today.getMonth() || 
                lastReset.getDate() !== today.getDate()) {
                
                userData.credit = 100;
                updateData.credit = 100;
                updateData.lastCreditResetAt = now;
                needsUpdate = true;
            }
        }
        
        // Update database if state changed
        if (needsUpdate) {
            updateData.updatedAt = now;
            await userRef.update(updateData);
        }

        return {
            statusCode: 200,
            body: JSON.stringify({
                success: true,
                plan: userData.plan,
                status: userData.status,
                subscriptionStatus: userData.subscriptionStatus,
                credit: userData.credit,
                packageName: userData.packageName,
                subscriptionEndAt: userData.subscriptionEndAt
            })
        };
    } catch (error) {
        console.error("Error in check-subscription:", error);
        return { statusCode: 500, body: JSON.stringify({ success: false, error: error.message }) };
    }
};
