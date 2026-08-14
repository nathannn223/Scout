"use client";

import { useState } from "react";
import { useTranslations } from "next-intl";
import { TryWidget } from "@/components/try-widget";

export function Hero() {
  const t = useTranslations("Hero");
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
        {t("headline")}
      </h1>
      {!hasResult && (
        <p className="mt-6 max-w-lg text-balance text-[21px] leading-relaxed text-muted-foreground">
          {t("subhead")}
        </p>
      )}

      <div className="mt-9 w-full">
        <TryWidget onResultChange={setHasResult} />
      </div>
    </div>
  );
}
