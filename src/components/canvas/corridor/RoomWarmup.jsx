import { useRef, useState, useEffect, Suspense } from 'react';
import { useFrame, useThree } from '@react-three/fiber';
import { bootLog } from '../../../utils/debugBoot';

// Eagerly import all room components
import GalleryRoom from '../rooms/Gallery/GalleryRoom';
import StudioRoom from '../rooms/Studio/StudioRoom';
import AboutRoom from '../rooms/About/AboutRoom';
import ContactRoom from '../rooms/Contact/ContactRoom';

// Some drivers never settle compileAsync (fable/012) — warmup is an optimization,
// never a gate, so every compile pass is capped and the boot continues regardless.
const COMPILE_GUARD_MS = 8000;
// Cap on waiting for the 4 rooms' Suspense to resolve during the background pass.
const ROOMS_MOUNT_GUARD_MS = 15000;

// Mounts only once the sibling room's Suspense resolves — signals the room is live.
const WarmupProbe = ({ onMount }) => {
    useEffect(() => { onMount(); }, [onMount]);
    return null;
};

/**
 * RoomWarmup Component (two-phase since fable/013)
 *
 * Phase 'visible': compiles only what is already mounted (ville / entrance /
 * corridor) after a few frames, then fires onWarmupComplete so the preloader can
 * exit. Boot no longer waits for the 4 rooms' assets + shaders.
 *
 * Phase 'rooms': in the background (preloader already leaving), mounts all
 * 4 rooms 500 units below the scene, waits for their Suspense to resolve,
 * compiles their shaders, then unmounts them. First room entry stays
 * stutter-free as long as the user doesn't enter within the first seconds.
 *
 * Low tier: no room mounting at all (WebGL Context Lost risk) and no compile —
 * same as the previous behavior.
 */
const RoomWarmup = ({ onWarmupComplete, isLowTier }) => {
    const [phase, setPhase] = useState('visible');
    const frameCount = useRef(0);
    const loggedPhase = useRef(null);
    const compileStarted = useRef(false);
    const roomsMounted = useRef(0);
    const phaseStart = useRef(performance.now());
    const { gl, scene, camera } = useThree();

    const compileScene = (onDone) => {
        let settled = false;
        const finishOnce = () => {
            if (settled) return;
            settled = true;
            onDone();
        };
        if (!gl.compileAsync) {
            gl.compile(scene, camera);
            finishOnce();
            return;
        }
        setTimeout(() => {
            if (!settled) {
                console.warn(`[RoomWarmup] compileAsync did not settle within ${COMPILE_GUARD_MS}ms (driver issue?) — continuing`);
                finishOnce();
            }
        }, COMPILE_GUARD_MS);
        gl.compileAsync(scene, camera, scene)
            .then(() => {
                bootLog('RoomWarmup: compileAsync résolu');
                finishOnce();
            })
            .catch((err) => {
                console.error('Async compilation failed, falling back to sync', err);
                if (!settled) gl.compile(scene, camera);
                finishOnce();
            });
    };

    useFrame(() => {
        if (phase === 'done' || compileStarted.current) return;

        frameCount.current++;
        if (loggedPhase.current !== phase) {
            loggedPhase.current = phase;
            bootLog(`RoomWarmup: 1ʳᵉ frame de la phase '${phase}', isLowTier =`, isLowTier);
        }

        if (phase === 'visible') {
            // For low tier, we skip compilation, but still wait 1 frame for entrance to mount
            const targetFrames = isLowTier ? 1 : 3;
            if (frameCount.current < targetFrames) return;
            compileStarted.current = true;

            const release = () => {
                const duration = ((performance.now() - phaseStart.current) / 1000).toFixed(2);
                bootLog(`RoomWarmup: scène visible compilée en ${duration}s — RAF avant onWarmupComplete`);
                requestAnimationFrame(() => {
                    bootLog('RoomWarmup: onWarmupComplete →');
                    onWarmupComplete?.();
                    if (isLowTier) {
                        // Never mount the rooms on low end devices (Context Lost risk)
                        setPhase('done');
                        return;
                    }
                    frameCount.current = 0;
                    compileStarted.current = false;
                    phaseStart.current = performance.now();
                    setPhase('rooms');
                });
            };

            if (isLowTier) {
                release();
                return;
            }
            compileScene(release);
            return;
        }

        // phase 'rooms': rooms are mounted below the floor. Wait until their
        // Suspense resolved (or the guard expires), let them render 2 frames so
        // geometry/textures reach the GPU path, then compile and self-destruct.
        const allMounted = roomsMounted.current >= 4;
        const timedOut = performance.now() - phaseStart.current > ROOMS_MOUNT_GUARD_MS;
        if (!allMounted && !timedOut) {
            frameCount.current = 0;
            return;
        }
        if (frameCount.current < 2) return;
        compileStarted.current = true;
        if (timedOut && !allMounted) {
            console.warn(`[RoomWarmup] only ${roomsMounted.current}/4 rooms resolved within ${ROOMS_MOUNT_GUARD_MS}ms — compiling what is there`);
        }
        compileScene(() => {
            const duration = ((performance.now() - phaseStart.current) / 1000).toFixed(2);
            bootLog(`RoomWarmup: 4 salles compilées en arrière-plan en ${duration}s`);
            setPhase('done');
        });
    });

    if (phase !== 'rooms') return null;

    // Dummy handlers to prevent errors (rooms expect these props)
    const noop = () => {};
    const markMounted = () => { roomsMounted.current++; };

    return (
        <group position={[0, -500, 0]}>
            {/* Mount all rooms in Suspense - positioned far below camera */}
            <Suspense fallback={null}>
                <group position={[-20, 0, 0]}>
                    <GalleryRoom showRoom={true} onReady={noop} isExiting={false} isWarmup={true} />
                </group>
                <WarmupProbe onMount={markMounted} />
            </Suspense>
            <Suspense fallback={null}>
                <group position={[20, 0, 0]}>
                    <StudioRoom showRoom={true} onReady={noop} isExiting={false} isWarmup={true} />
                </group>
                <WarmupProbe onMount={markMounted} />
            </Suspense>
            <Suspense fallback={null}>
                <group position={[-20, 0, -50]}>
                    <AboutRoom showRoom={true} onReady={noop} isExiting={false} isWarmup={true} />
                </group>
                <WarmupProbe onMount={markMounted} />
            </Suspense>
            <Suspense fallback={null}>
                <group position={[20, 0, -50]}>
                    <ContactRoom showRoom={true} onReady={noop} isExiting={false} isWarmup={true} />
                </group>
                <WarmupProbe onMount={markMounted} />
            </Suspense>
        </group>
    );
};

export default RoomWarmup;
