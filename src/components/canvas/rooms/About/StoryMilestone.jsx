import { useRef, useMemo } from 'react';
import { useFrame, useThree } from '@react-three/fiber';
import { Text } from '@react-three/drei';
import * as THREE from 'three';

/**
 * StoryMilestone Component
 * 
 * A story section that appears in the sky during flight.
 * Fades in as you approach, fades out as you pass through.
 * Objects move TO camera (camera stays at z=0).
 */

// Fade distances (world Z position)
// Objects start far in -Z and move towards 0
const FADE_IN_START = -50;   // Start fading in
const FADE_IN_END = -25;     // Fully visible
const FADE_OUT_START = -8;   // Start fading out when close
const FADE_OUT_END = -2;     // Fully invisible

const StoryMilestone = ({
    position = [0, 0, -30],
    title = "TITLE",
    subtitle = "",
    type = "intro",  // intro, awards, journey, skills
    children
}) => {
    const groupRef = useRef();

    // Track opacity for smooth transitions
    const currentOpacity = useRef(0);

    // Refs for text materials
    const titleRef = useRef();
    const subtitleRef = useRef();
    const decorRef = useRef();
    const avatarRef = useRef();

    useFrame((state, delta) => {
        if (!groupRef.current) return;

        // Get world position of milestone
        const worldPos = new THREE.Vector3();
        groupRef.current.getWorldPosition(worldPos);

        // Objects move TOWARDS camera (camera is at z ~ 0)
        // worldPos.z goes from very negative (far) to positive (passed camera)
        const z = worldPos.z;

        // Calculate target opacity based on Z position
        let targetOpacity = 0;

        if (z < FADE_IN_START) {
            // Too far - not visible yet
            targetOpacity = 0;
        } else if (z >= FADE_IN_START && z <= FADE_IN_END) {
            // Fading in (approaching)
            const t = (z - FADE_IN_START) / (FADE_IN_END - FADE_IN_START);
            targetOpacity = t;
        } else if (z > FADE_IN_END && z < FADE_OUT_START) {
            // Fully visible (in the sweet spot)
            targetOpacity = 1;
        } else if (z >= FADE_OUT_START && z <= FADE_OUT_END) {
            // Fading out (very close, passing through)
            const t = 1 - (z - FADE_OUT_START) / (FADE_OUT_END - FADE_OUT_START);
            targetOpacity = t;
        } else {
            // Already passed - invisible
            targetOpacity = 0;
        }

        // Smooth lerp
        currentOpacity.current = THREE.MathUtils.lerp(
            currentOpacity.current,
            targetOpacity,
            1 - Math.pow(0.05, delta)
        );

        const opacity = currentOpacity.current;

        // Apply opacity to text elements
        if (titleRef.current) {
            titleRef.current.fillOpacity = opacity;
        }
        if (subtitleRef.current) {
            subtitleRef.current.fillOpacity = opacity;
        }
        if (decorRef.current) {
            decorRef.current.opacity = opacity * 0.3;
        }
        if (avatarRef.current) {
            avatarRef.current.opacity = opacity * 0.5;
        }

        // Scale effect - grow slightly as you approach
        const scale = 0.8 + opacity * 0.2;
        groupRef.current.scale.setScalar(scale);
    });

    // Type-specific styles
    const styles = useMemo(() => {
        switch (type) {
            case 'intro':
                return {
                    titleSize: 1.8,
                    titleColor: '#1a1a1a',
                    subtitleSize: 0.4,
                    subtitleColor: '#4a4a4a',
                    decorColor: '#e0e0e0'
                };
            case 'awards':
                return {
                    titleSize: 1.5,
                    titleColor: '#2a2a2a',
                    subtitleSize: 0.35,
                    subtitleColor: '#666666',
                    decorColor: '#ffd700'
                };
            case 'journey':
                return {
                    titleSize: 1.5,
                    titleColor: '#2a2a2a',
                    subtitleSize: 0.35,
                    subtitleColor: '#666666',
                    decorColor: '#87CEEB'
                };
            case 'skills':
                return {
                    titleSize: 1.5,
                    titleColor: '#2a2a2a',
                    subtitleSize: 0.35,
                    subtitleColor: '#666666',
                    decorColor: '#90EE90'
                };
            default:
                return {
                    titleSize: 1.5,
                    titleColor: '#2a2a2a',
                    subtitleSize: 0.35,
                    subtitleColor: '#666666',
                    decorColor: '#e0e0e0'
                };
        }
    }, [type]);

    return (
        <group ref={groupRef} position={position}>
            {/* Background decorative element */}
            <mesh position={[0, 0, 0.5]}>
                <planeGeometry args={[8, 5]} />
                <meshBasicMaterial
                    ref={decorRef}
                    color={styles.decorColor}
                    transparent
                    opacity={0}
                    side={THREE.DoubleSide}
                />
            </mesh>

            {/* Main title */}
            <Text
                ref={titleRef}
                position={[0, 0.5, 0]}
                fontSize={styles.titleSize}
                color={styles.titleColor}
                anchorX="center"
                anchorY="middle"
                font="/fonts/CabinSketch-Bold.ttf"
                fillOpacity={0}
            >
                {title}
            </Text>

            {/* Subtitle */}
            {subtitle && (
                <Text
                    ref={subtitleRef}
                    position={[0, -0.5, 0]}
                    fontSize={styles.subtitleSize}
                    color={styles.subtitleColor}
                    anchorX="center"
                    anchorY="middle"
                    font="/fonts/CabinSketch-Regular.ttf"
                    fillOpacity={0}
                >
                    {subtitle}
                </Text>
            )}

            {/* Avatar placeholder for INTRO */}
            {type === 'intro' && (
                <mesh position={[0, -1.5, 0]}>
                    <circleGeometry args={[0.8, 32]} />
                    <meshBasicMaterial
                        ref={avatarRef}
                        color="#cccccc"
                        transparent
                        opacity={0}
                        side={THREE.DoubleSide}
                    />
                </mesh>
            )}

            {/* Custom children content */}
            {children}
        </group>
    );
};

export default StoryMilestone;
