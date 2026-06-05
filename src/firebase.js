import { initializeApp } from "firebase/app";
import { getAuth, GoogleAuthProvider } from "firebase/auth";
import { getFirestore } from "firebase/firestore";

const firebaseConfig = {
  apiKey: "AIzaSyCRc5p5BBeIjAUWdSIfHINx1rCKjMe7BgY",
  authDomain: "weekly-planner-4f397.firebaseapp.com",
  projectId: "weekly-planner-4f397",
  storageBucket: "weekly-planner-4f397.firebasestorage.app",
  messagingSenderId: "324324048107",
  appId: "1:324324048107:web:98f1954184cd0905c312ae",
  measurementId: "G-956ETJEV5P"
};

const app = initializeApp(firebaseConfig);

export const auth = getAuth(app);
export const db = getFirestore(app);
export const googleProvider = new GoogleAuthProvider();