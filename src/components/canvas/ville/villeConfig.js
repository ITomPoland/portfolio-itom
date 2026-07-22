// villeConfig.js — Data contract for the Mini Ville XR exterior.
//
// Single source of truth for: the ville/corridor toggle, the camera spawn, the hero-building
// placements + door→room mapping, and movement/day-night tuning. The heavy scene geometry and
// textures are transcribed by agy from the Claude Design prototype against the interfaces
// documented here — positions, rotations and room mapping live ONLY in this file so the port
// stays consistent.

// villeConfig.js — Data contract for the Mini Ville XR exterior.
//
// Single source of truth for: the ville/corridor toggle, the camera spawn, the hero-building
// placements + door→room mapping, and movement/day-night tuning. The heavy scene geometry and
// textures are transcribed by agy from the Claude Design prototype against the interfaces
// documented here — positions, rotations and room mapping live ONLY in this file so the port
// stays consistent.

/**
 * Global toggle for mini-ville exterior mode. Set false to fallback to infinite corridor.
 * @type {boolean}
 */
export const VILLE_MODE = true;

/**
 * Default spawn position and orientation for the mini-ville camera.
 * @type {{ position: [number, number, number], yaw: number, pitch: number }}
 */
export const VILLE_SPAWN = { position: [0, 1.7, 52], yaw: 0, pitch: 0 };

/**
 * Walkable boundary distance from world origin (square bounds ±55u).
 * @type {number}
 */
export const VILLE_BOUNDS = 55;

/**
 * Eye-level Y height in meters for camera in mini-ville (1.7m).
 * @type {number}
 */
export const VILLE_EYE_Y = 1.7;

/**
 * Walking speed in meters per second.
 * @type {number}
 */
export const VILLE_WALK_SPEED = 7;

/**
 * Running speed (Shift) in meters per second.
 * @type {number}
 */
export const VILLE_RUN_SPEED = 14;

/**
 * Keyboard turn speed in radians per second (Q/D yaw).
 * @type {number}
 */
export const VILLE_TURN_SPEED = 2.4;

/**
 * Mouse-drag yaw look sensitivity.
 * @type {number}
 */
export const VILLE_LOOK_SENSITIVITY = 3.2;

/**
 * Mouse-drag pitch look sensitivity.
 * @type {number}
 */
export const VILLE_PITCH_SENSITIVITY = 2.2;

/**
 * Maximum pitch clamp angle in radians.
 * @type {number}
 */
export const VILLE_PITCH_CLAMP = 1.2;

/**
 * Array of hero building definitions in the mini-ville plaza.
 * Maps building IDs to portfolio-itom room IDs (`roomId`) and guided tour text (`info`).
 *
 * KNOWN TRAP / INVARIANT:
 * `texSkyline` returned by `makeVilleTextures()` is an OBJECT `{ map, emissiveMap }`,
 * NOT a single THREE.Texture instance.
 *
 * @type {Array<{ id: string, position: [number, number, number], rotationY: number, roomId: string|null, label: string, info: { title: string, body: string } }>}
 */
export const VILLE_BUILDINGS = [
    {
        id: 'hall', position: [0, 0, 0], rotationY: 0, roomId: null, teaser: 'hall', label: 'HAKKILO XR', collider: 7,
        // The tour circles the plaza at ~22 m from the hall → needs a wider trigger than default.
        infoRadius: 24,
        info: {
            title: 'Hall Hakkilo XR',
            body: "Bienvenue au cœur de notre campus virtuel. Ce hall central incarne Hakkilo XR, studio dédié aux expériences de réalité étendue. Laissez-vous guider : chaque bâtiment de la place vous présente une facette de notre activité.",
        },
    },
    {
        id: 'studio', position: [-26, 0, -26], rotationY: Math.PI * 0.75, roomId: 'studio', label: 'LE STUDIO', collider: 8,
        info: {
            title: 'Le Studio — Boutique & Exposition',
            body: "Notre vitrine matérielle : casques, lunettes, contrôleurs et outils de capture que nous utilisons au quotidien. Entrez pour manipuler chaque produit en 3D et demander une démonstration.",
        },
    },
    {
        id: 'presa', position: [26, 0, -26], rotationY: -Math.PI * 0.75, roomId: 'about', label: 'PRÉSENTATION', collider: 7,
        info: {
            title: 'Présentation',
            body: "Qui se cache derrière Hakkilo XR ? Ce pavillon raconte notre équipe, notre démarche et notre vision de la réalité étendue au service des entreprises. Entrez pour faire connaissance.",
        },
    },
    {
        id: 'galerie', position: [-26, 0, 26], rotationY: Math.PI * 1.25, roomId: 'gallery', label: 'LA GALERIE', collider: 8.5,
        info: {
            title: 'La Galerie',
            body: "Notre espace d'exposition : projets clients, prototypes et expériences immersives réalisés par le studio. Entrez pour parcourir nos travaux.",
        },
    },
    {
        id: 'contact', position: [26, 0, 26], rotationY: Math.PI * 0.25, roomId: 'contact', label: 'CONTACT', collider: 5.5,
        info: {
            title: 'Contact',
            body: "Un projet, une question, l'envie d'une démonstration ? Ce bureau vous accueille. Entrez pour nous écrire — nous répondons rapidement.",
        },
    },
    {
        id: 'academie', position: [0, 0, -44], rotationY: 0, roomId: null, teaser: 'academie', label: "L'ACADÉMIE", collider: 9,
        info: {
            title: "L'Académie",
            body: "Notre futur espace de formation : ateliers pratiques et parcours d'initiation à la réalité étendue. Le bâtiment ouvre prochainement — la visite continue pendant les travaux.",
        },
    },
];

