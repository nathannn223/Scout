# Scout — plan complet (business, lancement, roadmap)

> Référence complémentaire à `CLAUDE.md`. Ce fichier-ci ne sert pas à coder le MVP, mais à ne pas perdre le reste du plan (validation, lancement, monétisation, roadmap). À consulter, pas à charger dans chaque session de code.

## Concept
Extension de navigateur + dashboard SaaS qui identifie un vêtement/une sneaker à partir d'une image et retrouve où l'acheter moins cher, dans la bonne taille — pour des passionnés mode/sneakers non-initiés, sans jargon de "milieu".

Boucle : **Image → Identification → Résultats + suivi (prix/stock)**.

## Nom
Nom de travail : **Scout**. "CopIt" écarté (déjà pris par copit.to, un bot d'alertes streetwear). À vérifier avant de figer : disponibilité domaine, marque, nom sur le Chrome Web Store.

## Phase 0 — Valider avant de coder (1–2 semaines)
- Proposition de valeur en une phrase, testée à froid sur 5–10 personnes hors "milieu" mode.
- **Test concierge manuel** (gratuit, signal le plus fiable) : 10–15 personnes envoient une photo par DM, tu réponds à la main avec des liens. Ce qui compte : reviennent-elles sans relance ?
- Landing page + liste d'attente email (signal de demande).
- Étude concurrentielle : Google Lens, Pinterest Lens, ASOS Style Match, apps de legit-check — noter ce qui leur manque (suivi prix, alertes, tailles).
- Décision Go/No-Go basée sur le signal, pas l'intuition.

## Phase 4 — Lancement (après le MVP)
- Beta fermée avec les inscrits de la liste d'attente, avant tout lancement public.
- Soumission Chrome Web Store : compter 1 à 3 semaines de review.
- Lancement public : Product Hunt + communautés mode/sneakers grand public (pas les communautés "insider").
- Message central : pas besoin de connaître la hype pour bien acheter.
- **Acquisition payante (Meta/TikTok Ads) démarre ici, pas avant** — pas de budget pub tant que le produit n'existe pas.
- **Candidatures Awin** dès qu'il y a du trafic réel à montrer :
  - Agrément réseau (compte éditeur Awin) : formulaire + petit dépôt remboursable (~5€), validé quasi instantanément.
  - Agrément par marchand : candidature séparée à chaque enseigne (ASOS, JD Sports, Zalando...), review individuelle, couverture progressive marchand par marchand.
  - Bascule progressive de SerpApi vers Awin, sans tout couper d'un coup.

## Phase 5 — Monétisation
| Palier | Prix | Inclus |
|---|---|---|
| Gratuit | 0€ | 5 scans/mois, résultats de base, pas d'alertes |
| Essentiel | 6,99€/mois | Scans illimités, wishlist 15 articles, alertes en digest quotidien |
| Pro | 11,99€/mois | Wishlist illimitée, alertes temps réel, historique de prix, couverture élargie revente |
| Commission | variable | % affiliation Awin sur tous les paliers, en complément (dès Phase 4) |

**Métriques à suivre dès le lancement :**
- Taux de conversion gratuit → payant
- Churn mensuel
- Scans par utilisateur par semaine (signal de repeat value)
- Répartition du revenu : abonnements vs commissions

## Phase 6 — Après le MVP, si la traction est là
- Score de confiance anti-contrefaçon.
- Alternatives moins chères ("dupes").
- Recommandation de taille cross-marques (feature premium).
- Application mobile native, si la demande le justifie.

## Décisions encore ouvertes
- Vérifier la disponibilité de "Scout" (domaine, marque, Chrome Web Store).
- Budget de temps avant le Go/No-Go de la Phase 0.
