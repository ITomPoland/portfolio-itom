import { useMemo, useRef, useEffect, useCallback, Suspense } from 'react';
import { useThree, useFrame } from '@react-three/fiber';
import * as THREE from 'three';
import useVilleControls from '../../../hooks/useVilleControls';
import { useScene } from '../../../context/SceneContext';
import { makeVilleTextures } from './villeTextures';
import VilleGround from './VilleGround';
import VilleBuildings from './VilleBuildings';
import VilleDecor from './VilleDecor';
import VilleScenery from './VilleScenery';
import VilleLife from './VilleLife';
import RootErrorBoundary from '../../dom/RootErrorBoundary';
import {
    VILLE_BUILDINGS,
    VILLE_CAMERA_FAR,
    VILLE_FOG_DAY,
    VILLE_FOG_NIGHT,
    VILLE_FOG_NEAR,
    VILLE_FOG_FAR,
    villeNightTargetFor,
    VILLE_NIGHT_EASE,
} from './villeConfig';

const DAY_SKY = new THREE.Color(VILLE_FOG_DAY);
const NIGHT_SKY = new THREE.Color(VILLE_FOG_NIGHT);
const DAY_SUN = new THREE.Color('#fff2dc');
const NIGHT_SUN = new THREE.Color('#39508f');

/**
 * MiniVille — the open-city EXTERIOR that replaces the infinite corridor (VILLE_MODE).
 *
 * Owns: camera far + fog + sky + day/night easing, the mobile-first free-walk controls
 * (useVilleControls), and building placeholders whose door click reuses the EXISTING
 * teleport-to-room flow. Contracts preserved:
 *   - markEntered() on mount (no entrance-door sequence in the city),
 *   - teleportTo(roomId) on door click → TeleportRoom / DoorSection keep room-entry ownership,
 *   - buildings without an interior yet (hall/academie) are non-interactive for now.
 *
 * Geometry lives in VilleGround (terrain/plaza/streets, agy 015) and VilleBuildings (hero
 * silhouettes + clickable doors, agy 016); both consume makeVilleTextures().
 */
export default function MiniVille() {
    const { scene, camera } = useThree();
    const { markEntered, teleportTo, isTeleporting, isInRoom, villeNavMode, villeTheme, setVilleNearDoor } = useScene();

    const textures = useMemo(() => makeVilleTextures(), []);
    const nightRef = useRef(villeNightTargetFor(villeTheme));
    const collidersRef = useRef([]);
    const sunRef = useRef();
    const hemiRef = useRef();
    const doorsRef = useRef(new Map());     // building.id → { building, x, z } (world door pos)
    const nearDoorIdRef = useRef(null);     // last id pushed to context (avoid per-frame setState)

    // DoorMarkers publish their world position here (walk-in "Entrer" prompt).
    const registerDoor = useCallback((building, x, z) => {
        doorsRef.current.set(building.id, { building, x, z });
        return () => doorsRef.current.delete(building.id);
    }, []);

    useVilleControls({ enabled: !isTeleporting && !isInRoom, mode: villeNavMode, collidersRef });

    // Enter the city immediately + take over camera far / fog / sky, and build colliders.
    useEffect(() => {
        markEntered();

        const prevFar = camera.far;
        camera.far = VILLE_CAMERA_FAR;
        camera.updateProjectionMatrix();

        const prevFog = scene.fog;
        const prevBg = scene.background;
        scene.fog = new THREE.Fog(VILLE_FOG_DAY, VILLE_FOG_NEAR, VILLE_FOG_FAR);
        scene.background = new THREE.Color(VILLE_FOG_DAY);

        collidersRef.current = VILLE_BUILDINGS.map((b) => ({ x: b.position[0], z: b.position[2], r: b.collider ?? 7 }));

        return () => {
            camera.far = prevFar;
            camera.updateProjectionMatrix();
            scene.fog = prevFog;
            scene.background = prevBg;
        };
    }, [camera, scene, markEntered]);

    // Day/night easing → sky / fog / sun / hemi. Target = theme override or local clock.
    useFrame((_, delta) => {
        const target = villeNightTargetFor(villeTheme);
        const n = nightRef.current + (target - nightRef.current) * Math.min(1, delta * VILLE_NIGHT_EASE);
        nightRef.current = n;

        if (scene.fog) scene.fog.color.copy(DAY_SKY).lerp(NIGHT_SKY, n);
        if (scene.background?.isColor) scene.background.copy(DAY_SKY).lerp(NIGHT_SKY, n);
        if (sunRef.current) {
            sunRef.current.intensity = THREE.MathUtils.lerp(2.2, 0.25, n);
            sunRef.current.color.copy(DAY_SUN).lerp(NIGHT_SUN, n);
        }
        if (hemiRef.current) hemiRef.current.intensity = THREE.MathUtils.lerp(0.85, 0.12, n);

        // Walk-in doors: nearest enterable door within 4 m → publish to context (only on change).
        let nearest = null;
        let nearestD2 = 16; // 4 m squared
        if (!isTeleporting && !isInRoom) {
            doorsRef.current.forEach((d) => {
                const dx = camera.position.x - d.x;
                const dz = camera.position.z - d.z;
                const d2 = dx * dx + dz * dz;
                if (d2 < nearestD2) { nearestD2 = d2; nearest = d.building; }
            });
        }
        const nearId = nearest ? nearest.id : null;
        if (nearId !== nearDoorIdRef.current) {
            nearDoorIdRef.current = nearId;
            setVilleNearDoor(nearest);
        }
    });

    const handleDoor = useCallback((building) => {
        if (building.roomId) teleportTo(building.roomId);
        // hall / academie: no interior yet → non-interactive (teaser overlay comes later).
    }, [teleportTo]);

    return (
        <group>
            <hemisphereLight ref={hemiRef} args={['#dfeaff', '#8a7a5c', 0.85]} />
            <directionalLight ref={sunRef} position={[38, 55, 22]} intensity={2.2} color="#fff2dc" />

            {/* Far horizon: grass / mountains / skyline / stars (agy 018) — isolated so a failure
                here can't blank the whole city */}
            <RootErrorBoundary label="VilleScenery" fallback={null}>
                <VilleScenery textures={textures} nightRef={nightRef} />
            </RootErrorBoundary>

            {/* Ground: full terrain / plaza / streets / sidewalks / markings (agy 015) */}
            <VilleGround textures={textures} nightRef={nightRef} />

            {/* Decor: surrounding buildings, trees, café, street lamps + night lights (agy 017).
                Shares THIS textures set — VilleDecor used to build a full duplicate. */}
            <RootErrorBoundary label="VilleDecor" fallback={null}>
                <Suspense fallback={null}>
                    <VilleDecor nightRef={nightRef} textures={textures} />
                </Suspense>
            </RootErrorBoundary>

            {/* Living ambiance: wandering bird + companion drone (standalone prototype port) */}
            <RootErrorBoundary label="VilleLife" fallback={null}>
                <VilleLife nightRef={nightRef} />
            </RootErrorBoundary>

            {/* Detailed hero buildings + clickable doors (agy 016) */}
            <VilleBuildings textures={textures} nightRef={nightRef} onDoorEnter={handleDoor} registerDoor={registerDoor} />
        </group>
    );
}
