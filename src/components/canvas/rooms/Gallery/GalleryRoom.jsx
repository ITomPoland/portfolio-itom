import { useRef, useState, useMemo, useEffect, forwardRef, useImperativeHandle, memo } from 'react';
import { useFrame, useThree } from '@react-three/fiber';
import { Text, useTexture, Float, PositionalAudio } from '@react-three/drei';
import * as THREE from 'three';
import gsap from 'gsap';
import { Observer } from 'gsap/all';
import { useScene } from '../../../../context/SceneContext';

gsap.registerPlugin(Observer);
import { useAchievements } from '../../../../context/AchievementsContext';
import PaperMaterial from './PaperMaterial';
import GalleryClouds from './GalleryClouds';
import { useAudio } from '../../../../context/AudioManager';
import { usePaintMaterial } from './usePaintMaterial';

// Reusable Vector3 to avoid allocations in useFrame
const _tempScale = new THREE.Vector3();

// ============================================
// ⚙️ AUDIO SETTINGS - TWEAK HERE
// Edytuj te wartości, aby zmienić głośność i zasięg słyszalności szumu miasta
// ============================================
export const AUDIO_SETTINGS = {
    volume: 0.6,
    distance: 2,
    rolloff: 1.5
};

export const GALLERY_INTERACTION_AUDIO_SETTINGS = {
    volume: 0.6,      // Volume for the paper clicking sound
    distance: 2,      // Reference distance for spatial audio before it starts dropping off
    rolloff: 2        // How fast the sound fades away (exponential)
};

// Define the unique projects and their textures
// TODO: vraies réalisations Hakkilo XR — les textures front/painted ci-dessous viennent encore du
// template d'origine (copyright auteur) et doivent être régénérées (pipeline agy/nanobanana 2)
// avant mise en ligne. Contenu texte déjà purgé.
const UNIQUE_PROJECTS = [
    {
        id: 'formation-vr',
        title: 'FORMATION VR',
        front: '/textures/gallery/monetuneprzod.webp',
        painted: '/textures/gallery/monetuneprzod_painted.webp',
        url: 'https://hakkilo.africa', // TODO: vrai lien
        description: "Module de formation immersive en réalité virtuelle : des environnements 3D interactifs pour apprendre par la pratique, conçus pour les entreprises et les écoles.",
        techStack: ['/textures/gallery/reactlogo.webp', '/textures/gallery/jslogo.webp', '/textures/gallery/htmllogo.webp', '/textures/gallery/csslogo.webp']
    },
    {
        id: 'visite-virtuelle',
        title: 'VISITE VIRTUELLE',
        front: '/textures/gallery/timberkittyprzod.webp',
        painted: '/textures/gallery/timberkittyprzod_painted.webp',
        url: 'https://hakkilo.africa', // TODO: vrai lien
        description: "Visite virtuelle interactive dans le navigateur : déplacez-vous librement dans un lieu numérisé en 3D, sans casque ni installation.",
        techStack: ['/textures/gallery/jslogo.webp', '/textures/gallery/htmllogo.webp', '/textures/gallery/csslogo.webp', '/textures/gallery/firebaselogo.webp']
    },
    {
        id: 'showroom-3d',
        title: 'SHOWROOM 3D',
        front: '/textures/gallery/youngmultiprzod.webp',
        painted: '/textures/gallery/youngmultiprzod_painted.webp',
        url: 'https://hakkilo.africa', // TODO: vrai lien
        description: "Showroom 3D temps réel pour présenter des produits sous tous les angles : matériaux réalistes, éclairage dynamique et fiches produit interactives.",
        techStack: ['/textures/gallery/reactlogo.webp', '/textures/gallery/tailwindlogo.webp', '/textures/gallery/htmllogo.webp', '/textures/gallery/netlifylogo.webp']
    },
    {
        id: 'experience-ar',
        title: 'EXPÉRIENCE AR',
        front: '/textures/gallery/bioprzod.webp',
        painted: '/textures/gallery/bioprzod_painted.webp',
        url: 'https://hakkilo.africa', // TODO: vrai lien
        description: "Expérience de réalité augmentée sur mobile : du contenu 3D superposé au monde réel pour des activations de marque et des démonstrations produit.",
        techStack: ['/textures/gallery/htmllogo.webp', '/textures/gallery/csslogo.webp', '/textures/gallery/jslogo.webp', '/textures/gallery/netlifylogo.webp']
    },
];

const PROJECT_COUNT = 10; // Keep the count for the infinite scroll feel
const GAP = 2.5;

// Zmień te wartości aby dopasować proporcje ptaka (legacy ratio 1.41)
const BIRD_WIDTH = 0.49;
const BIRD_HEIGHT = 0.35;

// Adjust this value (0.0 to 1.0) to crop the right side of the "Houses" graphic.
// 0.0 = No crop
// 0.2 = 20% crop from the right (corridor side)
const RIGHT_CROP_AMOUNT = 0.2;

