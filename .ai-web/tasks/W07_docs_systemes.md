# W07 — Documentation des systèmes + JSDoc

Branche : `web/07-docs` (depuis `feature/mini-ville`) → PR vers `feature/mini-ville`.
Lire `CLAUDE.md` (racine) avant tout. **Contrainte absolue : ZÉRO changement de comportement**
(le diff ne contient que des commentaires et des fichiers docs).

## Objectif
Plusieurs agents (sessions web, agents locaux, prototypage design) travaillent sur ce dépôt sans
contexte partagé. Documenter les systèmes cœur pour réduire les erreurs d'intégration.

## Instructions
1. `docs/systems.md` — pour chaque système, décrire d'après une LECTURE RÉELLE du code (pas de
   supposition) : rôle, API publique, contrats/invariants, pièges :
   - `SceneContext.jsx` : machine d'états salle courante / overlay (`overlayContent`,
     `openOverlay`) / téléportation / `isInRoom` / états ville (`villeTheme`, `villeNavMode`).
   - `PerformanceContext.jsx` : tiers HIGH/MEDIUM/LOW, `settings`, comment un composant doit les
     consommer.
   - Pipeline d'entrée de salle : `CorridorSegment` (labels) → `DoorSection` (propriété caméra
     pendant l'entrée) → `RoomInterior` ; et côté ville `VILLE_BUILDINGS` → `teleportTo(roomId)`.
   - `useVilleControls.js` : modes guide/libre, entrées tactiles.
   - `villeConfig.js` : source de vérité (flag, bâtiments, waypoints, day/night).
   - `analytics.js` + `ConsentBanner` : contrat de consentement RGPD.
2. JSDoc sur les **exports publics** de ces mêmes fichiers : signature, params, retour, invariants
   (« additive changes only », « ne pas appeler avant X »…). Commentaires en anglais, concis.
3. Mentionner les pièges connus documentés dans CLAUDE.md (ex. `texSkyline` = objet
   `{map, emissiveMap}`) au bon endroit dans la JSDoc.
4. Si tu découvres une incohérence réelle entre code et comportement supposé : la NOTER dans la PR,
   ne pas la « corriger ».

## Critère de fin
`npm run build` OK ; diff strictement commentaires + `docs/` ; `docs/systems.md` complet et exact
(vérifiable en lisant le code en face).
