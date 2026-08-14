import { getTranslations } from "next-intl/server";

export async function generateMetadata() {
  const t = await getTranslations("Legal.cgu");
  return { title: t("metaTitle") };
}

export default async function CGUPage() {
  const t = await getTranslations("Legal.cgu");
  const tLegal = await getTranslations("Legal");

  return (
    <main className="mx-auto max-w-2xl px-6 py-16">
      <h1 className="mb-2 font-display text-2xl font-bold">{t("title")}</h1>
      <p className="mb-10 text-sm text-muted-foreground">{tLegal("lastUpdated")}</p>

      <div className="mb-10 rounded-lg border border-border bg-card p-4 text-sm text-muted-foreground">
        {tLegal("draftNotice")}
      </div>

      <div className="flex flex-col gap-8 text-sm leading-relaxed text-muted-foreground">
        <section>
          <h2 className="mb-2 font-display text-lg font-bold text-foreground">
            {t("service.heading")}
          </h2>
          <p>{t("service.body")}</p>
        </section>

        <section>
          <h2 className="mb-2 font-display text-lg font-bold text-foreground">
            {t("accuracy.heading")}
          </h2>
          <p>{t("accuracy.body")}</p>
        </section>

        <section>
          <h2 className="mb-2 font-display text-lg font-bold text-foreground">
            {t("subscriptions.heading")}
          </h2>
          <ul className="list-inside list-disc space-y-1">
            <li>{t("subscriptions.item1")}</li>
            <li>{t("subscriptions.item2")}</li>
            <li>{t("subscriptions.item3")}</li>
          </ul>
        </section>

        <section>
          <h2 className="mb-2 font-display text-lg font-bold text-foreground">
            {t("usage.heading")}
          </h2>
          <p>{t("usage.body")}</p>
        </section>

        <section>
          <h2 className="mb-2 font-display text-lg font-bold text-foreground">
            {t("liability.heading")}
          </h2>
          <p>{t("liability.body")}</p>
        </section>

        <section>
          <h2 className="mb-2 font-display text-lg font-bold text-foreground">
            {t("law.heading")}
          </h2>
          <p>{t("law.body")}</p>
        </section>
      </div>
    </main>
  );
}
