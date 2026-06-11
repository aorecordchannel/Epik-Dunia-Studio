// scripts/firebase-config.js

import { initializeApp } from "https://www.gstatic.com/firebasejs/10.8.1/firebase-app.js";
import { getAuth, GoogleAuthProvider } from "https://www.gstatic.com/firebasejs/10.8.1/firebase-auth.js";
import { getFirestore } from "https://www.gstatic.com/firebasejs/10.8.1/firebase-firestore.js";

// TODO: Ganti placeholder ini dengan konfigurasi Firebase Anda!
// Anda bisa mendapatkannya di Firebase Console -> Project Settings -> General -> Web App

// CATATAN PENTING UNTUK LOCALHOST:
// Agar login berjalan di localhost, buka Firebase Console:
// Authentication > Settings > Authorized domains
// Tambahkan:
// localhost
// 127.0.0.1

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
