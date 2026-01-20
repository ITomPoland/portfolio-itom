import { useRef, useState, useMemo, useEffect } from 'react';
import { useFrame, useThree } from '@react-three/fiber';
import { Text, useTexture, Float } from '@react-three/drei';
import * as THREE from 'three';
import gsap from 'gsap';
import { useScene } from '../../../../context/SceneContext';
import PaperMaterial from './PaperMaterial';

// Define the unique projects and their textures
const UNIQUE_PROJECTS = [
    { id: 'bio', title: 'Bio', front: '/textures/gallery/bioprzod.jpg', back: '/textures/gallery/biotyl.webp', url: 'https://example.com' },
    { id: 'monetune', title: 'Monetune', front: '/textures/gallery/monetuneprzod.webp', back: '/textures/gallery/monetunetyl.webp', url: 'https://example.com' },
    { id: 'timber', title: 'TimberKitty', front: '/textures/gallery/timberkittyprzod.webp', back: '/textures/gallery/timberkittytyl.webp', url: 'https://example.com' },
    { id: 'young', title: 'YoungMulti', front: '/textures/gallery/youngmultiprzod.webp', back: '/textures/gallery/youngmultityl.webp', url: 'https://example.com' },
];

const PROJECT_COUNT = 10; // Keep the count for the infinite scroll feel
const GAP = 2.5;

