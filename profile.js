// ---------- Firebase Setup ----------
import { initializeApp } from "https://www.gstatic.com/firebasejs/11.0.1/firebase-app.js";
import {
  getAuth,
  onAuthStateChanged,
  signOut,
} from "https://www.gstatic.com/firebasejs/11.0.1/firebase-auth.js";
import {
  getFirestore,
  doc,
  setDoc,
  getDoc,
} from "https://www.gstatic.com/firebasejs/11.0.1/firebase-firestore.js";

const firebaseConfig = {
  apiKey: "AIzaSyCy-qC1V_u8Unnd6h_3t1kLqpdzfgweJ9w",
  authDomain: "trip-mate-77a45.firebaseapp.com",
  projectId: "trip-mate-77a45",
  storageBucket: "trip-mate-77a45.firebasestorage.app",
  messagingSenderId: "220786589071",
  appId: "1:220786589071:web:23c005d9a3a4986b675ffa",
  measurementId: "G-FJ03XG45SY"
};

const app = initializeApp(firebaseConfig);
const auth = getAuth(app);
const db = getFirestore(app);

// ---------- Auth Check ----------
onAuthStateChanged(auth, async (user) => {
  if (!user) {
    window.location.href = "login.html";
    return;
  }

  // Pre-fill email field and load existing data
  document.getElementById("email").value = user.email;
  const ref = doc(db, "users", user.uid);
  const snap = await getDoc(ref);
  if (snap.exists()) {
    const data = snap.data();
    for (const key in data) {
      const el = document.getElementById(key);
      if (el) el.value = data[key];
    }
  }
});

// ---------- Save Profile ----------
window.saveProfile = async function () {
  const user = auth.currentUser;
  if (!user) return alert("Not signed in.");

  const data = {
    name: value("name"),
    email: value("email"),
    enroll: value("enroll"),
    branch: value("branch"),
    year: value("year"),
    gender: value("gender"),
    phone: value("phone"),
    travel: value("travel"),
    updatedAt: new Date().toISOString(),
  };

  try {
    await setDoc(doc(db, "users", user.uid), data, { merge: true });
    alert("Profile saved successfully!");
  } catch (err) {
    console.error(err);
    alert("Error saving profile.");
  }
};

function value(id) {
  return document.getElementById(id).value.trim();
}

// ---------- Clear Data ----------
window.clearProfile = function () {
  const user = auth.currentUser;
  if (!user) return alert("Not signed in.");

  document.querySelectorAll("input, select, textarea").forEach((el) => (el.value = ""));
  setDoc(doc(db, "users", user.uid), {}, { merge: true });
  alert("Profile cleared!");
};

// ---------- Sign Out ----------
document.getElementById("signOutBtn").addEventListener("click", async () => {
  await signOut(auth);
  window.location.href = "login.html";
});
