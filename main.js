// main.js

// Firebase Module Imports
import { initializeApp } from "https://www.gstatic.com/firebasejs/10.4.0/firebase-app.js";
import { getAuth, signInWithEmailAndPassword, createUserWithEmailAndPassword, onAuthStateChanged, signOut } from "https://www.gstatic.com/firebasejs/10.4.0/firebase-auth.js";
import { getFirestore, collection, addDoc, getDocs, doc, getDoc, updateDoc, deleteDoc, query, orderBy, where } from "https://www.gstatic.com/firebasejs/10.4.0/firebase-firestore.js";

// --- 1. Firebase Konfiguration & Initialisierung ---
// Stelle sicher, dass dieses Objekt deine tatsächlichen Firebase-Projektkonfigurationen enthält!
const firebaseConfig = {
  apiKey: "AIzaSyBUfRi-Y8t3G_jtj-G4i8IPD2Imwsovquk",
  authDomain: "ticketmaster-eb5b8.firebaseapp.com",
  projectId: "ticketmaster-eb5b8",
  storageBucket: "ticketmaster-eb5b8.firebasestorage.app",
  messagingSenderId: "158973544951",
  appId: "1:158973544951:web:4088e065dafc2c69d1c6f2"
};

const app = initializeApp(firebaseConfig);
const db = getFirestore(app);
const auth = getAuth(app);

// Globale Variablen
let currentUserId = null;
let currentEventId = null; // Aktuell ausgewähltes Event für Teilnehmerverwaltung

// --- 2. Referenzen zu DOM-Elementen ---
// Auth Section
const authSection = document.getElementById('auth-section');
const authForm = document.getElementById('authForm');
const authEmailInput = document.getElementById('authEmail');
const authPasswordInput = document.getElementById('authPassword');
const signInButton = document.getElementById('signInButton');
const signUpButton = document.getElementById('authSignUpButton');
const authStatusMessage = document.getElementById('authStatusMessage');

// Main Content Section
const mainContent = document.getElementById('main-content');
const addEventBtn = document.getElementById('addEventBtn');
const eventsList = document.getElementById('eventsList');
const noEventsMessage = document.querySelector('.no-events-message');

// Event Modal (Add/Edit Event)
const eventModal = document.getElementById('eventModal');
const eventModalTitle = document.getElementById('modalTitle');
const eventForm = document.getElementById('eventForm');
const eventNameInput = document.getElementById('eventName');
const eventLocationInput = document.getElementById('eventLocation');
const eventDateInput = document.getElementById('eventDate');
const eventIdHiddenInput = document.getElementById('eventId');
const eventFormStatus = document.getElementById('eventFormStatus');
const deleteEventBtn = document.getElementById('deleteEventBtn');
const closeEventModalButtons = eventModal.querySelectorAll('.close-button');

// Participants Modal
const participantsModal = document.getElementById('participantsModal');
const participantsModalTitle = document.getElementById('participantsModalTitle');
const currentEventNameSpan = document.getElementById('currentEventName');
const currentEventIdSpan = document.getElementById('currentEventId');
const participantForm = document.getElementById('participantForm');
const participantNameInput = document.getElementById('participantName');
const hasTicketCheckbox = document.getElementById('hasTicket');
const isPaidCheckbox = document.getElementById('isPaid');
const participantsList = document.getElementById('participantsList');
const participantStatus = document.getElementById('participantStatus');
const noParticipantsMessage = document.querySelector('.no-participants-message');
const closeParticipantsModalButtons = participantsModal.querySelectorAll('.close-button');