const GalleryRoom = ({ showRoom, onReady, isExiting, isWarmup }) => {
    const { openOverlay, isTeleporting } = useScene();
    const { showTutorial, unlockAchievement, hidePopup } = useAchievements();
    const { globalVolume, isMuted } = useAudio();
    const effectiveVolume = isMuted ? 0 : AUDIO_SETTINGS.volume * globalVolume;

    const audioRef = useRef();
    useEffect(() => {
        if (audioRef.current && audioRef.current.setVolume) {
            audioRef.current.setVolume(effectiveVolume);
        }
    }, [effectiveVolume]);

    const groupRef = useRef();
    const [scrollOffset, setScrollOffset] = useState(0);
    const targetScroll = useRef(0);
    const currentScroll = useRef(0);
    const [selectedCard, setSelectedCard] = useState(null);
    const [globalIsAnimating, setGlobalIsAnimating] = useState(false);
    const cardRefs = useRef([]);

    useEffect(() => {
        if (isExiting || isTeleporting) {
            hidePopup();
        }
    }, [isExiting, isTeleporting, hidePopup]);

    // Setup Paint Transition
    const { onBeforeCompile, animatePaint, resetPaint, uniformsData, updateRoomOrigin } = usePaintMaterial();
    
    // Track transition state to disable interactions
    const [isTransitioning, setIsTransitioning] = useState(false);
    
    // Track if user teleported into this room 
    const wasTeleportedRef = useRef(false);
    useEffect(() => {
        if (isTeleporting) wasTeleportedRef.current = true;
    }, [isTeleporting]);

    useEffect(() => {
        // When the room officially shows up (doors open and user flies in)
        if (showRoom && !isWarmup) {
            if (wasTeleportedRef.current || isTeleporting) {
                // Skip the painting transition entirely if teleporting via map
                uniformsData.uPaintProgress.value = 1.0;
                setIsTransitioning(false);
            } else {
                setIsTransitioning(true);
                // resetPaint() in case we re-enter
                resetPaint();
                // Start the paint animation with a slight delay so it happens *during* fly-in
                animatePaint(0.2, 2.5);
                
                // Re-enable interactions once painting finishes
                setTimeout(() => {
                    setIsTransitioning(false);
                }, 2700); // 0.2 + 2.5
            }
        } else {
            // Immediately reveal for warmup or hide if not showing
            uniformsData.uPaintProgress.value = 1.0;
        }
    }, [showRoom, isWarmup, isTeleporting]);

    const handleCardClick = async (clickedIndex) => {
        if (globalIsAnimating || isTransitioning) return;

        // Unlock inspect achievement
        unlockAchievement('gallery_inspect');

        if (selectedCard === clickedIndex) {
            setGlobalIsAnimating(true);
            await cardRefs.current[clickedIndex].closeCard();
            setSelectedCard(null);
            setGlobalIsAnimating(false);
        } else if (selectedCard !== null) {
            setGlobalIsAnimating(true);
            await cardRefs.current[selectedCard].closeCard();
            setSelectedCard(null);
            await cardRefs.current[clickedIndex].openCard();
            setSelectedCard(clickedIndex);
            setGlobalIsAnimating(false);
        } else {
            setGlobalIsAnimating(true);
            await cardRefs.current[clickedIndex].openCard();
            setSelectedCard(clickedIndex);
            setGlobalIsAnimating(false);
        }
    };

    // Track if we've signaled ready
    const hasSignaledReady = useRef(false);
    const frameCount = useRef(0);
    const FRAMES_TO_WAIT = 5;

    useFrame(() => {
        // Update room origin each frame so the paint shader knows where.
        // This is cheap (one getWorldPosition) and critical for far chunks.
        updateRoomOrigin(groupRef);

        if (hasSignaledReady.current) return;
        frameCount.current++;
        if (frameCount.current >= FRAMES_TO_WAIT) {
            hasSignaledReady.current = true;
            onReady?.();

            // Wait for the DoorSection 1.5s camera fly-in to finish before showing tutorial
            setTimeout(() => {
                if (!isWarmup) showTutorial('gallery_inspect');
            }, 2000);
        }
    });

    // Config
    const BALCONY_WIDTH = 5;
    const BALCONY_DEPTH = 3;
    const RAILING_HEIGHT = 1.25; // Legacy ratio 20/(7 segments * 2.287)

    // --- TEXTURES AND RESPONSIVENESS ---
    // User requested: painted on desktop, regular on touch/phones (even if laptop has touch screen)
    // We use matchMedia('(hover: hover)') to detect devices with a cursor/hover capability
    const [canHover, setCanHover] = useState(() => typeof window !== 'undefined' ? window.matchMedia('(hover: hover)').matches : true);

    useEffect(() => {
        const mq = window.matchMedia('(hover: hover)');
        const handleHoverChange = (e) => setCanHover(e.matches);
        mq.addEventListener('change', handleHoverChange);
        return () => mq.removeEventListener('change', handleHoverChange);
    }, []);

    // Load all project front textures in a flat array
    const textureUrls = UNIQUE_PROJECTS.map(p => p.front);
    const projectTextures = useTexture(textureUrls);

    // Load painted textures only on desktop, fallback to front if mobile/touch
    const paintedUrls = UNIQUE_PROJECTS.map(p => (canHover && p.painted) ? p.painted : p.front);
    const paintedTextures = useTexture(paintedUrls);

    // Load the universal back texture and the button texture conditionally
    const backTextureRaw = useTexture(canHover ? '/textures/gallery/tylkartki_painted.webp' : '/textures/gallery/tylkartki.webp');
    const overlayTextureRaw = useTexture(canHover ? '/textures/gallery/przyciskdotylukartki_painted.webp' : '/textures/gallery/przyciskdotylukartki.webp');

    // Preload tech stack logos to prevent stuttering on first flip
    // We use the same conditional logic: painted on desktop, regular on touch
    const allLogos = useMemo(() => {
        const names = [
            'csslogo', 'elementorlogo', 'firebaselogo', 'htmllogo',
            'jslogo', 'netlifylogo', 'phplogo', 'reactlogo',
            'tailwindlogo', 'wordpresslogo'
        ];
        return names.map(name => {
            if (!canHover) return `/textures/gallery/${name}.webp`;
            if (name === 'csslogo') return `/textures/gallery/css3logo_painted.webp`;
            return `/textures/gallery/${name}_painted.webp`;
        });
    }, [canHover]);
    
    useTexture(allLogos);

    // Construct the full list of projects (repeated) with textures attached
    const projects = useMemo(() => {
        return Array.from({ length: PROJECT_COUNT }).map((_, i) => {
            const projectIndex = i % UNIQUE_PROJECTS.length;
            const projectData = UNIQUE_PROJECTS[projectIndex];

            // Extract front texture
            const frontTex = projectTextures[projectIndex];
            const paintedTex = paintedTextures[projectIndex];

            // Configure textures
            if (frontTex) {
                frontTex.colorSpace = THREE.SRGBColorSpace;
                // frontTex.encoding = THREE.sRGBEncoding;
            }
            if (paintedTex) {
                paintedTex.colorSpace = THREE.SRGBColorSpace;
            }
            if (backTextureRaw) {
                backTextureRaw.colorSpace = THREE.SRGBColorSpace;
            }
            if (overlayTextureRaw) {
                overlayTextureRaw.colorSpace = THREE.SRGBColorSpace;
            }

            // Map tech stack logos to the correct version (painted or regular)
            const techStack = projectData.techStack.map(path => {
                if (!canHover) return path; // Keep regular
                const name = path.split('/').pop().replace('.webp', '');
                if (name === 'csslogo') return '/textures/gallery/css3logo_painted.webp';
                return `/textures/gallery/${name}_painted.webp`;
            });

            return {
                ...projectData,
                index: i,
                frontTexture: frontTex,
                paintedTexture: (paintedTex !== frontTex && canHover) ? paintedTex : null,
                backTexture: backTextureRaw,
                buttonTexture: overlayTextureRaw,
                techStack: techStack
            };
        });
    }, [projectTextures, backTextureRaw, overlayTextureRaw]);

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
    const lastTouchX = useRef(0);
    useEffect(() => {
        // Observers enable us to normalize wheel, touch, and pointer events
        const scrollObserver = Observer.create({
            target: window,
            type: "wheel,touch,pointer",
            wheelSpeed: -1,
            onWheel: (e) => {
                if (!showRoom || selectedCard !== null || globalIsAnimating || isTransitioning) return;
                const orig = e.event;
                orig.preventDefault();
                targetScroll.current += orig.deltaY * 0.005;
            },
            onPress: (e) => {
                if (!showRoom || selectedCard !== null || globalIsAnimating || isTransitioning) return;
                const orig = e.event;
                if (orig.touches && orig.touches.length === 1) {
                    lastTouchX.current = orig.touches[0].clientX;
                }
            },
            onDrag: (e) => {
                if (!showRoom || selectedCard !== null || globalIsAnimating || isTransitioning) return;
                const orig = e.event;
                if (orig.touches && orig.touches.length === 1) {
                    const deltaX = lastTouchX.current - orig.touches[0].clientX;
                    lastTouchX.current = orig.touches[0].clientX;
                    targetScroll.current += deltaX * 0.008;
                }
            }
        });

        return () => scrollObserver.kill();
    }, [showRoom, selectedCard, globalIsAnimating]);

    useFrame((state, delta) => {
        currentScroll.current = THREE.MathUtils.lerp(currentScroll.current, targetScroll.current, delta * 5);
    });

    // --- GEOMETRY & MATERIALS ---
    const floorTexture = useTexture('/textures/gallery/floor.webp');
    const railingTexture = useTexture('/textures/gallery/railing.webp');
    const housesTexture = useTexture('/textures/gallery/domki.webp');
    const cityTexture = useTexture('/textures/gallery/miastotlo.webp');
    const birdTexture = useTexture('/textures/gallery/bird_gray.webp');
    const clothespinTexture = useTexture('/textures/gallery/klamerka.webp');

    useEffect(() => {
        if (floorTexture) {
            floorTexture.wrapS = THREE.MirroredRepeatWrapping;
            floorTexture.wrapT = THREE.MirroredRepeatWrapping;
            floorTexture.repeat.set(0.5, 0.5 * 1.835); // Adjust repeat to keep scale with legacy 1.835 ratio
            floorTexture.needsUpdate = true;
        }
        if (railingTexture) {
            railingTexture.wrapS = railingTexture.wrapT = THREE.RepeatWrapping;
            railingTexture.repeat.set(7, 1);
            railingTexture.needsUpdate = true;
        }
    }, [floorTexture, railingTexture]);

    const materials = useMemo(() => {
        const floorMat = new THREE.MeshBasicMaterial({
            map: floorTexture,
            color: '#e0e0e0',
            side: THREE.DoubleSide
        });
        floorMat.onBeforeCompile = onBeforeCompile;
        floorMat.transparent = true;
        floorMat.needsUpdate = true;
        
        const ropeMat = new THREE.MeshBasicMaterial({ color: '#666666' });
        ropeMat.onBeforeCompile = onBeforeCompile;
        ropeMat.transparent = true;
        ropeMat.needsUpdate = true;

        const thresholdMat = new THREE.MeshBasicMaterial({
            color: '#e0e0e0',
            map: (() => {
                const t = new THREE.TextureLoader().load('/textures/corridor/texturadoprogow.webp');
                t.colorSpace = THREE.SRGBColorSpace;
                t.wrapS = t.wrapT = THREE.RepeatWrapping;
                t.repeat.set(15 / 2.524, 1);
                return t;
            })(),
            side: THREE.DoubleSide
        });
        thresholdMat.onBeforeCompile = onBeforeCompile;
        thresholdMat.transparent = true;
        thresholdMat.needsUpdate = true;

        return {
            floor: floorMat,
            rope: ropeMat,
            threshold: thresholdMat
        };
    }, [floorTexture, onBeforeCompile]);

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
            {!isWarmup && (
                <PositionalAudio
                    ref={audioRef}
                    url="/sounds/szummiasta.mp3"
                    distanceModel="exponential"
                    refDistance={AUDIO_SETTINGS.distance}
                    rolloffFactor={AUDIO_SETTINGS.rolloff}
                    loop
                    autoplay
                    volume={effectiveVolume}
                />
            )}
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
                    <lineBasicMaterial color="#999999" onBeforeCompile={onBeforeCompile} transparent={true} needsUpdate={true} />
                </line>

                {/* Railing */}
                <mesh position={[0, RAILING_HEIGHT / 2, -3.9]}>
                    <planeGeometry args={[20, RAILING_HEIGHT]} />
                    <meshBasicMaterial color="#e0e0e0"
                        map={railingTexture}
                        transparent={true}
                        side={THREE.DoubleSide}
                        alphaTest={0.1}
                        onBeforeCompile={onBeforeCompile}
                        customProgramCacheKey={() => 'railing-paint'}
                    />
                </mesh>

                {/* === THRESHOLD (At the end of the floor) === */}
                <mesh
                    position={[0, 0.01, -3.9]}
                    rotation={[-Math.PI / 2, 0, 0]}
                >
                    <planeGeometry args={[15, 0.15]} />
                    <primitive object={materials.threshold} />
                </mesh>

                {/* === CLOTHESLINE SYSTEM === */}
                <group position={[0, 1.6, -4]}>
                    <mesh geometry={ropeGeometry} material={materials.rope} />

                    {/* Proj Cards */}
                    {projects.map((project, i) => (
                        <ProjectCard
                            key={i}
                            index={i}
                            ref={el => cardRefs.current[i] = el}
                            project={project}
                            clothespinTexture={clothespinTexture}
                            total={PROJECT_COUNT}
                            currentScroll={currentScroll}
                            materials={materials}
                            curve={curve}
                            isSelected={selectedCard === i}
                            scrollToIndex={scrollToIndex}
                            onClick={handleCardClick}
                            isMobile={!canHover} // Use hover capability for mobile behavior logic
                            isTransitioning={isTransitioning} // Pass down to lock out individual pointer events just in case
                            paintProgress={uniformsData.uPaintProgress}
                            roomOrigin={uniformsData.uRoomOrigin}
                        />
                    ))}
                </group>

                {/* === SCENERY LAYERS === */}
                {/* Houses - center */}
                <mesh position={[0, -1, -9]} scale={[1, 1, 1]}>
                    <planeGeometry args={[15, 15 / 2.357]} />
                    <meshBasicMaterial color="#e0e0e0"
                        map={housesTexture}
                        transparent={true}
                        alphaTest={0.1}
                        side={THREE.DoubleSide}
                        onBeforeCompile={onBeforeCompile}
                    />
                </mesh>
                {/* Houses - left side (mirrored) */}
                <mesh position={[-15, -1, -9]} scale={[-1, 1, 1]}>
                    <planeGeometry args={[15, 15 / 2.357]} />
                    <meshBasicMaterial color="#e0e0e0"
                        map={housesTexture}
                        transparent={true}
                        alphaTest={0.1}
                        side={THREE.DoubleSide}
                        onBeforeCompile={onBeforeCompile}
                    />
                </mesh>
                {/* Houses - right side (mirrored) - CROPPED */}
                <RightSideHouses
                    texture={housesTexture}
                    baseWidth={15}
                    baseHeight={15 / 2.357}
                    cropAmount={RIGHT_CROP_AMOUNT}
                />

                {/* City skyline - center */}
                <mesh position={[0, 3.4, -17]} scale={[1, 1, 1]}>
                    <planeGeometry args={[30, 30 / 2.357]} />
                    <meshBasicMaterial color="#e0e0e0"
                        map={cityTexture}
                        transparent={true}
                        alphaTest={0.1}
                        side={THREE.DoubleSide}
                        onBeforeCompile={onBeforeCompile}
                    />
                </mesh>
                {/* City skyline - left (mirrored) */}
                <mesh position={[-30, 3.4, -17]} scale={[-1, 1, 1]}>
                    <planeGeometry args={[30, 30 / 2.357]} />
                    <meshBasicMaterial color="#e0e0e0"
                        map={cityTexture}
                        transparent={true}
                        alphaTest={0.1}
                        side={THREE.DoubleSide}
                        onBeforeCompile={onBeforeCompile}
                    />
                </mesh>
                {/* City skyline - right (mirrored) */}
                <mesh position={[30, 3.4, -17]} scale={[-1, 1, 1]}>
                    <planeGeometry args={[30, 30 / 2.357]} />
                    <meshBasicMaterial color="#e0e0e0"
                        map={cityTexture}
                        transparent={true}
                        alphaTest={0.1}
                        side={THREE.DoubleSide}
                        onBeforeCompile={onBeforeCompile}
                    />
                </mesh>

                {/* Flying Bird */}
                <FlyingBird texture={birdTexture} />

                {/* Clouds scattered above */}
                <GalleryClouds count={65} seed={123} />

                {/* Skybox/Environment */}
                <mesh position={[0, 5, -20]}>
                    <sphereGeometry args={[40, 32, 32]} />
                    <meshBasicMaterial color="#f0f0f0" side={THREE.BackSide} transparent opacity={0.5} onBeforeCompile={onBeforeCompile} />
                </mesh>
            </group>
        </group>
    );
};

