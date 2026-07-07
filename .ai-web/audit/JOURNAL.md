# JOURNAL — Audit sécurité final (portfolio-itom)

Branche de travail : `claude/audit-secu-finale-i0yidy` (depuis `feature/mini-ville`).
Protocole : après chaque faille trouvée / corrigée → mise à jour de ce journal + commit + push immédiat.
Une passe terminée = checkbox cochée + push (même si RAS).

## Passes

- [x] **P1 — Injection/XSS** : `dangerouslySetInnerHTML`, `innerHTML`, `eval`/`new Function`, réflexion de paramètres d'URL, contenu utilisateur dans le DOM ou textures/sprites Three.js. Focus formulaire contact `MessagePaper.jsx` (validation, web3forms, honeypot, messages d'erreur). → 5 findings (F1–F5), tous corrigés.
- [x] **P2 — Secrets & fuites** : scan code + historique git, `.env` commités, sourcemaps prod, clés en dur (dont trace résiduelle de la clé Web3Forms du template). → 3 findings d'historique (F6–F8), documentés (réécriture d'historique = décision Engineering Manager).
- [x] **P3 — Dépendances & supply chain** : `npm audit`, CVE three/react/vite, scripts d'install suspects, dépendances fantômes. Bumps mineurs/patch uniquement. → F9 corrigé (dépendances fantômes retirées), majors documentés.
- [x] **P4 — Headers & CSP** : complétude CSP (`frame-ancestors`, `object-src`, `base-uri`, `form-action`), `X-Content-Type-Options`, `Referrer-Policy`, `Permissions-Policy`. Cible Cloudflare Pages (`_headers`). → F10 corrigé (Permissions-Policy étendue), CSP validée dynamiquement sous Chromium : 0 violation.
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

Vérification : `npm run build` OK, 49/49 tests verts. Commit fixes P1 : `6eed45c`.

### P2 — Secrets & fuites

