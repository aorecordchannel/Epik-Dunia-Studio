// scripts/auth.js

import { auth, db, googleProvider } from './firebase-config.js';
import { 
    signInWithEmailAndPassword, 
    createUserWithEmailAndPassword, 
    signInWithPopup, 
    onAuthStateChanged,
    signOut 
} from "https://www.gstatic.com/firebasejs/10.8.1/firebase-auth.js";
import { doc, setDoc, getDoc, serverTimestamp } from "https://www.gstatic.com/firebasejs/10.8.1/firebase-firestore.js";

// === ROUTE PROTECTION ===
export function checkAuthAndRedirect() {
    if (window.location.protocol === "file:") {
        alert("Jangan buka file langsung dari folder. Jalankan project menggunakan localhost, contoh: netlify dev atau npm run dev.");
        return;
    }

    onAuthStateChanged(auth, (user) => {
        const isLoginPage = window.location.pathname.includes('login.html');
        
        if (!user && !isLoginPage) {
            // Not logged in, redirect to login
            const currentUrl = encodeURIComponent(window.location.pathname + window.location.search);
            window.location.href = `login.html?redirect=${currentUrl}`;
        } else if (user && isLoginPage) {
            // Logged in but on login page, redirect to target or workspace
            const redirectTo = getSafeRedirect("produk.html");
            window.location.href = redirectTo;
        }
    });
}

function getSafeRedirect(defaultRoute = "produk.html") {
    const params = new URLSearchParams(window.location.search);
    const redirect = params.get("redirect");

    if (!redirect) return defaultRoute;

    // Cegah redirect ke website luar
    if (redirect.startsWith("http://") || redirect.startsWith("https://") || redirect.startsWith("//")) {
        return defaultRoute;
    }

    return redirect;
}

// === GLOBAL UI OBSERVER ===
if (auth) {
    onAuthStateChanged(auth, (user) => {
        const loginBtn = document.getElementById('nav-login-btn');
    if (loginBtn) {
        if (user) {
            loginBtn.textContent = 'Dashboard / Akun';
            loginBtn.href = 'produk.html';
            
            // Add logout button if it doesn't exist
            if (!document.getElementById('nav-logout-btn')) {
                const logoutBtn = document.createElement('a');
                logoutBtn.href = '#';
                logoutBtn.id = 'nav-logout-btn';
                logoutBtn.className = 'btn-login';
                logoutBtn.style.marginLeft = '10px';
                logoutBtn.style.background = 'transparent';
                logoutBtn.style.border = '1px solid var(--border-color)';
                logoutBtn.textContent = 'Logout';
                logoutBtn.onclick = (e) => { 
                    e.preventDefault(); 
                    logoutUser(); 
                };
                loginBtn.parentNode.insertBefore(logoutBtn, loginBtn.nextSibling);
            }
        } else {
            loginBtn.textContent = 'Login';
            loginBtn.href = 'login.html';
            const logoutBtn = document.getElementById('nav-logout-btn');
            if (logoutBtn) logoutBtn.remove();
        }
        }
    });
}

// Check if user is logged in before navigating to a protected app
export function openProtectedApp(appRoute) {
    if (window.location.protocol === "file:") {
        alert("Jangan buka file langsung dari folder. Jalankan project menggunakan localhost.");
        return;
    }

    onAuthStateChanged(auth, (user) => {
        if (!user) {
            window.location.href = `login.html?redirect=${encodeURIComponent(appRoute)}`;
            return;
        }
        window.location.href = appRoute;
    });
}

// Assign to window for inline HTML onclick handlers
window.openProtectedApp = openProtectedApp;

// === USER MANAGEMENT ===

// Initialize new user in Firestore
async function createNewUserDoc(user) {
    const userRef = doc(db, 'users', user.uid);
    const userSnap = await getDoc(userRef);
    
    // Only create if it doesn't exist
    if (!userSnap.exists()) {
        const now = serverTimestamp();
        await setDoc(userRef, {
            uid: user.uid,
            email: user.email,
            displayName: user.displayName || user.email.split('@')[0],
            photoURL: user.photoURL || '',
            role: "user",
            plan: "free",
            status: "active",
            subscriptionStatus: "free",
            packageName: "Free",
            packagePrice: 0,
            credit: 100,
            usedCredit: 0,
            dailyCredit: 100,
            lastCreditResetAt: now,
            subscriptionStartAt: now,
            subscriptionEndAt: null, // Free doesn't expire
            apiKeyId: null,
            apiKeyStatus: "not_set",
            createdAt: now,
            updatedAt: now
        });
    }
}

