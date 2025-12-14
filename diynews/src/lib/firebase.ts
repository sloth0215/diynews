// Firebase 초기화 설정
import { initializeApp } from "firebase/app";
import { getAuth, GoogleAuthProvider } from "firebase/auth";
import { getFirestore } from "firebase/firestore";
import { getAnalytics } from "firebase/analytics";

// Firebase 설정 정보
const firebaseConfig = {
  apiKey: "AIzaSyDCSVYNMxQLl-9P1Y-4UWcAX8gJgB4QEwY",
  authDomain: "diynews-4ab48.firebaseapp.com",
  projectId: "diynews-4ab48",
  storageBucket: "diynews-4ab48.firebasestorage.app",
  messagingSenderId: "57866433107",
  appId: "1:57866433107:web:95f9b95edd8e847bb74ca6",
  measurementId: "G-YMV6LY86FZ"
};

// Firebase 앱 초기화
const app = initializeApp(firebaseConfig);

// Authentication 설정
export const auth = getAuth(app);
export const googleProvider = new GoogleAuthProvider();

// Firestore 설정
export const db = getFirestore(app);

// Analytics (선택사항)
export const analytics = typeof window !== 'undefined' ? getAnalytics(app) : null;

export default app;