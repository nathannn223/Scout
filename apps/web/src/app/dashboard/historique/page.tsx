import Image from "next/image";
import { db } from "@/lib/db";
import { requireUser } from "@/lib/auth";
import { MatchList } from "@/components/match-list";

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
            <div key={scan.id} className="rounded-xl border border-border bg-card p-4">
              <div className="mb-4 flex items-start gap-4">
                {scan.imageUrl && (
                  <Image
                    src={scan.imageUrl}
                    alt=""
                    width={72}
                    height={72}
                    unoptimized
                    className="h-18 w-18 shrink-0 rounded-md border border-border object-cover"
                  />
                )}
                <div>
                  <p className="font-semibold">
                    {[scan.brand, scan.category].filter(Boolean).join(" ") ||
                      "Article identifié"}
                  </p>
                  <p className="mt-1 text-sm text-muted-foreground">{scan.description}</p>
                </div>
              </div>
              {scan.matches.length > 0 && (
                <MatchList
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
              )}
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
