// trip-actions.js
import { auth, db } from './firebase.js';
import {
  signInAnonymously,
  onAuthStateChanged
} from 'https://www.gstatic.com/firebasejs/10.13.2/firebase-auth.js';
import {
  collection,
  addDoc,
  query,
  where,
  getDocs,
  doc,
  updateDoc,
  serverTimestamp
} from 'https://www.gstatic.com/firebasejs/10.13.2/firebase-firestore.js';

/* =======================
   Constants
======================= */
const NOMINATIM_CONTACT_EMAIL = "team@tripmate.college";
const NOMINATIM_BASE = "https://nominatim.openstreetmap.org/search";
const MAX_VIEW_DISTANCE_KM = 3;
const MAX_TIME_DIFF_MIN = 60;

/* =======================
   Auth Setup
======================= */
onAuthStateChanged(auth, (user) => {
  if (!user) {
    signInAnonymously(auth).catch(err => console.warn("Anonymous sign-in failed:", err));
  }
});

/* =======================
   DOM Refs
======================= */
const form = document.getElementById('trip-search-form');
const destinationInput = document.getElementById('destination-input');
const dateInput = document.getElementById('date-input');
const timeInput = document.getElementById('time-input');

const modal = document.getElementById('trip-action-modal');
const modalDestination = document.getElementById('modal-destination');
const modalDateTime = document.getElementById('modal-date-time');
const modalResults = document.getElementById('modal-results');
const createBtn = document.getElementById('create-new-btn');
const viewBtn = document.getElementById('view-existing-btn');
const closeBtn = document.getElementById('close-modal-btn');

/* =======================
   Map setup (Leaflet)
======================= */
const defaultCenter = [28.6139, 77.2090];
const map = L.map('map').setView(defaultCenter, 6);
L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
  attribution: '&copy; OpenStreetMap contributors'
}).addTo(map);

let currentMarker = null;
const resultMarkers = [];

/* =======================
   Helpers
======================= */
function toRad(deg) { return deg * Math.PI / 180; }
function haversineKm(lat1, lon1, lat2, lon2) {
  const R = 6371;
  const dLat = toRad(lat2 - lat1);
  const dLon = toRad(lon2 - lon1);
  const a = Math.sin(dLat/2)**2 + Math.cos(toRad(lat1)) * Math.cos(toRad(lat2)) * Math.sin(dLon/2)**2;
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1-a));
  return R * c;
}
function combineToISO(dateStr, timeStr) {
  if (!dateStr) return null;
  const t = timeStr && timeStr.trim() ? timeStr.trim() : '00:00';
  const iso = `${dateStr}T${t}:00`;
  const d = new Date(iso);
  return isNaN(d.getTime()) ? null : d.toISOString();
}
function minutesDiff(isoA, isoB) {
  return Math.abs(new Date(isoA).getTime() - new Date(isoB).getTime()) / 60000;
}
function escapeHtml(unsafe) {
  if (unsafe == null) return '';
  return String(unsafe)
    .replaceAll('&', '&amp;')
    .replaceAll('<', '&lt;')
    .replaceAll('>', '&gt;')
    .replaceAll('"', '&quot;')
    .replaceAll("'", '&#039;');
}

/* =======================
   Geocoding
======================= */
const geocodeCache = new Map();
async function geocodeOnce(query) {
  if (!query || !query.trim()) return null;
  const key = query.trim().toLowerCase();
  if (geocodeCache.has(key)) return geocodeCache.get(key);

  const url = new URL(NOMINATIM_BASE);
  url.searchParams.set('q', query);
  url.searchParams.set('format', 'json');
  url.searchParams.set('limit', '1');
  url.searchParams.set('addressdetails', '1');
  url.searchParams.set('email', NOMINATIM_CONTACT_EMAIL);

  try {
    const resp = await fetch(url.toString());
    if (!resp.ok) return null;
    const arr = await resp.json();
    if (!arr || !arr[0]) return null;
    const r = { lat: Number(arr[0].lat), lon: Number(arr[0].lon), display_name: arr[0].display_name };
    geocodeCache.set(key, r);
    return r;
  } catch (err) {
    console.error('Geocode failed:', err);
    return null;
  }
}

/* =======================
   Toast helper
======================= */
function showToast(text, color = "#4f46e5") {
  if (typeof Toastify === "function") {
    Toastify({
      text,
      duration: 2500,
      close: true,
      gravity: "top",
      position: "center",
      backgroundColor: color,
      stopOnFocus: true
    }).showToast();
  } else {
    alert(text);
  }
}

