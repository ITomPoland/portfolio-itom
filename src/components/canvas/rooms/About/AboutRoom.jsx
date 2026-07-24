import { useRef, useEffect, useCallback, useMemo, memo } from 'react';
import { useFrame, useThree } from '@react-three/fiber';
import { Text } from '@react-three/drei';
import * as THREE from 'three';
import RoomShell from '../Studio/RoomShell';
import { useScene } from '../../../../context/SceneContext';
import { useAchievements } from '../../../../context/AchievementsContext';
import { usePerformance } from '../../../../context/PerformanceContext';
import { VISION, TEAM, METHOD, STATS } from './aboutData';

// Miora Brief 5 — warm atelier dimensions (matches Studio vestibule alignment)
const ROOM_WIDTH = 10;
const ROOM_HEIGHT = 4.0;
const ROOM_DEPTH = 10;
const SHELL_Z_OFFSET = -ROOM_DEPTH / 2 + 2;

// Free-roam (same contract as StudioRoom: camera only after isInRoom === true)
const ROOM_ROAM_RADIUS = 3.5;
const MOVE_SENSITIVITY = 0.0035;
const TOUCH_MOVE_SENSITIVITY = 0.012;
const MOVE_DECAY = 0.9;
const LOOK_YAW_RANGE = 0.85;
const LOOK_PITCH_RANGE = 0.25;
const LOOK_SMOOTHING = 0.06;

/**
 * Create a paper-card canvas texture (cream #F7F4EE + ink). Shared for wall panels.
 * Kept small (512) — Miora perf budget for room props.
 */
function makePaperTexture(title, subtitle, accent = '#9FE0BB') {
    const c = document.createElement('canvas');
    c.width = 512;
    c.height = 384;
    const ctx = c.getContext('2d');

    ctx.fillStyle = '#F7F4EE';
    ctx.fillRect(0, 0, c.width, c.height);

    // Tape strip (warm)
    ctx.fillStyle = 'rgba(255, 228, 181, 0.55)';
    ctx.fillRect(c.width * 0.35, 8, c.width * 0.3, 18);

    // Accent rule
    ctx.fillStyle = accent;
    ctx.fillRect(24, 48, 80, 4);

    ctx.fillStyle = '#1a1a1a';
    ctx.font = '700 42px Cabin Sketch, cursive';
    ctx.fillText(title, 24, 110);

    if (subtitle) {
        ctx.fillStyle = '#666666';
        ctx.font = '400 22px Sora, sans-serif';
        const words = subtitle.split(' ');
        let line = '';
        let y = 160;
        for (const w of words) {
            const test = line ? `${line} ${w}` : w;
            if (ctx.measureText(test).width > c.width - 48) {
                ctx.fillText(line, 24, y);
                line = w;
                y += 30;
            } else {
                line = test;
            }
        }
        if (line) ctx.fillText(line, 24, y);
    }

    // Sketch border
    ctx.strokeStyle = '#1a1a1a';
    ctx.lineWidth = 3;
    ctx.strokeRect(8, 8, c.width - 16, c.height - 16);

    const tex = new THREE.CanvasTexture(c);
    tex.colorSpace = THREE.SRGBColorSpace;
    tex.anisotropy = 4;
    return tex;
}

/**
 * Clickable paper panel on a wall — opens GlobalOverlay via openOverlay(data).
 */
const PaperPanel = memo(function PaperPanel({
    position,
    rotation = [0, 0, 0],
    width = 1.6,
    height = 1.2,
    title,
    subtitle,
    data,
    onOpen,
    accent,
}) {
    const tex = useMemo(() => makePaperTexture(title, subtitle, accent), [title, subtitle, accent]);

    useEffect(() => () => tex.dispose(), [tex]);

    return (
        <mesh
            position={position}
            rotation={rotation}
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
            <planeGeometry args={[width, height]} />
            <meshStandardMaterial map={tex} roughness={0.85} metalness={0} />
        </mesh>
    );
});

/**
 * AboutLighting — Miora atelier rig: warm key + amber fill + mint LED strip.
 * Tier-gated: LOW drops the mint strip and softens intensities.
 */
