import { defineRouting } from "next-intl/routing";

export const routing = defineRouting({
  locales: ["fr", "en"],
  defaultLocale: "fr",
  // French keeps unprefixed URLs (/dashboard, not /fr/dashboard) — the site
  // was live and French-only before this change, so existing links/
  // bookmarks must keep working. Only English gets a /en prefix.
  localePrefix: "as-needed",
});

export type Locale = (typeof routing.locales)[number];
