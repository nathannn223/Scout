import { getScanState, LAST_SCAN_KEY } from "./storage";

chrome.action.setBadgeText({ text: "" });

const content = document.getElementById("content") as HTMLDivElement;

function clear(): void {
  content.replaceChildren();
}

function renderMessage(text: string, className?: string): void {
  clear();
  const div = document.createElement("div");
  div.className = className ? `state-message ${className}` : "state-message";
  div.textContent = text;
  content.appendChild(div);
}

async function render(): Promise<void> {
  const state = await getScanState();

  if (!state) {
    renderMessage("Fais un clic droit sur une image, puis « Identifier avec Scout ».");
    return;
  }

  if (state.status === "pending") {
    renderMessage("Analyse en cours…");
    return;
  }

  if (state.status === "error") {
    renderMessage(state.message, "error-message");
    return;
  }

  clear();

  const { scan, matches } = state.scan;

  const summary = document.createElement("div");
  summary.className = "scan-summary";

  if (scan.category) {
    const category = document.createElement("span");
    category.className = "category";
    category.textContent = scan.category;
    summary.appendChild(category);
  }

  const title = document.createElement("h2");
  title.textContent = [scan.brand, scan.category].filter(Boolean).join(" ") || "Article identifié";
  summary.appendChild(title);

  if (scan.description) {
    const description = document.createElement("p");
    description.textContent = scan.description;
    summary.appendChild(description);
  }

  content.appendChild(summary);

  if (matches.length === 0) {
    const noMatches = document.createElement("p");
    noMatches.className = "no-matches";
    noMatches.textContent = "Aucun produit trouvé pour cet article.";
    content.appendChild(noMatches);
    return;
  }

  const list = document.createElement("ul");
  list.className = "matches";

  for (const match of matches) {
    const item = document.createElement("li");
    const link = document.createElement("a");
    link.className = "match";
    link.href = match.url;
    link.target = "_blank";
    link.rel = "noopener noreferrer";

    if (match.imageUrl) {
      const img = document.createElement("img");
      img.src = match.imageUrl;
      img.alt = "";
      link.appendChild(img);
    }

    const info = document.createElement("div");
    info.className = "info";

    const matchTitle = document.createElement("p");
    matchTitle.className = "title";
    matchTitle.textContent = match.title;
    info.appendChild(matchTitle);

    const merchant = document.createElement("div");
    merchant.className = "merchant";
    merchant.textContent = match.merchantName;
    info.appendChild(merchant);

    const price = document.createElement("div");
    price.className = "price";
    price.textContent = `${match.price.toFixed(2)} ${match.currency}`;
    info.appendChild(price);

    link.appendChild(info);
    item.appendChild(link);
    list.appendChild(item);
  }

  content.appendChild(list);
}

render();

// The popup can be open while a scan is still "pending" — re-render whenever
// the background script writes a new state, instead of requiring the user
// to close and reopen the popup to see the finished result.
chrome.storage.onChanged.addListener((changes, areaName) => {
  if (areaName === "local" && LAST_SCAN_KEY in changes) {
    render();
  }
});
