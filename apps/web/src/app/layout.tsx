import type { Metadata } from "next";
import localFont from "next/font/local";
import { ClerkProvider } from "@clerk/nextjs";
import { clerkAppearance } from "@/lib/clerk-appearance";
import "./globals.css";

// Self-hosted — license files kept alongside the fonts in public/fonts/ per
// each license's redistribution terms.
// Manrope (Google Fonts, SIL OFL) — primary interface voice: headlines,
// nav, buttons, labels. Replaces an earlier choice, General Sans: its
// Fontshare license ("ITF Free Font License") turned out to exclude
// webfont/app embedding from the free grant — self-hosting it here the way
// we were would have required a separate paid "Special Font License". SIL
// OFL fonts (Google Fonts, Velvetyne) don't have that carve-out.
const manrope = localFont({
  src: "../../public/fonts/Manrope-Variable.ttf",
  weight: "200 800",
  variable: "--font-sans",
  display: "swap",
});

// Director (Velvetyne / Degheest revival, SIL OFL) — a 1958 typewriter
// face, used as the secondary "reading" voice for longer descriptive text,
// distinct from Manrope's UI/interface register.
const director = localFont({
  src: [
    { path: "../../public/fonts/Director-Regular.woff2", weight: "400" },
    { path: "../../public/fonts/Director-Bold.woff2", weight: "700" },
  ],
  variable: "--font-serif",
  display: "swap",
});

const TITLE = "Scout — Identifie une pièce, trouve où l'acheter moins cher";
const DESCRIPTION =
  "Extension de navigateur et dashboard qui identifient un vêtement ou une sneaker à partir d'une image et retrouvent où l'acheter moins cher, dans la bonne taille.";
const APP_URL = process.env.NEXT_PUBLIC_APP_URL ?? "http://localhost:3000";

export const metadata: Metadata = {
  metadataBase: new URL(APP_URL),
  title: TITLE,
  description: DESCRIPTION,
  openGraph: {
    title: TITLE,
    description: DESCRIPTION,
    url: APP_URL,
    siteName: "Scout",
    locale: "fr_FR",
    type: "website",
  },
  twitter: {
    card: "summary",
    title: TITLE,
    description: DESCRIPTION,
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <ClerkProvider signInUrl="/sign-in" signUpUrl="/sign-up" appearance={clerkAppearance}>
      <html lang="fr" suppressHydrationWarning>
        <body className={`${manrope.variable} ${director.variable} font-sans antialiased`}>
          {children}
        </body>
      </html>
    </ClerkProvider>
  );
}
