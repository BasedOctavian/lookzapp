// src/firebase.js
import { initializeApp } from "firebase/app";
import { getFirestore } from "firebase/firestore";

const firebaseConfig = {
    apiKey: "AIzaSyCgP8SkzrL-R_mTBQHHmJM718SsoWF6hB4",
    authDomain: "outoften-9e12b.firebaseapp.com",
    databaseURL: "https://outoften-9e12b-default-rtdb.firebaseio.com",
    projectId: "outoften-9e12b",
    storageBucket: "outoften-9e12b.firebasestorage.app",
    messagingSenderId: "968891899721",
    appId: "1:968891899721:web:f5aa7eaa4685cb86a24498",
    measurementId: "G-V7RSYFJP9F"
  };

const app = initializeApp(firebaseConfig);
const db = getFirestore(app);

export { db };
