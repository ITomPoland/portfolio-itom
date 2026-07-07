# JOURNAL — Audit sécurité final (portfolio-itom)

Branche de travail : `claude/audit-secu-finale-i0yidy` (depuis `feature/mini-ville`).
Protocole : après chaque faille trouvée / corrigée → mise à jour de ce journal + commit + push immédiat.
Une passe terminée = checkbox cochée + push (même si RAS).

## Passes

- [x] **P1 — Injection/XSS** : `dangerouslySetInnerHTML`, `innerHTML`, `eval`/`new Function`, réflexion de paramètres d'URL, contenu utilisateur dans le DOM ou textures/sprites Three.js. Focus formulaire contact `MessagePaper.jsx` (validation, web3forms, honeypot, messages d'erreur). → 5 findings (F1–F5), tous corrigés.
- [ ] **P2 — Secrets & fuites** : scan code + historique git, `.env` commités, sourcemaps prod, clés en dur (dont trace résiduelle de la clé Web3Forms du template).
- [ ] **P3 — Dépendances & supply chain** : `npm audit`, CVE three/react/vite, scripts d'install suspects, dépendances fantômes. Bumps mineurs/patch uniquement.
- [ ] **P4 — Headers & CSP** : complétude CSP (`frame-ancestors`, `object-src`, `base-uri`, `form-action`), `X-Content-Type-Options`, `Referrer-Policy`, `Permissions-Policy`. Cible Cloudflare Pages (`_headers`).
- [ ] **P5 — CI/workflows GitHub** : `permissions:` minimal, `pull_request_target`, épinglage des actions, secrets dans les logs.
- [ ] **P6 — Logique client abusable** : `postMessage` sans vérif d'origine, `window.open` sans `noopener`, open redirects, localStorage/consentement, fetch d'assets externes, prototype pollution.

## Findings

### P1 — Injection/XSS

- **F1 — Sink XSS latent : GSAP TextPlugin écrit via innerHTML** — `src/components/ui/GlobalOverlay.jsx` (animation de `content.description`). Gravité : **moyenne** (non exploitable aujourd'hui : données statiques `contentData.js`/`productData.js`/AWARDS, mais toutes les URLs sont marquées « TODO: vrai lien » → si la description vient un jour d'un CMS/API, XSS direct ; c'était le seul point d'écriture HTML brut de l'app). **CORRIGÉ** : échappement HTML (`escapeHtml`) avant le tween — rendu identique au JSX échappé par React.
- **F2 — `window.open(url, '_blank')` sans `noopener` + aucun contrôle de schéma d'URL** — `GlobalOverlay.jsx` (grille certificats, ligne ~460) et `<a href={content.url}>`. Gravité : **moyenne** (reverse tabnabbing ; `javascript:` passerait si une URL devenait dynamique). **CORRIGÉ** : helper `safeUrl()` (résolution `new URL`, http/https uniquement, sinon `#`) + `window.open(..., 'noopener,noreferrer')`.
- **F3 — Formulaire contact sans honeypot/anti-spam** — `src/components/canvas/rooms/Contact/MessagePaper.jsx`. Gravité : **moyenne** (les inputs cachés sont de vrais éléments DOM hors écran : les bots de remplissage automatique les trouvent). **CORRIGÉ** : checkbox `botcheck` hors écran/non focusable ; si remplie → succès simulé sans appel API ; `botcheck: false` ajouté au payload (convention Web3Forms côté serveur).
- **F4 — Pas de garde anti double-envoi** — `MessagePaper.jsx` : cliquer « ENVOYER » pendant un envoi en vol déclenchait N requêtes parallèles. Gravité : **faible**. **CORRIGÉ** : early-return si `isSubmitting`.
- **F5 — Sujet transmis tel quel vers l'en-tête du mail** — `MessagePaper.jsx`. Gravité : **faible** (défense en profondeur : input single-line, mais rien ne garantissait l'absence de `\r\n` côté état). **CORRIGÉ** : strip `[\r\n]` + trim des trois champs avant envoi.
- **RAS P1** : aucun `dangerouslySetInnerHTML`/`innerHTML`/`eval`/`new Function` dans `src/` ; `?perf` lu en booléen via `URLSearchParams.has()` (pas de réflexion) ; pas de react-router (aucun segment d'URL rendu) ; messages d'erreur du formulaire = chaînes statiques françaises (pas de réflexion d'input) ; saisies rendues via troika `<Text>` (glyphes WebGL, pas d'interprétation HTML) ; `index.html` sans script dynamique (JSON-LD statique).

Vérification : `npm run build` OK, 49/49 tests verts.
