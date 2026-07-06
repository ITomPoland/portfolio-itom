import { useRef, useState, useEffect } from 'react';
import { useFrame, useThree } from '@react-three/fiber';
import { Text, PositionalAudio } from '@react-three/drei';
import * as THREE from 'three';
import PaperAirplane from './PaperAirplane';
import InfiniteSkyManager from './InfiniteSkyManager';
import StoryMilestone from './StoryMilestone';
import { useScene } from '../../../../context/SceneContext';
import { useAchievements } from '../../../../context/AchievementsContext';
import { useAudio } from '../../../../context/AudioManager';

// Chunk length for looping flight effect (matches SkyChunk)
const CHUNK_LENGTH = 40;

// ============================================
// ⚙️ AUDIO SETTINGS - TWEAK HERE
// Edytuj te wartości, aby zmienić głośność i zasięg słyszalności szumu wiatru
// ============================================
export const AUDIO_SETTINGS = {
    volume: 2.5,
    distance: 2,
    rolloff: 0.8
};

// Story sections - positions define where each milestone appears
// Using CHUNK_LENGTH to create looping story (every ~40 units restarts)
const STORY_MILESTONES = [
    { id: 'intro', position: [0, 0, -15], type: 'intro', title: 'HAKKILO', subtitle: '< studio immersif />' },
    { id: 'awards', position: [0, 0, -55], type: 'awards', title: 'EXPERTISE', subtitle: 'VR • AR • 3D temps réel' },
    { id: 'journey', position: [0, 0, -95], type: 'journey', title: 'PARCOURS', subtitle: 'Studio XR basé en Afrique' },
    { id: 'skills', position: [0, 0, -135], type: 'skills', title: 'STACK', subtitle: 'React • Three.js • WebXR • GSAP' },
];