// --- 3. Firebase Authentication Logik ---
// Listener für den Anmeldestatus
onAuthStateChanged(auth, (user) => {
    if (user) {
        currentUserId = user.uid;
        console.log("Benutzer angemeldet:", user.email, user.uid);
        authSection.classList.add('hidden');
        mainContent.classList.remove('hidden');
        loadEvents(); // Events laden, sobald Benutzer angemeldet ist
        authStatusMessage.textContent = `Willkommen, ${user.email}!`;
        authStatusMessage.className = 'status-message success';
    } else {
        currentUserId = null;
        console.log("Kein Benutzer angemeldet.");
        authSection.classList.remove('hidden');
        mainContent.classList.add('hidden');
        eventsList.innerHTML = ''; // Eventliste leeren
        authStatusMessage.textContent = "Bitte melde dich an, um fortzufahren.";
        authStatusMessage.className = 'status-message warning';
    }
});

// Anmelde-Formular Handler
if (authForm) {
    authForm.addEventListener('submit', async (e) => {
        e.preventDefault();
        const email = authEmailInput.value;
        const password = authPasswordInput.value;

        try {
            await signInWithEmailAndPassword(auth, email, password);
            // onAuthStateChanged kümmert sich um die UI-Updates
        } catch (error) {
            authStatusMessage.textContent = `Anmeldefehler: ${error.message}`;
            authStatusMessage.className = 'status-message error';
            console.error("Anmeldefehler:", error);
        }
    });
}

// Registrierungs-Button Handler
if (signUpButton) {
    signUpButton.addEventListener('click', async () => {
        const email = authEmailInput.value;
        const password = authPasswordInput.value;

        try {
            await createUserWithEmailAndPassword(auth, email, password);
            // onAuthStateChanged kümmert sich um die UI-Updates
        } catch (error) {
            authStatusMessage.textContent = `Registrierungsfehler: ${error.message}`;
            authStatusMessage.className = 'status-message error';
            console.error("Registrierungsfehler:", error);
        }
    });
}

// Optional: Logout Button (könntest du im Header oder woanders platzieren)
// const logoutButton = document.getElementById('logoutButton');
// if (logoutButton) {
//     logoutButton.addEventListener('click', async () => {
//         await signOut(auth);
//         authStatusMessage.textContent = "Erfolgreich abgemeldet.";
//         authStatusMessage.className = 'status-message'; // Reset
//     });
// }

// --- 4. Event-Verwaltung Logik ---

// Event-Modal öffnen für neues Event
if (addEventBtn) {
    addEventBtn.addEventListener('click', () => {
        eventModalTitle.textContent = "Neues Event anlegen";
        eventForm.reset();
        eventIdHiddenInput.value = '';
        deleteEventBtn.classList.add('hidden'); // Löschen-Button ausblenden
        eventFormStatus.textContent = ''; // Statusmeldung zurücksetzen
        showModal(eventModal);
    });
}

// Event speichern (Add/Update)
if (eventForm) {
    eventForm.addEventListener('submit', async (e) => {
        e.preventDefault();

        if (!currentUserId) {
            eventFormStatus.textContent = "Du musst angemeldet sein, um Events zu speichern.";
            eventFormStatus.className = 'status-message error';
            return;
        }

        const eventName = eventNameInput.value;
        const eventLocation = eventLocationInput.value;
        const eventDate = eventDateInput.value; // Format YYYY-MM-DD
        const eventId = eventIdHiddenInput.value;

        try {
            const eventData = {
                name: eventName,
                location: eventLocation,
                date: eventDate,
                userId: currentUserId, // Event dem aktuellen Benutzer zuordnen
                createdAt: new Date()
            };

            if (eventId) {
                // Event bearbeiten
                const docRef = doc(db, "events", eventId);
                await updateDoc(docRef, eventData);
                eventFormStatus.textContent = "Event erfolgreich aktualisiert!";
                eventFormStatus.className = 'status-message success';
                console.log("Event aktualisiert:", eventId);
            } else {
                // Neues Event anlegen
                const docRef = await addDoc(collection(db, "events"), eventData);
                eventFormStatus.textContent = "Event erfolgreich angelegt!";
                eventFormStatus.className = 'status-message success';
                console.log("Neues Event angelegt mit ID:", docRef.id);
            }
            loadEvents(); // Events neu laden
            setTimeout(() => hideModal(eventModal), 1500); // Modal nach kurzer Zeit schließen
        } catch (e) {
            eventFormStatus.textContent = `Fehler beim Speichern des Events: ${e.message}`;
            eventFormStatus.className = 'status-message error';
            console.error("Fehler beim Speichern des Events:", e);
        }
    });
}

