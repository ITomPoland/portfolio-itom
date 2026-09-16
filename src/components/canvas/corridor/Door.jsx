import { useRef, useState, useCallback, useEffect } from 'react';
import { useFrame, useThree } from '@react-three/fiber';
import { Plane, useTexture } from '@react-three/drei';
import Text from '../LocalText';
import * as THREE from 'three';
import gsap from 'gsap';
import { PositionalAudio } from '@react-three/drei';
import '../shaders/RevealMaterial'; // Registers alpha-discard reveal shader
import { useAudio } from '../../../../context/AudioManager';
import { isTouchDevice } from '../../../../utils/deviceDetect';

// Global settings for entrance doors audio
const ENTRANCE_DOOR_AUDIO_SETTINGS = {
    hoverVolume: 2.0, // Volume for "uchyleniedrzwi" (hovering the door)
    openVolume: 2.0,  // Volume for "otwarciedrzwi" (opening the door fully)
    distance: 3,      // Reference distance for spatial audio before it starts dropping off
    rolloff: 2        // How fast the sound fades away (exponential)
};

/**
 * Door Component - Enhanced with floating label and proximity glow
 */
const Door = ({
    position,
    side = 'left',
    rotationY = null, // Optional explicit rotation override
    label,
    icon,
    color = '#f5f0e6',
    onEnter,
    autoCloseDelay = 3000,
    type // Assuming 'type' is a new prop for texture selection
}) => {
    // Preload textures
    // Texture Loader Hook MUST be called indiscriminately to keep React Hooks consistent
    const textureMap = useTexture(`/textures/corridor/doors/drzwi${type}.webp`);
    const isTouch = isTouchDevice();
    const dummyTex = 'data:image/gif;base64,R0lGODlhAQABAIAAAAAAAP///yH5BAEAAAAALAAAAAABAAEAAAIBRAA7';
    const paintedColorMap = useTexture(isTouch ? dummyTex : `/textures/corridor/doors/drzwi${type}_painted.webp`);
    // Frame
    const frameMap = useTexture(`/textures/corridor/doors/ramkasingledoors.webp`);

    const doorRef = useRef();
    const frameRef = useRef();
    const glowRef = useRef();
    const isHoveredRef = useRef(false);
    const isOpenRef = useRef(false);
    const isAnimatingRef = useRef(false);
    const isNearRef = useRef(false);
    const { camera } = useThree();
    const closeTimerRef = useRef(null);
    const { globalVolume, isMuted } = useAudio(); // Using globalVolume instead of play

    // Audio Refs for 3D positional sound
    const hoverAudioRef = useRef();
    const openAudioRef = useRef();

    const doorWidth = 1.2;
    const doorHeight = 2.2;
    const frameThickness = 0.1;

    // Check proximity for glow effect
    useFrame(() => {
        const distance = Math.abs(camera.position.z - position[2]);
        const near = distance < 8;
        if (near !== isNearRef.current) {
            isNearRef.current = near;
        }
    });

    useEffect(() => {
        return () => {
            if (closeTimerRef.current) clearTimeout(closeTimerRef.current);
        };
    }, []);

    const handleClick = useCallback((e) => {
        e.stopPropagation();
        if (isAnimatingRef.current) return;

        if (isOpenRef.current) {
            closeDoor();
            return;
        }

        isAnimatingRef.current = true;

        const doorWorldPos = new THREE.Vector3();
        frameRef.current.getWorldPosition(doorWorldPos);

        const cameraTargetZ = doorWorldPos.z + 2.5;
        const cameraTargetX = side === 'left' ? -0.3 : 0.3;

        gsap.to(camera.position, {
            x: cameraTargetX,
            z: cameraTargetZ,
            duration: 1.0,
            ease: 'power2.inOut',
            onComplete: () => openDoor()
        });
    }, [camera, side, openDoor, closeDoor]);

    const openDoor = useCallback(() => {
        if (!doorRef.current) return;

        isOpenRef.current = true;
        const openAngle = side === 'left' ? Math.PI * 0.6 : -Math.PI * 0.6;

        // console.log("[Door] Opening door, playing sound");
        // Play the door opening sound exactly when the animation starts
        if (openAudioRef.current) {
            const vol = isMuted ? 0 : ENTRANCE_DOOR_AUDIO_SETTINGS.openVolume * globalVolume;
            openAudioRef.current.setVolume(vol);
            if (openAudioRef.current.isPlaying) openAudioRef.current.stop();
            openAudioRef.current.play();
        }

        gsap.to(doorRef.current.rotation, {
            y: openAngle,
            duration: 0.7,
            ease: 'power2.out',
            onComplete: () => {
                isAnimatingRef.current = false;
                onEnter?.();
                closeTimerRef.current = setTimeout(() => closeDoor(), autoCloseDelay);
            }
        });
    }, [side, onEnter, autoCloseDelay]);

    const closeDoor = useCallback(() => {
        if (!doorRef.current || !isOpenRef.current) return;
        if (closeTimerRef.current) clearTimeout(closeTimerRef.current);

        isAnimatingRef.current = true;
        gsap.to(doorRef.current.rotation, {
            y: 0,
            duration: 0.6,
            ease: 'power2.in',
            onComplete: () => {
                isOpenRef.current = false;
                isAnimatingRef.current = false;
            }
        });
    }, []);

    useFrame(() => {
        if (doorRef.current && !isOpenRef.current && !isAnimatingRef.current) {
            const targetScale = isHoveredRef.current ? 1.02 : 1;
            doorRef.current.scale.x = THREE.MathUtils.lerp(doorRef.current.scale.x, targetScale, 0.1);
            doorRef.current.scale.y = THREE.MathUtils.lerp(doorRef.current.scale.y, targetScale, 0.1);
        }

        // Glow intensity based on proximity
        if (glowRef.current) {
            const targetOpacity = isNearRef.current ? 0.6 : 0.1;
            glowRef.current.material.opacity = THREE.MathUtils.lerp(
                glowRef.current.material.opacity,
                targetOpacity,
                0.08
            );
        }
    });

    const doorRotationY = rotationY !== null ? rotationY : (side === 'left' ? Math.PI / 2 : -Math.PI / 2);

    return (
        <group position={position} rotation={[0, doorRotationY, 0]} ref={frameRef}>
            {/* === FLOATING LABEL (always visible) === */}
            <group position={[0, doorHeight / 2 + 0.5, 0.3]}>
                {/* Label border (back layer) */}
                <mesh position={[0, 0, -0.02]}>
                    <planeGeometry args={[label.length * 0.08 + 0.35, 0.3]} />
                    <meshBasicMaterial color="#1a1a1a" />
                </mesh>

                {/* Label background (middle layer) */}
                <mesh position={[0, 0, -0.01]}>
                    <planeGeometry args={[label.length * 0.08 + 0.3, 0.25]} />
                    <meshBasicMaterial color="#e0e0e0" />
                </mesh>

                {/* Label text (front layer) */}
                <Text
                    position={[0, 0, 0.01]}
                    fontSize={0.12}
                    color="#1a1a1a"
                    anchorX="center"
                    anchorY="middle"
                    renderOrder={3}
                    depthOffset={-1}
                >
                    {icon} {label}
                </Text>

                {/* Arrow pointing down */}
                <Text
                    position={[0, -0.2, 0.01]}
                    fontSize={0.15}
                    color="#39FF14"
                    anchorX="center"
                    renderOrder={3}
                    depthOffset={-1}
                >
                    ▼
                </Text>
            </group>

            {/* Outline Glow (always visible but fades based on distance) */}
            <mesh position={[0, -0.2, -0.05]} rotation={[0, Math.PI, 0]}>
                <planeGeometry args={[doorWidth + 0.3, doorHeight + 0.3]} />
                <meshBasicMaterial
                    color="#e0e0e0"
                    transparent={true}
                    opacity={glowIntensity} // Dynamic opacity based on proximity
                    depthWrite={false}
                />
            </mesh>

            {/* SPATIAL AUDIO NODES (Attached slightly in front of the door) */}
            <PositionalAudio
                ref={hoverAudioRef}
                url="/sounds/uchyleniedrzwi.mp3"
                distanceModel="exponential"
                rolloffFactor={ENTRANCE_DOOR_AUDIO_SETTINGS.rolloff}
                refDistance={ENTRANCE_DOOR_AUDIO_SETTINGS.distance}
                loop={false}
            />
            <PositionalAudio
                ref={openAudioRef}
                url="/sounds/otwarciedrzwi.mp3"
                distanceModel="exponential"
                rolloffFactor={ENTRANCE_DOOR_AUDIO_SETTINGS.rolloff}
                refDistance={ENTRANCE_DOOR_AUDIO_SETTINGS.distance}
                loop={false}
            />

            {/* Door Frame */}
            <group>
                <mesh position={[0, doorHeight / 2 + frameThickness / 2, 0]}>
                    <boxGeometry args={[doorWidth + frameThickness * 2, frameThickness, 0.12]} />
                    <meshBasicMaterial color="#2a2a2a" />
                </mesh>
                <mesh position={[-(doorWidth / 2 + frameThickness / 2), 0, 0]}>
                    <boxGeometry args={[frameThickness, doorHeight, 0.12]} />
                    <meshBasicMaterial color="#2a2a2a" />
                </mesh>
                <mesh position={[doorWidth / 2 + frameThickness / 2, 0, 0]}>
                    <boxGeometry args={[frameThickness, doorHeight, 0.12]} />
                    <meshBasicMaterial color="#2a2a2a" />
                </mesh>
            </group>

            {/* Door Panel */}
            <group ref={doorRef} position={[side === 'left' ? -doorWidth / 2 : doorWidth / 2, 0, 0]}>
                <mesh
                    position={[side === 'left' ? doorWidth / 2 : -doorWidth / 2, 0, 0.02]}
                    onClick={handleClick}
                    onPointerEnter={(e) => {
                        e.stopPropagation();
                        if (!isHoveredRef.current && !isOpenRef.current) {
                            // console.log("[Door] Hovering door, playing sound");

                            if (hoverAudioRef.current && !isHoveredRef.current) {
                                const vol = isMuted ? 0 : ENTRANCE_DOOR_AUDIO_SETTINGS.hoverVolume * globalVolume;
                                hoverAudioRef.current.setVolume(vol);
                                
                                // Only play if AudioContext is already running to avoid console warnings
                                if (hoverAudioRef.current.isPlaying) hoverAudioRef.current.stop();
                                if (hoverAudioRef.current.context.state === 'running') {
                                    hoverAudioRef.current.play();
                                }
                            }
                        }
                        isHoveredRef.current = true;
                    }}
                    onPointerLeave={() => {
                        isHoveredRef.current = false;
                        if (hoverAudioRef.current && hoverAudioRef.current.isPlaying) {
                            hoverAudioRef.current.stop();
                        }
                    }}
                >
                    <planeGeometry args={[doorWidth, doorHeight]} />
                    {/* Only use base color since React state won't trigger standard material color change.
                        The scale effect on hover handles the feedback. */}
                    <meshBasicMaterial color={color} roughness={0.85} />
                </mesh>

                {/* Decorative panels */}
                <mesh position={[side === 'left' ? doorWidth / 2 : -doorWidth / 2, 0.4, 0.03]}>
                    <planeGeometry args={[doorWidth * 0.65, doorHeight * 0.3]} />
                    <meshBasicMaterial color="#e8e2d5" roughness={1} />
                </mesh>
                <mesh position={[side === 'left' ? doorWidth / 2 : -doorWidth / 2, -0.35, 0.03]}>
                    <planeGeometry args={[doorWidth * 0.65, doorHeight * 0.3]} />
                    <meshBasicMaterial color="#e8e2d5" roughness={1} />
                </mesh>

                {/* Handle */}
                <mesh position={[side === 'left' ? doorWidth * 0.85 : -doorWidth * 0.85, 0, 0.06]}>
                    <sphereGeometry args={[0.055, 12, 12]} />
                    <meshBasicMaterial color="#222" metalness={0.7} roughness={0.25} />
                </mesh>
            </group>
        </group>
    );
};

export default Door;
