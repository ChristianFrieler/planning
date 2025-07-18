// main.js

// Firebase Config
const firebaseConfig = {
  apiKey: "AIzaSyBUfRi-Y8t3G_jtj-G4i8IPD2Imwsovquk",
  authDomain: "ticketmaster-eb5b8.firebaseapp.com",
  projectId: "ticketmaster-eb5b8",
  storageBucket: "ticketmaster-eb5b8.firebasestorage.app",
  messagingSenderId: "158973544951",
  appId: "1:158973544951:web:4088e065dafc2c69d1c6f2"
};

// Firebase Initialisieren
firebase.initializeApp(firebaseConfig);
const db = firebase.firestore();

// DOM-Elemente holen
const form = document.getElementById('event-form');
const eventList = document.getElementById('event-list');
const template = document.getElementById('event-template');

let events = [];

// Events aus Firestore laden
const fetchEvents = async () => {
  const snapshot = await db.collection("events").get();
  events = snapshot.docs.map(doc => ({
    id: doc.id,
    ...doc.data()
  }));
  renderEvents();
};

// Neues Event speichern
const saveEvent = async (event) => {
  await db.collection("events").add(event);
  fetchEvents();
};

// Teilnehmer hinzufügen und in Firestore updaten
const updateEventParticipants = async (id, updatedParticipants) => {
  await db.collection("events").doc(id).update({ participants: updatedParticipants });
  fetchEvents();
};

// Events anzeigen/rendern
const renderEvents = () => {
  eventList.innerHTML = '';
  events.forEach(event => {
    // Fallback, falls Teilnehmerfeld fehlt
    if (!event.participants) event.participants = [];
    const clone = template.content.cloneNode(true);
    clone.querySelector('.event-title').textContent = event.title;
    clone.querySelector('.event-meta').textContent = `${event.date} @ ${event.location}`;
    clone.querySelector('.event-tickets').textContent = `${event.participants.length} von ${event.tickets} Tickets vergeben`;

    const participantsEl = clone.querySelector('.participants');
    const toggleBtn = clone.querySelector('.toggle-participants');
    const listEl = clone.querySelector('.participant-list');
    const inputEl = clone.querySelector('.participant-name');
    const addBtn = clone.querySelector('.add-participant');

    toggleBtn.onclick = () => participantsEl.classList.toggle('hidden');

    const renderParticipants = () => {
      listEl.innerHTML = '';
      event.participants.forEach(name => {
        const li = document.createElement('li');
        li.textContent = name;
        listEl.appendChild(li);
      });
    };

    addBtn.onclick = () => {
      const name = inputEl.value.trim();
      if (!name || event.participants.length >= event.tickets) return;
      const updated = [...event.participants, name];
      updateEventParticipants(event.id, updated);
    };

    renderParticipants();
    eventList.appendChild(clone);
  });
};

// Event-Formular absenden
form.onsubmit = e => {
  e.preventDefault();
  const newEvent = {
    title: form['event-title'].value,
    location: form['event-location'].value,
    date: form['event-date'].value,
    tickets: parseInt(form['event-tickets'].value),
    participants: []
  };
  saveEvent(newEvent);
  form.reset();
};

// Beim Laden der Seite Events holen
fetchEvents();
