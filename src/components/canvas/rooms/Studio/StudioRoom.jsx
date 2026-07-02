import { useRef, useState, useEffect, useMemo, useCallback, memo, Suspense } from 'react';
import { useFrame, useThree } from '@react-three/fiber';
import * as THREE from 'three';
import gsap from 'gsap';
import { PRODUCTS } from './productData';
import { PRODUCT_MODELS } from './ProductModels';
import RoomShell from './RoomShell';
import BoutiqueLighting from './BoutiqueLighting';
import FurnitureModel from '../../FurnitureModel';
import { useScene } from '../../../../context/SceneContext';
import { useAchievements } from '../../../../context/AchievementsContext';
import { usePerformance } from '../../../../context/PerformanceContext';

// ============================================
// CONFIG - Adjust these values as needed
// ============================================
const ROOM_WIDTH = 10;
const ROOM_HEIGHT = 4.2;
const ROOM_DEPTH = 10;
const SHELL_Z_OFFSET = -ROOM_DEPTH / 2 + 2; // shell's open doorway edge sits near local z=+2

// Room-dressing furniture — real GLBs sourced earlier (Poly-Haven-style, PBR-ready),
// placed via the same data-driven {position, rotation, scale} pattern as CorridorDecorations.jsx.
const FURNITURE = [
    { id: 'armchair', path: '/models/boutique/armchair/ArmChair_01_1k.gltf', position: [-3.3, 0, -0.5], rotation: [0, Math.PI / 4, 0], scale: 1 },
    { id: 'sofa', path: '/models/boutique/sofa.glb', position: [3.2, 0, -1.2], rotation: [0, -Math.PI / 3, 0], scale: 1 },
    { id: 'desk', path: '/models/boutique/desk/metal_office_desk_1k.gltf', position: [0, 0, -7], rotation: [0, Math.PI, 0], scale: 1 },
    { id: 'plant', path: '/models/boutique/plant/celandine_01_1k.gltf', position: [-4, 0, -6.5], rotation: [0, 0, 0], scale: 1 },
    { id: 'lamp', path: '/models/boutique/lamp/street_lamp_02_1k.gltf', position: [4, 0, -6], rotation: [0, 0, 0], scale: 0.55 },
];

const CLUSTER_RADIUS = 1.7; // distance of each product from the cluster's centre
const CLUSTER_Y = 1.5; // height of the floating cluster above the floor
const CLUSTER_Z = SHELL_Z_OFFSET; // cluster sits at the room's centre depth

const CAMERA_Y_OFFSET = -1.4; // Negative = camera lower, Positive = camera higher
const CAMERA_ZOOM_DISTANCE = 1.8; // Distance from product when zoomed in
const CAMERA_PAN_RIGHT = 1; // How far camera moves right after zoom (for content panel space)

// Free-roam room camera: scroll/touch = walk in the direction you're looking, mouse
// position = look around — same "scroll to move, mouse to look" language as the
// corridor's useInfiniteCamera, but in 2D and bounded to the room's floor instead of
// a single fixed dolly line, so the furniture around the edges is actually reachable.
const ROOM_MARGIN = 0.7;
const ROOM_BOUNDS = {
    minX: -ROOM_WIDTH / 2 + ROOM_MARGIN,
    maxX: ROOM_WIDTH / 2 - ROOM_MARGIN,
    minZ: SHELL_Z_OFFSET - ROOM_DEPTH / 2 + ROOM_MARGIN,
    maxZ: SHELL_Z_OFFSET + ROOM_DEPTH / 2 - ROOM_MARGIN,
};
const MOVE_SENSITIVITY = 0.0035;
const TOUCH_MOVE_SENSITIVITY = 0.012;
const MOVE_DECAY = 0.9;
const LOOK_YAW_RANGE = 0.8; // radians either way (~46°)
const LOOK_PITCH_RANGE = 0.2;
const LOOK_SMOOTHING = 0.06;

