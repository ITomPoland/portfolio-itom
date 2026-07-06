# W01 — Infrastructure de tests (Vitest) + tests de la logique pure

Branche : `web/01-tests-infra` (depuis `feature/mini-ville`) → PR vers `feature/mini-ville`.
Lire `CLAUDE.md` (racine) avant tout.

## Objectif
Le projet n'a AUCUN test. Mettre en place Vitest et couvrir la **logique pure** (config, contrats
de données, utils) — pas le rendu 3D. C'est le filet de sécurité de toute l'équipe (plusieurs
agents travaillent en parallèle sur ce dépôt).

## Instructions
1. devDependencies : `vitest`, `@testing-library/react`, `@testing-library/jest-dom`, `jsdom`.
   Script `"test": "vitest run"` (+ `"test:watch"` si utile). Config minimale (environment jsdom
   pour les tests de composants DOM, node pour la logique pure).
2. Tests à écrire (répertoire `src/**/__tests__/` ou fichiers `*.test.js(x)` colocalisés — suivre
   une seule convention) :
   - **`villeConfig.js` (intégrité de la source de vérité)** : chaque entrée de `VILLE_BUILDINGS`
     a position/rotation finies et un collider cohérent ; chaque `roomId` renvoie vers une salle
     réellement branchée (dériver l'ensemble autorisé du code — labels de `CorridorSegment.jsx` /
     logique SceneContext — NE PAS hardcoder une liste devinée) ; les waypoints du parcours guidé
     sont ≥ 2 et finis ; `villeNightTargetFor()` couvre les 3 thèmes (auto/day/night).
   - **`src/utils/analytics.js` (contrat RGPD — le plus important)** : mocker `posthog-js` ;
     vérifier : no-op complet si clé absente ; AUCUN init/capture avant consentement ; opt-in
     seulement après accord ; choix persisté/relu depuis localStorage.
   - **`ConsentBanner.jsx`** : rendu, clic Accepter / Refuser → effets attendus (persistance,
     appel analytics correct), bannière non ré-affichée si choix déjà fait.
   - **`productData.js`** : chaque produit a les champs requis par `GlobalOverlay` (dériver la
     forme attendue de la lecture de GlobalOverlay.jsx).
   - Autres utils purs trouvés dans `src/utils/` : couvrir ce qui est raisonnable.
3. **INTERDIT** : tests de rendu canvas/WebGL/three (fragiles, hors périmètre). Si un module est
   intestable sans refactor, le noter dans la PR au lieu de refactorer.
4. Modifications de `src/` autorisées UNIQUEMENT si strictement nécessaires à la testabilité
   (ex. exporter une fonction) et **sans aucun changement de comportement**.

## Critère de fin
`npm test` vert, `npm run build` OK, `npm run lint` n'a pas plus d'erreurs qu'avant. PR décrivant
chaque zone couverte et ce qui reste non testable.
