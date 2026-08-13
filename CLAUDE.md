# Scout — extension + SaaS d'identification mode/sneakers par image

> Ce fichier couvre uniquement ce qu'il faut pour *construire* le MVP. Pour la validation, le lancement, les métriques et la roadmap post-MVP, voir `docs/PLAN.md`.

## Produit
Extension de navigateur + dashboard web qui identifie un vêtement/une sneaker à partir d'une image (clic droit sur Instagram, Pinterest, un site marchand, ou upload manuel) et retrouve où l'acheter moins cher, dans la bonne taille — pour des passionnés mode/sneakers qui ne sont pas des initiés du milieu (pas de jargon, pas de posture "insider").

Boucle de valeur : **Image → Identification → Résultats + suivi (prix/stock)**.

## Stack définitif (ne pas dévier sans raison)
- `apps/web` — Next.js 14 (App Router, TypeScript), déployé sur Vercel. Dashboard + routes API.
- `apps/extension` — Chrome Manifest V3, TypeScript, sans framework.
- `packages/shared` — types & constantes partagés entre web et extension.
- Base de données — Postgres + Prisma ORM.
- Auth — Clerk.
- Paiement — Stripe Billing (Checkout + Customer Portal).
- Identification image — API Claude (vision).
- Catalogue produits — SerpApi (Google Shopping) au démarrage. **Awin viendra seulement en Phase 4, une fois du trafic réel** — ne rien construire qui dépende d'Awin pour le MVP.
- Emails — Resend.
- Tâche planifiée — Vercel Cron (revérification quotidienne des prix wishlist).

## Modèle de données (Prisma)
```prisma
model User {
  id               String   @id @default(cuid())
  email            String   @unique
  plan             Plan     @default(FREE)
  stripeCustomerId String?
  createdAt        DateTime @default(now())
  scans            ScannedItem[]
  wishlist         WishlistItem[]
}

model ScannedItem {
  id          String   @id @default(cuid())
  userId      String
  sourceUrl   String?
  imageUrl    String
  category    String?
  brand       String?
  description String?
  createdAt   DateTime @default(now())
  user        User             @relation(fields: [userId], references: [id])
  matches     MatchedProduct[]
}

model MatchedProduct {
  id            String   @id @default(cuid())
  scannedItemId String
  merchantName  String
  title         String
  price         Decimal
  currency      String
  url           String
  imageUrl      String
  inStock       Boolean  @default(true)
  source        Source   @default(GOOGLE_SHOPPING)
  fetchedAt     DateTime @default(now())
  scannedItem   ScannedItem @relation(fields: [scannedItemId], references: [id])
}

model WishlistItem {
  id               String    @id @default(cuid())
  userId           String
  matchedProductId String
  lastKnownPrice   Decimal
  targetPrice      Decimal?
  alertSentAt      DateTime?
  createdAt        DateTime  @default(now())
  user             User      @relation(fields: [userId], references: [id])
}

enum Plan {
  FREE
  DECOUVERTE
  ESSENTIEL
  PRO
}
enum Source { GOOGLE_SHOPPING AWIN }
```

## Contrat API
| Méthode | Route | Rôle |
|---|---|---|
| POST | `/api/scan` | Reçoit une image, appelle Claude (identification) puis SerpApi (produits correspondants), retourne les résultats. |
| GET | `/api/wishlist` | Liste les articles sauvegardés de l'utilisateur. |
| POST | `/api/wishlist` | Sauvegarde un produit trouvé dans la wishlist. |
| DELETE | `/api/wishlist/:id` | Retire un article de la wishlist. |
| GET | `/api/scans` | Historique des scans de l'utilisateur. |
| POST | `/api/stripe/checkout` | Crée une session Stripe Checkout pour un palier donné. |
| POST | `/api/stripe/webhook` | Reçoit les événements d'abonnement Stripe. |
| GET | `/api/cron/price-check` | Tâche planifiée quotidienne : revérifie les prix wishlist, déclenche les emails d'alerte. |

