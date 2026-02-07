import { useState, useRef, useMemo } from 'react';
import { useFrame, useLoader, useThree } from '@react-three/fiber';
import { Text } from '@react-three/drei';
import * as THREE from 'three';
import SkyChunk, { CHUNK_LENGTH } from './SkyChunk';

/**
 * InfiniteSkyManager Component
 * 
 * Manages dynamic generation/removal of sky chunks for infinite scroll.
 * World group moves with scroll, chunks stay at fixed positions relative to group.
 * Includes Story Milestones that loop with the content!
 */

// Story milestones configuration
// Each milestone appears once per "story cycle" (4 chunks = 160 units)
const STORY_CYCLE_LENGTH = 160;

// === EDYTUJ TUTAJ: GRANICA KORYTARZA DLA MILESTONES ===
// Wartość bazowa - milestones przed tym progiem są ukryte
const MILESTONE_CORRIDOR_CLIP_Z = -1;

const InfiniteSkyManager = ({ scrollProgress = 0 }) => {
    const [activeChunks, setActiveChunks] = useState([0, 1, 2, 3]);
    const [activeStoryCycles, setActiveStoryCycles] = useState([0, 1]);
    const worldRef = useRef();

    // Track current chunk for recycling
    const getCurrentChunk = (worldZ) => {
        return Math.floor(worldZ / CHUNK_LENGTH);
    };

    // Track current story cycle
    const getCurrentStoryCycle = (worldZ) => {
        return Math.floor(worldZ / STORY_CYCLE_LENGTH);
    };

    // Update chunks based on world position
    useFrame(() => {
        if (!worldRef.current) return;

        // Move world directly
        worldRef.current.position.z = scrollProgress;

        // Figure out which chunk we're in
        const currentChunk = getCurrentChunk(scrollProgress);
        const shouldBeActiveChunks = [
            currentChunk - 1,
            currentChunk,
            currentChunk + 1,
            currentChunk + 2,
        ];

        const chunksNeedUpdate = shouldBeActiveChunks.some(c => !activeChunks.includes(c)) ||
            activeChunks.some(c => !shouldBeActiveChunks.includes(c));

        if (chunksNeedUpdate) {
            setActiveChunks(shouldBeActiveChunks);
        }

        // Update story cycles
        const currentStoryCycle = getCurrentStoryCycle(scrollProgress);
        const shouldBeActiveCycles = [
            currentStoryCycle - 1,
            currentStoryCycle,
            currentStoryCycle + 1,
        ];

        const cyclesNeedUpdate = shouldBeActiveCycles.some(c => !activeStoryCycles.includes(c)) ||
            activeStoryCycles.some(c => !shouldBeActiveCycles.includes(c));

        if (cyclesNeedUpdate) {
            setActiveStoryCycles(shouldBeActiveCycles);
        }
    });

    return (
        <group ref={worldRef}>
            {/* === SKY CHUNKS WITH CLOUDS === */}
            {activeChunks.map((chunkIndex) => (
                <SkyChunk
                    key={`sky-chunk-${chunkIndex}`}
                    chunkIndex={chunkIndex}
                    seed={42}
                />
            ))}

            {/* === STORY MILESTONES (loop every 160 units) === */}
            {activeStoryCycles.map((cycleIndex) => (
                <group key={`story-cycle-${cycleIndex}`}>
                    {/* === INTRO MILESTONE === */}
                    <IntroMilestone
                        z={-(cycleIndex * STORY_CYCLE_LENGTH + 15)}
                        scrollProgress={scrollProgress}
                    />

                    {/* === AWARDS MILESTONE === */}
                    <AwardsMilestone
                        z={-(cycleIndex * STORY_CYCLE_LENGTH + 55)}
                        scrollProgress={scrollProgress}
                    />

                    {/* === JOURNEY MILESTONE === */}
                    <JourneyMilestone
                        z={-(cycleIndex * STORY_CYCLE_LENGTH + 95)}
                        scrollProgress={scrollProgress}
                    />

                    {/* === SKILLS MILESTONE === */}

                    <SkillsMilestone
                        z={-(cycleIndex * STORY_CYCLE_LENGTH + 135)}
                        scrollProgress={scrollProgress}
                    />
                </group>
            ))}
        </group>
    );
};

