# W15 — Tests finaux + runbook de mise en production

Branche : `web/15-release` → PR vers `feature/mini-ville`. Session F (avec W08 après).

## Objectif
Tout ce qu'il faut pour que l'utilisateur puisse mettre en production seul, et vérifier que rien
n'est cassé de bout en bout.

## Instructions
1. **Passe de tests finale** : `npm run build` + `npm test` + `npm run preview` (smoke : la page
   charge, les assets répondent) + `wrangler pages dev` (smoke API : products, admin 401,
   checkout 400 sans payload). Consigner chaque sortie dans la PR. Ce qui exige un humain
   (parcours 3D visuel, paiement test réel) → checklist QA dédiée, pas de faux vert.
2. **`docs/RUNBOOK.md`** (en français, pas-à-pas pour l'utilisateur) :
   - Variables d'environnement Cloudflare à créer : `ADMIN_TOKEN`, `STRIPE_SECRET_KEY`,
     `STRIPE_WEBHOOK_SECRET`, `VITE_WEB3FORMS_KEY`, `VITE_POSTHOG_KEY`/`HOST` (rappeler qu'aucune
     n'est dans le repo).
   - Création D1 + `wrangler d1 migrations apply` + binding.
   - Configuration du webhook Stripe (URL, événement, récupération du secret) + bascule mode
     test → live.
   - Déploiement Pages (branche de prod), vérifs post-déploiement (headers via curl -I, CSP dans
     la console, `/api/products`).
   - Rollback : revenir au déploiement précédent Pages + `active=0` produits si besoin.
3. **Checklist GO/NO-GO** en tête de RUNBOOK : légal (plus aucun asset auteur — pointer l'état),
   sécurité (audit W14 clos), QA visuelle utilisateur faite, paiement test OK, analytics opt-in
   vérifié.
4. Nettoyage release : versions dans `package.json` (`1.0.0`), retirer les fichiers parasites
   évidents du repo s'il en reste (les LISTER dans la PR, ne supprimer que l'évident type
   `*.patch` — en cas de doute, lister sans supprimer).

## Critère de fin
RUNBOOK complet et exécutable par un non-développeur soigneux ; toutes les sorties de tests dans
la PR ; checklist GO/NO-GO remplie avec l'état réel (les cases humaines laissées ouvertes).
