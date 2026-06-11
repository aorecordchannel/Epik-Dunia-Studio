// Dashboard/dashboard.js

const TOKEN_KEY = 'eds_admin_token';

// Elements
const adminDashboardView = document.getElementById('adminDashboardView');
const logoutBtn = document.getElementById('logout-btn');
const sidebarNav = document.getElementById('sidebar-nav');
const sections = document.querySelectorAll('.dashboard-section');

// Navigation Titles
const pageTitle = document.getElementById('page-title');
const pageSubtitle = document.getElementById('page-subtitle');
const sectionTitles = {
    'section-dashboard': { title: 'Dashboard', subtitle: 'Ringkasan platform Epik Dunia Studio.' },
    'section-users': { title: 'Manajemen User', subtitle: 'Daftar pengguna terdaftar di platform.' },
    'section-packages': { title: 'Daftar Paket', subtitle: 'Informasi paket berlangganan.' },
    'section-transactions': { title: 'Transaksi', subtitle: 'Daftar transaksi dan aktivasi paket.' },
    'section-api-keys': { title: 'API Key User', subtitle: 'Kelola akses API Gemini untuk user.' }
};

// 1. Saat halaman dibuka
document.addEventListener('DOMContentLoaded', () => {
    if (window.location.protocol === "file:") {
        document.body.innerHTML = '<h2 style="color:white; text-align:center; margin-top:50px;">Jalankan project dengan npm run dev lalu buka http://localhost:8888/Dashboard</h2>';
        return;
    }
    
    // Cek status login admin
    if (sessionStorage.getItem("eds_admin_logged_in") !== "true") {
        window.location.href = "/login.html?redirect=/Dashboard";
        return;
    }

    // Jika berhasil masuk
    adminDashboardView.classList.remove('hidden');
    loadDashboardStats();
    setupNavigation();
});

