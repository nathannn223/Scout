"use client";

import { useLocale, useTranslations } from "next-intl";
import { useUser, UserButton } from "@clerk/nextjs";
import { Link } from "@/i18n/navigation";
import { Button } from "@/components/ui/button";
import { routing } from "@/i18n/routing";

export function AuthNavLink() {
  const t = useTranslations("Nav");
  const locale = useLocale();
  const homeHref = locale === routing.defaultLocale ? "/" : `/${locale}`;
  const { isSignedIn, isLoaded } = useUser();

  if (!isLoaded) return null;

  if (isSignedIn) {
    return (
      <div className="flex items-center gap-3">
        <Button variant="secondary" size="sm" asChild>
          <Link href="/dashboard">{t("dashboard")}</Link>
        </Button>
        {/* Dropdown includes sign-out — lets you test the signed-out
            landing page flow without leaving the page. */}
        <UserButton afterSignOutUrl={homeHref} />
      </div>
    );
  }

  return (
    <Button variant="secondary" size="sm" asChild>
      <Link href="/sign-in">{t("signIn")}</Link>
    </Button>
  );
}
