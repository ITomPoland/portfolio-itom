import { useState, useRef, useMemo, useEffect } from 'react';
import { useFrame, useLoader, useThree } from '@react-three/fiber';
import { PositionalAudio } from '@react-three/drei';
import Text from '../../LocalText';
import * as THREE from 'three';
import gsap from 'gsap';
import SkyChunk, { CHUNK_LENGTH, ROOM_Z } from './SkyChunk';
import { useScene } from '../../../../context/SceneContext';
import '../../shaders/RevealBasicMaterial'; // Registers brush-stroke reveal for BasicMaterial
import { isTouchDevice } from '../../../../utils/deviceDetect';
import { useAwards } from '../../../../hooks/useSanityData';
import { ABOUT_BODY_FONT, ABOUT_DISPLAY_FONT, ABOUT_INK, ABOUT_MUTED_INK } from './aboutTheme';

// Reusable Vector3 to avoid allocations in event handlers
const _tempVec3 = new THREE.Vector3();

/**
 * InfiniteSkyManager Component
 * 
 * Manages dynamic generation/removal of sky chunks for infinite scroll.
 * World group moves with scroll, chunks stay at fixed positions relative to group.
 * Includes Story Milestones that loop with the content!
 */

import { useAudio } from '../../../../context/AudioManager';

export const BALLOON_AUDIO_SETTINGS = {
    volume: 1.0,
    distance: 2,
    rolloff: 2
};

/**
 * Reusable Button Component with Hover Effect + Brush-Stroke Reveal
 */
const AwardButton = ({ onClick, texture, paintedTexture, width, height, position, onHoverChange }) => {
    const isTouch = isTouchDevice();
    const meshRef = useRef();
    const buttonRevealRef = useRef(); // RevealBasicMaterial ref for button sketch
    const paintedRef = useRef(); // Painted button mesh visibility
    const hideDelayRef = useRef(); // Track pending gsap.delayedCall
    const [hovered, setHovered] = useState(false);

    useFrame((state, delta) => {
        if (meshRef.current) {
            // Smoothly lerp scale based on hover state
            const targetScale = hovered ? 1.05 : 1.0;
            const lerpFactor = 10 * delta;

            meshRef.current.scale.x = THREE.MathUtils.lerp(meshRef.current.scale.x, targetScale, lerpFactor);
            meshRef.current.scale.y = THREE.MathUtils.lerp(meshRef.current.scale.y, targetScale, lerpFactor);
            meshRef.current.scale.z = THREE.MathUtils.lerp(meshRef.current.scale.z, targetScale, lerpFactor);
        }
    });

    const handlePointerOver = () => {
        if (isTouch) return;
        setHovered(true);
        document.body.style.cursor = 'pointer';
        onHoverChange?.(true);

        // Brush-stroke reveal button
        if (buttonRevealRef.current) {
            gsap.to(buttonRevealRef.current, {
                uProgress: 1.0,
                duration: 0.8,
                ease: 'power2.out',
                overwrite: true
            });
        }
        if (hideDelayRef.current) hideDelayRef.current.kill();
        if (paintedRef.current) {
            paintedRef.current.visible = true;
            if (paintedRef.current.material) paintedRef.current.material.opacity = 1;
        }
    };

    const handlePointerOut = () => {
        if (isTouch) return;
        setHovered(false);
        document.body.style.cursor = 'auto';
        onHoverChange?.(false);

        // Reverse reveal
        if (buttonRevealRef.current) {
            gsap.to(buttonRevealRef.current, {
                uProgress: 0.0,
                duration: 0.5,
                ease: 'power2.out',
                overwrite: true
            });
        }
        hideDelayRef.current = gsap.delayedCall(0.55, () => {
            if (paintedRef.current && paintedRef.current.material) {
                paintedRef.current.material.opacity = 0;
            }
        });
    };

    return (
        <group ref={meshRef} position={position}>
            {/* Painted button (behind) - hidden until hover */}
            <mesh ref={paintedRef} position={[0, 0, -0.001]} visible={true}>
                <planeGeometry args={[width, height]} />
                <meshBasicMaterial color="#e0e0e0"
                    map={paintedTexture}
                    transparent
                    opacity={0}
                    side={THREE.DoubleSide}
                    alphaTest={0.5}
                    depthWrite={false}
                />
            </mesh>
            {/* Sketch button (front) with reveal */}
            <mesh
                onClick={onClick}
                onPointerOver={handlePointerOver}
                onPointerOut={handlePointerOut}
            >
                <planeGeometry args={[width, height]} />
                <revealBasicMaterial
                    ref={buttonRevealRef}
                    map={texture}
                    transparent
                    side={THREE.DoubleSide}
                    alphaTest={0.1}
                    depthWrite={false}
                    uProgress={0.0}
                />
            </mesh>
            <Text
                position={[0, 0, 0.05]}
                fontSize={0.25}
                color="#1a1a1a"
                anchorX="center"
                anchorY="middle"
                font={ABOUT_DISPLAY_FONT}
            >
                VIEW
            </Text>
        </group>
    );
};

// Story milestones configuration
// Each milestone appears once per "story cycle" (4 chunks = 160 units)
const STORY_CYCLE_LENGTH = 160;

// === TWARDA LINIA ZANIKANIA DLA MILESTONES (WORLD SPACE) ===
// Pokój About jest na Z = -25, więc -25 to drzwi pokoju
// -27 = 2 metry za drzwiami (w głąb pokoju) - musi matchować CORRIDOR_CLIP_Z w SkyChunk
const MILESTONE_CORRIDOR_CLIP_Z = -8.0;

