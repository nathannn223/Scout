import { PaywallPrompt } from "@/components/paywall-prompt";
import { PortalButton } from "./portal-button";
import { SCAN_LIMIT, EXCLUDE_PLANS_FOR } from "@/lib/stripe";
import type { Plan } from "@prisma/client";

const PLAN_LABELS: Record<Plan, string> = {
  FREE: "Gratuit",
  DECOUVERTE: "Découverte",
  ESSENTIEL: "Essentiel",
  PRO: "Pro",
};

export function BillingSection({ plan, scansThisMonth }: { plan: Plan; scansThisMonth: number }) {
  const excludePlans = EXCLUDE_PLANS_FOR[plan];
  const scanLimit = SCAN_LIMIT[plan];

  return (
    <section className="mb-12">
      <h2 className="mb-4 font-display text-xl font-semibold">Mon abonnement</h2>
      <div className="mb-4 flex flex-wrap items-center gap-3">
        <p className="text-sm text-muted-foreground">
          Palier actuel : <span className="font-medium text-foreground">{PLAN_LABELS[plan]}</span>
          {scanLimit !== null && ` — ${scansThisMonth}/${scanLimit} scans ce mois-ci`}
        </p>
        {plan !== "FREE" && <PortalButton />}
      </div>

      {excludePlans.length < 3 && (
        <PaywallPrompt
          title={plan === "FREE" ? "Choisis un palier" : "Passer à un palier supérieur"}
          excludePlans={excludePlans}
        />
      )}
    </section>
  );
}
