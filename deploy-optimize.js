const fs = require('fs');
const path = require('path');

console.log('🚀 Optimizing build for Hostinger deployment...');

// Create optimized firebase config for production
const firebaseConfig = `
// Optimized Firebase configuration for production
import { initializeApp } from "firebase/app";
import { getFirestore } from "firebase/firestore";
import { getAnalytics, isSupported } from "firebase/analytics";

const firebaseConfig = {
  apiKey: "AIzaSyCr4z6cLpJ7hEBGQVrYskwMVIcoZNo_h_8",
  authDomain: "booking-app-ec781.firebaseapp.com",
  projectId: "booking-app-ec781",
  storageBucket: "booking-app-ec781.firebasestorage.app",
  messagingSenderId: "386682814074",
  appId: "1:386682814074:web:bcb753fb1e2fcdf87745c3",
  measurementId: "G-Q4T06WMWLR"
};

// Initialize Firebase with production optimizations
let app;
let db;
let analytics;

try {
  app = initializeApp(firebaseConfig);
  db = getFirestore(app);
  
  // Only initialize Analytics if supported and in production
  if (typeof window !== 'undefined' && window.location.hostname !== 'localhost') {
    isSupported().then(yes => yes ? analytics = getAnalytics(app) : null);
  }
  
  console.log('Firebase initialized successfully');
} catch (error) {
  console.error('Error initializing Firebase:', error);
  db = null;
  analytics = null;
}

export { db, analytics };
`;

// Write optimized config
fs.writeFileSync(path.join(__dirname, 'src', 'firebase.js'), firebaseConfig);

console.log('✅ Firebase configuration optimized for production');
console.log('📝 Build optimization complete!');
console.log('');
console.log('Next steps:');
console.log('1. Run: npm run build:prod');
console.log('2. Upload the "build" folder to Hostinger');
console.log('3. Make sure to upload ALL files from the build folder');
console.log('4. Check that firebase.js is included in your upload');
console.log('');
console.log('💡 Tips for Hostinger:');
console.log('- Use the "build" folder contents, not the folder itself');
console.log('- Ensure all .js files are uploaded');
console.log('- Check browser console for any missing file errors');
console.log('- Verify Firebase connection in browser dev tools'); 