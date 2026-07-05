import { useMemo, useRef, useEffect, useCallback } from 'react';
import { useThree, useFrame } from '@react-three/fiber';
import * as THREE from 'three';
import useVilleControls from '../../../hooks/useVilleControls';
import { useScene } from '../../../context/SceneContext';
import { makeVilleTextures } from './villeTextures';
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
 * Placeholder geometry (ground + boxes) is intentionally minimal — agy tasks 015/016 replace it
 * with the full terrain and detailed building meshes (both consume makeVilleTextures()).
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

            {/* Ground (placeholder — agy 015 replaces with terrain/plaza/streets/decor) */}
            <mesh rotation={[-Math.PI / 2, 0, 0]}>
                <planeGeometry args={[560, 560]} />
                <meshStandardMaterial map={textures.texTerre} roughness={1} />
            </mesh>
            <mesh rotation={[-Math.PI / 2, 0, 0]} position={[0, 0.02, 0]}>
                <circleGeometry args={[19, 48]} />
                <meshStandardMaterial map={textures.texPaves} roughness={0.95} />
            </mesh>

            {/* Building placeholders + door triggers (agy 016 replaces with detailed silhouettes) */}
            {VILLE_BUILDINGS.map((b) => (
                <group key={b.id} position={b.position} rotation={[0, b.rotationY, 0]}>
                    <mesh position={[0, 5, 0]}>
                        <boxGeometry args={[11, 10, 11]} />
                        <meshStandardMaterial color={b.roomId ? '#b34a2a' : '#3554E8'} roughness={0.85} />
                    </mesh>
                    {b.roomId && (
                        <mesh
                            position={[0, 1.7, 5.6]}
                            onClick={(e) => { e.stopPropagation(); handleDoor(b); }}
                            onPointerOver={() => { document.body.style.cursor = 'pointer'; }}
                            onPointerOut={() => { document.body.style.cursor = 'default'; }}
                        >
                            <boxGeometry args={[2.6, 3.4, 0.5]} />
                            <meshStandardMaterial color="#121014" emissive="#3554E8" emissiveIntensity={0.5} />
                        </mesh>
                    )}
                </group>
            ))}
        </group>
    );
}
