# W08 — Lint : ~239 erreurs → 0 (À FAIRE EN DERNIER)

Branche : `web/08-lint-zero` (depuis `feature/mini-ville`) → PR vers `feature/mini-ville`.
Lire `CLAUDE.md` (racine) avant tout.

⚠️ **Cette tâche touche beaucoup de fichiers → la prendre EN DERNIER**, quand les PR W01–W07 sont
mergées, pour éviter les conflits.

## Objectif
`npm run lint` remonte ~239 erreurs préexistantes — principalement les règles strictes
react-hooks 7.x (`immutability`, `purity`…) déclenchées par du code R3F **légitime** (mutation
d'objets three.js dans `useFrame` = escape hatch standard de @react-three/fiber). Objectif :
lint à **zéro erreur** pour qu'il redevienne un vrai gate, SANS changer le comportement du site.

## Instructions
1. **Périmètre du lint d'abord** : dans `eslint.config.js`, exclure les non-sources
   (`dist/`, `tmp/`, `download/`, `prototype/`, `scripts/` si ce sont des scripts jetables —
   vérifier ce que chacun contient avant d'exclure). Relancer, noter le nouveau compte.
2. **Triage de chaque erreur restante**, trois issues possibles :
   - **Faux positif R3F** (mutation three.js en boucle de frame, refs mutées) →
     `eslint-disable-next-line` ou bloc, ciblé, avec **courte justification en commentaire**.
     Le pattern existe déjà dans `src/components/canvas/ville/VilleLife.jsx` — s'y conformer.
   - **Vrai problème corrigeable sans risque** (variable inutilisée, deps de hook manquantes SANS
     effet de bord au refix, etc.) → corriger, en vérifiant que le comportement observable est
     identique. En cas de doute sur une dep de hook : préférer le disable justifié au fix risqué.
   - **Vrai problème dont le fix changerait le comportement** → NE PAS fixer ; le lister dans la
     PR (fichier:ligne, nature, fix proposé) pour arbitrage par l'Engineering Manager.
3. **Interdit** : désactiver une règle GLOBALEMENT sans justification écrite dans la PR ;
   refactorer des composants pour « plaire » au lint ; toucher aux invariants (CLAUDE.md §2).
4. Après chaque paquet de fichiers : `npm run build` (et `npm test` si présent) pour vérifier
   qu'on n'a rien cassé. Commits par thème (exclusions / faux positifs / vrais fixes) pour une
   revue facile.

## Critère de fin
`npm run lint` = **0 erreur** ; `npm run build` OK ; `npm test` vert si présent ; PR listant :
règles/fichiers exclus + pourquoi, nombre de disables justifiés, vrais fixes, et les cas laissés
à l'arbitrage.