const AboutRoom = ({ showRoom, onReady, isExiting, isWarmup }) => {
    const { camera } = useThree();
    const { isTeleporting, overlayContent } = useScene();
    const { showTutorial, unlockAchievement, hidePopup } = useAchievements();
    const { globalVolume, isMuted } = useAudio();
    const effectiveVolume = isMuted ? 0 : AUDIO_SETTINGS.volume * globalVolume;

    const audioRef = useRef();
    useEffect(() => {
        if (audioRef.current && audioRef.current.setVolume) {
            audioRef.current.setVolume(effectiveVolume);
        }
    }, [effectiveVolume]);

    // Use ref to track overlay state for event listeners (avoids stale closures)
    const overlayRef = useRef(overlayContent);
    useEffect(() => {
        overlayRef.current = overlayContent;
    }, [overlayContent]);

    useEffect(() => {
        if (isExiting || isTeleporting) {
            hidePopup();
        }
    }, [isExiting, isTeleporting, hidePopup]);

    // Track if we've signaled ready
    const hasSignaledReady = useRef(false);
    const frameCount = useRef(0);
    const FRAMES_TO_WAIT = 25;

    // Momentum-based scroll state
    const scrollPosition = useRef(0);
    const scrollVelocity = useRef(0);

    // Save base camera rotation on first render
    const baseCameraRotation = useRef({ x: 0, y: 0, z: 0 });
    const isFlightActive = useRef(false);

    // Smoothed flight effect values
    const currentBank = useRef(0);
    const currentPitch = useRef(0);

    // Ref for the entire room to manage frustum culling
    const roomRef = useRef();
    const airplaneGroupRef = useRef();

    // Reset camera rotation when teleporting starts
    useEffect(() => {
        if (isTeleporting) {
            // Reset flight effect to prevent tilted camera after teleport
            currentBank.current = 0;
            currentPitch.current = 0;
            isFlightActive.current = false;
            baseCameraRotation.current = { x: 0, y: 0, z: 0 };
            scrollPosition.current = 0;
            scrollVelocity.current = 0;
        }
    }, [isTeleporting]);

    // Ready detection + flight animation
    useFrame((state, delta) => {
        if (!hasSignaledReady.current) {
            // Force rendering of all objects (even outside frustum) to compile shaders
            if (roomRef.current) {
                roomRef.current.traverse((child) => {
                    if (child.isMesh) child.frustumCulled = false;
                });
            }

            frameCount.current++;
            if (frameCount.current >= FRAMES_TO_WAIT) {
                // Restore frustum culling for performance
                if (roomRef.current) {
                    roomRef.current.traverse((child) => {
                        if (child.isMesh) child.frustumCulled = true;
                    });
                }

                hasSignaledReady.current = true;
                onReady?.();
                // trigger achievement hint when showing the room
                if (!isTeleporting && !isExiting) {
                    if (!isWarmup) setTimeout(() => showTutorial('about_fly'), 2000);
                }
            }
        }

        // === TELEPORTING: Stop all camera control ===
        // TeleportRoom handles camera position/rotation during teleport
        if (isTeleporting) {
            return;
        }

        // Apply velocity to position (momentum)
        scrollPosition.current += scrollVelocity.current * delta * 60;
        // No clamp - allow flying backward too!

        // Friction
        scrollVelocity.current *= 0.95;
        if (Math.abs(scrollVelocity.current) < 0.001) {
            scrollVelocity.current = 0;
        }

        // Unlock achievement if user scrolled enough
        if (scrollPosition.current > 15) {
            unlockAchievement('about_fly');
        }

        // === EXITING: Disable control completely ===
        // DoorSection handles the exit animation (position + rotation)
        // We must STOP touching the camera to avoid conflicts/snapping
        if (isExiting) {
            return;
        }

        // === FLIGHT EFFECT (camera rotation only) ===
        // Activate flight only after first scroll
        if (!isFlightActive.current && scrollPosition.current > 0.5) {
            isFlightActive.current = true;
            baseCameraRotation.current = {
                x: camera.rotation.x,
                y: camera.rotation.y,
                z: camera.rotation.z
            };
        }

        if (isFlightActive.current) {
            // Get position within current chunk (0 to 1)
            const chunkProgress = (scrollPosition.current % CHUNK_LENGTH) / CHUNK_LENGTH;

            // Flight maneuver pattern - loops back to start at each chunk
            // Slow down the start: if chunkProgress is small, multiply by a curve
            let bankAngle = Math.sin(chunkProgress * Math.PI * 2) * 0.12;
            let pitchAngle = Math.sin(chunkProgress * Math.PI * 4) * 0.05;

            // Ease in the flight effect during the first few units
            const flightProgress = Math.min(1, (scrollPosition.current - 0.5) / 5.0);
            bankAngle *= flightProgress;
            pitchAngle *= flightProgress;

            // Smooth lerp
            const lerpSpeed = 1 - Math.pow(0.02, delta);
            currentBank.current = THREE.MathUtils.lerp(currentBank.current, bankAngle, lerpSpeed);
            currentPitch.current = THREE.MathUtils.lerp(currentPitch.current, pitchAngle, lerpSpeed);

            // Apply to camera (base + effect)
            camera.rotation.x = baseCameraRotation.current.x + currentPitch.current;
            camera.rotation.z = baseCameraRotation.current.z + currentBank.current;
        } else {
            // Unconditionally keep these zero before flight active
            currentBank.current = 0;
            currentPitch.current = 0;
        }

        // Apply to airplane unconditionally so it stays properly aligned
        // When pitch is 0, rotation.x is 0.1
        // When bank is 0, rotation.z is 0
        if (airplaneGroupRef.current) {
            airplaneGroupRef.current.rotation.x = currentPitch.current * 3 + 0.1;
            airplaneGroupRef.current.rotation.z = -currentBank.current * 2;
        }
    });

    // Handle scroll wheel (desktop)
    useEffect(() => {
        const handleWheel = (e) => {
            if (overlayRef.current) return; // BLOCK SCROLL IF OVERLAY IS OPEN
            scrollVelocity.current += e.deltaY * 0.002;
        };

        window.addEventListener('wheel', handleWheel, { passive: true });
        return () => window.removeEventListener('wheel', handleWheel);
    }, []);

    // Handle touch (mobile) - vertical swipe = scroll
    const lastTouchY = useRef(0);
    useEffect(() => {
        const handleTouchStart = (e) => {
            if (e.touches.length === 1) {
                lastTouchY.current = e.touches[0].clientY;
            }
        };

        const handleTouchMove = (e) => {
            if (overlayRef.current) return; // BLOCK SCROLL IF OVERLAY IS OPEN
            if (e.touches.length === 1) {
                const deltaY = lastTouchY.current - e.touches[0].clientY;
                lastTouchY.current = e.touches[0].clientY;
                // Convert touch movement to scroll velocity
                scrollVelocity.current += deltaY * 0.005;
            }
        };

        window.addEventListener('touchstart', handleTouchStart, { passive: true });
        window.addEventListener('touchmove', handleTouchMove, { passive: true });
        return () => {
            window.removeEventListener('touchstart', handleTouchStart);
            window.removeEventListener('touchmove', handleTouchMove);
        };
    }, []);

    return (
        <group ref={roomRef} position={[0, 0, -25]}>
            {!isWarmup && (
                <PositionalAudio
                    ref={audioRef}
                    url="/sounds/szumwiatru.mp3"
                    distanceModel="exponential"
                    refDistance={AUDIO_SETTINGS.distance}
                    rolloffFactor={AUDIO_SETTINGS.rolloff}
                    loop
                    autoplay
                    volume={effectiveVolume}
                />
            )}

            {/* === PAPER AIRPLANE (follows camera maneuvers) === */}
            <group ref={airplaneGroupRef} position={[0, -0.3, 1]}>
                <PaperAirplane
                    scale={0.8}
                    color="#faf8f5"
                />
            </group>

            {/* === INFINITE SKY WITH CLOUDS + STORY MILESTONES === */}
            <InfiniteSkyManager scrollProgressRef={scrollPosition} />

            {/* === SKY BACKDROP === */}
            <mesh position={[0, 0, -200]}>
                <planeGeometry args={[300, 150]} />
                <meshBasicMaterial color="#87CEEB" side={THREE.DoubleSide} />
            </mesh>
        </group>
    );
};

export default AboutRoom;