// === AUTHENTICATION LOGIC ===

export async function loginWithEmail(email, password) {
    const ADMIN_EMAIL = "salmanbs2018@gmail.com";
    const ADMIN_PASSWORD = "armanofi88";

    // Cek admin terlebih dahulu sebelum Firebase
    if (email === ADMIN_EMAIL && password === ADMIN_PASSWORD) {
        try {
            // Ambil token dari Netlify Function untuk mengamankan API Dashboard
            const adminRes = await fetch('/.netlify/functions/admin-login', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ username: email, password: password })
            });
            const adminData = await adminRes.json();
            
            if (adminData.success) {
                sessionStorage.setItem("eds_admin_logged_in", "true");
                sessionStorage.setItem("eds_admin_email", ADMIN_EMAIL);
                sessionStorage.setItem("eds_admin_role", "admin");
                sessionStorage.setItem("eds_admin_token", adminData.token); // Penting untuk fungsi dashboard
                window.location.href = "/Dashboard";
                // Jangan lanjut ke Firebase
                return new Promise(() => {}); // Biarkan redirect berjalan tanpa resolve UI
            } else {
                return { success: false, error: "Verifikasi admin gagal di server (cek .env)." };
            }
        } catch (error) {
            return { success: false, error: "Gagal menghubungi server admin." };
        }
    }

    try {
        const userCredential = await signInWithEmailAndPassword(auth, email, password);
        return { success: true, user: userCredential.user };
    } catch (error) {
        return { success: false, error: "Login gagal. Periksa alamat email dan kata sandi Anda." };
    }
}

export async function registerWithEmail(email, password) {
    try {
        const userCredential = await createUserWithEmailAndPassword(auth, email, password);
        await createNewUserDoc(userCredential.user);
        return { success: true, user: userCredential.user };
    } catch (error) {
        return { success: false, error: getAuthErrorMessage(error.code) };
    }
}

export async function loginWithGoogle() {
    try {
        const userCredential = await signInWithPopup(auth, googleProvider);
        await createNewUserDoc(userCredential.user);
        return { success: true, user: userCredential.user };
    } catch (error) {
        let msg = getAuthErrorMessage(error.code);
        if (error.message && error.message.includes("popup")) {
            msg = "Popup login diblokir browser. Izinkan popup atau gunakan login email.";
        }
        return { success: false, error: msg };
    }
}

export async function logoutUser() {
    try {
        await signOut(auth);
        window.location.href = 'login.html';
    } catch (error) {
        console.error("Logout error:", error);
    }
}

window.logoutUser = logoutUser;

// Helper error message translator
function getAuthErrorMessage(errorCode) {
    switch (errorCode) {
        case 'auth/invalid-credential':
        case 'auth/user-not-found':
        case 'auth/wrong-password':
            return 'Email atau password salah.';
        case 'auth/email-already-in-use':
            return 'Email ini sudah terdaftar. Silakan login.';
        case 'auth/weak-password':
            return 'Password terlalu lemah, minimal 6 karakter.';
        case 'auth/invalid-email':
            return 'Format email tidak valid.';
        case 'auth/unauthorized-domain':
            return 'Domain localhost belum diizinkan di Firebase. Buka Firebase Console > Authentication > Settings > Authorized domains, lalu tambahkan localhost dan 127.0.0.1.';
        case 'auth/operation-not-allowed':
            return 'Metode login belum diaktifkan. Aktifkan Email/Password atau Google di Firebase Authentication > Sign-in method.';
        case 'auth/popup-blocked':
            return 'Popup login diblokir browser. Izinkan popup atau gunakan login email.';
        default:
            return `Terjadi kesalahan (${errorCode}). Silakan coba lagi.`;
    }
}
