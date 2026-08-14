import { getTranslations, setRequestLocale } from "next-intl/server";
import { Link } from "@/i18n/navigation";
import { AuthNavLink } from "@/components/auth-nav-link";
import { ExtensionNavLink } from "@/components/extension-nav-link";
import { LocaleSwitcher } from "@/components/locale-switcher";
import { Hero } from "@/components/hero";
import { PaywallPrompt } from "@/components/paywall-prompt";

export default async function Home({
  params,
}: {
  params: Promise<{ locale: string }>;
}) {
  const { locale } = await params;
  setRequestLocale(locale);
  const t = await getTranslations("HowItWorks");
  const tPricing = await getTranslations("Pricing");
  const tFooter = await getTranslations("Footer");

  const FEATURES = [
    { key: "identification", title: t("identification.title"), body: t("identification.body") },
    { key: "wishlist", title: t("wishlist.title"), body: t("wishlist.body") },
    { key: "alerts", title: t("alerts.title"), body: t("alerts.body") },
  ];

  return (
    <main className="flex min-h-screen flex-col">
      <div className="bg-grain" aria-hidden />

      <header className="relative z-10 mx-auto flex w-full max-w-6xl items-center justify-between px-8 py-7">
        <span className="font-display text-lg font-bold">Scout</span>
        <div className="flex items-center gap-4">
          <LocaleSwitcher />
          <ExtensionNavLink />
          <AuthNavLink />
        </div>
      </header>

      <section className="relative mx-auto flex w-full max-w-6xl flex-1 flex-col items-center justify-center px-8 pb-14 pt-8 text-center">
        <div
          className="bg-glow left-[68%] top-[-130px] h-[500px] w-[680px] -translate-x-1/2 animate-drift-a"
          aria-hidden
        />
        <Hero />
      </section>

      <section className="relative z-10 mx-auto w-full max-w-6xl px-8 pb-24 pt-10">
        <h2 className="mb-8 text-balance font-display text-3xl font-bold sm:text-4xl">
          {t("heading")}
        </h2>
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
          {FEATURES.map((feature) => (
            <div key={feature.key} className="rounded-2xl border border-border bg-card p-5">
              <div className="mb-4 h-[140px] rounded-xl bg-background" />
              <h3 className="mb-1.5 font-semibold">{feature.title}</h3>
              <p className="text-sm leading-relaxed text-muted-foreground">{feature.body}</p>
            </div>
          ))}
        </div>
      </section>

      <section className="relative z-10 mx-auto w-full max-w-6xl px-8 pb-28">
        <p className="mb-3 text-xs font-bold uppercase tracking-wider text-muted-foreground">
          {tPricing("eyebrow")}
        </p>
        <h2 className="mb-8 text-balance font-display text-3xl font-bold sm:text-4xl">
          {tPricing("heading")}
        </h2>
        <PaywallPrompt bare />
      </section>

      <footer className="relative z-10 mx-auto w-full max-w-6xl px-8 py-8">
        <div className="flex flex-wrap items-center justify-between gap-4 border-t border-border pt-8 text-sm text-muted-foreground">
          <span>{tFooter("copyright", { year: new Date().getFullYear() })}</span>
          <div className="flex gap-6">
            <Link href="/confidentialite" className="hover:text-foreground">
              {tFooter("privacy")}
            </Link>
            <Link href="/cgu" className="hover:text-foreground">
              {tFooter("terms")}
            </Link>
          </div>
        </div>
      </footer>
    </main>
  );
}
