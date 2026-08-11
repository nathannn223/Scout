"use client";

import { usePathname } from "next/navigation";

const TITLES: Record<string, string> = {
  "/dashboard": "Tableau de bord",
  "/dashboard/historique": "Historique",
  "/dashboard/favoris": "Favoris",
  "/dashboard/alertes": "Alertes",
};

export function DashboardHeaderTitle() {
  const pathname = usePathname();
  const title = TITLES[pathname] ?? "";
  return <span className="font-display text-[28px] font-bold">{title}</span>;
}
