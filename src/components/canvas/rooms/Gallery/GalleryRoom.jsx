import { useRef, useEffect, useCallback, useMemo, memo } from 'react';
import { useFrame, useThree } from '@react-three/fiber';
import { Text } from '@react-three/drei';
import * as THREE from 'three';
import RoomShell from '../Studio/RoomShell';
import { useScene } from '../../../../context/SceneContext';
import { useAchievements } from '../../../../context/AchievementsContext';
import { usePerformance } from '../../../../context/PerformanceContext';
import { PROJECTS, FEATURED } from './galleryData';

// Miora Brief 5B — dark art gallery (matches Studio vestibule alignment)
const ROOM_WIDTH = 10;
const ROOM_HEIGHT = 4.0;
const ROOM_DEPTH = 10;
const SHELL_Z_OFFSET = -ROOM_DEPTH / 2 + 2;

// Free-roam (StudioRoom / AboutRoom contract: camera only after isInRoom === true)
const ROOM_ROAM_RADIUS = 3.5;
const MOVE_SENSITIVITY = 0.0035;
const TOUCH_MOVE_SENSITIVITY = 0.012;
const MOVE_DECAY = 0.9;
const LOOK_YAW_RANGE = 0.85;
const LOOK_PITCH_RANGE = 0.25;
const LOOK_SMOOTHING = 0.06;

/**
 * Procedural exhibition poster — cream paper + mint/amber accent.
 * Replaces copyrighted template textures (monetune / timberkitty / …).
 */
function makePosterTexture(title, tags = [], accent = '#9FE0BB') {
    const c = document.createElement('canvas');
    c.width = 512;
    c.height = 640;
    const ctx = c.getContext('2d');

    // Dark charcoal mat
    ctx.fillStyle = '#131316';
    ctx.fillRect(0, 0, c.width, c.height);

    // Cream paper inset
    ctx.fillStyle = '#F7F4EE';
    ctx.fillRect(28, 28, c.width - 56, c.height - 56);

    // Soft geometric "artwork" block (abstract, Hakkilo-safe)
    const grad = ctx.createLinearGradient(60, 80, 450, 360);
    grad.addColorStop(0, accent);
    grad.addColorStop(0.55, '#FFE4B5');
    grad.addColorStop(1, '#0D1220');
    ctx.fillStyle = grad;
    ctx.fillRect(60, 70, c.width - 120, 280);

    // Sketch strokes over the artwork
    ctx.strokeStyle = 'rgba(26,26,26,0.35)';
    ctx.lineWidth = 2;
    ctx.beginPath();
    ctx.moveTo(80, 120);
    ctx.lineTo(420, 160);
    ctx.lineTo(140, 300);
    ctx.stroke();
    ctx.beginPath();
    ctx.arc(300, 200, 48, 0, Math.PI * 1.6);
    ctx.stroke();

    // Accent rule
    ctx.fillStyle = accent;
    ctx.fillRect(60, 370, 64, 4);

    // Title
    ctx.fillStyle = '#1a1a1a';
    ctx.font = '700 28px Cabin Sketch, cursive';
    const words = title.split(' ');
    let line = '';
    let y = 420;
    for (const w of words) {
        const test = line ? `${line} ${w}` : w;
        if (ctx.measureText(test).width > c.width - 120) {
            ctx.fillText(line, 60, y);
            line = w;
            y += 34;
        } else {
            line = test;
        }
    }
    if (line) ctx.fillText(line, 60, y);

    // Tags
    ctx.font = '500 16px IBM Plex Sans, sans-serif';
    let tx = 60;
    const ty = Math.min(y + 40, c.height - 60);
    for (const tag of tags.slice(0, 3)) {
        const tw = ctx.measureText(tag).width + 16;
        ctx.fillStyle = accent;
        ctx.fillRect(tx, ty - 14, tw, 22);
        ctx.fillStyle = '#1a1a1a';
        ctx.fillText(tag, tx + 8, ty + 2);
        tx += tw + 8;
    }

    // Outer frame line
    ctx.strokeStyle = 'rgba(255,255,255,0.12)';
    ctx.lineWidth = 2;
    ctx.strokeRect(8, 8, c.width - 16, c.height - 16);

    const tex = new THREE.CanvasTexture(c);
    tex.colorSpace = THREE.SRGBColorSpace;
    tex.anisotropy = 4;
    return tex;
}

