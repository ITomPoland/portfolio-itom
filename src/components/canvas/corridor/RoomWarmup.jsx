import { useRef, useState, Suspense } from 'react';
import { useFrame, useThree } from '@react-three/fiber';
import { bootLog } from '../../../utils/debugBoot';

// Eagerly import all room components
import GalleryRoom from '../rooms/Gallery/GalleryRoom';
import StudioRoom from '../rooms/Studio/StudioRoom';
import AboutRoom from '../rooms/About/AboutRoom';
import ContactRoom from '../rooms/Contact/ContactRoom';

/**
 * RoomWarmup Component
 * 
 * Mounts all 4 rooms off-screen during the preloader phase to force
 * shader compilation and texture upload to GPU. After a few frames,
 * it unmounts the rooms to free memory. This ensures the first room
 * entry has zero shader compilation stutter.
 * 
 * Positioned 500 units below the scene so nothing is visible.
 * Audio components won't be audible at this distance.
 */
const RoomWarmup = ({ onWarmupComplete, isLowTier }) => {
    const [isDone, setIsDone] = useState(false);
    const frameCount = useRef(0);
    const completeFired = useRef(false);
    const { gl, scene, camera } = useThree();

    // Wait for rooms to render a few frames, then compile and unmount
    const warmupStart = useRef(performance.now());

    useFrame(() => {
        if (isDone || completeFired.current) return;

        frameCount.current++;
        if (frameCount.current === 1) {
            bootLog('RoomWarmup: 1ʳᵉ frame (boucle RAF active), isLowTier =', isLowTier);
        }

        // For low tier, we skip warmup, but still wait 1 frame for entrance to mount
        const targetFrames = isLowTier ? 1 : 3;

        if (frameCount.current >= targetFrames) {
            completeFired.current = true;

            const finishWarmup = () => {
                const warmupDuration = ((performance.now() - warmupStart.current) / 1000).toFixed(2);
                bootLog(`RoomWarmup: warmup fini en ${warmupDuration}s — RAF avant onWarmupComplete`);

                requestAnimationFrame(() => {
                    bootLog('RoomWarmup: onWarmupComplete →');
                    setIsDone(true);
                    onWarmupComplete?.();
                });
            };

            // On low tier, bypass intense gl.compileAsync to save memory and avoid Context Lost
            if (isLowTier) {
                finishWarmup();
                return;
            }

            // Force compile all shaders in the scene (including warm-up rooms)
            // Use 2026 compileAsync to avoid blocking the main thread!
            bootLog('RoomWarmup: frames atteintes — compileAsync dispo ?', !!gl.compileAsync);
            if (gl.compileAsync) {
                // Some drivers (seen: Mesa/Iris + KHR_parallel_shader_compile) never
                // report compile completion, so the promise would hang the preloader
                // at 90% forever with zero errors. Warmup is an optimization, not a
                // requirement: give it 8s, then ship the scene and let shaders
                // compile lazily on first use.
                let settled = false;
                const finishOnce = () => {
                    if (settled) return;
                    settled = true;
                    finishWarmup();
                };
                setTimeout(() => {
                    if (!settled) {
                        console.warn('[RoomWarmup] compileAsync did not settle within 8s (driver issue?) — continuing without warmup');
                        finishOnce();
                    }
                }, 8000);
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
            } else {
                gl.compile(scene, camera);
                finishWarmup();
            }
        }
    });

    if (isDone) return null;

    // Do not mount rooms at all on low end devices to prevent WebGL Context Lost
    if (isLowTier) return null;

    // Dummy handlers to prevent errors (rooms expect these props)
    const noop = () => {};

    return (
        <group position={[0, -500, 0]}>
            {/* Mount all rooms in Suspense - positioned far below camera */}
            <Suspense fallback={null}>
                <group position={[-20, 0, 0]}>
                    <GalleryRoom showRoom={true} onReady={noop} isExiting={false} isWarmup={true} />
                </group>
            </Suspense>
            <Suspense fallback={null}>
                <group position={[20, 0, 0]}>
                    <StudioRoom showRoom={true} onReady={noop} isExiting={false} isWarmup={true} />
                </group>
            </Suspense>
            <Suspense fallback={null}>
                <group position={[-20, 0, -50]}>
                    <AboutRoom showRoom={true} onReady={noop} isExiting={false} isWarmup={true} />
                </group>
            </Suspense>
            <Suspense fallback={null}>
                <group position={[20, 0, -50]}>
                    <ContactRoom showRoom={true} onReady={noop} isExiting={false} isWarmup={true} />
                </group>
            </Suspense>
        </group>
    );
};

export default RoomWarmup;
