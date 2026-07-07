# JOURNAL — Audit sécurité final (portfolio-itom)

Branche de travail : `claude/audit-secu-finale-i0yidy` (depuis `feature/mini-ville`).
Protocole : après chaque faille trouvée / corrigée → mise à jour de ce journal + commit + push immédiat.
Une passe terminée = checkbox cochée + push (même si RAS).

## Passes

- [ ] **P1 — Injection/XSS** : `dangerouslySetInnerHTML`, `innerHTML`, `eval`/`new Function`, réflexion de paramètres d'URL, contenu utilisateur dans le DOM ou textures/sprites Three.js. Focus formulaire contact `MessagePaper.jsx` (validation, web3forms, honeypot, messages d'erreur).
- [ ] **P2 — Secrets & fuites** : scan code + historique git, `.env` commités, sourcemaps prod, clés en dur (dont trace résiduelle de la clé Web3Forms du template).
- [ ] **P3 — Dépendances & supply chain** : `npm audit`, CVE three/react/vite, scripts d'install suspects, dépendances fantômes. Bumps mineurs/patch uniquement.
- [ ] **P4 — Headers & CSP** : complétude CSP (`frame-ancestors`, `object-src`, `base-uri`, `form-action`), `X-Content-Type-Options`, `Referrer-Policy`, `Permissions-Policy`. Cible Cloudflare Pages (`_headers`).
- [ ] **P5 — CI/workflows GitHub** : `permissions:` minimal, `pull_request_target`, épinglage des actions, secrets dans les logs.
- [ ] **P6 — Logique client abusable** : `postMessage` sans vérif d'origine, `window.open` sans `noopener`, open redirects, localStorage/consentement, fetch d'assets externes, prototype pollution.

## Findings

_(vide pour l'instant — chaque entrée : quoi, où, gravité, corrigé ou non, commit)_
