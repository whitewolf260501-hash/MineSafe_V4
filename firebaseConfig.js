// firebaseConfig.js
import { initializeApp } from "https://www.gstatic.com/firebasejs/11.0.1/firebase-app.js";
import { getDatabase, ref, onValue, set, remove, get } from "https://www.gstatic.com/firebasejs/11.0.1/firebase-database.js";
import { getAuth, onAuthStateChanged } from "https://www.gstatic.com/firebasejs/11.0.1/firebase-auth.js";
import { getFirestore } from "https://www.gstatic.com/firebasejs/11.0.1/firebase-firestore.js";

const firebaseConfig = {
  apiKey: "AIzaSyD744Q06qmoq3u8R43p-sgfa60xBRztOs4",
  authDomain: "minefase-fc5f5.firebaseapp.com",
  databaseURL: "https://minefase-fc5f5-default-rtdb.firebaseio.com",
  projectId: "minefase-fc5f5",
  storageBucket: "minefase-fc5f5.firebasestorage.app",
  messagingSenderId: "766582128927",
  appId: "1:766582128927:web:d26bdc5ae207b2171bb02a",
  measurementId: "G-Z6VB2Y3SN7",
};

export const app = initializeApp(firebaseConfig);
export const db = getDatabase(app);
export const auth = getAuth(app);
export const firestore = getFirestore(app);

export { ref, onValue, set, remove, get, onAuthStateChanged };
