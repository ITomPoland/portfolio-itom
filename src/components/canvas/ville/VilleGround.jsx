import React from 'react';
import * as THREE from 'three';

/**
 * VilleGround Component
 * Renders the flat environment of the city: ground, plaza, streets, sidewalks, and markings.
 * Employs exact coordinates, dimensions, and Y-offsets to prevent z-fighting.
 */
export default function VilleGround({ textures, nightRef }) {
    const _ = nightRef; // Signature consistency


    // Generate markings array to render declaratively
    const markings = [];
    for (let i = 0; i < 12; i++) {
        const offset = 24 + i * 6;
        markings.push(
            // North/South lanes
            { position: [0, 0.03, offset], rotationZ: 0 },
            { position: [0, 0.03, -offset], rotationZ: 0 },
            // East/West lanes
            { position: [offset, 0.03, 0], rotationZ: Math.PI / 2 },
            { position: [-offset, 0.03, 0], rotationZ: Math.PI / 2 }
        );
    }

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

            {/* 5. Marquages plaza */}
            {markings.map((m, idx) => (
                <mesh 
                    key={idx} 
                    position={m.position} 
                    rotation-x={-Math.PI / 2} 
                    rotation-z={m.rotationZ}
                >
                    <planeGeometry args={[0.26, 2.2]} />
                    <meshBasicMaterial color="#E09F3E" />
                </mesh>
            ))}
        </group>
    );
}