/**
 * Framed project canvas — click opens GlobalOverlay via openOverlay(data).
 */
const ProjectFrame = memo(function ProjectFrame({
    position,
    rotation = [0, 0, 0],
    width = 1.6,
    height = 2.0,
    project,
    onOpen,
}) {
    const tex = useMemo(
        () => makePosterTexture(project.title, project.tags, project.accent),
        [project.title, project.tags, project.accent]
    );

    useEffect(() => () => tex.dispose(), [tex]);

    return (
        <group position={position} rotation={rotation}>
            {/* Dark frame border */}
            <mesh position={[0, 0, -0.02]}>
                <boxGeometry args={[width + 0.12, height + 0.12, 0.04]} />
                <meshStandardMaterial color="#2a2a30" roughness={0.7} metalness={0.15} />
            </mesh>
            <mesh
                onClick={(e) => {
                    e.stopPropagation();
                    onOpen(project);
                }}
                onPointerOver={(e) => {
                    e.stopPropagation();
                    document.body.style.cursor = 'pointer';
                }}
                onPointerOut={() => {
                    document.body.style.cursor = 'auto';
                }}
            >
                <planeGeometry args={[width, height]} />
                <meshStandardMaterial map={tex} roughness={0.88} metalness={0} />
            </mesh>
        </group>
    );
});

/**
 * GalleryLighting — amber key points (spot-like pools) + soft fill.
 * Tier-gated: LOW drops the side accent and softens intensities.
 * (Point lights avoid SpotLight target Object3D wiring in R3F.)
 */
function GalleryLighting({ roomHeight, roomDepth }) {
    const { tier } = usePerformance();
    const isLow = tier === 'LOW';
    const backZ = -roomDepth / 2 + 1.2;

    return (
        <group>
            <hemisphereLight args={['#2a2a32', '#0a0a0e', isLow ? 0.25 : 0.4]} />
            <ambientLight intensity={isLow ? 0.12 : 0.18} color="#1a1a22" />

            {/* Key pools along the back wall (frames) */}
            <pointLight
                position={[-2.4, roomHeight * 0.85, backZ]}
                intensity={isLow ? 1.0 : 2.0}
                color="#FFE4B5"
                distance={5}
                decay={2}
            />
            <pointLight
                position={[0, roomHeight * 0.85, backZ]}
                intensity={isLow ? 0.9 : 1.8}
                color="#FFE4B5"
                distance={5}
                decay={2}
            />
            <pointLight
                position={[2.4, roomHeight * 0.85, backZ]}
                intensity={isLow ? 0.9 : 1.7}
                color="#FFE4B5"
                distance={5}
                decay={2}
            />

            {/* Pedestal fill */}
            <pointLight
                position={[0, roomHeight * 0.7, -1]}
                intensity={isLow ? 0.35 : 0.65}
                color="#FFE4B5"
                distance={6}
                decay={2}
            />

            {!isLow && (
                <pointLight
                    position={[ROOM_WIDTH / 2 - 0.8, roomHeight * 0.8, -2.4]}
                    intensity={1.2}
                    color="#FFE4B5"
                    distance={5}
                    decay={2}
                />
            )}
        </group>
    );
}

/**
 * Slow-rotating featured sculpture on the central pedestal.
 */
