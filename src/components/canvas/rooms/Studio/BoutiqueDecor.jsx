import { useMemo } from 'react';
import * as THREE from 'three';

/**
 * BoutiqueDecor — Additional decorative elements for the Studio (Boutique) Room.
 * Standard Three.js primitives and MeshStandardMaterial to keep resource overhead low.
 * Follows the device tier / settings parameters for shadows when applicable.
 * 
 * Elements:
 * 1. Central Pedestal (Socle) under floating products with emissive accent line.
 * 2. 3 Wall Art Frames (left, right, back wall) with custom color placeholder paintings.
 * 3. Ceiling architectural light panel fixture.
 */
const BoutiqueDecor = ({ shadowsEnabled = true }) => {
    // Memoize materials to prevent recreation across re-renders
    const materials = useMemo(() => {
        return {
            pedestalBody: new THREE.MeshStandardMaterial({
                color: '#1a1a1f',
                roughness: 0.4,
                metalness: 0.7,
            }),
            pedestalAccent: new THREE.MeshStandardMaterial({
                color: '#00d4ff',
                emissive: '#00d4ff',
                emissiveIntensity: 1.5,
            }),
            frameBorder: new THREE.MeshStandardMaterial({
                color: '#2a2a2d',
                roughness: 0.6,
                metalness: 0.1,
            }),
            canvasLeft: new THREE.MeshStandardMaterial({
                color: '#0f172a', // Sleek dark blue
                roughness: 0.9,
                metalness: 0.0,
            }),
            canvasRight: new THREE.MeshStandardMaterial({
                color: '#311042', // Rich plum
                roughness: 0.9,
                metalness: 0.0,
            }),
            canvasBack: new THREE.MeshStandardMaterial({
                color: '#0d2818', // Deep forest green
                roughness: 0.9,
                metalness: 0.0,
            }),
            ceilingPanel: new THREE.MeshStandardMaterial({
                color: '#e2e8f0',
                roughness: 0.7,
                metalness: 0.1,
            }),
            ceilingLight: new THREE.MeshStandardMaterial({
                color: '#ffffff',
                emissive: '#e0f2fe',
                emissiveIntensity: 1.0,
            }),
        };
    }, []);

    return (
        <group>
            {/* 1. PEDESTAL (Socle) */}
            <group position={[0, 0, 0]}>
                {/* Pedestal Base Body */}
                <mesh position={[0, 0.425, 0]} receiveShadow={shadowsEnabled} castShadow={shadowsEnabled}>
                    <cylinderGeometry args={[1.4, 1.4, 0.85, 32]} />
                    <primitive object={materials.pedestalBody} attach="material" />
                </mesh>
                {/* Emissive Accent Strip Ring */}
                <mesh position={[0, 0.865, 0]}>
                    <cylinderGeometry args={[1.405, 1.405, 0.03, 32, 1, true]} />
                    <primitive object={materials.pedestalAccent} attach="material" />
                </mesh>
                {/* Pedestal Top Lid */}
                <mesh position={[0, 0.89, 0]} receiveShadow={shadowsEnabled}>
                    <cylinderGeometry args={[1.39, 1.39, 0.02, 32]} />
                    <primitive object={materials.pedestalBody} attach="material" />
                </mesh>
            </group>

            {/* 2. ART FRAMES ON WALLS */}
            {/* Left Wall Frame (-X facing +X) */}
            <group position={[-4.95, 1.7, -1]} rotation={[0, Math.PI / 2, 0]}>
                {/* Boarder Frame */}
                <mesh castShadow={shadowsEnabled}>
                    <boxGeometry args={[1.2, 1.6, 0.05]} />
                    <primitive object={materials.frameBorder} attach="material" />
                </mesh>
                {/* Canvas */}
                <mesh position={[0, 0, 0.03]}>
                    <planeGeometry args={[1.08, 1.48]} />
                    <primitive object={materials.canvasLeft} attach="material" />
                </mesh>
            </group>

            {/* Right Wall Frame (+X facing -X) */}
            <group position={[4.95, 1.7, -1]} rotation={[0, -Math.PI / 2, 0]}>
                {/* Boarder Frame */}
                <mesh castShadow={shadowsEnabled}>
                    <boxGeometry args={[1.2, 1.6, 0.05]} />
                    <primitive object={materials.frameBorder} attach="material" />
                </mesh>
                {/* Canvas */}
                <mesh position={[0, 0, 0.03]}>
                    <planeGeometry args={[1.08, 1.48]} />
                    <primitive object={materials.canvasRight} attach="material" />
                </mesh>
            </group>

            {/* Back Wall Frame (-Z facing +Z) */}
            <group position={[0, 1.7, -4.95]} rotation={[0, 0, 0]}>
                {/* Boarder Frame */}
                <mesh castShadow={shadowsEnabled}>
                    <boxGeometry args={[1.2, 1.6, 0.05]} />
                    <primitive object={materials.frameBorder} attach="material" />
                </mesh>
                {/* Canvas */}
                <mesh position={[0, 0, 0.03]}>
                    <planeGeometry args={[1.08, 1.48]} />
                    <primitive object={materials.canvasBack} attach="material" />
                </mesh>
            </group>

            {/* 3. CEILING LIGHT FIXTURE */}
            <group position={[0, 4.15, 0]}>
                {/* Fixture Shell */}
                <mesh position={[0, 0.025, 0]}>
                    <boxGeometry args={[2.0, 0.05, 2.0]} />
                    <primitive object={materials.ceilingPanel} attach="material" />
                </mesh>
                {/* Emissive Glow panel face */}
                <mesh position={[0, -0.001, 0]} rotation={[Math.PI / 2, 0, 0]}>
                    <planeGeometry args={[1.8, 1.8]} />
                    <primitive object={materials.ceilingLight} attach="material" />
                </mesh>
            </group>
        </group>
    );
};

export default BoutiqueDecor;
