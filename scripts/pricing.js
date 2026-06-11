// scripts/pricing.js

import { auth } from './firebase-config.js';

export async function selectPlan(planId) {
    const user = auth.currentUser;
    
    // Redirect if not logged in
    if (!user) {
        window.location.href = `/login.html?redirect=${encodeURIComponent('/harga.html')}`;
        return;
    }
    
    // Proceed to Netlify Function if logged in
    const msgBox = document.getElementById('pricing-message');
    msgBox.style.display = 'block';
    msgBox.style.backgroundColor = 'rgba(249, 115, 22, 0.1)';
    msgBox.style.color = '#f97316';
    msgBox.textContent = "Memproses pesanan Anda...";
    
    try {
        const token = await user.getIdToken();
        const response = await fetch(`${window.APP_CONFIG.FUNCTIONS_BASE}/select-package`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${token}`
            },
            body: JSON.stringify({ planId })
        });
        
        const data = await response.json();
        
        if (data.success) {
            msgBox.style.backgroundColor = 'rgba(16, 185, 129, 0.1)';
            msgBox.style.color = '#10b981';
            
            if (planId === 'free') {
                msgBox.textContent = "Paket Free berhasil diaktifkan. Anda bisa mulai generate sekarang!";
                setTimeout(() => window.location.href = '/workspace.html', 2000);
            } else {
                msgBox.innerHTML = `Pesanan paket berhasil dibuat. Silakan lakukan pembayaran ke <strong>BCA: 1234567890 (Epik Dunia Studio)</strong>. Admin akan mengaktifkan paket Anda setelah pembayaran dikonfirmasi. <br>ID Transaksi: ${data.transactionId}`;
            }
        } else {
            msgBox.style.backgroundColor = 'rgba(239, 68, 68, 0.1)';
            msgBox.style.color = '#ef4444';
            msgBox.textContent = "Gagal memproses pesanan: " + (data.error || "Unknown error");
        }
    } catch (error) {
        msgBox.style.backgroundColor = 'rgba(239, 68, 68, 0.1)';
        msgBox.style.color = '#ef4444';
        msgBox.textContent = "Terjadi kesalahan jaringan saat memproses pesanan. Pastikan backend sudah di-deploy.";
    }
}

// Make globally available for onclick handlers
window.selectPlan = selectPlan;