/**
 * INTRO Milestone - Special detailed layout
 * Elements spread apart as they approach camera
 */
const IntroMilestone = ({ z, scrollProgress }) => {
    // Load avatar texture
    const avatarTexture = useLoader(THREE.TextureLoader, '/textures/about/awatarnachmurce.png');
    const { camera } = useThree();

    // Refs for all animated elements
    const groupRef = useRef();
    const titleRef = useRef();
    const brandRef = useRef();
    const avatarRef = useRef();
    const motto1Ref = useRef();
    const motto2Ref = useRef();

    // Base positions
    const baseY = 2;

    // Calculate aspect ratio
    const aspectRatio = avatarTexture.image ? avatarTexture.image.width / avatarTexture.image.height : 1.5;
    const avatarWidth = 4;
    const avatarHeight = avatarWidth / aspectRatio;

    // Animation: floating + spread apart when close
    useFrame((state) => {
        if (!groupRef.current) return;

        const time = state.clock.elapsedTime;

        // === CORRIDOR CLIPPING (FIXED ENTRANCE) ===
        // Używamy pozycji PARENTA (worldRef) jako stałego punktu wejścia
        // Ta pozycja nie zmienia się z kamerą - jest stała dla pokoju
        const parentZ = groupRef.current.parent?.getWorldPosition(new THREE.Vector3()).z ?? 0;
        const entranceZ = parentZ + MILESTONE_CORRIDOR_CLIP_Z; // Próg wejścia
        const objectZ = groupRef.current.getWorldPosition(new THREE.Vector3()).z;

        // Ukryj jeśli obiekt jest "przed" progiem wejścia (w stronę korytarza)
        groupRef.current.visible = objectZ < entranceZ;

        // Skip rest if not visible
        if (!groupRef.current.visible) return;

        // FIX: Use consistent distance based on scrollProgress + offset
        // This ensures animations work IDENTICALLY regardless of chunk/camera position
        // Base Start Z (-15) + Scroll (0) - Offset (55) = -70 (Matches "Working" Chunk 0 feel)
        const distanceZ = z + scrollProgress - 55;

        // Spread effect: starts at z = -25, full spread at z = -5
        // This makes elements spread BEFORE they reach the camera
        // === EDYTUJ TUTAJ (INTRO) ===
        // Zwiększ różnicę między Start a End, żeby animacja była wolniejsza
        const spreadStart = -70; // Startuje wcześniej
        const spreadEnd = -50;   // Kończy później
        let spreadFactor = 0;

        if (distanceZ > spreadStart && distanceZ < spreadEnd) {
            // Calculate spread: 0 at spreadStart, 1 at spreadEnd
            spreadFactor = (distanceZ - spreadStart) / (spreadEnd - spreadStart);
            spreadFactor = Math.min(1, Math.max(0, spreadFactor));
            // Ease out for smoother animation
            spreadFactor = spreadFactor * spreadFactor;
        } else if (distanceZ >= spreadEnd) {
            spreadFactor = 1;
        }

        // Apply spread to elements (move left/right) - MORE AGGRESSIVE
        const maxSpread = 15; // How far elements spread (increased!)

        if (titleRef.current) {
            titleRef.current.position.x = -spreadFactor * maxSpread * 0.8;
        }
        if (brandRef.current) {
            brandRef.current.position.x = spreadFactor * maxSpread * 0.6;
        }
        if (avatarRef.current) {
            // Avatar: floating + spread upward
            avatarRef.current.position.y = baseY + Math.sin(time * 0.8) * 0.15 + spreadFactor * 3;
            avatarRef.current.position.x = -spreadFactor * maxSpread * 0.3;
        }
        if (motto1Ref.current) {
            motto1Ref.current.position.x = spreadFactor * maxSpread * 0.7;
        }
        if (motto2Ref.current) {
            motto2Ref.current.position.x = -spreadFactor * maxSpread * 0.5;
        }
    });

    return (
        <group ref={groupRef} position={[0, 0, z]}>
            {/* Main title - Name (spreads left) */}
            <Text
                ref={titleRef}
                position={[0, 6, 0.1]}
                fontSize={0.8}
                color="#1a1a1a"
                anchorX="center"
                anchorY="middle"
                font="/fonts/CabinSketch-Bold.ttf"
            >
                ✦ TOMASZ SZMAJDA ✦
            </Text>

            {/* Subtitle - Brand (spreads right) */}
            <Text
                ref={brandRef}
                position={[0, 5.3, 0.1]}
                fontSize={0.45}
                color="#4a4a4a"
                anchorX="center"
                anchorY="middle"
                font="/fonts/CabinSketch-Regular.ttf"
            >
                (ITOM)
            </Text>

            {/* Avatar on cloud - floating + spreads up-left */}
            <mesh ref={avatarRef} position={[0, baseY, 0]}>
                <planeGeometry args={[avatarWidth, avatarHeight]} />
                <meshBasicMaterial
                    map={avatarTexture}
                    transparent
                    side={THREE.DoubleSide}
                    depthWrite={false}
                />
            </mesh>

            {/* Motto - Line 1 (spreads right) */}
            <Text
                ref={motto1Ref}
                position={[0, -1, 0.1]}
                fontSize={0.32}
                color="#555555"
                anchorX="center"
                anchorY="middle"
                font="/fonts/CabinSketch-Regular.ttf"
                fontStyle="italic"
            >
                "Crafting digital experiences
            </Text>

            {/* Motto - Line 2 (spreads left) */}
            <Text
                ref={motto2Ref}
                position={[0, -1.5, 0]}
                fontSize={0.32}
                color="#555555"
                anchorX="center"
                anchorY="middle"
                font="/fonts/CabinSketch-Regular.ttf"
                fontStyle="italic"
            >
                that push creative boundaries"
            </Text>
        </group>
    );
};

