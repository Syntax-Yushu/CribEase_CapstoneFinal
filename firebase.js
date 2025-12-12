// firebase.js
import { initializeApp } from "firebase/app";
import { getAuth } from "firebase/auth";
import { getFirestore } from "firebase/firestore";
import { getDatabase } from "firebase/database";
import { getFunctions } from "firebase/functions";

const firebaseConfig = {
  apiKey: "AIzaSyDs6eEpYkKzOIbit60mitGDY6qbLMclxvs",
  authDomain: "esp32-connecttest.firebaseapp.com",
  databaseURL: "https://esp32-connecttest-default-rtdb.asia-southeast1.firebasedatabase.app",
  projectId: "esp32-connecttest",
  storageBucket: "esp32-connecttest.firebasestorage.app",
  messagingSenderId: "950000610308",
  appId: "1:950000610308:web:a39583249e23784128d951"
};

const app = initializeApp(firebaseConfig);

export const auth = getAuth(app);
export const db = getFirestore(app);        // Firestore
export const database = getDatabase(app);   // RTDB
export const functions = getFunctions(app); // Cloud Functions
