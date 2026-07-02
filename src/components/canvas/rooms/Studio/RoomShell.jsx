import { useMemo } from 'react';
import * as THREE from 'three';

/**
 * RoomShell — real volumetric room geometry (floor/walls/ceiling) with PBR materials.
 * Replaces the flat, unlit planeGeometry+meshBasicMaterial shells used elsewhere in the app.
 *
 * Solid-color PBR materials for now (no baked-lighting pipeline available); swap in
 * tileable texture maps later (map/normalMap/roughnessMap) without changing this
 * component's structure.
 */
const RoomShell = ({
    width = 12,
    height = 4.5,
    depth = 12,
    wallColor = '#e8e4dc',
    floorColor = '#3a3a3d',
    ceilingColor = '#f5f4f0',
    shadowsEnabled = true,
}) => {
    const materials = useMemo(() => ({
        wall: new THREE.MeshStandardMaterial({ color: wallColor, roughness: 0.85, metalness: 0.0, side: THREE.DoubleSide }),
        floor: new THREE.MeshStandardMaterial({ color: floorColor, roughness: 0.3, metalness: 0.05, side: THREE.DoubleSide }),
        ceiling: new THREE.MeshStandardMaterial({ color: ceilingColor, roughness: 0.9, metalness: 0.0, side: THREE.DoubleSide }),
    }), [wallColor, floorColor, ceilingColor]);

    const halfW = width / 2;
    const halfD = depth / 2;

    return (
        <group>
            {/* Floor */}
            <mesh position={[0, 0, 0]} rotation={[-Math.PI / 2, 0, 0]} material={materials.floor} receiveShadow={shadowsEnabled}>
                <planeGeometry args={[width, depth]} />
            </mesh>

            {/* Ceiling */}
            <mesh position={[0, height, 0]} rotation={[Math.PI / 2, 0, 0]} material={materials.ceiling}>
                <planeGeometry args={[width, depth]} />
            </mesh>

            {/* Back wall (-Z) */}
            <mesh position={[0, height / 2, -halfD]} material={materials.wall} receiveShadow={shadowsEnabled}>
                <planeGeometry args={[width, height]} />
            </mesh>

            {/* Left wall (-X) */}
            <mesh position={[-halfW, height / 2, 0]} rotation={[0, Math.PI / 2, 0]} material={materials.wall} receiveShadow={shadowsEnabled}>
                <planeGeometry args={[depth, height]} />
            </mesh>

            {/* Right wall (+X) */}
            <mesh position={[halfW, height / 2, 0]} rotation={[0, -Math.PI / 2, 0]} material={materials.wall} receiveShadow={shadowsEnabled}>
                <planeGeometry args={[depth, height]} />
            </mesh>

            {/* Front (+Z) intentionally left open — the corridor threshold sits there. */}
        </group>
    );
};

export default RoomShell;
