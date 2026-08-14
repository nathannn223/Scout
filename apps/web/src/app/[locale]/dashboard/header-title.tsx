"use client";

import { useTranslations } from "next-intl";
import { usePathname } from "@/i18n/navigation";

export function DashboardHeaderTitle() {
  const pathname = usePathname();
  const t = useTranslations("Dashboard.sidebar");

  const TITLES: Record<string, string> = {
    "/dashboard": t("dashboard"),
    "/dashboard/historique": t("historique"),
    "/dashboard/favoris": t("favoris"),
    "/dashboard/alertes": t("alertes"),
  };

  const title = TITLES[pathname] ?? "";
  return <span className="font-display text-[28px] font-bold">{title}</span>;
}
