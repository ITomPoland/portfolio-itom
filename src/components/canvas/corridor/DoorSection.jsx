import { useRef, useState, useCallback, useEffect, useMemo } from 'react';
import { useFrame, useThree } from '@react-three/fiber';
import { Text, useTexture } from '@react-three/drei';
import * as THREE from 'three';
import gsap from 'gsap';

// Constants from CorridorSegment
const WALL_X_OUTER = 3.5;
const WALL_X_INNER = 1.7;
const DOOR_Z_SPAN = 4;
const CORRIDOR_HEIGHT = 3.5;

// Calculate sawtooth wall geometry
const WALL_DX = WALL_X_OUTER - WALL_X_INNER; // 1.8
const WALL_DZ = DOOR_Z_SPAN; // 4
const WALL_LENGTH = Math.sqrt(WALL_DX * WALL_DX + WALL_DZ * WALL_DZ);
const BASE_WALL_ANGLE = Math.atan2(WALL_DX, WALL_DZ); // Sawtooth angle (~24 degrees)

// Door texture mapping - maps label to texture file
const DOOR_TEXTURES = {
    'THE GALLERY': '/textures/corridor/doors/drzwiprojekty.png',
    'THE STUDIO': '/textures/corridor/doors/drzwisocial.png',
    'DEV DIARY': '/textures/corridor/doors/drzwiabout.png',
    "LET'S CONNECT": '/textures/corridor/doors/drzwikontakt.png',
};

/**
 * DoorSection Component
 * 
 * Groups the angled wall + door + label as one unit.
 * Uses 2D textures for door, frame, and handle (like entrance doors).
 * Pivots from the OUTER edge (where wall connects to corridor).
 * Dynamic tilt: starts nearly flat, tilts more when camera approaches.
 */
