import { useEffect } from 'react';
import { useThree } from '@react-three/fiber';
import { CAMERA_BASE_FOV, portraitFovFor } from '../components/canvas/ville/villeConfig';

/**
 * usePortraitFov — mobile-first portrait framing, mounted ONCE at the Experience root.
 *
 * R3F keeps camera.aspect in sync on resize but never touches fov; nothing else in the app
 * writes fov either (DoorSection only animates position/rotation), so this hook is the single
 * fov owner. In portrait (aspect < 1) it widens the vertical FOV via portraitFovFor so the
 * scene keeps its landscape breadth; reacts to resize/rotation through the R3F size state.
 */
export default function usePortraitFov() {
    const camera = useThree((s) => s.camera);
    const { width, height } = useThree((s) => s.size);

    /* eslint-disable react-hooks/immutability -- mutating the R3F camera is the supported
       imperative three.js pattern (same as camera.far in MiniVille); React state would fight
       the render loop. */
    useEffect(() => {
        const fov = portraitFovFor(width / height);
        if (camera.fov !== fov) {
            camera.fov = fov;
            camera.updateProjectionMatrix();
        }
    }, [camera, width, height]);

    // Restore the App.jsx default when the experience unmounts (route change / HMR).
    useEffect(() => () => {
        camera.fov = CAMERA_BASE_FOV;
        camera.updateProjectionMatrix();
    }, [camera]);
    /* eslint-enable react-hooks/immutability */
}
