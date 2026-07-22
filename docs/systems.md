# Architecture & Documentation des Systèmes Cœur — Hakkilo XR

Ce document décrit le fonctionnement, les contrats d'interface, la gestion de l'état et les invariants des principaux systèmes applicatifs du projet **Hakkilo XR** (`portfolio-itom`).

---

## 1. SceneContext (`src/context/SceneContext.jsx`)

### Rôle
Machine d'états globale gérant l'état de la navigation, de l'affichage de l'overlay, de la téléportation entre les pièces/bâtiments, ainsi que les modes spécifiques de la mini-ville.

### État & Propriétés clés
- `currentRoom` (`string | null`) : Identifiant de la salle actuellement ouverte (`'studio'`, `'about'`, `'gallery'`, `'contact'`). `null` indique que l'utilisateur est dans le couloir infini ou dans la ville.
- `isInRoom` (`boolean`) : Booléen dérivé (`currentRoom !== null`).
- `overlayContent` (`ReactNode | object | null`) : Contenu de la fiche overlay 2D (utilisé par `GlobalOverlay.jsx` pour afficher les fiches produits ou biographies).
- `exitRequested` (`boolean`) : Signal envoyé aux composants de salle ou à `DoorSection` demandant la fermeture de la salle et la sortie.
- `villeNavMode` (`'guide' | 'libre'`) : Mode de navigation de la mini-ville (`'guide'` par défaut = visite guidée sur rail ; `'libre'` = déplacement libre).
- `villeTheme` (`'auto' | 'jour' | 'nuit'`) : Thème d'éclairage de la ville.
- `villeNearDoor` / `villeInfoCard` / `villeSelfie` : États d'interaction et de guidage dans la mini-ville.

### Cycle de téléportation
1. `teleportTo(roomId)` : Initialise la cible (`teleportTarget`), passe `isTeleporting` à `true`, `isFastTeleport` à `true`, et démarre la fermeture du rideau/papier (`teleportPhase = 'closing'`).
2. `startTeleportTransition()` : Passe la phase à `'teleporting'`. La caméra est déplacée vers la salle cible.
3. `openTeleportTransition()` : Déclenche l'ouverture du rideau (`teleportPhase = 'opening'`).
4. `completeTeleport()` : Définit `pendingDoorClick` pour simuler le clic automatique sur la porte de destination.
5. `signalRoomReady()` : Appelé par `DoorSection` une fois la caméra entrée dans la salle lors d'une téléportation rapide, ouvre la transition papier (`teleportPhase = 'opening'`).
6. `finishPaperOpen()` / `cancelTeleport()` : Réinitialise les phases de transition.

### Invariants & Contrats
- **Modifications additives uniquement** : la structure du state et les fonctions d'action ne doivent pas être supprimées ou renommées sans mettre à jour l'ensemble des consommateurs.
- `enterRoom(roomId)` nettoie automatiquement `overlayContent` et `exitRequested`.

---

## 2. PerformanceContext (`src/context/PerformanceContext.jsx`)

### Rôle
Fournit le niveau de performance courant (tier `HIGH`, `MEDIUM`, ou `LOW`) et ajuste dynamiquement la qualité du rendu Three.js (DPR, ombres, antialiasing, physique, particules).

### Tiers de performance & Configuration
| Paramètre | `HIGH` | `MEDIUM` | `LOW` |
| :--- | :--- | :--- | :--- |
| **DPR** | `[1, 2]` | `[1, 1.5]` | `[0.8, 1]` |
| **Shadows** | `true` | `false` | `false` |
| **Antialias** | `true` | `true` | `false` |
| **PowerPreference** | `"high-performance"` | `"default"` | `"low-power"` |
| **ParticleCount** | `1.0` (100%) | `0.6` (60%) | `0.3` (30%) |

### Auto-détection & Dégradation
- À l'initialisation, le contexte détecte si l'appareil est un mobile (`navigator.userAgent`), vérifie le nombre de cœurs CPU (`hardwareConcurrency <= 4`) et la mémoire RAM (`deviceMemory <= 4GB`).
- `PerformanceMonitor` (dans `App.jsx`) écoute le nombre de FPS en temps réel et appelle `downgradeTier()` en cas de baisse prolongée de framerate.

### Consommation par un composant
```jsx
const { tier, settings, downgradeTier } = usePerformance();
if (settings.shadows) {
  // Activer castShadow / receiveShadow
}
```

---

## 3. Pipeline d'Entrée de Salle & Téléportation

