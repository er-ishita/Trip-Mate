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
    pixel.style.backgroundColor = "rgb(237, 83, 248)";
    pixel.style.boxShadow = "0 0 20px rgb(237, 83, 248)";
    setTimeout(() => {
      pixel.style.backgroundColor = "#1a1a2a";
      pixel.style.boxShadow = "none";
    }, 600);
  }
});

window.addEventListener("resize", () => {
});

const form = document.getElementById("signup-form");
const submitBtn = form.querySelector('button[type="submit"]');

const API_BASE = "http://127.0.0.1:5000";

form.addEventListener("submit", async (e) => {
  e.preventDefault();

  const full_name = (form.elements[0].value || "").trim();
  const email = (form.elements[1].value || "").trim();
  const password = form.elements[2].value || "";
  const confirm_password = form.elements[3].value || "";

  if (!full_name) return alert("Full name is required.");
  if (!email) return alert("Email is required.");
  if (password.length < 6) return alert("Password must be at least 6 characters.");
  if (password !== confirm_password) return alert("Passwords do not match.");

  submitBtn.disabled = true;
  submitBtn.textContent = "Creating...";

  try {
    const resp = await fetch(`${API_BASE}/api/auth/signup`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ full_name, email, password, confirm_password })
    });

    const data = await resp.json().catch(() => ({}));

    if (!resp.ok) {
      if (data && data.errors) {
        const firstKey = Object.keys(data.errors)[0];
        alert(data.errors[firstKey] || JSON.stringify(data.errors));
      } else {
        alert(data.error || "Signup failed. Check console/network.");
      }
    } else {
      alert("Account created successfully! Redirecting to login...");
      window.location.href = "login.html";
    }
  } catch (err) {
    console.error("Network error:", err);
    alert("Network error — ensure the backend is running at http://127.0.0.1:5000");
  } finally {
    submitBtn.disabled = false;
    submitBtn.textContent = "Create Account";
  }
});