function AboutLighting({ roomHeight, roomDepth }) {
    const { tier } = usePerformance();
    const isLow = tier === 'LOW';

    return (
        <group>
            <hemisphereLight args={['#FFE4B5', '#2A1F14', isLow ? 0.35 : 0.55]} />
            <directionalLight
                position={[1.5, roomHeight * 1.4, roomDepth * 0.2]}
                intensity={isLow ? 0.7 : 1.15}
                color="#FFE4B5"
            />
            <pointLight
                position={[-2, roomHeight * 0.7, -1]}
                intensity={isLow ? 0.25 : 0.45}
                color="#E8A060"
                distance={8}
                decay={2}
            />
            {!isLow && (
                <pointLight
                    position={[3.2, roomHeight * 0.85, -2]}
                    intensity={0.55}
                    color="#9FE0BB"
                    distance={6}
                    decay={2}
                />
            )}
        </group>
    );
}

/**
 * AboutRoom — immersive Présentation atelier (Miora Brief 5 / Section A).
 *
 * Replaces the sky-flight paper-airplane experience with a warm study:
 * Vision / Team corkboard / Method shelves / Stats + central table.
 * Camera ownership: DoorSection during entry; free-roam ONLY once isInRoom.
 * Overlays use the existing openOverlay({title, description, …}) contract.
 */
