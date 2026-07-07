# CLAUDE.md — Hakkilo XR (portfolio-itom)

Site vitrine 3D pour **Hakkilo XR** (client commercial, startup VR), construit sur la base
open-source MIT `portfolio-itom` et re-skinné. Concept UX : un bâtiment → couloir infini → portes →
salles, + une **mini-ville** extérieure (`VILLE_MODE` dans
`src/components/canvas/ville/villeConfig.js`). Stack : React 19, Vite 7, three ^0.182,
@react-three/fiber ^9, drei ^10, GSAP, SCSS, posthog-js. **Mobile-first.**

Ce fichier est la charte pour **toute session Claude Code ouverte sur ce dépôt**, notamment les
sessions **Claude Code web (claude.ai/code)** qui n'ont AUCUN autre contexte que ce dépôt.

## 1. Contrainte LÉGALE (bloquante, non négociable)

Le code d'origine est MIT, MAIS les textures/images/textes de l'auteur original sont **copyrightés**
et ont été purgés. **Interdit** : réintroduire tout contenu, lien, nom ou texte de l'auteur original
(Tomasz Szmajda / ITom / itomdev), ou tout asset copyrightés. Tout contenu neuf = écrit pour
Hakkilo XR. Copy utilisateur final : **en français**. Marque : « Hakkilo XR ». Le fichier `LICENSE`
est conservé volontairement (attribution MIT) — ne pas le supprimer.

## 2. Invariants à NE PAS casser

1. **Systèmes réutilisables tels quels, ne pas réécrire** : `src/context/SceneContext.jsx`,
   `src/hooks/useInfiniteCamera.js`, `src/components/ui/GlobalOverlay.jsx`,
   `src/context/PerformanceContext.jsx`. Modifications **additives uniquement**.
2. **La caméra pendant l'entrée d'une salle appartient à `DoorSection.jsx`** (GSAP). Une salle ne
   prend la caméra qu'une fois `isInRoom === true`.
3. **Mapping porte→salle par `label`** dans `CorridorSegment.jsx` (`THE GALLERY`, `THE STUDIO`,
   `THE ABOUT`, `LET'S CONNECT`) ; côté ville, `VILLE_BUILDINGS` (villeConfig) mappe
   bâtiment→`roomId`. Modifier une salle = brancher par son label sans toucher aux autres.
4. **Consentement RGPD** (`src/utils/analytics.js` + `ConsentBanner.jsx`) : aucune capture
   PostHog / aucun cookie analytics avant opt-in explicite. Contrat absolu.
5. **Perf** : tout ce qui est coûteux lit `usePerformance()` (tiers HIGH/MEDIUM/LOW). Pas
   d'allocation dans `useFrame`. `RoomWarmup` reste actif. Piège connu : `texSkyline` retourné par
   `makeVilleTextures()` est un OBJET `{map, emissiveMap}`, pas une Texture.

## 3. Style de code

Composants fonctionnels React + hooks, fichiers `.jsx`, **indentation 4 espaces**, commentaires
concis en anglais expliquant le POURQUOI. Réutiliser les patterns existants (props data-driven
`{position, rotation, scale}`, overlay via `openOverlay(data)`). **Aucune dépendance runtime
nouvelle** sans raison forte ; devDependencies outillage/test OK si la tâche le prévoit.

## 4. Sessions Claude Code web — workflow OBLIGATOIRE

- Les tâches sont dans **`.ai-web/tasks/WNN_*.md`** (ordre recommandé dans `.ai-web/tasks/README.md`).
  Une session = UNE tâche, sans déborder de son périmètre.
- **Branche de base = `feature/mini-ville`** (le travail courant y vit ; `main` est en retard).
  Créer une branche **`web/NN-slug`** et ouvrir une **PR vers `feature/mini-ville`** — JAMAIS vers
  `main`, et **ne jamais merger soi-même** : la revue et le merge sont faits par l'Engineering
  Manager (session locale).
- `npm run build` doit passer avant d'ouvrir la PR. `npm run lint` compte ~239 erreurs
  PRÉEXISTANTES (règles react-hooks 7 sur du code R3F légitime) : ce n'est PAS un gate — exigence
  seulement : ne pas en AJOUTER (sauf tâche W08 qui les traite toutes).
- Pas de vérification visuelle possible depuis le web : s'en tenir aux critères testables de la
  tâche, et lister dans la description de PR ce qui nécessite une QA visuelle humaine.
- Description de PR : ce qui a été fait, comment c'est vérifié, ce qui reste/risques. En français.

### Protocole RELAIS (dernière itération — OBLIGATOIRE)
Le backlog est découpé en **Sessions A→F** (2-3 tâches chacune, voir `.ai-web/tasks/README.md`).
Une discussion = UNE session, jamais plus :
1. Lire `.ai-web/NEXT.md` pour savoir quelle session prendre (sauf consigne explicite).
2. Faire les tâches de la session (une branche + une PR par tâche, comme d'habitude).
3. **Avant de finir** : mettre à jour `.ai-web/NEXT.md` (committé dans la DERNIÈRE PR) — tâches
   faites + numéros de PR, session suivante, et la commande exacte à coller.
4. **Dernière ligne de la réponse à l'utilisateur, toujours** :
   « ✋ Session X terminée — ouvre une NOUVELLE session sur ce dépôt et colle :
   "Lis CLAUDE.md puis exécute la Session Y de .ai-web/tasks/README.md" ».
Ne jamais entamer la session suivante dans la même discussion, même s'il reste du temps.

## 5. Architecture backend — DÉCIDÉE (2026-07-07, Engineering Manager)

Le front reste **statique sur Cloudflare Pages**. Le backend est **Cloudflare-natif** :
- **Pages Functions** (répertoire `functions/`) pour l'API — même dépôt, même déploiement.
- **D1** (SQLite managé) pour le catalogue/stock — binding `PRODUCTS_DB`.
- **Stripe Checkout HÉBERGÉ** pour le paiement : redirection pleine page vers Stripe, JAMAIS de
  stripe.js embarqué ni de donnée carte sur notre origine (la CSP stricte de `public/_headers`
  reste intacte). Webhook signé pour la confirmation.
- **Admin** : route `/admin` (lazy) + API protégée par `Authorization: Bearer` (secret
  `ADMIN_TOKEN` en variable d'environnement Cloudflare — JAMAIS committé).
Pourquoi : zéro nouveau fournisseur (Supabase écarté — doute client), surface d'audit minimale,
gratuit à cette échelle, réversible (SQLite exportable). Le front doit TOUJOURS retomber sur les
données statiques (`productData.js`) si l'API est absente (dev local sans wrangler, panne).