const GalleryRoom = ({ showRoom, onReady }) => {
    const { openOverlay } = useScene();
    const groupRef = useRef();
    const [scrollOffset, setScrollOffset] = useState(0);
    const targetScroll = useRef(0);
    const currentScroll = useRef(0);
    const [selectedCard, setSelectedCard] = useState(null);

    // Track if we've signaled ready
    const hasSignaledReady = useRef(false);
    const frameCount = useRef(0);
    const FRAMES_TO_WAIT = 5;

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

    // --- TEXTURES ---
    // Load all project textures in a flat array [p1_front, p1_back, p2_front, p2_back, ...]
    const textureUrls = UNIQUE_PROJECTS.flatMap(p => [p.front, p.back]);
    const projectTextures = useTexture(textureUrls);

    // Load the single overlay texture (button "open project")
    const overlayTexture = useTexture('/textures/gallery/openliveproject.webp');

    // Construct the full list of projects (repeated) with textures attached
    const projects = useMemo(() => {
        return Array.from({ length: PROJECT_COUNT }).map((_, i) => {
            const projectIndex = i % UNIQUE_PROJECTS.length;
            const projectData = UNIQUE_PROJECTS[projectIndex];

            // Extract textures from the loaded array
            const frontTex = projectTextures[projectIndex * 2];
            const backTex = projectTextures[projectIndex * 2 + 1];

            // Configure textures
            if (frontTex) {
                frontTex.colorSpace = THREE.SRGBColorSpace;
                // frontTex.encoding = THREE.sRGBEncoding; // handled by fiber/three automatically usually
            }
            if (backTex) {
                backTex.colorSpace = THREE.SRGBColorSpace;
                // backTex.offset.x = 1; // Flip X if back texture is mirrored? Try standard first.
                // backTex.repeat.x = -1; 
            }
            // Ensure overlay texture is configured correctly if loaded
            if (overlayTexture) {
                overlayTexture.colorSpace = THREE.SRGBColorSpace;
                overlayTexture.needsUpdate = true;
            }

            return {
                ...projectData,
                index: i,
                frontTexture: frontTex,
                backTexture: backTex
            };
        });
    }, [projectTextures, overlayTexture]);

    // Function to scroll to a specific project index
    const scrollToIndex = (index, onComplete) => {
        const totalWidth = PROJECT_COUNT * GAP;
        const targetScrollValue = index * GAP;
        const currentScrollValue = currentScroll.current;

        let diff = targetScrollValue - currentScrollValue;
        const halfWidth = totalWidth / 2;
        while (diff > halfWidth) diff -= totalWidth;
        while (diff < -halfWidth) diff += totalWidth;

        const finalTarget = currentScrollValue + diff;

        gsap.to(targetScroll, {
            current: finalTarget,
            duration: 0.5,
            ease: 'power2.inOut'
        });

        gsap.to(currentScroll, {
            current: finalTarget,
            duration: 0.5,
            ease: 'power2.inOut',
            onComplete: onComplete
        });
    };

    // --- INTERACTION ---
    useEffect(() => {
        const handleWheel = (e) => {
            if (!showRoom) return;
            e.preventDefault();
            targetScroll.current += e.deltaY * 0.005;
        };
        window.addEventListener('wheel', handleWheel, { passive: false });
        return () => window.removeEventListener('wheel', handleWheel);
    }, [showRoom]);

    const lastTouchX = useRef(0);
    useEffect(() => {
        if (!showRoom) return;
        const handleTouchStart = (e) => {
            if (e.touches.length === 1) lastTouchX.current = e.touches[0].clientX;
        };
        const handleTouchMove = (e) => {
            if (e.touches.length === 1) {
                const deltaX = lastTouchX.current - e.touches[0].clientX;
                lastTouchX.current = e.touches[0].clientX;
                targetScroll.current += deltaX * 0.008;
            }
        };
        window.addEventListener('touchstart', handleTouchStart, { passive: true });
        window.addEventListener('touchmove', handleTouchMove, { passive: true });
        return () => {
            window.removeEventListener('touchstart', handleTouchStart);
            window.removeEventListener('touchmove', handleTouchMove);
        };
    }, [showRoom]);

    useFrame((state, delta) => {
        currentScroll.current = THREE.MathUtils.lerp(currentScroll.current, targetScroll.current, delta * 5);
    });

    // --- GEOMETRY & MATERIALS ---
    const floorTexture = useTexture('/textures/gallery/floor.jpg');
    const railingTexture = useTexture('/textures/gallery/railing.webp');
    const housesTexture = useTexture('/textures/gallery/domki.webp');
    const cityTexture = useTexture('/textures/gallery/miastotlo.webp');
    const birdTexture = useTexture('/textures/gallery/bird.webp');
    const clothespinTexture = useTexture('/textures/gallery/klamerka.webp');

    useEffect(() => {
        if (floorTexture) {
            floorTexture.wrapS = THREE.MirroredRepeatWrapping;
            floorTexture.wrapT = THREE.MirroredRepeatWrapping;
            floorTexture.repeat.set(0.5, 0.7);
            floorTexture.needsUpdate = true;
        }
        if (railingTexture) {
            railingTexture.wrapS = railingTexture.wrapT = THREE.RepeatWrapping;
            railingTexture.repeat.set(7, 1);
            railingTexture.needsUpdate = true;
        }
    }, [floorTexture, railingTexture]);

    const materials = useMemo(() => {
        const floorMat = new THREE.MeshStandardMaterial({
            map: floorTexture,
            color: '#ffffff',
            roughness: 0.8,
            side: THREE.DoubleSide
        });
        return {
            floor: floorMat,
            rope: new THREE.MeshStandardMaterial({ color: '#666666', roughness: 1 }),
        };
    }, [floorTexture]);

    const curve = useMemo(() => {
        return new THREE.CatmullRomCurve3([
            new THREE.Vector3(-16, 3.5, -6),
            new THREE.Vector3(-8, 2.5, -4.5),
            new THREE.Vector3(0, 1.8, -3),
            new THREE.Vector3(8, 2.5, -4.5),
            new THREE.Vector3(16, 3.5, -6),
        ]);
    }, []);

    const ropeGeometry = useMemo(() => {
        return new THREE.TubeGeometry(curve, 64, 0.015, 8, false);
    }, [curve]);

    const floorShape = useMemo(() => {
        const shape = new THREE.Shape();
        shape.moveTo(-1.1, -2.0);
        shape.lineTo(1.1, -2.0);
        shape.lineTo(7.5, 4);
        shape.lineTo(-7.5, 4);
        shape.lineTo(-1.1, -2.0);
        return shape;
    }, []);

    return (
        <group ref={groupRef}>
            <group position={[0, -0.7, -2]}>
                {/* Floor */}
                <mesh
                    rotation={[-Math.PI / 2, 0, 0]}
                    position={[0, 0, 0]}
                >
                    <shapeGeometry args={[floorShape]} />
                    <primitive object={materials.floor} />
                </mesh>

                {/* Floor Outline */}
                <line rotation={[-Math.PI / 2, 0, 0]} position={[0, 0.01, 0]}>
                    <bufferGeometry>
                        <float32BufferAttribute
                            attach="attributes-position"
                            count={2}
                            array={new Float32Array([7.5, 4, 0, -7.5, 4, 0])}
                            itemSize={3}
                        />
                    </bufferGeometry>
                    <lineBasicMaterial color="#999999" />
                </line>

                {/* Railing */}
                <mesh position={[0, RAILING_HEIGHT / 2, -3.9]}>
                    <planeGeometry args={[20, RAILING_HEIGHT]} />
                    <meshStandardMaterial
                        map={railingTexture}
                        transparent={true}
                        side={THREE.DoubleSide}
                        alphaTest={0.1}
                    />
                </mesh>

                {/* === CLOTHESLINE SYSTEM === */}
                <group position={[0, 1.6, -4]}>
                    <mesh geometry={ropeGeometry} material={materials.rope} />

                    {/* Proj Cards */}
                    {projects.map((project, i) => (
                        <ProjectCard
                            key={i}
                            index={i}
                            project={project}
                            overlayTexture={overlayTexture}
                            clothespinTexture={clothespinTexture}
                            total={PROJECT_COUNT}
                            currentScroll={currentScroll}
                            materials={materials}
                            curve={curve}
                            isSelected={selectedCard === i}
                            scrollToIndex={scrollToIndex}
                            onSelect={(cardData) => {
                                setSelectedCard(i);
                            }}
                            onDeselect={() => setSelectedCard(null)}
                        />
                    ))}
                </group>

                {/* === SCENERY LAYERS === */}
                {/* Houses - center */}
                <mesh position={[0, -1, -9]} scale={[1, 1, 1]}>
                    <planeGeometry args={[15, 6]} />
                    <meshBasicMaterial
                        map={housesTexture}
                        transparent={true}
                        alphaTest={0.1}
                        side={THREE.DoubleSide}
                    />
                </mesh>
                {/* Houses - left side (mirrored) */}
                <mesh position={[-15, -1, -9]} scale={[-1, 1, 1]}>
                    <planeGeometry args={[15, 6]} />
                    <meshBasicMaterial
                        map={housesTexture}
                        transparent={true}
                        alphaTest={0.1}
                        side={THREE.DoubleSide}
                    />
                </mesh>
                {/* Houses - right side (mirrored) */}
                <mesh position={[15, -1, -9]} scale={[-1, 1, 1]}>
                    <planeGeometry args={[15, 6]} />
                    <meshBasicMaterial
                        map={housesTexture}
                        transparent={true}
                        alphaTest={0.1}
                        side={THREE.DoubleSide}
                    />
                </mesh>

                {/* City skyline - center */}
                <mesh position={[0, 3.4, -17]} scale={[1, 1, 1]}>
                    <planeGeometry args={[30, 10]} />
                    <meshBasicMaterial
                        map={cityTexture}
                        transparent={true}
                        alphaTest={0.1}
                        side={THREE.DoubleSide}
                    />
                </mesh>
                {/* City skyline - left (mirrored) */}
                <mesh position={[-30, 3.4, -17]} scale={[-1, 1, 1]}>
                    <planeGeometry args={[30, 10]} />
                    <meshBasicMaterial
                        map={cityTexture}
                        transparent={true}
                        alphaTest={0.1}
                        side={THREE.DoubleSide}
                    />
                </mesh>
                {/* City skyline - right (mirrored) */}
                <mesh position={[30, 3.4, -17]} scale={[-1, 1, 1]}>
                    <planeGeometry args={[30, 10]} />
                    <meshBasicMaterial
                        map={cityTexture}
                        transparent={true}
                        alphaTest={0.1}
                        side={THREE.DoubleSide}
                    />
                </mesh>

                {/* Flying Bird */}
                <FlyingBird texture={birdTexture} />

                {/* Skybox/Environment */}
                <mesh position={[0, 5, -20]}>
                    <sphereGeometry args={[40, 32, 32]} />
                    <meshBasicMaterial color="#f0f0f0" side={THREE.BackSide} transparent opacity={0.5} />
                </mesh>
            </group>
        </group>
    );
};