const AboutRoom = ({ showRoom, onReady, isExiting, isWarmup }) => {
    const groupRef = useRef();
    const { camera } = useThree();
    const { settings } = usePerformance();
    const { openOverlay, overlayContent, isTeleporting, isInRoom } = useScene();
    const { showTutorial, unlockAchievement, hidePopup } = useAchievements();

    const overlayRef = useRef(overlayContent);
    useEffect(() => {
        overlayRef.current = overlayContent;
    }, [overlayContent]);

    useEffect(() => {
        if (isExiting || isTeleporting) hidePopup();
    }, [isExiting, isTeleporting, hidePopup]);

    // Ready signal (DoorSection waits on this / 8s fallback)
    const hasSignaledReady = useRef(false);
    const frameCount = useRef(0);
    useFrame(() => {
        if (hasSignaledReady.current) return;
        frameCount.current++;
        if (frameCount.current >= 5) {
            hasSignaledReady.current = true;
            onReady?.();
            if (!isWarmup) setTimeout(() => showTutorial('about_fly'), 2000);
        }
    });

    const handleOpen = useCallback((data) => {
        unlockAchievement('about_fly');
        openOverlay(data);
    }, [openOverlay, unlockAchievement]);

    // --- Free-roam camera (StudioRoom pattern) ---
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

    // Forward vector reused across frames (no alloc in useFrame)
    const forwardRef = useRef(new THREE.Vector3());

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

    // Corkboard card positions (left wall)
    const teamCards = useMemo(() => TEAM.map((m, i) => ({
        member: m,
        y: 2.4 - (i % 2) * 1.15,
        z: -1.2 - Math.floor(i / 2) * 1.5,
    })), []);

    // Method shelf cards (right wall)
    const methodCards = useMemo(() => METHOD.map((step, i) => ({
        step,
        y: 2.6 - i * 0.95,
        z: -2.5,
    })), []);

    return (
        <group ref={groupRef} position={[0, -1.2, 0]}>
            <group position={[0, 0, SHELL_Z_OFFSET]}>
                <RoomShell
                    width={ROOM_WIDTH}
                    height={ROOM_HEIGHT}
                    depth={ROOM_DEPTH}
                    wallColor="#1C1A22"
                    floorColor="#2A1F14"
                    ceilingColor="#252028"
                    shadowsEnabled={settings.shadows}
                />
                <AboutLighting roomHeight={ROOM_HEIGHT} roomDepth={ROOM_DEPTH} />

                {/* Central work table */}
                <mesh position={[0, 0.4, -1]} castShadow={settings.shadows} receiveShadow={settings.shadows}>
                    <boxGeometry args={[2.4, 0.08, 1.2]} />
                    <meshStandardMaterial color="#4A3728" roughness={0.75} />
                </mesh>
                {/* Table legs */}
                {[[-1.0, -0.45], [1.0, -0.45], [-1.0, 0.45], [1.0, 0.45]].map(([lx, lz], i) => (
                    <mesh key={i} position={[lx, 0.2, -1 + lz]} castShadow={settings.shadows}>
                        <boxGeometry args={[0.08, 0.4, 0.08]} />
                        <meshStandardMaterial color="#3D2B1A" roughness={0.8} />
                    </mesh>
                ))}

                {/* Vision panel — back wall left */}
                <PaperPanel
                    position={[-2.2, 2.2, -ROOM_DEPTH / 2 + 0.05]}
                    width={2.2}
                    height={1.5}
                    title="Notre Vision"
                    subtitle={VISION.description.slice(0, 90) + '…'}
                    data={VISION}
                    onOpen={handleOpen}
                    accent="#9FE0BB"
                />

                {/* Stats panel — back wall right */}
                <PaperPanel
                    position={[2.2, 2.2, -ROOM_DEPTH / 2 + 0.05]}
                    width={1.8}
                    height={1.3}
                    title="3 · 12 · 4"
                    subtitle="Ans · Projets · Secteurs"
                    data={STATS}
                    onOpen={handleOpen}
                    accent="#FFE4B5"
                />

                {/* Corkboard base — left wall */}
                <mesh position={[-ROOM_WIDTH / 2 + 0.04, 2.0, -2.2]} rotation={[0, Math.PI / 2, 0]}>
                    <planeGeometry args={[4.2, 2.8]} />
                    <meshStandardMaterial color="#8B6B4A" roughness={0.95} />
                </mesh>
                <Text
                    position={[-ROOM_WIDTH / 2 + 0.08, 3.3, -2.2]}
                    rotation={[0, Math.PI / 2, 0]}
                    font="/fonts/CabinSketch-Bold.ttf"
                    fontSize={0.22}
                    color="#F7F4EE"
                    anchorX="center"
                    anchorY="middle"
                >
                    Équipe
                </Text>
                {teamCards.map(({ member, y, z }) => (
                    <PaperPanel
                        key={member.id}
                        position={[-ROOM_WIDTH / 2 + 0.1, y, z]}
                        rotation={[0, Math.PI / 2, 0]}
                        width={1.3}
                        height={0.95}
                        title={member.title}
                        subtitle={member.date}
                        data={member}
                        onOpen={handleOpen}
                        accent="#9FE0BB"
                    />
                ))}

                {/* Method shelves — right wall (mint LED strip + cards) */}
                <mesh position={[ROOM_WIDTH / 2 - 0.04, 2.0, -2.5]} rotation={[0, -Math.PI / 2, 0]}>
                    <planeGeometry args={[3.2, 3.0]} />
                    <meshStandardMaterial color="#252028" roughness={0.9} />
                </mesh>
                {/* Mint LED strip */}
                <mesh position={[ROOM_WIDTH / 2 - 0.06, 3.45, -2.5]} rotation={[0, -Math.PI / 2, 0]}>
                    <boxGeometry args={[3.0, 0.06, 0.04]} />
                    <meshStandardMaterial
                        color="#9FE0BB"
                        emissive="#9FE0BB"
                        emissiveIntensity={tierEmissive(settings)}
                    />
                </mesh>
                <Text
                    position={[ROOM_WIDTH / 2 - 0.08, 3.2, -2.5]}
                    rotation={[0, -Math.PI / 2, 0]}
                    font="/fonts/CabinSketch-Bold.ttf"
                    fontSize={0.2}
                    color="#9FE0BB"
                    anchorX="center"
                    anchorY="middle"
                >
                    Démarche
                </Text>
                {methodCards.map(({ step, y, z }) => (
                    <PaperPanel
                        key={step.id}
                        position={[ROOM_WIDTH / 2 - 0.1, y, z]}
                        rotation={[0, -Math.PI / 2, 0]}
                        width={1.5}
                        height={0.8}
                        title={step.title}
                        subtitle={step.description.slice(0, 60) + '…'}
                        data={step}
                        onOpen={handleOpen}
                        accent="#9FE0BB"
                    />
                ))}

                {/* Floor label hint */}
                <Text
                    position={[0, 0.02, 1.2]}
                    rotation={[-Math.PI / 2, 0, 0]}
                    font="/fonts/CabinSketch-Regular.ttf"
                    fontSize={0.18}
                    color="#9FE0BB"
                    anchorX="center"
                    anchorY="middle"
                >
                    Cliquez les panneaux — Présentation Hakkilo XR
                </Text>
            </group>
        </group>
    );
};

function tierEmissive(settings) {
    // Soft mint glow; shadows flag is a proxy for HIGH/MEDIUM capability
    return settings?.shadows ? 1.4 : 0.6;
}

export default AboutRoom;
