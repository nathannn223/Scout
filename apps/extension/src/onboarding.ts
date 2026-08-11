import { API_BASE_URL } from "./config";

const screens = Array.from(document.querySelectorAll<HTMLElement>(".screen"));
const dots = Array.from(document.querySelectorAll<HTMLElement>(".dot"));
const nextBtn = document.getElementById("next") as HTMLButtonElement;
const skipBtn = document.getElementById("skip") as HTMLButtonElement;
const tryWebLink = document.getElementById("try-web") as HTMLAnchorElement | null;

if (tryWebLink) tryWebLink.href = API_BASE_URL;

let index = 0;

function render(): void {
  const isLast = index === screens.length - 1;
  screens.forEach((s, i) => s.classList.toggle("active", i === index));
  dots.forEach((d, i) => d.classList.toggle("active", i === index));
  nextBtn.textContent = isLast ? "Se connecter" : "Suivant";
  skipBtn.style.visibility = isLast ? "hidden" : "visible";
}

nextBtn.addEventListener("click", () => {
  const isLast = index === screens.length - 1;
  if (isLast) {
    window.open(`${API_BASE_URL}/sign-in`, "_blank");
    return;
  }
  index++;
  render();
});

// Dismissable at every step but the last — the account gate is required
// before scanning works, so skipping past it would just defer the same
// prompt to the first failed scan instead of removing it.
skipBtn.addEventListener("click", () => {
  window.close();
});

render();
