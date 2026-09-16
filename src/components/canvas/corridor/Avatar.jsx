import { useRef, useState, useEffect } from 'react';
import { useFrame, useThree } from '@react-three/fiber';
import { useTexture } from '@react-three/drei';
import * as THREE from 'three';

/**
 * Avatar Component - Hand-drawn sketch style character
 * 
 * New sketchy avatar with WOW effects:
 * - Parallax depth effect on scroll
 * - Hand-drawn line style matching entrance
 * - Dodges when camera approaches
 * - Frame-by-frame animation (Boomerang effect: 1-6-1)
 */
const Avatar = ({ position = [10, -20, 30] }) => {
    const meshRef = useRef();
    const groupRef = useRef();
    const [dimensions, setDimensions] = useState({ width: 1.2, height: 2.4 });
    const { camera } = useThree();

    // Dodge state
    const dodgeX = useRef(0);
    const targetDodgeX = useRef(0);
    const worldPosVec = useRef(new THREE.Vector3());

    // --- FRAME-BY-FRAME ANIMATION (PING-PONG) ---
    const TOTAL_FRAMES = 9;
    const framePaths = Array.from({ length: TOTAL_FRAMES }, (_, i) => `/assets/corridor/avatar_anim/${i + 1}.webp`);

    // Load all texture frames
    const textures = useTexture(framePaths);

    // Animation control refs
    // start at index 0 (which refers to 1.webp)
    const currentFrame = useRef(0);
    const isReversing = useRef(false);
    const frameTimer = useRef(0);

    // Apply color space and calculate dimensions once
    useEffect(() => {
        textures.forEach(tex => tex.colorSpace = THREE.SRGBColorSpace);

        if (textures[0] && textures[0].image) {
            const aspectRatio = textures[0].image.width / textures[0].image.height;
            const baseHeight = 2.3; // Fixed size
            setDimensions({
                width: baseHeight * aspectRatio,
                height: baseHeight
            });
        }

        // Set initial texture to avoid white flash, but don't bind it declaratively 
        // to prevent React from overwriting our useFrame mutations
        if (meshRef.current && textures[currentFrame.current]) {
            meshRef.current.material.map = textures[currentFrame.current];
            meshRef.current.material.needsUpdate = true;
        }
    }, [textures]);

    // Main animation loop
    useFrame((state, delta) => {
        if (!groupRef.current || !meshRef.current) return;

        // === DODGE LOGIC ===
        groupRef.current.getWorldPosition(worldPosVec.current);
        const distance = camera.position.z - worldPosVec.current.z;

        const DODGE_START = 3;
        const DODGE_PEAK = 0;
        const DODGE_END = -2;
        const DODGE_AMOUNT = -1.5;

        if (distance > DODGE_PEAK && distance < DODGE_START) {
            const t = (DODGE_START - distance) / (DODGE_START - DODGE_PEAK);
            targetDodgeX.current = DODGE_AMOUNT * easeOutQuad(t);
        } else if (distance <= DODGE_PEAK && distance > DODGE_END) {
            const t = (distance - DODGE_END) / (DODGE_PEAK - DODGE_END);
            targetDodgeX.current = DODGE_AMOUNT * easeOutQuad(t);
        } else {
            targetDodgeX.current = 0;
        }

        dodgeX.current = THREE.MathUtils.lerp(dodgeX.current, targetDodgeX.current, 0.08);

        groupRef.current.position.x = position[0] + dodgeX.current;
        groupRef.current.position.y = position[1];

        // === FRAME ANIMATION LOGIC (PING-PONG) ===
        // Using delta for consistent speed regardless of monitor Hz
        const FPS = 5; // Slower, calmer ping-pong motion so the character does not feel twitchy
        const frameDuration = 1 / FPS;

        frameTimer.current += delta;

        if (frameTimer.current >= frameDuration) {
            frameTimer.current = 0; // Reset timer

            // Jesteśmy na ostatniej (od prawej)? To machamy do lewej
            if (currentFrame.current >= TOTAL_FRAMES - 1) {
                isReversing.current = true;
            }
            // Jesteśmy na indeksie 0 (czyli 1.webp)? To machamy z powrotem do prawej
            else if (currentFrame.current <= 0) {
                isReversing.current = false;
            }

            // Przejście klatki
            if (isReversing.current) {
                currentFrame.current -= 1;
            } else {
                currentFrame.current += 1;
            }

            // Zabezpieczenie przed błędem indeksu (nie schodzimy poniżej 0)
            const safeIndex = Math.max(0, Math.min(TOTAL_FRAMES - 1, currentFrame.current));

            // Aplikacja tekstury
            meshRef.current.material.map = textures[safeIndex];
            meshRef.current.material.needsUpdate = true;
        }
    });

    return (
        <group ref={groupRef} position={position}>
            <mesh ref={meshRef}>
                <planeGeometry args={[dimensions.width, dimensions.height]} />
                <meshBasicMaterial color="#ffffff"
                    transparent={true}
                    side={THREE.DoubleSide}
                    depthWrite={false}
                />
            </mesh>
        </group>
    );
};

// Easing function
const easeOutQuad = (t) => t * (2 - t);

export default Avatar;