const InfiniteSkyManager = ({ scrollProgressRef }) => {
    // PRE-CALCULATED FOR scrolProgress = 0
    // currentChunk = floor(0/40) = 0 -> [-1, 0, 1, 2]
    const [activeChunks, setActiveChunks] = useState([-1, 0, 1, 2]);
    // currentStoryCycle = floor(0/160) = 0 -> [-1, 0, 1]
    const [activeStoryCycles, setActiveStoryCycles] = useState([-1, 0, 1]);
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

        const scrollProgress = scrollProgressRef?.current || 0;

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
                    scrollProgressRef={scrollProgressRef}
                />
            ))}

            {/* === STORY MILESTONES (loop every 160 units) === */}
            {activeStoryCycles.map((cycleIndex) => (
                <group key={`story-cycle-${cycleIndex}`}>
                    {/* === INTRO MILESTONE === */}
                    <IntroMilestone
                        z={-(cycleIndex * STORY_CYCLE_LENGTH + 15)}
                        scrollProgressRef={scrollProgressRef}
                    />

                    {/* === AWARDS MILESTONE === */}
                    <AwardsMilestone
                        z={-(cycleIndex * STORY_CYCLE_LENGTH + 55)}
                        scrollProgressRef={scrollProgressRef}
                    />

                    {/* === JOURNEY MILESTONE === */}
                    <JourneyMilestone
                        z={-(cycleIndex * STORY_CYCLE_LENGTH + 95)}
                        scrollProgressRef={scrollProgressRef}
                    />

                    {/* === SKILLS MILESTONE === */}

                    <SkillsMilestone
                        z={-(cycleIndex * STORY_CYCLE_LENGTH + 135)}
                        scrollProgressRef={scrollProgressRef}
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
const IntroMilestone = ({ z, scrollProgressRef }) => {
    // Load avatar texture
    const avatarTexture = useLoader(THREE.TextureLoader, '/assets/about/awatarnachmurce.webp');
    const { camera, viewport } = useThree();
    const isTouch = isTouchDevice();

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
    // LEGACY FIX: Use original dimensions (2816x1536) to prevent stretching
    const legacyAspectRatio = 2816 / 1536; 
    const avatarWidth = 6; // Zwiększony rozmiar awatara na chmurce
    const avatarHeight = avatarWidth / legacyAspectRatio;

    // Animation: floating + spread apart when close
    useFrame((state) => {
        if (!groupRef.current) return;

        const time = state.clock.elapsedTime;

        // === TWARDA LINIA CLIP (RĘCZNE OBLICZENIE WORLD Z) ===
        // worldZ = pokój(-25) + scrollProgress + lokalna pozycja milestone
        const scrollProgress = scrollProgressRef?.current || 0;
        const worldZ = ROOM_Z + scrollProgress + z;
        groupRef.current.visible = worldZ < MILESTONE_CORRIDOR_CLIP_Z;

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

        // Keep the editorial composition together while still letting it breathe on approach.
        const layoutScale = isTouch ? 0.72 : 1;

        if (titleRef.current) {
            titleRef.current.position.x = (-1.25 - spreadFactor * 1.6) * layoutScale;
        }
        if (brandRef.current) {
            brandRef.current.position.x = (1.35 + spreadFactor * 1.25) * layoutScale;
        }
        if (avatarRef.current) {
            avatarRef.current.position.y = baseY + Math.sin(time * 0.8) * 0.15 + spreadFactor * 0.65;
            avatarRef.current.position.x = (-0.1 - spreadFactor * 0.55) * layoutScale;
        }
        if (motto1Ref.current) {
            motto1Ref.current.position.x = (1.05 + spreadFactor * 1.15) * layoutScale;
        }
        if (motto2Ref.current) {
            motto2Ref.current.position.x = (-0.95 - spreadFactor) * layoutScale;
        }
    });

    return (
        <group ref={groupRef} position={[0, 0, z]}>
            {/* Main title - Name (spreads left) */}
            <Text
                ref={titleRef}
                position={[-1.25, 5, 0.1]}
                fontSize={0.92}
                color={ABOUT_INK}
                anchorX="center"
                anchorY="middle"
                font={ABOUT_DISPLAY_FONT}
                letterSpacing={0.04}
            >
                吴桐
            </Text>

            {/* Subtitle - Brand (spreads right) */}
            <Text
                ref={brandRef}
                position={[1.35, 4.25, 0.1]}
                fontSize={0.37}
                color={ABOUT_MUTED_INK}
                anchorX="center"
                anchorY="middle"
                font={ABOUT_BODY_FONT}
                letterSpacing={0.05}
            >
                (AI 设计师)
            </Text>

            {/* Avatar on cloud - floating + spreads up-left */}
            <mesh ref={avatarRef} position={[0, baseY, 0]}>
                <planeGeometry args={[avatarWidth, avatarHeight]} />
                <meshBasicMaterial color="#e0e0e0"
                    map={avatarTexture}
                    transparent
                    side={THREE.DoubleSide}
                    depthWrite={false}
                />
            </mesh>

            {/* Motto - Line 1 (spreads right) */}
            <Text
                ref={motto1Ref}
                position={[1.05, 0.1, 0.1]}
                fontSize={0.3}
                color={ABOUT_MUTED_INK}
                anchorX="center"
                anchorY="middle"
                font={ABOUT_BODY_FONT}
                letterSpacing={0.025}
            >
                "用 AI 与好奇心，
            </Text>

            {/* Motto - Line 2 (spreads left) */}
            <Text
                ref={motto2Ref}
                position={[-0.95, -0.5, 0]}
                fontSize={0.3}
                color={ABOUT_MUTED_INK}
                anchorX="center"
                anchorY="middle"
                font={ABOUT_BODY_FONT}
                letterSpacing={0.025}
            >
                AI 是我的下一站"
            </Text>
        </group>
    );
};

/**
 * MOCK DATA FOR AWARDS
 */
const AWARDS_DATA = {
    featured: {
        id: 'award-featured',
        layout: 'certificate_grid',
        title: '精选项目合集',
        items: [
            { label: '精选 - Awwwards', date: '2025年5月', image: '/textures/about/FEATURED.webp', url: 'https://example.com' },
            { label: '精选 - CSS Design Awards', date: '2025年6月', image: '/textures/about/FEATURED.webp', url: 'https://example.com' },
            { label: '精选 - The FWA', date: '2025年7月', image: '/textures/about/FEATURED.webp', url: 'https://example.com' },
            { label: '精选 - Behance', date: '2025年8月', image: '/textures/about/FEATURED.webp', url: 'https://example.com' },
        ],
        platformConfig: {
            label: '荣誉',
            color: '#1a1a1a',
            icon: '⭐'
        }
    },
    sotd: {
        id: 'award-sotd',
        layout: 'certificate_grid',
        title: '每日精选荣誉',
        items: [
            { label: '每日精选 - GSAP', date: '2026年2月13日', image: '/assets/about/SOTDAYYOUNGMULTIGSAP.webp', url: 'https://example.com' },
            { label: '每日精选 - CSS Winner', date: '2026年1月24日', image: '/assets/about/SOTDAYYOUNGMULTICSSWINNER.webp', url: 'https://example.com' },
            { label: '每日精选 - Orpetron', date: '2026年1月29日', image: '/assets/about/SOTDAYYOUNGMULTIORPETRON.webp', url: 'https://example.com' },
            { label: '每日精选 - Design Nominess', date: '2026年2月17日', image: '/assets/about/SOTDAYYOUNGMULTIDESIGNNOMINESS.webp', url: 'https://example.com' }
        ],
        platformConfig: {
            label: '奖项',
            color: '#1a1a1a',
            icon: '🏆'
        }
    },
    sotm: {
        id: 'award-sotm',
        layout: 'certificate_grid',
        title: '月度精选荣誉',
        items: [],
        platformConfig: {
            label: '奖项',
            color: '#1a1a1a',
            icon: '📅'
        }
    },
    other: {
        id: 'award-other',
        layout: 'certificate_grid',
        title: '其他荣誉',
        items: [],
        platformConfig: {
            label: '殊荣',
            color: '#1a1a1a',
            icon: '👑'
        }
    }
};

/**
 * AWARDS Milestone - Floating Cards
 * SOTY (center), SOTD, SOTM, Featured (behind)
 */
const AwardsMilestone = ({ z, scrollProgressRef }) => {
    // Pobieranie danych nagród z Sanity (z fallbackiem)
    const sanityAwards = useAwards();
    const awardsData = sanityAwards || AWARDS_DATA;

    const { camera, viewport } = useThree();
    const isTouch = isTouchDevice();
    const { openOverlay } = useScene();
    const groupRef = useRef();
    const sotyRef = useRef();
    const sotdRef = useRef();
    const sotmRef = useRef();

    // Card reveal refs (driven by button hover)
    const sotdCardRevealRef = useRef();
    const sotdCardPaintedRef = useRef();
    const sotdHideDelayRef = useRef();
    const sotmCardRevealRef = useRef();
    const sotmCardPaintedRef = useRef();
    const sotmHideDelayRef = useRef();
    const sotyCardRevealRef = useRef();
    const sotyCardPaintedRef = useRef();
    const sotyHideDelayRef = useRef();

    // Load textures
    const sotyTexture = useLoader(THREE.TextureLoader, '/assets/about/SOTY.webp');
    const sotdTexture = useLoader(THREE.TextureLoader, '/assets/about/SOTD.webp');
    const sotmTexture = useLoader(THREE.TextureLoader, '/assets/about/SOTM.webp');
    const sotyPaintedTexture = useLoader(THREE.TextureLoader, isTouch ? '/assets/about/SOTY.webp' : '/assets/about/SOTY_painted.webp');
    const sotdPaintedTexture = useLoader(THREE.TextureLoader, isTouch ? '/assets/about/SOTD.webp' : '/assets/about/SOTD_painted.webp');
    const sotmPaintedTexture = useLoader(THREE.TextureLoader, isTouch ? '/assets/about/SOTM.webp' : '/assets/about/SOTM_painted.webp');
    const buttonTexture = useLoader(THREE.TextureLoader, '/textures/about/button.webp');
    const buttonPaintedTexture = useLoader(THREE.TextureLoader, isTouch ? '/textures/about/button.webp' : '/textures/about/button_painted.webp');

    // Color space fix
    sotyTexture.colorSpace = THREE.SRGBColorSpace;
    sotdTexture.colorSpace = THREE.SRGBColorSpace;
    sotmTexture.colorSpace = THREE.SRGBColorSpace;
    sotyPaintedTexture.colorSpace = THREE.SRGBColorSpace;
    sotdPaintedTexture.colorSpace = THREE.SRGBColorSpace;
    sotmPaintedTexture.colorSpace = THREE.SRGBColorSpace;
    buttonTexture.colorSpace = THREE.SRGBColorSpace;
    buttonPaintedTexture.colorSpace = THREE.SRGBColorSpace;

    // Calculate aspect ratios
    // LEGACY FIX: Use original dimensions for cards (2400x1760) and buttons (894x208)
    const cardLegacyAspect = 2400 / 1760;
    const buttonLegacyAspect = 894 / 208;

    // Base height for cards
    const cardHeight = 2.5;

    // Button dimensions
    const buttonHeight = 0.35;
    const buttonWidth = buttonHeight * buttonLegacyAspect;
    const buttonY = -cardHeight / 2 - buttonHeight / 2 + 0.5;

    // Card hover handler factory
    const makeCardHoverHandler = (revealRef, paintedRef, hideDelayRef) => (isHovered) => {
        if (isTouch) return;
        if (isHovered) {
            if (revealRef.current) {
                gsap.to(revealRef.current, {
                    uProgress: 1.0,
                    duration: 0.8,
                    ease: 'power2.out',
                    overwrite: true
                });
            }
            if (hideDelayRef.current) hideDelayRef.current.kill();
            if (paintedRef.current) {
                paintedRef.current.visible = true;
                if (paintedRef.current.material) paintedRef.current.material.opacity = 1;
            }
        } else {
            if (revealRef.current) {
                gsap.to(revealRef.current, {
                    uProgress: 0.0,
                    duration: 0.5,
                    ease: 'power2.out',
                    overwrite: true
                });
            }
            hideDelayRef.current = gsap.delayedCall(0.55, () => {
                if (paintedRef.current && paintedRef.current.material) {
                    paintedRef.current.material.opacity = 0;
                }
            });
        }
    };

    useFrame((state) => {
        if (!groupRef.current) return;

        const scrollProgress = scrollProgressRef?.current || 0;
        const worldZ = ROOM_Z + scrollProgress + z;
        groupRef.current.visible = worldZ < MILESTONE_CORRIDOR_CLIP_Z;
        if (!groupRef.current.visible) return;

        const distanceZ = z + scrollProgress - 55;

        const revealStart = -120;
        const revealEnd = -50;
        let revealFactor = 0;

        if (distanceZ > revealStart && distanceZ < revealEnd) {
            revealFactor = (distanceZ - revealStart) / (revealEnd - revealStart);
            revealFactor = Math.min(1, Math.max(0, revealFactor));
            revealFactor = revealFactor * revealFactor;
        } else if (distanceZ >= revealEnd) {
            revealFactor = 1;
        }

        const sotyStart = -80;
        const sotyEnd = -20;
        let sotyFactor = 0;

        if (distanceZ > sotyStart && distanceZ < sotyEnd) {
            sotyFactor = (distanceZ - sotyStart) / (sotyEnd - sotyStart);
            sotyFactor = Math.min(1, Math.max(0, sotyFactor));
            sotyFactor = 1 - Math.pow(1 - sotyFactor, 2);
        } else if (distanceZ >= sotyEnd) {
            sotyFactor = 1;
        }

        const spreadX = 5;

        if (sotdRef.current) {
            sotdRef.current.position.x = -revealFactor * spreadX;
        }
        if (sotmRef.current) {
            sotmRef.current.position.x = revealFactor * spreadX;
        }

        if (sotyRef.current) {
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
                font={ABOUT_DISPLAY_FONT}
            >
                奖项
            </Text>

            {/* === SOTD (behind SOTY, rendered second) === */}
            <group ref={sotdRef} position={[0, 0.5, -0.5]}>
                {/* Painted card (behind) - hidden until button hover */}
                <mesh ref={sotdCardPaintedRef} position={[0, 0, -0.001]} visible={true}>
                    <planeGeometry args={[cardHeight * cardLegacyAspect, cardHeight]} />
                    <meshBasicMaterial color="#e0e0e0"
                        map={sotdPaintedTexture}
                        transparent
                        opacity={0}
                        side={THREE.DoubleSide}
                        alphaTest={0.5}
                    />
                </mesh>
                {/* Sketch card (front) with reveal */}
                <mesh>
                    <planeGeometry args={[cardHeight * cardLegacyAspect, cardHeight]} />
                    <revealBasicMaterial
                        ref={sotdCardRevealRef}
                        map={sotdTexture}
                        transparent
                        side={THREE.DoubleSide}
                        uProgress={0.0}
                    />
                </mesh>
                {/* BUTTON */}
                <AwardButton
                    onClick={(e) => {
                        e.stopPropagation();
                        openOverlay(awardsData.sotd);
                    }}
                    texture={buttonTexture}
                    paintedTexture={buttonPaintedTexture}
                    width={buttonWidth}
                    height={buttonHeight}
                    position={[0, buttonY, 0.05]}
                    onHoverChange={makeCardHoverHandler(sotdCardRevealRef, sotdCardPaintedRef, sotdHideDelayRef)}
                />
                {/* AWARD LABEL */}
                <Text
                    position={[0, 0.95, 0.01]}
                    fontSize={0.45}
                    color="#1a1a1a"
                    anchorX="center"
                    anchorY="middle"
                    font={ABOUT_DISPLAY_FONT}
                >
                    校园精选
                </Text>
                {/* AWARD COUNT */}
                <Text
                    position={[-0.05, 0, 0.01]}
                    fontSize={0.8}
                    color="#1a1a1a"
                    anchorX="center"
                    anchorY="middle"
                    font={ABOUT_DISPLAY_FONT}
                >
                    {awardsData.sotd.items.length}
                </Text>
            </group>

            {/* === SOTM (behind SOTY, rendered third) === */}
            <group ref={sotmRef} position={[0, 0.5, -0.2]}>
                {/* Painted card (behind) - hidden until button hover */}
                <mesh ref={sotmCardPaintedRef} position={[0, 0, -0.001]} visible={true}>
                    <planeGeometry args={[cardHeight * cardLegacyAspect, cardHeight]} />
                    <meshBasicMaterial color="#e0e0e0"
                        map={sotmPaintedTexture}
                        transparent
                        opacity={0}
                        side={THREE.DoubleSide}
                        alphaTest={0.5}
                    />
                </mesh>
                {/* Sketch card (front) with reveal */}
                <mesh>
                    <planeGeometry args={[cardHeight * cardLegacyAspect, cardHeight]} />
                    <revealBasicMaterial
                        ref={sotmCardRevealRef}
                        map={sotmTexture}
                        transparent
                        side={THREE.DoubleSide}
                        uProgress={0.0}
                    />
                </mesh>
                {/* BUTTON */}
                <AwardButton
                    onClick={(e) => {
                        e.stopPropagation();
                        openOverlay(awardsData.sotm);
                    }}
                    texture={buttonTexture}
                    paintedTexture={buttonPaintedTexture}
                    width={buttonWidth}
                    height={buttonHeight}
                    position={[0, buttonY, 0.05]}
                    onHoverChange={makeCardHoverHandler(sotmCardRevealRef, sotmCardPaintedRef, sotmHideDelayRef)}
                />
                {/* AWARD LABEL */}
                <Text
                    position={[0, 0.95, 0.01]}
                    fontSize={0.45}
                    color="#1a1a1a"
                    anchorX="center"
                    anchorY="middle"
                    font={ABOUT_DISPLAY_FONT}
                >
                    社会精选
                </Text>
                {/* AWARD COUNT */}
                <Text
                    position={[-0.05, 0, 0.01]}
                    fontSize={0.8}
                    color="#1a1a1a"
                    anchorX="center"
                    anchorY="middle"
                    font={ABOUT_DISPLAY_FONT}
                >
                    {awardsData.sotm.items.length}
                </Text>
            </group>

            {/* === SOTY (front, center, rendered LAST = always on top) === */}
            <group ref={sotyRef} position={[0, 0.5, 0]}>
                {/* Painted card (behind) - hidden until button hover */}
                <mesh ref={sotyCardPaintedRef} position={[0, 0, -0.001]} visible={true}>
                    <planeGeometry args={[cardHeight * cardLegacyAspect, cardHeight]} />
                    <meshBasicMaterial color="#e0e0e0"
                        map={sotyPaintedTexture}
                        transparent
                        opacity={0}
                        side={THREE.DoubleSide}
                        alphaTest={0.5}
                    />
                </mesh>
                {/* Sketch card (front) with reveal */}
                <mesh>
                    <planeGeometry args={[cardHeight * cardLegacyAspect, cardHeight]} />
                    <revealBasicMaterial
                        ref={sotyCardRevealRef}
                        map={sotyTexture}
                        transparent
                        side={THREE.DoubleSide}
                    />
                </mesh>
                {/* BUTTON */}
                <AwardButton
                    onClick={(e) => {
                        e.stopPropagation();
                        openOverlay(awardsData.other);
                    }}
                    texture={buttonTexture}
                    paintedTexture={buttonPaintedTexture}
                    width={buttonWidth}
                    height={buttonHeight}
                    position={[0, buttonY, 0.05]}
                    onHoverChange={makeCardHoverHandler(sotyCardRevealRef, sotyCardPaintedRef, sotyHideDelayRef)}
                />
                {/* AWARD LABEL */}
                <Text
                    position={[0, 0.95, 0.01]}
                    fontSize={0.45}
                    color="#1a1a1a"
                    anchorX="center"
                    anchorY="middle"
                    font={ABOUT_DISPLAY_FONT}
                >
                    AI荣誉
                </Text>
                {/* AWARD COUNT */}
                <Text
                    position={[-0.05, 0, 0.01]}
                    fontSize={0.8}
                    color="#1a1a1a"
                    anchorX="center"
                    anchorY="middle"
                    font={ABOUT_DISPLAY_FONT}
                >
                    {awardsData.other.items.length}
                </Text>
            </group>
        </group>
    );
};

const JOURNEY_ITEMS = [
    {
        label: '身体力行',
        texture: '/textures/clouds/candy-cloud-10.webp',
        position: [-3.8, 1.45, 0.05],
        phase: 0.2,
        scale: 0.94,
    },
    {
        label: 'AI先锋',
        texture: '/textures/clouds/candy-cloud-10.webp',
        position: [0, 2.35, 0.45],
        phase: 1.8,
        scale: 1.08,
    },
    {
        label: '工作室大手子',
        texture: '/textures/clouds/candy-cloud-10.webp',
        position: [3.8, 1.35, 0.1],
        phase: 3.4,
        scale: 0.96,
    },
];

/**
 * JOURNEY Milestone - three personal role markers on the custom cloud family.
 */
const JourneyMilestone = ({ z, scrollProgressRef }) => {
    const isTouch = isTouchDevice();
    const groupRef = useRef();
    const itemRefs = useRef([]);

    const journeyTextures = useLoader(
        THREE.TextureLoader,
        JOURNEY_ITEMS.map((item) => item.texture)
    );

    journeyTextures.forEach((texture) => {
        texture.colorSpace = THREE.SRGBColorSpace;
    });

    useFrame((state) => {
        if (!groupRef.current) return;

        // === TWARDA LINIA CLIP (RĘCZNE OBLICZENIE WORLD Z) ===
        const scrollProgress = scrollProgressRef?.current || 0;
        const worldZ = ROOM_Z + scrollProgress + z;
        groupRef.current.visible = worldZ < MILESTONE_CORRIDOR_CLIP_Z;
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

        const layoutScale = isTouch ? 0.7 : 1;

        itemRefs.current.forEach((itemRef, index) => {
            if (!itemRef) return;

            const item = JOURNEY_ITEMS[index];
            const staggeredReveal = THREE.MathUtils.clamp(
                revealFactor * 1.18 - index * 0.09,
                0,
                1
            );
            const startY = item.position[1] - 3.2;
            const currentBaseY = startY + staggeredReveal * (item.position[1] - startY);

            itemRef.position.x = item.position[0] * layoutScale;
            itemRef.position.y = currentBaseY + Math.sin(time * 0.46 + item.phase) * 0.16;
            itemRef.rotation.z = Math.sin(time * 0.28 + item.phase) * 0.035;
            itemRef.scale.setScalar(item.scale * layoutScale);
        });
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
                font={ABOUT_DISPLAY_FONT}
            >
                旅程
            </Text>

            {/* Subtitle */}
            <Text
                position={[0, 4.2, 0.3]}
                fontSize={0.35}
                color="#555555"
                anchorX="center"
                anchorY="middle"
                font={ABOUT_BODY_FONT}
            >
                一路走来的轨迹...
            </Text>

            {JOURNEY_ITEMS.map((item, index) => (
                <group
                    key={item.label}
                    ref={(node) => { itemRefs.current[index] = node; }}
                    position={item.position}
                >
                    <mesh>
                        <planeGeometry args={[5.2, 3]} />
                        <meshBasicMaterial
                            color="#ffffff"
                            map={journeyTextures[index]}
                            transparent
                            depthWrite={false}
                            side={THREE.DoubleSide}
                            toneMapped={false}
                        />
                    </mesh>
                    <Text
                        position={[0, -0.03, 0.12]}
                        fontSize={item.label.length > 4 ? 0.56 : 0.68}
                        color={ABOUT_INK}
                        renderOrder={8}
                        anchorX="center"
                        anchorY="middle"
                        font={ABOUT_DISPLAY_FONT}
                        letterSpacing={item.label.length > 4 ? 0.015 : 0.035}
                        outlineWidth={0.025}
                        outlineColor="#fff9e8"
                        material-depthTest={false}
                    >
                        {item.label}
                    </Text>
                </group>
            ))}
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
    // Primary skills
    {
        texture: '/textures/about/skills/ai-coding-sketch.webp',
        paintedTexture: '/textures/about/skills/ai-coding-painted.webp',
        label: 'AI Coding',
        description: 'Codex、Claude Code、Trea\nPRD 撰写',
        size: 'large', x: -3.6, y: 2.8, z: 0.3, phase: 0, aspect: 0.5,
    },
    {
        texture: '/textures/about/skills/python-sketch.webp',
        paintedTexture: '/textures/about/skills/python-painted.webp',
        label: 'Python',
        description: 'API、脚本、数据处理分析',
        size: 'large', x: 0, y: 2.5, z: 0.4, phase: 1.1, aspect: 0.5,
    },
    {
        texture: '/textures/about/skills/lora-sketch.webp',
        paintedTexture: '/textures/about/skills/lora-painted.webp',
        label: 'LoRA',
        description: '数据整理、模型训练与风格应用',
        size: 'large', x: 3.6, y: 2.9, z: 0.2, phase: 2.2, aspect: 0.5,
    },

    // Supporting tools
    {
        texture: '/textures/about/skills/feishu-sketch.webp',
        paintedTexture: '/textures/about/skills/feishu-painted.webp',
        label: '飞书',
        description: '知识库、多维表格',
        size: 'medium', x: -5.4, y: 0.6, z: -0.3, phase: 0.7, aspect: 0.5,
    },
    {
        texture: '/textures/about/skills/illustrator-sketch.webp',
        paintedTexture: '/textures/about/skills/illustrator-painted.webp',
        label: 'Illustrator',
        description: '矢量设计、包装刀版',
        size: 'medium', x: -1.8, y: 0.3, z: -0.15, phase: 2.1, aspect: 0.5,
    },
    {
        texture: '/textures/about/skills/photoshop-sketch.webp',
        paintedTexture: '/textures/about/skills/photoshop-painted.webp',
        label: 'PS',
        description: '图像合成、修图与 AIGC 后期',
        size: 'medium', x: 1.8, y: 0.3, z: -0.1, phase: 3.5, aspect: 0.5,
    },
    {
        texture: '/textures/about/reactduzybalon.webp',
        paintedTexture: '/textures/about/reactduzybalon_painted.webp',
        label: 'React',
        description: '组件化开发、交互界面与前端实现',
        size: 'medium', x: 5.4, y: 0.8, z: -0.25, phase: 4.8, aspect: 736 / 1447,
    },
];

// Size multipliers for balloon categories
const SIZE_MULTIPLIERS = {
    large: 3.0,
    medium: 2.2,
    small: 1.6,
};

// Individual balloon component
const SkillBalloon = ({ config, revealFactorRef, spreadFactorRef, timeRef }) => {
    const isTouch = isTouchDevice();
    const texture = useLoader(THREE.TextureLoader, config.texture);
    const paintedTextureUrl = isTouch ? config.texture : config.paintedTexture;
    const paintedTexture = useLoader(THREE.TextureLoader, paintedTextureUrl);
    texture.colorSpace = THREE.SRGBColorSpace;
    paintedTexture.colorSpace = THREE.SRGBColorSpace;

    const [isPopping, setIsPopping] = useState(false);
    const [hovered, setHovered] = useState(false);
    const [isFadingOutText, setIsFadingOutText] = useState(false);
    const popRef = useRef(0);
    const textFadeRef = useRef(1); // 1 = fully visible, 0 = hidden
    const respawnOffsetRef = useRef(0); // For floating back up after respawn
    const balloonMatRef = useRef();
    const balloonRevealRef = useRef(); // RevealBasicMaterial ref for sketch
    const paintedMeshRef = useRef(); // Painted balloon mesh visibility
    const paintedMatRef = useRef(); // Painted balloon material opacity control
    const hideDelayRef = useRef(); // Track pending gsap.delayedCall
    const textRef = useRef();
    const detailTextRef = useRef();

    // Audio Ref
    const balloonAudioRef = useRef();
    const { globalVolume, isMuted } = useAudio();

    const playBalloonSound = () => {
        if (balloonAudioRef.current) {
            const vol = isMuted ? 0 : BALLOON_AUDIO_SETTINGS.volume * globalVolume;
            balloonAudioRef.current.setVolume(vol);
            if (balloonAudioRef.current.isPlaying) balloonAudioRef.current.stop();
            balloonAudioRef.current.play();
        }
    };

    // LEGACY FIX: Use original aspect ratios from BALLOON_CONFIG or hardcoded for categories
    const legacyAspects = {
        'reactduzybalon.webp': 736 / 1447,
        'threejsduzybalon.webp': 1141 / 1964,
        'GSAPduzybalon.webp': 1.0, // GSAP balloon is square
        'default_small_medium': 631 / 1482 // Common ratio for others
    };
    
    const filename = config.texture.split('/').pop();
    const aspect = config.aspect || legacyAspects[filename] || legacyAspects['default_small_medium'];
    const baseHeight = SIZE_MULTIPLIERS[config.size];

    const outerGroupRef = useRef();
    const innerGroupRef = useRef();
    const targetScale = useRef(1.0);
    const currentScale = useRef(1.0);
    const targetMagnet = useRef({ x: 0, y: 0 });
    const currentMagnet = useRef({ x: 0, y: 0 });

    // === RESPONSYWNOŚĆ ===
    // Na mobile (wąski viewport) balony są bliżej środka
    const positionScale = isTouch ? 0.5 : 1; // Jak bardzo ściskamy pozycje na mobile
    const spreadScale = isTouch ? 0.4 : 1;   // Jak bardzo zmniejszamy spread na mobile
    const sizeScale = isTouch ? 0.85 : 1;    // Trochę mniejsze balony na mobile

    // Cursor handling
    useEffect(() => {
        if (hovered && !isPopping) {
            document.body.style.cursor = 'pointer';
        } else {
            document.body.style.cursor = 'auto';
        }
    }, [hovered, isPopping]);

    // Handle text fade out timer
    useEffect(() => {
        if (isPopping) {
            // Leave enough time to read the skill detail before the balloon respawns.
            const timer = setTimeout(() => {
                setIsFadingOutText(true);
            }, 4200);
            return () => clearTimeout(timer);
        }
    }, [isPopping]);

    // Hover handlers for brush-stroke reveal
    const handlePointerOver = (e) => {
        if (isTouch) return;
        e.stopPropagation();
        if (!isPopping) setHovered(true);

        // Brush-stroke reveal: show painted balloon
        if (balloonRevealRef.current) {
            gsap.to(balloonRevealRef.current, {
                uProgress: 1.0,
                duration: 0.8,
                ease: 'power2.out',
                overwrite: true
            });
        }
        if (hideDelayRef.current) hideDelayRef.current.kill();
        if (paintedMeshRef.current) paintedMeshRef.current.visible = true;
        if (paintedMatRef.current) paintedMatRef.current.opacity = 1;
    };

    const handlePointerOut = (e) => {
        if (isTouch) return;
        e.stopPropagation();
        setHovered(false);

        // Reverse reveal
        if (balloonRevealRef.current) {
            gsap.to(balloonRevealRef.current, {
                uProgress: 0.0,
                duration: 0.5,
                ease: 'power2.out',
                overwrite: true
            });
        }
        hideDelayRef.current = gsap.delayedCall(0.55, () => {
            if (paintedMatRef.current) paintedMatRef.current.opacity = 0;
        });
    };

    // Animation update loop
    useFrame((state, delta) => {
        if (hovered && !isPopping) {
            targetScale.current = 1.05; // lekkie powiększenie
        } else {
            targetScale.current = 1.0;
            targetMagnet.current.x = 0;
            targetMagnet.current.y = 0;
        }

        currentScale.current = THREE.MathUtils.lerp(currentScale.current, targetScale.current, 8 * delta);
        currentMagnet.current.x = THREE.MathUtils.lerp(currentMagnet.current.x, targetMagnet.current.x, 8 * delta);
        currentMagnet.current.y = THREE.MathUtils.lerp(currentMagnet.current.y, targetMagnet.current.y, 8 * delta);

        if (isPopping) {
            // Smooth, slow pop animation
            popRef.current = THREE.MathUtils.lerp(popRef.current, 1, 2.5 * delta);

            // Also hide painted mesh during pop (kill any pending reveals)
            if (hideDelayRef.current) hideDelayRef.current.kill();
            if (balloonRevealRef.current) {
                balloonRevealRef.current.uProgress = 0;
            }
        }

        if (isFadingOutText) {
            // Fade out the text slowly
            textFadeRef.current = THREE.MathUtils.lerp(textFadeRef.current, 0, 2 * delta);

            // Once fully faded, respawn the balloon from below
            if (textFadeRef.current < 0.05) {
                setIsPopping(false);
                setHovered(false);
                setIsFadingOutText(false);
                popRef.current = 0;
                textFadeRef.current = 1;
                respawnOffsetRef.current = -12; // Teleport below to float up again

                // Immediately teleport the mesh to prevent pointer events at the old location
                if (outerGroupRef.current) {
                    outerGroupRef.current.position.y -= 12;
                }

                // Immediately reset opacities to prevent flashing
                if (balloonRevealRef.current) balloonRevealRef.current.opacity = 1;
                if (textRef.current) textRef.current.fillOpacity = 0;
                if (detailTextRef.current) detailTextRef.current.fillOpacity = 0;
                // Reset reveal state on respawn
                if (balloonRevealRef.current) balloonRevealRef.current.uProgress = 0;
                if (paintedMatRef.current) paintedMatRef.current.opacity = 0;
                if (paintedMeshRef.current) paintedMeshRef.current.visible = false;
            }
        }

        // Float back up if respawning
        if (respawnOffsetRef.current < -0.01) {
            respawnOffsetRef.current = THREE.MathUtils.lerp(respawnOffsetRef.current, 0, 1.5 * delta);
        }

        // Apply opacities if not fully respawned
        if (balloonRevealRef.current && isPopping) {
            balloonRevealRef.current.opacity = 1 - popRef.current;
        }
        if (paintedMatRef.current && isPopping) {
            paintedMatRef.current.opacity = 1 - popRef.current;
        }
        if (textRef.current && isPopping) {
            // Combine pop-in and fade-out opacities
            textRef.current.fillOpacity = popRef.current * textFadeRef.current;
            textRef.current.outlineOpacity = popRef.current * textFadeRef.current;
        }
        if (detailTextRef.current && isPopping) {
            detailTextRef.current.fillOpacity = popRef.current * textFadeRef.current;
            detailTextRef.current.outlineOpacity = popRef.current * textFadeRef.current;
        }
    });

    // Floating animation with unique phase — now computed inside useFrame
    // Moved from render body to avoid re-renders

    // Bazowa pozycja X (skalowana na mobile)
    const baseX = config.x * positionScale;

    // P2: Compute position/scale/rotation imperatively inside useFrame
    useFrame(() => {
        if (!outerGroupRef.current) return;

        const time = timeRef.current;
        const revealFactor = revealFactorRef.current;
        const spreadFactor = spreadFactorRef.current;

        // Floating animation with unique phase
        const floatY = Math.sin(time * 0.6 + config.phase) * 0.3;
        const floatX = Math.sin(time * 0.4 + config.phase * 0.7) * 0.15;
        const rotation = Math.sin(time * 0.3 + config.phase) * 0.08;

        // Reveal: balloons float up from below, including respawn offset
        const startY = config.y - 8;
        const endY = config.y;
        const currentY = startY + revealFactor * (endY - startY) + floatY + respawnOffsetRef.current;

        // Scale up as they reveal
        let scale = revealFactor * sizeScale;
        const popScaleEffect = currentScale.current + popRef.current * 0.4;
        scale *= popScaleEffect;

        // === SPREAD EFFECT (ROZSUWANIE) ===
        const maxSpread = 15 * spreadScale;
        let spreadX = 0;

        if (config.x < -0.5) {
            spreadX = -spreadFactor * maxSpread * (0.5 + Math.abs(config.x) / 6);
        } else if (config.x > 0.5) {
            spreadX = spreadFactor * maxSpread * (0.5 + Math.abs(config.x) / 6);
        } else {
            spreadX = config.phase > 3.5
                ? spreadFactor * maxSpread * 0.8
                : -spreadFactor * maxSpread * 0.8;
        }

        // Apply imperatively
        outerGroupRef.current.position.set(baseX + floatX + spreadX, currentY, config.z);
        outerGroupRef.current.rotation.z = rotation;
        const s = Math.max(0.001, scale); // Avoid zero scale
        outerGroupRef.current.scale.set(s, s, s);

        // Update magnet position on inner group imperatively
        if (innerGroupRef.current) {
            innerGroupRef.current.position.set(currentMagnet.current.x, currentMagnet.current.y, 0);
        }
    });

    return (
        <group
            ref={outerGroupRef}
            position={[baseX, config.y - 8, config.z]}
        >
            <group ref={innerGroupRef}>
                {/* Painted balloon (behind) - hidden until hover */}
                <mesh ref={paintedMeshRef} visible={true}>
                    <planeGeometry args={[baseHeight * aspect, baseHeight]} />
                    <meshBasicMaterial color="#e0e0e0"
                        ref={paintedMatRef}
                        map={paintedTexture}
                        transparent
                        opacity={0}
                        side={THREE.DoubleSide}
                        alphaTest={0.5}
                        depthWrite={false}
                    />
                </mesh>

                {/* Sketch balloon (front) with brush-stroke reveal */}
                <mesh
                    position={[0, 0, 0.001]}
                    onClick={(e) => {
                        e.stopPropagation();
                        if (!isPopping) {
                            setIsPopping(true);
                            playBalloonSound();
                        }
                    }}
                    onPointerOver={handlePointerOver}
                    onPointerOut={handlePointerOut}
                    onPointerMove={(e) => {
                        if (hovered && !isPopping && outerGroupRef.current) {
                            outerGroupRef.current.getWorldPosition(_tempVec3);
                            // Reduced magnetic pull from 0.5 to 0.15 for gentler effect
                            targetMagnet.current.x = (e.point.x - _tempVec3.x) * 0.15;
                            targetMagnet.current.y = (e.point.y - _tempVec3.y) * 0.15;
                        }
                    }}
                    visible={popRef.current < 0.99}
                >
                    <planeGeometry args={[baseHeight * aspect, baseHeight]} />
                    <revealBasicMaterial
                        ref={balloonRevealRef}
                        map={texture}
                        transparent
                        side={THREE.DoubleSide}
                        depthWrite={false}
                        uProgress={0.0}
                    />
                </mesh>

                {/* Skill name and click-to-read description */}
                {isPopping && textFadeRef.current > 0.01 && (
                    <group position={[0, 0, 0.1]}>
                        <Text
                            ref={textRef}
                            position={[0, baseHeight * 0.16, 0]}
                            fontSize={baseHeight * 0.23}
                            color="#111111"
                            anchorX="center"
                            anchorY="middle"
                            font={ABOUT_DISPLAY_FONT}
                            fillOpacity={0}
                            outlineWidth={0.018}
                            outlineColor="#fff"
                            outlineOpacity={0}
                        >
                            {config.label}
                        </Text>
                        <Text
                            ref={detailTextRef}
                            position={[0, -baseHeight * 0.17, 0]}
                            fontSize={baseHeight * 0.105}
                            maxWidth={baseHeight * 2.15}
                            lineHeight={1.38}
                            textAlign="center"
                            color="#343434"
                            anchorX="center"
                            anchorY="middle"
                            font={ABOUT_BODY_FONT}
                            fillOpacity={0}
                            outlineWidth={0.012}
                            outlineColor="#fff"
                            outlineOpacity={0}
                        >
                            {config.description}
                        </Text>
                    </group>
                )}

                <PositionalAudio
                    ref={balloonAudioRef}
                    url="/sounds/baloonpoop.mp3"
                    distanceModel="exponential"
                    rolloffFactor={BALLOON_AUDIO_SETTINGS.rolloff}
                    refDistance={BALLOON_AUDIO_SETTINGS.distance}
                    loop={false}
                />
            </group>
        </group>
    );
};

const SkillsMilestone = ({ z, scrollProgressRef }) => {
    const { camera, viewport } = useThree();
    const isTouch = isTouchDevice();
    const groupRef = useRef();
    // P2: Use refs instead of state to avoid 60 re-renders/sec inside useFrame
    const revealFactorRef = useRef(0);
    const spreadFactorRef = useRef(0);
    const timeRef = useRef(0);

    useFrame((state) => {
        if (!groupRef.current) return;

        // === TWARDA LINIA CLIP (RĘCZNE OBLICZENIE WORLD Z) ===
        const scrollProgress = scrollProgressRef?.current || 0;
        const worldZ = ROOM_Z + scrollProgress + z;
        groupRef.current.visible = worldZ < MILESTONE_CORRIDOR_CLIP_Z;
        if (!groupRef.current.visible) return;

        timeRef.current = state.clock.elapsedTime;

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

        revealFactorRef.current = newRevealFactor;

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

        spreadFactorRef.current = newSpreadFactor;
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
                font={ABOUT_DISPLAY_FONT}
            >
                技能
            </Text>

            {/* Subtitle */}
            <Text
                position={[0, 5.2, 0.5]}
                fontSize={0.35}
                color="#555555"
                anchorX="center"
                anchorY="middle"
                font={ABOUT_BODY_FONT}
            >
                我热爱的工具与技术
            </Text>

            {/* === FLOATING BALLOONS === */}
            {BALLOON_CONFIG.map((config, index) => (
                <SkillBalloon
                    key={index}
                    config={config}
                    revealFactorRef={revealFactorRef}
                    spreadFactorRef={spreadFactorRef}
                    timeRef={timeRef}
                />
            ))}
        </group>
    );
};

// =========================================
// NOTE: Use this component inside the loop!
// =========================================

export default InfiniteSkyManager;
