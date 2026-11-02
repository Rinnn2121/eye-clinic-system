// src/firebase/config.js

import { initializeApp } from "firebase/app";
import { getAuth } from "firebase/auth";

const firebaseConfig = {
  apiKey: "AIzaSyCT_YUkeB-sq3sHxlKPax77ki0uHA0Nv28",
  authDomain: "eye-clinic-system.firebaseapp.com",
  projectId: "eye-clinic-system",
  storageBucket: "eye-clinic-system.firebasestorage.app",
  messagingSenderId: "436862565536",
  appId: "1:436862565536:web:a40483f580ac24a8369dc5"
};

const secondaryApp = initializeApp(firebaseConfig, "Secondary");

export const secondaryAuth = getAuth(secondaryApp);