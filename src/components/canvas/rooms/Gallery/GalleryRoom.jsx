import { useRef, useState, useMemo, useEffect } from 'react';
import { useFrame, useThree } from '@react-three/fiber';
import { Text, useTexture, Float } from '@react-three/drei';
import * as THREE from 'three';
import gsap from 'gsap';
import { useScene } from '../../../../context/SceneContext';

const PROJECT_COUNT = 5; // Placeholder count
const GAP = 2.5; // Distance between cards

// Placeholder project data
const PROJECTS = [
    { id: 0, title: 'Project Alpha', description: 'A cool web app built with React and Three.js', url: 'https://example.com' },
    { id: 1, title: 'Project Beta', description: 'E-commerce platform with modern design', url: 'https://example.com' },
    { id: 2, title: 'Project Gamma', description: 'Interactive portfolio website', url: 'https://example.com' },
    { id: 3, title: 'Project Delta', description: 'Mobile-first dashboard application', url: 'https://example.com' },
    { id: 4, title: 'Project Epsilon', description: 'Creative agency landing page', url: 'https://example.com' },
];

const GalleryRoom = ({ showRoom, onReady }) => {
    const { openOverlay } = useScene();
    const groupRef = useRef();
    const [scrollOffset, setScrollOffset] = useState(0);
    const targetScroll = useRef(0);
    const currentScroll = useRef(0);
    const [selectedCard, setSelectedCard] = useState(null); // Track which card is animating/selected

    // Track if we've signaled ready
    const hasSignaledReady = useRef(false);
    const frameCount = useRef(0);
    const FRAMES_TO_WAIT = 5; // Wait for 5 actual render frames

    // Real render-based ready detection - count actual rendered frames
    useFrame(() => {
        if (hasSignaledReady.current) return;

        frameCount.current++;

        if (frameCount.current >= FRAMES_TO_WAIT) {
            hasSignaledReady.current = true;
            onReady?.();
        }
    });

    // Config
    const BALCONY_WIDTH = 5;
    const BALCONY_DEPTH = 3;
    const RAILING_HEIGHT = 1.1;

    // --- INTERACTION ---
    useEffect(() => {
        const handleWheel = (e) => {
            if (!showRoom) return;
            e.preventDefault(); // Prevent browser scroll blocking
            // Horizontal scroll feeling - NO CLAMP for infinity!
            targetScroll.current += e.deltaY * 0.005;
        };

        window.addEventListener('wheel', handleWheel, { passive: false });
        return () => window.removeEventListener('wheel', handleWheel);
    }, [showRoom]);

    useFrame((state, delta) => {
        // Smooth scroll damping
        currentScroll.current = THREE.MathUtils.lerp(currentScroll.current, targetScroll.current, delta * 5);
    });

    // --- GEOMETRY & MATERIALS ---
    // Load textures
    const floorTexture = useTexture('/textures/entrance/floor_paper.webp');
    // const skyTexture = useTexture('/textures/paper-texture.webp'); // Uncomment when ready

    const materials = useMemo(() => {
        const floorMat = new THREE.MeshStandardMaterial({
            map: floorTexture,
            color: '#aaaaaa', // Slightly darken to separate from paper
            roughness: 0.9,
            side: THREE.DoubleSide
        });

        return {
            floor: floorMat,
            railing: new THREE.MeshStandardMaterial({ color: '#2a2a2a', roughness: 0.8 }), // Dark iron/wood
            rope: new THREE.MeshStandardMaterial({ color: '#5C4033', roughness: 1 }), // Dark brown rope
            card: new THREE.MeshStandardMaterial({ color: '#ffffff', side: THREE.DoubleSide, roughness: 0.6 }) // White paper
        };
    }, [floorTexture]);

    // Clothesline Curve - Adjusted to be higher and more visible
    const curve = useMemo(() => {
        return new THREE.CatmullRomCurve3([
            new THREE.Vector3(-8, 2.5, -4),
            new THREE.Vector3(-4, 2.0, -3.5),
            new THREE.Vector3(0, 1.8, -3),   // Closest point
            new THREE.Vector3(4, 2.0, -3.5),
            new THREE.Vector3(8, 2.5, -4),
        ]);
    }, []);

    // Generate points for the rope mesh
    const ropeGeometry = useMemo(() => {
        return new THREE.TubeGeometry(curve, 64, 0.015, 8, false);
    }, [curve]);

    return (
        <group ref={groupRef}>
            {/* ============================================
                🎛️ POSITIONING GUIDE - EDIT THESE VALUES:
                
                BALCONY GROUP:    position={[X, Y, Z]} on line below
                                  Y = height, Z = forward/back
                
                FLOOR:           position={[X, Y, Z]} - center point
                                  planeGeometry args={[width, depth]}
                
                RAILING:         position Z on mesh (line ~109, ~116)
                                  RAILING_HEIGHT at top of file
                
                CLOTHESLINE:     position={[X, Y, Z]} group (line ~124)
                                  Cards Y/Z in ProjectCard useFrame
                ============================================ */}

            {/* Shifted so camera stands on the edge */}
            <group position={[0, -0.7, -2]}>
                {/* Floor - ends at railing */}
                <mesh
                    rotation={[-Math.PI / 2, 0, 0]}
                    position={[0, 0, -1.3]}
                >
                    <planeGeometry args={[15, 6.6]} /> {/* width=10, depth=5 */}
                    <primitive object={materials.floor} />
                </mesh>

                {/* Railing */}
                <group position={[0, 0, -2]}>
                    {/* Top Rail - Extended wider */}
                    <mesh position={[0, RAILING_HEIGHT, -2.5]}>
                        <boxGeometry args={[20, 0.1, 0.2]} />
                        <primitive object={materials.railing} />
                    </mesh>

                    {/* Posts - more for wider railing */}
                    {[-9, -6.5, -4, -1.5, 1.5, 4, 6.5, 9].map((x, i) => (
                        <mesh key={i} position={[x, RAILING_HEIGHT / 2, -2.5]}>
                            <boxGeometry args={[0.1, RAILING_HEIGHT, 0.1]} />
                            <primitive object={materials.railing} />
                        </mesh>
                    ))}
                </group>

                {/* === CLOTHESLINE SYSTEM === */}
                {/* 🎛️ LAUNDRY HEIGHT: Change Y below (currently 1.2) to raise/lower */}
                <group position={[0, 1.2, -3]}>
                    {/* The Rope */}
                    <mesh geometry={ropeGeometry} material={materials.rope} />

                    {/* Proj Cards */}
                    {Array.from({ length: PROJECT_COUNT }).map((_, i) => (
                        <ProjectCard
                            key={i}
                            index={i}
                            total={PROJECT_COUNT}
                            currentScroll={currentScroll}
                            materials={materials}
                            curve={curve}
                            isSelected={selectedCard === i}
                            onSelect={(cardData) => {
                                setSelectedCard(i);
                                // After animation completes, open overlay
                                // setTimeout(() => {
                                //     openOverlay({
                                //         title: PROJECTS[i].title,
                                //         description: PROJECTS[i].description,
                                //         url: PROJECTS[i].url,
                                //         date: '2025',
                                //         platformConfig: { label: 'Gallery Project' }
                                //     });
                                // }, 600); // Match GSAP animation duration
                            }}
                            onDeselect={() => setSelectedCard(null)}
                        />
                    ))}
                </group>

                {/* === ENVIRONMENT / SKYBOX === */}
                {/* Placeholder Fog Sphere */}
                <mesh position={[0, 5, -20]}>
                    <sphereGeometry args={[40, 32, 32]} />
                    <meshBasicMaterial color="#f0f0f0" side={THREE.BackSide} transparent opacity={0.5} />
                </mesh>
            </group>
        </group>
    );
};

