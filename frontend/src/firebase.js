// src/firebase.js
import { initializeApp } from 'firebase/app';
import { getAuth } from 'firebase/auth';


// Your web app's Firebase configuration
// For Firebase JS SDK v7.20.0 and later, measurementId is optional
const firebaseConfig = {
    apiKey: "AIzaSyCexXySOwPXviok1VVV1T9qUg4gAfZcbSc",
    authDomain: "resume-8e8d3.firebaseapp.com",
    projectId: "resume-8e8d3",
    storageBucket: "resume-8e8d3.firebasestorage.app",
    messagingSenderId: "17059196532",
    appId: "1:17059196532:web:4dea07509296ec246d6b21",
    measurementId: "G-TXMF2GZVMN"
  };

const app = initializeApp(firebaseConfig);
export const auth = getAuth(app);