// Flying bird animation component
const FlyingBird = ({ texture }) => {
    const birdRef = useRef();
    const startX = -25;
    const endX = 25;
    const speed = 2.5; // Zmniejszona prędkość lotu

    // Zmienne do fizyki skoków
    const velocityY = useRef(0);
    const gravity = -12.0; // Zmniejszona grawitacja dla większej płynności
    const jumpStrength = 5.5; // Delikatniejszy skok
    const jumpInterval = useRef(0);

    useFrame((state, delta) => {
        if (!birdRef.current) return;

        // Zabezpieczenie przed zbyt dużym powiększeniem delty (przy lagach)
        const safeDelta = Math.min(delta, 0.05);

        // Ruch w poziomie
        birdRef.current.position.x += speed * safeDelta;

        if (birdRef.current.position.x > endX) {
            birdRef.current.position.x = startX;
            birdRef.current.position.y = 4.5;
            velocityY.current = 0;
            jumpInterval.current = 0;
            birdRef.current.rotation.z = 0;
        }

        // Fizyka spadania
        velocityY.current += gravity * safeDelta;
        birdRef.current.position.y += velocityY.current * safeDelta;

        // Skakanie (płynniejsze i przewidywalne)
        jumpInterval.current -= safeDelta;

        // Skok następuje po upływie czasu przewidzianego do następnego kliknięcia
        if (jumpInterval.current <= 0 || birdRef.current.position.y < 3.2) {
            velocityY.current = jumpStrength;
            // Rzadsze, bardziej rytmiczne skoki (np. co pełną sekundę)
            jumpInterval.current = 0.9 + Math.random() * 0.3;
        }

        // Ograniczenie dolne podłogi
        if (birdRef.current.position.y < 3.0) {
            birdRef.current.position.y = 3.0;
            velocityY.current = jumpStrength;
        }

        // Ograniczenie górne sufitu
        if (birdRef.current.position.y > 6.5) {
            birdRef.current.position.y = 6.5;
            velocityY.current = 0;
        }

        // Rotacja ptaka
        // W Flappy Bird ptak delikatnie opada dziobem w dół gdy spada, i kieruje wzrok do góry gdy skacze
        const targetRotationZ = THREE.MathUtils.clamp(velocityY.current * 0.05, -Math.PI / 6, Math.PI / 8);

        // Bardzo płynne obracanie (lerp)
        birdRef.current.rotation.z = THREE.MathUtils.lerp(birdRef.current.rotation.z, targetRotationZ, safeDelta * 8);
    });

    return (
        <mesh ref={birdRef} position={[startX, 4.5, -10]} scale={[BIRD_WIDTH, BIRD_HEIGHT, 1]}>
            <planeGeometry args={[1.5, 1.5]} />
            <meshBasicMaterial color="#e0e0e0"
                map={texture}
                transparent={true}
                alphaTest={0.1}
                side={THREE.DoubleSide}
            />
        </mesh>
    );
};

