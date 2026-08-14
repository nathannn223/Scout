"use client";

import { useLocale } from "next-intl";
import { usePathname, useRouter } from "@/i18n/navigation";
import { routing } from "@/i18n/routing";

export function LocaleSwitcher() {
  const locale = useLocale();
  const pathname = usePathname();
  const router = useRouter();

  return (
    <div className="flex items-center gap-1 text-xs text-muted-foreground">
      {routing.locales.map((loc, i) => (
        <span key={loc} className="flex items-center gap-1">
          {i > 0 && <span className="text-border">/</span>}
          <button
            type="button"
            onClick={() => router.replace(pathname, { locale: loc })}
            className={
              loc === locale ? "font-semibold text-foreground" : "hover:text-foreground"
            }
            aria-current={loc === locale ? "true" : undefined}
          >
            {loc.toUpperCase()}
          </button>
        </span>
      ))}
    </div>
  );
}
