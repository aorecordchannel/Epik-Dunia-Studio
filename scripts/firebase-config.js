// scripts/firebase-config.js

import { initializeApp } from "https://www.gstatic.com/firebasejs/10.8.1/firebase-app.js";
import { getAuth, GoogleAuthProvider } from "https://www.gstatic.com/firebasejs/10.8.1/firebase-auth.js";
import { getFirestore } from "https://www.gstatic.com/firebasejs/10.8.1/firebase-firestore.js";

// TODO: Ganti placeholder ini dengan konfigurasi Firebase Anda!
// Anda bisa mendapatkannya di Firebase Console -> Project Settings -> General -> Web App

// Jika domain website berubah, tambahkan domain baru di Firebase Console:
// Authentication > Settings > Authorized domains
// Tambahkan tanpa http/https:
// eds-ai.netlify.app
// localhost
// 127.0.0.1
// zyhr9h3k1ddfhjz9p2uxzu5s.103.247.11.249.sslip.io

const firebaseConfig = {
  apiKey: "AIzaSy_GANTI_DENGAN_API_KEY_ANDA",
  authDomain: "GANTI_DENGAN_PROJECT_ID.firebaseapp.com",
  projectId: "GANTI_DENGAN_PROJECT_ID",
  storageBucket: "GANTI_DENGAN_PROJECT_ID.appspot.com",
  messagingSenderId: "GANTI_DENGAN_SENDER_ID",
  appId: "GANTI_DENGAN_APP_ID"
};

let app, auth, db, googleProvider;

if (window.location.protocol === "file:") {
    console.warn("Firebase tidak diinisialisasi karena dijalankan dari file:// protocol.");
} else {
    // Initialize Firebase
    app = initializeApp(firebaseConfig);
    auth = getAuth(app);
    db = getFirestore(app);
    googleProvider = new GoogleAuthProvider();
}

export { app, auth, db, googleProvider };
