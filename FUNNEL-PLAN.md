# Scout — Plan de conversion landing page → paiement

> Complète `CLAUDE.md` (spec build) et `PLAN.md` (roadmap business). Ce fichier-ci couvre un seul funnel précis : trafic froid (pub, Product Hunt, organique) → landing page → premier scan → paiement. Objectif explicite de l'utilisateur : friction minimale au début, demande de paiement très rapide (1 scan gratuit, tout le reste payant).

## 0. Pourquoi pas un plan marketing 12 mois

Le skill `/marketing-plan` produit un plan fCMO complet (budget mensuel, levée de fonds, équipe, AARRR sur 12 mois). Scout n'a aujourd'hui ni budget pub, ni équipe, ni utilisateurs — ce plan-là n'a pas de matière first. Ce document se concentre uniquement sur le funnel demandé : la landing page et sa conversion vers le paiement. Le plan 12 mois (Phase 4-6 de `PLAN.md`) redevient pertinent une fois qu'il y a du trafic réel à mesurer.

## 1. Le problème de fond : deux points d'entrée, un seul moment de vérité

Aujourd'hui, deux chemins mènent au produit :

- **Chemin A — Installer l'extension** : le visiteur clique "Ajouter à Chrome", installe, voit l'onboarding 3 écrans (déjà construit), se connecte, scanne depuis n'importe quel site.
- **Chemin B — Essayer sans installer** : le visiteur reste sur la landing page, dépose une photo, voit un résultat réel — sans jamais quitter la page ni installer quoi que ce soit.

**Recommandation : les deux doivent coexister**, mais ils ne s'adressent pas au même niveau de confiance. Installer une extension Chrome est un engagement plus lourd qu'uploader une photo — demander l'un avant l'autre selon le contexte du visiteur, c'est appliquer le modèle BJ Fogg (Comportement = Motivation × Capacité × Déclencheur) : un visiteur froid a une motivation encore faible, donc il faut baisser la capacité requise (pas d'installation) pour obtenir le comportement. Une fois qu'il a vu un résultat réel, sa motivation a grimpé — c'est à ce moment-là que l'installation devient un ask raisonnable.

**Point technique bloquant à corriger avant tout** : Chrome mobile ne supporte pas les extensions. Or la cible ("passionnés mode/sneakers non-initiés") navigue majoritairement sur Instagram/Pinterest en mobile — exactement le trafic qu'amèneront des pubs Meta/TikTok (Phase 4 de `PLAN.md`). Un CTA "Ajouter à Chrome" pointé vers du trafic mobile est un CTA mort. **La landing page doit détecter le user-agent et masquer/désactiver le Chemin A sur mobile, en ne poussant que le Chemin B.**

## 2. Chemin A — Installer l'extension

Inchangé dans son fonctionnement (onboarding déjà construit, voir `PROGRESS.md`), mais la landing page ne doit pas vendre la fonctionnalité ("identification par IA") — elle doit vendre le job à accomplir (Jobs-to-be-Done) :

- ❌ "Extension d'identification de vêtements par intelligence artificielle"
- ✅ "Trouve où acheter cette pièce moins cher, dans ta taille — en un clic droit"

CTA : **"Ajouter à Chrome — gratuit"**. Le mot "gratuit" ancre l'attente avant que la personne découvre que ce n'est qu'un scan (Zero-Price Effect : "gratuit" déclenche une préférence disproportionnée par rapport à sa vraie valeur — à utiliser pour l'accroche, pas à cacher la limite).

## 3. Chemin B — Essayer directement sur la page (le vrai moteur de conversion)

C'est la pièce la plus importante du funnel : c'est elle qui produit l'aha moment (voir un vrai résultat, un vrai prix) avant même de demander un compte.

### Séquence exacte

1. **Zone de dépôt d'image, visible sans scroller.** Aucune connexion demandée à ce stade — c'est le geste le plus bas-friction possible (glisser-déposer ou choisir un fichier). Reprend le principe "Value Before Ask" du skill paywalls : on laisse goûter avant de demander quoi que ce soit.
2. **Bouton "Identifier ce produit"** apparaît une fois l'image choisie. Au clic : c'est ici, et seulement ici, que la connexion est demandée (conforme à ta description).
   - **Pourquoi ce moment précis fonctionne bien psychologiquement** : la personne a déjà fait un petit geste (choisir SA photo) — *Commitment & Consistency* la pousse à vouloir finir ce qu'elle a commencé, et le *Zeigarnik Effect* (une tâche interrompue occupe l'esprit plus qu'une tâche jamais commencée) rend l'abandon à cet instant plus coûteux mentalement que de simplement se connecter.
   - **Point technique précis à implémenter** : l'image (ou son URL Blob) doit être conservée en `sessionStorage` avant la redirection vers `/sign-in`, avec un paramètre de retour (`?redirect_url=/?resume=scan`) pointant vers la landing page. Au retour post-connexion, le scan se relance **automatiquement**, sans redemander la photo ni un second clic. Sans ce détail, tout le bénéfice psychologique de l'étape 1 s'effondre — l'utilisateur atterrit sur une page de connexion nue, sans lien visible avec ce qu'il venait de faire.
