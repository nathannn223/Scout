import { getTranslations } from "next-intl/server";
import { PaywallPrompt } from "@/components/paywall-prompt";
import { PortalButton } from "./portal-button";
import { SCAN_LIMIT, EXCLUDE_PLANS_FOR } from "@/lib/stripe";
import type { Plan } from "@prisma/client";

export async function BillingSection({ plan, scansThisMonth }: { plan: Plan; scansThisMonth: number }) {
  const t = await getTranslations("BillingSection");
  const excludePlans = EXCLUDE_PLANS_FOR[plan];
  const scanLimit = SCAN_LIMIT[plan];

  return (
    <section className="mb-12">
      <h2 className="mb-4 font-display text-xl font-semibold">{t("heading")}</h2>
      <div className="mb-4 flex flex-wrap items-center gap-3">
        <p className="text-sm text-muted-foreground">
          {t("currentPlan", { plan: t(`planNames.${plan}`) })}
          {scanLimit !== null &&
            t("scansThisMonth", { used: scansThisMonth, limit: scanLimit })}
        </p>
        {plan !== "FREE" && <PortalButton />}
      </div>

      {excludePlans.length < 3 && (
        <PaywallPrompt
          title={plan === "FREE" ? t("choosePlan") : t("upgradePlan")}
          excludePlans={excludePlans}
        />
      )}
    </section>
  );
}