// Event löschen
if (deleteEventBtn) {
    deleteEventBtn.addEventListener('click', async () => {
        const eventId = eventIdHiddenInput.value;
        if (!eventId || !currentUserId) {
            eventFormStatus.textContent = "Kein Event zum Löschen ausgewählt oder nicht angemeldet.";
            eventFormStatus.className = 'status-message error';
            return;
        }

        if (confirm("Bist du sicher, dass du dieses Event und alle zugehörigen Teilnehmer unwiderruflich löschen möchtest?")) {
            try {
                // Zuerst alle Teilnehmer des Events löschen
                const participantsQuery = query(collection(db, "participants"), where("eventId", "==", eventId));
                const participantDocs = await getDocs(participantsQuery);
                const deletePromises = [];
                participantDocs.forEach(pDoc => {
                    deletePromises.push(deleteDoc(doc(db, "participants", pDoc.id)));
                });
                await Promise.all(deletePromises); // Alle Teilnehmer gleichzeitig löschen

                // Dann das Event selbst löschen
                await deleteDoc(doc(db, "events", eventId));
                eventFormStatus.textContent = "Event und Teilnehmer erfolgreich gelöscht!";
                eventFormStatus.className = 'status-message success';
                loadEvents();
                setTimeout(() => hideModal(eventModal), 1500);
            } catch (e) {
                eventFormStatus.textContent = `Fehler beim Löschen des Events: ${e.message}`;
                eventFormStatus.className = 'status-message error';
                console.error("Fehler beim Löschen des Events:", e);
            }
        }
    });
}


// Events aus Firebase laden und anzeigen
async function loadEvents() {
    if (!currentUserId) {
        eventsList.innerHTML = '<p class="no-events-message">Bitte melde dich an, um deine Events zu sehen.</p>';
        return;
    }

    eventsList.innerHTML = ''; // Alte Events entfernen
    noEventsMessage.classList.add('hidden'); // Nachricht vorübergehend ausblenden

    try {
        // Nur Events laden, die der aktuell angemeldeten Benutzer-ID gehören
        const q = query(collection(db, "events"), where("userId", "==", currentUserId), orderBy("date", "asc"));
        const querySnapshot = await getDocs(q);

        if (querySnapshot.empty) {
            noEventsMessage.classList.remove('hidden'); // Nachricht anzeigen, wenn keine Events
        } else {
            querySnapshot.forEach(async (doc) => {
                const event = { id: doc.id, ...doc.data() };
                const eventCard = document.createElement('div');
                eventCard.className = 'event-card';
                eventCard.innerHTML = `
                    <h3>${event.name}</h3>
                    <p class="card-date">${formatDate(event.date)}</p>
                    <p class="card-location">${event.location}</p>
                    <p class="card-participants-summary" id="participants-summary-${event.id}">Teilnehmer: wird geladen...</p>
                    <div class="card-actions">
                        <button class="btn secondary-btn small-btn edit-event-btn" data-id="${event.id}">Bearbeiten</button>
                        <button class="btn primary-btn small-btn view-participants-btn" data-id="${event.id}" data-name="${event.name}">Teilnehmer</button>
                    </div>
                `;
                eventsList.appendChild(eventCard);

                // Teilnehmeranzahl laden und anzeigen
                await updateParticipantsSummary(event.id);

                // Event Listener für Bearbeiten
                eventCard.querySelector('.edit-event-btn').addEventListener('click', (e) => {
                    e.stopPropagation(); // Verhindert, dass das Eltern-Click-Event ausgelöst wird
                    editEvent(event.id);
                });

                // Event Listener für Teilnehmer anzeigen
                eventCard.querySelector('.view-participants-btn').addEventListener('click', (e) => {
                    e.stopPropagation();
                    showParticipants(event.id, event.name);
                });

                // Auch Click auf die Karte soll bearbeiten öffnen
                // eventCard.addEventListener('click', () => editEvent(event.id)); // Alternativ: Karte zum Bearbeiten öffnen
            });
        }
    } catch (e) {
        console.error("Fehler beim Laden der Events:", e);
        eventsList.innerHTML = `<p class="status-message error">Fehler beim Laden der Events: ${e.message}</p>`;
    }
}

