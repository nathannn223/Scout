export const metadata = { title: "Politique de confidentialité — Scout" };

export default function ConfidentialitePage() {
  return (
    <main className="mx-auto max-w-2xl px-6 py-16">
      <h1 className="mb-2 font-display text-2xl font-bold">Politique de confidentialité</h1>
      <p className="mb-10 text-sm text-muted-foreground">
        Dernière mise à jour : à compléter à la mise en ligne.
      </p>

      <div className="mb-10 rounded-lg border border-border bg-card p-4 text-sm text-muted-foreground">
        Brouillon de travail — à faire relire par un professionnel avant mise en ligne réelle,
        notamment pour la conformité RGPD complète et les mentions d&rsquo;identification de
        l&rsquo;éditeur (SIRET, adresse) une fois le statut auto-entrepreneur créé.
      </div>

      <div className="flex flex-col gap-8 text-sm leading-relaxed text-muted-foreground">
        <section>
          <h2 className="mb-2 font-display text-lg font-bold text-foreground">Éditeur</h2>
          <p>
            Scout est édité par [Nom / raison sociale à compléter], [adresse à compléter],
            [SIRET à compléter]. Contact : [email de contact à compléter].
          </p>
        </section>

        <section>
          <h2 className="mb-2 font-display text-lg font-bold text-foreground">
            Données collectées
          </h2>
          <ul className="list-inside list-disc space-y-1">
            <li>Adresse email et informations de compte (gérées par Clerk).</li>
            <li>
              Images que tu déposes ou dont tu colles le lien pour identification — hébergées
              temporairement pour permettre l&rsquo;analyse.
            </li>
            <li>Historique de tes scans, articles sauvegardés et prix cibles définis.</li>
            <li>
              Informations de paiement lors d&rsquo;un abonnement — gérées directement par Stripe,
              Scout n&rsquo;a jamais accès à ton numéro de carte.
            </li>
          </ul>
        </section>

        <section>
          <h2 className="mb-2 font-display text-lg font-bold text-foreground">
            Sous-traitants et services tiers
          </h2>
          <p className="mb-2">
            Certaines données transitent par des prestataires tiers, nécessaires au
            fonctionnement du service :
          </p>
          <ul className="list-inside list-disc space-y-1">
            <li>Clerk — authentification et gestion de compte.</li>
            <li>Stripe — paiement et facturation des abonnements.</li>
            <li>Anthropic (Claude) — analyse des images pour l&rsquo;identification.</li>
            <li>SerpApi — recherche des produits correspondants et de leurs prix.</li>
            <li>Vercel — hébergement du site et stockage temporaire des images (Vercel Blob).</li>
            <li>Resend — envoi des emails d&rsquo;alerte de prix.</li>
          </ul>
        </section>

        <section>
          <h2 className="mb-2 font-display text-lg font-bold text-foreground">
            Tes droits (RGPD)
          </h2>
          <p>
            Tu peux demander l&rsquo;accès, la rectification ou la suppression de tes données à
            tout moment en nous contactant à [email de contact à compléter]. La suppression de
            ton compte entraîne la suppression de ton historique de scans et de ta wishlist.
          </p>
        </section>

        <section>
          <h2 className="mb-2 font-display text-lg font-bold text-foreground">Cookies</h2>
          <p>
            Scout utilise un cookie de session (géré par Clerk) nécessaire à la connexion à ton
            compte. Aucun cookie publicitaire ou de tracking tiers n&rsquo;est utilisé
            aujourd&rsquo;hui.
          </p>
        </section>
      </div>
    </main>
  );
}
