import { db } from "@/lib/db";
import { requireUser } from "@/lib/auth";
import { ScanCard } from "@/components/scan-card";

export default async function HistoriquePage() {
  const user = await requireUser();
  if (!user) {
    return (
      <p className="text-center text-muted-foreground">
        Impossible de charger ton compte. Réessaie de te reconnecter.
      </p>
    );
  }

  const [scans, wishlistItems] = await Promise.all([
    db.scannedItem.findMany({
      where: { userId: user.id },
      orderBy: { createdAt: "desc" },
      include: { matches: true },
    }),
    db.wishlistItem.findMany({ where: { userId: user.id } }),
  ]);

  const wishlistedProductIds = new Map(
    wishlistItems.map((item) => [item.matchedProductId, item.id])
  );

  return (
    <div>
      {scans.length === 0 ? (
        <p className="text-sm text-muted-foreground">
          Aucun scan pour l&rsquo;instant — identifie une pièce depuis le tableau de bord pour
          commencer.
        </p>
      ) : (
        <div className="flex flex-col gap-6">
          {scans.map((scan) => (
            <ScanCard
              key={scan.id}
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
          ))}
        </div>
      )}
    </div>
  );
}
