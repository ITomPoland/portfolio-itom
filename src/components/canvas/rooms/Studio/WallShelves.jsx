import { useMemo, useCallback } from 'react';
import * as THREE from 'three';
import { useScene } from '../../../../context/SceneContext';
import { PRODUCTS } from './productData';
import { PRODUCT_MODELS } from './ProductModels';

/**
 * WallShelves — Renders decorative shelves on the walls of the Studio Room
 * with interactive products on them that open their respective details overlay on click.
 *
 * Placements:
 * - Left wall shelf: under the art frame, at x=-4.85, y=1.05, z=-1. Rotation faces +X (toward center).
 * - Right wall shelf: under the art frame, at x=4.85, y=1.05, z=-1. Rotation faces -X (toward center).
 * - Back wall shelf: under the art frame, at x=0, y=1.05, z=-4.85. Rotation faces +Z (toward center).
 */
const WallShelves = ({ shadowsEnabled = true }) => {
    const { openOverlay } = useScene();

    // Memoize the shelf materials and supports
    const materials = useMemo(() => {
        return {
            shelfWood: new THREE.MeshStandardMaterial({
                color: '#2a2a2d',
                roughness: 0.6,
                metalness: 0.1,
            }),
            shelfBracket: new THREE.MeshStandardMaterial({
                color: '#1a1a1f',
                roughness: 0.5,
                metalness: 0.5,
            }),
        };
    }, []);

    // Find the products to display on the shelves
    const shelfProducts = useMemo(() => {
        // Find by category or id from productData.js
        const drone = PRODUCTS.find((p) => p.category === 'drone') || PRODUCTS[3];
        const scanner = PRODUCTS.find((p) => p.category === 'scanner3d') || PRODUCTS[4];
        const controller = PRODUCTS.find((p) => p.category === 'controller') || PRODUCTS[5];
        const basestation = PRODUCTS.find((p) => p.category === 'basestation') || PRODUCTS[6];
        const glove = PRODUCTS.find((p) => p.category === 'hapticglove') || PRODUCTS[7];

        return {
            drone,
            scanner,
            controller,
            basestation,
            glove,
        };
    }, []);

    // Pointer cursor utilities
    const handlePointerOver = useCallback((e) => {
        e.stopPropagation();
        document.body.style.cursor = 'pointer';
    }, []);

    const handlePointerOut = useCallback(() => {
        document.body.style.cursor = 'auto';
    }, []);

    // Generic click handler to open the respective product overlay
    const handleProductClick = useCallback((product, e) => {
        if (!product) return;
        e.stopPropagation();
        openOverlay(product);
    }, [openOverlay]);

    return (
        <group>
            {/* ====================================================
                LEFT WALL SHELF & PRODUCTS (x ≈ -4.85)
               ==================================================== */}
            <group position={[-4.82, 1.05, -1]} rotation={[0, Math.PI / 2, 0]}>
                {/* Wooden Board */}
                <mesh castShadow={shadowsEnabled} receiveShadow={shadowsEnabled}>
                    <boxGeometry args={[1.6, 0.04, 0.38]} />
                    <primitive object={materials.shelfWood} attach="material" />
                </mesh>
                {/* Left Support Bracket */}
                <mesh position={[-0.6, -0.12, -0.1]} castShadow={shadowsEnabled}>
                    <boxGeometry args={[0.04, 0.2, 0.15]} />
                    <primitive object={materials.shelfBracket} attach="material" />
                </mesh>
                {/* Right Support Bracket */}
                <mesh position={[0.6, -0.12, -0.1]} castShadow={shadowsEnabled}>
                    <boxGeometry args={[0.04, 0.2, 0.15]} />
                    <primitive object={materials.shelfBracket} attach="material" />
                </mesh>

                {/* Left Shelf Product 1: Drone (ScanFly) */}
                {shelfProducts.drone && (
                    <group
                        position={[-0.35, 0.14, 0.02]}
                        rotation={[0, Math.PI / 4, 0]}
                        scale={0.8}
                        onClick={(e) => handleProductClick(shelfProducts.drone, e)}
                        onPointerOver={handlePointerOver}
                        onPointerOut={handlePointerOut}
                    >
                        {(() => {
                            const Model = PRODUCT_MODELS.drone;
                            return Model ? <Model /> : null;
                        })()}
                    </group>
                )}

                {/* Left Shelf Product 2: Scanner (ScanHand) */}
                {shelfProducts.scanner && (
                    <group
                        position={[0.35, 0.12, 0.0]}
                        rotation={[0.1, -Math.PI / 2.2, 0]}
                        scale={0.9}
                        onClick={(e) => handleProductClick(shelfProducts.scanner, e)}
                        onPointerOver={handlePointerOver}
                        onPointerOut={handlePointerOut}
                    >
                        {(() => {
                            const Model = PRODUCT_MODELS.scanner3d;
                            return Model ? <Model /> : null;
                        })()}
                    </group>
                )}
            </group>

            {/* ====================================================
                RIGHT WALL SHELF & PRODUCTS (x ≈ 4.82)
               ==================================================== */}
            <group position={[4.82, 1.05, -1]} rotation={[0, -Math.PI / 2, 0]}>
                {/* Wooden Board */}
                <mesh castShadow={shadowsEnabled} receiveShadow={shadowsEnabled}>
                    <boxGeometry args={[1.6, 0.04, 0.38]} />
                    <primitive object={materials.shelfWood} attach="material" />
                </mesh>
                {/* Left Support Bracket */}
                <mesh position={[-0.6, -0.12, -0.1]} castShadow={shadowsEnabled}>
                    <boxGeometry args={[0.04, 0.2, 0.15]} />
                    <primitive object={materials.shelfBracket} attach="material" />
                </mesh>
                {/* Right Support Bracket */}
                <mesh position={[0.6, -0.12, -0.1]} castShadow={shadowsEnabled}>
                    <boxGeometry args={[0.04, 0.2, 0.15]} />
                    <primitive object={materials.shelfBracket} attach="material" />
                </mesh>

                {/* Right Shelf Product 1: Controller (Hakkilo Touch) */}
                {shelfProducts.controller && (
                    <group
                        position={[-0.35, 0.08, 0.02]}
                        rotation={[0, 0, 0]}
                        scale={0.95}
                        onClick={(e) => handleProductClick(shelfProducts.controller, e)}
                        onPointerOver={handlePointerOver}
                        onPointerOut={handlePointerOut}
                    >
                        {(() => {
                            const Model = PRODUCT_MODELS.controller;
                            return Model ? <Model /> : null;
                        })()}
                    </group>
                )}

                {/* Right Shelf Product 2: Glove (Hakkilo Glove) */}
                {shelfProducts.glove && (
                    <group
                        position={[0.35, 0.1, 0.0]}
                        rotation={[Math.PI / 2.2, Math.PI / 2.5, 0]}
                        scale={0.9}
                        onClick={(e) => handleProductClick(shelfProducts.glove, e)}
                        onPointerOver={handlePointerOver}
                        onPointerOut={handlePointerOut}
                    >
                        {(() => {
                            const Model = PRODUCT_MODELS.hapticglove;
                            return Model ? <Model /> : null;
                        })()}
                    </group>
                )}
            </group>

            {/* ====================================================
                BACK WALL SHELF & PRODUCTS (z ≈ -4.82)
               ==================================================== */}
            <group position={[0, 1.05, -4.82]} rotation={[0, 0, 0]}>
                {/* Wooden Board */}
                <mesh castShadow={shadowsEnabled} receiveShadow={shadowsEnabled}>
                    <boxGeometry args={[1.4, 0.04, 0.38]} />
                    <primitive object={materials.shelfWood} attach="material" />
                </mesh>
                {/* Left Support Bracket */}
                <mesh position={[-0.5, -0.12, -0.1]} castShadow={shadowsEnabled}>
                    <boxGeometry args={[0.04, 0.2, 0.15]} />
                    <primitive object={materials.shelfBracket} attach="material" />
                </mesh>
                {/* Right Support Bracket */}
                <mesh position={[0.5, -0.12, -0.1]} castShadow={shadowsEnabled}>
                    <boxGeometry args={[0.04, 0.2, 0.15]} />
                    <primitive object={materials.shelfBracket} attach="material" />
                </mesh>

                {/* Back Shelf Product 1: Base Station (Hakkilo Anchor) */}
                {shelfProducts.basestation && (
                    <group
                        position={[0, 0.12, 0.0]}
                        rotation={[0, Math.PI, 0]}
                        scale={0.9}
                        onClick={(e) => handleProductClick(shelfProducts.basestation, e)}
                        onPointerOver={handlePointerOver}
                        onPointerOut={handlePointerOut}
                    >
                        {(() => {
                            const Model = PRODUCT_MODELS.basestation;
                            return Model ? <Model /> : null;
                        })()}
                    </group>
                )}
            </group>
        </group>
    );
};

export default WallShelves;
