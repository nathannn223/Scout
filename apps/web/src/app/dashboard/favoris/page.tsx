import Image from "next/image";
import { db } from "@/lib/db";
import { requireUser } from "@/lib/auth";
import { WishlistButton } from "../wishlist-button";
import { TargetPriceInput } from "../target-price-input";

export default async function FavorisPage() {
  const user = await requireUser();
  if (!user) {
    return (
      <p className="text-center text-muted-foreground">
        Impossible de charger ton compte. Réessaie de te reconnecter.
      </p>
    );
  }

  const wishlistItems = await db.wishlistItem.findMany({
    where: { userId: user.id },
    orderBy: { createdAt: "desc" },
  });
  const products = await db.matchedProduct.findMany({
    where: { id: { in: wishlistItems.map((i) => i.matchedProductId) } },
  });
  const productsById = new Map(products.map((p) => [p.id, p]));

  return (
    <div>
      {wishlistItems.length === 0 ? (
        <p className="text-sm text-muted-foreground">
          Rien de sauvegardé — clique sur le cœur d&rsquo;un produit trouvé pour le garder ici.
        </p>
      ) : (
        <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
          {wishlistItems.map((item) => {
            const product = productsById.get(item.matchedProductId);
            if (!product) return null;
            return (
              <div key={item.id} className="rounded-xl border border-border bg-card p-3">
                <div className="flex items-center gap-3">
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
                    <a
                      href={product.url}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="block truncate text-sm font-medium hover:underline"
                    >
                      {product.title}
                    </a>
                    <p className="text-xs text-muted-foreground">
                      {product.merchantName} · {Number(product.price).toFixed(2)}{" "}
                      {product.currency}
                    </p>
                  </div>
                  <WishlistButton matchedProductId={product.id} wishlistItemId={item.id} />
                </div>
                <div className="mt-2 pl-[52px]">
                  <TargetPriceInput
                    wishlistItemId={item.id}
                    targetPrice={item.targetPrice ? Number(item.targetPrice) : null}
                    currency={product.currency}
                  />
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
