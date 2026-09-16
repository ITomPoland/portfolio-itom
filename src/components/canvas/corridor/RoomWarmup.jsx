import { useEffect, useRef } from 'react';
import { useFrame, useThree } from '@react-three/fiber';

// Prepare only the mounted entrance/corridor. Mounting four hidden rooms here
// used to run their physics, upload textures, and immediately destroy them.
const RoomWarmup = ({ onWarmupComplete, isLowTier }) => {
    const started = useRef(false);
    const mounted = useRef(false);
    const { gl, scene, camera } = useThree();

    useEffect(() => {
        mounted.current = true;
        return () => { mounted.current = false; };
    }, []);

    useFrame(() => {
        if (started.current) return;
        started.current = true;

        const finish = () => {
            if (mounted.current) onWarmupComplete?.();
        };

        if (isLowTier || !gl.compileAsync) {
            finish();
            return;
        }

        gl.compileAsync(scene, camera).then(finish).catch(() => {
            // Normal rendering compiles any remaining shaders; do not repeat
            // the work in a blocking synchronous compilation on failure.
            finish();
        });
    });

    return null;
};

export default RoomWarmup;
