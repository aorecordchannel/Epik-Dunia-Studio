// scripts/auth-guard.js

import { auth } from './firebase-config.js';
import { onAuthStateChanged } from "https://www.gstatic.com/firebasejs/10.8.1/firebase-auth.js";

export function requireLogin(appRouteIfNotLoggedIn) {
    if (window.location.protocol === "file:") {
        alert("Jangan buka file langsung dari folder. Jalankan project menggunakan localhost.");
        return;
    }
    
    onAuthStateChanged(auth, (user) => {
        if (!user) {
            const currentPage = appRouteIfNotLoggedIn || window.location.pathname.split("/").pop() || "produk.html";
            window.location.href = `login.html?redirect=${encodeURIComponent(currentPage)}`;
            return;
        }
    });
}
