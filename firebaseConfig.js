// firebaseConfig.js

// --- Firebase Core ---
import { initializeApp } from "https://www.gstatic.com/firebasejs/11.0.1/firebase-app.js";

// --- Realtime Database ---
import {
  getDatabase,
  ref,
  onValue,
  set,
  remove,
  get,
  update
} from "https://www.gstatic.com/firebasejs/11.0.1/firebase-database.js";

// --- Authentication ---
import {
  getAuth,
  onAuthStateChanged
} from "https://www.gstatic.com/firebasejs/11.0.1/firebase-auth.js";

// --- Firestore ---
import {
  getFirestore
} from "https://www.gstatic.com/firebasejs/11.0.1/firebase-firestore.js";

// --- Cloud Functions ---
import {
  getFunctions
} from "https://www.gstatic.com/firebasejs/11.0.1/firebase-functions.js";


// --- CONFIGURACIÓN DEL PROYECTO ---
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


// --- Inicializar App ---
export const app = initializeApp(firebaseConfig);

// --- Inicializar Servicios ---
export const db = getDatabase(app);
export const auth = getAuth(app);
export const firestore = getFirestore(app);
export const functions = getFunctions(app);

// --- Exportar funciones útiles ---
export {
  ref,
  onValue,
  set,
  remove,
  get,
  update,
  onAuthStateChanged
};
