import Image from "next/image";
import { getLocale, getTranslations } from "next-intl/server";
import { db } from "@/lib/db";
import { requireUser } from "@/lib/auth";
import { WishlistButton } from "../wishlist-button";
import { TargetPriceInput } from "../target-price-input";
import { ClickableRow } from "@/components/clickable-row";
import { StopPropagation } from "@/components/stop-propagation";

export default async function AlertesPage() {
  const locale = await getLocale();
  const user = await requireUser(locale);
  const t = await getTranslations("Dashboard.alertes");
  const tCommon = await getTranslations("Common");
  if (!user) {
    return <p className="text-center text-muted-foreground">{tCommon("accountError")}</p>;
  }

  const items = await db.wishlistItem.findMany({
    where: { userId: user.id, targetPrice: { not: null } },
    orderBy: { createdAt: "desc" },
  });
  const products = await db.matchedProduct.findMany({
    where: { id: { in: items.map((i) => i.matchedProductId) } },
  });
  const productsById = new Map(products.map((p) => [p.id, p]));

  return (
    <div>
      {items.length === 0 ? (
        <p className="text-sm text-muted-foreground">{t("empty")}</p>
      ) : (
        <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
          {items.map((item) => {
            const product = productsById.get(item.matchedProductId);
            if (!product) return null;
            return (
              <ClickableRow
                key={item.id}
                href={`/dashboard/scans/${product.scannedItemId}?from=alertes`}
                className="rounded-xl border border-border bg-card p-3"
              >
                <div className="flex items-center gap-3">
                  {(item.imageUrl ?? product.imageUrl) && (
                    <Image
                      src={item.imageUrl ?? product.imageUrl}
                      alt=""
                      width={40}
                      height={40}
                      unoptimized
                      className="h-10 w-10 shrink-0 rounded bg-background object-contain"
                    />
                  )}
                  <div className="min-w-0 flex-1">
                    {item.imageUrl ? (
                      <p className="truncate text-sm font-medium">{product.title}</p>
                    ) : (
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
                    )}
                    <p className="text-xs text-muted-foreground">
                      {product.merchantName} · {Number(product.price).toFixed(2)}{" "}
                      {product.currency}
                    </p>
                  </div>
                  <StopPropagation>
                    <WishlistButton matchedProductId={product.id} wishlistItemId={item.id} />
                  </StopPropagation>
                </div>
                <StopPropagation>
                  <div className="mt-2 pl-[52px]">
                    <TargetPriceInput
                      wishlistItemId={item.id}
                      targetPrice={Number(item.targetPrice)}
                      expiresAt={item.expiresAt}
                      currency={product.currency}
                    />
                  </div>
                </StopPropagation>
              </ClickableRow>
            );
          })}
        </div>
      )}
    </div>
  );
}
