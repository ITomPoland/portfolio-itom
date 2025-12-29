import { useRef, useState, useMemo } from 'react';
import { useFrame, useThree } from '@react-three/fiber';
import { Text, useTexture } from '@react-three/drei';
import * as THREE from 'three';
import gsap from 'gsap';

// Use same font as App.jsx preload
const FONT_URL = 'https://fonts.gstatic.com/s/inter/v12/UcCO3FwrK3iLTeHuS_fvQtMwCp50KnMw2boKoduKmMEVuLyfAZ9hjp-Ek-_EeA.woff';



/**
 * EntranceDoors Component - 3D Entrance to the Corridor
 * 
 * Doors that open and camera flies through.
 * EmptyCorridor provides the surrounding corridor context.
 */
const EntranceDoors = ({
    position = [0, 0, 22],
    onComplete,
    corridorHeight = 8, // Taller wall
    corridorWidth = 15 // Wider wall
}) => {
    const leftDoorRef = useRef();
    const rightDoorRef = useRef();
    const leftHandleRef = useRef();
    const rightHandleRef = useRef();
    const groupRef = useRef();
    const [isOpen, setIsOpen] = useState(false);
    const [isHovered, setIsHovered] = useState(false);
    const [isAnimating, setIsAnimating] = useState(false);
    const { camera } = useThree();
    const frameTexture = useTexture('/textures/doors/frame_sketch.webp');
    const doorLeftTexture = useTexture('/textures/doors/door_left_sketch.webp');
    const doorRightTexture = useTexture('/textures/doors/door_right_sketch.webp');
    const handleLeftTexture = useTexture('/textures/doors/handle_left_sketch.webp');
    const handleRightTexture = useTexture('/textures/doors/handle_right_sketch.webp');
    const doorBackTexture = useTexture('/textures/doors/door_back_left_sketch.webp');
    const edgeTexture = useTexture('/textures/doors/pien.webp');
    const bricksTexture = useTexture('/textures/doors/wall_bricks_2.webp');

    // Door dimensions - calculated from texture proportions (332x848 = 1:2.55)
    const doorWidth = 0.94;
    const doorHeight = 2.4;
    const doorOpeningWidth = doorWidth * 2; // Both doors together
    const wallThickness = 0.07;

    // Frame dimensions from texture (718x877 = 1:1.22)
    const frameWidth = doorOpeningWidth + 0.16; // Extra for frame borders
    const frameHeight = frameWidth * (877 / 718); // Maintain texture aspect ratio

    // Floor Y must remain at standard level (-1.75) regardless of wall height
    const floorY = -1.75;
    const doorBottomY = floorY;
    const doorCenterY = doorBottomY + doorHeight / 2;
    const wallCenterY = floorY + corridorHeight / 2;
    const topWallHeight = corridorHeight - doorHeight;
    const topWallCenterY = doorBottomY + doorHeight + topWallHeight / 2;
    const sideWallWidth = (corridorWidth - doorOpeningWidth) / 2;

    // Handle click
    const handleClick = (e) => {
        e.stopPropagation();
        if (isOpen || isAnimating) return;

        setIsOpen(true);
        setIsAnimating(true);

        const tl = gsap.timeline({
            onComplete: () => {
                onComplete?.();
            }
        });

        // Press handles down fully (like really opening)
        if (leftHandleRef.current) {
            tl.to(leftHandleRef.current.rotation, {
                z: 0.4,
                duration: 0.15,
                ease: 'power2.out'
            }, 0);
        }
        if (rightHandleRef.current) {
            tl.to(rightHandleRef.current.rotation, {
                z: -0.4,
                duration: 0.15,
                ease: 'power2.out'
            }, 0);
        }

        // Open doors - smoother angle (matches SegmentDoors)
        tl.to(leftDoorRef.current.rotation, {
            y: -Math.PI * 0.55,
            duration: 0.9,
            ease: 'power2.out'
        }, 0.1);

        tl.to(rightDoorRef.current.rotation, {
            y: Math.PI * 0.55,
            duration: 0.9,
            ease: 'power2.out'
        }, 0.1);

        // Camera flies through
        tl.to(camera.position, {
            z: 8,
            y: 0.2, // Match hook's base Y position
            duration: 1.8,
            ease: 'power2.inOut'
        }, 0.3);
    };

    // Handle hover - doors slightly open to indicate interactivity
    const handlePointerEnter = () => {
        if (isOpen || isAnimating) return;
        setIsHovered(true);
        document.body.style.cursor = 'pointer';

        // Slightly open doors on hover
        gsap.to(leftDoorRef.current.rotation, {
            y: -0.08,
            duration: 0.3,
            ease: 'power2.out'
        });
        gsap.to(rightDoorRef.current.rotation, {
            y: 0.08,
            duration: 0.3,
            ease: 'power2.out'
        });

        // Rotate handles down slightly (hint effect)
        if (leftHandleRef.current) {
            gsap.to(leftHandleRef.current.rotation, {
                z: 0.1,
                duration: 0.2,
                ease: 'power2.out'
            });
        }
        if (rightHandleRef.current) {
            gsap.to(rightHandleRef.current.rotation, {
                z: -0.1,
                duration: 0.2,
                ease: 'power2.out'
            });
        }
    };

    const handlePointerLeave = () => {
        if (isOpen || isAnimating) return;
        setIsHovered(false);
        document.body.style.cursor = 'auto';

        // Close doors back
        gsap.to(leftDoorRef.current.rotation, {
            y: 0,
            duration: 0.3,
            ease: 'power2.out'
        });
        gsap.to(rightDoorRef.current.rotation, {
            y: 0,
            duration: 0.3,
            ease: 'power2.out'
        });

        // Reset handles
        if (leftHandleRef.current) {
            gsap.to(leftHandleRef.current.rotation, {
                z: 0,
                duration: 0.2,
                ease: 'power2.out'
            });
        }
        if (rightHandleRef.current) {
            gsap.to(rightHandleRef.current.rotation, {
                z: 0,
                duration: 0.2,
                ease: 'power2.out'
            });
        }
    };

    // Generate Vignette Alpha Map for fading edges
    const alphaMap = useMemo(() => {
        const canvas = document.createElement('canvas');
        canvas.width = 512;
        canvas.height = 512;
        const ctx = canvas.getContext('2d');

        // 1. Horizontal Gradient (Fade Sides)
        // Black (Transparent) -> White (Opaque) -> Black (Transparent)
        const gH = ctx.createLinearGradient(0, 0, 512, 0);
        gH.addColorStop(0, 'black');
        gH.addColorStop(0.2, 'white'); // Fade in from left (20%)
        gH.addColorStop(0.8, 'white'); // Start fading out to right (at 80%)
        gH.addColorStop(1, 'black');

        ctx.fillStyle = gH;
        ctx.fillRect(0, 0, 512, 512);

        // 2. Vertical Gradient (Fade Top)
        // Multiply with Horizontal to combine fades
        ctx.globalCompositeOperation = 'multiply';

        const gV = ctx.createLinearGradient(0, 0, 0, 512);
        gV.addColorStop(0, 'black');
        gV.addColorStop(0.4, 'white'); // Fade in from top (40%)
        gV.addColorStop(1, 'white');   // Bottom is fully opaque

        ctx.fillStyle = gV;
        ctx.fillRect(0, 0, 512, 512);

        // Reset composite
        ctx.globalCompositeOperation = 'source-over';

        const texture = new THREE.CanvasTexture(canvas);
        return texture;
    }, []);

    // Frame center Y - aligned with doors
    const frameCenterY = doorBottomY + frameHeight / 2;

    const facadeYOffset = -1.65; // PRZESUNIĘCIE OBRAZKA GÓRA/DÓŁ (np. -1.5 to w dół, 1.0 to w górę)

    return (
        <group ref={groupRef} position={[position[0], 0, position[2]]}>
            {/* LEFT WALL PANEL */}
            <mesh position={[-(doorOpeningWidth / 2 + sideWallWidth / 2), wallCenterY, 0]}>
                <boxGeometry args={[sideWallWidth, corridorHeight, wallThickness]} />
                <meshStandardMaterial color="#f8f5f0" roughness={0.95} />
            </mesh>

            {/* RIGHT WALL PANEL */}
            <mesh position={[(doorOpeningWidth / 2 + sideWallWidth / 2), wallCenterY, 0]}>
                <boxGeometry args={[sideWallWidth, corridorHeight, wallThickness]} />
                <meshStandardMaterial color="#f8f5f0" roughness={0.95} />
            </mesh>

            {/* TOP WALL PANEL */}
            <mesh position={[0, topWallCenterY, 0]}>
                <boxGeometry args={[doorOpeningWidth, topWallHeight, wallThickness]} />
                <meshStandardMaterial color="#f8f5f0" roughness={0.95} />
            </mesh>

            {/* === BRICK FACADE === */}
            {/* 
                DOSTOSOWANIE OBRAZKA (TEXTURE ADJUSTMENT):
                1. args={[Szerokość, Wysokość]} - Rozmiar obrazka
                2. facadeYOffset - Przesunięcie góra/dół (np. -1 obniży, 1 podwyższy)
            */}
            <mesh position={[0, wallCenterY + facadeYOffset, wallThickness / 2 + 0.01]}>
                {/* args={[Szerokość, Wysokość]} - Zmieniaj te liczby (np. 7, 8) */}
                <planeGeometry args={[11., 4.7]} />
                <meshStandardMaterial
                    map={bricksTexture}
                    alphaMap={alphaMap}
                    transparent={true}
                    alphaTest={0.01}
                    roughness={0.9}
                />
            </mesh>

            {/* === TEXTURED FRAME === */}
            <mesh position={[0, frameCenterY, 0.12]}>
                <planeGeometry args={[frameWidth, frameHeight]} />
                <meshStandardMaterial
                    map={frameTexture}
                    transparent={true}
                    alphaTest={0.1}
                    roughness={0.9}
                    depthWrite={false}
                />
            </mesh>

            {/* LEFT DOOR */}
            <group ref={leftDoorRef} position={[-doorWidth, doorCenterY, 0]}>
                {/* Solid 3D Door Body with edge texture */}
                <mesh
                    position={[doorWidth / 2, 0, 0.06]}
                    onClick={handleClick}
                    onPointerEnter={handlePointerEnter}
                    onPointerLeave={handlePointerLeave}
                >
                    <boxGeometry args={[doorWidth, doorHeight, 0.04]} />
                    <meshStandardMaterial map={edgeTexture} roughness={0.9} />
                </mesh>

                {/* Front Texture Face */}
                <mesh position={[doorWidth / 2, 0, 0.09]}>
                    <planeGeometry args={[doorWidth, doorHeight]} />
                    <meshStandardMaterial
                        map={doorLeftTexture}
                        transparent={true}
                        alphaTest={0.5}
                        roughness={0.8}
                    />
                </mesh>

                {/* Back Texture Face (mirrored) */}
                <mesh position={[doorWidth / 2, 0, 0.03]} rotation={[0, Math.PI, 0]} scale={[-1, 1, 1]}>
                    <planeGeometry args={[doorWidth, doorHeight]} />
                    <meshStandardMaterial
                        map={doorBackTexture}
                        transparent={true}
                        alphaTest={0.5}
                        roughness={0.8}
                        side={2}
                    />
                </mesh>

                {/* Handle Layer (animated) - pivot at screw center (292,459 on 332x848 texture) */}
                <group ref={leftHandleRef} position={[doorWidth / 2 + 0.357, -0.099, 0.10]}>
                    <mesh position={[-0.357, 0.099, 0]}>
                        <planeGeometry args={[doorWidth, doorHeight]} />
                        <meshStandardMaterial
                            map={handleLeftTexture}
                            transparent={true}
                            alphaTest={0.5}
                            depthWrite={false}
                        />
                    </mesh>
                </group>
            </group>

            {/* RIGHT DOOR */}
            <group ref={rightDoorRef} position={[doorWidth, doorCenterY, 0]}>
                {/* Solid 3D Door Body with edge texture */}
                <mesh
                    position={[-doorWidth / 2, 0, 0.06]}
                    onClick={handleClick}
                    onPointerEnter={handlePointerEnter}
                    onPointerLeave={handlePointerLeave}
                >
                    <boxGeometry args={[doorWidth, doorHeight, 0.04]} />
                    <meshStandardMaterial map={edgeTexture} roughness={0.9} />
                </mesh>

                {/* Front Texture Face */}
                <mesh position={[-doorWidth / 2, 0, 0.09]}>
                    <planeGeometry args={[doorWidth, doorHeight]} />
                    <meshStandardMaterial
                        map={doorRightTexture}
                        transparent={true}
                        alphaTest={0.5}
                        roughness={0.8}
                    />
                </mesh>

                {/* Back Texture Face */}
                <mesh position={[-doorWidth / 2, 0, 0.03]} rotation={[0, Math.PI, 0]}>
                    <planeGeometry args={[doorWidth, doorHeight]} />
                    <meshStandardMaterial
                        map={doorBackTexture}
                        transparent={true}
                        alphaTest={0.5}
                        roughness={0.8}
                    />
                </mesh>

                {/* Handle Layer (animated) - pivot at screw center (40,459 on 332x848 texture) */}
                <group ref={rightHandleRef} position={[-doorWidth / 2 - 0.357, -0.099, 0.10]}>
                    <mesh position={[0.357, 0.099, 0]}>
                        <planeGeometry args={[doorWidth, doorHeight]} />
                        <meshStandardMaterial
                            map={handleRightTexture}
                            transparent={true}
                            alphaTest={0.5}
                            depthWrite={false}
                        />
                    </mesh>
                </group>
            </group>

            {/* Warm lighting */}
            <pointLight
                position={[0, doorBottomY + doorHeight + 1, 1]}
                intensity={0.8}
                color="#fff8e8"
                distance={10}
            />
        </group>
    );
};

export default EntranceDoors;