// Event zum Bearbeiten öffnen
async function editEvent(eventId) {
    if (!currentUserId) return;

    try {
        const docRef = doc(db, "events", eventId);
        const docSnap = await getDoc(docRef);

        if (docSnap.exists() && docSnap.data().userId === currentUserId) {
            const event = docSnap.data();
            eventModalTitle.textContent = "Event bearbeiten";
            eventNameInput.value = event.name;
            eventLocationInput.value = event.location;
            eventDateInput.value = event.date;
            eventIdHiddenInput.value = eventId;
            deleteEventBtn.classList.remove('hidden'); // Löschen-Button anzeigen
            eventFormStatus.textContent = '';
            showModal(eventModal);
        } else {
            console.error("Event nicht gefunden oder keine Berechtigung.");
            eventFormStatus.textContent = "Event nicht gefunden oder keine Berechtigung zum Bearbeiten.";
            eventFormStatus.className = 'status-message error';
        }
    } catch (e) {
        console.error("Fehler beim Laden des Events zum Bearbeiten:", e);
        eventFormStatus.textContent = `Fehler: ${e.message}`;
        eventFormStatus.className = 'status-message error';
    }
}

// --- 5. Teilnehmer-Verwaltung Logik ---

// Participants Modal öffnen
async function showParticipants(eventId, eventName) {
    currentEventId = eventId;
    participantsModalTitle.textContent = `Teilnehmer für: ${eventName}`;
    currentEventNameSpan.textContent = eventName;
    currentEventIdSpan.textContent = eventId; // Zeigt die Event ID im Modal an
    participantForm.reset();
    participantStatus.textContent = '';
    showModal(participantsModal);
    await loadParticipants(eventId);
}

// Teilnehmer zu einem Event hinzufügen
if (participantForm) {
    participantForm.addEventListener('submit', async (e) => {
        e.preventDefault();

        if (!currentEventId || !currentUserId) {
            participantStatus.textContent = "Kein Event ausgewählt oder nicht angemeldet.";
            participantStatus.className = 'status-message error';
            return;
        }

        const participantName = participantNameInput.value;
        const hasTicket = hasTicketCheckbox.checked;
        const isPaid = isPaidCheckbox.checked;

        try {
            const participantData = {
                name: participantName,
                hasTicket: hasTicket,
                isPaid: isPaid,
                eventId: currentEventId,
                userId: currentUserId, // Teilnehmer dem Event und dem Benutzer zuordnen
                createdAt: new Date()
            };
            await addDoc(collection(db, "participants"), participantData);
            participantStatus.textContent = "Teilnehmer hinzugefügt!";
            participantStatus.className = 'status-message success';
            participantForm.reset();
            await loadParticipants(currentEventId); // Teilnehmerliste neu laden
            await updateParticipantsSummary(currentEventId); // Event-Zusammenfassung aktualisieren
        } catch (e) {
            participantStatus.textContent = `Fehler beim Hinzufügen des Teilnehmers: ${e.message}`;
            participantStatus.className = 'status-message error';
            console.error("Fehler beim Hinzufügen des Teilnehmers:", e);
        }
    });
}

