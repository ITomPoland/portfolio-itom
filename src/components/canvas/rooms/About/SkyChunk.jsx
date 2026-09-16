import { useMemo, useRef } from 'react';
import { useFrame, useLoader } from '@react-three/fiber';
import * as THREE from 'three';

/**
 * A repeatable sky segment with deterministic, evenly spaced cloud paths.
 */
const CHUNK_LENGTH = 40;
const CHUNK_WIDTH = 20;

// Everything beyond this world-space line is hidden before it reaches corridor.
const CORRIDOR_CLIP_Z = -8.0;
const ROOM_Z = -25;

const CLOUD_TEXTURES = [
    '/textures/clouds/candy-cloud-01.webp',
    '/textures/clouds/candy-cloud-02.webp',
    '/textures/clouds/candy-cloud-03.webp',
    '/textures/clouds/candy-cloud-04.webp',
    '/textures/clouds/candy-cloud-05.webp',
    '/textures/clouds/candy-cloud-06.webp',
    '/textures/clouds/candy-cloud-07.webp',
    '/textures/clouds/candy-cloud-08.webp',
    '/textures/clouds/candy-cloud-09.webp',
    '/textures/clouds/candy-cloud-10.webp',
    '/textures/clouds/candy-cloud-11.webp',
    '/textures/clouds/candy-cloud-12.webp',
];

const CLOUD_ROTATION_OFFSET = new THREE.Quaternion().setFromEuler(
    new THREE.Euler(0, -Math.PI / 3, 0)
);

const SkyChunk = ({ chunkIndex = 0, seed = 0, scrollProgressRef }) => {
    const textures = useLoader(THREE.TextureLoader, CLOUD_TEXTURES);
    const cloudRefs = useRef([]);
    const pointerOffset = useRef(new THREE.Vector2());
    const billboardQuaternion = useRef(new THREE.Quaternion());
    const zOffset = -(chunkIndex * CHUNK_LENGTH) - 15;

    textures.forEach((texture) => {
        texture.colorSpace = THREE.SRGBColorSpace;
    });

    const clouds = useMemo(
        () => createChunkLayout(chunkIndex, seed, zOffset),
        [chunkIndex, seed, zOffset]
    );

    useFrame((state, delta) => {
        const time = state.clock.elapsedTime;
        const safeDelta = Math.min(delta, 0.05);
        const pointerEase = 1 - Math.exp(-safeDelta * 2.8);
        const scrollProgress = scrollProgressRef?.current || 0;

        pointerOffset.current.x = THREE.MathUtils.lerp(
            pointerOffset.current.x,
            -state.pointer.x * 0.55,
            pointerEase
        );
        pointerOffset.current.y = THREE.MathUtils.lerp(
            pointerOffset.current.y,
            state.pointer.y * 0.32,
            pointerEase
        );

        billboardQuaternion.current.copy(state.camera.quaternion).multiply(CLOUD_ROTATION_OFFSET);

        clouds.forEach((cloud, index) => {
            const mesh = cloudRefs.current[index];
            if (!mesh) return;

            const driftX = Math.sin(time * cloud.driftSpeed + cloud.timeOffset) * cloud.driftAmount;
            const driftY = Math.sin(time * cloud.bobSpeed + cloud.timeOffset + 1.5) * cloud.bobAmount;
            const driftZ = Math.cos(time * cloud.depthSpeed + cloud.timeOffset) * cloud.depthAmount;
            const animatedZ = cloud.baseZ + driftZ;
            const worldZ = ROOM_Z + scrollProgress + animatedZ;
            const approachFactor = smoothstep(-62, -16, worldZ);
            const outwardClearance = approachFactor * cloud.clearanceAmount * cloud.directionX;

            mesh.visible = worldZ <= CORRIDOR_CLIP_Z;
            mesh.position.set(
                cloud.baseX
                    + driftX
                    + outwardClearance
                    + pointerOffset.current.x * cloud.parallaxStrength,
                cloud.baseY
                    + driftY
                    + pointerOffset.current.y * cloud.parallaxStrength,
                animatedZ
            );
            mesh.quaternion.copy(billboardQuaternion.current);
        });
    });

    return (
        <group>
            {clouds.map((cloud, index) => (
                <CloudPlane
                    key={cloud.id}
                    meshRef={(node) => {
                        cloudRefs.current[index] = node;
                    }}
                    position={[cloud.baseX, cloud.baseY, cloud.baseZ]}
                    scale={cloud.scale}
                    opacity={cloud.opacity}
                    texture={textures[cloud.textureIndex]}
                />
            ))}
        </group>
    );
};