/* =======================
   Modal
======================= */
function showModal(dest, date, time) {
  modalDestination.textContent = dest || '—';
  const formattedDate = date
    ? new Date(date + 'T00:00:00').toLocaleDateString('en-US', { month:'short', day:'numeric', year:'numeric' })
    : '—';
  modalDateTime.textContent = `${formattedDate} at ${time || '—'}`;
  modalResults.innerHTML = '';
  modal.classList.remove('hidden');
}
function hideModal() {
  modal.classList.add('hidden');
  modalResults.innerHTML = '';
  resultMarkers.forEach(m => map.removeLayer(m));
  resultMarkers.length = 0;
}

/* =======================
   Form Submit
======================= */
form.addEventListener('submit', async (e) => {
  e.preventDefault();
  const dest = destinationInput.value.trim();
  const date = dateInput.value;
  const time = timeInput.value;
  if (!dest) return alert('Enter destination.');

  const geo = await geocodeOnce(dest);
  if (!geo) return alert('Location not found.');

  if (currentMarker) map.removeLayer(currentMarker);
  currentMarker = L.marker([geo.lat, geo.lon]).addTo(map)
    .bindPopup(`<b>${escapeHtml(geo.display_name)}</b><br>${escapeHtml(date)} ${escapeHtml(time)}`).openPopup();
  map.setView([geo.lat, geo.lon], 12);
  showModal(dest, date, time);
});

/* =======================
   CREATE TRIP (with toast)
======================= */
createBtn.addEventListener('click', async (ev) => {
  ev.preventDefault();
  createBtn.disabled = true;
  createBtn.textContent = 'Creating...';

  const destination = destinationInput.value.trim();
  const date = dateInput.value;
  const time = timeInput.value;
  if (!destination || !date || !time) {
    alert('Fill all fields.');
    createBtn.disabled = false;
    createBtn.textContent = 'Create My Trip (Start a Group)';
    return;
  }

  const geo = await geocodeOnce(destination);
  const datetimeISO = combineToISO(date, time);
  const user = auth.currentUser;

  const tripObj = {
    destination,
    date,
    time,
    datetimeISO: datetimeISO || null,
    latitude: geo ? geo.lat : null,
    longitude: geo ? geo.lon : null,
    createdAt: serverTimestamp(),
    user_id: user ? user.uid : null,
    createdBy: user ? (user.email || `Anonymous (${user.uid.slice(0, 6)})`) : 'Unknown'
  };

  try {
    const docRef = await addDoc(collection(db, 'trips'), tripObj);
    await updateDoc(doc(db, 'trips', docRef.id), { id: docRef.id });
    showToast("🎉 Trip Created Successfully!");
    hideModal();
  } catch (err) {
    console.error('Save failed:', err);
    showToast("❌ Failed to create trip.", "#dc2626");
  } finally {
    createBtn.disabled = false;
    createBtn.textContent = 'Create My Trip (Start a Group)';
  }
});

