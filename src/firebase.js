import { initializeApp } from "firebase/app";
import { getAuth } from "firebase/auth";
import { getFirestore } from "firebase/firestore";

// TODO: replace with your own config values or load from environment
const firebaseConfig = {
  apiKey: "AIzaSyAZzpDhYlaSdqnWgWqIOlFgDPjYS79X9Tw",
  authDomain: "practice-d96fb.firebaseapp.com",
  databaseURL: "https://practice-d96fb-default-rtdb.firebaseio.com",
  projectId: "practice-d96fb",
  storageBucket: "practice-d96fb.firebasestorage.app",
  messagingSenderId: "256851197100",
  appId: "1:256851197100:web:caaf32fb74c0382eaff309",
};

// Initialize Firebase
const app = initializeApp(firebaseConfig);

// Export auth and firestore instances for app use
export const auth = getAuth(app);
export const db = getFirestore(app);

export default app;
