import { initializeApp } from "firebase/app";
import { getAuth } from "firebase/auth";
import { 
  getFirestore, 
  collection, 
  addDoc, 
  getDocs, 
  query, 
  where, 
  serverTimestamp, 
  doc,  // ✅ Add this line
  setDoc, // ✅ Add this if needed
  getDoc, // ✅ Add this if needed
  updateDoc // ✅ Add this if needed
} from "firebase/firestore";
import { getStorage } from "firebase/storage";

const apiKey =
  typeof import.meta !== "undefined"
    ? import.meta.env.VITE_FIREBASE_API_KEY
    : process.env.VITE_FIREBASE_API_KEY || globalThis.import?.meta?.env?.VITE_FIREBASE_API_KEY;

const authDomain =
  typeof import.meta !== "undefined"
    ? import.meta.env.VITE_FIREBASE_AUTH_DOMAIN
    : process.env.VITE_FIREBASE_AUTH_DOMAIN || globalThis.import?.meta?.env?.VITE_FIREBASE_AUTH_DOMAIN;

const projectId =
  typeof import.meta !== "undefined"
    ? import.meta.env.VITE_FIREBASE_PROJECT_ID
    : process.env.VITE_FIREBASE_PROJECT_ID || globalThis.import?.meta?.env?.VITE_FIREBASE_PROJECT_ID;


const firebaseConfig = {
  apiKey,
  authDomain,
  projectId,
  storageBucket: import.meta.env.VITE_FIREBASE_STORAGE_BUCKET,
  messagingSenderId: import.meta.env.VITE_FIREBASE_MESSAGING_SENDER_ID,
  appId: import.meta.env.VITE_FIREBASE_APP_ID,
  measurementId: import.meta.env.VITE_FIREBASE_MEASUREMENT_ID,
};

// Initialize Firebase app
const app = initializeApp(firebaseConfig);

export const auth = getAuth(app);
export const db = getFirestore(app);
export const storage = getStorage(app);

export { 
  collection, 
  addDoc, 
  getDocs, 
  query, 
  where, 
  serverTimestamp, 
  doc,  // ✅ Added here
  setDoc, // ✅ Added here
  getDoc, // ✅ Added here
  updateDoc // ✅ Added here
};
