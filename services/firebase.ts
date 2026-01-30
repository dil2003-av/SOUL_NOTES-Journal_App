// Firebase core
import { initializeApp } from "firebase/app";

// Auth
import { getAuth } from "firebase/auth";

// Firestore DB
import { getFirestore } from "firebase/firestore";

// 🔥 Firebase Config
const firebaseConfig = {
  apiKey: "AIzaSyDWJg9yVBr9xxr-NVQWxUAwn0q1KC62aos",
  authDomain: "soulnotes-40595.firebaseapp.com",
  projectId: "soulnotes-40595",
  messagingSenderId: "622700680330",
  appId: "1:622700680330:web:25ffa820e2af79afe84973",
};

// Initialize Firebase App
const app = initializeApp(firebaseConfig);

// ✅ Firebase Auth
export const auth = getAuth(app);

// ✅ Firestore (for journals CRUD)
export const db = getFirestore(app);
