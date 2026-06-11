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
        // 1. Authenticate user
        const authHeader = event.headers.authorization || '';
        const token = authHeader.split('Bearer ')[1];
        if (!token) return { statusCode: 401, body: JSON.stringify({ success: false, error: 'Unauthorized' }) };
        
        const decodedToken = await admin.auth().verifyIdToken(token);
        const uid = decodedToken.uid;
        
        // 2. Fetch User & Check Limits
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
        
        // Free reset check logic before generation (in case they didn't reload workspace.html)
        let currentCredit = userData.credit;
        const now = admin.firestore.Timestamp.now();
        if (userData.plan === 'free') {
            const lastReset = userData.lastCreditResetAt ? userData.lastCreditResetAt.toDate() : new Date(0);
            const today = new Date(now.toDate());
            if (lastReset.getDate() !== today.getDate() || lastReset.getMonth() !== today.getMonth() || lastReset.getFullYear() !== today.getFullYear()) {
                currentCredit = 100;
                await userRef.update({ credit: 100, lastCreditResetAt: now });
            }
        }

        // Credit check
        if (currentCredit < generateCost) {
            if (userData.plan === 'free') {
                return { statusCode: 403, body: JSON.stringify({ success: false, error: 'Credit gratis hari ini sudah habis. Silakan coba besok atau upgrade paket.' }) };
            }
            return { statusCode: 403, body: JSON.stringify({ success: false, error: 'Credit Anda tidak cukup. Silakan upgrade paket.' }) };
        }

        // 3. Process Generation (Simulation for now, Gemini API can be injected here)
        const { prompt, skill } = JSON.parse(event.body);
        
        // --- TODO: MOCK GEMINI API CALL HERE ---
        let aiResponse = `Memproses prompt: "${prompt}" menggunakan skill: ${skill}`;
        if (skill === 'chat') aiResponse = "Project disiapkan di canvas.";
        if (skill === 'ceklis') aiResponse = "Ceklis telah disusun berdasarkan ide Anda.";
        if (skill === 'generator') aiResponse = "Struktur proyek aplikasi lengkap berhasil di-generate.";
        
        // 4. Deduct Credits
        const newCredit = currentCredit - generateCost;
        const newUsedCredit = (userData.usedCredit || 0) + generateCost;
        
        await userRef.update({
            credit: newCredit,
            usedCredit: newUsedCredit,
            updatedAt: admin.firestore.FieldValue.serverTimestamp()
        });
        
        // Optional: Save usage log to a 'logs' collection

        // 5. Return JSON
        return {
            statusCode: 200,
            body: JSON.stringify({
                success: true,
                aiResponse: aiResponse,
                remainingCredit: newCredit
            })
        };

    } catch (error) {
        console.error("Error in generate-eds:", error);
        return { statusCode: 500, body: JSON.stringify({ success: false, error: error.message }) };
    }
};