/**
 * Trigger radius in meters for guided-tour building info cards.
 * @type {number}
 */
export const VILLE_INFO_RADIUS = 16;

/**
 * Hysteresis re-arm distance in meters for info card popups.
 * @type {number}
 */
export const VILLE_INFO_REARM = 6;

/**
 * Checks if current local hour falls in night time (19:00 - 07:00).
 * @returns {boolean} True if local time is night.
 */
export const villeIsNightNow = () => {
    const h = new Date().getHours();
    return h >= 19 || h < 7;
};

/**
 * Interpolation rate for day/night sky transitions.
 * @type {number}
 */
export const VILLE_NIGHT_EASE = 2.2;

/**
 * LocalStorage key for persisting mini-ville theme preference ('auto'|'jour'|'nuit').
 * @type {string}
 */
export const VILLE_THEME_STORAGE_KEY = 'hakkilo-ville-theme';

/**
 * Retrieves the stored mini-ville theme preference from localStorage.
 * @returns {'auto' | 'jour' | 'nuit'} Stored theme or 'auto' fallback.
 */
export const getStoredVilleTheme = () => {
    try {
        const t = localStorage.getItem(VILLE_THEME_STORAGE_KEY);
        return t === 'jour' || t === 'nuit' ? t : 'auto';
    } catch {
        return 'auto'; // storage unavailable (private mode) → clock-driven
    }
};

/**
 * Calculates target night interpolation amount (0 for day, 1 for night) for a given theme.
 * @param {'auto' | 'jour' | 'nuit'} theme - Active theme setting.
 * @returns {number} Target night factor (0 or 1).
 */
export const villeNightTargetFor = (theme) =>
    theme === 'nuit' ? 1 : theme === 'jour' ? 0 : (villeIsNightNow() ? 1 : 0);

/**
 * Camera far clipping plane for mini-ville scene (600u).
 * @type {number}
 */
export const VILLE_CAMERA_FAR = 600;

/**
 * Base camera FOV in degrees (60°).
 * @type {number}
 */
export const CAMERA_BASE_FOV = 60; // keep in sync with the <Canvas camera> fov in App.jsx

/**
 * Maximum portrait camera FOV in degrees (92°).
 * @type {number}
 */
export const CAMERA_PORTRAIT_MAX_FOV = 92;

/**
 * Calculates responsive FOV based on screen aspect ratio to maintain horizontal field in portrait mode.
 * @param {number} aspect - Current viewport aspect ratio (width / height).
 * @returns {number} Calculated FOV in degrees clamped to CAMERA_PORTRAIT_MAX_FOV.
 */
export const portraitFovFor = (aspect) => {
    if (!(aspect > 0) || aspect >= 1) return CAMERA_BASE_FOV;
    const halfBase = (CAMERA_BASE_FOV * Math.PI) / 360;
    const fov = (Math.atan(Math.tan(halfBase) / aspect) * 360) / Math.PI;
    return Math.min(fov, CAMERA_PORTRAIT_MAX_FOV);
};

/**
 * Day fog color.
 * @type {string}
 */
export const VILLE_FOG_DAY = '#BFD9F2';

/**
 * Night fog color.
 * @type {string}
 */
export const VILLE_FOG_NIGHT = '#0D1220';

/**
 * Fog near distance in meters.
 * @type {number}
 */
export const VILLE_FOG_NEAR = 70;

/**
 * Fog far distance in meters.
 * @type {number}
 */
export const VILLE_FOG_FAR = 210;

/**
 * Base asset directory path for mini-ville 3D models and textures.
 * @type {string}
 */
export const VILLE_ASSET_BASE = '/ville-assets';

/**
 * Waypoints array defining the CatmullRom spline path for the guided tour.
 * @type {Array<[number, number, number]>}
 */
export const VILLE_TOUR_WAYPOINTS = [
    [0, 1.7, 52], [0, 1.7, 32], [-6, 1.7, 23], [-19, 1.7, 19], [-21, 1.7, 6], [-21, 1.7, -8],
    [-18, 1.7, -18], [-8, 1.7, -22], [-3, 1.7, -30], [0, 1.7, -37], [3, 1.7, -30], [8, 1.7, -22],
    [19, 1.7, -19], [21, 1.7, -6], [21, 1.7, 10], [19, 1.7, 19], [8, 1.7, 22], [0, 1.7, 30],
];

/**
 * CatmullRom spline tension parameter.
 * @type {number}
 */
export const VILLE_TOUR_TENSION = 0.3;

/**
 * Scroll wheel sensitivity for guided tour progress.
 * @type {number}
 */
export const VILLE_TOUR_SCROLL_SENS = 0.00012; // wheel deltaY → path progress

/**
 * Touch swipe sensitivity for guided tour progress.
 * @type {number}
 */
export const VILLE_TOUR_SWIPE_SENS = 1.1;       // touch vertical-drag fraction → path progress

