import Image from "next/image";
import Link from "next/link";
import { db } from "@/lib/db";
import { requireUser } from "@/lib/auth";
import { WishlistButton } from "./wishlist-button";
import { BillingSection } from "./billing-section";
import { ClickableRow } from "@/components/clickable-row";
import { StopPropagation } from "@/components/stop-propagation";

export default async function DashboardPage() {
  const user = await requireUser();
  if (!user) {
    // The middleware already protects this route — this only guards
    // against the edge case where the Clerk session has no email yet.
    return (
      <p className="text-center text-muted-foreground">
        Impossible de charger ton compte. Réessaie de te reconnecter.
      </p>
    );
  }

  const startOfMonth = new Date();
  startOfMonth.setDate(1);
  startOfMonth.setHours(0, 0, 0, 0);

  const [recentWishlist, recentScans, scansThisMonth] = await Promise.all([
    db.wishlistItem.findMany({
      where: { userId: user.id },
      orderBy: { createdAt: "desc" },
      take: 4,
    }),
    db.scannedItem.findMany({
      where: { userId: user.id },
      orderBy: { createdAt: "desc" },
      take: 3,
    }),
    db.scannedItem.count({ where: { userId: user.id, createdAt: { gte: startOfMonth } } }),
  ]);

  const wishlistProducts = await db.matchedProduct.findMany({
    where: { id: { in: recentWishlist.map((i) => i.matchedProductId) } },
  });
  const productsById = new Map(wishlistProducts.map((p) => [p.id, p]));

  return (
    <div className="flex flex-col gap-16">
      <section>
        <div className="mb-4 flex items-center justify-between">
          <h2 className="font-display text-xl font-bold">Favoris récents</h2>
          <Link
            href="/dashboard/favoris"
            className="text-sm text-muted-foreground hover:text-foreground"
          >
            Voir tout →
          </Link>
        </div>
        {recentWishlist.length === 0 ? (
          <p className="text-sm text-muted-foreground">
            Rien de sauvegardé pour l&rsquo;instant.
          </p>
        ) : (
          <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
            {recentWishlist.map((item) => {
              const product = productsById.get(item.matchedProductId);
              if (!product) return null;
              return (
                <ClickableRow
                  key={item.id}
                  href={`/dashboard/scans/${product.scannedItemId}`}
                  className="flex items-center gap-3 rounded-xl border border-border bg-card p-3"
                >
                  {product.imageUrl && (
                    <Image
                      src={product.imageUrl}
                      alt=""
                      width={40}
                      height={40}
                      unoptimized
                      className="h-10 w-10 shrink-0 rounded bg-background object-contain"
                    />
                  )}
                  <div className="min-w-0 flex-1">
                    <StopPropagation>
                      <a
                        href={product.url}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="block truncate text-sm font-medium hover:underline"
                      >
                        {product.title}
                      </a>
                    </StopPropagation>
                    <p className="text-xs text-muted-foreground">
                      {product.merchantName} · {Number(product.price).toFixed(2)}{" "}
                      {product.currency}
                    </p>
                  </div>
                  <StopPropagation>
                    <WishlistButton matchedProductId={product.id} wishlistItemId={item.id} />
                  </StopPropagation>
                </ClickableRow>
              );
            })}
          </div>
        )}
      </section>

      <section>
        <div className="mb-4 flex items-center justify-between">
          <h2 className="font-display text-xl font-bold">Scans récents</h2>
          <Link
            href="/dashboard/historique"
            className="text-sm text-muted-foreground hover:text-foreground"
          >
            Voir tout →
          </Link>
        </div>
        {recentScans.length === 0 ? (
          <p className="text-sm text-muted-foreground">Aucun scan pour l&rsquo;instant.</p>
        ) : (
          <div className="flex flex-col gap-3">
            {recentScans.map((scan) => (
              <ClickableRow
                key={scan.id}
                href={`/dashboard/scans/${scan.id}`}
                className="flex items-center gap-4 rounded-xl border border-border bg-card p-3"
              >
                {scan.imageUrl && (
                  <Image
                    src={scan.imageUrl}
                    alt=""
                    width={56}
                    height={56}
                    unoptimized
                    className="h-14 w-14 shrink-0 rounded-md border border-border object-cover"
                  />
                )}
                <div className="min-w-0 flex-1">
                  <p className="truncate text-sm font-medium">
                    {[scan.brand, scan.category].filter(Boolean).join(" ") ||
                      "Article identifié"}
                  </p>
                  <p className="truncate text-xs text-muted-foreground">{scan.description}</p>
                </div>
              </ClickableRow>
            ))}
          </div>
        )}
      </section>

      <BillingSection plan={user.plan} scansThisMonth={scansThisMonth} />
    </div>
  );
}