## Monétisation
> Mis à jour suite à la réflexion pricing menée après le lancement — voir `PROGRESS.md` pour le raisonnement complet (métrique de valeur, ancrage entre paliers). Diffère de la version d'origine de ce document : un 4ᵉ palier (Découverte) a été ajouté, les limites de scans sont désormais différenciées par palier (pas juste "illimité" au-delà du gratuit), et le prix Pro a été relevé.

- **Gratuit** — 0€ : 1 scan/mois (web uniquement, l'extension est réservée aux paliers payants), pas de wishlist, pas d'alertes.
- **Découverte** — 4,99€/mois : 9 scans/mois, extension Chrome incluse, wishlist jusqu'à 5 articles, **pas d'alertes de prix** (différenciateur volontaire vers Essentiel).
- **Essentiel** — 8,99€/mois : 25 scans/mois, wishlist jusqu'à 15 articles, jusqu'à 5 alertes de prix actives (vérification quotidienne via cron).
- **Pro** — 15,99€/mois : scans illimités, wishlist illimitée, alertes illimitées avec **vérification immédiate** dès la définition d'un prix cible (pas d'attente du cycle quotidien).
- Commission d'affiliation (Awin, à partir de la Phase 4) sur tous les paliers, en complément.

## Ordre de construction (Phase 3 du plan — ne pas paralléliser)
1. Backend : endpoint `/api/scan` (image → identification via Claude). **Terminé quand** : testé sur Postman, identification cohérente sur 10 images tests.
2. Backend : connecter SerpApi, faire correspondre l'identification à des produits réels + prix. **Terminé quand** : 3 à 6 produits réels retournés pour les mêmes 10 images.
3. Extension : capture d'image (clic droit) → appel API → popup de résultats. **Terminé quand** : clic droit sur une image dans Chrome affiche les résultats.
4. Dashboard web : auth (Clerk), page "mes scans", wishlist. **Terminé quand** : un utilisateur se connecte, voit son historique, sauvegarde un résultat.
5. Système d'alerte : cron de revérification de prix + email Resend. **Terminé quand** : un changement de prix simulé déclenche un email réel.
6. Paywall : Stripe Checkout, limite des scans gratuits. **Terminé quand** : le 6ᵉ scan gratuit du mois est bloqué avec écran d'upgrade.
7. Onboarding : 3 écrans à l'installation de l'extension. **Terminé quand** : une installation propre les affiche avant le premier scan.

## Hors scope MVP — ne pas construire maintenant
Score anti-contrefaçon, recommandation de taille cross-marques, alternatives moins chères ("dupes"), app mobile native, notifications push, intégration Awin.

## Squelette manifest.json (extension)
```json
{
  "manifest_version": 3,
  "name": "Scout",
  "version": "0.1.0",
  "permissions": ["contextMenus", "activeTab", "storage"],
  "host_permissions": ["https://scout.app/*"],
  "background": { "service_worker": "background.js" },
  "action": { "default_popup": "popup.html" },
  "icons": { "128": "icon-128.png" }
}
```

## Variables d'environnement attendues
`DATABASE_URL`, `ANTHROPIC_API_KEY`, `SERPAPI_KEY`, `BLOB_READ_WRITE_TOKEN`, `CLERK_SECRET_KEY`, `NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY`, `STRIPE_SECRET_KEY`, `STRIPE_WEBHOOK_SECRET`, `STRIPE_PRICE_DECOUVERTE`, `STRIPE_PRICE_ESSENTIEL`, `STRIPE_PRICE_PRO`, `RESEND_API_KEY`, `CRON_SECRET`, `NEXT_PUBLIC_APP_URL`.

> Piège vécu pendant le build : la clé publique Clerk **doit** s'appeler `NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY` (préfixe `NEXT_PUBLIC_` obligatoire, lu en dur par le SDK Clerk) — `CLERK_PUBLISHABLE_KEY` sans préfixe échoue silencieusement (mode "keyless", aucune vérification de session). Voir `PROGRESS.md` pour le détail complet.

## Nom
Nom de travail : **Scout** — vérifier disponibilité domaine/marque/Chrome Web Store avant de le figer définitivement.
