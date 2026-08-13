import Link from "next/link";
import { notFound } from "next/navigation";
import { db } from "@/lib/db";
import { requireUser } from "@/lib/auth";
import { ScanCard } from "@/components/scan-card";

export default async function ScanDetailPage({ params }: { params: { id: string } }) {
  const user = await requireUser();
  if (!user) {
    return (
      <p className="text-center text-muted-foreground">
        Impossible de charger ton compte. Réessaie de te reconnecter.
      </p>
    );
  }

  const scan = await db.scannedItem.findUnique({
    where: { id: params.id },
    include: { matches: true },
  });
  if (!scan || scan.userId !== user.id) {
    notFound();
  }

  const wishlistItems = await db.wishlistItem.findMany({ where: { userId: user.id } });
  const wishlistedProductIds = new Map(
    wishlistItems.map((item) => [item.matchedProductId, item.id])
  );

  return (
    <div className="flex flex-col gap-6">
      <Link
        href="/dashboard/historique"
        className="text-sm text-muted-foreground hover:text-foreground"
      >
        ← Retour à l&rsquo;historique
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
      />
    </div>
  );
}
