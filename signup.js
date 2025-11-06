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
