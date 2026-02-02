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
                    <MilestoneSection
                        z={-(cycleIndex * STORY_CYCLE_LENGTH + 95)}
                        title="JOURNEY"
                        subtitle="Computer Science @ University of Opole"
                    />

                    {/* === SKILLS MILESTONE === */}
                    <MilestoneSection
                        z={-(cycleIndex * STORY_CYCLE_LENGTH + 135)}
                        title="SKILLS"
                        subtitle="React • Three.js • GSAP • Creative Code"
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
    const sotdRef = useRef();
    const sotmRef = useRef();
    const honorableRef = useRef();

    useFrame((state) => {
        if (!groupRef.current) return;

        const worldPos = new THREE.Vector3();
        groupRef.current.getWorldPosition(worldPos);
        const distanceZ = worldPos.z;

        // Card reveal timing
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

        // Cards spread outward
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
    });

    return (
        <group ref={groupRef} position={[0, 0, z]}>
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
            <group position={[0, 0.5, 0]}>
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
 * Generic Milestone Section (for Journey, Skills)
 */
const MilestoneSection = ({ z, title, subtitle }) => {
    return (
        <group position={[0, 0, z]}>
            {/* Title */}
            <Text
                position={[0, 0.5, 0]}
                fontSize={1.5}
                color="#1a1a1a"
                anchorX="center"
                anchorY="middle"
                font="/fonts/CabinSketch-Bold.ttf"
            >
                {title}
            </Text>

            {/* Subtitle */}
            <Text
                position={[0, -0.3, 0]}
                fontSize={0.35}
                color="#4a4a4a"
                anchorX="center"
                anchorY="middle"
                font="/fonts/CabinSketch-Regular.ttf"
            >
                {subtitle}
            </Text>
        </group>
    );
};

export default InfiniteSkyManager;
