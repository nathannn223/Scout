import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
import { requireUser } from "@/lib/auth";
import { WISHLIST_LIMIT, type PaidPlan } from "@/lib/stripe";
import type { MatchedProductDTO } from "@scout/shared";

export interface WishlistItemDTO {
  id: string;
  matchedProductId: string;
  lastKnownPrice: number;
  targetPrice: number | null;
  createdAt: string;
  product: MatchedProductDTO | null;
}

export async function GET() {
  const user = await requireUser();
  if (!user) {
    return NextResponse.json({ error: "Authentication required." }, { status: 401 });
  }

  const items = await db.wishlistItem.findMany({
    where: { userId: user.id },
    orderBy: { createdAt: "desc" },
  });

  const products = await db.matchedProduct.findMany({
    where: { id: { in: items.map((i) => i.matchedProductId) } },
  });
  const productsById = new Map(products.map((p) => [p.id, p]));

  const wishlist: WishlistItemDTO[] = items.map((item) => {
    const product = productsById.get(item.matchedProductId);
    return {
      id: item.id,
      matchedProductId: item.matchedProductId,
      lastKnownPrice: Number(item.lastKnownPrice),
      targetPrice: item.targetPrice ? Number(item.targetPrice) : null,
      createdAt: item.createdAt.toISOString(),
      product: product
        ? {
            id: product.id,
            merchantName: product.merchantName,
            title: product.title,
            price: Number(product.price),
            currency: product.currency,
            url: product.url,
            imageUrl: product.imageUrl,
            inStock: product.inStock,
            source: product.source,
          }
        : null,
    };
  });

  return NextResponse.json({ wishlist }, { status: 200 });
}

export async function POST(request: NextRequest) {
  const user = await requireUser();
  if (!user) {
    return NextResponse.json({ error: "Authentication required." }, { status: 401 });
  }
  if (user.plan === "FREE") {
    return NextResponse.json(
      { error: "La wishlist est réservée aux abonnés.", code: "UPGRADE_REQUIRED" },
      { status: 402 }
    );
  }

  const limit = WISHLIST_LIMIT[user.plan as PaidPlan];
  if (limit !== null) {
    const count = await db.wishlistItem.count({ where: { userId: user.id } });
    if (count >= limit) {
      return NextResponse.json(
        {
          error: `Ta wishlist est limitée à ${limit} articles sur ce palier.`,
          code: "UPGRADE_REQUIRED",
        },
        { status: 402 }
      );
    }
  }

  let body: { matchedProductId?: unknown };
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: "Expected a JSON body." }, { status: 400 });
  }

  if (typeof body.matchedProductId !== "string" || body.matchedProductId.length === 0) {
    return NextResponse.json({ error: "'matchedProductId' is required." }, { status: 400 });
  }

  const product = await db.matchedProduct.findUnique({
    where: { id: body.matchedProductId },
  });
  if (!product) {
    return NextResponse.json({ error: "Product not found." }, { status: 404 });
  }

  const item = await db.wishlistItem.create({
    data: {
      userId: user.id,
      matchedProductId: product.id,
      lastKnownPrice: product.price,
    },
  });

  const dto: WishlistItemDTO = {
    id: item.id,
    matchedProductId: item.matchedProductId,
    lastKnownPrice: Number(item.lastKnownPrice),
    targetPrice: item.targetPrice ? Number(item.targetPrice) : null,
    createdAt: item.createdAt.toISOString(),
    product: {
      id: product.id,
      merchantName: product.merchantName,
      title: product.title,
      price: Number(product.price),
      currency: product.currency,
      url: product.url,
      imageUrl: product.imageUrl,
      inStock: product.inStock,
      source: product.source,
    },
  };

  return NextResponse.json(dto, { status: 201 });
}
