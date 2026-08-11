import type { ScanResponse } from "@scout/shared";
import { API_BASE_URL } from "./config";
import { setScanState } from "./storage";

const MENU_ITEM_ID = "scout-identify";

// Notification IDs double as a lookup key for their action button's
// destination — simpler than tracking a separate id→url map across service
// worker restarts.
const NOTIFICATION_ACTIONS: Record<string, string> = {
  "scout-auth-required": `${API_BASE_URL}/sign-in`,
  "scout-scan-limit": `${API_BASE_URL}/dashboard`,
  "scout-extension-paid": `${API_BASE_URL}/dashboard`,
};

chrome.runtime.onInstalled.addListener((details) => {
  chrome.contextMenus.create({
    id: MENU_ITEM_ID,
    title: "Identifier avec Scout",
    contexts: ["image"],
  });

  if (details.reason === "install") {
    chrome.tabs.create({ url: chrome.runtime.getURL("onboarding.html") });
  }
});

chrome.notifications.onButtonClicked.addListener((notificationId) => {
  const url = NOTIFICATION_ACTIONS[notificationId];
  if (url) chrome.tabs.create({ url });
});

chrome.contextMenus.onClicked.addListener((info, tab) => {
  if (info.menuItemId !== MENU_ITEM_ID || !info.srcUrl) return;
  handleIdentify(info.srcUrl, tab?.url);
});

class ScanApiError extends Error {
  constructor(message: string, public code?: string) {
    super(message);
  }
}

async function handleIdentify(imageUrl: string, sourceUrl?: string): Promise<void> {
  await setScanState({ status: "pending", startedAt: Date.now() });
  setBadge("...", "#565b4f");

  try {
    const formData = new FormData();
    formData.append("imageUrl", imageUrl);
    if (sourceUrl) formData.append("sourceUrl", sourceUrl);

    const response = await fetch(`${API_BASE_URL}/api/scan`, {
      method: "POST",
      body: formData,
      // Sends the browser's Clerk session cookie for our domain, if any —
      // scanning requires a real account, so this is what ties the request
      // to it. No sign-in step inside the extension itself: the onboarding
      // flow (onboarding.html) sends the user to /sign-in in a full tab.
      credentials: "include",
      // Lets the server tell extension scans apart from web scans — the
      // extension is a paid-only surface, the one free scan only works
      // through the web (dashboard or the landing page's try-it widget).
      headers: { "X-Scout-Client": "extension" },
    });

    if (!response.ok) {
      const body = await response.json().catch(() => ({ error: "Erreur inconnue." }));
      throw new ScanApiError(
        body.error || `Le serveur a renvoyé une erreur (${response.status}).`,
        body.code
      );
    }

    const scan: ScanResponse = await response.json();
    await setScanState({ status: "done", scan, completedAt: Date.now() });
    setBadge("OK", "#2f7d4f");
    notify("Scout — Résultats prêts", describeScan(scan));
  } catch (err) {
    const message = err instanceof Error ? err.message : "Une erreur est survenue.";
    await setScanState({ status: "error", message, completedAt: Date.now() });
    setBadge("!", "#a3690f");

    if (err instanceof ScanApiError && err.code === "AUTH_REQUIRED") {
      notify("Scout — Connexion requise", message, "scout-auth-required", "Se connecter");
    } else if (err instanceof ScanApiError && err.code === "SCAN_LIMIT_REACHED") {
      notify("Scout — Limite atteinte", message, "scout-scan-limit", "Voir les paliers");
    } else if (err instanceof ScanApiError && err.code === "EXTENSION_REQUIRES_PLAN") {
      notify("Scout — Abonnement requis", message, "scout-extension-paid", "Voir les paliers");
    } else {
      notify("Scout — Échec de l'identification", message);
    }
  }

  // Best effort: works when Chrome still considers this a user-gesture
  // context. If it fails, the badge + notification above still tell the
  // user to open the popup manually.
  try {
    await chrome.action.openPopup();
  } catch {
    // Ignored — badge and notification are the reliable fallback.
  }
}

function describeScan(scan: ScanResponse): string {
  const count = scan.matches.length;
  const item = [scan.scan.brand, scan.scan.category].filter(Boolean).join(" ");
  return count > 0
    ? `${item} — ${count} produit${count > 1 ? "s" : ""} trouvé${count > 1 ? "s" : ""}. Clique sur l'icône Scout.`
    : `${item} identifié, mais aucun produit trouvé. Clique sur l'icône Scout.`;
}

function setBadge(text: string, color: string): void {
  chrome.action.setBadgeText({ text });
  chrome.action.setBadgeBackgroundColor({ color });
}

function notify(
  title: string,
  message: string,
  notificationId?: string,
  actionTitle?: string
): void {
  chrome.notifications.create(
    notificationId ?? "",
    {
      type: "basic",
      iconUrl: chrome.runtime.getURL("icon-128.png"),
      title,
      message,
      buttons: actionTitle ? [{ title: actionTitle }] : undefined,
    },
    () => {
      if (chrome.runtime.lastError) {
        console.error("[scout] notification failed:", chrome.runtime.lastError.message);
      }
    }
  );
}