/**
 * AWARDS Milestone - Cards reveal from behind main card
 * Rendering order matters: last rendered = on top
 */
const AwardsMilestone = ({ z, scrollProgress }) => {
    const { camera } = useThree();
    const groupRef = useRef();
    const sotyRef = useRef();
    const sotdRef = useRef();
    const sotmRef = useRef();
    const honorableRef = useRef();

    useFrame((state) => {
        if (!groupRef.current) return;

        // === CORRIDOR CLIPPING (FIXED ENTRANCE) ===
        const parentZ = groupRef.current.parent?.getWorldPosition(new THREE.Vector3()).z ?? 0;
        const entranceZ = parentZ + MILESTONE_CORRIDOR_CLIP_Z;
        const objectZ = groupRef.current.getWorldPosition(new THREE.Vector3()).z;

        groupRef.current.visible = objectZ < entranceZ;
        if (!groupRef.current.visible) return;

        // FIX: Use consistent distance based on scrollProgress + offset
        const distanceZ = z + scrollProgress - 55;

        // 1. Standard reveal (SOTD, SOTM, Honorable)
        // === EDYTUJ TUTAJ (AWARDS 1) ===
        const revealStart = -120;
        const revealEnd = -50; // Wolniejsze wyłanianie
        let revealFactor = 0;

        if (distanceZ > revealStart && distanceZ < revealEnd) {
            revealFactor = (distanceZ - revealStart) / (revealEnd - revealStart);
            revealFactor = Math.min(1, Math.max(0, revealFactor));
            revealFactor = revealFactor * revealFactor; // ease in
        } else if (distanceZ >= revealEnd) {
            revealFactor = 1;
        }

        // 2. SOTY reveal (starts LATER, moves UP)
        // === EDYTUJ TUTAJ (AWARDS 2 - SOTY) ===
        const sotyStart = -80;
        const sotyEnd = -20;
        let sotyFactor = 0;

        if (distanceZ > sotyStart && distanceZ < sotyEnd) {
            sotyFactor = (distanceZ - sotyStart) / (sotyEnd - sotyStart);
            sotyFactor = Math.min(1, Math.max(0, sotyFactor));
            sotyFactor = 1 - Math.pow(1 - sotyFactor, 2); // ease out
        } else if (distanceZ >= sotyEnd) {
            sotyFactor = 1;
        }

        // Apply standard spread
        const spreadX = 5;

        if (sotdRef.current) {
            sotdRef.current.position.x = -revealFactor * spreadX;
        }
        if (sotmRef.current) {
            sotmRef.current.position.x = revealFactor * spreadX;
        }
        if (honorableRef.current) {
            honorableRef.current.position.y = 0.5 - revealFactor * 4;
        }

        // Apply SOTY movement (Upwards)
        if (sotyRef.current) {
            // Start at 0.5, move up by 2.5 units
            sotyRef.current.position.y = 0.5 + sotyFactor * 2.5;
        }
    });

    return (
        <group ref={groupRef} position={[0, 2, z]}>
            {/* Title */}
            <Text
                position={[0, 4, 0]}
                fontSize={1.2}
                color="#1a1a1a"
                anchorX="center"
                anchorY="middle"
                font="/fonts/CabinSketch-Bold.ttf"
            >
                ✦ AWARDS ✦
            </Text>

            {/* === HONORABLE (furthest back, rendered first) === */}
            <group ref={honorableRef} position={[0, 0.5, -0.7]}>
                <mesh>
                    <planeGeometry args={[3, 2]} />
                    <meshBasicMaterial color="#fef2f2" />
                </mesh>
                <Text position={[0, 0.3, 0.1]} fontSize={0.3} color="#1a1a1a" anchorX="center" font="/fonts/CabinSketch-Bold.ttf">
                    Honorable Mention
                </Text>
                <Text position={[0, -0.3, 0.1]} fontSize={0.5} color="#ef4444" anchorX="center" font="/fonts/CabinSketch-Bold.ttf">
                    ★★
                </Text>
            </group>

            {/* === SOTD (behind SOTY, rendered second) === */}
            <group ref={sotdRef} position={[0, 0.5, -0.5]}>
                <mesh>
                    <planeGeometry args={[3, 2.5]} />
                    <meshBasicMaterial color="#fffbeb" />
                </mesh>
                <Text position={[0, 0.5, 0.1]} fontSize={0.35} color="#1a1a1a" anchorX="center" font="/fonts/CabinSketch-Bold.ttf">
                    SOTD
                </Text>
                <Text position={[0, 0, 0.1]} fontSize={0.25} color="#666666" anchorX="center" font="/fonts/CabinSketch-Regular.ttf">
                    Site of the Day
                </Text>
                <Text position={[0, -0.5, 0.1]} fontSize={0.5} color="#f59e0b" anchorX="center" font="/fonts/CabinSketch-Bold.ttf">
                    ★★
                </Text>
            </group>

            {/* === SOTM (behind SOTY, rendered third) === */}
            <group ref={sotmRef} position={[0, 0.5, -0.2]}>
                <mesh>
                    <planeGeometry args={[3, 2.5]} />
                    <meshBasicMaterial color="#f0fdf4" />
                </mesh>
                <Text position={[0, 0.5, 0.1]} fontSize={0.35} color="#1a1a1a" anchorX="center" font="/fonts/CabinSketch-Bold.ttf">
                    SOTM
                </Text>
                <Text position={[0, 0, 0.1]} fontSize={0.25} color="#666666" anchorX="center" font="/fonts/CabinSketch-Regular.ttf">
                    Site of the Month
                </Text>
                <Text position={[0, -0.5, 0.1]} fontSize={0.4} color="#999999" anchorX="center" font="/fonts/CabinSketch-Bold.ttf">
                    Coming Soon
                </Text>
            </group>

            {/* === SOTY (front, center, rendered LAST = always on top) === */}
            <group ref={sotyRef} position={[0, 0.5, 0]}>
                <mesh>
                    <planeGeometry args={[3, 2.5]} />
                    <meshBasicMaterial color="#f5f5f5" />
                </mesh>
                <Text position={[0, 0.5, 0.1]} fontSize={0.35} color="#1a1a1a" anchorX="center" font="/fonts/CabinSketch-Bold.ttf">
                    SOTY
                </Text>
                <Text position={[0, 0, 0.1]} fontSize={0.25} color="#666666" anchorX="center" font="/fonts/CabinSketch-Regular.ttf">
                    Site of the Year
                </Text>
                <Text position={[0, -0.5, 0.1]} fontSize={0.4} color="#999999" anchorX="center" font="/fonts/CabinSketch-Bold.ttf">
                    Coming Soon
                </Text>
            </group>
        </group>
    );
};

