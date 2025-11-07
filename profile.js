// ---------- Firebase Setup ----------
import { auth, db } from "./firebase.js";
import {
  onAuthStateChanged,
  signOut,
} from "https://www.gstatic.com/firebasejs/11.0.1/firebase-auth.js";
import {
  doc,
  setDoc,
  getDoc,
} from "https://www.gstatic.com/firebasejs/11.0.1/firebase-firestore.js";

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
  return document.getElementById(id)?.value.trim() || "";
}

// ---------- Clear Data ----------
window.clearProfile = async function () {
  const user = auth.currentUser;
  if (!user) return alert("Not signed in.");

  document
    .querySelectorAll("input, select, textarea")
    .forEach((el) => (el.value = ""));
  await setDoc(doc(db, "users", user.uid), {}, { merge: true });
  alert("Profile cleared!");
};

// ---------- Sign Out ----------
document.getElementById("signOutBtn").addEventListener("click", async () => {
  await signOut(auth);
  window.location.href = "login.html";
});
