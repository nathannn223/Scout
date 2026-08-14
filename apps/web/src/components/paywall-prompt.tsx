"use client";

import { useTranslations } from "next-intl";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { CheckoutButton } from "./checkout-button";
import { cn } from "@/lib/utils";
import type { PaidPlan } from "@/lib/stripe";

type Unit = "items" | "active" | "raw";
type Cell = { value: true | false | string; unit?: Unit };

interface FeatureRow {
  labelKey:
    | "scans"
    | "extension"
    | "visualSearch"
    | "wishlist"
    | "alerts"
    | "instantCheck"
    | "noCommitment";
  values: [Cell, Cell, Cell]; // [Découverte, Essentiel, Pro]
}

// One shared row list so the three columns stay aligned — each plan shows
// the exact same set of lines, either struck through (not included), plain
// (included as-is), or with a short value (e.g. a scan count).
const FEATURE_ROWS: FeatureRow[] = [
  { labelKey: "scans", values: [{ value: "9" }, { value: "25" }, { value: "unlimited" }] },
  { labelKey: "extension", values: [{ value: true }, { value: true }, { value: true }] },
  { labelKey: "visualSearch", values: [{ value: true }, { value: true }, { value: true }] },
  {
    labelKey: "wishlist",
    values: [
      { value: "5", unit: "items" },
      { value: "15", unit: "items" },
      { value: "unlimitedFeminine" },
    ],
  },
  {
    labelKey: "alerts",
    values: [{ value: false }, { value: "5", unit: "active" }, { value: "unlimited" }],
  },
  { labelKey: "instantCheck", values: [{ value: false }, { value: false }, { value: true }] },
  { labelKey: "noCommitment", values: [{ value: true }, { value: true }, { value: true }] },
];

const PLANS: { plan: PaidPlan; nameKey: "decouverte" | "essentiel" | "pro"; price: string; badge?: boolean; column: 0 | 1 | 2 }[] = [
  { plan: "DECOUVERTE", nameKey: "decouverte", price: "4,99€", column: 0 },
  { plan: "ESSENTIEL", nameKey: "essentiel", price: "8,99€", badge: true, column: 1 },
  { plan: "PRO", nameKey: "pro", price: "15,99€", column: 2 },
];

function formatCellValue(cell: Cell, t: ReturnType<typeof useTranslations<"PaywallPrompt">>) {
  if (cell.value === "unlimited") return t("values.unlimited");
  if (cell.value === "unlimitedFeminine") return t("values.unlimitedFeminine");
  if (cell.unit === "items") return t("values.itemsCount", { count: Number(cell.value) });
  if (cell.unit === "active") return t("values.activeCount", { count: Number(cell.value) });
  return cell.value as string;
}

function FeatureLine({
  label,
  cell,
  t,
}: {
  label: string;
  cell: Cell;
  t: ReturnType<typeof useTranslations<"PaywallPrompt">>;
}) {
  if (cell.value === false) {
    return <li className="text-muted-foreground/50 line-through">{label}</li>;
  }
  if (cell.value === true) {
    return <li>{label}</li>;
  }
  return (
    <li>
      {label} — <span className="font-medium text-foreground">{formatCellValue(cell, t)}</span>
    </li>
  );
}

export function PaywallPrompt({
  title,
  description,
  excludePlans = [],
  bare = false,
}: {
  title?: string;
  description?: string;
  /** Hide tiers the user is already on or has already passed (e.g. don't
   * offer Découverte again to someone already subscribed to it). */
  excludePlans?: PaidPlan[];
  /** Skip the bordered wrapper and inline title — for use as a standalone
   * pricing section that already has its own heading above it. */
  bare?: boolean;
}) {
  const t = useTranslations("PaywallPrompt");
  const visiblePlans = PLANS.filter((p) => !excludePlans.includes(p.plan));
  const grid = (
    <div className={cn("grid grid-cols-1 gap-4", visiblePlans.length === 3 && "sm:grid-cols-3")}>
      {visiblePlans.map((p) => {
        const planName = t(`plans.${p.nameKey}`);
        return (
          <Card key={p.plan} className="flex flex-col">
            <CardHeader>
              {p.badge && (
                <span className="mb-1 inline-block w-fit rounded-full bg-primary/10 px-2 py-0.5 text-xs font-medium text-primary">
                  {t("mostPopular")}
                </span>
              )}
              <CardTitle>
                {planName} — {p.price}/{t("perMonth")}
              </CardTitle>
            </CardHeader>
            <CardContent className="flex flex-1 flex-col gap-3">
              <ul className="flex flex-col gap-1.5 text-sm text-muted-foreground">
                {FEATURE_ROWS.map((row) => (
                  <FeatureLine
                    key={row.labelKey}
                    label={t(`features.${row.labelKey}`)}
                    cell={row.values[p.column]}
                    t={t}
                  />
                ))}
              </ul>
              <div className="mt-auto">
                <CheckoutButton plan={p.plan}>{t("subscribeTo", { plan: planName })}</CheckoutButton>
              </div>
            </CardContent>
          </Card>
        );
      })}
    </div>
  );

  if (bare) return grid;

  return (
    <div className="flex flex-col gap-3 rounded-md border border-border p-4">
      <div>
        <p className="text-sm font-medium">{title ?? t("defaultTitle")}</p>
        {description && <p className="mt-1 text-sm text-muted-foreground">{description}</p>}
      </div>
      {grid}
    </div>
  );
}
