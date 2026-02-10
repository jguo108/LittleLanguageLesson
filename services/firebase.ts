import { initializeApp } from "firebase/app";
import { getAuth } from "firebase/auth";
import { getFirestore } from "firebase/firestore";

const firebaseConfig = {
  apiKey: "AIzaSyBSMJH1Hq5qR9mU44R58u923RH6MzhnyZ0",
  authDomain: "snaplearn-english-e3712.firebaseapp.com",
  projectId: "snaplearn-english-e3712",
  storageBucket: "snaplearn-english-e3712.firebasestorage.app",
  messagingSenderId: "209688390159",
  appId: "1:209688390159:web:cefb9ace7643316d91d17a"
};

const app = initializeApp(firebaseConfig);
export const auth = getAuth(app);
export const db = getFirestore(app);