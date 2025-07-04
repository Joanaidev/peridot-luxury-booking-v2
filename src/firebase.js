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
