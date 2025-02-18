import { initializeApp } from "firebase/app";
import { getAuth } from "firebase/auth";
import { getFirestore } from "firebase/firestore";

const firebaseConfig = {
  apiKey: "AIzaSyDe6y6m73axNAjBfMxaY-BiP9vy0Qtt_so",
  authDomain: "smart-parking-applicatio-566ed.firebaseapp.com",
  projectId: "smart-parking-applicatio-566ed",
  storageBucket: "smart-parking-applicatio-566ed.firebasestorage.app",
  messagingSenderId: "924586559087",
  appId: "1:924586559087:web:86cc158807866fe49e2f9a",
  measurementId: "G-PZ7KT7F4RC"
};

// Initialize Firebase app
const app = initializeApp(firebaseConfig);

// Export Firebase services
export const auth = getAuth(app);
export const db = getFirestore(app);