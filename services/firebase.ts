// Import the functions you need from the SDKs you need
import { initializeApp } from "firebase/app";
import { initializeAuth } from "firebase/auth";
import { getFirestore } from "firebase/firestore";
import { getStorage } from "firebase/storage";

const firebaseConfig = {
  apiKey: "AIzaSyDWJg9yVBr9xxr-NVQWxUAwn0q1KC62aos",
  authDomain: "soulnotes-40595.firebaseapp.com",
  projectId: "soulnotes-40595",
  storageBucket: "soulnotes-40595.firebasestorage.app",
  messagingSenderId: "622700680330",
  appId: "1:622700680330:web:25ffa820e2af79afe84973",
};

// Initialize Firebase
const app = initializeApp(firebaseConfig);

//for react native authentication
export const auth = initializeAuth(app);
export const db = getFirestore(app);
export const storage = getStorage(app);