3. **Résultat affiché** : c'est le pic de l'expérience (Peak-End Rule — les gens jugent une expérience sur son pic et sa fin, pas sur sa moyenne). Comparaison de prix réelle, avec le moins cher mis en avant visuellement.
4. **Toute action suivante → paywall direct**, comme demandé : cliquer sur ♡ (wishlist) ou "Créer une alerte de prix" affiche immédiatement l'écran de paywall, pas de version gratuite de ces actions. Le 1 scan gratuit EST la démo complète — rien d'autre n'est gratuit.

### Ce que ça implique côté code (pas encore fait)

- Le scan limit actuel (`FREE_SCAN_LIMIT = 1`) ne bloque que le **scan** lui-même. La wishlist et les alertes de prix (`/api/wishlist`, `PATCH targetPrice`) n'ont aujourd'hui **aucune vérification de palier** — n'importe quel compte FREE peut déjà les utiliser gratuitement. Pour que "toute autre action affiche un paywall" soit vrai partout (pas seulement sur la landing page), il faut ajouter la même vérification `user.plan === "FREE"` dans `POST /api/wishlist` et `PATCH /api/wishlist/:id`, cohérente avec ce qui existe déjà dans `/api/scan`.
- Nouveau composant : formulaire d'upload public sur la landing page (variante non-authentifiée de `upload-form.tsx`), avec persistance `sessionStorage` + relance automatique post-connexion.
- Nouvel écran de paywall **en contexte** (pas juste une redirection vers `/dashboard`) déclenché par le clic sur ♡ ou "Créer une alerte" quand `user.plan === "FREE"` — voir §4.

## 4. L'écran de paywall post-résultat

Ne pas réutiliser tel quel l'écran `billing-section.tsx` du dashboard (pensé pour un utilisateur déjà engagé) — celui-ci doit être pensé pour quelqu'un qui vient de voir un résultat il y a 5 secondes et n'a jamais vu de grille tarifaire avant.

> **Note de mise à jour** : le mockup ci-dessous date de la conception initiale (2 paliers). La version réellement construite (`components/paywall-prompt.tsx`) a 3 paliers payants — Découverte 3,99€, Essentiel 6,99€, Pro 14,99€ — avec un tableau de fonctionnalités aligné plutôt que des listes libres par carte. Voir `PROGRESS.md` pour le détail. Le raisonnement psychologique ci-dessous reste valable ; l'ajout de Découverte en dessous d'Essentiel renforce encore l'effet d'ancrage décrit plus bas (Essentiel devient le choix "raisonnable" par contraste avec Découverte *et* Pro, pas seulement Pro).

**Structure recommandée** (gabarit "Feature Lock" du skill paywalls, adapté) :

```
[Icône cadenas ou cœur plein]
Garde une trace de [Nom du produit identifié]

On t'envoie un email dès que le prix baisse — plus besoin
de revérifier toi-même.

┌─────────────────┐  ┌─────────────────┐
│  Essentiel       │  │  Pro             │
│  6,99€/mois      │  │  11,99€/mois     │
│  • Scans illimités│ │  • Wishlist illimitée│
│  • Wishlist 15   │  │  • Alertes temps réel│
│  • Alerte digest │  │  • Historique de prix│
│  [Choisir]        │  │  [Choisir]        │
└─────────────────┘  └─────────────────┘

Plus tard
```

