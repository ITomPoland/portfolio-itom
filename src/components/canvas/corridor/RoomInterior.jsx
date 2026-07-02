import { useMemo, memo, Suspense, useEffect } from 'react';
import { Text } from '@react-three/drei';
import { useTexture } from '@react-three/drei';
import * as THREE from 'three';

// Eagerly import room components - textures are preloaded during the preloader phase
import GalleryRoom from '../rooms/Gallery/GalleryRoom';
import StudioRoom from '../rooms/Studio/StudioRoom';
import AboutRoom from '../rooms/About/AboutRoom';
import ContactRoom from '../rooms/Contact/ContactRoom';

// Room configurations
const ROOM_CONFIG = {
    corridorWidth: 2.2,   // Wider "vestibule" feeling
    corridorHeight: 2.4,  // frameHeight - 0.1
    corridorDepth: 2,     // Shorter - quick transition
    roomWidth: 30,
    roomHeight: 20,
    roomDepth: 25
};

const SUBTITLES = {
    'THE GALLERY': 'Explore my creative projects',
    'THE STUDIO': 'Watch behind the scenes',
    'DEV DIARY': 'My development journey',
    "LET'S CONNECT": 'Get in touch with me'
};

// Naturalny kafelek listwy: 1582x94px przy wysokości 0.15 → ~2.524 units szerokości
const NATURAL_TILE_W = (1582 / 94) * 0.15;

/**
 * RoomInterior Component
 *
 * Memoized room geometry to prevent re-renders and improve performance.
 * Contains corridor + giant room at the end.
 */
