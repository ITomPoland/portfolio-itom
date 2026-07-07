# W11 — Back-office admin (catalogue éditable)

Branche : `web/11-admin` → PR vers `feature/mini-ville`. Dépend de W09/W10 mergées (session D).

## Objectif
Une page `/admin` minimale et sûre pour éditer le catalogue (CRUD produits + stock + prix +
actif/inactif) — l'objectif « back-office éditable » du client, sans framework supplémentaire.

## Instructions
1. **API** `functions/api/admin/products*.js` : POST (créer), PUT (modifier), DELETE (désactiver —
   soft delete via `active=0`, jamais de suppression physique). Auth : header
   `Authorization: Bearer <ADMIN_TOKEN>` comparé au secret d'environnement Cloudflare
   (`context.env.ADMIN_TOKEN`) en **comparaison à temps constant** ; 401 sinon ; 405 sur méthodes
   non prévues. Requêtes préparées, validation stricte des champs (types, longueurs, prix ≥ 0).
   JAMAIS le token en query string ni dans le repo.
2. **UI** : la route admin existe déjà côté react-router (repérer comment elle est branchée avant
   d'écrire). Page React simple (tableau + formulaire), **lazy-loadée** (hors chunk initial),
   copy en français. Le token est saisi par l'admin à l'ouverture et gardé en mémoire (state) —
   PAS de localStorage (XSS-durable), le re-saisir par session est acceptable.
3. Sécurité : pas d'écho du token ; erreurs API sans détails internes ; `noindex` sur /admin
   (meta + header) ; l'UI admin ne doit rien charger de tiers.
4. Tests : auth 401/200, validation des payloads, soft delete. UI : rendu + soumission mockée.

## Critère de fin
`npm test` vert, `npm run build` OK, chunk admin séparé (vérifier la sortie de build), parcours
complet en `wrangler pages dev --local` (créer/modifier/désactiver un produit → visible via
`GET /api/products`), captures/sorties dans la PR + liste de ce qui relève de la QA humaine.
