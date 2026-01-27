import { useRef, useMemo } from 'react';
import { useFrame } from '@react-three/fiber';
import { Text } from '@react-three/drei';
import * as THREE from 'three';

// ============================================
// CONFIG
// ============================================
const PARTICLE_COUNT = 60;
const MIN_RADIUS = 4;
const MAX_RADIUS = 12;
const VERTICAL_SPREAD = 25;
const BASE_OPACITY = 0.18;

// Thresholds for seamless loop
const LOOP_BOTTOM = -15;
const LOOP_TOP = 15;
const LOOP_HEIGHT = LOOP_TOP - LOOP_BOTTOM;

// Symbol definitions with their visual weight
const SYMBOLS = [
    // Code brackets - larger
    { text: '{/}', size: 0.8, weight: 2 },
    { text: '</>', size: 0.8, weight: 2 },
    { text: '{ }', size: 0.7, weight: 1 },
    { text: '{ • }', size: 0.7, weight: 1 },

    // Operators & punctuation - medium
    { text: ';', size: 0.5, weight: 3 },
    { text: '::', size: 0.4, weight: 2 },
    { text: '=>', size: 0.5, weight: 2 },
    { text: '//', size: 0.5, weight: 2 },
    { text: '&&', size: 0.4, weight: 1 },

    // Binary - small scattered
    { text: '0', size: 0.3, weight: 4 },
    { text: '1', size: 0.3, weight: 4 },
    { text: '01', size: 0.35, weight: 3 },
    { text: '0101', size: 0.4, weight: 2 },
    { text: '00', size: 0.35, weight: 2 },

    // Arrows & misc
    { text: '↑', size: 0.4, weight: 2 },
    { text: '→', size: 0.4, weight: 1 },
    { text: '←', size: 0.4, weight: 1 },
    { text: '×', size: 0.3, weight: 2 },
    { text: '•', size: 0.25, weight: 3 },
    { text: '○', size: 0.3, weight: 2 },

    // Pixel-like patterns
    { text: '▪▪\n▪', size: 0.25, weight: 2 },
    { text: '▪ ▪\n ▪', size: 0.25, weight: 1 },
    { text: '▪▪▪', size: 0.2, weight: 2 },
];

// Weighted random selection
const getRandomSymbol = () => {
    const totalWeight = SYMBOLS.reduce((sum, s) => sum + s.weight, 0);
    let random = Math.random() * totalWeight;

    for (const symbol of SYMBOLS) {
        random -= symbol.weight;
        if (random <= 0) return symbol;
    }
    return SYMBOLS[0];
};

// Generate particle data once
const generateParticles = () => {
    const particles = [];

    for (let i = 0; i < PARTICLE_COUNT; i++) {
        const symbol = getRandomSymbol();

        // Only back half (Z always negative) but wide X spread for side visibility
        // Angle from -90° to +90° (back hemisphere)
        const angle = (Math.random() - 0.5) * Math.PI + Math.PI; // PI/2 to 3PI/2 = back half
        const radius = MIN_RADIUS + Math.random() * (MAX_RADIUS - MIN_RADIUS);
        const y = (Math.random() - 0.5) * VERTICAL_SPREAD;

        // Wider X spread for side visibility
        const x = Math.cos(angle) * radius * 1.5; // 1.5x wider on X
        const z = Math.sin(angle) * radius;

        particles.push({
            id: i,
            symbol,
            position: new THREE.Vector3(x, y, z),
            baseAngle: angle,
            radius,
            initialY: y,
            rotation: Math.random() * Math.PI * 2,
            driftSpeed: 0.1 + Math.random() * 0.2,
            rotationSpeed: (Math.random() - 0.5) * 0.3,
            parallaxFactor: 0.3 + Math.random() * 0.7,
            phaseOffset: Math.random() * Math.PI * 2,
            opacity: BASE_OPACITY * (0.5 + Math.random() * 0.5),
        });
    }

    return particles;
};

// Main component - receives REFS from parent for smooth animation
// fallOffsetRef is now VELOCITY (fallSpeed), not cumulative offset!
const FloatingCodeParticles = ({ towerRotationRef, fallOffsetRef }) => {
    const particles = useMemo(() => generateParticles(), []);
    const meshRefs = useRef([]);

    // Track interpolated values for smoothing
    const smoothRotation = useRef(0);

    // Track cumulative Y offset for each particle (never resets!)
    const particleYOffsets = useRef(particles.map(() => 0));

    // Single useFrame for ALL particles
    useFrame((state, delta) => {
        const time = state.clock.elapsedTime;

        // Read velocity from parent
        const towerRotation = towerRotationRef?.current || 0;
        const fallVelocity = fallOffsetRef?.current || 0; // This is now VELOCITY

        // Smooth the rotation
        smoothRotation.current = THREE.MathUtils.lerp(smoothRotation.current, towerRotation, 0.08);

        particles.forEach((particle, index) => {
            const mesh = meshRefs.current[index];
            if (!mesh) return;

            // Accumulate Y offset based on velocity (parallax - particles move slower than tower)
            particleYOffsets.current[index] -= fallVelocity * delta * particle.parallaxFactor * 1.5;

            // Gentle floating motion
            const floatY = Math.sin(time * particle.driftSpeed + particle.phaseOffset) * 0.3;

            // Calculate final Y position
            let finalY = particle.initialY + particleYOffsets.current[index] + floatY;

            // SEAMLESS LOOP - wrap around when out of bounds
            while (finalY < LOOP_BOTTOM) {
                particleYOffsets.current[index] += LOOP_HEIGHT;
                finalY += LOOP_HEIGHT;
            }
            while (finalY > LOOP_TOP) {
                particleYOffsets.current[index] -= LOOP_HEIGHT;
                finalY -= LOOP_HEIGHT;
            }

            // Update Y position
            mesh.position.y = finalY;

            // Gentle self-rotation
            mesh.rotation.z = particle.rotation + time * particle.rotationSpeed;

            // Orbit with tower (parallax - slower than tower)
            const orbitOffset = smoothRotation.current * particle.parallaxFactor * 0.3;
            mesh.position.x = Math.cos(particle.baseAngle + orbitOffset) * particle.radius;
            mesh.position.z = Math.sin(particle.baseAngle + orbitOffset) * particle.radius;
        });
    });

    return (
        <group position={[0, 0, -10]}>
            {particles.map((particle, index) => (
                <Text
                    key={particle.id}
                    ref={(el) => { meshRefs.current[index] = el; }}
                    position={particle.position}
                    fontSize={particle.symbol.size}
                    color="#1a1a1a"
                    anchorX="center"
                    anchorY="middle"
                    fillOpacity={particle.opacity}
                    font="/fonts/CabinSketch-Bold.ttf"
                >
                    {particle.symbol.text}
                </Text>
            ))}
        </group>
    );
};

export default FloatingCodeParticles;