const RoomInterior = memo(({ label, showRoom, onReady, isExiting }) => {
    const { corridorWidth, corridorHeight, corridorDepth, roomWidth, roomHeight, roomDepth } = ROOM_CONFIG;
    const halfDepth = corridorDepth / 2;
    const roomZ = -corridorDepth - roomDepth / 2;

    // Load corridor textures
    const floorTexSrc = useTexture('/textures/corridor/kawalekpodlogi.webp');
    const wallTexSrc = useTexture('/textures/corridor/wall_texture.webp');
    const ceilingTexSrc = useTexture('/textures/corridor/ceiling_texture.webp');
    const bbTexSrc = useTexture('/textures/corridor/texturadoprogow.webp');

    // Memoize textured materials for mini-corridor
    const materials = useMemo(() => {
        // Floor
        const floorTex = floorTexSrc.clone();
        floorTex.needsUpdate = true;
        floorTex.wrapS = floorTex.wrapT = THREE.RepeatWrapping;
        floorTex.repeat.set(corridorDepth / 2.5, corridorWidth / 2.5);

        // Left wall
        const wallTexL = wallTexSrc.clone();
        wallTexL.needsUpdate = true;
        wallTexL.wrapS = wallTexL.wrapT = THREE.RepeatWrapping;
        wallTexL.repeat.set(corridorDepth / 2, corridorHeight / 2);

        // Right wall (same settings)
        const wallTexR = wallTexSrc.clone();
        wallTexR.needsUpdate = true;
        wallTexR.wrapS = wallTexR.wrapT = THREE.RepeatWrapping;
        wallTexR.repeat.set(corridorDepth / 2, corridorHeight / 2);

        // Ceiling
        const ceilTex = ceilingTexSrc.clone();
        ceilTex.needsUpdate = true;
        ceilTex.wrapS = ceilTex.wrapT = THREE.RepeatWrapping;
        ceilTex.repeat.set(corridorDepth / 2.5, corridorWidth / 2.5);

        // Baseboard left
        const bbLeft = bbTexSrc.clone();
        bbLeft.needsUpdate = true;
        bbLeft.wrapS = bbLeft.wrapT = THREE.RepeatWrapping;
        bbLeft.repeat.set(corridorDepth / NATURAL_TILE_W, 1);

        // Baseboard right
        const bbRight = bbTexSrc.clone();
        bbRight.needsUpdate = true;
        bbRight.wrapS = bbRight.wrapT = THREE.RepeatWrapping;
        bbRight.repeat.set(corridorDepth / NATURAL_TILE_W, 1);

        // Boutique gets a real-lit PBR vestibule (matches RoomShell.jsx's palette beyond the
        // threshold) instead of the flat sketch-textured mini-corridor used by the other 3 doors.
        const isStudioVestibule = label === 'THE STUDIO';

        return {
            corridorFloor: isStudioVestibule
                ? new THREE.MeshStandardMaterial({ color: '#3a3a3d', roughness: 0.3, metalness: 0.05, side: THREE.DoubleSide })
                : new THREE.MeshBasicMaterial({ color: '#e0e0e0', map: floorTex, side: THREE.DoubleSide }),
            corridorWallL: isStudioVestibule
                ? new THREE.MeshStandardMaterial({ color: '#e8e4dc', roughness: 0.85, side: THREE.DoubleSide })
                : new THREE.MeshBasicMaterial({ color: '#e0e0e0', map: wallTexL, side: THREE.DoubleSide }),
            corridorWallR: isStudioVestibule
                ? new THREE.MeshStandardMaterial({ color: '#e8e4dc', roughness: 0.85, side: THREE.DoubleSide })
                : new THREE.MeshBasicMaterial({ color: '#e0e0e0', map: wallTexR, side: THREE.DoubleSide }),
            corridorCeiling: isStudioVestibule
                ? new THREE.MeshStandardMaterial({ color: '#f5f4f0', roughness: 0.9, side: THREE.DoubleSide })
                : new THREE.MeshBasicMaterial({ color: '#e0e0e0', map: ceilTex, side: THREE.DoubleSide }),
            bbLeft: new THREE.MeshBasicMaterial({ color: '#e0e0e0',  map: bbLeft, side: THREE.DoubleSide }),
            bbRight: new THREE.MeshBasicMaterial({ color: '#e0e0e0',  map: bbRight, side: THREE.DoubleSide }),
            threshold: new THREE.MeshBasicMaterial({ color: '#e0e0e0', 
                map: (() => {
                    const t = bbTexSrc.clone();
                    t.needsUpdate = true;
                    t.wrapS = t.wrapT = THREE.RepeatWrapping;
                    t.repeat.set(corridorWidth / NATURAL_TILE_W, 1);
                    return t; })(),

                side: THREE.DoubleSide
            }),
            // Room materials (keep flat for rooms that have their own content)
            roomFloor: new THREE.MeshBasicMaterial({ color: '#e5e5e5', side: THREE.DoubleSide }),
            roomCeiling: new THREE.MeshBasicMaterial({ color: '#fafafa', side: THREE.DoubleSide }),
            roomWall: new THREE.MeshBasicMaterial({ color: '#f0f0f0', side: THREE.DoubleSide }),
            roomBackWall: new THREE.MeshBasicMaterial({ color: '#f5f5f5', side: THREE.DoubleSide }),
        };
    }, [floorTexSrc, wallTexSrc, ceilingTexSrc, bbTexSrc, label]);

    // Memoize geometries
    const geometries = useMemo(() => ({
        corridorSideWall: new THREE.PlaneGeometry(corridorDepth, corridorHeight),
        corridorFloorCeiling: new THREE.PlaneGeometry(corridorWidth, corridorDepth),
        corridorBaseboard: new THREE.PlaneGeometry(corridorDepth, 0.15),
        threshold: new THREE.PlaneGeometry(corridorWidth, 0.15),
        roomFloorCeiling: new THREE.PlaneGeometry(roomWidth, roomDepth),
        roomSideWall: new THREE.PlaneGeometry(roomDepth, roomHeight),
        roomBackWall: new THREE.PlaneGeometry(roomWidth, roomHeight)
    }), []);

    const isGallery = label === 'THE GALLERY';

    // Trigger onReady for generic rooms (which don't have their own component to do it)
    useEffect(() => {
        if (showRoom && !['THE GALLERY', 'THE STUDIO', 'THE ABOUT', "LET'S CONNECT"].includes(label)) {
            onReady?.();
        }
    }, [showRoom, label, onReady]);

    return (
        <group position={[0, -0.149, 0]}>
            {/* === CORRIDOR (The "Mini-Corridor" Transition) === */}
            {/* Left wall */}
            <mesh
                position={[-corridorWidth / 2, 0, -halfDepth]}
                rotation={[0, Math.PI / 2, 0]}
                geometry={geometries.corridorSideWall}
                material={materials.corridorWallL}
            />

            {/* Right wall */}
            <mesh
                position={[corridorWidth / 2, 0, -halfDepth]}
                rotation={[0, -Math.PI / 2, 0]}
                geometry={geometries.corridorSideWall}
                material={materials.corridorWallR}
            />

            {/* Floor */}
            <mesh
                position={[0, -corridorHeight / 2, -halfDepth]}
                rotation={[-Math.PI / 2, 0, 0]}
                geometry={geometries.corridorFloorCeiling}
                material={materials.corridorFloor}
            />

            {/* Ceiling */}
            <mesh
                position={[0, corridorHeight / 2, -halfDepth]}
                rotation={[Math.PI / 2, 0, 0]}
                geometry={geometries.corridorFloorCeiling}
                material={materials.corridorCeiling}
            />

            {/* Baseboard Left */}
            <mesh
                position={[-corridorWidth / 2 + 0.01, -corridorHeight / 2 + 0.075, -halfDepth]}
                rotation={[0, Math.PI / 2, 0]}
                geometry={geometries.corridorBaseboard}
                material={materials.bbLeft}
            />

            {/* Baseboard Right */}
            <mesh
                position={[corridorWidth / 2 - 0.01, -corridorHeight / 2 + 0.075, -halfDepth]}
                rotation={[0, -Math.PI / 2, 0]}
                geometry={geometries.corridorBaseboard}
                material={materials.bbRight}
            />

            {/* === THRESHOLD (End of Mini-Corridor) === */}
            <mesh
                position={[0, -corridorHeight / 2 + 0.005, -corridorDepth]}
                rotation={[-Math.PI / 2, 0, 0]}
                geometry={geometries.threshold}
                material={materials.threshold}
            />

            {/* Boutique vestibule is a lit PBR material (see isStudioVestibule above) but
                BoutiqueLighting only mounts once showRoom flips true (inside StudioRoom) — this
                small always-on light avoids a lighting "pop" while approaching before that. */}
            {label === 'THE STUDIO' && (
                <hemisphereLight args={['#ffffff', '#4a4038', 0.6]} />
            )}

            {/* === ROOM CONTENT === */}
            {showRoom && (
                <group>
                    {isGallery ? (
                        // === NEW GALLERY ROOM ===
                        // Positioned at the end of the corridor
                        <group position={[0, -0.5, -corridorDepth]}>
                            <Suspense fallback={null}>
                                <GalleryRoom showRoom={showRoom} onReady={onReady} isExiting={isExiting} />
                            </Suspense>
                        </group>
                    ) : label === 'THE STUDIO' ? (
                        // === NEW STUDIO ROOM ===
                        <group position={[0, -0.5, -corridorDepth]}>
                            <Suspense fallback={null}>
                                <StudioRoom showRoom={showRoom} onReady={onReady} isExiting={isExiting} />
                            </Suspense>
                        </group>
                    ) : label === 'THE ABOUT' ? (
                        // === NEW ABOUT ROOM ===
                        <group position={[0, -0.5, -corridorDepth]}>
                            <Suspense fallback={null}>
                                <AboutRoom showRoom={showRoom} onReady={onReady} isExiting={isExiting} />
                            </Suspense>
                        </group>
                    ) : label === "LET'S CONNECT" ? (
                        // === NEW CONTACT ROOM ===
                        <group position={[0, -0.5, -corridorDepth]}>
                            <Suspense fallback={null}>
                                <ContactRoom showRoom={showRoom} onReady={onReady} isExiting={isExiting} />
                            </Suspense>
                        </group>
                    ) : (
                        // === DEFAULT GENERIC ROOM (For other sections) ===
                        <group position={[0, roomHeight / 2 - corridorHeight / 2, roomZ]}>
                            {/* Floor */}
                            <mesh
                                position={[0, -roomHeight / 2, 0]}
                                rotation={[-Math.PI / 2, 0, 0]}
                                geometry={geometries.roomFloorCeiling}
                                material={materials.roomFloor}
                            />

                            {/* Floor grid */}
                            <gridHelper
                                args={[Math.min(roomWidth, roomDepth), 20, '#cccccc', '#dddddd']}
                                position={[0, -roomHeight / 2 + 0.01, 0]}
                            />

                            {/* Ceiling */}
                            <mesh
                                position={[0, roomHeight / 2, 0]}
                                rotation={[Math.PI / 2, 0, 0]}
                                geometry={geometries.roomFloorCeiling}
                                material={materials.roomCeiling}
                            />

                            {/* Back wall */}
                            <mesh
                                position={[0, 0, -roomDepth / 2]}
                                geometry={geometries.roomBackWall}
                                material={materials.roomBackWall}
                            />

                            {/* Left wall */}
                            <mesh
                                position={[-roomWidth / 2, 0, 0]}
                                rotation={[0, Math.PI / 2, 0]}
                                geometry={geometries.roomSideWall}
                                material={materials.roomWall}
                            />

                            {/* Right wall */}
                            <mesh
                                position={[roomWidth / 2, 0, 0]}
                                rotation={[0, -Math.PI / 2, 0]}
                                geometry={geometries.roomSideWall}
                                material={materials.roomWall}
                            />

                            {/* Title */}
                            <Text
                                position={[0, 2, -roomDepth / 2 + 2]}
                                fontSize={4}
                                color="#1a1a1a"
                                anchorX="center"
                                anchorY="middle"
                                maxWidth={roomWidth * 0.8}
                                textAlign="center"
                            >
                                {label}
                            </Text>

                            {/* Subtitle */}
                            <Text
                                position={[0, -1, -roomDepth / 2 + 2]}
                                fontSize={0.8}
                                color="#666666"
                                anchorX="center"
                                anchorY="middle"
                                maxWidth={roomWidth * 0.7}
                                textAlign="center"
                            >
                                {SUBTITLES[label] || ''}
                            </Text>

                            {/* Lighting - WYLACZONE */}
                            {/* <pointLight position={[0, roomHeight / 2 - 2, 0]} intensity={1} distance={40} color="#ffffff" /> */}
                            {/* <pointLight position={[0, 0, -roomDepth / 4]} intensity={0.5} distance={30} color="#fffaf0" /> */}
                        </group>
                    )}
                </group>
            )}
        </group>
    );
});

RoomInterior.displayName = 'RoomInterior';

export default RoomInterior;