function FeaturedPiece({ data, onOpen, shadowsEnabled }) {
    const meshRef = useRef();
    const tex = useMemo(
        () => makePosterTexture(data.title, data.tags, data.accent),
        [data.title, data.tags, data.accent]
    );

    useEffect(() => () => tex.dispose(), [tex]);

    useFrame((_, delta) => {
        if (meshRef.current) meshRef.current.rotation.y += delta * 0.35;
    });

    return (
        <group position={[0, 0, -1.2]}>
            {/* Pedestal */}
            <mesh position={[0, 0.45, 0]} castShadow={shadowsEnabled} receiveShadow={shadowsEnabled}>
                <boxGeometry args={[1.1, 0.9, 1.1]} />
                <meshStandardMaterial color="#2a2a30" roughness={0.55} metalness={0.25} />
            </mesh>
            <mesh position={[0, 0.92, 0]}>
                <boxGeometry args={[1.18, 0.04, 1.18]} />
                <meshStandardMaterial
                    color="#9FE0BB"
                    emissive="#9FE0BB"
                    emissiveIntensity={shadowsEnabled ? 1.2 : 0.5}
                />
            </mesh>

            {/* Rotating framed mini-canvas */}
            <group
                ref={meshRef}
                position={[0, 1.55, 0]}
                onClick={(e) => {
                    e.stopPropagation();
                    onOpen(data);
                }}
                onPointerOver={(e) => {
                    e.stopPropagation();
                    document.body.style.cursor = 'pointer';
                }}
                onPointerOut={() => {
                    document.body.style.cursor = 'auto';
                }}
            >
                <mesh castShadow={shadowsEnabled}>
                    <boxGeometry args={[0.7, 0.9, 0.06]} />
                    <meshStandardMaterial map={tex} roughness={0.85} metalness={0} />
                </mesh>
            </group>
        </group>
    );
}

/**
 * GalleryRoom — immersive exhibition space (Miora Brief 5 / Section B).
 *
 * Replaces the paper-scroll balcony / copyrighted project textures with a
 * dark spot-lit gallery: framed projects + central pedestal.
 * Camera ownership: DoorSection during entry; free-roam ONLY once isInRoom.
 * Overlays use openOverlay({ title, description, url, items[] }).
 */