const StudioRoom = ({ showRoom, onReady, isExiting, isWarmup }) => {
    const groupRef = useRef();
    const clusterRef = useRef();
    const { camera, size } = useThree();
    const { settings } = usePerformance();

    // Responsive camera parameters based on PIXEL width
    const responsiveParams = useMemo(() => {
        const isMobile = size.width < 768;
        const isTablet = size.width < 1024 && size.width >= 768;

        return {
            zoomDistance: isMobile ? 1.3 : isTablet ? 1.5 : CAMERA_ZOOM_DISTANCE,
            panRight: isMobile ? 0 : isTablet ? 0.5 : Math.max(0.3, (size.width / 1920) * CAMERA_PAN_RIGHT),
            panDown: isMobile ? 0.9 : 0,
            yOffset: isMobile ? 0.3 : isTablet ? -0.2 : CAMERA_Y_OFFSET,
            clusterRadius: isMobile ? 1.2 : (isTablet ? 1.4 : CLUSTER_RADIUS),
            isMobile,
        };
    }, [size.width]);

    // Store original camera position for reset
    const originalCameraY = useRef(null);
    const originalCameraZ = useRef(null);
    const originalCameraX = useRef(null);

    // State
    const isDraggingRef = useRef(false);
    const lastXRef = useRef(0);
    const dragDistance = useRef(0);

    // Physics
    const rotationVelocity = useRef(0);
    const autoRotationSpeed = useRef(0.12);
    const DRAG_SENSITIVITY = 0.008;
    const FRICTION = 0.98;

    // Free-roam camera state — entry look direction captured once so mouse-look adds
    // an offset instead of snapping, plus movement velocity/look-offset targets.
    const roomEntryYaw = useRef(null);
    const roomEntryPitch = useRef(null);
    const targetYawOffset = useRef(0);
    const currentYawOffset = useRef(0);
    const targetPitchOffset = useRef(0);
    const currentPitchOffset = useRef(0);
    const moveVelocity = useRef(0);
    const touchAnchorRef = useRef({ x: 0, y: 0 });

    // Refs to product meshes for direct position/rotation updates in useFrame
    const productRefs = useRef([]);

    // Content State
    const [selectedProduct, setSelectedProduct] = useState(null);
    const [isAnimating, setIsAnimating] = useState(false);

    // Global Scene Context for Overlay
    const { openOverlay, overlayContent, isTeleporting, isInRoom } = useScene();

    // Achievements Context
    const { showTutorial, unlockAchievement, hidePopup } = useAchievements();

    useEffect(() => {
        if (isExiting || isTeleporting) {
            hidePopup();
        }
    }, [isExiting, isTeleporting, hidePopup]);

    // Track if we've signaled ready
    const hasSignaledReady = useRef(false);
    const frameCount = useRef(0);
    const FRAMES_TO_WAIT = 5; // Wait for 5 actual render frames

    // Real render-based ready detection - count actual rendered frames
    useFrame(() => {
        if (hasSignaledReady.current) return;

        frameCount.current++;

        // After N frames have been rendered, we know GPU has drawn the content
        if (frameCount.current >= FRAMES_TO_WAIT) {
            hasSignaledReady.current = true;
            onReady?.();
            if (!isWarmup) setTimeout(() => showTutorial('studio_interact'), 2000);
        }
    });

    // Arrange products in a single ring, facing outward
    const productData = useMemo(() => {
        const count = PRODUCTS.length;
        const angleStep = (Math.PI * 2) / count;
        const currentRadius = responsiveParams.clusterRadius;

        return PRODUCTS.map((product, index) => {
            const angle = index * angleStep;
            const x = Math.cos(angle) * currentRadius;
            const z = Math.sin(angle) * currentRadius;
            // Gentle per-item height stagger for an organic, non-mechanical look
            const yJitter = Math.sin(index * 2.1) * 0.12;

            return {
                ...product,
                index,
                x,
                z,
                baseY: yJitter,
                angle,
                rot: -angle + Math.PI / 2,
            };
        });
    }, [responsiveParams.clusterRadius]);

    // --- INTERACTION: drag-to-rotate the cluster (only while pointer-down on it) ---
    const handlePointerDown = (e) => {
        if (isAnimating) return;
        e.stopPropagation();

        isDraggingRef.current = true;
        lastXRef.current = e.clientX;
        dragDistance.current = 0;
        rotationVelocity.current = 0;

        document.body.style.cursor = 'grabbing';
    };

    const handlePointerUp = useCallback(() => {
        isDraggingRef.current = false;
        document.body.style.cursor = 'auto';
    }, []);

    const handlePointerMove = useCallback((e) => {
        if (!isDraggingRef.current || !clusterRef.current || isAnimating) return;

        const clientX = e.clientX || (e.touches && e.touches[0]?.clientX);
        if (!clientX) return;

        const deltaX = clientX - lastXRef.current;
        lastXRef.current = clientX;
        dragDistance.current += Math.abs(deltaX);

        if (Math.abs(deltaX) > 1) {
            autoRotationSpeed.current = Math.sign(deltaX) * 0.12;
        }
        rotationVelocity.current = deltaX * DRAG_SENSITIVITY;
        clusterRef.current.rotation.y += rotationVelocity.current;

        unlockAchievement('studio_interact');
    }, [isAnimating, unlockAchievement]);

    useEffect(() => {
        window.addEventListener('pointerup', handlePointerUp);
        window.addEventListener('pointermove', handlePointerMove);
        window.addEventListener('touchend', handlePointerUp);
        window.addEventListener('touchmove', handlePointerMove);

        return () => {
            window.removeEventListener('pointerup', handlePointerUp);
            window.removeEventListener('pointermove', handlePointerMove);
            window.removeEventListener('touchend', handlePointerUp);
            window.removeEventListener('touchmove', handlePointerMove);
        };
    }, [handlePointerUp, handlePointerMove]);

    // Capture the camera's entry look direction once the door's own fly-through
    // animation has FULLY finished (isInRoom, not showRoom — showRoom flips true much
    // earlier, while DoorSection.jsx is still mid-flight animating camera.position
    // itself; taking over that early fought the entry animation for control of the
    // camera every frame, which is what produced the sideways/broken-looking entry).
    useEffect(() => {
        if (isInRoom && roomEntryYaw.current === null) {
            camera.rotation.order = 'YXZ';
            roomEntryYaw.current = camera.rotation.y;
            roomEntryPitch.current = camera.rotation.x;
        }
    }, [isInRoom, camera]);

    // Mouse position drives look direction, always-on (no drag needed) — same
    // convention as the corridor's own mouse-look.
    useEffect(() => {
        const handleMouseMove = (e) => {
            if (isAnimating || selectedProduct) return;
            const normalizedX = (e.clientX / window.innerWidth) * 2 - 1;
            const normalizedY = (e.clientY / window.innerHeight) * 2 - 1;
            targetYawOffset.current = -normalizedX * LOOK_YAW_RANGE;
            targetPitchOffset.current = -normalizedY * LOOK_PITCH_RANGE;
        };
        window.addEventListener('mousemove', handleMouseMove);
        return () => window.removeEventListener('mousemove', handleMouseMove);
    }, [isAnimating, selectedProduct]);

    // Desktop scroll wheel = walk forward/back in the direction the camera is
    // currently looking (scroll down = advance, matching the corridor's convention).
    useEffect(() => {
        const handleWheel = (e) => {
            if (isAnimating || selectedProduct) return;
            moveVelocity.current += e.deltaY * MOVE_SENSITIVITY;
            unlockAchievement('studio_interact');
        };
        window.addEventListener('wheel', handleWheel);
        return () => window.removeEventListener('wheel', handleWheel);
    }, [isAnimating, selectedProduct, unlockAchievement]);

    // Mobile: single-finger drag anywhere (not just on the product cluster) looks
    // around (horizontal) and walks forward/back (vertical) — skipped while the
    // cluster-drag handler above already owns the gesture (isDraggingRef).
    useEffect(() => {
        const handleTouchStart = (e) => {
            if (!e.touches[0]) return;
            touchAnchorRef.current = { x: e.touches[0].clientX, y: e.touches[0].clientY };
        };
        const handleTouchMoveRoam = (e) => {
            if (isAnimating || selectedProduct || isDraggingRef.current || !e.touches[0]) return;
            const touch = e.touches[0];
            const dx = touch.clientX - touchAnchorRef.current.x;
            const dy = touch.clientY - touchAnchorRef.current.y;
            touchAnchorRef.current = { x: touch.clientX, y: touch.clientY };
            targetYawOffset.current = THREE.MathUtils.clamp(
                targetYawOffset.current - dx * 0.004,
                -LOOK_YAW_RANGE,
                LOOK_YAW_RANGE
            );
            moveVelocity.current += -dy * TOUCH_MOVE_SENSITIVITY;
            unlockAchievement('studio_interact');
        };
        window.addEventListener('touchstart', handleTouchStart);
        window.addEventListener('touchmove', handleTouchMoveRoam);
        return () => {
            window.removeEventListener('touchstart', handleTouchStart);
            window.removeEventListener('touchmove', handleTouchMoveRoam);
        };
    }, [isAnimating, selectedProduct, unlockAchievement]);

    // STEP 1: Rotate cluster to face the clicked product toward the camera
    const handleProductClick = useCallback((item) => {
        if (dragDistance.current > 5 || isAnimating || !clusterRef.current) return;

        setIsAnimating(true);
        setSelectedProduct(item);
        rotationVelocity.current = 0;

        unlockAchievement('studio_interact');

        const productFacingRotation = item.rot;
        let targetRotation = -productFacingRotation;

        let currentRotation = clusterRef.current.rotation.y % (Math.PI * 2);
        if (currentRotation < 0) currentRotation += Math.PI * 2;

        while (targetRotation < 0) targetRotation += Math.PI * 2;
        targetRotation = targetRotation % (Math.PI * 2);

        let delta = targetRotation - currentRotation;
        if (delta > Math.PI) delta -= Math.PI * 2;
        if (delta < -Math.PI) delta += Math.PI * 2;

        const finalRotation = clusterRef.current.rotation.y + delta;

        gsap.to(clusterRef.current.rotation, {
            y: finalRotation,
            duration: 0.8,
            ease: 'power2.inOut',
            onComplete: () => {
                if (originalCameraY.current === null) {
                    originalCameraY.current = camera.position.y;
                }

                const productWorldY = -1.2 + CLUSTER_Y + item.baseY + responsiveParams.yOffset;

                if (originalCameraZ.current === null) {
                    originalCameraZ.current = camera.position.z;
                    originalCameraX.current = camera.position.x;
                }

                const forward = new THREE.Vector3();
                camera.getWorldDirection(forward);

                const up = new THREE.Vector3(0, 1, 0);
                const right = new THREE.Vector3();
                right.crossVectors(forward, up).normalize();

                const zoomDist = responsiveParams.zoomDistance;
                const panRight = responsiveParams.panRight;
                const panDown = responsiveParams.panDown;

                const targetX = camera.position.x + forward.x * zoomDist + right.x * panRight;
                const targetZ = camera.position.z + forward.z * zoomDist + right.z * panRight;
                const targetY = productWorldY - panDown;

                gsap.to(camera.position, {
                    x: targetX,
                    y: targetY,
                    z: targetZ,
                    duration: 0.5,
                    ease: 'power2.inOut',
                    onComplete: () => {
                        setIsAnimating(false);
                        openOverlay(item);
                    }
                });
            }
        });
    }, [isAnimating, camera, responsiveParams, openOverlay, unlockAchievement]);

    // Trigger camera return ONLY when overlay is explicitly closed
    const prevOverlayContent = useRef(null);

    useEffect(() => {
        if (prevOverlayContent.current && !overlayContent && selectedProduct && !isAnimating) {
            handleReturnCamera();
        }
        prevOverlayContent.current = overlayContent;
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [overlayContent, selectedProduct, isAnimating]);

    const handleReturnCamera = useCallback(() => {
        setIsAnimating(true);

        if (originalCameraX.current !== null && originalCameraY.current !== null && originalCameraZ.current !== null) {
            gsap.to(camera.position, {
                x: originalCameraX.current,
                y: originalCameraY.current,
                z: originalCameraZ.current,
                duration: 0.8,
                ease: 'power2.inOut',
                onComplete: () => {
                    setIsAnimating(false);
                    setSelectedProduct(null);
                }
            });
        } else {
            setIsAnimating(false);
            setSelectedProduct(null);
        }
    }, [camera]);

    // Idle auto-rotation + gentle per-product bob (levitation feel) + free-roam camera
    useFrame((state, delta) => {
        if (!clusterRef.current) return;

        if (!isDraggingRef.current && !isAnimating && !selectedProduct) {
            clusterRef.current.rotation.y += autoRotationSpeed.current * delta + rotationVelocity.current;
            rotationVelocity.current *= FRICTION;
        }

        // Free-roam look + walk — paused while a click-to-focus animation owns the camera.
        if (roomEntryYaw.current !== null && !isAnimating && !selectedProduct) {
            currentYawOffset.current = THREE.MathUtils.lerp(currentYawOffset.current, targetYawOffset.current, LOOK_SMOOTHING);
            currentPitchOffset.current = THREE.MathUtils.lerp(currentPitchOffset.current, targetPitchOffset.current, LOOK_SMOOTHING);
            camera.rotation.y = roomEntryYaw.current + currentYawOffset.current;
            camera.rotation.x = roomEntryPitch.current + currentPitchOffset.current;

            moveVelocity.current *= MOVE_DECAY;
            const forward = new THREE.Vector3();
            camera.getWorldDirection(forward);
            forward.y = 0;
            forward.normalize();
            camera.position.x += forward.x * moveVelocity.current;
            camera.position.z += forward.z * moveVelocity.current;
            camera.position.x = THREE.MathUtils.clamp(camera.position.x, ROOM_BOUNDS.minX, ROOM_BOUNDS.maxX);
            camera.position.z = THREE.MathUtils.clamp(camera.position.z, ROOM_BOUNDS.minZ, ROOM_BOUNDS.maxZ);
        }

        const t = state.clock.elapsedTime;
        productData.forEach((item, index) => {
            const ref = productRefs.current[index];
            if (ref) {
                ref.position.y = item.baseY + Math.sin(t * 0.8 + index * 1.7) * 0.06;
                ref.rotation.y = item.rot + Math.sin(t * 0.5 + index * 2.3) * 0.05;
            }
        });
    });

    return (
        <group ref={groupRef} position={[0, -1.2, 0]}>
            <group position={[0, 0, SHELL_Z_OFFSET]}>
                <RoomShell width={ROOM_WIDTH} height={ROOM_HEIGHT} depth={ROOM_DEPTH} shadowsEnabled={settings.shadows} />
                <BoutiqueLighting
                    roomWidth={ROOM_WIDTH}
                    roomHeight={ROOM_HEIGHT}
                    roomDepth={ROOM_DEPTH}
                    targetPosition={[0, CLUSTER_Y, 0]}
                />

                {/* Room-dressing furniture, loaded async — isolated Suspense so it
                    doesn't block the rest of the room while GLBs stream in. */}
                <Suspense fallback={null}>
                    {FURNITURE.map((piece) => (
                        <FurnitureModel key={piece.id} {...piece} />
                    ))}
                </Suspense>
            </group>

            {/* THE FLOATING PRODUCT CLUSTER */}
            <group
                ref={clusterRef}
                position={[0, CLUSTER_Y, CLUSTER_Z]}
                onPointerDown={handlePointerDown}
            >
                {/* Invisible hit cylinder for easier drag interaction */}
                <mesh visible={false}>
                    <cylinderGeometry args={[responsiveParams.clusterRadius + 0.6, responsiveParams.clusterRadius + 0.6, 1.2, 16]} />
                    <meshBasicMaterial color="#e0e0e0" />
                </mesh>

                {productData.map((item, index) => (
                    <ProductBlock
                        key={item.id}
                        item={item}
                        meshRef={(el) => { productRefs.current[index] = el; }}
                        isSelected={selectedProduct?.id === item.id}
                        onProductClick={handleProductClick}
                        disabled={isAnimating}
                    />
                ))}
            </group>
        </group>
    );
};

// ===========================================
// PRODUCT BLOCK - a single floating showcase item
// ===========================================
const ProductBlock = memo(({ item, meshRef, isSelected, onProductClick, disabled }) => {
    const hoverRef = useRef(false);
    const ProductModel = PRODUCT_MODELS[item.category];

    return (
        <group
            ref={meshRef}
            position={[item.x, item.baseY, item.z]}
            rotation={[0, item.rot, 0]}
            scale={item.scale || 1}
            onPointerOver={(e) => {
                if (disabled) return;
                e.stopPropagation();
                hoverRef.current = true;
                document.body.style.cursor = 'pointer';
            }}
            onPointerOut={() => {
                hoverRef.current = false;
                document.body.style.cursor = 'auto';
            }}
            onPointerUp={(e) => {
                if (disabled) return;
                e.stopPropagation();
                onProductClick(item);
            }}
        >
            {ProductModel ? <ProductModel /> : (
                <mesh>
                    <boxGeometry args={[0.2, 0.15, 0.1]} />
                    <meshStandardMaterial color="#888" />
                </mesh>
            )}
            {isSelected && (
                <pointLight color="#00d4ff" intensity={0.6} distance={0.6} />
            )}
        </group>
    );
});

export default StudioRoom;
