import { useState, useCallback, useEffect, useRef } from 'react';
import { useFrame, useThree } from '@react-three/fiber';

import InfiniteCorridorManager from './corridor/InfiniteCorridorManager';
import EntranceDoors from './entrance/EntranceDoors';
import EmptyCorridor from './entrance/EmptyCorridor';
import TeleportRoom from './corridor/TeleportRoom';
import RoomWarmup from './corridor/RoomWarmup';
import PostProcessing from './PostProcessing';
import useInfiniteCamera from '../../hooks/useInfiniteCamera';
import usePortraitFov from '../../hooks/usePortraitFov';
import SignSystem from './entrance/SignSystem';
import { useScene } from '../../context/SceneContext';
import { bootLog } from '../../utils/debugBoot';
import { VILLE_MODE } from './ville/villeConfig';
import MiniVille from './ville/MiniVille';
import { Perf } from 'r3f-perf';

// Dev-only perf HUD (fable/007): `npm run dev` then add `?perf` to the URL. The DEV guard
// tree-shakes it out of production builds.
const SHOW_PERF = import.meta.env.DEV
    && typeof window !== 'undefined'
    && new URLSearchParams(window.location.search).has('perf');

// Positioning:
// - Segment -1's SegmentDoors are at Z=15
// - Entrance doors at Z=22 (in front of segment doors)
// - Hero text/Avatar at Z≈5.5
// - Camera starts at Z=28, ends at Z=8 (in front of avatar)
const ENTRANCE_DOORS_Z = 22;

/**
 * Experience Component
 * 
 * Flow:
 * 1. Preloader fades out -> user sees 3D entrance doors
 * 2. Click doors -> they open + camera flies through
 * 3. Behind doors: infinite corridor with hero text
 */
const Experience = ({ isLoaded, onSceneReady, performanceTier }) => {
    // Use SceneContext for room state
    const { hasEntered, markEntered, enterRoom, isTeleporting, isInRoom, teleportPhase, pendingDoorClick } = useScene();

    const { camera } = useThree();

    // Mobile-first: widen the vertical FOV in portrait (ville, entrance text, corridor).
    // Lives OUTSIDE useInfiniteCamera (invariant) — fov is orthogonal to its position work.
    usePortraitFov();

    useEffect(() => {
        bootLog('Experience monté (Suspense résolu)');
    }, []);

    // Camera control - both scroll and parallax only work after entering
    // Disable during teleporting to prevent scroll interference
    const { setCameraOverride } = useInfiniteCamera({
        segmentLength: 80,
        scrollSpeed: 0.025,
        parallaxIntensity: 0.4,
        smoothing: 0.06,
        scrollEnabled: !VILLE_MODE && hasEntered && !isTeleporting && !isInRoom,
        parallaxEnabled: !VILLE_MODE && hasEntered && !isTeleporting && !isInRoom
    });

    // NOTE: Camera override is now managed directly by DoorSection.jsx
    // We removed the useEffect that was calling setCameraOverride here because
    // it conflicted with DoorSection's direct control and caused camera jumps.
    // The scrollEnabled/parallaxEnabled props already handle disabling scroll when in room.


    // Handle entrance complete
    const handleEntranceComplete = useCallback(() => {
        markEntered();
    }, [markEntered]);

    // Handle door enter from inside corridor
    const handleDoorEnter = useCallback((doorId) => {
        enterRoom(doorId);
        // console.log('Entering:', doorId);
    }, [enterRoom]);

    // Optimization: Low tier has simpler lighting
    const isLowTier = performanceTier === 'LOW';

    return (
        <>
            {/* === ROOM WARM-UP (pre-renders all rooms off-screen during preloader) === */}
            {/* RoomWarmup mounts all 4 rooms 500 units below, compiles shaders via gl.compile(), 
                then self-destructs and signals onSceneReady. This ensures both corridor segments
                AND room shaders are pre-compiled before the user starts interacting. */}
            <RoomWarmup onWarmupComplete={onSceneReady} isLowTier={isLowTier} />

            {/* === GLOBAL LIGHTING === */}
            {/* Everything else in the app is meshBasicMaterial (unlit — ignores scene
                lights entirely), so this tiny fill only matters for the new lit PBR
                surfaces (Boutique door/shell). Without it, those materials render
                near-black/invisible from outside their own local lights' range. */}
            <hemisphereLight args={['#ffffff', '#3a3a3d', 0.25]} />
            {/* <ambientLight intensity={isLowTier ? 2.5 : 2.2} /> */}
            {/* <directionalLight
                position={[5, 10, 5]}
                intensity={0.8}
                color="#acacac"
                castShadow={!isLowTier}
                shadow-mapSize={[1024, 1024]}
            /> */}
            {/* <directionalLight position={[-5, 8, -10]} intensity={0.4} color="#ffffff" /> */}

            {SHOW_PERF && <Perf position="top-left" deepAnalyze />}

            {/* === MINI VILLE (open-city exterior — replaces the corridor when VILLE_MODE) === */}
            {VILLE_MODE && <MiniVille />}

            {/* === INFINITE CORRIDOR EXTERIOR (only when not in city mode) === */}
            {!VILLE_MODE && (
                <>
                    {!hasEntered && <EmptyCorridor camera={camera} />}
                    {!hasEntered && (
                        <EntranceDoors
                            position={[0, 0, ENTRANCE_DOORS_Z]}
                            onComplete={handleEntranceComplete}
                        />
                    )}
                    {!hasEntered && <SignSystem position={[0, 0, ENTRANCE_DOORS_Z]} />}
                </>
            )}

            {/* Corridor machinery. Always mounted in corridor mode; in VILLE_MODE mounted ONLY
                while teleporting / inside a room: DoorSection is the sole consumer of
                pendingDoorClick and the only caller of signalRoomReady (paper re-open), so
                without it the ville room-entry hung forever behind the closed paper (bug
                fable/008). The city hides itself meanwhile (MiniVille `cityHidden`) —
                corridor and rooms share its world coordinates. In VILLE_MODE the corridor
                must NOT mount during phase 'closing': the paper is still open over the
                city, so the corridor walls would visibly pop across the plaza (fable/014).
                It mounts once the paper is fully closed ('teleporting'). */}
            {(!VILLE_MODE || (isTeleporting && teleportPhase !== 'closing') || isInRoom) && (
                <InfiniteCorridorManager
                    onDoorEnter={handleDoorEnter}
                    hideDoorsForSegments={hasEntered ? [] : [-1]}
                    clipSegmentNeg1={!hasEntered}
                    setCameraOverride={setCameraOverride}
                />
            )}

            {/* === TELEPORT ROOM (renders room directly during teleportation) === */}
            <TeleportRoom />

            {/* === POSTPROCESSING (SSAO + Bloom for the real-3D Boutique room) === */}
            {/* Not mounted at all on LOW tier, to skip EffectComposer's render-target cost entirely. */}
            {performanceTier !== 'LOW' && <PostProcessing />}
        </>
    );
};

export default Experience;

