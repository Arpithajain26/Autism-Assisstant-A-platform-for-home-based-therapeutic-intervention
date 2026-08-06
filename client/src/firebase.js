import { initializeApp } from "firebase/app";
import { getAuth } from "firebase/auth";

const firebaseConfig = {
  apiKey: "AIzaSyACs_KWo5nBYJ7zxbL9a_sKgx1gBk1i-Cg",
  authDomain: "autism-assisstant.firebaseapp.com",
  projectId: "autism-assisstant",
  storageBucket: "autism-assisstant.firebasestorage.app",
  messagingSenderId: "832985486362",
  appId: "1:832985486362:web:760c58a06dee7dd88dada3",
};

const app = initializeApp(firebaseConfig);

export const auth = getAuth(app);