/**
 * JOURNEY Milestone - Floating Islands
 * UO Island (left) and Freelance Island (right) floating in clouds
 */
const JourneyMilestone = ({ z, scrollProgress }) => {
    const { camera } = useThree();
    const groupRef = useRef();
    const uoRef = useRef();
    const freelanceRef = useRef();

    // Load textures
    const uoTexture = useLoader(THREE.TextureLoader, '/textures/about/uowyspa.png');
    const freelanceTexture = useLoader(THREE.TextureLoader, '/textures/about/freelancewyspa.png');

    // Texture settings
    uoTexture.colorSpace = THREE.SRGBColorSpace;
    freelanceTexture.colorSpace = THREE.SRGBColorSpace;

    // Calculate aspect ratios to keep images 1:1 (not stretched)
    // Default to 1 if image not fully loaded yet
    const uoAspect = uoTexture.image ? uoTexture.image.width / uoTexture.image.height : 1;
    const freelanceAspect = freelanceTexture.image ? freelanceTexture.image.width / freelanceTexture.image.height : 1;

    // Base height for islands - width will adjust automatically
    const islandHeight = 4.5;

    useFrame((state) => {
        if (!groupRef.current) return;

        // === CORRIDOR CLIPPING (ANGLE-AWARE) ===
        const worldZ = groupRef.current.getWorldPosition(new THREE.Vector3()).z;
        const cameraX = Math.abs(camera.position.x);
        const angleBonus = Math.max(0, (1.5 - cameraX) * 3);
        const dynamicClipZ = MILESTONE_CORRIDOR_CLIP_Z - angleBonus;
        const clipThreshold = camera.position.z + dynamicClipZ;

        groupRef.current.visible = worldZ <= clipThreshold;
        if (!groupRef.current.visible) return;

        const time = state.clock.elapsedTime;

        // FIX: Use consistent distance based on scrollProgress + offset
        const distanceZ = z + scrollProgress - 55;

        // Reveal effect (islands float up from below clouds)
        // === EDYTUJ TUTAJ (JOURNEY) ===
        const revealStart = -100; // Wcześniejszy start
        const revealEnd = -20;
        let revealFactor = 0;

        if (distanceZ > revealStart && distanceZ < revealEnd) {
            revealFactor = (distanceZ - revealStart) / (revealEnd - revealStart);
            revealFactor = Math.min(1, Math.max(0, revealFactor));
            revealFactor = 1 - Math.pow(1 - revealFactor, 2);
        } else if (distanceZ >= revealEnd) {
            revealFactor = 1;
        }

        // Floating animation (bobbing)
        // UO Island (Left)
        if (uoRef.current) {
            // === EDYTUJ POZYCJE TUTAJ (UO) ===
            // Startowe Y (schowane): -6
            // Końcowe Y (widoczne): -1.5
            const startY = 0;
            const endY = 4;

            const currentBaseY = startY + revealFactor * (endY - startY);
            uoRef.current.position.y = currentBaseY + Math.sin(time * 0.5) * 0.2;
            uoRef.current.rotation.z = Math.sin(time * 0.3) * 0.05;
        }

        // Freelance Island (Right)
        if (freelanceRef.current) {
            // === EDYTUJ POZYCJE TUTAJ (Freelance) ===
            const startY = 1;
            const endY = 3;

            const currentBaseY = startY + revealFactor * (endY - startY);
            freelanceRef.current.position.y = currentBaseY + Math.sin(time * 0.4 + 2) * 0.25;
            freelanceRef.current.rotation.z = Math.sin(time * 0.2 + 1) * -0.05;
        }
    });

    return (
        <group ref={groupRef} position={[0, 0, z]}>
            {/* Title */}
            <Text
                position={[0, 5, 0.3]}
                fontSize={1.2}
                color="#1a1a1a"
                anchorX="center"
                anchorY="middle"
                font="/fonts/CabinSketch-Bold.ttf"
            >
                ✦ JOURNEY ✦
            </Text>

            {/* Subtitle */}
            <Text
                position={[0, 4.2, 0.3]}
                fontSize={0.35}
                color="#555555"
                anchorX="center"
                anchorY="middle"
                font="/fonts/CabinSketch-Regular.ttf"
            >
                My path so far...
            </Text>

            {/* === UO ISLAND (Left) === */}
            <group ref={uoRef} position={[-3.5, -1, 0]}>
                <mesh>
                    <planeGeometry args={[islandHeight * uoAspect, islandHeight]} />
                    <meshBasicMaterial
                        map={uoTexture}
                        transparent
                        side={THREE.DoubleSide}
                    />
                </mesh>
                {/* NAPIS NA WYSPIE (UO) - EDYTUJ TUTAJ */}
                <Text
                    position={[0.1, -0.85, 0.1]} // POZYCJA (X, Y, Z)
                    fontSize={0.4}           // WIELKOŚĆ
                    color="#1a1a1a"
                    anchorX="center"
                    anchorY="middle"
                    font="/fonts/CabinSketch-Bold.ttf"
                >
                    2025-NOW
                </Text>
            </group>

            {/* === FREELANCE ISLAND (Right) === */}
            <group ref={freelanceRef} position={[3.5, -2, 0.5]}>
                <mesh>
                    <planeGeometry args={[islandHeight * freelanceAspect, islandHeight]} />
                    <meshBasicMaterial
                        map={freelanceTexture}
                        transparent
                        side={THREE.DoubleSide}
                    />
                </mesh>
                {/* NAPIS NA WYSPIE (Freelance) - EDYTUJ TUTAJ */}
                <Text
                    position={[0, -0.65, 0.1]} // POZYCJA (X, Y, Z)
                    fontSize={0.5}           // WIELKOŚĆ
                    color="#1a1a1a"
                    anchorX="center"
                    anchorY="middle"
                    font="/fonts/CabinSketch-Bold.ttf"
                >
                    2023-NOW
                </Text>
            </group>
        </group>
    );
};

