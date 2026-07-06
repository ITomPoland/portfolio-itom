# W05 — Optimisation du bundle (manualChunks)

Branche : `web/05-bundle` (depuis `feature/mini-ville`) → PR vers `feature/mini-ville`.
Lire `CLAUDE.md` (racine) avant tout.

## Objectif
Backlog P3 : le bundle JS principal fait ~1,4 MB. Le découper en chunks raisonnables pour
améliorer le premier chargement (site mobile-first), sans rien casser.

## Instructions
1. **Mesurer d'abord** : ajouter `rollup-plugin-visualizer` en devDependency (actif seulement à la
   demande, rapport NON commité), builder, noter la composition actuelle (chiffres dans la PR).
2. `vite.config.js` → `build.rollupOptions.output.manualChunks` : séparer au minimum `three`,
   l'écosystème `@react-three/*`, `gsap`, `posthog-js`, et le vendor React
   (react/react-dom/react-router-dom). Ajuster selon ce que la mesure révèle réellement.
3. Route admin / fallback (react-router) : si le code le permet proprement, `React.lazy` +
   `Suspense` pour la sortir du chunk initial. Si ça demande de restructurer, ne pas le faire —
   le proposer dans la PR.
4. **Interdits** : changer le comportement runtime, toucher au chargement des GLB/textures,
   toucher à `RoomWarmup` (précompilation shaders) et à l'ordre d'initialisation
   analytics/consentement.
5. Vérifier après build : `npm run preview` → le site charge, l'entrée se lance (vérification de
   non-régression limitée au chargement ; noter dans la PR que la traversée complète = QA humaine).

## Critère de fin
`npm run build` OK ; tableau avant/après des chunks (nom + taille gzip) dans la PR ; chunk initial
nettement réduit ; `vite-plugin-compression` toujours fonctionnel.