// Sub-component for individual project cards
const ProjectCard = memo(forwardRef(({ index, project, clothespinTexture, currentScroll, materials, curve, isSelected, scrollToIndex, onClick, isMobile, isTransitioning, paintProgress, roomOrigin }, ref) => {
    const cardRef = useRef();
    const paperRef = useRef(); // Ref for the moving part (Paper)
    const materialRef = useRef();
    const textRef = useRef(); // Ref for the text that sticks to the paper
    const buttonGroupRef = useRef(); // Ref for the interactive back button
    const detailsGroupRef = useRef(); // Ref for the project details on the back
    const techStackGroupRef = useRef(); // Ref for the tech stack section on the back
    const detailsTextRef1 = useRef();
    const detailsTextRef2 = useRef();
    const techTextRef = useRef();
    const openTextRef = useRef();
    const [hovered, setHovered] = useState(false);
    const [btnHovered, setBtnHovered] = useState(false);
    const [isAnimating, setIsAnimating] = useState(false);  // True ONLY during flip animation
    const [isScrolling, setIsScrolling] = useState(false);  // True during scroll phase

    // Random sway properties
    const swaySpeed = useRef(Math.random() * 0.2 + 0.3); // Slower sway speed
    const swayOffset = useRef(Math.random() * 100);

    // Audio Ref
    const paperAudioRef = useRef();
    const { globalVolume, isMuted } = useAudio();

    const playPaperSound = () => {
        if (paperAudioRef.current) {
            const vol = isMuted ? 0 : GALLERY_INTERACTION_AUDIO_SETTINGS.volume * globalVolume;
            paperAudioRef.current.setVolume(vol);
            if (paperAudioRef.current.isPlaying) paperAudioRef.current.stop();
            paperAudioRef.current.play();
        }
    };

    useImperativeHandle(ref, () => ({
        closeCard: () => {
            return new Promise((resolve) => {
                setIsAnimating(true);
                playPaperSound();

                const timeline = gsap.timeline({
                    onComplete: () => {
                        setIsAnimating(false);
                        resolve();

                        // Unpaint the card after it returns to the clothespin
                        if (project.paintedTexture && materialRef.current) {
                            gsap.to(materialRef.current, {
                                uProgress: 0.0,
                                duration: 0.5,
                                ease: 'power2.out',
                                overwrite: 'auto'
                            });
                        }
                    }
                });

                const localBaseY = -1.1;

                timeline.to(paperRef.current.position, {
                    y: localBaseY + 0.6,
                    x: 0,
                    z: 1,
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

                if (materialRef.current) {
                    timeline.to(materialRef.current, {
                        bend: 0.6,
                        duration: 0.3,
                        ease: 'power2.in'
                    }, '<');
                }

                timeline.to(paperRef.current.scale, {
                    x: 1, y: 1, z: 1,
                    duration: 0.3, ease: 'sine.inOut'
                }, '<');

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

                if (materialRef.current) {
                    timeline.to(materialRef.current, {
                        bend: 0,
                        duration: 0.3,
                        ease: 'power2.out'
                    }, '<');
                }
            });
        },
        openCard: () => {
            return new Promise((resolve) => {
                setIsScrolling(true);
                scrollToIndex(index, () => {
                    setIsScrolling(false);
                    setIsAnimating(true);
                    playPaperSound();

                    const isMobile = window.innerWidth < 768;
                    const targetX_World = 0;
                    const targetY_World = isMobile ? -0.2 : 0.1;
                    const targetZ_World = isMobile ? 0.5 : 1.5;

                    const parentPos = cardRef.current.position;
                    const targetX = targetX_World - parentPos.x;
                    const targetY = targetY_World - parentPos.y;
                    const targetZ = targetZ_World - parentPos.z;

                    const timeline = gsap.timeline({
                        onComplete: () => {
                            setIsAnimating(false);
                            resolve();
                        }
                    });

                    timeline.to(cardRef.current.rotation, {
                        x: 0, y: 0, z: 0,
                        duration: 0.3,
                        ease: 'power2.out'
                    }, 0);

                    if (materialRef.current) materialRef.current.bend = 0;

                    const localBaseY = -1.1;

                    timeline.to(paperRef.current.position, {
                        y: localBaseY - 0.5,
                        duration: 0.15,
                        ease: 'power2.out'
                    });

                    timeline.to(paperRef.current.rotation, {
                        x: 0.5,
                        z: -0.05,
                        duration: 0.15,
                        ease: 'power2.out'
                    }, '<');

                    if (materialRef.current) {
                        timeline.to(materialRef.current, {
                            bend: 0.8,
                            duration: 0.15,
                            ease: 'power2.out'
                        }, '<');

                        // Keep painted or finish painting to 1.0 when opened
                        // Running with gsap.to independently to avoid blocking the timeline duration
                        if (project.paintedTexture) {
                            gsap.to(materialRef.current, {
                                uProgress: 1.0,
                                duration: 0.3,
                                ease: 'power2.out',
                                overwrite: 'auto'
                            });
                        }
                    }

                    timeline.to(paperRef.current.position, {
                        y: localBaseY + 1.5,
                        x: targetX * 0.2,
                        z: targetZ * 0.2,
                        duration: 0.4,
                        ease: 'power1.out'
                    });

                    timeline.to(paperRef.current.rotation, {
                        x: Math.PI * 0.8,
                        z: 0.05,
                        y: -0.02,
                        duration: 0.4,
                        ease: 'power1.inOut'
                    }, '<');

                    if (materialRef.current) {
                        timeline.to(materialRef.current, {
                            bend: -0.3,
                            duration: 0.4,
                            ease: 'power1.inOut'
                        }, '<');
                    }

                    timeline.to(paperRef.current.position, {
                        y: targetY,
                        x: targetX,
                        z: targetZ,
                        duration: 0.4,
                        ease: 'power3.out'
                    });

                    timeline.to(paperRef.current.rotation, {
                        x: Math.PI,
                        y: 0,
                        z: 0,
                        duration: 0.4,
                        ease: 'power3.out'
                    }, '<');

                    if (materialRef.current) {
                        timeline.to(materialRef.current, {
                            bend: 0,
                            duration: 0.5,
                            ease: 'power2.out'
                        }, '<');
                    }

                    timeline.to(paperRef.current.scale, {
                        x: 1.1,
                        y: 1.1,
                        z: 1.1,
                        duration: 0.3,
                        ease: 'sine.out'
                    }, '-=0.4');
                });
            });
        }
    }));

    const handleClick = (e) => {
        e.stopPropagation();
        if (onClick) onClick(index);
    };

    // Cursor change on hover
    useEffect(() => {
        if (btnHovered && isSelected) {
            document.body.style.cursor = 'pointer';
        } else if (hovered && !isSelected) {
            document.body.style.cursor = 'pointer';
        } else {
            document.body.style.cursor = 'auto';
        }
        return () => { document.body.style.cursor = 'auto'; };
    }, [hovered, isSelected, btnHovered]);

    useFrame((state) => {
        if (!cardRef.current) return;

        // Custom GSAP Paint logic for texts
        // We delay the text reveal slightly so the card paints first (p > 0.4)
        if (textRef.current && paintProgress) {
            const p = paintProgress.value;
            // Instantly reveal if we teleported
            const expectedOpacity = p >= 1.0 ? 1.0 : THREE.MathUtils.clamp((p - 0.3) * 2.0, 0.0, 1.0);
            
            if (textRef.current.fillOpacity !== expectedOpacity) {
                const applyOpacity = (ref) => {
                    if (ref.current) {
                        ref.current.fillOpacity = expectedOpacity;
                        if (ref.current.material) {
                            ref.current.material.opacity = expectedOpacity;
                            ref.current.material.transparent = true;
                        }
                    }
                };
                applyOpacity(textRef);
                applyOpacity(detailsTextRef1);
                applyOpacity(detailsTextRef2);
                applyOpacity(techTextRef);
                applyOpacity(openTextRef);
            }
        }

        // --- Zrównaj pozycję tekstu Z z animacją zaginania i falowania kartki (PRZÓD) ---
        if (textRef.current && materialRef.current) {
            const y = textRef.current.position.y;
            const uBend = materialRef.current.bend;
            const uWindStrength = materialRef.current.windStrength || 0;
            const uTime = state.clock.getElapsedTime();

            const bendAmount = Math.pow(y, 2.0) * uBend;
            const totalWind = 0.02 + uWindStrength;
            const flutter = Math.sin(uTime * 2.0 + y * 2.0) * totalWind * (1.0 + Math.abs(uBend * 3.0));

            textRef.current.position.z = bendAmount + flutter + 0.02;

            // Obrót tekstu by przylegał do krzywizny (pochodna dz/dy)
            const dz_dy = 2.0 * y * uBend + 2.0 * Math.cos(uTime * 2.0 + y * 2.0) * totalWind * (1.0 + Math.abs(uBend * 3.0));
            textRef.current.rotation.x = Math.atan(dz_dy);
        }

        // --- Zrównaj pozycję przycisku Z z animacją pleców (TYŁ) ---
        if (buttonGroupRef.current && materialRef.current) {
            const y = buttonGroupRef.current.position.y;
            const uBend = materialRef.current.bend;
            const uWindStrength = materialRef.current.windStrength || 0;
            const uTime = state.clock.getElapsedTime();

            const bendAmount = Math.pow(y, 2.0) * uBend;
            const totalWind = 0.02 + uWindStrength;
            const flutter = Math.sin(uTime * 2.0 + y * 2.0) * totalWind * (1.0 + Math.abs(uBend * 3.0));

            // PAMIĘTAJ! Cała płaszczyzna zgina się w przód (+Z względem rodzica).
            // A że my jesteśmy PO ZEWNĘTRZNEJ stronie (z tyłu pleców), chcemy być ułamek za płaszczyzną, np -0.03
            // Wcześniej omyłkowo odwróciłem znak całego równania ( -(bendAmount...) ), co odwróciło falowanie. Prawidłowo jest tak:
            buttonGroupRef.current.position.z = bendAmount + flutter - 0.03;

            // Obrót przycisku by przylegał do krzywizny, będąc po przeciwnej stronie (dodatkowe odwrócenie o Pi)
            const dz_dy = 2.0 * y * uBend + 2.0 * Math.cos(uTime * 2.0 + y * 2.0) * totalWind * (1.0 + Math.abs(uBend * 3.0));
            buttonGroupRef.current.rotation.x = Math.PI + Math.atan(dz_dy);

            // Hover animacja powiększania dla przycisku (napis się powiększa)
            const targetScale = btnHovered ? 1.08 : 1;
            buttonGroupRef.current.scale.lerp(_tempScale.set(targetScale, targetScale, 1), 0.15);
        }

        // --- Zrównaj pozycję górnego opisu (PROJECT DETAILS) ---
        if (detailsGroupRef.current && materialRef.current) {
            const y = detailsGroupRef.current.position.y;
            const uBend = materialRef.current.bend;
            const uWindStrength = materialRef.current.windStrength || 0;
            const uTime = state.clock.getElapsedTime();

            const bendAmount = Math.pow(y, 2.0) * uBend;
            const totalWind = 0.02 + uWindStrength;
            const flutter = Math.sin(uTime * 2.0 + y * 2.0) * totalWind * (1.0 + Math.abs(uBend * 3.0));

            // Z tyłu (jak button)
            detailsGroupRef.current.position.z = bendAmount + flutter - 0.03;

            // Obrót
            const dz_dy = 2.0 * y * uBend + 2.0 * Math.cos(uTime * 2.0 + y * 2.0) * totalWind * (1.0 + Math.abs(uBend * 3.0));
            detailsGroupRef.current.rotation.x = Math.PI + Math.atan(dz_dy);
        }

        // --- Zrównaj pozycję sekcji Tech Stack ---
        if (techStackGroupRef.current && materialRef.current) {
            const y = techStackGroupRef.current.position.y;
            const uBend = materialRef.current.bend;
            const uWindStrength = materialRef.current.windStrength || 0;
            const uTime = state.clock.getElapsedTime();

            const bendAmount = Math.pow(y, 2.0) * uBend;
            const totalWind = 0.02 + uWindStrength;
            const flutter = Math.sin(uTime * 2.0 + y * 2.0) * totalWind * (1.0 + Math.abs(uBend * 3.0));

            techStackGroupRef.current.position.z = bendAmount + flutter - 0.03;

            const dz_dy = 2.0 * y * uBend + 2.0 * Math.cos(uTime * 2.0 + y * 2.0) * totalWind * (1.0 + Math.abs(uBend * 3.0));
            techStackGroupRef.current.rotation.x = Math.PI + Math.atan(dz_dy);
        }

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
            onPointerEnter={(e) => {
                if (isMobile || isTransitioning) return;
                e.stopPropagation();
                setHovered(true);

                // Brush reveal animation
                if (materialRef.current && project.paintedTexture && !isSelected) {
                    gsap.to(materialRef.current, {
                        uProgress: 1.0,
                        duration: 0.8,
                        ease: 'power2.out',
                        overwrite: 'auto'
                    });
                }
            }}
            onPointerLeave={(e) => {
                if (isMobile || isTransitioning) return;
                e.stopPropagation();
                setHovered(false);

                // Reverse brush reveal animation ONLY if NOT selected
                if (materialRef.current && project.paintedTexture && !isSelected) {
                    gsap.to(materialRef.current, {
                        uProgress: 0.0,
                        duration: 0.5,
                        ease: 'power2.out',
                        overwrite: 'auto'
                    });
                }
            }}
        >
            {/* Clothespin (Top Center) - Does NOT move with paperRef */}
            <mesh position={[0, -0.08, 0.15]} rotation={[0, 0, Math.PI]}>
                <planeGeometry args={[0.3, 0.2]} />
                <meshBasicMaterial color="#ffffff"
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
                        mapPainted={project.paintedTexture}
                        side={THREE.DoubleSide}
                        roughness={0.6}
                        paintProgress={paintProgress}
                        roomOrigin={roomOrigin}
                    />
                </mesh>

                {/* === PRZYCISK: OPEN NA PLECACH KARTKI === */}
                <group
                    ref={buttonGroupRef}
                    position={[0, 0.75, 0]}
                    rotation={[Math.PI, 0, 0]}
                >
                    {/* Warstwa 1: Wizualna ramka przycisku (bez eventów) */}
                    <mesh>
                        <planeGeometry args={[1.2, 1.2 / 3.613]} />
                        <meshBasicMaterial color="#ffffff"
                            map={project.buttonTexture}
                            transparent={true}
                            alphaTest={0.05}
                        />
                    </mesh>

                    {/* Warstwa 2: Napis OPEN PROJECT (bez eventów) */}
                    <Text
                        ref={openTextRef}
                        position={[0, 0, 0.01]}
                        fontSize={0.11}
                        color={btnHovered ? "#333333" : "#1c1c1c"}
                        font="/fonts/CabinSketch-Bold.ttf"
                        anchorX="center"
                        anchorY="middle"
                        fillOpacity={0} // Start hidden
                    >
                        OPEN PROJECT
                    </Text>

                    {/* Warstwa 3: Niewidoczny hit-area pokrywający cały przycisk - łapie WSZYSTKIE eventy */}
                    <mesh
                        position={[0, 0, 0.02]}
                        onClick={(e) => {
                            if (isSelected && !isTransitioning) {
                                e.stopPropagation();
                                window.open(project.url, '_blank');
                            }
                        }}
                        onPointerEnter={(e) => {
                            if (isSelected && !isTransitioning) {
                                e.stopPropagation();
                                setBtnHovered(true);
                            }
                        }}
                        onPointerLeave={(e) => {
                            if (isSelected && !isTransitioning) {
                                e.stopPropagation();
                            }
                            setBtnHovered(false);
                        }}
                    >
                        <planeGeometry args={[1.2, 1.2 / 3.613]} />
                        <meshBasicMaterial color="#e0e0e0" transparent={true} opacity={0} />
                    </mesh>
                </group>

                {/* === TEKST NA PLECACH KARTKI (PROJECT DETAILS) === */}
                <group
                    ref={detailsGroupRef}
                    position={[0, -0.5, 0]} // Miejsce u góry (gdy Y=0.75 to dół, to Y=-0.4 to góra)
                    rotation={[Math.PI, 0, 0]}
                >
                    <Text
                        ref={detailsTextRef1}
                        position={[0, 0.28, 0.01]} // Względem środka detailsGroupRef, wyżej
                        fontSize={0.10}
                        color="#1c1c1c"
                        font="/fonts/CabinSketch-Bold.ttf"
                        anchorX="center"
                        anchorY="middle"
                        fillOpacity={0} // Start hidden
                    >
                        PROJECT DETAILS:
                    </Text>

                    <Text
                        ref={detailsTextRef2}
                        position={[0, 0.2, 0.01]} // Poniżej nagłówka
                        fontSize={0.06}
                        color="#333333"
                        font="/fonts/CabinSketch-Bold.ttf"
                        anchorX="center"
                        anchorY="top"
                        maxWidth={1.1} // Maksymalna szerokość zanim zacznie łamać linie
                        lineHeight={1.4}
                        textAlign="center"
                        fillOpacity={0} // Start hidden
                    >
                        {project.description || "Lorem ipsum dolor sit amet, consectetur adipiscing elit. Sed do eiusmod tempor incididunt ut labore et dolore magna aliqua. Ut enim ad minim veniam, quis nostrud exercitation ullamco."}
                    </Text>
                </group>

                {/* === SEKCJA TECH STACK NA PLECACH KARTKI === */}
                <group
                    ref={techStackGroupRef}
                    position={[0, 0.30, 0]} // Pomiędzy Project Details a przyciskiem Open Project
                    rotation={[Math.PI, 0, 0]}
                >
                    <Text
                        ref={techTextRef}
                        position={[0, 0.15, 0.01]}
                        fontSize={0.08}
                        color="#1c1c1c"
                        font="/fonts/CabinSketch-Bold.ttf"
                        anchorX="center"
                        anchorY="middle"
                        fillOpacity={0} // Start hidden
                    >
                        TECH STACK
                    </Text>

                    {/* Kontener na loga układane poziomo */}
                    <group position={[0, -0.05, 0.01]}>
                        {project.techStack && project.techStack.map((logoPath, idx) => {
                            // Rozstawienie kwadracików (4 sztuki wyśrodkowane)
                            const spacing = 0.30;
                            const startX = -((project.techStack.length - 1) * spacing) / 2;
                            const xPos = startX + (idx * spacing);

                            return (
                                <TechStackLogo key={idx} path={logoPath} position={[xPos, 0, 0]} />
                            );
                        })}
                    </group>
                </group>

                {/* 
                  === TEKST / TYTUŁY PROJEKTÓW ===
                  Tu możesz łatwo dostosować wygląd każdego napisu.
                  
                  position: [X, Y, Z] 
                  > X to lewo/prawo (0 to środek)
                  > Y to góra/dół (np. 0.75 to góra kartki, -0.75 dół)
                  > Z nie ruszać. Skrypt powyżej sam wylicza Z, żeby napis zginał się i przyklejał do fali kartki!
                  
                  fontSize: rozmiar fontu (domyślnie 0.15)
                  color: kolor napisu
                  font: opcjonalnie dajesz tu inną czcionkę z folderu /public/fonts/
                */}
                <Text
                    ref={textRef}
                    position={[0, 0.7, 0]} // Tylko dwa pierwsze parametry [X, Y] mają tutaj znaczenie
                    fontSize={0.20}
                    color="#1c1c1c"
                    font="/fonts/CabinSketch-Bold.ttf"
                    anchorX="center"
                    anchorY="middle"
                    fillOpacity={0} // Start hidden
                >
                    {project.title}
                </Text>

                <PositionalAudio
                    ref={paperAudioRef}
                    url="/sounds/papersound.mp3"
                    distanceModel="exponential"
                    rolloffFactor={GALLERY_INTERACTION_AUDIO_SETTINGS.rolloff}
                    refDistance={GALLERY_INTERACTION_AUDIO_SETTINGS.distance}
                    loop={false}
                />
            </group>
        </group>
    );
}));


// Component to handle the cropped right-side houses
const RightSideHouses = ({ texture, baseWidth, baseHeight, cropAmount }) => {
    // Clone texture to allow independent UV manipulation
    const croppedTexture = useMemo(() => {
        const t = texture.clone();
        // Because scale.x is -1 (mirrored), the "Right" side in world space
        // corresponds to the "Left" side of the texture (U=0).
        // To crop the world-right side, we need to crop the texture-left side.
        // So we increase offset.x.
        t.offset.x = cropAmount;
        t.repeat.x = 1 - cropAmount;
        t.needsUpdate = true;
        return t;
    }, [texture, cropAmount]);

    // Calculate new width and position
    const newWidth = baseWidth * (1 - cropAmount);

    // Original Inner Edge (World Left of this mesh) was at CenterX - Width/2
    // For the Right Side Mesh: 
    // Original Pos = 15. Width = 15.
    // Inner Edge = 15 - 7.5 = 7.5.
    // We want to keep Inner Edge at 7.5.
    // New Center = Inner Edge + NewWidth / 2
    const newX = 7.5 + (newWidth / 2);

    return (
        <mesh position={[newX, -1, -9]} scale={[-1, 1, 1]}>
            <planeGeometry args={[newWidth, baseHeight]} />
            <meshBasicMaterial color="#e0e0e0"
                map={croppedTexture}
                transparent={true}
                alphaTest={0.1}
                side={THREE.DoubleSide}
            />
        </mesh>
    );
};

// Sub-component for individual tech stack logos
const TechStackLogo = ({ path, position }) => {
    const texture = useTexture(path);

    return (
        <mesh position={position}>
            <planeGeometry args={[0.17, 0.17]} />
            <meshBasicMaterial color="#ffffff"
                map={texture}
                transparent={true}
            />
        </mesh>
    );
};

export default GalleryRoom;