/**
 * SKILLS Milestone - Floating Balloons
 * Colorful balloons floating upward, each representing a skill
 */

// Balloon configuration: size category, texture path, position offset
// === EDYTUJ WYSOKOŚĆ TUTAJ (zmień wartość 'y' dla każdego balona) ===
const BALLOON_CONFIG = [
    // Large balloons (main skills) - front and center
    { texture: '/textures/about/reactduzybalon.png', size: 'large', x: -2.5, y: 2, z: 0.3, phase: 0 },
    { texture: '/textures/about/threejsduzybalon.png', size: 'large', x: 2.5, y: 2.5, z: 0.2, phase: 1.5 },
    { texture: '/textures/about/GSAPduzybalon.png', size: 'large', x: 0, y: 3, z: 0.5, phase: 3 },

    // Medium balloons - scattered around
    { texture: '/textures/about/JSSREDNIBALON.png', size: 'medium', x: -4, y: 1, z: -0.3, phase: 0.8 },
    { texture: '/textures/about/csssrednibalon.png', size: 'medium', x: 4, y: 1.5, z: -0.2, phase: 2.2 },
    { texture: '/textures/about/nextjssrednibalon.png', size: 'medium', x: 0, y: 0.5, z: -0.4, phase: 4 },

    // Small balloons - background accents
    { texture: '/textures/about/htmlmalybalon.png', size: 'small', x: -5.5, y: 2.5, z: -0.8, phase: 1.2 },
    { texture: '/textures/about/gitmalybalon.png', size: 'small', x: 5.5, y: 3, z: -0.7, phase: 2.8 },
    { texture: '/textures/about/figmamalybalon.png', size: 'small', x: -3, y: 4.5, z: -0.5, phase: 3.5 },
    { texture: '/textures/about/firebasemalybalon.png', size: 'small', x: 3.5, y: 4, z: -0.6, phase: 4.5 },
];

