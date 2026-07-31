import { initializeApp } from "firebase/app";
import { getFirestore } from "firebase/firestore";

const firebaseConfig = {
  apiKey: "AIzaSyBoLbkvFvA6UiFAjSz_25wCAI9OQ-cVGFk",
  authDomain: "crime-8428c.firebaseapp.com",
  projectId: "crime-8428c",
  storageBucket: "crime-8428c.firebasestorage.app",
  messagingSenderId: "319263804962",
  appId: "1:319263804962:web:576027b66eac9819ee047b",
};

const app = initializeApp(firebaseConfig);
export const db = getFirestore(app);
