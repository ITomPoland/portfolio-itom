import { useRef, useState, useEffect, useCallback } from 'react';
import { useFrame, useThree } from '@react-three/fiber';
import { Text } from '@react-three/drei';
import * as THREE from 'three';
import gsap from 'gsap';
import MessagePaper from './MessagePaper';
import { useScene } from '../../../../context/SceneContext';

// ============================================
// ============================================
// 🌊 CONTACT ROOM v2 - MESSAGE IN A BOTTLE
// Immersive experience: write message, roll into bottle, throw
// ============================================
import { useTexture } from '@react-three/drei';

const WAVE_LAYERS = 4;

// ============================================
// ⚙️ CAMERA SETTINGS - TWEAK HERE
// ============================================
const CAMERA_SETTINGS = {
    // Rotation X: How much to look down (radians)
    // -1.5 is straight down (-90 deg), -1.2 is ~70 deg
    lookDownAngle: -1.2,

    // Rotation Y: Left/Right turn
    // Set to 0 to force center, or null to keep current direction
    forceCenterY: -1.05, // FORCE CENTER to align paper straight

    // Rotation Z: Tilt/Roll
    // Set to 0 to straighten the camera
    forceStraightZ: 0,

    // Animation speed
    lerpSpeed: 2.5
};

// Experience phases
const PHASE = {
    ENTERING: 'entering',      // Camera entering room
    LOOKING_DOWN: 'looking_down', // Camera animating to look at dock
    WRITING: 'writing',        // User writing on paper
    ROLLING: 'rolling',        // Paper rolling into bottle
    HOLDING: 'holding',        // Camera holding bottle, looking at sea
    THROWING: 'throwing',      // Bottle being thrown
    DONE: 'done'               // Bottle floating away
};

