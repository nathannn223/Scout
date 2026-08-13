"use client";

import { useRouter } from "next/navigation";

/**
 * Makes a whole row navigate on click, for use inside server-rendered pages
 * (dashboard home) without converting the whole page to a client component.
 * Interactive elements nested inside (links, buttons) should call
 * `e.stopPropagation()` on their own onClick so they don't also trigger this
 * row's navigation — same pattern already used in match-list.tsx.
 */
export function ClickableRow({
  href,
  children,
  className,
}: {
  href: string;
  children: React.ReactNode;
  className?: string;
}) {
  const router = useRouter();

  return (
    <div
      role="button"
      tabIndex={0}
      onClick={() => router.push(href)}
      onKeyDown={(e) => {
        if (e.key === "Enter" || e.key === " ") router.push(href);
      }}
      className={`cursor-pointer ${className ?? ""}`}
    >
      {children}
    </div>
  );
}
