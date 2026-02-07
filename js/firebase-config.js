// ============================================
// SYNDL.COM - Firebase Configuration
// ============================================

// Firebase Configuration
const firebaseConfig = {
    apiKey: "AIzaSyBJtvh5Q8annP0Cg2MJOrQYFYzwcpu5JfM",
    authDomain: "syndl-platform.firebaseapp.com",
    databaseURL: "https://syndl-platform-default-rtdb.firebaseio.com",
    projectId: "syndl-platform",
    storageBucket: "syndl-platform.firebasestorage.app",
    messagingSenderId: "165072306843",
    appId: "1:165072306843:web:1b82abb04c5f3dbc993c3e"
};

// Initialize Firebase
firebase.initializeApp(firebaseConfig);

// Get database reference
const database = firebase.database();

console.log('🔥 Firebase initialized successfully');
