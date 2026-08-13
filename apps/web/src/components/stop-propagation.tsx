"use client";

/**
 * Wraps children to stop click events from bubbling up to an ancestor's
 * onClick (e.g. ClickableRow) — exists as its own Client Component because
 * a Server Component (dashboard/page.tsx) can't attach event handlers
 * directly to the JSX elements it authors, even ones nested inside a
 * Client Component's children.
 */
export function StopPropagation({ children }: { children: React.ReactNode }) {
  return <div onClick={(e) => e.stopPropagation()}>{children}</div>;
}
