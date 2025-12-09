// firebase.js
import { initializeApp } from "firebase/app";
import { getAuth } from "firebase/auth";
import { getFirestore } from "firebase/firestore";
import { getDatabase, enableIndexedDbPersistence } from "firebase/database"; // <-- added enableIndexedDbPersistence

// Your web app Firebase configuration
const firebaseConfig = {
  apiKey: "AIzaSyDs6eEpYkKzOIbit60mitGDY6qbLMclxvs",
  authDomain: "esp32-connecttest.firebaseapp.com",
  databaseURL: "https://esp32-connecttest-default-rtdb.asia-southeast1.firebasedatabase.app",
  projectId: "esp32-connecttest",
  storageBucket: "esp32-connecttest.firebasestorage.app",
  messagingSenderId: "950000610308",
  appId: "1:950000610308:web:a39583249e23784128d951"
};

// Initialize Firebase
const app = initializeApp(firebaseConfig);
export const auth = getAuth(app);
export const db = getFirestore(app);        // Firestore
export const database = getDatabase(app);   // RTDB

// Enable offline persistence for Realtime Database
// This will allow your app to cache writes when offline and sync when back online
database.persistenceEnabled = true; // <-- Added line
