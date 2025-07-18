// firebase.js

// Firebase Module Imports
import { initializeApp } from "https://www.gstatic.com/firebasejs/10.4.0/firebase-app.js";
// getAuth wird importiert, aber da kein Login, wird es nicht genutzt, könnte entfernt werden
import { getAuth } from "https://www.gstatic.com/firebasejs/10.4.0/firebase-auth.js";
import { getFirestore } from "https://www.gstatic.com/firebasejs/10.4.0/firebase-firestore.js";

// DEINE FIREBASE KONFIGURATION - HIER EINFÜGEN!
// Ersetze die Platzhalter mit deinen tatsächlichen Werten aus der Firebase Konsole.
const firebaseConfig = {
  apiKey: "AIzaSyBUfRi-Y8t3G_jtj-G4i8IPD2Imwsovquk",
  authDomain: "ticketmaster-eb5b8.firebaseapp.com",
  projectId: "ticketmaster-eb5b8",
  storageBucket: "ticketmaster-eb5b8.firebasestorage.app",
  messagingSenderId: "158973544951",
  appId: "1:158973544951:web:4088e065dafc2c69d1c6f2"
};

// Firebase initialisieren
const app = initializeApp(firebaseConfig);
const db = getFirestore(app);
const auth = getAuth(app); // Initialisiere Auth, wird aber nicht für Login verwendet

console.log("Firebase App und Firestore initialisiert.");

// Exportiere die Instanzen, damit main.js darauf zugreifen kann
export { db, auth };