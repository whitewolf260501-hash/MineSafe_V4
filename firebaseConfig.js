// firebaseConfig.js
import { initializeApp } from "https://www.gstatic.com/firebasejs/11.0.1/firebase-app.js";

// ---- AUTH ----
import {
  getAuth,
  onAuthStateChanged,
  signInWithEmailAndPassword,
  sendPasswordResetEmail,
  signOut,
  createUserWithEmailAndPassword
} from "https://www.gstatic.com/firebasejs/11.0.1/firebase-auth.js";

// ---- REALTIME DATABASE ----
import {
  getDatabase,
  ref,
  onValue,
  set,
  remove,
  get,
  update
} from "https://www.gstatic.com/firebasejs/11.0.1/firebase-database.js";

// ---- FIRESTORE ----
import {
  getFirestore,
  collection,
  doc,
  addDoc,
  getDoc,
  getDocs,
  updateDoc,
  deleteDoc
} from "https://www.gstatic.com/firebasejs/11.0.1/firebase-firestore.js";

// ---- FUNCTIONS ----
import { getFunctions } from "https://www.gstatic.com/firebasejs/11.0.1/firebase-functions.js";


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

// Inicializar Firebase
export const app = initializeApp(firebaseConfig);

// Servicios principales
export const auth = getAuth(app);
export const db = getDatabase(app);
export const firestore = getFirestore(app);
export const functions = getFunctions(app);

// Exportación unificada para toda la app
export {
  // AUTH
  onAuthStateChanged,
  signInWithEmailAndPassword,
  sendPasswordResetEmail,
  signOut,
  createUserWithEmailAndPassword,

  // REALTIME DB
  ref,
  onValue,
  set,
  remove,
  get,
  update,

  // FIRESTORE
  collection,
  doc,
  addDoc,
  getDoc,
  getDocs,
  updateDoc,
  deleteDoc
};
