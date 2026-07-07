import React, { useRef, useLayoutEffect, useMemo } from 'react';
import * as THREE from 'three';

/**
 * VilleGround Component
 * Renders the flat environment of the city: ground, plaza, streets, sidewalks, and markings.
 * Employs exact coordinates, dimensions, and Y-offsets to prevent z-fighting.
 */
export default function VilleGround({ textures, nightRef }) {
    const _ = nightRef; // Signature consistency
    const markingsRef = useRef();

    // Lane markings — one InstancedMesh instead of 48 separate meshes (fable/007), same
    // exact transforms (rotation-x -PI/2 then rotation-z, XYZ Euler like the JSX props).
    const markings = useMemo(() => {
        const list = [];
        for (let i = 0; i < 12; i++) {
            const offset = 24 + i * 6;
            list.push(
                { position: [0, 0.03, offset], rotationZ: 0 },
                { position: [0, 0.03, -offset], rotationZ: 0 },
                { position: [offset, 0.03, 0], rotationZ: Math.PI / 2 },
                { position: [-offset, 0.03, 0], rotationZ: Math.PI / 2 },
            );
        }
        return list;
    }, []);

    useLayoutEffect(() => {
        const tempObj = new THREE.Object3D();
        markings.forEach((m, idx) => {
            tempObj.position.set(m.position[0], m.position[1], m.position[2]);
            tempObj.rotation.set(-Math.PI / 2, 0, m.rotationZ);
            tempObj.updateMatrix();
            markingsRef.current.setMatrixAt(idx, tempObj.matrix);
        });
        markingsRef.current.instanceMatrix.needsUpdate = true;
    }, [markings]);

    return (
        <group>
            {/* 1. Sol / Ground (dirt/laterite) */}
            <mesh rotation-x={-Math.PI / 2} receiveShadow>
                <planeGeometry args={[560, 560]} />
                <meshStandardMaterial 
                    map={textures.texTerre} 
                    roughness={1.0} 
                />
            </mesh>

            {/* 2. Rues / Streets (Asphalt) */}
            <mesh position={[0, 0.02, 0]} rotation-x={-Math.PI / 2} receiveShadow>
                <planeGeometry args={[9, 110]} />
                <meshStandardMaterial 
                    map={textures.texAsphalt} 
                    roughness={0.95} 
                />
            </mesh>
            <mesh position={[0, 0.02, 0]} rotation-x={-Math.PI / 2} rotation-z={Math.PI / 2} receiveShadow>
                <planeGeometry args={[9, 110]} />
                <meshStandardMaterial 
                    map={textures.texAsphalt} 
                    roughness={0.95} 
                />
            </mesh>

            {/* 3. Trottoirs / Sidewalks (Concrete/Béton) */}
            {[-6.4, 6.4].map((s, idx) => (
                <React.Fragment key={idx}>
                    {/* N-S aligned sidewalks */}
                    <mesh position={[s, 0.045, 0]} rotation-x={-Math.PI / 2} receiveShadow>
                        <planeGeometry args={[2.6, 110]} />
                        <meshStandardMaterial 
                            map={textures.texBeton} 
                            roughness={0.95} 
                        />
                    </mesh>
                    {/* E-W aligned sidewalks */}
                    <mesh position={[0, 0.045, s]} rotation-x={-Math.PI / 2} rotation-z={Math.PI / 2} receiveShadow>
                        <planeGeometry args={[2.6, 110]} />
                        <meshStandardMaterial 
                            map={textures.texBeton} 
                            roughness={0.95} 
                        />
                    </mesh>
                </React.Fragment>
            ))}

            {/* 4. Plaza (Place) */}
            <mesh position={[0, 0.05, 0]} rotation-x={-Math.PI / 2} receiveShadow>
                <circleGeometry args={[19, 48]} />
                <meshStandardMaterial 
                    map={textures.texPaves} 
                    roughness={0.9} 
                />
            </mesh>

            {/* 5. Marquages (48 instances, 1 draw call) */}
            <instancedMesh ref={markingsRef} args={[null, null, markings.length]}>
                <planeGeometry args={[0.26, 2.2]} />
                <meshBasicMaterial color="#E09F3E" />
            </instancedMesh>
        </group>
    );
}
