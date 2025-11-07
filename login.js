const grid = document.getElementById("pixelGrid");
const pixelSize = 64;
const columns = Math.ceil(window.innerWidth / pixelSize);
const rows = Math.ceil(window.innerHeight / pixelSize);
const pixelCount = columns * rows;

for (let i = 0; i < pixelCount; i++) {
  const pixel = document.createElement("div");
  pixel.classList.add("pixel");
  grid.appendChild(pixel);
}

document.addEventListener("mousemove", (e) => {
  const x = Math.floor(e.clientX / pixelSize);
  const y = Math.floor(e.clientY / pixelSize);
  const index = y * columns + x;
  const pixel = grid.children[index];

  if (pixel) {
    pixel.style.backgroundColor = "#a855f7";
    pixel.style.boxShadow = "0 0 20px #a855f7";
    setTimeout(() => {
      pixel.style.backgroundColor = "#1a1a2a";
      pixel.style.boxShadow = "none";
    }, 600);
  }
});

window.addEventListener("resize", () => {});

import { auth } from "./firebase.js";
import { signInWithEmailAndPassword } from "https://www.gstatic.com/firebasejs/10.13.2/firebase-auth.js";

// 🔔 Toastify helper
function showToast(msg, color = "#a855f7") {
  Toastify({
    text: msg,
    duration: 3000,
    gravity: "top",
    position: "right",
    backgroundColor: color,
    stopOnFocus: true,
    close: true,
  }).showToast();
}

const form = document.getElementById("signup-form");
const submitBtn = form.querySelector('button[type="submit"]');

form.addEventListener("submit", async (e) => {
  e.preventDefault();

  const email = (form.elements[0].value || "").trim();
  const password = form.elements[1].value || "";

  if (!email || !password) {
    showToast("Please fill in both fields.", "crimson");
    return;
  }

  submitBtn.disabled = true;
  submitBtn.textContent = "Logging in...";

  try {
    const userCredential = await signInWithEmailAndPassword(
      auth,
      email,
      password
    );
    const user = userCredential.user;
    showToast(`Welcome back, ${user.displayName || "traveler"}!`, "#a855f7");
    setTimeout(() => (window.location.href = "index.html"), 1500);
  } catch (error) {
    console.error("Login error:", error);
    showToast("Login failed: " + error.message, "crimson");
  } finally {
    submitBtn.disabled = false;
    submitBtn.textContent = "Log in";
  }
});