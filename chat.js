// chat-ui.js
import { auth, db } from "./firebase.js";
import {
  onAuthStateChanged,
  signInAnonymously,
} from "https://www.gstatic.com/firebasejs/10.13.2/firebase-auth.js";
import {
  collection,
  query,
  where,
  orderBy,
  addDoc,
  onSnapshot,
  serverTimestamp,
  getDocs,
} from "https://www.gstatic.com/firebasejs/10.13.2/firebase-firestore.js";

document.addEventListener("DOMContentLoaded", () => {
  const chatListEl = document.getElementById("chat-list");
  const messagesEl = document.getElementById("messages");
  const chatTitleEl = document.getElementById("chat-title");
  const msgInput = document.getElementById("msg-input");
  const sendBtn = document.getElementById("send-btn");

  let currentUserId = null;
  let currentUserEmail = null;
  let currentTripId = null;
  let unsubscribeMessages = null;

  const escapeHtml = (t = "") =>
    t
      .replaceAll("&", "&amp;")
      .replaceAll("<", "&lt;")
      .replaceAll(">", "&gt;")
      .replaceAll('"', "&quot;")
      .replaceAll("'", "&#039;");

  /* ========= AUTH ========= */
  onAuthStateChanged(auth, async (user) => {
    if (!user) {
      const anon = await signInAnonymously(auth);
      currentUserId = anon.user.uid;
    } else {
      currentUserId = user.uid;
      currentUserEmail = user.email || null;
    }

    await loadChats();

    const params = new URLSearchParams(window.location.search);
    const autoTripId = params.get("tripId");
    const autoCreator = params.get("creator");
    if (autoTripId) {
      setTimeout(() => selectChat(autoTripId, autoCreator || "Unknown"), 500);
    }
  });

  /* ========= LOAD CHATS ========= */
  async function loadChats() {
    chatListEl.innerHTML = `<div class="opacity-70">Loading chats...</div>`;
    const q = query(collection(db, "trips"), orderBy("createdAt", "desc"));
    const snap = await getDocs(q);
    chatListEl.innerHTML = "";

    snap.forEach((docSnap) => {
      const t = docSnap.data();
      if (!t?.id) return;
      // Only show my trips or the ones I created
      if (t.user_id !== currentUserId && t.createdBy !== currentUserEmail) return;

      const div = document.createElement("div");
      div.className = "chat-item";
      div.dataset.tripId = t.id;
      div.innerHTML = `
        <div class="font-semibold">${escapeHtml(t.destination || "Trip")}</div>
        <div class="text-sm opacity-80">${escapeHtml(t.createdBy || "Unknown")}</div>`;
      div.onclick = () => selectChat(t.id, t.createdBy || "Unknown");
      chatListEl.appendChild(div);
    });

    if (!chatListEl.innerHTML.trim()) {
      chatListEl.innerHTML = `<div class="opacity-70">No chats found</div>`;
    }
  }

  /* ========= SELECT CHAT ========= */
  function selectChat(tripId, name) {
    currentTripId = tripId;
    chatTitleEl.textContent = `Chat with: ${name}`;
    document.querySelectorAll(".chat-item").forEach((el) => el.classList.remove("active"));
    document
      .querySelector(`[data-trip-id="${tripId}"]`)
      ?.classList.add("active");
    listenForMessages(tripId);
  }

  /* ========= LISTEN FOR MESSAGES ========= */
  function listenForMessages(tripId) {
    messagesEl.innerHTML = "";
    if (unsubscribeMessages) unsubscribeMessages();

    console.log("Listening for messages in trip:", tripId);

    // simpler query, works without composite index
    const q = query(collection(db, "tripChats"), where("tripId", "==", tripId));

    unsubscribeMessages = onSnapshot(
      q,
      (snap) => {
        console.log("snapshot size:", snap.size);
        messagesEl.innerHTML = "";
        if (snap.empty) {
          messagesEl.innerHTML =
            '<div class="opacity-70 text-sm">No messages yet</div>';
          return;
        }

        // Sort manually by createdAt if needed
        const msgs = snap.docs
          .map((d) => ({ id: d.id, ...d.data() }))
          .sort(
            (a, b) =>
              (a.createdAt?.seconds || 0) - (b.createdAt?.seconds || 0)
          );

        msgs.forEach(renderMessage);
        messagesEl.scrollTop = messagesEl.scrollHeight;
      },
      (err) => console.error("onSnapshot error:", err)
    );
  }

  /* ========= RENDER MESSAGE ========= */
  function renderMessage(m) {
    const div = document.createElement("div");
    div.classList.add("message", m.sender === currentUserId ? "you" : "other");
    const ts = m.createdAt?.toDate ? m.createdAt.toDate() : new Date();
    const time = ts.toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" });
    div.innerHTML = `<strong>${escapeHtml(
      m.senderEmail || (m.sender === currentUserId ? "You" : "Anon")
    )}:</strong> ${escapeHtml(m.text)}
        <div class="text-xs opacity-70 mt-1">${time}</div>`;
    messagesEl.appendChild(div);
  }

  /* ========= SEND MESSAGE ========= */
  async function sendMessage() {
    const text = msgInput.value.trim();
    if (!text || !currentTripId) return;

    const user = auth.currentUser;
    const senderEmail = user?.email || `Anon-${(currentUserId || "").slice(0, 6)}`;
    const msg = {
      tripId: currentTripId,
      text,
      sender: currentUserId,
      senderEmail,
      createdAt: serverTimestamp(),
    };
    try {
      await addDoc(collection(db, "tripChats"), msg);
      msgInput.value = "";
      msgInput.focus();
    } catch (err) {
      console.error("Send failed:", err);
      alert("Send failed");
    }
  }

  sendBtn.addEventListener("click", sendMessage);
  msgInput.addEventListener("keydown", (e) => {
    if (e.key === "Enter") sendMessage();
  });
});
