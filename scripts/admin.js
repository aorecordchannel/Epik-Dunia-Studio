// scripts/admin.js

import { auth, db } from './firebase-config.js';
import { collection, query, where, getDocs, orderBy } from "https://www.gstatic.com/firebasejs/10.8.1/firebase-firestore.js";
import { onAuthStateChanged, signOut } from "https://www.gstatic.com/firebasejs/10.8.1/firebase-auth.js";

const tbody = document.getElementById('transaction-list');
const msgBox = document.getElementById('admin-message');

onAuthStateChanged(auth, async (user) => {
    if (!user) {
        window.location.href = `login.html?redirect=${encodeURIComponent('admin.html')}`;
        return;
    }
    
    // Ideally we should check if user role is "admin" here as well
    // For now we load the transactions
    loadPendingTransactions();
});

document.getElementById('logout-btn').addEventListener('click', async () => {
    await signOut(auth);
    window.location.href = 'login.html';
});

async function loadPendingTransactions() {
    try {
        const q = query(
            collection(db, "transactions"), 
            where("status", "==", "pending")
        );
        const querySnapshot = await getDocs(q);
        
        tbody.innerHTML = '';
        
                <td>${dateStr}</td>
                <td><span style="background: rgba(245, 158, 11, 0.2); color: #f59e0b; padding: 0.2rem 0.5rem; border-radius: 4px; font-size: 0.8rem;">Pending</span></td>
                <td>
                    <button class="btn-action" onclick="activateTransaction('${doc.id}')">Aktifkan Paket</button>
                </td>
            `;
            tbody.appendChild(tr);
        });
        
        // Update Stats
        document.getElementById('stat-pending-trx').textContent = querySnapshot.size;
        
        // Fetch User Stats
        const usersRef = collection(db, 'users');
        const usersSnap = await getDocs(usersRef);
        let activeUsers = 0;
        usersSnap.forEach(doc => {
            if (doc.data().status === 'active' || doc.data().plan === 'free') {
                activeUsers++;
            }
        });
        document.getElementById('stat-active-users').textContent = activeUsers;
        
        // Fetch API Key Stats
        const apiKeysRef = collection(db, 'gemini_api_keys');
        const apiKeysSnap = await getDocs(apiKeysRef);
        document.getElementById('stat-api-keys').textContent = apiKeysSnap.size;

    } catch (error) {
        console.error("Gagal memuat transaksi:", error);
        tbody.innerHTML = '<tr><td colspan="7" style="text-align: center; color: #ef4444;">Gagal memuat data (Anda mungkin bukan Admin atau database belum siap).</td></tr>';
    }
}

// Aktifkan paket
window.activatePackage = async function(transactionId) {
    if (!confirm('Anda yakin ingin mengaktifkan paket ini?')) return;
    
    try {
        const token = await auth.currentUser.getIdToken();
        const response = await fetch('/.netlify/functions/admin-activate-package', {
            method: 'POST',
            headers: { 'Authorization': `Bearer ${token}` },
            body: JSON.stringify({ transactionId })
        });
        
        const result = await response.json();
        if (result.success) {
            alert('Paket berhasil diaktifkan!');
            loadAdminData(); // Reload data
        } else {
            alert('Error: ' + result.error);
        }
    } catch (error) {
        console.error('Activation error:', error);
        alert('Terjadi kesalahan saat mengaktifkan paket.');
    }
};

// API Key Management Functions
window.searchUserForApiKey = async function() {
    const email = document.getElementById('searchUserEmail').value.trim();
    if (!email) return alert('Masukkan email user.');

    try {
        const usersRef = collection(db, 'users');
        const q = query(usersRef, where('email', '==', email));
        const querySnapshot = await getDocs(q);

        if (querySnapshot.empty) {
            alert('User tidak ditemukan.');
            document.getElementById('apiKeyUserResult').innerHTML = '';
            return;
        }

        let targetUid = '';
        let targetName = '';
        querySnapshot.forEach((doc) => {
            targetUid = doc.id;
            targetName = doc.data().displayName || doc.data().email;
        });

        document.getElementById('targetUidForApi').value = targetUid;
        document.getElementById('apiKeyUserResult').innerHTML = `<p style="color:var(--text-success)">User ditemukan: ${targetName}</p>`;
    } catch (error) {
        console.error('Error searching user:', error);
        alert('Gagal mencari user.');
    }
};

window.testUserApiKey = async function() {
    const apiKey = document.getElementById('inputUserApiKey').value.trim();
    const model = document.getElementById('inputUserModel').value;
    
    if (!apiKey) return alert('API Key kosong.');

    try {
        document.getElementById('testApiBtn').textContent = 'Testing...';
        const token = await auth.currentUser.getIdToken();
        const response = await fetch('/.netlify/functions/admin-test-user-key', {
            method: 'POST',
            headers: { 'Authorization': `Bearer ${token}` },
            body: JSON.stringify({ apiKey, model })
        });
        
        const result = await response.json();
        if (result.success) {
            alert('API Key Valid! ' + result.message);
        } else {
            alert('API Key Invalid: ' + result.error);
        }
    } catch (error) {
        console.error('Testing error:', error);
        alert('Terjadi kesalahan saat testing API Key.');
    } finally {
        document.getElementById('testApiBtn').textContent = 'Tes API Key';
    }
};

window.saveUserApiKey = async function() {
    const targetUid = document.getElementById('targetUidForApi').value;
    const apiKey = document.getElementById('inputUserApiKey').value.trim();
    const model = document.getElementById('inputUserModel').value;

    if (!targetUid) return alert('Silakan cari dan pilih user terlebih dahulu.');
    if (!apiKey) return alert('API Key kosong.');

    try {
        const token = await auth.currentUser.getIdToken();
        const response = await fetch('/.netlify/functions/admin-save-user-key', {
            method: 'POST',
            headers: { 'Authorization': `Bearer ${token}` },
            body: JSON.stringify({ targetUid, apiKey, model })
        });
        
        const result = await response.json();
        if (result.success) {
            alert('Berhasil: ' + result.message);
            document.getElementById('inputUserApiKey').value = '';
            document.getElementById('targetUidForApi').value = '';
            document.getElementById('searchUserEmail').value = '';
            document.getElementById('apiKeyUserResult').innerHTML = '';
        } else {
            alert('Gagal: ' + result.error);
        }
    } catch (error) {
        console.error('Saving API Key error:', error);
        alert('Terjadi kesalahan saat menyimpan API Key.');
    }
};

async function activateTransaction(transactionId) {
    if (!confirm("Apakah Anda yakin telah menerima pembayaran dan ingin mengaktifkan paket ini?")) return;
    
    try {
        const token = await auth.currentUser.getIdToken();
        const response = await fetch('/.netlify/functions/admin-activate-package', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${token}`
            },
            body: JSON.stringify({ transactionId })
        });
        
        const data = await response.json();
        if (data.success) {
            msgBox.style.display = 'block';
            msgBox.textContent = `Berhasil! Paket untuk transaksi ${transactionId} telah diaktifkan.`;
            loadPendingTransactions(); // Reload list
        } else {
            alert("Gagal mengaktifkan paket: " + data.error);
        }
    } catch (e) {
        alert("Terjadi kesalahan jaringan.");
    }
}

window.activateTransaction = activateTransaction;
