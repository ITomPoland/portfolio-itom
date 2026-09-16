import { useMemo, useRef } from 'react';
import { useFrame, useLoader } from '@react-three/fiber';
import * as THREE from 'three';

// Shared teal-and-pink cloud character family used in Gallery and Contact.
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

const FLOW_START_X = 48;
const FLOW_END_X = -48;
const FLOW_LENGTH = FLOW_START_X - FLOW_END_X;

/**
 * Wind-lane cloud field shared by Gallery and Contact.
 * Clouds in one lane share a speed and keep a fixed phase gap, so faster
 * clouds can never catch slower ones and form a cluster. Pointer input adds
 * a damped parallax offset without breaking the lane spacing.
 */
const GalleryClouds = ({ count = 12, seed = 42, rotationOffset = [0, -Math.PI / 3, 0] }) => {
    const textures = useLoader(THREE.TextureLoader, CLOUD_TEXTURES);
    const cloudRefs = useRef([]);
    const pointerOffset = useRef(new THREE.Vector2());
    const billboardQuaternion = useRef(new THREE.Quaternion());
    const rotationX = rotationOffset[0];
    const rotationY = rotationOffset[1];
    const rotationZ = rotationOffset[2];

    textures.forEach((texture) => {
        texture.colorSpace = THREE.SRGBColorSpace;
    });

    const clouds = useMemo(() => createWindLaneLayout(count, seed), [count, seed]);
    const offsetQuaternion = useMemo(() => (
        new THREE.Quaternion().setFromEuler(
            new THREE.Euler(rotationX, rotationY, rotationZ)
        )
    ), [rotationX, rotationY, rotationZ]);

    useFrame((state, delta) => {
        const time = state.clock.elapsedTime;
        const safeDelta = Math.min(delta, 0.05);
        const pointerEase = 1 - Math.exp(-safeDelta * 3.2);
        const targetPointerX = -state.pointer.x * 0.8;
        const targetPointerY = state.pointer.y * 0.45;

        pointerOffset.current.x = THREE.MathUtils.lerp(
            pointerOffset.current.x,
            targetPointerX,
            pointerEase
        );
        pointerOffset.current.y = THREE.MathUtils.lerp(
            pointerOffset.current.y,
            targetPointerY,
            pointerEase
        );

        billboardQuaternion.current.copy(state.camera.quaternion).multiply(offsetQuaternion);

        clouds.forEach((cloud, index) => {
            const mesh = cloudRefs.current[index];
            if (!mesh) return;

            const progress = positiveModulo(time * cloud.speed + cloud.phase, FLOW_LENGTH);
            const windCurve = Math.sin(time * cloud.curveSpeed + cloud.curvePhase);
            const verticalBob = Math.sin(time * cloud.bobSpeed + cloud.bobPhase);
            const depthBreath = Math.cos(time * cloud.depthSpeed + cloud.curvePhase);

            mesh.position.set(
                FLOW_START_X - progress
                    + windCurve * cloud.curveAmount
                    + pointerOffset.current.x * cloud.parallaxStrength,
                cloud.baseY
                    + verticalBob * cloud.bobAmount
                    + pointerOffset.current.y * cloud.parallaxStrength,
                cloud.baseZ + depthBreath * cloud.depthAmount
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
                    position={[cloud.initialX, cloud.baseY, cloud.baseZ]}
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
    const width = 2.5 * scale;
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

function createWindLaneLayout(count, seed) {
    if (count <= 0) return [];

    const random = seededRandom(seed);
    const laneCount = Math.min(count, THREE.MathUtils.clamp(Math.round(count / 9), 5, 8));
    const laneSettings = Array.from({ length: laneCount }, (_, laneIndex) => {
        const depthRatio = laneCount === 1 ? 0 : laneIndex / (laneCount - 1);

        return {
            y: 5.8 + depthRatio * 5.8 + (random() - 0.5) * 0.35,
            z: -7 - depthRatio * 27 + (random() - 0.5) * 1.2,
            speed: 0.5 + depthRatio * 0.3 + random() * 0.035,
            phaseOffset: random() * FLOW_LENGTH,
            curveSpeed: 0.16 + random() * 0.08,
            bobSpeed: 0.2 + random() * 0.1,
            depthSpeed: 0.1 + random() * 0.06,
            parallaxStrength: 0.35 + (1 - depthRatio) * 0.5,
        };
    });

    return Array.from({ length: count }, (_, index) => {
        const laneIndex = index % laneCount;
        const slotIndex = Math.floor(index / laneCount);
        const itemsInLane = Math.floor((count - 1 - laneIndex) / laneCount) + 1;
        const lane = laneSettings[laneIndex];
        const slotSpacing = FLOW_LENGTH / itemsInLane;
        const spacingJitter = (random() - 0.5) * slotSpacing * 0.14;
        const phase = positiveModulo(
            lane.phaseOffset + slotIndex * slotSpacing + spacingJitter,
            FLOW_LENGTH
        );

        return {
            id: `${seed}-${laneIndex}-${slotIndex}`,
            initialX: FLOW_START_X - phase,
            baseY: lane.y,
            baseZ: lane.z,
            phase,
            speed: lane.speed,
            scale: 0.42 + random() * 0.58,
            opacity: 0.64 + random() * 0.28,
            textureIndex: (index + Math.floor(random() * CLOUD_TEXTURES.length)) % CLOUD_TEXTURES.length,
            curveAmount: 0.18 + random() * 0.22,
            curveSpeed: lane.curveSpeed,
            curvePhase: (phase / FLOW_LENGTH) * Math.PI * 2 + laneIndex * 0.7,
            bobAmount: 0.08 + random() * 0.18,
            bobSpeed: lane.bobSpeed,
            bobPhase: (phase / FLOW_LENGTH) * Math.PI * 2 + random() * 0.6,
            depthAmount: 0.05 + random() * 0.12,
            depthSpeed: lane.depthSpeed,
            parallaxStrength: lane.parallaxStrength,
        };
    });
}

function positiveModulo(value, divisor) {
    return ((value % divisor) + divisor) % divisor;
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

export default GalleryClouds;
