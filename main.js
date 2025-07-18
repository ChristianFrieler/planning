// main.js

// Importiere die notwendigen Firebase Module
import { initializeApp } from "https://www.gstatic.com/firebasejs/10.4.0/firebase-app.js";
import { getFirestore, collection, addDoc } from "https://www.gstatic.com/firebasejs/10.4.0/firebase-firestore.js";

// DEINE FIREBASE KONFIGURATION - HIERHER VERSCHIEBEN!
// Ersetze die Platzhalter mit deinen tatsächlichen Werten aus der Firebase Konsole.
// Firebase Config
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
console.log("Firebase App und Firestore initialisiert.");

// Referenzen auf HTML-Elemente
const dataForm = document.getElementById('dataForm');
const statusMessage = document.getElementById('statusMessage');
console.log("dataForm Element:", dataForm);
console.log("statusMessage Element:", statusMessage);


// Event-Listener für das Absenden des Formulars
if (dataForm) {
    dataForm.addEventListener('submit', async (e) => {
        e.preventDefault();
        console.log("Formular abgesendet.");

        const name = document.getElementById('name').value;
        const email = document.getElementById('email').value;
        const message = document.getElementById('message').value;

        console.log("Ausgelesene Daten:", { name, email, message });

        try {
            const docRef = await addDoc(collection(db, "kontaktanfragen"), {
                name: name,
                email: email,
                message: message,
                timestamp: new Date()
            });
            console.log("Dokument erfolgreich geschrieben mit ID: ", docRef.id);
            statusMessage.textContent = "Daten erfolgreich gespeichert!";
            statusMessage.style.color = "green";
            dataForm.reset();

        } catch (e) {
            console.error("Fehler beim Hinzufügen des Dokuments: ", e);
            statusMessage.textContent = "Fehler beim Speichern der Daten: " + e.message;
            statusMessage.style.color = "red";
        }
    });
} else {
    console.error("Fehler: Formular mit ID 'dataForm' wurde nicht gefunden!");
}