// Teilnehmer für ein Event laden und anzeigen
async function loadParticipants(eventId) {
    if (!eventId || !currentUserId) {
        participantsList.innerHTML = '<li class="no-participants-message">Keine Teilnehmer verfügbar.</li>';
        return;
    }

    participantsList.innerHTML = '';
    noParticipantsMessage.classList.add('hidden'); // Nachricht ausblenden

    try {
        // Nur Teilnehmer laden, die zum aktuellen Event und Benutzer gehören
        const q = query(collection(db, "participants"), where("eventId", "==", eventId), where("userId", "==", currentUserId), orderBy("name", "asc"));
        const querySnapshot = await getDocs(q);

        if (querySnapshot.empty) {
            noParticipantsMessage.classList.remove('hidden'); // Nachricht anzeigen
        } else {
            querySnapshot.forEach((doc) => {
                const participant = { id: doc.id, ...doc.data() };
                const participantItem = document.createElement('li');
                participantItem.className = 'participant-item';
                participantItem.innerHTML = `
                    <div class="participant-info">
                        <strong>${participant.name}</strong>
                        <div class="participant-badges">
                            <span class="badge ${participant.hasTicket ? 'ticket-bought' : 'not-ticket-bought'}">
                                ${participant.hasTicket ? 'Ticket vorhanden' : 'Kein Ticket'}
                            </span>
                            <span class="badge ${participant.isPaid ? 'paid' : 'not-paid'}">
                                ${participant.isPaid ? 'Bezahlt' : 'Nicht bezahlt'}
                            </span>
                        </div>
                    </div>
                    <div class="participant-actions">
                        <button class="btn primary-btn small-btn toggle-ticket-btn" data-id="${participant.id}" data-ticket="${participant.hasTicket}">Ticket ${participant.hasTicket ? 'entfernen' : 'hinzufügen'}</button>
                        <button class="btn secondary-btn small-btn toggle-paid-btn" data-id="${participant.id}" data-paid="${participant.isPaid}">Bezahlung ${participant.isPaid ? 'rückgängig' : 'markieren'}</button>
                        <button class="btn danger-btn small-btn delete-participant-btn" data-id="${participant.id}">Löschen</button>
                    </div>
                `;
                participantsList.appendChild(participantItem);

                // Event Listener für Aktionen
                participantItem.querySelector('.toggle-ticket-btn').addEventListener('click', () => toggleParticipantField(participant.id, 'hasTicket', !participant.hasTicket));
                participantItem.querySelector('.toggle-paid-btn').addEventListener('click', () => toggleParticipantField(participant.id, 'isPaid', !participant.isPaid));
                participantItem.querySelector('.delete-participant-btn').addEventListener('click', () => deleteParticipant(participant.id));
            });
        }
    } catch (e) {
        console.error("Fehler beim Laden der Teilnehmer:", e);
        participantsList.innerHTML = `<li class="status-message error">Fehler beim Laden der Teilnehmer: ${e.message}</li>`;
    }
}

// Teilnehmer-Feld umschalten (Ticket / Bezahlt Status)
async function toggleParticipantField(participantId, fieldName, newValue) {
    if (!currentUserId) return;
    try {
        const docRef = doc(db, "participants", participantId);
        // Prüfen, ob der Teilnehmer auch wirklich dem angemeldeten Benutzer und Event gehört (Sicherheitscheck)
        const docSnap = await getDoc(docRef);
        if (docSnap.exists() && docSnap.data().userId === currentUserId && docSnap.data().eventId === currentEventId) {
            await updateDoc(docRef, { [fieldName]: newValue });
            participantStatus.textContent = `${fieldName === 'hasTicket' ? 'Ticket-Status' : 'Bezahl-Status'} aktualisiert!`;
            participantStatus.className = 'status-message success';
            await loadParticipants(currentEventId); // Liste neu laden
            await updateParticipantsSummary(currentEventId); // Zusammenfassung aktualisieren
        } else {
            participantStatus.textContent = "Keine Berechtigung zur Aktualisierung oder Teilnehmer nicht gefunden.";
            participantStatus.className = 'status-message error';
        }
    } catch (e) {
        participantStatus.textContent = `Fehler beim Aktualisieren: ${e.message}`;
        participantStatus.className = 'status-message error';
        console.error("Fehler beim Aktualisieren des Teilnehmers:", e);
    }
}

