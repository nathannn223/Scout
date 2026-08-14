import { notFound } from "next/navigation";
import { getLocale, getTranslations } from "next-intl/server";
import { Link } from "@/i18n/navigation";
import { db } from "@/lib/db";
import { requireUser } from "@/lib/auth";
import { ScanCard } from "@/components/scan-card";

export default async function ScanDetailPage({
  params,
  searchParams,
}: {
  params: Promise<{ id: string }>;
  searchParams: Promise<{ from?: string }>;
}) {
  const { id } = await params;
  const { from } = await searchParams;
  const locale = await getLocale();
  const user = await requireUser(locale);
  const t = await getTranslations("Dashboard.scanDetail");
  const tCommon = await getTranslations("Common");
  if (!user) {
    return <p className="text-center text-muted-foreground">{tCommon("accountError")}</p>;
  }

  const scan = await db.scannedItem.findUnique({
    where: { id },
    include: { matches: true },
  });
  if (!scan || scan.userId !== user.id) {
    notFound();
  }

  const wishlistItems = await db.wishlistItem.findMany({ where: { userId: user.id } });
  const wishlistedProductIds = new Map(
    wishlistItems.map((item) => [item.matchedProductId, item.id])
  );

  // Explicit return link based on where the user actually came from, rather
  // than relying on the browser's back button — deterministic regardless of
  // the exact navigation path taken to reach this page.
  const BACK_TARGETS: Record<string, { href: string; label: string }> = {
    dashboard: { href: "/dashboard", label: t("backDashboard") },
    favoris: { href: "/dashboard/favoris", label: t("backFavoris") },
    alertes: { href: "/dashboard/alertes", label: t("backAlertes") },
  };
  const back = BACK_TARGETS[from ?? ""] ?? {
    href: "/dashboard/historique",
    label: t("backHistorique"),
  };

  return (
    <div className="flex flex-col gap-6">
      <Link href={back.href} className="text-sm text-muted-foreground hover:text-foreground">
        {back.label}
      </Link>
      <ScanCard
        imageUrl={scan.imageUrl}
        brand={scan.brand}
        category={scan.category}
        description={scan.description}
        matches={scan.matches.map((match) => ({
          id: match.id,
          merchantName: match.merchantName,
          title: match.title,
          price: Number(match.price),
          currency: match.currency,
          url: match.url,
          imageUrl: match.imageUrl,
          wishlistItemId: wishlistedProductIds.get(match.id) ?? null,
        }))}
        locked={user.plan === "FREE"}
        currentPlan={user.plan}
        unknownArticleLabel={tCommon("unknownArticle")}
      />
    </div>
  );
}