// Size multipliers for balloon categories
const SIZE_MULTIPLIERS = {
    large: 3.0,
    medium: 2.2,
    small: 1.6,
};

// Individual balloon component
const SkillBalloon = ({ config, revealFactor, spreadFactor, time }) => {
    const { viewport } = useThree();
    const texture = useLoader(THREE.TextureLoader, config.texture);
    texture.colorSpace = THREE.SRGBColorSpace;

    const aspect = texture.image ? texture.image.width / texture.image.height : 1;
    const baseHeight = SIZE_MULTIPLIERS[config.size];

    // === RESPONSYWNOŚĆ ===
    // Na mobile (wąski viewport) balony są bliżej środka
    const isMobile = viewport.width < 8;
    const positionScale = isMobile ? 0.5 : 1; // Jak bardzo ściskamy pozycje na mobile
    const spreadScale = isMobile ? 0.4 : 1;   // Jak bardzo zmniejszamy spread na mobile
    const sizeScale = isMobile ? 0.85 : 1;    // Trochę mniejsze balony na mobile

    // Floating animation with unique phase
    const floatY = Math.sin(time * 0.6 + config.phase) * 0.3;
    const floatX = Math.sin(time * 0.4 + config.phase * 0.7) * 0.15;
    const rotation = Math.sin(time * 0.3 + config.phase) * 0.08;

    // Reveal: balloons float up from below
    const startY = config.y - 8;
    const endY = config.y;
    const currentY = startY + revealFactor * (endY - startY) + floatY;

    // Scale up as they reveal
    const scale = revealFactor * sizeScale;

    // === SPREAD EFFECT (ROZSUWANIE) ===
    // Wszystkie balony rozsuwają się na boki
    const maxSpread = 15 * spreadScale; // Mniejszy spread na mobile

    let spreadX = 0;

    if (config.x < -0.5) {
        // Lewa strona → idzie w lewo
        spreadX = -spreadFactor * maxSpread * (0.5 + Math.abs(config.x) / 6);
    } else if (config.x > 0.5) {
        // Prawa strona → idzie w prawo
        spreadX = spreadFactor * maxSpread * (0.5 + Math.abs(config.x) / 6);
    } else {
        // Środkowe balony (x blisko 0) → rozsuń na podstawie phase
        spreadX = config.phase > 3.5
            ? spreadFactor * maxSpread * 0.8  // w prawo (Next.js)
            : -spreadFactor * maxSpread * 0.8; // w lewo (GSAP)
    }

    // Bazowa pozycja X (skalowana na mobile)
    const baseX = config.x * positionScale;

    return (
        <mesh
            position={[baseX + floatX + spreadX, currentY, config.z]}
            rotation={[0, 0, rotation]}
            scale={scale}
        >
            <planeGeometry args={[baseHeight * aspect, baseHeight]} />
            <meshBasicMaterial
                map={texture}
                transparent
                side={THREE.DoubleSide}
                depthWrite={false}
            />
        </mesh>
    );
};

