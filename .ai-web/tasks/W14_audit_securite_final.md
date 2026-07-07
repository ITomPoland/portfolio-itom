# W14 — AUDIT DE SÉCURITÉ FINAL (tout le dépôt, niveau Pro)

Branche : `web/14-audit-securite` → PR vers `feature/mini-ville`. Session E. C'est LA tâche
sécurité de fin de projet : méthodique, preuve à l'appui, pas de théâtre.

## Objectif
Audit complet du site + backend avant mise en production, ET correction des findings sur la même
branche (fix committé = finding fermé ; sinon finding documenté avec sévérité et plan).

## Périmètre / méthode
1. **Backend (nouveau, prioritaire)** : `functions/` — auth admin (timing, fuite d'info dans les
   erreurs, 401 vs 404), injection SQL (chaque requête D1), webhook Stripe (signature, replay,
   idempotence), validation d'entrées, énumération d'ids, rate limiting (documenter la limite
   Cloudflare applicable), secrets (grep TOUT le repo + `git log -p` sur les fichiers sensibles :
   clés, tokens, .env committés par erreur).
2. **Front** : XSS (toute interpolation de données produits venant de D1 — ce sont maintenant des
   données ADMINISTRÉES, plus des constantes : vérifier qu'aucun chemin ne fait de HTML brut),
   sécurité des liens (rel/noopener — W03), le token admin (jamais persisté/loggé).
3. **Headers/CSP** : `public/_headers` toujours cohérent après le backend (les réponses des
   Functions héritent-elles des headers ? vérifier et corriger), pages succès/annulation Stripe
   couvertes.
4. **Dépendances** : `npm audit` (prod ET dev), état des dependabot ouverts, wrangler à jour.
5. **RGPD** : table `orders` (minimisation, durée de rétention à documenter), consentement
   analytics toujours étanche (aucun appel avant opt-in — re-vérifier avec le backend ajouté).
6. Chaque finding : `[sévérité] fichier:ligne — scénario d'exploitation concret — fix`. Pas de
   finding « théorique » sans chemin d'attaque.

## Critère de fin
`docs/security/audit-final.md` (findings, fixes, risques résiduels acceptés, go/no-go argumenté) ;
fixes committés ; build + tests verts ; zéro secret dans l'historique récent ou procédure de
rotation documentée si trouvé.