const ContactRoom = ({ showRoom, onReady, isExiting }) => {
    const { camera } = useThree();
    const { isTeleporting } = useScene();

    // Load Sea Texture
    const seaTexture = useTexture("/textures/contact/faletopdown.png");
    // Load Molo Texture
    const moloTexture = useTexture("/textures/contact/molo.png");

    // Load Bottle Textures
    const bottleBody = useTexture("/textures/contact/czescglownabutelki.png");
    const bottleCap = useTexture("/textures/contact/zakretkabutelki.png");
    const bottlePaper = useTexture("/textures/contact/papiernabutelke.png");

    // Configure texture repeating (1:1 scale)
    useEffect(() => {
        if (seaTexture) {
            seaTexture.wrapS = seaTexture.wrapT = THREE.RepeatWrapping;
            // Geometry is 80x30.
            // Previous 40x15 was too dense (looked gray).
            // 1x1 was visible but stretched.
            // Setting to a balanced repeat to show detail but tile correctly.
            seaTexture.repeat.set(6, 4);
            seaTexture.needsUpdate = true;
        }

        if (moloTexture) {
            moloTexture.wrapS = moloTexture.wrapT = THREE.RepeatWrapping;

            // User feedback: Texture is "horizontal" but should be "vertical".
            // Rotating 90 degrees to align planks along the length of the pier.
            moloTexture.center.set(0.5, 0.5);
            moloTexture.rotation = Math.PI / 2;

            // After rotation, U axis of texture runs along V axis of geometry (Length).
            // Dock Dimensions: 3 (width) x 7 (length).
            // We want planks along the length? Or just rotated?
            // If rotating, we swap the aspect ratio consideration.
            // Let's try to fit the texture well.
            moloTexture.repeat.set(1, 1);

            moloTexture.needsUpdate = true;
        }
    }, [seaTexture, moloTexture]);

    useEffect(() => {
        // Set rotation order to YXZ to prevent Gimbal lock and mixing of axes
        // Y = Body turn (Yaw), X = Head tilt (Pitch), Z = Roll
        camera.rotation.order = 'YXZ';
    }, [camera]);

    // Track if we've signaled ready
    const hasSignaledReady = useRef(false);
    const frameCount = useRef(0);
    const FRAMES_TO_WAIT = 5;

    // Phase state
    const [currentPhase, setCurrentPhase] = useState(PHASE.ENTERING);

    // Store original camera rotation to restore later
    const originalCameraRotation = useRef({ x: 0, y: 0, z: 0 });
    const hasAnimatedDown = useRef(false);
    // Latch exit state to prevent glitch
    const hasExitTriggered = useRef(false);
    if (isExiting) hasExitTriggered.current = true;

    // Refs for animations
    const waveRefs = useRef([]);
    const bottleRef = useRef();
    const bottleCapRef = useRef(); // Separate ref for cap animation
    const paperRef = useRef();

    // Bottle cap animation state
    const [isCapAnimating, setIsCapAnimating] = useState(false);
    const capProgress = useRef(0); // 0 = closed, 1 = fully open

    // Bottle cap closing animation state (after paper is inserted)
    const [isCapClosing, setIsCapClosing] = useState(false);
    const capCloseProgress = useRef(0); // 0 = open, 1 = fully closed

    // Writing animation state (after cap is closed)
    const [isWriting, setIsWriting] = useState(false);
    const [displayedText, setDisplayedText] = useState('');
    const [emailUsername, setEmailUsername] = useState(''); // Part before @
    const writingProgress = useRef(0);

    // ============================================
    // 📷 CAMERA ANIMATION - Look down at dock
    // Triggered after room is ready
    // ============================================
    // ============================================
    // 📷 CAMERA CONTROL
    // Simple Euler rotation to look down
    // ============================================

    // Target rotation values
    const targetRotX = useRef(0);
    const targetRotY = useRef(0);
    const targetRotZ = useRef(0);

    // Reset camera rotation when teleporting starts
    useEffect(() => {
        if (isTeleporting) {
            // Reset camera control to prevent tilted camera after teleport
            hasAnimatedDown.current = false;
            hasExitTriggered.current = false;
            targetRotX.current = 0;
            targetRotY.current = 0;
            targetRotZ.current = 0;
            setCurrentPhase(PHASE.ENTERING);
        }
    }, [isTeleporting]);

    useEffect(() => {
        if (hasSignaledReady.current && !hasAnimatedDown.current && showRoom) {
            hasAnimatedDown.current = true;
            hasExitTriggered.current = false; // Reset latch

            // Capture landing rotation (usually 0,0,0)
            targetRotX.current = camera.rotation.x;
            targetRotY.current = camera.rotation.y;
            targetRotZ.current = camera.rotation.z;

            // Start sequence
            const timer = setTimeout(() => {
                setCurrentPhase(PHASE.LOOKING_DOWN);

                // 1. SET X (Looking down)
                targetRotX.current = CAMERA_SETTINGS.lookDownAngle;

                // 2. SET Y (Turning)
                if (CAMERA_SETTINGS.forceCenterY !== null) {
                    targetRotY.current = CAMERA_SETTINGS.forceCenterY;
                }
                // else: keep targetRotY as captured (current rotation)

                // 3. SET Z (Tilt)
                if (CAMERA_SETTINGS.forceStraightZ !== null) {
                    targetRotZ.current = CAMERA_SETTINGS.forceStraightZ;
                }
            }, 800);

            // Phase transition
            const phaseTimer = setTimeout(() => {
                setCurrentPhase(PHASE.WRITING);
            }, 2000);

            return () => {
                clearTimeout(timer);
                clearTimeout(phaseTimer);
            };
        }

        // EXIT ANIMATION CLEANUP
        // When room is finally hidden, reset everything
        if (!showRoom) {
            hasExitTriggered.current = false;
            if (hasAnimatedDown.current) {
                hasAnimatedDown.current = false;
                setCurrentPhase(PHASE.ENTERING);
                // Reset targets just in case
                targetRotX.current = 0;
                targetRotZ.current = 0;
            }
        }
    }, [hasSignaledReady.current, showRoom, camera]);

    // Frame Loop
    useFrame((state, delta) => {
        if (!hasSignaledReady.current) {
            frameCount.current++;
            if (frameCount.current >= FRAMES_TO_WAIT) {
                hasSignaledReady.current = true;
                onReady?.();
            }
        }

        // 1. Camera Animation (Simple Lerp)
        // Animate even if !showRoom to allow exit transition
        if (hasAnimatedDown.current) {
            const lerpSpeed = delta * CAMERA_SETTINGS.lerpSpeed;

            if (isExiting || hasExitTriggered.current) {
                // EXIT MODE:
                // 1. Reset X (look up/forward) and Z (tilt) to 0
                camera.rotation.x = THREE.MathUtils.lerp(camera.rotation.x, 0, lerpSpeed);
                camera.rotation.z = THREE.MathUtils.lerp(camera.rotation.z, 0, lerpSpeed);

                // 2. DO NOT TOUCH Y!
                // DoorSection controls Y during exit (turning back to corridor)
                // If we lerp Y here, we fight the DoorSection animation
            } else {
                // NORMAL MODE:
                camera.rotation.x = THREE.MathUtils.lerp(camera.rotation.x, targetRotX.current, lerpSpeed);
                camera.rotation.y = THREE.MathUtils.lerp(camera.rotation.y, targetRotY.current, lerpSpeed);
                camera.rotation.z = THREE.MathUtils.lerp(camera.rotation.z, targetRotZ.current, lerpSpeed);
            }
        }

        // 2. Wave Animation
        const time = state.clock.getElapsedTime();
        waveRefs.current.forEach((ref, i) => {
            if (ref) {
                const speed = 0.8 + i * 0.15;
                const amplitude = 0.15 - i * 0.02;
                const offset = i * 0.5;
                ref.position.y = Math.sin(time * speed + offset) * amplitude;
            }
        });

        // 3. Bottle Cap Animation (lift up)
        if (isCapAnimating && bottleCapRef.current) {
            // Increase progress
            if (capProgress.current < 1) {
                capProgress.current = Math.min(1, capProgress.current + delta * 0.6);
            }

            // Easing for smooth motion
            const t = capProgress.current;
            const eased = 1 - Math.pow(1 - t, 3); // ease out cubic

            // Just lift cap up gently (Y in local space since bottle is rotated)
            bottleCapRef.current.position.y = eased * 0.5; // Lift up
        }

        // 4. Bottle Cap Closing Animation (after paper is inserted)
        if (isCapClosing && bottleCapRef.current) {
            // Increase progress
            if (capCloseProgress.current < 1) {
                capCloseProgress.current = Math.min(1, capCloseProgress.current + delta * 0.8);
            }

            // Easing for smooth motion
            const t = capCloseProgress.current;
            const eased = 1 - Math.pow(1 - t, 3); // ease out cubic

            // Move cap back down from 0.5 to 0 (reverse of opening)
            bottleCapRef.current.position.y = 0.5 * (1 - eased); // Close cap

            // Start writing animation when cap is fully closed
            if (capCloseProgress.current >= 1 && !isWriting && emailUsername) {
                setIsWriting(true);
                writingProgress.current = 0;
            }
        }

        // 5. Writing Animation (typewriter effect on bottle paper)
        if (isWriting && emailUsername) {
            writingProgress.current += delta * 3; // Speed of writing

            // Calculate how many characters to show
            const charsToShow = Math.min(
                Math.floor(writingProgress.current),
                emailUsername.length
            );

            setDisplayedText(emailUsername.slice(0, charsToShow));
        }
    });

    // Handler for when paper fold completes
    const handleFoldComplete = useCallback(() => {
        console.log('📜 Paper fold complete - starting cap animation');
        setIsCapAnimating(true);
        capProgress.current = 0;
    }, []);

    // Handler for when paper is inserted into bottle
    const handleInsertComplete = useCallback(() => {
        console.log('🍾 Paper inserted - closing cap');
        setIsCapClosing(true);
        capCloseProgress.current = 0;
    }, []);

    return (
        <group position={[0, -0.7, -5]}>
            {/* ============================================
                🌅 SKY BACKDROP
            ============================================ */}
            <mesh position={[0, 10, -50]}>
                <planeGeometry args={[150, 80]} />
                <meshBasicMaterial color="#e8e8e8" side={THREE.DoubleSide} />
            </mesh>

            {/* ============================================
                🌊 OCEAN WAVE LAYERS
            ============================================ */}
            <group position={[0, -1, -8]}>
                {Array.from({ length: WAVE_LAYERS }).map((_, i) => (
                    <mesh
                        key={i}
                        ref={el => waveRefs.current[i] = el}
                        position={[0, -i * 0.1, -i * 8]} // Spread out vertically
                        rotation={[-Math.PI / 2.5, 0, 0]}
                    >
                        <planeGeometry args={[80, 30]} />
                        <meshBasicMaterial
                            map={seaTexture}
                            color="#ffffff"
                            transparent={true}
                            opacity={1 - i * 0.1}
                            side={THREE.DoubleSide}
                            toneMapped={false}
                        />
                    </mesh>
                ))}
            </group>

            {/* ============================================
                🏖️ DOCK / MOLO
                Now a flat plane to remove the "block" underneath
            ============================================ */}
            <mesh
                position={[0, 0.05, 1.8]} // Slightly above water
                rotation={[-Math.PI / 2, 0, 0]} // Rotate to be flat
            >
                <planeGeometry args={[2.5, 7]} />
                <meshStandardMaterial
                    map={moloTexture}
                    color="#ffffff"
                    roughness={0.8}
                    side={THREE.DoubleSide} // Ensure visible from below if needed (e.g. reflection)
                    transparent
                />
            </mesh>

            {/* ============================================
                📜 INTERACTIVE MESSAGE PAPER
                Always visible (form UI hides during fold animation)
            ============================================ */}
            <MessagePaper
                position={[0, 0.07, 2]} // Raised slightly to avoid flickering with the dock (z-fighting)
                onSend={(data) => {
                    console.log('📬 Contact form submitted:', data);
                    // Extract username from email (part before @)
                    if (data.email) {
                        const username = data.email.split('@')[0];
                        setEmailUsername(username);
                        console.log('📧 Email username for writing:', username);
                    }
                }}
                onFoldComplete={handleFoldComplete}
                onInsertComplete={handleInsertComplete}
            />

            {/* ============================================
                🍾 BOTTLE - Assembled from layers
                Layers: Paper (inside) -> Body (glass) -> Cap (top)
            ============================================ */}
            <group
                ref={bottleRef}
                position={[0.8, 0.15, 2.5]} // Raised to 0.12 to be above paper (at 0.07)
                rotation={[-Math.PI / 2, 0, -Math.PI / 2]} // Lying on side, rotated -90 deg to flip vertical orientation 
            >
                {/* 1. PAPER IN BOTTLE (Bottom layer - behind glass) */}
                <mesh position={[0, -0.01, 0.02]}>
                    <planeGeometry args={[1.5, 1.0]} />
                    <meshStandardMaterial
                        map={bottlePaper}
                        transparent
                        side={THREE.DoubleSide}
                        roughness={0.8} // Paper is rough
                    />
                </mesh>

                {/* 2. BOTTLE BODY (Middle layer - glass) */}
                <mesh position={[0, 0, 0]}>
                    <planeGeometry args={[1.5, 1.0]} />
                    <meshStandardMaterial
                        map={bottleBody}
                        transparent
                        opacity={0.8} // Semi-transparent glass
                        side={THREE.DoubleSide}
                        roughness={0.2} // Glass is smooth/shiny
                        metalness={0.1}
                    />
                </mesh>

                {/* 3. BOTTLE CAP (Top layer - in front) */}
                <mesh ref={bottleCapRef} position={[0, 0, 0.001]}>
                    <planeGeometry args={[1.5, 1.0]} />
                    <meshStandardMaterial
                        map={bottleCap}
                        transparent
                        side={THREE.DoubleSide}
                        roughness={0.4} // Plastic/Metal cap
                    />
                </mesh>

                {/* 4. ANIMATED TEXT on paper in bottle (handwriting effect) */}
                {displayedText && (
                    <Text
                        position={[0, 0.15, 0.025]} // Positioned on the paper inside bottle
                        fontSize={0.08}
                        color="#1a1a1a"
                        font="/fonts/CabinSketch-Regular.ttf" // Handwriting-style font
                        anchorX="center"
                        anchorY="middle"
                        maxWidth={0.8}
                    >
                        {displayedText}
                    </Text>
                )}
            </group>

            {/* ============================================
                📍 DEBUG - Current phase indicator
            ============================================ */}
            <Text
                position={[0, 2, 0]}
                fontSize={0.15}
                color="#333333"
                anchorX="center"
            >
                Phase: {currentPhase}
            </Text>
        </group>
    );
};

export default ContactRoom;
