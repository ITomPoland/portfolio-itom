// villeConfig.js — Data contract for the Mini Ville XR exterior.
//
// Single source of truth for: the ville/corridor toggle, the camera spawn, the hero-building
// placements + door→room mapping, and movement/day-night tuning. The heavy scene geometry and
// textures are transcribed by agy from the Claude Design prototype against the interfaces
// documented here — positions, rotations and room mapping live ONLY in this file so the port
// stays consistent.

// Flip to false to fall back to the original infinite-corridor exterior (kept intact during
// the migration so both experiences can coexist on this branch).
export const VILLE_MODE = true;

// Camera spawn — prototype starts a PerspectiveCamera at [0, 1.7, 52] facing the city (−Z).
export const VILLE_SPAWN = { position: [0, 1.7, 52], yaw: 0, pitch: 0 };

// Walkable bounds + eye height (prototype clamps position to ±55, y locked to 1.7).
export const VILLE_BOUNDS = 55;
export const VILLE_EYE_Y = 1.7;

// Movement tuning.
export const VILLE_WALK_SPEED = 7;          // m/s
export const VILLE_RUN_SPEED = 14;          // m/s (Shift)
export const VILLE_TURN_SPEED = 2.4;        // rad/s — keyboard yaw (Q/D). FIX: Q/D turn, not strafe.
export const VILLE_LOOK_SENSITIVITY = 3.2;  // mouse-drag yaw
export const VILLE_PITCH_SENSITIVITY = 2.2; // mouse-drag pitch
export const VILLE_PITCH_CLAMP = 1.2;       // rad

// Hero buildings. `roomId` = the existing portfolio-itom room to teleport into when the door is
// clicked (null = no interior yet → show a teaser overlay via `teaser`). Positions/rotations are
// world-space, straight from the prototype scene. The door trigger mesh is built by
// VilleBuildings (agy), which calls `onDoorEnter(roomId, id)` on click.
export const VILLE_BUILDINGS = [
    { id: 'hall',     position: [0, 0, 0],     rotationY: 0,               roomId: null,      teaser: 'hall',     label: 'HAKKILO XR',    collider: 7 },
    { id: 'studio',   position: [-26, 0, -26], rotationY: Math.PI * 0.75,  roomId: 'studio',  label: 'LE STUDIO',                        collider: 8 },
    { id: 'presa',    position: [26, 0, -26],  rotationY: -Math.PI * 0.75, roomId: 'about',   label: 'PRÉSENTATION',                     collider: 7 },
    { id: 'galerie',  position: [-26, 0, 26],  rotationY: Math.PI * 1.25,  roomId: 'gallery', label: 'LA GALERIE',                       collider: 8.5 },
    { id: 'contact',  position: [26, 0, 26],   rotationY: Math.PI * 0.25,  roomId: 'contact', label: 'CONTACT',                          collider: 5.5 },
    { id: 'academie', position: [0, 0, -44],   rotationY: 0,               roomId: null,      teaser: 'academie', label: "L'ACADÉMIE",   collider: 9 },
];

// Day/night — night when local hour ≥ 19 or < 7 (prototype `isNightNow`). `nightAmount` eases
// toward this target each frame at rate `dt * VILLE_NIGHT_EASE`.
export const villeIsNightNow = () => {
    const h = new Date().getHours();
    return h >= 19 || h < 7;
};
export const VILLE_NIGHT_EASE = 2.2;

// Theme override (demo toggle, prototype `themePref`): 'auto' follows the local clock,
// 'jour'/'nuit' force the cycle. Persisted under the prototype's own localStorage key.
export const VILLE_THEME_STORAGE_KEY = 'hakkilo-ville-theme';
export const getStoredVilleTheme = () => {
    try {
        const t = localStorage.getItem(VILLE_THEME_STORAGE_KEY);
        return t === 'jour' || t === 'nuit' ? t : 'auto';
    } catch {
        return 'auto'; // storage unavailable (private mode) → clock-driven
    }
};
export const villeNightTargetFor = (theme) =>
    theme === 'nuit' ? 1 : theme === 'jour' ? 0 : (villeIsNightNow() ? 1 : 0);

// Camera far plane the ville needs (mountains at r≈215, stars at r≈380). Corridor uses 150;
// MiniVille raises it on mount and restores it on unmount so App.jsx stays generic.
export const VILLE_CAMERA_FAR = 600;

// Fog (prototype): day #BFD9F2 near 70 / far 210, lerping to night #0D1220.
export const VILLE_FOG_DAY = '#BFD9F2';
export const VILLE_FOG_NIGHT = '#0D1220';
export const VILLE_FOG_NEAR = 70;
export const VILLE_FOG_FAR = 210;

// Asset base — agy copies the prototype's GLB/textures here (task 013).
export const VILLE_ASSET_BASE = '/ville-assets';

// Guided tour (mode 'guide' = DEFAULT): a CatmullRom spline through the city, advanced by
// scroll (desktop) / vertical swipe (mobile). 18 waypoints at eye height, faithful to the
// prototype — circles the central plaza and passes every building. Look-around is a damped offset.
export const VILLE_TOUR_WAYPOINTS = [
    [0, 1.7, 52], [0, 1.7, 32], [-6, 1.7, 23], [-19, 1.7, 19], [-21, 1.7, 6], [-21, 1.7, -8],
    [-18, 1.7, -18], [-8, 1.7, -22], [-3, 1.7, -30], [0, 1.7, -37], [3, 1.7, -30], [8, 1.7, -22],
    [19, 1.7, -19], [21, 1.7, -6], [21, 1.7, 10], [19, 1.7, 19], [8, 1.7, 22], [0, 1.7, 30],
];
export const VILLE_TOUR_TENSION = 0.3;
export const VILLE_TOUR_SCROLL_SENS = 0.00012; // wheel deltaY → path progress
export const VILLE_TOUR_SWIPE_SENS = 1.1;       // touch vertical-drag fraction → path progress