- **F6 — Clé Web3Forms de l'auteur du template toujours dans l'historique git** — introduite par `2a4d11a` (`const WEB3FORMS_KEY = '2ceaee50-a31e-4936-98fc-ca9648b21cdd'`), retirée de l'arbre par `188f2a1` mais extractible via `git log -S`. Gravité : **faible** (la clé appartient à l'auteur original et est déjà publique dans SON repo de template ; l'abus possible = spam de SA boîte mail, pas de celle d'Hakkilo). **NON CORRIGÉ (documenté)** : le seul vrai fix est une réécriture d'historique (`git filter-repo`) + force-push de toutes les branches — opération destructive à décider par l'Engineering Manager, faible bénéfice ici. Alternative zéro-risque : signaler la clé à l'auteur/Web3Forms pour révocation.
- **F7 — Clé publique PostHog de l'auteur dans l'historique** — `phc_WHnLrkRaCRM9jr9EfbjhC09me4DY0vH5Yx2K4rshkdQ`, introduite par `37a2ebd`, retirée de l'arbre par `d72303e`. Gravité : **info** (token public par design, projet PostHog de l'auteur). Même remède que F6 si souhaité.
- **F8 — Tokens `google-site-verification` de l'auteur dans l'historique** — retirés de l'arbre par `d72303e`. Gravité : **info** (inexploitables dès lors qu'ils ne sont plus servis sur le domaine).
- **RAS P2** : aucun `.env` commité (seul `.env.example`, valeurs vides, `.gitignore` correct avec `.env`/`.env.*`) ; aucune clé en dur dans l'arbre actuel (scan motifs + entropie) ; pas de sourcemaps en build prod (`vite.config.js` sans `build.sourcemap`, aucun `.map` dans `dist/`) ; pas d'emails tiers dans les diffs ; `tmp/` (rapports d'audit assets) sans secret ; `robots.txt`/`sitemap.xml` propres ; le bundle ne référence que `VITE_WEB3FORMS_KEY`/`VITE_POSTHOG_KEY` via env. Note : `server.host: true` (vite dev) expose le serveur de dev sur le LAN — assumé/documenté, sans impact prod.

### P3 — Dépendances & supply chain

- **F9 — Dépendances runtime fantômes = surface supply-chain inutile** — `@gsap/react`, `react-router-dom`, `vara` déclarées en `dependencies` mais jamais importées ; `@types/three` (types) classé en prod. Gravité : **moyenne** (chaque paquet inutile est installé à chaque `npm ci`, ses mises à jour compromises seraient exécutées en postinstall/bundle). **CORRIGÉ** : retrait des 3 paquets + `@types/three` déplacé en devDependencies, lockfile régénéré. Build + 49 tests verts, `npm audit` 0 vulnérabilité.
- **RAS P3** : `npm audit` = 0 vulnérabilité ; scripts d'install du lockfile tous légitimes (`esbuild`, `sharp`, `fsevents`, `@parcel/watcher` en dev ; `core-js` via posthog-js en prod — banner standard) ; versions récentes sans CVE connue applicable (three 0.182.0, vite 7.3.6 — les advisories Vite récentes ne touchent que le dev server, react 19.2.3, posthog-js 1.396.6 ≥ que le bump dependabot 1.364.1) ; lockfile 100 % résolu sur registry.npmjs.org avec integrity sha512, aucune dépendance git/tarball.
- **Bumps MAJEURS disponibles, NON appliqués (règle : documenter seulement)** : vite 7→8 (branche dependabot `vite-8.0.3`), @eslint/js 9→10, globals 16→17. À arbitrer par l'Engineering Manager hors audit.

Commit fix P3 : `6085d50`.

### P4 — Headers & CSP

- **F10 — `Permissions-Policy` trop courte** — `public/_headers` ne bloquait que camera/microphone/geolocation. Gravité : **faible** (défense en profondeur — pas d'iframe tierce possible, `frame-ancestors 'none'`). **CORRIGÉ** : ajout de `payment`, `usb`, `midi`, `serial`, `bluetooth`, `display-capture`, `magnetometer`, `xr-spatial-tracking`, `browsing-topics` (tous refusés) ; `accelerometer=(self)` et `gyroscope=(self)` conservés car `deviceorientation` alimente la parallaxe/caméra mobile (`useParallax.js`, `useInfiniteCamera.js`) — les bloquer casserait le site mobile-first.
- **Décision documentée — `form-action` reste `'self'`** (le prompt d'audit suggérait « vers web3forms uniquement ») : le formulaire part en `fetch()` (gouverné par `connect-src`, qui liste déjà api.web3forms.com), il n'existe AUCUN `<form>` natif ; élargir `form-action` à web3forms ouvrirait au contraire un chemin d'exfiltration pour du markup `<form>` injecté. Plus strict tel quel.
- **RAS P4** : CSP complète et justifiée ligne à ligne (`frame-ancestors 'none'` ✓, `object-src 'none'` ✓, `base-uri 'self'` ✓, `default-src 'self'`, pas de `unsafe-inline`/`unsafe-eval` script) ; `X-Content-Type-Options: nosniff` ✓, `Referrer-Policy: strict-origin-when-cross-origin` ✓, `HSTS` ✓, `X-Frame-Options: DENY` ✓, `COOP: same-origin` ✓ ; cache immutable uniquement sur assets hashés (HTML non concerné).
- **Validation dynamique (nouveau)** : `dist/` servi localement avec les headers réels de `_headers`, chargé dans Chromium headless (WebGL SwiftShader) : scène 3D démarrée, textures GLB via `blob:` et worker troika fonctionnels, **0 violation CSP** (event `securitypolicyviolation` + console), seule requête externe = fonts.googleapis.com (autorisée). La Permissions-Policy étendue est acceptée sans warning.
- **Recommandation (non appliquée, décision client)** : candidater à la liste HSTS preload (`preload` + hstspreload.org) une fois le domaine définitif confirmé.