// Sub-component for individual project cards
const ProjectCard = ({ index, currentScroll, materials, curve, isSelected, onSelect, onDeselect }) => {
    const cardRef = useRef();
    const [hovered, setHovered] = useState(false);
    const [isAnimating, setIsAnimating] = useState(false);

    // Store original position for return animation
    const originalPos = useRef({ x: 0, y: 0, z: 0 });

    // Random sway properties
    const swaySpeed = useRef(Math.random() * 0.5 + 0.5);
    const swayOffset = useRef(Math.random() * 100);

    // Click handler - trigger pull-down animation
    const handleClick = (e) => {
        e.stopPropagation();
        if (isAnimating || isSelected) return;

        setIsAnimating(true);

        // Store current position before animating
        if (cardRef.current) {
            originalPos.current = {
                x: cardRef.current.position.x,
                y: cardRef.current.position.y,
                z: cardRef.current.position.z
            };
        }

        // GSAP animation: Just simple aggressive pull down
        gsap.to(cardRef.current.position, {
            y: originalPos.current.y - 0.8,   // Minimal drop down
            // z: originalPos.current.z,      // Keep original Z (no flying to camera)
            // x: originalPos.current.x,      // Keep original X (no centering)
            duration: 0.3,                    // Fast/Aggressive
            ease: 'back.out(2)',              // Little bounce at end
            onComplete: () => {
                onSelect?.({ index });
            }
        });

        // Also rotate slightly for "detached" feel
        gsap.to(cardRef.current.rotation, {
            z: -0.1,
            x: 0.15,  // Tilt toward viewer
            duration: 0.7,
            ease: 'power2.out'
        });
    };

    // Cursor change on hover
    useEffect(() => {
        document.body.style.cursor = hovered && !isSelected ? 'pointer' : 'auto';
        return () => { document.body.style.cursor = 'auto'; };
    }, [hovered, isSelected]);

    useFrame((state) => {
        if (!cardRef.current) return;

        // Skip position updates if card is animating or selected
        if (isAnimating || isSelected) return;

        // INFINITY SCROLL: Wrap displayX within visible range
        const totalWidth = PROJECT_COUNT * GAP;
        let rawX = (index * GAP) - currentScroll.current;

        // Wrap around: keep cards within -halfWidth to +halfWidth
        const halfWidth = totalWidth / 2;
        let displayX = ((rawX + halfWidth) % totalWidth + totalWidth) % totalWidth - halfWidth;

        // Catenary curve: cards dip slightly in center, rise at edges
        const yBase = 1.8 + 0.02 * (displayX * displayX);
        const zBase = -2 - 0.01 * (displayX * displayX);

        cardRef.current.position.set(displayX, yBase, zBase);

        // Wind / Sway Animation
        const time = state.clock.getElapsedTime();
        const wind = Math.sin(time * swaySpeed.current + swayOffset.current) * 0.1;

        // Rotate slightly based on movement + wind
        cardRef.current.rotation.z = wind;
        cardRef.current.rotation.x = 0;

        // Visibility Check (fade out if too far)
        const dist = Math.abs(displayX);
        const scale = THREE.MathUtils.clamp(1 - (dist / 10), 0, 1);
        cardRef.current.scale.setScalar(scale);
    });

    return (
        <group
            ref={cardRef}
            onClick={handleClick}
            onPointerOver={(e) => { e.stopPropagation(); setHovered(true); }}
            onPointerOut={() => setHovered(false)}
        >
            {/* Clothespin (Top Center) */}
            <mesh position={[0, 0, 0]}>
                <boxGeometry args={[0.05, 0.1, 0.05]} />
                <meshStandardMaterial color="#8b4513" />
            </mesh>

            {/* The Paper / Card hanging down */}
            {/* Pivot is at top (0,0,0) so we offset mesh down */}
            <group
                position={[0, -1.1, 0]}
                scale={hovered ? 1.08 : 1}
            >
                <mesh material={materials.card}>
                    <planeGeometry args={[1.5, 2]} />
                </mesh>
                <Text
                    position={[0, 0, 0.01]}
                    fontSize={0.2}
                    color="#333"
                    anchorX="center"
                    anchorY="middle"
                >
                    PROJECT {index + 1}
                </Text>
            </group>
        </group>
    );
};

export default GalleryRoom;
