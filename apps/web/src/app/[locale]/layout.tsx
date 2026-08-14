import type { Metadata } from "next";
import localFont from "next/font/local";
import { NextIntlClientProvider, hasLocale } from "next-intl";
import { getTranslations, setRequestLocale } from "next-intl/server";
import { notFound } from "next/navigation";
import { ClerkProvider } from "@clerk/nextjs";
import { clerkAppearance } from "@/lib/clerk-appearance";
import { routing } from "@/i18n/routing";
import "../globals.css";

// Self-hosted — license files kept alongside the fonts in public/fonts/ per
// each license's redistribution terms.
// Manrope (Google Fonts, SIL OFL) — primary interface voice: headlines,
// nav, buttons, labels. Replaces an earlier choice, General Sans: its
// Fontshare license ("ITF Free Font License") turned out to exclude
// webfont/app embedding from the free grant — self-hosting it here the way
// we were would have required a separate paid "Special Font License". SIL
// OFL fonts (Google Fonts, Velvetyne) don't have that carve-out.
const manrope = localFont({
  src: "../../../public/fonts/Manrope-Variable.ttf",
  weight: "200 800",
  variable: "--font-sans",
  display: "swap",
});

// Director (Velvetyne / Degheest revival, SIL OFL) — a 1958 typewriter
// face, used as the secondary "reading" voice for longer descriptive text,
// distinct from Manrope's UI/interface register.
const director = localFont({
  src: [
    { path: "../../../public/fonts/Director-Regular.woff2", weight: "400" },
    { path: "../../../public/fonts/Director-Bold.woff2", weight: "700" },
  ],
  variable: "--font-serif",
  display: "swap",
});

const APP_URL = process.env.NEXT_PUBLIC_APP_URL ?? "http://localhost:3000";

export function generateStaticParams() {
  return routing.locales.map((locale) => ({ locale }));
}

export async function generateMetadata({
  params,
}: {
  params: Promise<{ locale: string }>;
}): Promise<Metadata> {
  const { locale } = await params;
  const t = await getTranslations({ locale, namespace: "Metadata" });
  const title = t("title");
  const description = t("description");

  return {
    metadataBase: new URL(APP_URL),
    title,
    description,
    openGraph: {
      title,
      description,
      url: APP_URL,
      siteName: "Scout",
      locale: locale === "fr" ? "fr_FR" : "en_US",
      type: "website",
    },
    twitter: {
      card: "summary",
      title,
      description,
    },
  };
}

export default async function RootLayout({
  children,
  params,
}: {
  children: React.ReactNode;
  params: Promise<{ locale: string }>;
}) {
  const { locale } = await params;
  if (!hasLocale(routing.locales, locale)) {
    notFound();
  }
  setRequestLocale(locale);

  // Clerk needs real paths, not next-intl's <Link> — precompute them for the
  // current locale (French unprefixed, English under /en, matching
  // localePrefix: "as-needed").
  const prefix = locale === routing.defaultLocale ? "" : `/${locale}`;

  return (
    <ClerkProvider
      signInUrl={`${prefix}/sign-in`}
      signUpUrl={`${prefix}/sign-up`}
      appearance={clerkAppearance}
    >
      <html lang={locale} suppressHydrationWarning>
        <body className={`${manrope.variable} ${director.variable} font-sans antialiased`}>
          <NextIntlClientProvider>{children}</NextIntlClientProvider>
        </body>
      </html>
    </ClerkProvider>
  );
}
