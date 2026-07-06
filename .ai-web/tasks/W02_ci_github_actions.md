# W02 — CI GitHub Actions (build + tests)

Branche : `web/02-ci` (depuis `feature/mini-ville`) → PR vers `feature/mini-ville`.
Lire `CLAUDE.md` (racine) avant tout.

## Objectif
Aucune CI n'existe. Créer un workflow GitHub Actions qui valide chaque PR : le dépôt reçoit du
travail de plusieurs agents (sessions web, agents locaux) et l'Engineering Manager doit voir en un
coup d'œil si une PR builde.

## Instructions
1. `.github/workflows/ci.yml` : déclencheurs `pull_request` + `push` sur `main` et
   `feature/mini-ville`.
2. Job unique Ubuntu, Node 22, cache npm : `npm ci` → `npm run build` →
   `npm test --if-present` (le script test arrive avec W01 ; `--if-present` le rend tolérant si
   W01 n'est pas encore mergée).
3. **PAS d'étape lint** : ~239 erreurs préexistantes assumées (voir CLAUDE.md), un lint CI serait
   rouge en permanence et donc ignoré. Ne pas « corriger » ça ici (c'est la tâche W08).
4. Si le build a besoin de variables d'env : les clés (`VITE_WEB3FORMS_KEY`, `VITE_POSTHOG_KEY`…)
   sont optionnelles by design — le build doit passer SANS secrets. Si ce n'est pas le cas,
   c'est un bug à signaler dans la PR, pas à contourner en committant des clés.
5. Bonus si simple : badge de statut dans `README.md`.

## Critère de fin
Le workflow tourne et est **vert sur la PR elle-même**. Aucun secret commité. PR expliquant les
choix (durée du job, cache).
