import { useMemo, useRef, useEffect, useCallback } from 'react';
import { useThree, useFrame } from '@react-three/fiber';
import * as THREE from 'three';
import useVilleControls from '../../../hooks/useVilleControls';
import { useScene } from '../../../context/SceneContext';
import { makeVilleTextures } from './villeTextures';
import VilleGround from './VilleGround';
import VilleBuildings from './VilleBuildings';
import {
    VILLE_BUILDINGS,
    VILLE_CAMERA_FAR,
    VILLE_FOG_DAY,
    VILLE_FOG_NIGHT,
    VILLE_FOG_NEAR,
    VILLE_FOG_FAR,
    villeIsNightNow,
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
    const { markEntered, teleportTo, isTeleporting, isInRoom } = useScene();

    const textures = useMemo(() => makeVilleTextures(), []);
    const nightRef = useRef(villeIsNightNow() ? 1 : 0);
    const collidersRef = useRef([]);
    const sunRef = useRef();
    const hemiRef = useRef();

    useVilleControls({ enabled: !isTeleporting && !isInRoom, collidersRef });

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

        collidersRef.current = VILLE_BUILDINGS.map((b) => ({ x: b.position[0], z: b.position[2], r: 7 }));

        return () => {
            camera.far = prevFar;
            camera.updateProjectionMatrix();
            scene.fog = prevFog;
            scene.background = prevBg;
        };
    }, [camera, scene, markEntered]);

    // Day/night easing → sky / fog / sun / hemi.
    useFrame((_, delta) => {
        const target = villeIsNightNow() ? 1 : 0;
        const n = nightRef.current + (target - nightRef.current) * Math.min(1, delta * VILLE_NIGHT_EASE);
        nightRef.current = n;

        if (scene.fog) scene.fog.color.copy(DAY_SKY).lerp(NIGHT_SKY, n);
        if (scene.background?.isColor) scene.background.copy(DAY_SKY).lerp(NIGHT_SKY, n);
        if (sunRef.current) {
            sunRef.current.intensity = THREE.MathUtils.lerp(2.2, 0.25, n);
            sunRef.current.color.copy(DAY_SUN).lerp(NIGHT_SUN, n);
        }
        if (hemiRef.current) hemiRef.current.intensity = THREE.MathUtils.lerp(0.85, 0.12, n);
    });

    const handleDoor = useCallback((building) => {
        if (building.roomId) teleportTo(building.roomId);
        // hall / academie: no interior yet → non-interactive (teaser overlay comes later).
    }, [teleportTo]);

    return (
        <group>
            <hemisphereLight ref={hemiRef} args={['#dfeaff', '#8a7a5c', 0.85]} />
            <directionalLight ref={sunRef} position={[38, 55, 22]} intensity={2.2} color="#fff2dc" />

            {/* Ground: full terrain / plaza / streets / sidewalks / markings (agy 015) */}
            <VilleGround textures={textures} nightRef={nightRef} />

            {/* Detailed hero buildings + clickable doors (agy 016) */}
            <VilleBuildings textures={textures} nightRef={nightRef} onDoorEnter={handleDoor} />
        </group>
    );
}
