// scripts/lyricshot.js


let userCredit = 0;

async function checkSubscription() {
    const subPanel = document.getElementById('subscriptionPanel');
    const user = window.auth.currentUser;
    if (!user) return;

    try {
        const token = await user.getIdToken();
        const response = await fetch(`${window.APP_CONFIG.FUNCTIONS_BASE}/check-subscription`, {
            method: 'POST',
            headers: { 'Authorization': `Bearer ${token}` }
        });
        
        const result = await response.json();
        if (result.success) {
            userCredit = result.credit;
            let planName = result.packageName || result.plan;
            
            subPanel.innerHTML = `
                <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 0.5rem;">
                    <span style="font-size: 0.85rem; color: var(--text-secondary);">Paket Aktif:</span>
                    <span style="font-weight: 600; color: var(--accent-blue); text-transform: capitalize;">${planName}</span>
                </div>
                <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 0.5rem;">
                    <span style="font-size: 0.85rem; color: var(--text-secondary);">Sisa Credit:</span>
                    <span style="font-weight: 600; color: var(--ws-orange);">${result.credit} cr</span>
                </div>
                ${result.subscriptionEndAt ? `
                <div style="display: flex; justify-content: space-between; align-items: center;">
                    <span style="font-size: 0.85rem; color: var(--text-secondary);">Expired:</span>
                    <span style="font-size: 0.85rem; color: var(--text-primary);">${new Date(result.subscriptionEndAt._seconds * 1000).toLocaleDateString()}</span>
                </div>
                ` : ''}
            `;

            if (result.subscriptionStatus === 'expired') {
                alert('Paket Anda sudah expired. Silakan perpanjang paket.');
                window.location.href = '/harga.html';
            }
        }
    } catch (error) {
        console.error('Error checking subscription:', error);
    }
}

document.addEventListener('DOMContentLoaded', () => {
    // Wait for auth to be ready
    window.auth.onAuthStateChanged((user) => {
        if (user) {
            checkSubscription();
        }
    });

    const generateBtn = document.getElementById('generateBtn');
    const resultCanvas = document.getElementById('resultCanvas');

    generateBtn.addEventListener('click', async () => {
        const lyric = document.getElementById('lyricInput').value.trim();
        const genre = document.getElementById('genreInput').value.trim();
        const mood = document.getElementById('moodInput').value.trim();
        const mode = document.getElementById('outputMode').value;

        if (!lyric) {
            alert('Lirik lagu wajib diisi.');
            return;
        }

        if (userCredit < 10) {
            alert('Credit Anda tidak cukup untuk melakukan generate (butuh 10 credit). Silakan upgrade paket.');
            return;
        }

        generateBtn.disabled = true;
        generateBtn.textContent = 'Memproses...';
        resultCanvas.innerHTML = '<div style="color: var(--accent-blue); text-align: center; margin-top: 5rem;">Menganalisis lirik dan menyusun storyboard...<br><small style="color:var(--text-secondary)">Ini mungkin memakan waktu beberapa detik.</small></div>';

        try {
            const token = await window.auth.currentUser.getIdToken();
            const inputData = { lyric, genre, mood, mode };
            
            const response = await fetch(`${window.APP_CONFIG.FUNCTIONS_BASE}/generate-ai`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${token}`
                },
                body: JSON.stringify({
                    appId: 'lyricshot',
                    prompt: lyric,
                    inputData: inputData
                })
            });

            const result = await response.json();
            
            if (result.success) {
                resultCanvas.innerHTML = `<div style="color: var(--text-primary);">${result.aiResponse.replace(/\n/g, '<br>')}</div>`;
                checkSubscription(); // Reload credit info
            } else {
                resultCanvas.innerHTML = `<div style="color: #ef4444;">Error: ${result.error}</div>`;
            }

        } catch (error) {
            console.error('Generate error:', error);
            resultCanvas.innerHTML = `<div style="color: #ef4444;">Terjadi kesalahan sistem.</div>`;
        } finally {
            generateBtn.disabled = false;
            generateBtn.textContent = 'Generate Konsep (-10 Credit)';
        }
    });
});

