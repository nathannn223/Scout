import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { CheckoutButton } from "./checkout-button";
import { cn } from "@/lib/utils";
import type { PaidPlan } from "@/lib/stripe";

type Cell = true | false | string;

interface FeatureRow {
  label: string;
  values: [Cell, Cell, Cell]; // [Découverte, Essentiel, Pro]
}

// One shared row list so the three columns stay aligned — each plan shows
// the exact same set of lines, either struck through (not included), plain
// (included as-is), or with a short value (e.g. a scan count).
const FEATURE_ROWS: FeatureRow[] = [
  { label: "Scans par mois", values: ["9", "25", "Illimités"] },
  { label: "Extension Chrome", values: [true, true, true] },
  { label: "Recherche visuelle (Lens)", values: [true, true, true] },
  { label: "Wishlist", values: ["5 articles", "15 articles", "Illimitée"] },
  { label: "Alertes de prix", values: [false, "5 actives", "Illimitées"] },
  { label: "Vérification immédiate", values: [false, false, true] },
  { label: "Sans engagement", values: [true, true, true] },
];

const PLANS: { plan: PaidPlan; name: string; price: string; badge?: string; column: 0 | 1 | 2 }[] = [
  { plan: "DECOUVERTE", name: "Découverte", price: "4,99€/mois", column: 0 },
  { plan: "ESSENTIEL", name: "Essentiel", price: "6,99€/mois", badge: "Le plus populaire", column: 1 },
  { plan: "PRO", name: "Pro", price: "14,99€/mois", column: 2 },
];

function FeatureLine({ label, value }: { label: string; value: Cell }) {
  if (value === false) {
    return <li className="text-muted-foreground/50 line-through">{label}</li>;
  }
  if (value === true) {
    return <li>{label}</li>;
  }
  return (
    <li>
      {label} — <span className="font-medium text-foreground">{value}</span>
    </li>
  );
}

export function PaywallPrompt({
  title = "Passe à un palier payant",
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
  const visiblePlans = PLANS.filter((p) => !excludePlans.includes(p.plan));
  const grid = (
    <div className={cn("grid grid-cols-1 gap-4", visiblePlans.length === 3 && "sm:grid-cols-3")}>
      {visiblePlans.map((p) => (
        <Card key={p.plan} className="flex flex-col">
          <CardHeader>
            {p.badge && (
              <span className="mb-1 inline-block w-fit rounded-full bg-primary/10 px-2 py-0.5 text-xs font-medium text-primary">
                {p.badge}
              </span>
            )}
            <CardTitle>
              {p.name} — {p.price}
            </CardTitle>
          </CardHeader>
          <CardContent className="flex flex-1 flex-col gap-3">
            <ul className="flex flex-col gap-1.5 text-sm text-muted-foreground">
              {FEATURE_ROWS.map((row) => (
                <FeatureLine key={row.label} label={row.label} value={row.values[p.column]} />
              ))}
            </ul>
            <div className="mt-auto">
              <CheckoutButton plan={p.plan}>Passer à {p.name}</CheckoutButton>
            </div>
          </CardContent>
        </Card>
      ))}
    </div>
  );

  if (bare) return grid;

  return (
    <div className="flex flex-col gap-3 rounded-md border border-border p-4">
      <div>
        <p className="text-sm font-medium">{title}</p>
        {description && <p className="mt-1 text-sm text-muted-foreground">{description}</p>}
      </div>
      {grid}
    </div>
  );
}
