import Image from "next/image";
import { MatchList } from "@/components/match-list";
import type { Plan } from "@prisma/client";

interface ScanCardMatch {
  id: string;
  merchantName: string;
  title: string;
  price: number;
  currency: string;
  url: string;
  imageUrl: string | null;
  wishlistItemId: string | null;
}

export function ScanCard({
  imageUrl,
  brand,
  category,
  description,
  matches,
  locked,
  currentPlan,
}: {
  imageUrl: string | null;
  brand: string | null;
  category: string | null;
  description: string | null;
  matches: ScanCardMatch[];
  locked: boolean;
  currentPlan?: Plan;
}) {
  return (
    <div className="rounded-xl border border-border bg-card p-4">
      <div className="mb-4 flex items-start gap-4">
        {imageUrl && (
          <Image
            src={imageUrl}
            alt=""
            width={72}
            height={72}
            unoptimized
            className="h-18 w-18 shrink-0 rounded-md border border-border object-cover"
          />
        )}
        <div>
          <p className="font-semibold">
            {[brand, category].filter(Boolean).join(" ") || "Article identifié"}
          </p>
          {description && <p className="mt-1 text-sm text-muted-foreground">{description}</p>}
        </div>
      </div>
      {matches.length > 0 && (
        <MatchList matches={matches} locked={locked} currentPlan={currentPlan} />
      )}
    </div>
  );
}
