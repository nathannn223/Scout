"use client";

import { useTranslations } from "next-intl";
import { Link, usePathname } from "@/i18n/navigation";
import { LocaleSwitcher } from "@/components/locale-switcher";
import { cn } from "@/lib/utils";

export function DashboardSidebar() {
  const pathname = usePathname();
  const t = useTranslations("Dashboard.sidebar");

  const LINKS = [
    { href: "/dashboard", label: t("dashboard") },
    { href: "/dashboard/historique", label: t("historique") },
    { href: "/dashboard/favoris", label: t("favoris") },
    { href: "/dashboard/alertes", label: t("alertes") },
  ];

  return (
    <aside className="hidden w-56 shrink-0 border-r border-border px-5 py-7 sm:block">
      <Link href="/" className="mb-10 block font-display text-lg font-bold">
        Scout
      </Link>
      <nav className="flex flex-col gap-1">
        {LINKS.map((link) => {
          const active =
            link.href === "/dashboard" ? pathname === link.href : pathname.startsWith(link.href);
          return (
            <Link
              key={link.href}
              href={link.href}
              className={cn(
                "rounded-lg px-3 py-2 text-sm font-medium transition-colors",
                active
                  ? "bg-card text-foreground"
                  : "text-muted-foreground hover:text-foreground"
              )}
            >
              {link.label}
            </Link>
          );
        })}
      </nav>
      <div className="mt-6">
        <LocaleSwitcher />
      </div>
    </aside>
  );
}
