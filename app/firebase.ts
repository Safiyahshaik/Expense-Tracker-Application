// app/firebase.ts
import { initializeApp, getApps } from "firebase/app";
import { getFirestore } from "firebase/firestore";
import {
  getAuth,
  initializeAuth,
  browserLocalPersistence,
} from "firebase/auth";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { getStorage } from "firebase/storage";
// Firebase config
const firebaseConfig = {
  apiKey: "",
  authDomain: "expense-tracker-b6105.firebaseapp.com",
  projectId: "expense-tracker-b6105",
  storageBucket: "expense-tracker-b6105.firebasestorage.app",
  messagingSenderId: "890169552075",
  appId: "",
  measurementId: "G-GTHNN92K6Z",
};

// Initialize Firebase app
const app = !getApps().length ? initializeApp(firebaseConfig) : getApps()[0];

// Initialize Auth
export const auth = getAuth(app); // basic auth

// Firestore
export const db = getFirestore(app);
export const storage = getStorage(app);
export default app;
