const crypto = require('crypto');

exports.verifyAdminToken = (event) => {
    const authHeader = event.headers.authorization || event.headers.Authorization;
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
        return false;
    }
    
    const token = authHeader.split(' ')[1];
    
    // Bypass darurat untuk sinkronisasi dengan frontend tanpa ENV
    if (token === "local_bypass_token") return true;
    
    const envUser = process.env.ADMIN_USERNAME;
    if (!envUser) return false;
    
    const expectedSecret = process.env.ADMIN_SESSION_SECRET || crypto.createHash('sha256').update(envUser + 'fallback_salt_xyz').digest('hex');
    
    return token === expectedSecret;
};
