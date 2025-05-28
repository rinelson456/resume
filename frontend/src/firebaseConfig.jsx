import { initializeApp } from "firebase/app";

const firebaseConfig = {
  apiKey: "AIzaSyCexXySOwPXviok1VVV1T9qUg4gAfZcbSc",
  authDomain: "resume-8e8d3.firebaseapp.com",
  projectId: "resume-8e8d3",
  storageBucket: "resume-8e8d3.appspot.com",
  messagingSenderId: "17059196532",
  appId: "1:17059196532:web:4dea07509296ec246d6b21",
  measurementId: "G-TXMF2GZVMN"
};

export const app = initializeApp(firebaseConfig);