### Circuit Couloir Infini (`CorridorSegment` -> `DoorSection` -> `RoomInterior`)
1. **`CorridorSegment.jsx`** : Génère un segment de 80 unités du couloir et instancie 4 `DoorSection` associées à leurs labels (`THE GALLERY`, `THE STUDIO`, `THE ABOUT`, `LET'S CONNECT`).
2. **`DoorSection.jsx`** :
   - Gère le survol (effet de pinceau/reveal via shader `RevealMaterial`), l'inclinaison dynamique du mur selon la proximité du joueur, et les sons 3D positionnels (`PositionalAudio`).
   - **Propriété de la caméra** : lors du clic sur une porte, `DoorSection` prend le contrôle exclusif de la caméra (`setCameraOverride(true)`), aligne la vue face à la porte via GSAP, anime l'ouverture de la porte, puis fait voler la caméra à travers le vestibule.
   - **Important** : la pièce intérieure ne prend la main sur la caméra qu'une fois la transition terminée et `isInRoom === true` (déclenché par `enterRoom(roomId)`).
3. **`RoomInterior.jsx`** :
   - Construit le vestibule/sas 3D.
   - Monte le composant de salle correspondant (`StudioRoom`, `GalleryRoom`, etc.) sous `<Suspense>` lorsque `showRoom === true`.
   - Émet `onReady()` une fois les ressources de la salle chargées pour signaler à `DoorSection` qu'elle peut ouvrir la porte.

### Circuit Mini-Ville (`VILLE_BUILDINGS` -> `teleportTo`)
- `villeConfig.js` définit la liste `VILLE_BUILDINGS` associant chaque bâtiment de la ville à son `roomId` (ex: `studio`, `about`, `gallery`, `contact`).
- Lorsqu'un visiteur interagit avec un bâtiment dans la ville, `teleportTo(roomId)` est invoqué dans `SceneContext`.
- La transition d'écran `PaperTransition.jsx` se ferme, la caméra est positionnée dans le couloir à la porte correspondante, puis le clic de porte s'exécute automatiquement (`pendingDoorClick`).

---

## 4. Mini-Ville & Contrôles (`villeConfig.js` & `useVilleControls.js`)

### `villeConfig.js`
Source de vérité unique pour la mini-ville :
- `VILLE_MODE` (`boolean`) : Active ou désactive l'expérience extérieure de la mini-ville.
- `VILLE_SPAWN` / `VILLE_BOUNDS` / `VILLE_EYE_Y` : Position de départ, limites de déplacement (±55m), et hauteur des yeux (1,7m).
- `VILLE_BUILDINGS` : Tableau des 6 bâtiments (positions, rotations, colliders, infos guidées et `roomId`).
- `CAMERA_BASE_FOV` (60°) & `portraitFovFor(aspect)` : Ajustement dynamique du FOV en mode portrait mobile (jusqu'à 92°) pour conserver le champ de vision horizontal.
- **Piège connu avec les textures de ville** : la fonction `makeVilleTextures()` retourne pour `texSkyline` un objet `{ map, emissiveMap }` et **non** une instance unique de `THREE.Texture`.

### `useVilleControls.js`
Hook React gérant la caméra et les déplacements dans la ville selon deux modes :
- **Mode `'guide'` (par défaut)** : suivi automatique d'une courbe `CatmullRomCurve3` (`VILLE_TOUR_WAYPOINTS`). Le défilement molette ou le swipe vertical fait avancer la caméra sur la trajectoire, avec un décalage de regard amorti (spring).
- **Mode `'libre'`** : déplacement libre au clavier (Z/W/S, Q/A/D/flèches - où Q/D gèrent le virage yaw) ou via joystick tactile virtuel à gauche et drag à droite sur mobile.
- **Invariant** : lorsque `enabled === false` (pendant la visite d'une salle ou lors d'une téléportation), le hook désactive toutes ses mises à jour de caméra pour laisser le contrôle à `DoorSection`.

---

## 5. Analytics & Consentement RGPD (`analytics.js` + `ConsentBanner.jsx`)

### Principe & Conformité CNIL/RGPD
- Analytics propulsé par PostHog (`posthog-js`).
- `initAnalytics()` initialise PostHog avec `opt_out_capturing_by_default: true`.
- **Contrat absolu** : aucun suivi, aucune capture d'événement et aucun cookie analytics n'est créé tant que l'utilisateur n'a pas cliqué sur **Accepter** dans `ConsentBanner.jsx` (qui appelle `grantConsent()`).
- Le consentement accordé ou refusé est mémorisé dans `localStorage` sous la clé `'hakkilo_analytics_consent'`.
