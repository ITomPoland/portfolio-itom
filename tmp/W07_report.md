# Rapport W07 — Documentation des systèmes + JSDoc

## Résumé des travaux
Rédaction de la documentation complète d'architecture des systèmes cœur dans `docs/systems.md` et ajout de commentaires JSDoc détaillés en anglais sur tous les exports publics des fichiers systèmes ciblés.

---

## 1. Documentation d'architecture (`docs/systems.md`)
Le fichier `docs/systems.md` a été créé pour documenter en français les 5 domaines clés de l'application :
1. **`SceneContext.jsx`** : Machine d'états globale (`currentRoom`, `isInRoom`, `overlayContent`, `exitRequested`, `villeNavMode`, `villeTheme`), gestion de la pile d'actions et étapes du cycle de téléportation.
2. **`PerformanceContext.jsx`** : Tiers `HIGH`, `MEDIUM`, `LOW`, grille de réglages (DPR, ombres, antialiasing, particules) et stratégie d'auto-détection + dégradation réactive.
3. **`Pipeline d'Entrée de Salle`** :
   - Circuit Couloir Infini : `CorridorSegment` -> `DoorSection` (propriété caméra exclusive lors du vol d'entrée) -> `RoomInterior` (vestibule 3D + chargement lazy `<Suspense>` des pièces).
   - Circuit Mini-Ville : mapping `VILLE_BUILDINGS` vers `roomId` -> déclenchement `teleportTo` -> animation rideau papier + clic automatique.
4. **`Mini-Ville & Contrôles`** (`villeConfig.js` & `useVilleControls.js`) :
   - Source de vérité unique pour la mini-ville (`VILLE_MODE`, positions des 6 bâtiments, FOV adaptatif portrait mobile).
   - Hook `useVilleControls` à deux modes (`'guide'` pour le tour sur rail et `'libre'` pour la marche libre).
5. **`Analytics & Consentement RGPD`** (`analytics.js` + `ConsentBanner.jsx`) :
   - Architecture opt-in CNIL/RGPD stricte avec `opt_out_capturing_by_default: true`.

---

## 2. JSDoc des exports publics
Des annotations JSDoc claires et concises ont été ajoutées sur les exports publics des 9 fichiers suivants :
- `src/context/SceneContext.jsx` (`useScene`, `SceneProvider`)
- `src/context/PerformanceContext.jsx` (`TIERS`, `usePerformance`, `PerformanceProvider`)
- `src/components/canvas/corridor/CorridorSegment.jsx` (`SEGMENT_LENGTH`, `WALL_X_OUTER`, `WALL_X_INNER`, `DOOR_Z_SPAN`, `CorridorSegment`)
- `src/components/canvas/corridor/DoorSection.jsx` (`DoorSection`)
- `src/components/canvas/corridor/RoomInterior.jsx` (`RoomInterior`)
- `src/components/canvas/ville/villeConfig.js` (Toutes les constantes de configuration, la liste `VILLE_BUILDINGS`, `getStoredVilleTheme`, `portraitFovFor`, etc.)
- `src/hooks/useVilleControls.js` (`useVilleControls`)
- `src/utils/analytics.js` (`CONSENT_STORAGE_KEY`, `analyticsEnabled`, `getConsent`, `initAnalytics`, `grantConsent`, `denyConsent`)
- `src/components/ui/ConsentBanner.jsx` (`ConsentBanner`)

---

## 3. Incohérences ou remarques identifiées lors de la lecture
- **Structure du retour de `makeVilleTextures()`** : Comme documenté dans `CLAUDE.md`, la fonction `makeVilleTextures()` (dans `VilleDecor.jsx`) retourne pour `texSkyline` un objet `{ map, emissiveMap }` et non une `THREE.Texture` directe. Cette spécificité a été formellement rappelée dans la JSDoc de `villeConfig.js`.
- **Alignement FOV Portrait / Paysage** : `portraitFovFor(aspect)` compense le ratio vertical sur smartphone pour conserver un FOV horizontal constant (60° -> jusqu'à 92°).
- **Fichiers épargnés** : Conformément aux instructions, `VilleDecor.jsx` et `VilleScenery.jsx` n'ont pas été modifiés.

---

## 4. Bilan de validation
- **Diff strict** : Contient uniquement le fichier `docs/systems.md` et des commentaires JSDoc. Zéro changement de comportement runtime.
- **Build & Tests** : `npm run build` réussi, 54/54 tests Vitest validés.
