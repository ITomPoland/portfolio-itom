# W10 — Front branché sur l'API catalogue (fallback statique OBLIGATOIRE)

Branche : `web/10-front-catalogue` → PR vers `feature/mini-ville`. Dépend de W09 (même session C).

## Objectif
La Boutique (salle Studio) lit les produits depuis `/api/products`, avec **repli transparent sur
les données statiques** (`productData.js`) si l'API est absente ou en erreur — le site doit rester
100 % fonctionnel en statique pur (invariant de CLAUDE.md §5).

## Instructions
1. `src/utils/catalogue.js` : `loadProducts()` — fetch `/api/products` (timeout court ~2 s via
   AbortController), validation minimale de la forme, sinon retour de `productData.js`. Une seule
   requête par session (cache module), pas de spinner bloquant : on affiche le statique puis on
   remplace silencieusement si l'API répond (les fiches produit sont data-driven).
2. Brancher les consommateurs actuels de `productData` (chercher les imports réels :
   `ProductModels.jsx`, overlay produit, étagères…) via ce loader SANS changer la forme des
   données consommées par `GlobalOverlay` (invariant). Les champs nouveaux (stock, prix) sont
   optionnels côté front ici — l'affichage prix/stock arrive avec W12.
3. INTERDIT : nouvelle dépendance runtime, changement du rendu 3D, requête avant le consentement ?
   → l'API catalogue est same-origin et sans cookie : PAS concernée par le contrat RGPD analytics
   (le documenter dans le code).
4. Tests (l'infra W01 existe) : loader → API OK / API 500 / timeout → fallback statique ; forme
   compatible overlay.

## Critère de fin
`npm test` vert (nouveaux tests inclus) ; `npm run build` OK ; site inchangé sans wrangler ;
avec `wrangler pages dev`, les produits viennent de D1 (vérifié en modifiant une valeur en base,
capture curl/JSON dans la PR).