/* =======================
   VIEW TRIPS (Distance Restored)
======================= */
viewBtn.addEventListener('click', async (ev) => {
  ev.preventDefault();
  viewBtn.disabled = true;
  viewBtn.textContent = 'Searching...';
  modalResults.innerHTML = '';

  const destination = destinationInput.value.trim();
  const date = dateInput.value;
  const time = timeInput.value;
  if (!destination || !date || !time) {
    alert('Please fill destination, date & time.');
    viewBtn.disabled = false;
    viewBtn.textContent = 'View Existing Trips (Join a Mate)';
    return;
  }

  const geo = await geocodeOnce(destination);
  if (!geo) {
    modalResults.innerHTML = `<div class="p-2 bg-yellow-50 border border-yellow-200 rounded">Could not geocode your location.</div>`;
    viewBtn.disabled = false;
    viewBtn.textContent = 'View Existing Trips (Join a Mate)';
    return;
  }

  const userISO = combineToISO(date, time);
  if (!userISO) {
    modalResults.innerHTML = `<div class="p-2 bg-red-50 border border-red-200 rounded">Invalid date/time.</div>`;
    viewBtn.disabled = false;
    viewBtn.textContent = 'View Existing Trips (Join a Mate)';
    return;
  }

  try {
    const q = query(collection(db, 'trips'), where('date', '==', date));
    const snap = await getDocs(q);

    if (snap.empty) {
      modalResults.innerHTML = `<div class="p-2 bg-gray-50 border border-gray-200 rounded">No trips found for ${escapeHtml(date)}.</div>`;
      viewBtn.disabled = false;
      viewBtn.textContent = 'View Existing Trips (Join a Mate)';
      return;
    }

    clearResultMarkers();
    const matches = [];

    snap.forEach(d => {
      const data = d.data();
      if (!data) return;
      const tripLat = data.latitude;
      const tripLon = data.longitude;
      const tripISO = data.datetimeISO || (data.date && data.time ? combineToISO(data.date, data.time) : null);
      if (!tripISO || tripLat == null || tripLon == null) return;

      const minDiff = minutesDiff(userISO, tripISO);
      if (minDiff > MAX_TIME_DIFF_MIN) return;

      const distKm = haversineKm(geo.lat, geo.lon, Number(tripLat), Number(tripLon));
      if (distKm <= MAX_VIEW_DISTANCE_KM) {
        matches.push({
          id: data.id || d.id,
          dest: data.destination,
          date: data.date,
          time: data.time,
          user_id: data.user_id || null,
          createdBy: data.createdBy || 'Unknown',
          distanceKm: Number(distKm.toFixed(2)),
          lat: Number(tripLat),
          lon: Number(tripLon)
        });
      }
    });

    if (matches.length === 0) {
      modalResults.innerHTML = `<div class="p-2 bg-gray-50 border border-gray-200 rounded">No nearby trips found within ${MAX_VIEW_DISTANCE_KM} km and ${MAX_TIME_DIFF_MIN} minutes on ${escapeHtml(date)}.</div>`;
    } else {
      matches.sort((a,b) => a.distanceKm - b.distanceKm);
      let html = `<div class="space-y-3">`;
      for (const m of matches) {
        html += `<div class="p-3 border border-gray-100 rounded bg-white text-black shadow-sm flex flex-col space-y-2">
          <div><strong>Destination:</strong> ${escapeHtml(m.dest)}</div>
          <div><strong>Date:</strong> ${escapeHtml(m.date)} <strong>Time:</strong> ${escapeHtml(m.time)}</div>
          <div><strong>Distance:</strong> ${escapeHtml(String(m.distanceKm))} km</div>
          <div><strong>Created by:</strong> ${escapeHtml(m.createdBy || 'Unknown')}</div>
          <button class="connect-btn mt-2 bg-green-600 text-white p-2 rounded-lg font-medium hover:bg-green-700 transition"
                  data-tripid="${escapeHtml(m.id)}" data-creator="${escapeHtml(m.createdBy)}">Connect</button>
        </div>`;

        const mk = L.marker([m.lat, m.lon]).addTo(map).bindPopup(`<b>${escapeHtml(m.dest)}</b><br>${escapeHtml(m.date)} ${escapeHtml(m.time)}<br>${escapeHtml(String(m.distanceKm))} km`);
        resultMarkers.push(mk);
      }
      html += `</div>`;
      modalResults.innerHTML = html;

      const groupLayers = resultMarkers.slice();
      if (currentMarker) groupLayers.push(currentMarker);
      if (groupLayers.length) {
        const group = new L.featureGroup(groupLayers);
        map.fitBounds(group.getBounds().pad(0.35));
      }
    }

  } catch (err) {
    console.error('Query error:', err);
    modalResults.innerHTML = `<div class="p-2 bg-red-50 border border-red-200 rounded">Error searching trips. See console.</div>`;
  } finally {
    viewBtn.disabled = false;
    viewBtn.textContent = 'View Existing Trips (Join a Mate)';
  }
});

/* =======================
   Connect button handler
======================= */
modalResults.addEventListener('click', (ev) => {
  const btn = ev.target.closest('.connect-btn');
  if (!btn) return;
  const tripId = btn.getAttribute('data-tripid');
  const creator = btn.getAttribute('data-creator');
  btn.textContent = 'Opening chat...';
  setTimeout(() => {
    window.location.href = `chat.html?tripId=${encodeURIComponent(tripId)}&creator=${encodeURIComponent(creator)}`;
  }, 300);
});

/* =======================
   Close Modal + helpers
======================= */
closeBtn.addEventListener('click', hideModal);

function clearResultMarkers() {
  for (const m of resultMarkers) map.removeLayer(m);
  resultMarkers.length = 0;
}