const GalleryRoom = ({ showRoom, onReady, isExiting, isWarmup }) => {
    const groupRef = useRef();
    const { camera } = useThree();
    const { settings, tier } = usePerformance();
    const { openOverlay, overlayContent, isTeleporting, isInRoom } = useScene();
    const { showTutorial, unlockAchievement, hidePopup } = useAchievements();

    const overlayRef = useRef(overlayContent);
    useEffect(() => {
        overlayRef.current = overlayContent;
    }, [overlayContent]);

    useEffect(() => {
        if (isExiting || isTeleporting) hidePopup();
    }, [isExiting, isTeleporting, hidePopup]);

    const hasSignaledReady = useRef(false);
    const frameCount = useRef(0);
    useFrame(() => {
        if (hasSignaledReady.current) return;
        frameCount.current++;
        if (frameCount.current >= 5) {
            hasSignaledReady.current = true;
            onReady?.();
            if (!isWarmup) setTimeout(() => showTutorial('gallery_inspect'), 2000);
        }
    });

    const handleOpen = useCallback((data) => {
        unlockAchievement('gallery_inspect');
        openOverlay(data);
    }, [openOverlay, unlockAchievement]);

    // --- Free-roam camera ---
    const roomEntryYaw = useRef(null);
    const roomEntryPitch = useRef(null);
    const roomEntryPos = useRef(null);
    const keysRef = useRef({});
    const targetYawOffset = useRef(0);
    const currentYawOffset = useRef(0);
    const targetPitchOffset = useRef(0);
    const currentPitchOffset = useRef(0);
    const moveVelocity = useRef(0);
    const touchAnchorRef = useRef({ x: 0, y: 0 });
    const forwardRef = useRef(new THREE.Vector3());

    useEffect(() => {
        if (isInRoom && roomEntryYaw.current === null) {
            camera.rotation.order = 'YXZ';
            roomEntryYaw.current = camera.rotation.y;
            roomEntryPitch.current = camera.rotation.x;
            roomEntryPos.current = camera.position.clone();
        }
        if (!isInRoom) {
            roomEntryYaw.current = null;
            roomEntryPitch.current = null;
            roomEntryPos.current = null;
        }
    }, [isInRoom, camera]);

    useEffect(() => {
        const onMouseMove = (e) => {
            if (!isInRoom || overlayRef.current || isExiting || isTeleporting) return;
            const nx = (e.clientX / window.innerWidth) * 2 - 1;
            const ny = (e.clientY / window.innerHeight) * 2 - 1;
            targetYawOffset.current = -nx * LOOK_YAW_RANGE;
            targetPitchOffset.current = -ny * LOOK_PITCH_RANGE;
        };
        window.addEventListener('mousemove', onMouseMove);
        return () => window.removeEventListener('mousemove', onMouseMove);
    }, [isInRoom, isExiting, isTeleporting]);

    useEffect(() => {
        const onKeyDown = (e) => {
            const k = e.key.toLowerCase();
            if (['arrowup', 'arrowdown', 'arrowleft', 'arrowright'].includes(k)) e.preventDefault();
            keysRef.current[k] = true;
        };
        const onKeyUp = (e) => { keysRef.current[e.key.toLowerCase()] = false; };
        window.addEventListener('keydown', onKeyDown);
        window.addEventListener('keyup', onKeyUp);
        return () => {
            window.removeEventListener('keydown', onKeyDown);
            window.removeEventListener('keyup', onKeyUp);
        };
    }, []);

    useEffect(() => {
        const onWheel = (e) => {
            if (!isInRoom || overlayRef.current || isExiting || isTeleporting) return;
            moveVelocity.current += e.deltaY * MOVE_SENSITIVITY;
        };
        window.addEventListener('wheel', onWheel, { passive: true });
        return () => window.removeEventListener('wheel', onWheel);
    }, [isInRoom, isExiting, isTeleporting]);

    useEffect(() => {
        const onTouchStart = (e) => {
            if (!e.touches[0]) return;
            touchAnchorRef.current = { x: e.touches[0].clientX, y: e.touches[0].clientY };
        };
        const onTouchMove = (e) => {
            if (!isInRoom || overlayRef.current || isExiting || isTeleporting || !e.touches[0]) return;
            const t = e.touches[0];
            const dx = t.clientX - touchAnchorRef.current.x;
            const dy = t.clientY - touchAnchorRef.current.y;
            touchAnchorRef.current = { x: t.clientX, y: t.clientY };
            targetYawOffset.current = THREE.MathUtils.clamp(
                targetYawOffset.current - dx * 0.004,
                -LOOK_YAW_RANGE,
                LOOK_YAW_RANGE
            );
            moveVelocity.current += -dy * TOUCH_MOVE_SENSITIVITY;
        };
        window.addEventListener('touchstart', onTouchStart, { passive: true });
        window.addEventListener('touchmove', onTouchMove, { passive: true });
        return () => {
            window.removeEventListener('touchstart', onTouchStart);
            window.removeEventListener('touchmove', onTouchMove);
        };
    }, [isInRoom, isExiting, isTeleporting]);

    useFrame((_, delta) => {
        if (isTeleporting || isExiting) return;
        if (roomEntryYaw.current === null || !isInRoom || overlayRef.current) return;

        const keys = keysRef.current;
        const TURN = 1.6;
        if (keys.arrowleft || keys.a || keys.q) roomEntryYaw.current += TURN * delta;
        if (keys.arrowright || keys.d) roomEntryYaw.current -= TURN * delta;
        if (keys.arrowup || keys.w || keys.z) moveVelocity.current += 0.004;
        if (keys.arrowdown || keys.s) moveVelocity.current -= 0.004;

        currentYawOffset.current = THREE.MathUtils.lerp(currentYawOffset.current, targetYawOffset.current, LOOK_SMOOTHING);
        currentPitchOffset.current = THREE.MathUtils.lerp(currentPitchOffset.current, targetPitchOffset.current, LOOK_SMOOTHING);
        camera.rotation.y = roomEntryYaw.current + currentYawOffset.current;
        camera.rotation.x = roomEntryPitch.current + currentPitchOffset.current;

        moveVelocity.current *= MOVE_DECAY;
        const forward = forwardRef.current;
        camera.getWorldDirection(forward);
        forward.y = 0;
        forward.normalize();
        camera.position.x += forward.x * moveVelocity.current;
        camera.position.z += forward.z * moveVelocity.current;

        if (roomEntryPos.current) {
            const dx = camera.position.x - roomEntryPos.current.x;
            const dz = camera.position.z - roomEntryPos.current.z;
            const d = Math.hypot(dx, dz);
            if (d > ROOM_ROAM_RADIUS) {
                camera.position.x = roomEntryPos.current.x + (dx / d) * ROOM_ROAM_RADIUS;
                camera.position.z = roomEntryPos.current.z + (dz / d) * ROOM_ROAM_RADIUS;
            }
        }
    });

    const backProjects = useMemo(() => PROJECTS.filter((p) => p.wall === 'back'), []);
    const sideProjects = useMemo(() => PROJECTS.filter((p) => p.wall === 'right'), []);

    return (
        <group ref={groupRef} position={[0, -1.2, 0]} visible={showRoom || isWarmup}>
            <group position={[0, 0, SHELL_Z_OFFSET]}>
                <RoomShell
                    width={ROOM_WIDTH}
                    height={ROOM_HEIGHT}
                    depth={ROOM_DEPTH}
                    wallColor="#131316"
                    floorColor="#1a1a1e"
                    ceilingColor="#0e0e12"
                    shadowsEnabled={settings.shadows}
                />
                <GalleryLighting roomHeight={ROOM_HEIGHT} roomDepth={ROOM_DEPTH} />

                {/* Mint LED baseboard — back wall */}
                <mesh position={[0, 0.04, -ROOM_DEPTH / 2 + 0.03]}>
                    <boxGeometry args={[ROOM_WIDTH - 0.4, 0.05, 0.04]} />
                    <meshStandardMaterial
                        color="#9FE0BB"
                        emissive="#9FE0BB"
                        emissiveIntensity={tier === 'LOW' ? 0.5 : 1.3}
                    />
                </mesh>

                {/* Back-wall project frames */}
                {backProjects.map((project, i) => {
                    const xs = [-2.6, 0, 2.6];
                    return (
                        <ProjectFrame
                            key={project.id}
                            position={[xs[i] ?? (i - 1) * 2.6, 2.05, -ROOM_DEPTH / 2 + 0.08]}
                            width={1.7}
                            height={2.15}
                            project={project}
                            onOpen={handleOpen}
                        />
                    );
                })}

                {/* Right-wall project */}
                {sideProjects.map((project) => (
                    <ProjectFrame
                        key={project.id}
                        position={[ROOM_WIDTH / 2 - 0.08, 2.05, -2.4]}
                        rotation={[0, -Math.PI / 2, 0]}
                        width={1.5}
                        height={2.0}
                        project={project}
                        onOpen={handleOpen}
                    />
                ))}

                <FeaturedPiece
                    data={FEATURED}
                    onOpen={handleOpen}
                    shadowsEnabled={settings.shadows}
                />

                <Text
                    position={[0, 0.02, 1.2]}
                    rotation={[-Math.PI / 2, 0, 0]}
                    font="/fonts/CabinSketch-Regular.ttf"
                    fontSize={0.16}
                    color="#9FE0BB"
                    anchorX="center"
                    anchorY="middle"
                >
                    Cliquez une œuvre — La Galerie Hakkilo XR
                </Text>
            </group>
        </group>
    );
};

export default GalleryRoom;
