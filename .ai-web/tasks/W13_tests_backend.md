# W13 — Tests backend complets (Functions + D1)

Branche : `web/13-tests-backend` → PR vers `feature/mini-ville`. Session E (avec W14).

## Objectif
Couvrir tout le backend W09–W12 par des tests automatisés reproductibles (l'audit W14 et la
release W15 s'appuient dessus).

## Instructions
1. Outillage : exécuter les Pages Functions sous test via `wrangler` (unstable_dev/miniflare) ou,
   si trop lourd, tester les handlers en unitaire en injectant un `context` mock (env + D1 mock
   sur SQLite en mémoire). Choisir UNE approche, la justifier dans la PR, l'intégrer au
   `npm test` existant (Vitest).
2. Couverture minimale :
   - `GET /api/products` : liste actifs seulement, cache headers, 404 id inconnu.
   - Admin : 401 sans/mauvais token, CRUD complet, validation (types, prix négatif, champs trop
     longs), soft delete, 405.
   - Checkout : produit inactif/stock 0/quantité invalide refusés ; prix lu de D1 (un test qui
     prouve qu'un prix client falsifié est ignoré).
   - Webhook : signature invalide → 400 ; replay du même événement → idempotent (pas de double
     décrément — si non implémenté en W12, l'implémenter ici) ; stock jamais négatif.
   - SQL : aucun chemin de code ne concatène une entrée utilisateur (test par revue + grep
     committé en test statique si pertinent).
3. Brancher ces tests dans le workflow CI (W02) si mergé — étape dédiée, tolérante si wrangler
   absent (skip explicite, pas de faux vert silencieux).

## Critère de fin
`npm test` vert localement avec les nouveaux tests ; matrice de couverture (endpoint × cas) dans
la PR ; CI verte si applicable.
