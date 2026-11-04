// src/firebase/config.js

import { initializeApp } from "firebase/app";
import { getFirestore } from "firebase/firestore";
import { getAuth } from "firebase/auth";
import { getStorage } from "firebase/storage"; // ✅ 1. Import getStorage

const firebaseConfig = {
  apiKey: "AIzaSyBS1vX2PSGrEVdQ5fqMFP1K3p6Yih7ttek",
  authDomain: "eye-clinic-system-803ee.firebaseapp.com",
  projectId: "eye-clinic-system-803ee",
  storageBucket: "eye-clinic-system-803ee.firebasestorage.app",
  messagingSenderId: "870281086396",
  appId: "1:870281086396:web:63e17f2ca5e760fc6817b9",
  measurementId: "G-WHQ85CCCX1"
};

const app = initializeApp(firebaseConfig);
const db = getFirestore(app);
const auth = getAuth(app);
const storage = getStorage(app); // ✅ 2. Initialize storage

// ✅ 3. Export storage so InventoryPage can use it
export { db, auth, storage }; 