// Custom Fetch with Bearer Token
async function adminFetch(endpoint, options = {}) {
    const token = sessionStorage.getItem(TOKEN_KEY);
    if (!token) {
        handleLogout();
        throw new Error('Akses ditolak: Token tidak ditemukan');
    }

    const headers = {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${token}`,
        ...(options.headers || {})
    };

    const response = await fetch(`/.netlify/functions/${endpoint}`, {
        ...options,
        headers
    });

    const data = await response.json();
    if (!data.success && data.error === 'Akses admin ditolak') {
        handleLogout();
        throw new Error(data.error);
    }

    return data;
}

// 6. Tambahkan tombol logout
logoutBtn.addEventListener('click', handleLogout);

function handleLogout() {
    sessionStorage.removeItem("eds_admin_logged_in");
    sessionStorage.removeItem("eds_admin_email");
    sessionStorage.removeItem("eds_admin_role");
    sessionStorage.removeItem(TOKEN_KEY);
    window.location.href = "/login.html";
}

// Setup Navigation
function setupNavigation() {
    const links = sidebarNav.querySelectorAll('a');
    links.forEach(link => {
        link.addEventListener('click', (e) => {
            e.preventDefault();
            
            links.forEach(l => l.classList.remove('active'));
            link.classList.add('active');
            
            sections.forEach(sec => sec.classList.add('hidden'));
            
            const targetId = link.getAttribute('data-target');
            document.getElementById(targetId).classList.remove('hidden');
            
            if (sectionTitles[targetId]) {
                pageTitle.textContent = sectionTitles[targetId].title;
                pageSubtitle.textContent = sectionTitles[targetId].subtitle;
            }
            
            if (targetId === 'section-dashboard') loadDashboardStats();
            else if (targetId === 'section-users') loadUsers();
            else if (targetId === 'section-transactions') loadTransactions();
        });
    });
}

// Data Loaders
async function loadDashboardStats() {
    try {
        const data = await adminFetch('admin-stats');
        if (data.success) {
            document.getElementById('stat-total-users').textContent = data.stats.totalUsers || 0;
            document.getElementById('stat-active-users').textContent = data.stats.activeUsers || 0;
            document.getElementById('stat-free-users').textContent = data.stats.freeUsers || 0;
            document.getElementById('stat-expired-users').textContent = data.stats.expiredUsers || 0;
            document.getElementById('stat-pending-tx').textContent = data.stats.pendingTransactions || 0;
            document.getElementById('stat-api-keys').textContent = data.stats.apiKeysSet || 0;
            document.getElementById('stat-api-valid').textContent = data.stats.apiKeysValid || 0;
        }
    } catch (err) {
        console.error("Gagal load stats:", err);
    }
}

async function loadUsers() {
    try {
        const data = await adminFetch('admin-list-users');
        const tbody = document.querySelector('#users-table tbody');
        tbody.innerHTML = '';
        
        if (data.success && data.users) {
            data.users.forEach(u => {
                const tr = document.createElement('tr');
                tr.innerHTML = `
                    <td>${u.email}</td>
                    <td>${u.displayName}</td>
                    <td><span class="badge ${u.packageName === 'Free' ? 'warning' : 'success'}">${u.packageName}</span></td>
                    <td>${u.status}</td>
                    <td>${u.credit}</td>
                    <td>${u.subscriptionEndAt ? new Date(u.subscriptionEndAt._seconds * 1000).toLocaleDateString() : '-'}</td>
                    <td>${u.apiKeyStatus === 'set' ? 'Terpasang' : 'Belum'}</td>
                    <td>
                        <button class="btn-action" onclick="alert('Detail belum diimplementasi')">Detail</button>
                    </td>
                `;
                tbody.appendChild(tr);
            });
        }
    } catch (err) {
        console.error("Gagal load users:", err);
    }
}

async function loadTransactions() {
    try {
        const data = await adminFetch('admin-list-transactions');
        const tbody = document.querySelector('#transactions-table tbody');
        tbody.innerHTML = '';
        
        if (data.success && data.transactions) {
            data.transactions.forEach(t => {
                const tr = document.createElement('tr');
                tr.innerHTML = `
                    <td>${t.email}</td>
                    <td>${t.package}</td>
                    <td>Rp${t.amount}</td>
                    <td><span class="badge ${t.status === 'pending' ? 'warning' : 'success'}">${t.status}</span></td>
                    <td>${new Date(t.createdAt._seconds * 1000).toLocaleDateString()}</td>
                    <td>
                        <button class="btn-action" onclick="activatePackage('${t.id}')">Aktifkan</button>
                    </td>
                `;
                tbody.appendChild(tr);
            });
        }
    } catch (err) {
        console.error("Gagal load tx:", err);
    }
}

window.activatePackage = async (txId) => {
    if (!confirm('Aktifkan paket untuk transaksi ini?')) return;
    try {
        const res = await adminFetch('admin-activate-package', {
            method: 'POST',
            body: JSON.stringify({ transactionId: txId })
        });
        if (res.success) {
            alert('Paket berhasil diaktifkan!');
            loadTransactions();
        } else {
            alert('Gagal: ' + res.error);
        }
    } catch (err) {
        console.error(err);
    }
};

document.getElementById('api-key-form').addEventListener('submit', async (e) => {
    e.preventDefault();
    const email = document.getElementById('api-user-email').value;
    const model = document.getElementById('api-model').value;
    const apiKey = document.getElementById('api-key-value').value;
    const msg = document.getElementById('api-key-msg');
    
    msg.textContent = 'Menyimpan...';
    msg.style.color = 'rgba(255,255,255,0.6)';
    
    try {
        const res = await adminFetch('admin-save-user-key', {
            method: 'POST',
            body: JSON.stringify({ email, apiKey, model })
        });
        
        if (res.success) {
            msg.textContent = 'API Key berhasil disimpan!';
            msg.style.color = '#10b981';
            document.getElementById('api-key-form').reset();
            loadDashboardStats();
        } else {
            msg.textContent = 'Gagal: ' + res.error;
            msg.style.color = '#ef4444';
        }
    } catch (err) {
        msg.textContent = 'Error: ' + err.message;
        msg.style.color = '#ef4444';
    }
});

document.getElementById('btn-test-key').addEventListener('click', async () => {
    const apiKey = document.getElementById('api-key-value').value;
    const msg = document.getElementById('api-key-msg');
    if (!apiKey) {
        msg.textContent = 'Masukkan API key terlebih dahulu.';
        msg.style.color = '#ef4444';
        return;
    }
    
    msg.textContent = 'Mengetes API Key...';
    msg.style.color = 'rgba(255,255,255,0.6)';
    
    try {
        const res = await adminFetch('admin-test-user-key', {
            method: 'POST',
            body: JSON.stringify({ apiKey })
        });
        
        if (res.success) {
            msg.textContent = '✅ API Key Valid!';
            msg.style.color = '#10b981';
        } else {
            msg.textContent = '❌ Invalid API Key: ' + res.error;
            msg.style.color = '#ef4444';
        }
    } catch (err) {
        msg.textContent = 'Error: ' + err.message;
        msg.style.color = '#ef4444';
    }
});
