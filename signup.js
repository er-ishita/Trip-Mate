// =================== PIXEL GRID (unchanged) ===================
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

// =================== FIREBASE SIGNUP + TOASTIFY ===================
import { auth } from "./firebase.js";
import { createUserWithEmailAndPassword, updateProfile } 
  from "https://www.gstatic.com/firebasejs/10.13.2/firebase-auth.js";

const form = document.getElementById("signup-form");
const submitBtn = form.querySelector('button[type="submit"]');

// 🔔 Toastify helper
function showToast(msg, color = "#a855f7") {
  Toastify({
    text: msg,
    duration: 3000,
    gravity: "top",
    position: "right",
    backgroundColor: color,
    stopOnFocus: true,
    close: true
  }).showToast();
}

form.addEventListener("submit", async (e) => {
  e.preventDefault();

  const full_name = (form.elements[0].value || "").trim();
  const email = (form.elements[1].value || "").trim();
  const password = form.elements[2].value || "";
  const confirm_password = form.elements[3].value || "";

  if (!full_name) return showToast("Full name is required.", "crimson");
  if (!email) return showToast("Email is required.", "crimson");
  if (password.length < 6) return showToast("Password must be at least 6 characters.", "crimson");
  if (password !== confirm_password) return showToast("Passwords do not match.", "crimson");

  submitBtn.disabled = true;
  submitBtn.textContent = "Creating...";

  try {
    const userCredential = await createUserWithEmailAndPassword(auth, email, password);
    await updateProfile(userCredential.user, { displayName: full_name });

    showToast("Account created successfully! Redirecting...", "#a855f7");
    setTimeout(() => (window.location.href = "login.html"), 1500);
  } catch (error) {
    console.error("Signup error:", error);
    showToast(error.message || "Signup failed. Please try again.", "crimson");
  } finally {
    submitBtn.disabled = false;
    submitBtn.textContent = "Create Account";
  }
});
