# FINDINGS — Audit sécurité final (portfolio-itom / Hakkilo XR)

Audit « zero-day » complet (passes P1–P6, détail dans `JOURNAL.md`), mené sur la branche
`claude/audit-secu-finale-i0yidy` (base `feature/mini-ville`). Périmètre : injection/XSS,
secrets & historique git, supply chain npm, headers/CSP Cloudflare Pages, CI GitHub,
logique client abusable. Après correctifs : `npm run build` OK, 49/49 tests verts,
`npm audit` 0 vulnérabilité, CSP validée dynamiquement sous Chromium (0 violation, scène 3D incluse).

## Synthèse par gravité

| ID | Gravité | Faille | Localisation | Statut | Commit |
|----|---------|--------|--------------|--------|--------|
| F1 | Moyenne | Sink XSS latent : GSAP TextPlugin écrit la description d'overlay via `innerHTML` | `src/components/ui/GlobalOverlay.jsx` | ✅ Corrigé (échappement HTML avant tween) | `6eed45c` |
| F2 | Moyenne | `window.open` sans `noopener` + URLs de contenu sans contrôle de schéma (`javascript:` passerait) | `GlobalOverlay.jsx` (grille + lien d'action) | ✅ Corrigé (`safeUrl()` http/https + `noopener,noreferrer`) | `6eed45c` |
| F3 | Moyenne | Formulaire contact sans honeypot anti-spam (inputs DOM réels hors écran, remplissables par bots) | `src/components/canvas/rooms/Contact/MessagePaper.jsx` | ✅ Corrigé (checkbox `botcheck`, succès simulé si remplie, `botcheck:false` au payload Web3Forms) | `6eed45c` |
| F9 | Moyenne | 3 dépendances runtime fantômes (`@gsap/react`, `react-router-dom`, `vara`) = surface supply-chain inutile ; `@types/three` en prod | `package.json` / lockfile | ✅ Corrigé (retrait + reclassement devDeps, lockfile régénéré) | `6085d50` |
| F12 | Moyenne | 5 × `window.open(url,'_blank')` sans `noopener` ni filtre de schéma | `GalleryRoom.jsx` (1), `ContactRoom.jsx` (4) | ✅ Corrigé (`src/utils/safeOpen.js` + remplacement des appels) | `f4b9177` |
| F4 | Faible | Pas de garde anti double-envoi (N requêtes parallèles possibles) | `MessagePaper.jsx` | ✅ Corrigé (early-return si `isSubmitting`) | `6eed45c` |
| F5 | Faible | Sujet transmis brut vers l'en-tête du mail (défense en profondeur injection d'en-têtes) | `MessagePaper.jsx` | ✅ Corrigé (strip `\r\n` + trim) | `6eed45c` |
| F6 | Faible | Clé Web3Forms de l'auteur du template extractible de l'historique git (`2a4d11a`) | historique git | 📋 Documenté — réécriture d'historique = décision EM ; clé déjà publique dans le repo d'origine ; alternative : signalement à Web3Forms pour révocation | — |
| F10 | Faible | `Permissions-Policy` limitée à camera/mic/geolocation | `public/_headers` | ✅ Corrigé (9 directives ajoutées ; accelerometer/gyroscope conservés `self` pour la parallaxe mobile) | `81fec31` |
| F11 | Faible | Actions CI référencées par tag mutable (`@v4`) | `.github/workflows/ci.yml` | ✅ Corrigé (épinglage SHA vérifié par `git ls-remote` + dependabot `github-actions`) | `5be58bc` |
| F13 | Faible | Achievements localStorage non validés (`__proto__`/`constructor` passaient le check hérité) | `src/context/AchievementsContext.jsx` | ✅ Corrigé (`Array.isArray` + `Object.hasOwn`) | `f4b9177` |
| F7 | Info | Clé publique PostHog de l'auteur dans l'historique git | historique git | 📋 Documenté (token public par design, projet de l'auteur) | — |
| F8 | Info | Tokens `google-site-verification` de l'auteur dans l'historique | historique git | 📋 Documenté (inexploitables non servis) | — |

**Bilan : 13 findings — 10 corrigés sur la branche, 3 findings d'historique git documentés**
(F6–F8 : le seul remède réel est `git filter-repo` + force-push global, opération destructive
laissée à l'arbitrage de l'Engineering Manager ; risque résiduel faible car ces clés
appartiennent à l'auteur du template et sont déjà publiques dans son propre dépôt).

## Décisions & notes d'architecture

- **`form-action` reste `'self'`** (et non « web3forms uniquement ») : l'envoi part en `fetch()`
  — gouverné par `connect-src` qui liste déjà `api.web3forms.com` ; aucun `<form>` natif
  n'existe. Élargir `form-action` ouvrirait un chemin d'exfiltration pour du markup injecté.
- **`accelerometer`/`gyroscope` restent autorisés (`self`)** : `deviceorientation` alimente la
  parallaxe/caméra mobile (`useParallax.js`, `useInfiniteCamera.js`) — les bloquer casserait le
  site mobile-first.
- **⚠ Branche `web/03-safeopen` périmée** : elle contient le même `safeOpen.js` (repris ici à
  l'identique) mais re-angliciserait la copie française si mergée telle quelle
  (MessagePaper, RoomInterior, AchievementsPanel). À rebaser ou abandonner.
- **Bumps majeurs NON appliqués** (règle d'audit) : vite 7→8 (branche dependabot), @eslint/js
  9→10, globals 16→17.
- **Recommandations restantes (décision client/EM)** : HSTS `preload` (hstspreload.org) une fois
  le domaine définitif confirmé ; révocation des clés du template (F6/F7) par courtoisie envers
  l'auteur original.

## Vérifications

- `npm run build` ✅ (après chaque commit de fix)
- `npm test` : 49/49 ✅ (après chaque commit de fix)
- `npm audit` : 0 vulnérabilité ✅
- Validation dynamique CSP : `dist/` servi avec les headers réels de `_headers`, chargé dans
  Chromium headless (WebGL SwiftShader) — scène 3D démarrée, 0 violation CSP, seule requête
  externe = fonts.googleapis.com (autorisée).
- Invariants respectés : forme `overlayContent`/`openOverlay` inchangée, caméra d'entrée de
  salle intouchée, mapping `label`→salle intouché, tiers `PerformanceContext` intouchés.
