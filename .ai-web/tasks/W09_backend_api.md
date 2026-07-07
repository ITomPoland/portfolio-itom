# W09 — Fondations backend : D1 + API produits (Pages Functions)

Branche : `web/09-backend-api` → PR vers `feature/mini-ville`. Lire `CLAUDE.md` §5 (architecture
décidée) avant tout.

## Objectif
Poser le socle backend Cloudflare-natif : base D1 « catalogue » + API lecture des produits,
développable et testable en local sans compte Cloudflare.

## Instructions
1. devDependency `wrangler`. `wrangler.toml` : projet Pages, binding D1 `PRODUCTS_DB`
   (ids/placeholders documentés — la création réelle de la base est faite par l'utilisateur,
   fournir les commandes exactes dans la PR : `wrangler d1 create hakkilo-catalogue`, binding
   dashboard, `wrangler d1 migrations apply`).
2. `migrations/0001_products.sql` : table `products` reprenant TOUS les champs de
   `src/components/canvas/rooms/Studio/productData.js` (lire le fichier pour dériver le schéma —
   ne pas inventer) + `stock INTEGER NOT NULL DEFAULT 0`, `price_cents INTEGER`, `active INTEGER
   NOT NULL DEFAULT 1`, timestamps. + `migrations/0002_seed.sql` généré depuis productData
   (script Node jetable dans `scripts/`, committé).
3. `functions/api/products.js` : `GET /api/products` (liste, actifs seulement) et
   `functions/api/products/[id].js` : `GET` (détail). Requêtes **préparées** (`.bind()`),
   jamais de concaténation SQL. Réponses JSON `{ products: [...] }`, cache
   `Cache-Control: public, max-age=60`. Erreurs propres (404/500 sans stack).
4. En-têtes de sécurité des réponses API : `X-Content-Type-Options: nosniff`,
   `Content-Type: application/json; charset=utf-8`. CORS : same-origin uniquement (pas d'en-tête
   CORS = défaut sûr).
5. Vérification locale : `wrangler pages dev` avec D1 local (`--local`), curl des 2 endpoints,
   sortie collée dans la PR.

## Critère de fin
`npm run build` OK (le front ne change pas ici) ; `wrangler pages dev` sert `/api/products` en
local avec la seed ; migrations rejouables ; PR avec le runbook de création D1 pour l'utilisateur.