const SkillsMilestone = ({ z, scrollProgress }) => {
    const { camera } = useThree();
    const groupRef = useRef();
    const [revealFactor, setRevealFactor] = useState(0);
    const [spreadFactor, setSpreadFactor] = useState(0);
    const [time, setTime] = useState(0);

    useFrame((state) => {
        if (!groupRef.current) return;

        // === CORRIDOR CLIPPING (ANGLE-AWARE) ===
        const worldZ = groupRef.current.getWorldPosition(new THREE.Vector3()).z;
        const cameraX = Math.abs(camera.position.x);
        const angleBonus = Math.max(0, (1.5 - cameraX) * 3);
        const dynamicClipZ = MILESTONE_CORRIDOR_CLIP_Z - angleBonus;
        const clipThreshold = camera.position.z + dynamicClipZ;

        groupRef.current.visible = worldZ <= clipThreshold;
        if (!groupRef.current.visible) return;

        setTime(state.clock.elapsedTime);

        // FIX: Use consistent distance based on scrollProgress + offset
        const distanceZ = z + scrollProgress - 55;

        // Reveal effect (balloons float up)
        // === EDYTUJ TUTAJ (SKILLS REVEAL) ===
        const revealStart = -100;
        const revealEnd = -25;
        let newRevealFactor = 0;

        if (distanceZ > revealStart && distanceZ < revealEnd) {
            newRevealFactor = (distanceZ - revealStart) / (revealEnd - revealStart);
            newRevealFactor = Math.min(1, Math.max(0, newRevealFactor));
            newRevealFactor = 1 - Math.pow(1 - newRevealFactor, 3); // ease out cubic
        } else if (distanceZ >= revealEnd) {
            newRevealFactor = 1;
        }

        setRevealFactor(newRevealFactor);

        // === SPREAD EFFECT (EDYTUJ TUTAJ SKILLS SPREAD) ===
        // Im bliżej kamery, tym bardziej balony się rozsuwają
        // Większy zakres = dłuższa, bardziej widoczna animacja
        const spreadStart = -70; // Kiedy animacja SIĘ ZACZYNA (Wcześniej)
        const spreadEnd = -40;    // Kiedy animacja jest PEŁNA (Później)
        let newSpreadFactor = 0;

        if (distanceZ > spreadStart && distanceZ < spreadEnd) {
            newSpreadFactor = (distanceZ - spreadStart) / (spreadEnd - spreadStart);
            newSpreadFactor = Math.min(1, Math.max(0, newSpreadFactor));
            newSpreadFactor = newSpreadFactor * newSpreadFactor; // ease in
        } else if (distanceZ >= spreadEnd) {
            newSpreadFactor = 1;
        }

        setSpreadFactor(newSpreadFactor);
    });

    return (
        <group ref={groupRef} position={[0, 0, z]}>
            {/* Title */}
            <Text
                position={[0, 6, 0.5]}
                fontSize={1.2}
                color="#1a1a1a"
                anchorX="center"
                anchorY="middle"
                font="/fonts/CabinSketch-Bold.ttf"
            >
                ✦ SKILLS ✦
            </Text>

            {/* Subtitle */}
            <Text
                position={[0, 5.2, 0.5]}
                fontSize={0.35}
                color="#555555"
                anchorX="center"
                anchorY="middle"
                font="/fonts/CabinSketch-Regular.ttf"
            >
                Technologies I love working with
            </Text>

            {/* === FLOATING BALLOONS === */}
            {BALLOON_CONFIG.map((config, index) => (
                <SkillBalloon
                    key={index}
                    config={config}
                    revealFactor={revealFactor}
                    spreadFactor={spreadFactor}
                    time={time}
                />
            ))}
        </group>
    );
};

// =========================================
// NOTE: Use this component inside the loop!
// =========================================

export default InfiniteSkyManager;
