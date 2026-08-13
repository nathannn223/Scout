"use client";

import { useState } from "react";
import { TryWidget } from "@/components/try-widget";

export function Hero() {
  const [hasResult, setHasResult] = useState(false);

  return (
    <div className="relative z-10 flex w-full flex-col items-center">
      <h1
        className={`text-balance font-display font-bold leading-[1.04] tracking-tight transition-all duration-500 ${
          hasResult
            ? "max-w-xl text-3xl sm:text-4xl"
            : "max-w-3xl text-[62px] sm:text-[78px]"
        }`}
      >
        Achète au meilleur prix ce que tu vois sur internet.
      </h1>
      <p
        className={`text-balance leading-relaxed text-muted-foreground transition-all duration-500 ${
          hasResult ? "mt-2 max-w-md text-sm" : "mt-6 max-w-lg text-[21px]"
        }`}
      >
        Identifie n&rsquo;importe quel vêtement ou sneakers que tu vois et achète-le au
        meilleur prix.
      </p>

      <div className="mt-9 w-full">
        <TryWidget onResultChange={setHasResult} />
      </div>
    </div>
  );
}
