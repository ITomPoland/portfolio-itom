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
    wallColor = '#cfcac1',
    floorColor = '#6b655d',
    ceilingColor = '#efece7',
    shadowsEnabled = true,
}) => {
    const materials = useMemo(() => ({
        wall: new THREE.MeshStandardMaterial({ color: wallColor, roughness: 0.85, metalness: 0.0, side: THREE.DoubleSide }),
        floor: new THREE.MeshStandardMaterial({ color: floorColor, roughness: 0.92, metalness: 0.0, side: THREE.DoubleSide }),
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

            {/* Front (+Z) wall — two panels flanking a central doorway, so the room reads
                as fully ENCLOSED (kills the "see-through to the void" toward the door)
                while the doorway gap lines up with the corridor threshold. */}
            {(() => {
                // Must stay <= the vestibule's half-width (RoomInterior.jsx's ROOM_CONFIG.corridorWidth
                // is 2.2, i.e. walls at x=±1.1) or the flanking panels start further out than the
                // vestibule walls end, leaving a gap with no wall — a leak you can walk out through,
                // and a jarring seam where the vestibule's geometry shows through instead of this wall.
                const doorHalf = 1.0;             // half-width of the central doorway gap
                const panelW = halfW - doorHalf;  // width of each flanking front panel
                const panelCX = doorHalf + panelW / 2;
                return (
                    <>
                        <mesh position={[-panelCX, height / 2, halfD]} material={materials.wall} receiveShadow={shadowsEnabled}>
                            <planeGeometry args={[panelW, height]} />
                        </mesh>
                        <mesh position={[panelCX, height / 2, halfD]} material={materials.wall} receiveShadow={shadowsEnabled}>
                            <planeGeometry args={[panelW, height]} />
                        </mesh>
                    </>
                );
            })()}
        </group>
    );
};

export default RoomShell;