// Teilnehmer löschen
async function deleteParticipant(participantId) {
    if (!currentUserId) return;
    if (!confirm("Bist du sicher, dass du diesen Teilnehmer löschen möchtest?")) return;

    try {
        const docRef = doc(db, "participants", participantId);
        // Sicherheitscheck: Prüfen, ob der Teilnehmer auch wirklich dem angemeldeten Benutzer und Event gehört
        const docSnap = await getDoc(docRef);
        if (docSnap.exists() && docSnap.data().userId === currentUserId && docSnap.data().eventId === currentEventId) {
            await deleteDoc(docRef);
            participantStatus.textContent = "Teilnehmer erfolgreich gelöscht!";
            participantStatus.className = 'status-message success';
            await loadParticipants(currentEventId); // Liste neu laden
            await updateParticipantsSummary(currentEventId); // Zusammenfassung aktualisieren
        } else {
            participantStatus.textContent = "Keine Berechtigung zum Löschen oder Teilnehmer nicht gefunden.";
            participantStatus.className = 'status-message error';
        }
    } catch (e) {
        participantStatus.textContent = `Fehler beim Löschen des Teilnehmers: ${e.message}`;
        participantStatus.className = 'status-message error';
        console.error("Fehler beim Löschen des Teilnehmers:", e);
    }
}

// Zusammenfassung der Teilnehmer auf der Event-Karte aktualisieren
async function updateParticipantsSummary(eventId) {
    const summarySpan = document.getElementById(`participants-summary-${eventId}`);
    if (!summarySpan) return;

    try {
        const q = query(collection(db, "participants"), where("eventId", "==", eventId), where("userId", "==", currentUserId));
        const querySnapshot = await getDocs(q);

        let totalParticipants = 0;
        let ticketsBought = 0;
        let paidCount = 0;

        querySnapshot.forEach(doc => {
            totalParticipants++;
            if (doc.data().hasTicket) ticketsBought++;
            if (doc.data().isPaid) paidCount++;
        });

        summarySpan.textContent = `Teilnehmer: ${totalParticipants} | Tickets: ${ticketsBought} | Bezahlt: ${paidCount}`;
        summarySpan.classList.remove('status-message', 'error', 'success'); // Reset
    } catch (e) {
        console.error("Fehler beim Aktualisieren der Teilnehmerzusammenfassung:", e);
        summarySpan.textContent = "Zusammenfassung konnte nicht geladen werden.";
        summarySpan.classList.add('status-message', 'error');
    }
}


// --- 6. Modal / Pop-up Funktionen ---
function showModal(modalElement) {
    modalElement.style.display = 'flex';
    // Kleine Verzögerung, um CSS-Animation auszulösen
    setTimeout(() => {
        modalElement.classList.remove('hide');
        modalElement.classList.add('show');
    }, 10);
}

function hideModal(modalElement) {
    modalElement.classList.remove('show');
    modalElement.classList.add('hide');
    // Warten, bis Animation beendet ist, bevor display:none gesetzt wird
    modalElement.addEventListener('animationend', function handler() {
        modalElement.style.display = 'none';
        modalElement.removeEventListener('animationend', handler);
    }, { once: true });
}

// Event Listener für Schließen-Buttons aller Modals
closeEventModalButtons.forEach(button => {
    button.addEventListener('click', () => hideModal(eventModal));
});

closeParticipantsModalButtons.forEach(button => {
    button.addEventListener('click', () => hideModal(participantsModal));
});

// Modal schließen, wenn außerhalb geklickt wird
window.addEventListener('click', (event) => {
    if (event.target === eventModal) {
        hideModal(eventModal);
    }
    if (event.target === participantsModal) {
        hideModal(participantsModal);
    }
});

// --- 7. Hilfsfunktionen ---
function formatDate(dateString) {
    const options = { year: 'numeric', month: 'long', day: 'numeric' };
    return new Date(dateString).toLocaleDateString('de-DE', options);
}