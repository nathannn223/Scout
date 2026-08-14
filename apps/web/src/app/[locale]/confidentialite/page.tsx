import { getTranslations } from "next-intl/server";

export async function generateMetadata() {
  const t = await getTranslations("Legal.confidentialite");
  return { title: t("metaTitle") };
}

export default async function ConfidentialitePage() {
  const t = await getTranslations("Legal.confidentialite");
  const tLegal = await getTranslations("Legal");

  return (
    <main className="mx-auto max-w-2xl px-6 py-16">
      <h1 className="mb-2 font-display text-2xl font-bold">{t("title")}</h1>
      <p className="mb-10 text-sm text-muted-foreground">{tLegal("lastUpdated")}</p>

      <div className="mb-10 rounded-lg border border-border bg-card p-4 text-sm text-muted-foreground">
        {t("draftNoticeExtra")}
      </div>

      <div className="flex flex-col gap-8 text-sm leading-relaxed text-muted-foreground">
        <section>
          <h2 className="mb-2 font-display text-lg font-bold text-foreground">
            {t("publisher.heading")}
          </h2>
          <p>{t("publisher.body")}</p>
        </section>

        <section>
          <h2 className="mb-2 font-display text-lg font-bold text-foreground">
            {t("dataCollected.heading")}
          </h2>
          <ul className="list-inside list-disc space-y-1">
            <li>{t("dataCollected.item1")}</li>
            <li>{t("dataCollected.item2")}</li>
            <li>{t("dataCollected.item3")}</li>
            <li>{t("dataCollected.item4")}</li>
          </ul>
        </section>

        <section>
          <h2 className="mb-2 font-display text-lg font-bold text-foreground">
            {t("subprocessors.heading")}
          </h2>
          <p className="mb-2">{t("subprocessors.intro")}</p>
          <ul className="list-inside list-disc space-y-1">
            <li>{t("subprocessors.item1")}</li>
            <li>{t("subprocessors.item2")}</li>
            <li>{t("subprocessors.item3")}</li>
            <li>{t("subprocessors.item4")}</li>
            <li>{t("subprocessors.item5")}</li>
            <li>{t("subprocessors.item6")}</li>
          </ul>
        </section>

        <section>
          <h2 className="mb-2 font-display text-lg font-bold text-foreground">
            {t("rights.heading")}
          </h2>
          <p>{t("rights.body")}</p>
        </section>

        <section>
          <h2 className="mb-2 font-display text-lg font-bold text-foreground">
            {t("cookies.heading")}
          </h2>
          <p>{t("cookies.body")}</p>
        </section>
      </div>
    </main>
  );
}