const CloudPlane = ({ meshRef, position, scale, opacity, texture }) => {
    const textureWidth = texture.image?.naturalWidth || texture.image?.width;
    const textureHeight = texture.image?.naturalHeight || texture.image?.height;
    const aspectRatio = textureWidth && textureHeight ? textureWidth / textureHeight : 1.3;
    const width = 3 * scale;
    const height = width / aspectRatio;

    return (
        <mesh ref={meshRef} position={position}>
            <planeGeometry args={[width, height]} />
            <meshBasicMaterial
                color="#ffffff"
                map={texture}
                transparent
                opacity={opacity}
                depthWrite={false}
                side={THREE.DoubleSide}
                toneMapped={false}
            />
        </mesh>
    );
};

function createChunkLayout(chunkIndex, seed, zOffset) {
    const random = seededRandom(seed + chunkIndex * 1009);
    const cloudCount = 8 + Math.floor(random() * 2);
    const zSpacing = CHUNK_LENGTH / cloudCount;
    const yBands = [-4.4, -2.3, -0.2, 2.1, 4.2];

    return Array.from({ length: cloudCount }, (_, index) => {
        const directionX = (index + Math.abs(chunkIndex)) % 2 === 0 ? -1 : 1;
        const horizontalInset = 4.8 + random() * (CHUNK_WIDTH * 0.42 - 4.8);
        const zJitter = (random() - 0.5) * zSpacing * 0.3;
        const bandIndex = (index * 3 + Math.abs(chunkIndex)) % yBands.length;

        return {
            id: `${chunkIndex}-${index}`,
            baseX: horizontalInset * directionX,
            baseY: yBands[bandIndex] + (random() - 0.5) * 0.5,
            baseZ: zOffset - (index + 0.5) * zSpacing + zJitter,
            directionX,
            scale: 0.42 + random() * 0.54,
            opacity: 0.74 + random() * 0.22,
            textureIndex: (index + Math.floor(random() * CLOUD_TEXTURES.length)) % CLOUD_TEXTURES.length,
            driftSpeed: 0.14 + random() * 0.11,
            driftAmount: 0.24 + random() * 0.48,
            bobSpeed: 0.17 + random() * 0.1,
            bobAmount: 0.08 + random() * 0.17,
            depthSpeed: 0.09 + random() * 0.06,
            depthAmount: 0.06 + random() * 0.15,
            clearanceAmount: 0.9 + random() * 1.25,
            parallaxStrength: 0.22 + random() * 0.3,
            timeOffset: random() * Math.PI * 2,
        };
    });
}

function smoothstep(edge0, edge1, value) {
    const progress = THREE.MathUtils.clamp((value - edge0) / (edge1 - edge0), 0, 1);
    return progress * progress * (3 - 2 * progress);
}

function seededRandom(seed) {
    let state = seed >>> 0;

    return function () {
        state += 0x6D2B79F5;
        let result = state;
        result = Math.imul(result ^ (result >>> 15), result | 1);
        result ^= result + Math.imul(result ^ (result >>> 7), result | 61);
        return ((result ^ (result >>> 14)) >>> 0) / 4294967296;
    };
}

export { CHUNK_LENGTH, CORRIDOR_CLIP_Z, ROOM_Z };
export default SkyChunk;
