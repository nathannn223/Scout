import { NextResponse } from "next/server";
import { db } from "@/lib/db";
import { requireUser } from "@/lib/auth";
import type { MatchedProductDTO, ScanResponse } from "@scout/shared";

export async function GET() {
  const user = await requireUser();
  if (!user) {
    return NextResponse.json({ error: "Authentication required." }, { status: 401 });
  }

  const scans = await db.scannedItem.findMany({
    where: { userId: user.id },
    orderBy: { createdAt: "desc" },
    include: { matches: true },
  });

  const body: { scans: ScanResponse[] } = {
    scans: scans.map((scan) => ({
      scan: {
        id: scan.id,
        imageUrl: scan.imageUrl,
        sourceUrl: scan.sourceUrl,
        createdAt: scan.createdAt.toISOString(),
        category: scan.category,
        brand: scan.brand,
        description: scan.description,
      },
      matches: scan.matches.map(
        (m): MatchedProductDTO => ({
          id: m.id,
          merchantName: m.merchantName,
          title: m.title,
          price: Number(m.price),
          currency: m.currency,
          url: m.url,
          imageUrl: m.imageUrl,
          inStock: m.inStock,
          source: m.source,
        })
      ),
      locked: user.plan === "FREE",
    })),
  };

  return NextResponse.json(body, { status: 200 });
}
