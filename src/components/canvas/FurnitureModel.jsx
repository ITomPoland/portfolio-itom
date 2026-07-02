import { useMemo } from 'react';
import { useGLTF } from '@react-three/drei';

/**
 * FurnitureModel — thin wrapper around drei's useGLTF for placing real GLB/GLTF
 * props (furniture, plants, lamps) inside a room via the same data-driven
 * {position, rotation, scale} placement pattern already used for corridor decorations
 * (see CorridorDecorations.jsx) — swapped from flat-plane rendering to GLB rendering.
 */
const FurnitureModel = ({ path, position = [0, 0, 0], rotation = [0, 0, 0], scale = 1, castShadow = true, receiveShadow = true }) => {
    const { scene } = useGLTF(path);

    const cloned = useMemo(() => {
        const clone = scene.clone(true);
        clone.traverse((child) => {
            if (child.isMesh) {
                child.castShadow = castShadow;
                child.receiveShadow = receiveShadow;
            }
        });
        return clone;
    }, [scene, castShadow, receiveShadow]);

    return <primitive object={cloned} position={position} rotation={rotation} scale={scale} />;
};

export default FurnitureModel;
