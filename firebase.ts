import { initializeApp } from 'firebase/app';
import { getFirestore } from 'firebase/firestore';

// Your web app's Firebase configuration
const firebaseConfig = {
  apiKey: "AIzaSyD4K632FRJ1qbHamYKgG3FK8vCTzQppJh0",
  authDomain: "skill-swap-app-56076.firebaseapp.com",
  projectId: "skill-swap-app-56076",
  storageBucket: "skill-swap-app-56076.firebasestorage.app",
  messagingSenderId: "404720455747",
  appId: "1:404720455747:web:5ae0453558fbbfcb3cc4f6",
  measurementId: "G-6WS4HYCYG3"
};

// Initialize Firebase
const app = initializeApp(firebaseConfig);

// Initialize Cloud Firestore and export it so other files can use it
export const db = getFirestore(app);