// Flying bird animation component
const FlyingBird = ({ texture }) => {
    const birdRef = useRef();
    const startX = -20;
    const endX = 20;
    const speed = 0.8; // Units per second

    useFrame((state) => {
        if (!birdRef.current) return;

        const time = state.clock.getElapsedTime();

        // Move from left to right, loop back
        const progress = ((time * speed) % (endX - startX + 10)) + startX;
        birdRef.current.position.x = progress;

        // Gentle bobbing motion
        birdRef.current.position.y = 4.5 + Math.sin(time * 2) * 0.3;

        // Slight banking when flying
        birdRef.current.rotation.z = Math.sin(time * 1.5) * 0.1;
    });

    return (
        <mesh ref={birdRef} position={[-20, 4.5, -10]} scale={[0.8, 0.8, 0.8]}>
            <planeGeometry args={[1.5, 1.5]} />
            <meshBasicMaterial
                map={texture}
                transparent={true}
                alphaTest={0.1}
                side={THREE.DoubleSide}
            />
        </mesh>
    );
};

// Sub-component for individual project cards
// Sub-component for individual project cards
const ProjectCard = ({ index, project, overlayTexture, clothespinTexture, currentScroll, materials, curve, isSelected, scrollToIndex, onSelect, onDeselect }) => {
    const cardRef = useRef();
    const paperRef = useRef(); // Ref for the moving part (Paper)
    const materialRef = useRef();
    const [hovered, setHovered] = useState(false);
    const [isAnimating, setIsAnimating] = useState(false);  // True ONLY during flip animation
    const [isScrolling, setIsScrolling] = useState(false);  // True during scroll phase

    // Random sway properties
    const swaySpeed = useRef(Math.random() * 0.2 + 0.3); // Slower sway speed
    const swayOffset = useRef(Math.random() * 100);

    // The actual fly animation (called after scroll centers the card)
    const startFlyAnimation = () => {
        // We no longer move cardRef (which holds the pin). We only move paperRef.
        // But we need to calculate where paperRef should go to reach the 'Camera Target'.

        // Target World Position (approximate, based on previous logic)
        const isMobile = window.innerWidth < 768;
        const targetX_World = 0;
        const targetY_World = isMobile ? -0.4 : -0.2; // Raised significantly (was -0.8/-1.0)
        const targetZ_World = isMobile ? 0.5 : 1.5;

        // Current Pin Position (Parent)
        const parentPos = cardRef.current.position;

        // Calculate Target relative to Parent
        // note: rotation of parent is ignored/assumed negligible for this vector math
        const targetX = targetX_World - parentPos.x;
        const targetY = targetY_World - parentPos.y;
        const targetZ = targetZ_World - parentPos.z;

        const timeline = gsap.timeline({
            onComplete: () => {
                setIsAnimating(false);
                onSelect?.({ index });
            }
        });

        // STRAIGHTEN PIN: Animate parent rotation to zero so math works and it lands straight
        timeline.to(cardRef.current.rotation, {
            x: 0, y: 0, z: 0,
            duration: 0.3,
            ease: 'power2.out'
        }, 0);

        // Initialize bend
        if (materialRef.current) materialRef.current.bend = 0;

        // Base local position
        const localBaseY = -1.1;

        // ===== PHASE 1: Quick tug DOWN + Drag Bend =====
        // Pull paper down relative to pin
        timeline.to(paperRef.current.position, {
            y: localBaseY - 0.5,
            duration: 0.15,
            ease: 'power2.out'
        });

        timeline.to(paperRef.current.rotation, {
            x: 0.5, // Lean forward slightly
            z: -0.05,
            duration: 0.15,
            ease: 'power2.out'
        }, '<');

        // BEND: Drag effect
        if (materialRef.current) {
            timeline.to(materialRef.current, {
                bend: 0.8, // Heavy bend from air resistance
                duration: 0.15,
                ease: 'power2.out'
            }, '<');
        }

        // ===== PHASE 2: Flip Up + Release Bend =====
        // Flying up and over
        timeline.to(paperRef.current.position, {
            y: localBaseY + 0.6, // Arc up
            x: targetX * 0.2, // Start moving towards target X
            z: targetZ * 0.2, // Start moving towards target Z
            duration: 0.4,
            ease: 'power1.out'
        });

        timeline.to(paperRef.current.rotation, {
            x: Math.PI * 0.8, // Almost flipped
            z: 0.05,
            y: -0.02,
            duration: 0.4,
            ease: 'power1.inOut'
        }, '<');

        // BEND: As it slows at top, bend relaxes/reverses
        if (materialRef.current) {
            timeline.to(materialRef.current, {
                bend: -0.3, // Subtle reverse curl at apex
                duration: 0.4,
                ease: 'power1.inOut'
            }, '<');
        }

        // ===== PHASE 3: Float Down to Target =====
        timeline.to(paperRef.current.position, {
            y: targetY,
            x: targetX,
            z: targetZ,
            duration: 0.4,
            ease: 'power3.out'
        });

        timeline.to(paperRef.current.rotation, {
            x: Math.PI, // Flat facing cam
            y: 0,
            z: 0,
            duration: 0.4,
            ease: 'power3.out'
        }, '<');

        // BEND: Settle to flat
        if (materialRef.current) {
            timeline.to(materialRef.current, {
                bend: 0,
                duration: 0.5,
                ease: 'power2.out' // Smooth flatten
            }, '<');
        }

        // Gentle scale
        timeline.to(paperRef.current.scale, {
            x: 1.1,
            y: 1.1,
            z: 1.1,
            duration: 0.3,
            ease: 'sine.out'
        }, '-=0.4');
    };

    // Click handler - fly to camera OR return to clothesline
    const handleClick = (e) => {
        e.stopPropagation();
        if (isAnimating) return;

        // ===== RETURN TO CLOTHESLINE (REVERSE of fly animation) =====
        if (isSelected) {
            setIsAnimating(true);

            const timeline = gsap.timeline({
                onComplete: () => {
                    setIsAnimating(false);
                    onDeselect?.();
                }
            });

            // Initial local Base
            const localBaseY = -1.1;

            // REVERSE PHASE: Lift and Bend
            timeline.to(paperRef.current.position, {
                y: localBaseY + 0.6,
                x: 0, // Centered locally
                z: 1, // Slightly forward locally
                duration: 0.35,
                ease: 'power2.in'
            });

            timeline.to(paperRef.current.rotation, {
                x: 0.5,
                z: -0.05,
                y: 0,
                duration: 0.35,
                ease: 'power2.in'
            }, '<');

            // BEND: Drag again as we pull it back
            if (materialRef.current) {
                timeline.to(materialRef.current, {
                    bend: 0.6,
                    duration: 0.3,
                    ease: 'power2.in'
                }, '<');
            }

            // RESET Scale
            timeline.to(paperRef.current.scale, {
                x: 1, y: 1, z: 1,
                duration: 0.3, ease: 'sine.inOut'
            }, '<');

            // SNAP BACK TO HANGING POSITION
            timeline.to(paperRef.current.position, {
                y: localBaseY,
                x: 0,
                z: 0,
                duration: 0.25,
                ease: 'power3.out'
            });

            timeline.to(paperRef.current.rotation, {
                x: 0, y: 0, z: 0,
                duration: 0.25,
                ease: 'power3.out'
            }, '<');

            // BEND: SNAP
            if (materialRef.current) {
                timeline.to(materialRef.current, {
                    bend: 0,
                    duration: 0.3,
                    ease: 'power2.out'
                }, '<');
            }

            return;
        }

        // ===== FLY TO CAMERA (if not selected) =====
        // Start scrolling phase (project still moves with clothesline)
        setIsScrolling(true);

        // First scroll to center this card, then start fly animation
        scrollToIndex(index, () => {
            // Now start the actual flip animation
            setIsScrolling(false);
            setIsAnimating(true);
            startFlyAnimation();
        });
    };

    // Cursor change on hover
    useEffect(() => {
        document.body.style.cursor = hovered && !isSelected ? 'pointer' : 'auto';
        return () => { document.body.style.cursor = 'auto'; };
    }, [hovered, isSelected]);

    useFrame((state) => {
        if (!cardRef.current) return;

        // Skip position updates ONLY during flip animation, NOT during scroll
        if (isAnimating || isSelected) return;

        const totalWidth = PROJECT_COUNT * GAP; // GAP is available in scope because we are in the file where GAP is defined
        let rawX = (index * GAP) - currentScroll.current;
        const halfWidth = totalWidth / 2;
        let displayX = ((rawX + halfWidth) % totalWidth + totalWidth) % totalWidth - halfWidth;

        const u = (displayX + 16) / 32;
        const safeU = THREE.MathUtils.clamp(u, 0, 1);
        const pointOnCurve = curve.getPointAt(safeU);

        cardRef.current.position.set(pointOnCurve.x, pointOnCurve.y, pointOnCurve.z);

        // Wind / Sway Animation
        const time = state.clock.getElapsedTime();
        const wind = Math.sin(time * swaySpeed.current + swayOffset.current) * 0.05;

        cardRef.current.rotation.z = wind;
        cardRef.current.rotation.x = 0;

        // Visibility Check (fade out if too far)
        const dist = Math.abs(displayX);
        const scale = THREE.MathUtils.clamp(1 - (dist / 50), 0.7, 1);
        cardRef.current.scale.setScalar(scale);
    });

    return (
        <group
            ref={cardRef}
            onClick={handleClick}
            onPointerOver={(e) => { e.stopPropagation(); setHovered(true); }}
            onPointerOut={() => setHovered(false)}
        >
            {/* Clothespin (Top Center) - Does NOT move with paperRef */}
            <mesh position={[0, -0.08, 0.15]} rotation={[0, 0, Math.PI]}>
                <planeGeometry args={[0.3, 0.2]} />
                <meshBasicMaterial
                    map={clothespinTexture}
                    transparent={true}
                    alphaTest={0.1}
                    side={THREE.DoubleSide}
                />
            </mesh>

            {/* The Paper / Card hanging down - This moves independently now */}
            <group
                ref={paperRef}
                position={[0, -1.1, 0]}
            >
                <mesh>
                    <planeGeometry args={[1.5, 2, 16, 16]} />
                    <PaperMaterial
                        ref={materialRef}
                        color="#ffffff"
                        map={project.frontTexture}
                        mapBack={project.backTexture}
                        mapOverlay={overlayTexture}
                        side={THREE.DoubleSide}
                        roughness={0.6}
                    />
                </mesh>
            </group>
        </group>
    );
};

export default GalleryRoom;