Points de psychologie appliqués :
- **Framing en perte, pas en gain** : "Ne rate pas la prochaine baisse" convertit mieux que "Sois informé des baisses" — l'aversion à la perte pèse environ deux fois plus lourd que l'attrait du gain équivalent (Prospect Theory).
- **Ancrage par le palier Pro** : afficher Pro à côté d'Essentiel rend Essentiel "raisonnable" par contraste (Price Relativity / Decoy Effect), même si l'objectif réel est de vendre Essentiel au plus grand nombre.
- **Mental accounting** : envisager d'afficher aussi "23 centimes/jour" à côté de "6,99€/mois" pour Essentiel — le même prix formulé en dépense quotidienne paraît plus anodin (Rule of 100 / Mental Accounting).
- **Escape hatch visible** ("Plus tard") — respecter la règle "Respect the No" du skill paywalls : un premier contact qui piège ou culpabilise détruit la confiance nécessaire à une conversion future. L'utilisateur qui part aujourd'hui peut revenir demain ; celui qu'on a coincé une fois ne revient pas.
- **Pas de fausse urgence ni de faux avis clients** : Scout n'a pas encore d'utilisateurs — inventer des témoignages ou un compte à rebours serait un dark pattern et nuirait à la confiance dès le premier contact. Si une preuve sociale est nécessaire, s'appuyer sur l'autorité de la techno sous-jacente ("Comparateur de prix propulsé par Google Lens et Google Shopping") plutôt que sur des chiffres fabriqués.

## 5. Structure de la landing page (au-dessus du pli et en dessous)

Modèle AIDA appliqué :

| Section | Contenu | Principe |
|---|---|---|
| Attention | Titre en une phrase, orienté job-to-be-done, pas fonctionnalité | Jobs to Be Done |
| Interest/Desire | Le widget d'essai (Chemin B) lui-même — pas une liste de features, l'expérience directement | "Do, don't show" (skill onboarding) |
| Action | CTA extension (desktop) OU CTA essai (mobile, détection user-agent) | Un seul CTA dominant par section (Hick's Law) |
| Preuve | Autorité de la techno (Google Lens/Shopping), pas de faux témoignages | Authority Bias, honnêteté |

**Un seul CTA visuellement dominant par section** — ne pas mettre "Ajouter à Chrome" et "Essayer une photo" au même niveau visuel, ça crée un choix qui ralentit la décision (Paradox of Choice / Hick's Law). Recommandation : sur desktop, le widget d'essai (Chemin B) EST la hero section — "Ajouter à Chrome" reste disponible mais en CTA secondaire, puisque montrer directement plutôt que promettre convertit mieux à froid. Une fois du trafic réel, tester en A/B lequel des deux convertit le mieux comme CTA primaire.

## 6. Métriques à suivre dès le lancement (funnel, pas le plan 12 mois)

```
Landing page vue
  → Photo déposée               (mesure l'attrait de l'accroche)
  → "Identifier" cliqué          (mesure l'engagement avant le mur de connexion)
  → Connexion complétée          (la plus grosse perte attendue — c'est le seul vrai ask du funnel)
  → Résultat vu                  (aha moment atteint)
  → Action suivante tentée (♡/alerte)  (mesure si le résultat donne envie d'aller plus loin)
  → Paywall vu → Paiement complété     (conversion finale)
```

La plus grosse perte attendue est l'étape "connexion" — c'est le seul vrai frein de friction du funnel. Si le taux de complétion y est mauvais une fois en prod, la persistance `sessionStorage` + relance automatique (§3, point 2) est le premier point à vérifier avant de toucher au design.

## 7. État de la construction

Tout ce qui suit est fait — voir `PROGRESS.md` pour le détail technique de chaque point :

1. ✅ Vraie landing page (`apps/web/src/app/page.tsx`) avec lien extension discret en haut à droite, masqué sur mobile.
2. ✅ Widget d'upload public (`components/try-widget.tsx`) + route anonyme `/api/upload` + persistance `sessionStorage` + relance auto post-connexion.
3. ✅ Composant paywall en contexte (`components/paywall-prompt.tsx`), réutilisé partout où une action payante est tentée par un compte FREE — pas de redirection vers `/dashboard`.
4. ✅ Vérification de palier étendue à `/api/wishlist` (POST) et `PATCH /api/wishlist/:id`.
5. ✅ **Extension rendue 100% payante** (décision prise après la rédaction initiale de ce plan, voir `PROGRESS.md`) — le scan gratuit unique ne fonctionne que via le web.

Restant :
1. Copy finale à affiner une fois qu'il y a du vrai trafic à observer (titre/sous-titre actuels sont une première version raisonnable, pas testés).
2. `EXTENSION_STORE_URL` dans `extension-nav-link.tsx` à mettre à jour une fois la fiche Chrome Web Store publiée.
3. Métriques du funnel (§6) — pas encore instrumentées (pas d'outil d'analytics branché).
