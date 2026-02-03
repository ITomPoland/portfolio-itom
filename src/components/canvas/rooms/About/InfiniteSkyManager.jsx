import { useState, useRef, useMemo } from 'react';
import { useFrame, useLoader } from '@react-three/fiber';
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
                    />

                    {/* === AWARDS MILESTONE === */}
                    <AwardsMilestone
                        z={-(cycleIndex * STORY_CYCLE_LENGTH + 55)}
                    />

                    {/* === JOURNEY MILESTONE === */}
                    <JourneyMilestone
                        z={-(cycleIndex * STORY_CYCLE_LENGTH + 95)}
                    />

                    {/* === SKILLS MILESTONE === */}

                    <SkillsMilestone
                        z={-(cycleIndex * STORY_CYCLE_LENGTH + 135)}
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
const IntroMilestone = ({ z }) => {
    // Load avatar texture
    const avatarTexture = useLoader(THREE.TextureLoader, '/textures/about/awatarnachmurce.png');

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

        // Get world Z position of the group
        const worldPos = new THREE.Vector3();
        groupRef.current.getWorldPosition(worldPos);

        // Calculate how close we are to camera (camera is at z ~ 0)
        // worldPos.z goes from negative (far) to positive (passed)
        const distanceZ = worldPos.z;

        // Spread effect: starts at z = -25, full spread at z = -5
        // This makes elements spread BEFORE they reach the camera
        const spreadStart = -50;
        const spreadEnd = -40;
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
const AwardsMilestone = ({ z }) => {
    const groupRef = useRef();
    const sotyRef = useRef();
    const sotdRef = useRef();
    const sotmRef = useRef();
    const honorableRef = useRef();

    useFrame((state) => {
        if (!groupRef.current) return;

        const worldPos = new THREE.Vector3();
        groupRef.current.getWorldPosition(worldPos);
        const distanceZ = worldPos.z;

        // 1. Standard reveal (SOTD, SOTM, Honorable)
        const revealStart = -80;
        const revealEnd = -40;
        let revealFactor = 0;

        if (distanceZ > revealStart && distanceZ < revealEnd) {
            revealFactor = (distanceZ - revealStart) / (revealEnd - revealStart);
            revealFactor = Math.min(1, Math.max(0, revealFactor));
            revealFactor = revealFactor * revealFactor; // ease in
        } else if (distanceZ >= revealEnd) {
            revealFactor = 1;
        }

        // 2. SOTY reveal (starts LATER, moves UP)
        const sotyStart = -60;
        const sotyEnd = -0;
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
const JourneyMilestone = ({ z }) => {
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

        const time = state.clock.elapsedTime;
        const worldPos = new THREE.Vector3();
        groupRef.current.getWorldPosition(worldPos);
        const distanceZ = worldPos.z;

        // Reveal effect (islands float up from below clouds)
        const revealStart = -60;
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
 * SKILLS Milestone - The Skill Tree
 * A large tree growing on a cloud, representing growth and knowledge
 */
const SkillsMilestone = ({ z }) => {
    const groupRef = useRef();
    const treeRef = useRef();

    // Load texture
    const treeTexture = useLoader(THREE.TextureLoader, '/textures/about/skilltree.png');
    treeTexture.colorSpace = THREE.SRGBColorSpace;

    // Calculate aspect ratio
    const treeAspect = treeTexture.image ? treeTexture.image.width / treeTexture.image.height : 1;
    const treeHeight = 7; // It's a big tree!

    useFrame((state) => {
        if (!groupRef.current) return;

        const time = state.clock.elapsedTime;
        const worldPos = new THREE.Vector3();
        groupRef.current.getWorldPosition(worldPos);
        const distanceZ = worldPos.z;

        // Reveal effect (tree grows up)
        const revealStart = -60;
        const revealEnd = -20;
        let revealFactor = 0;

        if (distanceZ > revealStart && distanceZ < revealEnd) {
            revealFactor = (distanceZ - revealStart) / (revealEnd - revealStart);
            revealFactor = Math.min(1, Math.max(0, revealFactor));
            revealFactor = 1 - Math.pow(1 - revealFactor, 2); // ease out
        } else if (distanceZ >= revealEnd) {
            revealFactor = 1;
        }

        // Animation
        if (treeRef.current) {
            // Grow up from bottom
            const startY = 0;
            const endY = 3;
            const currentY = startY + revealFactor * (endY - startY);

            treeRef.current.position.y = currentY;

            // Gentle sway (wind)
            treeRef.current.rotation.z = Math.sin(time * 0.8) * 0.03;
        }
    });

    return (
        <group ref={groupRef} position={[0, 0, z]}>
            {/* Title */}
            <Text
                position={[0, 5.5, 0]}
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
                position={[0, 4.8, 0]}
                fontSize={0.35}
                color="#555555"
                anchorX="center"
                anchorY="middle"
                font="/fonts/CabinSketch-Regular.ttf"
            >
                Ever-growing knowledge
            </Text>

            {/* === SKILL TREE === */}
            <group ref={treeRef} position={[0, 2, 0]}>
                <mesh>
                    <planeGeometry args={[treeHeight * treeAspect, treeHeight]} />
                    <meshBasicMaterial
                        map={treeTexture}
                        transparent
                        side={THREE.DoubleSide}
                    />
                </mesh>
            </group>
        </group>
    );
};

// =========================================
// NOTE: Use this component inside the loop!
// =========================================

export default InfiniteSkyManager;
