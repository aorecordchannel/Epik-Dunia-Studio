const firebaseConfig = {
  apiKey: "AIzaSyDjvl7XyNFJVsTY-xDDD1uZmvVTm0z7XVM",
  authDomain: "gen-lang-client-0894892795.firebaseapp.com",
  projectId: "gen-lang-client-0894892795",
  storageBucket: "gen-lang-client-0894892795.firebasestorage.app",
  messagingSenderId: "677784266542",
  appId: "1:677784266542:web:8815ff7bb8af27862b7cbf",
  measurementId: "G-KBX25WSBEC"
};

// Agar Firebase Auth berjalan di domain production, tambahkan domain berikut di Firebase Console:
// Authentication > Settings > Authorized domains
// epikduniastudio.cloud
// www.epikduniastudio.cloud
// eds-ai.netlify.app
// localhost
// 127.0.0.1

if (window.location.protocol === "file:") {
    console.warn("Firebase tidak diinisialisasi karena dijalankan dari file:// protocol.");
} else {
    if (!firebase.apps.length) {
        firebase.initializeApp(firebaseConfig);
    }
    
    const auth = firebase.auth();
    const db = firebase.firestore();
    const storage = firebase.storage();
    const googleProvider = new firebase.auth.GoogleAuthProvider();
    
    window.firebaseApp = firebase.app();
    window.auth = auth;
    window.db = db;
    window.storage = storage;
    window.googleProvider = googleProvider;
}
