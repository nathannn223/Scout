import { clerkMiddleware, createRouteMatcher } from "@clerk/nextjs/server";
import createMiddleware from "next-intl/middleware";
import { routing } from "./i18n/routing";

const handleI18nRouting = createMiddleware(routing);

// French is unprefixed (localePrefix: "as-needed"), so the protected route
// still needs to match a bare "/dashboard" alongside "/en/dashboard".
const isProtectedRoute = createRouteMatcher(["/dashboard(.*)", "/:locale/dashboard(.*)"]);

export default clerkMiddleware(async (auth, req) => {
  if (isProtectedRoute(req)) {
    await auth.protect();
  }
  // Locale routing only applies to actual pages — API responses must never
  // get redirected to /en/api/... or /fr/api/....
  if (!req.nextUrl.pathname.startsWith("/api")) {
    return handleI18nRouting(req);
  }
});

export const config = {
  matcher: [
    "/((?!_next|[^?]*\\.(?:html?|css|js(?!on)|jpe?g|webp|png|gif|svg|ttf|woff2?|ico|csv|docx?|xlsx?|zip|webmanifest)).*)",
    "/(api|trpc)(.*)",
  ],
};
