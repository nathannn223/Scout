"use client";

import { useEffect, useState } from "react";
import { useTranslations } from "next-intl";

// Placeholder until the Chrome Web Store listing is live — update once
// Scout is published.
const EXTENSION_STORE_URL = "https://chrome.google.com/webstore";

/** Chrome on mobile can't install extensions — hiding this avoids a dead
 * CTA for the mobile traffic paid acquisition will mostly bring in. */
function isMobile(): boolean {
  return /Android|iPhone|iPad|iPod/i.test(navigator.userAgent);
}

export function ExtensionNavLink() {
  const t = useTranslations("Nav");
  const [visible, setVisible] = useState(false);

  useEffect(() => {
    setVisible(!isMobile());
  }, []);

  if (!visible) return null;

  return (
    <a
      href={EXTENSION_STORE_URL}
      target="_blank"
      rel="noopener noreferrer"
      className="text-xs text-muted-foreground hover:text-foreground"
    >
      {t("addToChrome")}
    </a>
  );
}