const DoorSection = ({
    position, // [x, y, z] - center of the wall segment
    side = 'left',
    label,
    icon,
    onEnter,
    autoCloseDelay = 3000
}) => {
    const groupRef = useRef(); // Main group that tilts
    const doorRef = useRef();
    const handleRef = useRef();
    const [isHovered, setIsHovered] = useState(false);
    const [isOpen, setIsOpen] = useState(false);
    const [isAnimating, setIsAnimating] = useState(false);
    const [isNear, setIsNear] = useState(false);
    const { camera } = useThree();
    const closeTimerRef = useRef(null);

    // Dynamic tilt state
    const currentTilt = useRef(0);

    // Load wall texture
    const wallTexture = useTexture('/textures/corridor/wall_texture.webp');
    wallTexture.wrapS = wallTexture.wrapT = THREE.RepeatWrapping;
    wallTexture.repeat.set(WALL_LENGTH / 2, CORRIDOR_HEIGHT / 2);

    // Load door textures - use the right texture based on label
    const doorTexturePath = DOOR_TEXTURES[label] || DOOR_TEXTURES['THE GALLERY'];
    const doorTexture = useTexture(doorTexturePath);
    const frameTexture = useTexture('/textures/corridor/doors/ramkasingledoors.png');
    const handleTexture = useTexture('/textures/corridor/doors/klamkadodrzwi.png');
    const doorBackTexture = useTexture('/textures/corridor/doors/backsingledoors.png');

    // Door dimensions - based on texture aspect ratio (door texture ~1:2.5)
    const doorWidth = 1.13;
    const doorHeight = 2.5;

    // Frame dimensions - slightly larger than door
    const frameWidth = 1.35;
    const frameHeight = 2.5;

    // Hole dimensions - MUST fit inside wall (height 3.5, bottom at -1.75)
    // Previous hole went to -1.775 which broke geometry. New range: [-1.7, 0.6]
    const holeWidth = 1.1;
    const holeHeight = 2.4;
    const holeOffsetY = -0.55; // Same as door group Y offset

    // Create wall geometry with door hole
    const wallWithHoleGeometry = useMemo(() => {
        // Create wall shape
        const wallShape = new THREE.Shape();
        const halfW = WALL_LENGTH / 2;
        const halfH = CORRIDOR_HEIGHT / 2;

        wallShape.moveTo(-halfW, -halfH);
        wallShape.lineTo(halfW, -halfH);
        wallShape.lineTo(halfW, halfH);
        wallShape.lineTo(-halfW, halfH);
        wallShape.lineTo(-halfW, -halfH);

        // Create hole for door
        const holePath = new THREE.Path();
        const holeHalfW = holeWidth / 2;
        const holeHalfH = holeHeight / 2;
        const holeY = holeOffsetY; // Center of hole

        holePath.moveTo(-holeHalfW, holeY - holeHalfH);
        holePath.lineTo(holeHalfW, holeY - holeHalfH);
        holePath.lineTo(holeHalfW, holeY + holeHalfH);
        holePath.lineTo(-holeHalfW, holeY + holeHalfH);
        holePath.lineTo(-holeHalfW, holeY + holeHalfH);
        holePath.lineTo(-holeHalfW, holeY - holeHalfH);

        wallShape.holes.push(holePath);

        return new THREE.ShapeGeometry(wallShape);
    }, [holeWidth, holeHeight, holeOffsetY]);

    // Tilt parameters
    const BASE_ROTATION = Math.PI / 2; // 90 degrees - side wall orientation
    const BASE_TILT = 0.02;   // ~1 degree additional tilt towards camera
    const MAX_TILT = BASE_WALL_ANGLE + 0.1; // Sawtooth angle + extra (~27 degrees total tilt)
    const TILT_START = 15;    // Start tilting when camera is 15 units away
    const TILT_PEAK = 3;      // Max tilt at 3 units

    // Pivot offset - the group pivots from the OUTER edge
    const pivotX = side === 'left' ? -WALL_X_OUTER : WALL_X_OUTER;

    // Wall offset from pivot - wall extends FROM pivot INWARD
    const wallOffsetX = side === 'left'
        ? WALL_LENGTH / 2
        : -WALL_LENGTH / 2;

    useFrame(() => {
        if (!groupRef.current) return;

        const distance = Math.abs(camera.position.z - position[2]);
        const near = distance < 8;
        if (near !== isNear) {
            setIsNear(near);
        }

        let targetTilt = BASE_TILT;

        if (distance < TILT_START && distance > TILT_PEAK) {
            const t = (TILT_START - distance) / (TILT_START - TILT_PEAK);
            const easedT = t * (2 - t); // easeOutQuad
            targetTilt = BASE_TILT + (MAX_TILT - BASE_TILT) * easedT;
        } else if (distance <= TILT_PEAK) {
            targetTilt = MAX_TILT;
        }

        // Smooth interpolation
        currentTilt.current = THREE.MathUtils.lerp(currentTilt.current, targetTilt, 0.06);

        // Apply rotation: BASE_ROTATION (90°) + dynamic tilt
        const baseDir = side === 'left' ? 1 : -1;
        const tiltDir = side === 'left' ? -1 : 1;

        // Calculate the actual rotation angle
        const currentRotation = (BASE_ROTATION * baseDir) + (currentTilt.current * tiltDir);
        groupRef.current.rotation.y = currentRotation;

        // Trigonometric Scaling Fix:
        // We want the Z-projection of the wall to ALWAYS be exactly DOOR_Z_SPAN (4.0m).
        // Formula: Scale = DOOR_Z_SPAN / (WALL_LENGTH * sin(Angle))

        const absSinAngle = Math.abs(Math.sin(currentRotation));

        // Safety to prevent division by zero (angle is clamped ~60-90 deg)
        let exactScale = 1.0;
        if (absSinAngle > 0.1) {
            // -0.01 safety margin to prevent Z-fighting on the exact edge
            exactScale = (DOOR_Z_SPAN - 0.01) / (WALL_LENGTH * absSinAngle);
        }

        // Clamp scale to avoid explosion if math goes wrong, but allow gentle flex
        const currentScale = THREE.MathUtils.clamp(exactScale, 0.8, 1.1);

        groupRef.current.scale.set(currentScale, 1, 1);
    });

    useEffect(() => {
        return () => {
            if (closeTimerRef.current) clearTimeout(closeTimerRef.current);
        };
    }, []);

    const handleClick = useCallback((e) => {
        e.stopPropagation();
        if (isAnimating) return;

        if (isOpen) {
            closeDoor();
            return;
        }

        setIsAnimating(true);

        const doorWorldPos = new THREE.Vector3();
        groupRef.current.getWorldPosition(doorWorldPos);

        const cameraTargetZ = doorWorldPos.z + 2.5;
        const cameraTargetX = side === 'left' ? -0.3 : 0.3;

        gsap.to(camera.position, {
            x: cameraTargetX,
            z: cameraTargetZ,
            duration: 1.0,
            ease: 'power2.inOut',
            onComplete: () => openDoor()
        });
    }, [camera, side, isOpen, isAnimating]);

    const openDoor = useCallback(() => {
        if (!doorRef.current) return;

        setIsOpen(true);
        const openAngle = side === 'left' ? Math.PI * 0.6 : -Math.PI * 0.6;

        // Animate handle down first
        if (handleRef.current) {
            gsap.to(handleRef.current.rotation, {
                z: side === 'left' ? 0.4 : -0.4,
                duration: 0.15,
                ease: 'power2.out'
            });
        }

        gsap.to(doorRef.current.rotation, {
            y: openAngle,
            duration: 0.7,
            ease: 'power2.out',
            onComplete: () => {
                setIsAnimating(false);
                onEnter?.();
                closeTimerRef.current = setTimeout(() => closeDoor(), autoCloseDelay);
            }
        });
    }, [side, onEnter, autoCloseDelay]);

    const closeDoor = useCallback(() => {
        if (!doorRef.current || !isOpen) return;
        if (closeTimerRef.current) clearTimeout(closeTimerRef.current);

        setIsAnimating(true);

        // Reset handle
        if (handleRef.current) {
            gsap.to(handleRef.current.rotation, {
                z: 0,
                duration: 0.2,
                ease: 'power2.out'
            });
        }

        gsap.to(doorRef.current.rotation, {
            y: 0,
            duration: 0.6,
            ease: 'power2.in',
            onComplete: () => {
                setIsOpen(false);
                setIsAnimating(false);
            }
        });
    }, [isOpen]);

    // Handle hover effects
    const handlePointerEnter = () => {
        if (isOpen || isAnimating) return;
        setIsHovered(true);
        document.body.style.cursor = 'pointer';

        // Slightly open door on hover
        if (doorRef.current) {
            gsap.to(doorRef.current.rotation, {
                y: side === 'left' ? 0.15 : -0.15,
                duration: 0.3,
                ease: 'power2.out'
            });
        }

        // Slightly rotate handle on hover
        if (handleRef.current) {
            gsap.to(handleRef.current.rotation, {
                z: side === 'left' ? 0.1 : -0.1,
                duration: 0.2,
                ease: 'power2.out'
            });
        }
    };

    const handlePointerLeave = () => {
        if (isOpen || isAnimating) return;
        setIsHovered(false);
        document.body.style.cursor = 'auto';

        // Close door
        if (doorRef.current) {
            gsap.to(doorRef.current.rotation, {
                y: 0,
                duration: 0.3,
                ease: 'power2.out'
            });
        }

        // Reset handle
        if (handleRef.current) {
            gsap.to(handleRef.current.rotation, {
                z: 0,
                duration: 0.2,
                ease: 'power2.out'
            });
        }
    };

    // Door pivot position - hinges on the side
    const doorPivotX = side === 'left' ? -doorWidth / 2 : doorWidth / 2;
    const doorMeshX = side === 'left' ? doorWidth / 2 : -doorWidth / 2;

    // Handle position on door (based on texture - handle is on the right side for left doors)
    const handlePivotX = side === 'left' ? doorWidth * 0.25 : -doorWidth * 0.25;

    return (
        // Outer group at pivot position (outer edge of wall)
        <group position={[pivotX, position[1], position[2]]}>
            {/* Inner group that rotates - contains wall + door */}
            <group ref={groupRef}>
                {/* Wall segment with door hole */}
                <mesh position={[wallOffsetX, 0, 0]} geometry={wallWithHoleGeometry}>
                    <meshStandardMaterial map={wallTexture} roughness={1} metalness={0} side={THREE.DoubleSide} />
                </mesh>

                {/* Door and frame - centered on wall */}
                <group position={[wallOffsetX, -0.4, 0]}>
                    {/* === FLOATING LABEL === */}
                    <group position={[0, doorHeight / 2 + 0.5, 0.1]}>
                        <mesh position={[0, 0, -0.02]}>
                            <planeGeometry args={[label.length * 0.08 + 0.35, 0.3]} />
                            <meshBasicMaterial color="#1a1a1a" />
                        </mesh>
                        <mesh position={[0, 0, -0.01]}>
                            <planeGeometry args={[label.length * 0.08 + 0.3, 0.25]} />
                            <meshBasicMaterial color="#ffffff" />
                        </mesh>
                        <Text
                            position={[0, 0, 0.01]}
                            fontSize={0.12}
                            color="#1a1a1a"
                            anchorX="center"
                            anchorY="middle"
                        >
                            {icon} {label}
                        </Text>
                    </group>

                    {/* === DOOR FRAME (textured) === */}
                    {/* Moved to Z = 0.02 to sit ON TOP of the wall, hiding the hole edges */}
                    <mesh position={[0, -0.1, 0.02]} scale={[side === 'right' ? -1 : 1, 1, 1]}>
                        <planeGeometry args={[frameWidth, frameHeight]} />
                        <meshStandardMaterial
                            map={frameTexture}
                            transparent={true}
                            alphaTest={0.1}
                            roughness={0.9}
                        />
                    </mesh>

                    {/* === DOOR INTERIOR (Backing Volume) === */}
                    <mesh position={[0, -0.149, -1.0]} rotation={[0, 0, 0]}>
                        <boxGeometry args={[frameWidth - 0.1, frameHeight - 0.1, 2]} />
                        <meshStandardMaterial
                            color="#f5f5f5"
                            roughness={0.9}
                            side={THREE.BackSide} /* Render inside of box */
                        />
                    </mesh>

                    {/* === DOOR PANEL (pivots for opening) === */}
                    {/* Pivot Z at 0.01 to be slightly behind frame but in front of wall if needed, or just flush */}
                    <group ref={doorRef} position={[doorPivotX, 0, 0.01]}>
                        {/* Door Front Texture */}
                        <mesh
                            position={[doorMeshX, -0.2, 0]}
                            scale={[side === 'right' ? -1 : 1, 1, 1]}
                            onClick={handleClick}
                            onPointerEnter={handlePointerEnter}
                            onPointerLeave={handlePointerLeave}
                        >
                            <planeGeometry args={[doorWidth, doorHeight]} />
                            <meshStandardMaterial
                                map={doorTexture}
                                transparent={true}
                                alphaTest={0.1}
                                roughness={0.8}
                            />
                        </mesh>

                        {/* Door Back Texture */}
                        <mesh
                            position={[doorMeshX, -0.2, -0.01]}
                            rotation={[0, Math.PI, 0]}
                            scale={[side === 'right' ? -1 : 1, 1, 1]}
                        >
                            <planeGeometry args={[doorWidth, doorHeight]} />
                            <meshStandardMaterial
                                map={doorBackTexture}
                                transparent={true}
                                alphaTest={0.1}
                                roughness={0.8}
                                side={THREE.DoubleSide}
                            />
                        </mesh>

                        {/* Handle Layer - pivot at screw position */}
                        <group ref={handleRef} position={[doorMeshX + (side === 'left' ? 0.45 : -0.45), -0.29, 0.03]}>
                            <mesh position={[side === 'left' ? -0.50 : 0.50, 0.14, 0]} scale={[side === 'right' ? -1 : 1, 1, 1]}>
                                <planeGeometry args={[doorWidth, doorHeight]} />
                                <meshStandardMaterial
                                    map={handleTexture}
                                    transparent={true}
                                    alphaTest={0.1}
                                    depthWrite={false}
                                />
                            </mesh>
                        </group>
                    </group>
                </group>
            </group>
        </group>
    );
};

export default DoorSection;
