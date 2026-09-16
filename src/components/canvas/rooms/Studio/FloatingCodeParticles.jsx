import { useRef, useMemo } from 'react';
import { useFrame } from '@react-three/fiber';
import Text from '../../LocalText';
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
// Generate particle data once
const generateParticles = () => {
    const particles = [];

    // Bounds for 2D plane
    const X_SPREAD = 50; // Match WRAP_WIDTH in useFrame
    const Z_MIN = -4; // Behind monitors (monitors at ~ +/- 2.2 radius)
    const Z_MAX = -8; // Further back

    for (let i = 0; i < PARTICLE_COUNT; i++) {
        const symbol = getRandomSymbol();

        // Random 3D position in a flat plane interaction volume
        const x = (Math.random() - 0.5) * X_SPREAD;
        const y = (Math.random() - 0.5) * VERTICAL_SPREAD;
        const z = Z_MIN + Math.random() * (Z_MAX - Z_MIN);

        particles.push({
            id: i,
            symbol,
            position: new THREE.Vector3(x, y, z), // Initial position
            initialX: x, // Store for logic
            z: z,        // Store for logic
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
        const fallVelocity = fallOffsetRef?.current || 0;

        // Smooth the rotation
        smoothRotation.current = THREE.MathUtils.lerp(smoothRotation.current, towerRotation, 0.08);

        // Define X wrapping bounds - wide enough to cover screen
        const WRAP_WIDTH = 50; // Total width before wrapping
        const HALF_WIDTH = WRAP_WIDTH / 2;

        particles.forEach((particle, index) => {
            const mesh = meshRefs.current[index];
            if (!mesh) return;

            // --- VERTICAL MOVEMENT (Unchanged) ---
            // Accumulate Y offset based on velocity
            particleYOffsets.current[index] -= fallVelocity * delta * particle.parallaxFactor * 1.5;

            // Gentle floating motion
            const floatY = Math.sin(time * particle.driftSpeed + particle.phaseOffset) * 0.3;

            // Calculate final Y position
            let finalY = particle.initialY + particleYOffsets.current[index] + floatY;

            // START: Vertical Loop
            while (finalY < LOOP_BOTTOM) {
                particleYOffsets.current[index] += LOOP_HEIGHT;
                finalY += LOOP_HEIGHT;
            }
            while (finalY > LOOP_TOP) {
                particleYOffsets.current[index] -= LOOP_HEIGHT;
                finalY -= LOOP_HEIGHT;
            }
            mesh.position.y = finalY;

            // --- HORIZONTAL MOVEMENT (New 2D Logic) ---

            // Link horizontal position to tower rotation
            // rotation * factor -> linear translation
            // "Rotate Left" (positive/negative depending on setup) -> "Fly Left"
            // We'll multiply rotation by a scalar. 
            // If the user wants "rotate left -> fly left", we need to check the sign.
            // Usually: Rotate Tower Left = Tower rotates +Y (or -Y). 
            // If Tower Rotates +Y (Left), we want Particles to move -X (Left)? 
            // Or "fly to the left" means -X velocity.
            // Let's use a standard parallax coefficient.

            const rotationOffset = smoothRotation.current * 5.0; // 5.0 is the "gear ratio" of rotation to pixels

            // Calculate raw X based on initial position + rotation offset
            // We subtract rotationOffset to make them move opposite to creating depth?
            // User said: "jak sie obraca wierza w lewo to te cząsteczki leca w lewo"
            // If I rotate the tower to the left (counter-clockwise, typically +RotationY), 
            // the "face" sets moves left. 
            // So if `towerRotation` increases, we want `x` to decrease?
            // Let's try `initialX + rotationOffset`. If rotation is positive, X gets bigger (Right).
            // This might mean "Rotate Left" -> "Fly Right" visually?
            // Let's assume positive correlation first: Rotate Right -> Fly Right.

            let finalX = particle.initialX + (rotationOffset * particle.parallaxFactor);

            // Manual modulo for wrapping between -HALF_WIDTH and +HALF_WIDTH
            // ((x + half) % width + width) % width - half
            finalX = ((finalX + HALF_WIDTH) % WRAP_WIDTH + WRAP_WIDTH) % WRAP_WIDTH - HALF_WIDTH;

            mesh.position.x = finalX;

            // --- DEPTH (Fixed Plane) ---
            mesh.position.z = particle.z; // Fixed plane behind monitors

            // Gentle self-rotation (unchanged)
            mesh.rotation.z = particle.rotation + time * particle.rotationSpeed;
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
