export const metadata = { title: "Conditions générales d'utilisation — Scout" };

export default function CGUPage() {
  return (
    <main className="mx-auto max-w-2xl px-6 py-16">
      <h1 className="mb-2 font-display text-2xl font-bold">
        Conditions générales d&rsquo;utilisation
      </h1>
      <p className="mb-10 text-sm text-muted-foreground">
        Dernière mise à jour : à compléter à la mise en ligne.
      </p>

      <div className="mb-10 rounded-lg border border-border bg-card p-4 text-sm text-muted-foreground">
        Brouillon de travail — à faire relire par un professionnel avant mise en ligne réelle,
        notamment pour les mentions d&rsquo;identification de l&rsquo;éditeur (SIRET, adresse)
        une fois le statut auto-entrepreneur créé.
      </div>

      <div className="flex flex-col gap-8 text-sm leading-relaxed text-muted-foreground">
        <section>
          <h2 className="mb-2 font-display text-lg font-bold text-foreground">Le service</h2>
          <p>
            Scout identifie un vêtement ou une sneaker à partir d&rsquo;une image et retrouve des
            produits correspondants chez différents marchands, avec leurs prix. Scout ne vend
            aucun produit directement — chaque achat se fait sur le site du marchand concerné,
            en dehors de Scout.
          </p>
        </section>

        <section>
          <h2 className="mb-2 font-display text-lg font-bold text-foreground">
            Exactitude des informations
          </h2>
          <p>
            Les prix, disponibilités et correspondances de produits proviennent de services
            tiers (recherche visuelle et recherche de produits) et sont fournis à titre
            indicatif. Scout ne garantit pas leur exactitude ni leur disponibilité au moment de
            l&rsquo;achat sur le site du marchand.
          </p>
        </section>

        <section>
          <h2 className="mb-2 font-display text-lg font-bold text-foreground">Abonnements</h2>
          <ul className="list-inside list-disc space-y-1">
            <li>Le palier gratuit permet un nombre limité de scans, sans engagement.</li>
            <li>
              Les paliers payants (Découverte, Essentiel, Pro) sont facturés mensuellement via
              Stripe et résiliables à tout moment depuis l&rsquo;espace de gestion
              d&rsquo;abonnement, sans préavis ni frais de résiliation.
            </li>
            <li>
              La résiliation prend effet à la fin de la période déjà payée — aucun remboursement
              au prorata pour le mois en cours.
            </li>
          </ul>
        </section>

        <section>
          <h2 className="mb-2 font-display text-lg font-bold text-foreground">
            Usage autorisé
          </h2>
          <p>
            Le service est destiné à un usage personnel d&rsquo;identification et de comparaison
            de prix. Toute utilisation automatisée abusive, tentative de contournement des
            limites de compte, ou dépôt de contenu illicite est interdite et peut entraîner la
            suspension du compte.
          </p>
        </section>

        <section>
          <h2 className="mb-2 font-display text-lg font-bold text-foreground">
            Responsabilité
          </h2>
          <p>
            Scout est fourni "en l&rsquo;état". Nous mettons tout en œuvre pour la fiabilité du
            service mais ne pouvons garantir une disponibilité continue ni l&rsquo;absence
            d&rsquo;erreur d&rsquo;identification.
          </p>
        </section>

        <section>
          <h2 className="mb-2 font-display text-lg font-bold text-foreground">
            Droit applicable
          </h2>
          <p>Les présentes conditions sont soumises au droit français.</p>
        </section>
      </div>
    </main>
  );
}
