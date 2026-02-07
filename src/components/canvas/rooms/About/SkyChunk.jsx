import { useMemo, useRef } from 'react';
import { useFrame, useThree, useLoader } from '@react-three/fiber';
import * as THREE from 'three';

/**
 * SkyChunk Component
 * 
 * A single repeatable segment of sky with clouds.
 * Clouds fade out smoothly when too close to camera.
 */
const CHUNK_LENGTH = 40;
const CHUNK_WIDTH = 20;
const CHUNK_HEIGHT = 12;

// === EDYTUJ TUTAJ: PARAMETRY ZNIKANIA CHMUR ===
// FADE_START_Z: Chmura zaczyna blednąć gdy jest bliżej niż ta odległość od kamery
// FADE_END_Z: Chmura jest całkowicie niewidoczna gdy jest bliżej niż ta odległość
const FADE_START_Z = -10;  // Zmniejsz (np. -15) żeby blednięcie zaczynało się wcześniej
const FADE_END_Z = -4;     // Zmniejsz (np. -6) żeby chmury znikały wcześniej

// === EDYTUJ TUTAJ: GRANICA KORYTARZA ===
// Chmury przed tą pozycją Z (w przestrzeni świata pokoju) są całkowicie ukryte
// Zapobiega "wyciekaniu" chmur na korytarz podczas wchodzenia/wychodzenia
// Większa wartość (np. -3) = chmury znikają wcześniej (bezpieczniej)
// Mniejsza wartość (np. -8) = chmury widoczne bliżej wejścia
const CORRIDOR_CLIP_Z = -8;

// Available cloud textures
const CLOUD_TEXTURES = [
    '/textures/clouds/1131c3eb-dfae-423f-924b-ff39d8ccd6dc.png',
    '/textures/clouds/254b8ec8-d6f7-4275-956f-7bab65b2ce2d.png',
    '/textures/clouds/2cc88dd1-483c-466d-b07e-f8308c61ccbe.png',
    '/textures/clouds/5606fcc0-3252-447d-a58a-7bcbac73229a.png',
    '/textures/clouds/7882dc72-3d01-41fb-ac0e-d07b0184ebc1.png',
    '/textures/clouds/9b2ca72f-7bd0-473b-ba6e-dd9e0eb79d35.png',
    '/textures/clouds/c83293c6-d90c-4a32-8d9d-5ac9af7e2296.png',
    '/textures/clouds/f6e358bc-d27c-41dd-95f4-6787a835c41e.png',
];

const SkyChunk = ({ chunkIndex = 0, seed = 0 }) => {
    const zOffset = -(chunkIndex * CHUNK_LENGTH) - 15;

    const clouds = useMemo(() => {
        const items = [];
        const random = seededRandom(seed + chunkIndex * 1000);
        const cloudCount = 6 + Math.floor(random() * 4);

        for (let i = 0; i < cloudCount; i++) {
            const x = (random() - 0.5) * CHUNK_WIDTH;
            const y = (random() - 0.5) * CHUNK_HEIGHT;
            const z = zOffset - (random() * CHUNK_LENGTH);

            items.push({
                id: `${chunkIndex}-${i}`,
                position: [x, y, z],
                scale: 0.8 + random() * 1.5,
                baseOpacity: 0.5 + random() * 0.4,
                textureIndex: Math.floor(random() * CLOUD_TEXTURES.length),
                // Animation properties - unique per cloud
                driftSpeed: 0.3 + random() * 0.4,  // How fast it sways
                driftAmount: 0.5 + random() * 1.0, // How far it sways (X)
                bobAmount: 0.1 + random() * 0.2,   // Vertical bob amount
                timeOffset: random() * Math.PI * 2, // Phase offset so clouds don't sync
            });
        }

        return items;
    }, [chunkIndex, seed, zOffset]);

    return (
        <group>
            {clouds.map((cloud) => (
                <Cloud
                    key={cloud.id}
                    position={cloud.position}
                    scale={cloud.scale}
                    baseOpacity={cloud.baseOpacity}
                    textureIndex={cloud.textureIndex}
                    driftSpeed={cloud.driftSpeed}
                    driftAmount={cloud.driftAmount}
                    bobAmount={cloud.bobAmount}
                    timeOffset={cloud.timeOffset}
                />
            ))}
        </group>
    );
};

// Cloud with SMOOTH dynamic fade and drift animation
const Cloud = ({
    position,
    scale,
    baseOpacity,
    textureIndex,
    driftSpeed = 0.5,
    driftAmount = 0.8,
    bobAmount = 0.15,
    timeOffset = 0
}) => {
    const meshRef = useRef();
    const materialRef = useRef();
    const { camera } = useThree();

    // Store base position for animation
    const basePosition = useRef(position);

    // Load the specific cloud texture
    const texture = useLoader(THREE.TextureLoader, CLOUD_TEXTURES[textureIndex]);

    // Calculate aspect ratio from texture dimensions
    const aspectRatio = texture.image ? texture.image.width / texture.image.height : 1;
    const width = 3 * scale;
    const height = width / aspectRatio;

    // Cached values for smooth fade
    const worldPos = useRef(new THREE.Vector3());
    const currentOpacity = useRef(baseOpacity);

    useFrame((state, delta) => {
        if (!meshRef.current) return;

        const time = state.clock.elapsedTime;

        // === DRIFT ANIMATION ===
        // Horizontal sway (left-right)
        const driftX = Math.sin(time * driftSpeed + timeOffset) * driftAmount;
        // Vertical bob (gentle up-down)
        const driftY = Math.sin(time * driftSpeed * 0.7 + timeOffset + 1.5) * bobAmount;

        // Apply drift to position
        meshRef.current.position.x = basePosition.current[0] + driftX;
        meshRef.current.position.y = basePosition.current[1] + driftY;
        meshRef.current.position.z = basePosition.current[2];

        // Update world position (reuse object to avoid GC)
        meshRef.current.getWorldPosition(worldPos.current);

        // Calculate relative Z (distance from camera)
        const relativeZ = worldPos.current.z - camera.position.z;

        // === CORRIDOR CLIPPING (FIXED ENTRANCE) ===
        // Używamy pozycji grandparenta (worldRef) jako stałego punktu wejścia
        // Struktura: worldRef -> SkyChunk group -> Cloud mesh
        // Potrzebujemy wejść 2 poziomy w górę żeby dostać się do worldRef
        const grandparentZ = meshRef.current.parent?.parent?.getWorldPosition(new THREE.Vector3()).z ?? 0;
        const entranceZ = grandparentZ + CORRIDOR_CLIP_Z;
        const cloudZ = worldPos.current.z;

        // Ukryj jeśli chmura jest "przed" progiem wejścia (w stronę korytarza)
        const isInCorridor = cloudZ > entranceZ;

        // Target opacity based on distance AND corridor clipping
        let targetOpacity = baseOpacity;

        if (isInCorridor) {
            // Chmura jest w strefie korytarza - całkowicie ukryta
            targetOpacity = 0;
        } else if (relativeZ > FADE_END_Z) {
            targetOpacity = 0;
        } else if (relativeZ > FADE_START_Z) {
            const t = (FADE_START_Z - relativeZ) / (FADE_START_Z - FADE_END_Z);
            targetOpacity = baseOpacity * t;
        }

        // SMOOTH lerp to target opacity
        currentOpacity.current = THREE.MathUtils.lerp(
            currentOpacity.current,
            targetOpacity,
            1 - Math.pow(0.01, delta)
        );

        // Apply to material
        if (materialRef.current) {
            materialRef.current.opacity = currentOpacity.current;
        }

        // Billboard effect - always face camera, turned 90° left
        const offsetRotation = new THREE.Euler(0, -Math.PI / 3, 0);
        const offsetQuaternion = new THREE.Quaternion().setFromEuler(offsetRotation);
        meshRef.current.quaternion.copy(camera.quaternion).multiply(offsetQuaternion);
    });

    return (
        <mesh ref={meshRef} position={position}>
            <planeGeometry args={[width, height]} />
            <meshBasicMaterial
                ref={materialRef}
                map={texture}
                transparent
                opacity={baseOpacity}
                depthWrite={false}
                side={THREE.DoubleSide}
            />
        </mesh>
    );
};

function seededRandom(seed) {
    let s = seed;
    return function () {
        s = Math.sin(s * 9999) * 10000;
        return s - Math.floor(s);
    };
}

export { CHUNK_LENGTH };
export default SkyChunk;
