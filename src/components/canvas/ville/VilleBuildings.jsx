import React, { useMemo, useRef, useEffect } from 'react';
import { useFrame } from '@react-three/fiber';
import * as THREE from 'three';
import { VILLE_BUILDINGS } from './villeConfig';
import { useScene } from '../../../context/SceneContext';
import { usePerformance } from '../../../context/PerformanceContext';

/**
 * Sub-component for the interactive door markers (bouncing arrow + ground ring + hitbox)
 */
function DoorMarker({ x, doorTop, z, color, roomId, onDoorEnter, building, registerDoor }) {
    const coneRef = useRef();
    const hitRef = useRef();
    const baseVal = doorTop + 1.05;

    // Miora approach feedback: when THIS door is the context's nearest walk-in door,
    // ease a 0..1 factor that boosts the marker emissive, pulses the ground ring and
    // (on capable tiers) lights the threshold with a warm interior spill.
    const { villeNearDoor } = useScene();
    const { tier } = usePerformance();
    const isNear = !!roomId && villeNearDoor?.id === building.id;
    const approachRef = useRef(0);
    const coneMatRef = useRef();
    const ringMatRef = useRef();
    const ringRef = useRef();
    const glowRef = useRef();

    // Walk-in entry: publish this door's WORLD position so MiniVille can detect the
    // visitor standing in front of it (proximity "Entrer" prompt). getWorldPosition
    // resolves the parent building's translation+rotation for us.
    const isInteractive = !!roomId;
    useEffect(() => {
        if (!registerDoor || !isInteractive || !hitRef.current) return undefined;
        const p = new THREE.Vector3();
        hitRef.current.getWorldPosition(p);
        return registerDoor(building, p.x, p.z);
    }, [registerDoor, building, isInteractive]);

    useFrame((state) => {
        const elapsed = state.clock.getElapsedTime();
        if (coneRef.current) {
            coneRef.current.position.y = baseVal + Math.sin(elapsed * 2.4) * 0.12;
            coneRef.current.rotation.y = elapsed * 1.4;
        }

        // Eased approach factor (no allocations, refs only)
        approachRef.current = THREE.MathUtils.lerp(approachRef.current, isNear ? 1 : 0, 0.08);
        const k = approachRef.current;
        if (coneMatRef.current) coneMatRef.current.emissiveIntensity = 0.55 + k * 0.9;
        if (ringMatRef.current) ringMatRef.current.opacity = 0.5 + k * (0.2 + Math.sin(elapsed * 3) * 0.15);
        if (ringRef.current) {
            const s = 1 + k * 0.1 * (0.5 + Math.sin(elapsed * 3) * 0.5);
            ringRef.current.scale.set(s, s, 1);
        }
        if (glowRef.current) glowRef.current.intensity = k * 2.4;
    });

    const eventHandlers = isInteractive ? {
        onClick: (e) => {
            e.stopPropagation();
            onDoorEnter(building);
        },
        onPointerOver: (e) => {
            e.stopPropagation();
            document.body.style.cursor = 'pointer';
        },
        onPointerOut: (e) => {
            e.stopPropagation();
            document.body.style.cursor = 'default';
        }
    } : {};

    return (
        <group {...eventHandlers}>
            {/* Cone pointer */}
            <mesh 
                ref={coneRef} 
                position={[x, baseVal, z]} 
                rotation-x={Math.PI}
            >
                <coneGeometry args={[0.3, 0.55, 4]} />
                <meshStandardMaterial 
                    ref={coneMatRef}
                    color={color} 
                    emissive={color} 
                    emissiveIntensity={0.55} 
                    roughness={0.3} 
                />
            </mesh>

            {/* Ground Ring */}
            <mesh 
                ref={ringRef}
                position={[x, 0.07, z + 1.1]} 
                rotation-x={-Math.PI / 2}
            >
                <ringGeometry args={[0.55, 0.8, 28]} />
                <meshBasicMaterial 
                    ref={ringMatRef}
                    color={color} 
                    transparent 
                    opacity={0.5} 
                    side={THREE.DoubleSide} 
                />
            </mesh>

            {/* Warm interior light spill at the threshold (Miora approach state).
                Mounted only while near and above LOW tier — intensity eased from 0. */}
            {isNear && tier !== 'LOW' && (
                <pointLight
                    ref={glowRef}
                    position={[x, 1.6, z + 1]}
                    color="#FFE4B5"
                    intensity={0}
                    distance={5}
                    decay={2}
                />
            )}

            {/* Invisible but raycastable Click Hitbox */}
            <mesh ref={hitRef} position={[x, 1.8, z + 0.4]}>
                <boxGeometry args={[2.4, 3.6, 1.6]} />
                <meshBasicMaterial transparent opacity={0} depthWrite={false} />
            </mesh>
        </group>
    );
}

/**
 * Creates a text canvas texture for a sign
 */
function createSignTexture(txt, color) {
    const size = 90;
    const pad = 46;
    const c = document.createElement('canvas');
    const x = c.getContext('2d');
    x.font = '800 ' + size + 'px Sora, sans-serif';
    c.width = Math.ceil(x.measureText(txt).width) + pad * 2;
    c.height = size + pad * 1.4;
    
    const x2 = c.getContext('2d');
    x2.fillStyle = '#121014';
    x2.beginPath();
    x2.roundRect(0, 0, c.width, c.height, 18);
    x2.fill();
    
    x2.font = '800 ' + size + 'px Sora, sans-serif';
    x2.fillStyle = color;
    x2.textAlign = 'center';
    x2.textBaseline = 'middle';
    x2.fillText(txt, c.width / 2, c.height / 2 + size * .06);
    
    const t = new THREE.CanvasTexture(c);
    t.colorSpace = THREE.SRGBColorSpace;
    return { texture: t, aspect: c.width / c.height };
}

// Signs coordinates in world-space.
// Miora Brief 2: one shared emissive mint (#9FE0BB) signage family at night, slight idle
// glow at day (0.1); L'Académie stays dimmed (no active invitation — "Bientôt" building).
const SIGNS_CONFIG = [
    { text: 'HAKKILO XR', color: '#9FE0BB', position: [0, 10.6, 5.9], rotationY: 0, scale: 1.35 },
    { text: 'LE STUDIO', color: '#9FE0BB', position: [-26 + Math.cos(Math.PI/4)*5.3, 7.6, -26 + Math.sin(Math.PI/4)*5.3], rotationY: Math.PI*.75, scale: 1.1 },
    { text: 'PRÉSENTATION', color: '#9FE0BB', position: [26 - Math.cos(Math.PI/4)*5.3, 17, -26 + Math.sin(Math.PI/4)*5.3], rotationY: -Math.PI*.75, scale: 1.1 },
    { text: 'LA GALERIE', color: '#9FE0BB', position: [-26 + Math.cos(Math.PI/4)*5.6, 5.9, 26 - Math.sin(Math.PI/4)*5.6], rotationY: Math.PI/4 + Math.PI, scale: 1.05 },
    { text: 'CONTACT', color: '#9FE0BB', position: [26 - Math.cos(Math.PI/4)*4.4, 4.6, 26 - Math.sin(Math.PI/4)*4.4], rotationY: Math.PI/4 + Math.PI, scale: 0.95 },
    { text: "L'ACADÉMIE", color: '#9FE0BB', position: [0, 9.9, -40.5], rotationY: 0, scale: 1.2, nightGlow: 0.45 }
];

export default function VilleBuildings({ textures, nightRef, onDoorEnter, registerDoor }) {
    const emissiveMaterialsRef = useRef([]);

    useEffect(() => {
        return () => {
            emissiveMaterialsRef.current = [];
        };
    }, []);

    const registerMat = (day, night) => (mat) => {
        if (mat && !emissiveMaterialsRef.current.some(item => item.material === mat)) {
            emissiveMaterialsRef.current.push({ material: mat, day, night });
        }
    };

    useFrame(() => {
        const k = nightRef.current ?? 0;
        emissiveMaterialsRef.current.forEach(item => {
            if (item.material) {
                item.material.emissiveIntensity = item.day + (item.night - item.day) * k;
            }
        });
    });

    // 1. Facades caching
    const facades = useMemo(() => {
        return {
            hall: textures.facade('#101318', '#2a2f3c', { cols: 6, rows: 6, litRatio: 0.8 }),
            studio: textures.facade('#b34a2a', '#6e2a15', { cols: 4, rows: 2, litRatio: 0.5 }),
            presa: textures.facade('#31509c', '#1b2c66', { cols: 6, rows: 4, litRatio: 0.6 }),
            galleryShed: textures.facade('#22293a', '#11151f', { cols: 3, rows: 1, litRatio: 0.9 }),
            academie: textures.facade('#e8e2d4', '#8d8776', { cols: 5, rows: 3, litRatio: 0.55 })
        };
    }, [textures]);

    // 2. Text sprites caching
    const signs = useMemo(() => {
        return SIGNS_CONFIG.map(s => {
            const { texture, aspect } = createSignTexture(s.text, s.color);
            return {
                ...s,
                texture,
                aspect
            };
        });
    }, []);

    // 3. Helper to determine event handlers for specific building doors
    const getEventHandlers = (b) => {
        if (!b.roomId) return {};
        return {
            onClick: (e) => {
                e.stopPropagation();
                onDoorEnter(b);
            },
            onPointerOver: (e) => {
                e.stopPropagation();
                document.body.style.cursor = 'pointer';
            },
            onPointerOut: (e) => {
                e.stopPropagation();
                document.body.style.cursor = 'default';
            }
        };
    };

    return (
        <group>
            {/* Render 6 Hero Buildings */}
            {VILLE_BUILDINGS.map((b) => {
                const eventHandlers = getEventHandlers(b);
                
                return (
                    <group key={b.id} position={b.position} rotation={[0, b.rotationY, 0]}>
                        {b.id === 'hall' && (
                            <group>
                                {/* Main dark body */}
                                <mesh position={[0, 6, 0]} castShadow receiveShadow>
                                    <boxGeometry args={[11, 12, 11]} />
                                    <meshStandardMaterial color={0x17161a} roughness={0.35} metalness={0.5} />
                                </mesh>
                                {/* Glass facade envelope */}
                                <mesh position={[0, 4.6, 0]} castShadow receiveShadow>
                                    <boxGeometry args={[11.4, 8.5, 11.4]} />
                                    <meshStandardMaterial 
                                        map={facades.hall.map} 
                                        emissiveMap={facades.hall.emissiveMap} 
                                        emissive={0xffc687} 
                                        ref={registerMat(0, 1.1)} 
                                        roughness={0.2} 
                                        metalness={0.3} 
                                    />
                                </mesh>
                                {/* Blue neon strip */}
                                <mesh position={[0, 9.1, 0]} castShadow receiveShadow>
                                    <boxGeometry args={[11.6, 0.18, 11.6]} />
                                    <meshStandardMaterial 
                                        color={0x3554E8} 
                                        emissive={0x3554E8} 
                                        ref={registerMat(0.4, 2.4)} 
                                    />
                                </mesh>
                                {/* Main entry door */}
                                <mesh position={[0, 1.7, 5.72]} castShadow receiveShadow>
                                    <boxGeometry args={[3, 3.4, 0.3]} />
                                    <meshStandardMaterial color={0x3554E8} roughness={0.4} />
                                </mesh>
                                {/* Bouncing Door Marker */}
                                <DoorMarker 
                                    x={0} 
                                    doorTop={3.6} 
                                    z={5.9} 
                                    color={0x7C9AFF} 
                                    roomId={b.roomId} 
                                    onDoorEnter={onDoorEnter}
                                    registerDoor={registerDoor}
                                    building={b} 
                                />
                            </group>
                        )}

                        {b.id === 'studio' && (
                            <group>
                                {/* Terracotta body */}
                                <mesh position={[0, 3.25, 0]} castShadow receiveShadow>
                                    <boxGeometry args={[13, 6.5, 9]} />
                                    <meshStandardMaterial 
                                        map={facades.studio.map} 
                                        emissiveMap={facades.studio.emissiveMap} 
                                        emissive={0xffc687} 
                                        ref={registerMat(0, 1.0)} 
                                        roughness={0.8} 
                                    />
                                </mesh>
                                {/* Glass window */}
                                <mesh position={[-1, 1.6, 4.6]} castShadow receiveShadow>
                                    <boxGeometry args={[8, 2.6, 0.3]} />
                                    <meshStandardMaterial 
                                        color={0x54749c} 
                                        emissive={0xbfd9f2} 
                                        ref={registerMat(0.12, 0.8)} 
                                        roughness={0.1} 
                                        metalness={0.4} 
                                    />
                                </mesh>
                                {/* Awning */}
                                <mesh position={[-1, 3.1, 5.2]} rotation-x={0.12} castShadow receiveShadow>
                                    <boxGeometry args={[9, 0.18, 1.6]} />
                                    <meshStandardMaterial color={0xE09F3E} roughness={0.7} />
                                </mesh>
                                {/* Door */}
                                <mesh position={[4.6, 1.4, 4.6]} castShadow receiveShadow {...eventHandlers}>
                                    <boxGeometry args={[1.6, 2.8, 0.3]} />
                                    <meshStandardMaterial color={0x121014} roughness={0.5} />
                                </mesh>
                                {/* Bouncing Door Marker */}
                                <DoorMarker 
                                    x={4.6} 
                                    doorTop={2.9} 
                                    z={4.75} 
                                    color={0xC1502E} 
                                    roomId={b.roomId} 
                                    onDoorEnter={onDoorEnter}
                                    registerDoor={registerDoor}
                                    building={b} 
                                />
                            </group>
                        )}

                        {b.id === 'presa' && (
                            <group>
                                {/* 3-step tower blocks */}
                                {[[11, 6, 9, 3], [9, 5, 7.4, 8.5], [7, 5, 5.8, 13.5]].map((lvl, idx) => (
                                    <mesh key={idx} position={[0, lvl[3], 0]} castShadow receiveShadow>
                                        <boxGeometry args={[lvl[0], lvl[1], lvl[2]]} />
                                        <meshStandardMaterial 
                                            map={facades.presa.map} 
                                            emissiveMap={facades.presa.emissiveMap} 
                                            emissive={0xffc687} 
                                            ref={registerMat(0, 1.0)} 
                                            roughness={0.6} 
                                        />
                                    </mesh>
                                ))}
                                {/* Bottom frieze */}
                                <mesh position={[0, 0.45, 0]} castShadow receiveShadow>
                                    <boxGeometry args={[11.2, 0.9, 9.2]} />
                                    <meshStandardMaterial map={textures.texFrise} roughness={0.7} />
                                </mesh>
                                {/* Door */}
                                <mesh position={[0, 1.5, 4.6]} castShadow receiveShadow {...eventHandlers}>
                                    <boxGeometry args={[1.8, 3, 0.3]} />
                                    <meshStandardMaterial color={0x121014} roughness={0.5} />
                                </mesh>
                                {/* Bouncing Door Marker */}
                                <DoorMarker 
                                    x={0} 
                                    doorTop={3.1} 
                                    z={4.75} 
                                    color={0x3554E8} 
                                    roomId={b.roomId} 
                                    onDoorEnter={onDoorEnter}
                                    registerDoor={registerDoor}
                                    building={b} 
                                />
                            </group>
                        )}

                        {b.id === 'galerie' && (
                            <group>
                                {/* Brick main body */}
                                <mesh position={[0, 2.25, 0]} castShadow receiveShadow>
                                    <boxGeometry args={[14, 4.5, 10]} />
                                    <meshStandardMaterial map={textures.texBrique} roughness={0.9} />
                                </mesh>
                                {/* 3 roof sheds with glass facades */}
                                {[-3.2, 0, 3.2].map((zPos, idx) => (
                                    <group key={idx}>
                                        {/* Cylindrical roof vault */}
                                        <mesh position={[0, 4.9, zPos]} rotation-z={Math.PI/2} rotation-y={Math.PI/2} castShadow receiveShadow>
                                            <cylinderGeometry args={[2.2, 2.2, 13.4, 3, 1]} />
                                            <meshStandardMaterial color={0x3a3f4a} roughness={0.6} metalness={0.3} />
                                        </mesh>
                                        {/* Facade glass */}
                                        <mesh position={[0, 5.5, zPos - 1.1]} rotation-x={-0.5} castShadow receiveShadow>
                                            <planeGeometry args={[13.2, 1.8]} />
                                            <meshStandardMaterial 
                                                map={facades.galleryShed.map} 
                                                emissiveMap={facades.galleryShed.emissiveMap} 
                                                emissive={0xffc687} 
                                                ref={registerMat(0, 0.9)} 
                                                roughness={0.2} 
                                                side={THREE.DoubleSide} 
                                            />
                                        </mesh>
                                    </group>
                                ))}
                                {/* Glass bay window */}
                                <mesh position={[-1, 1.8, 5.1]} castShadow receiveShadow>
                                    <boxGeometry args={[10, 2.4, 0.3]} />
                                    <meshStandardMaterial 
                                        color={0x54749c} 
                                        emissive={0xbfd9f2} 
                                        ref={registerMat(0.1, 0.8)} 
                                        roughness={0.15} 
                                        metalness={0.4} 
                                    />
                                </mesh>
                                {/* Ochre door */}
                                <mesh position={[5.2, 1.45, 5.1]} castShadow receiveShadow {...eventHandlers}>
                                    <boxGeometry args={[1.8, 2.9, 0.3]} />
                                    <meshStandardMaterial color={0xE09F3E} roughness={0.5} />
                                </mesh>
                                {/* Bouncing Door Marker */}
                                <DoorMarker 
                                    x={5.2} 
                                    doorTop={3.0} 
                                    z={5.25} 
                                    color={0xE09F3E} 
                                    roomId={b.roomId} 
                                    onDoorEnter={onDoorEnter}
                                    registerDoor={registerDoor}
                                    building={b} 
                                />
                            </group>
                        )}

                        {b.id === 'contact' && (
                            <group>
                                {/* Wooden body */}
                                <mesh position={[0, 1.8, 0]} castShadow receiveShadow>
                                    <boxGeometry args={[8, 3.6, 7]} />
                                    <meshStandardMaterial map={textures.texBois} roughness={0.8} />
                                </mesh>
                                {/* Cone roof */}
                                <mesh position={[0, 4.8, 0]} rotation-y={Math.PI/4} castShadow receiveShadow>
                                    <coneGeometry args={[6.8, 2.4, 4]} />
                                    <meshStandardMaterial color={0x3E7C59} roughness={0.8} />
                                </mesh>
                                {/* Deck/terrace */}
                                <mesh position={[0, 0.12, 0]} castShadow receiveShadow>
                                    <boxGeometry args={[11, 0.25, 10]} />
                                    <meshStandardMaterial map={textures.texBois} roughness={0.9} />
                                </mesh>
                                {/* Window */}
                                <mesh position={[-2.4, 2, 3.55]} castShadow receiveShadow>
                                    <boxGeometry args={[2.6, 1.4, 0.3]} />
                                    <meshStandardMaterial 
                                        color={0x54749c} 
                                        emissive={0xffd9a0} 
                                        ref={registerMat(0.1, 1.2)} 
                                        roughness={0.2} 
                                    />
                                </mesh>
                                {/* Door */}
                                <mesh position={[0, 1.3, 3.6]} castShadow receiveShadow {...eventHandlers}>
                                    <boxGeometry args={[1.6, 2.6, 0.3]} />
                                    <meshStandardMaterial color={0x121014} roughness={0.5} />
                                </mesh>
                                {/* Bouncing Door Marker */}
                                <DoorMarker 
                                    x={0} 
                                    doorTop={2.7} 
                                    z={3.75} 
                                    color={0x3E7C59} 
                                    roomId={b.roomId} 
                                    onDoorEnter={onDoorEnter}
                                    registerDoor={registerDoor}
                                    building={b} 
                                />
                            </group>
                        )}

                        {b.id === 'academie' && (
                            <group>
                                {/* 2 Wings */}
                                {[-1, 1].map((sx, idx) => (
                                    <group key={idx}>
                                        <mesh position={[sx * 6.2, 3.5, 0]} castShadow receiveShadow>
                                            <boxGeometry args={[7.5, 7, 8]} />
                                            <meshStandardMaterial 
                                                map={facades.academie.map} 
                                                emissiveMap={facades.academie.emissiveMap} 
                                                emissive={0xffc687} 
                                                ref={registerMat(0, 1.0)} 
                                                roughness={0.8} 
                                            />
                                        </mesh>
                                        <mesh position={[sx * 6.2, 0.4, 0]} castShadow receiveShadow>
                                            <boxGeometry args={[7.7, 0.8, 8.2]} />
                                            <meshStandardMaterial map={textures.texFrise} roughness={0.7} />
                                        </mesh>
                                    </group>
                                ))}
                                {/* Central portal (arch) */}
                                <mesh position={[0, 4.3, 0]} castShadow receiveShadow>
                                    <boxGeometry args={[5.4, 8.6, 6.5]} />
                                    <meshStandardMaterial color={0x3554E8} roughness={0.55} />
                                </mesh>
                                {/* Porch */}
                                <mesh position={[0, 2.1, 3.1]} castShadow receiveShadow>
                                    <boxGeometry args={[3.4, 4.2, 0.8]} />
                                    <meshStandardMaterial color={0x0B0F1E} roughness={0.3} />
                                </mesh>
                                {/* Blue border bar */}
                                <mesh position={[0, 8.75, 0]} castShadow receiveShadow>
                                    <boxGeometry args={[5.6, 0.22, 6.7]} />
                                    <meshStandardMaterial 
                                        color={0x7C9AFF} 
                                        emissive={0x7C9AFF} 
                                        ref={registerMat(0.4, 2.2)} 
                                    />
                                </mesh>
                                {/* Antenna mast */}
                                <mesh position={[4.2, 8.4, 0]} castShadow receiveShadow>
                                    <cylinderGeometry args={[0.09, 0.12, 3.4, 6]} />
                                    <meshStandardMaterial color={0x2a2a2e} metalness={0.6} roughness={0.4} />
                                </mesh>
                                {/* Satellite Dish */}
                                <mesh position={[4.2, 10.1, 0]} rotation-x={-0.9} castShadow receiveShadow>
                                    <sphereGeometry args={[1.1, 12, 8, 0, Math.PI * 2, 0, Math.PI / 2.6]} />
                                    <meshStandardMaterial color={0xd8d4ca} roughness={0.5} side={THREE.DoubleSide} />
                                </mesh>
                                {/* Central Door */}
                                <mesh position={[0, 1.8, 3.4]} castShadow receiveShadow>
                                    <boxGeometry args={[2.6, 3.6, 0.3]} />
                                    <meshStandardMaterial 
                                        color={0x7C9AFF} 
                                        emissive={0x7C9AFF} 
                                        ref={registerMat(0.12, 0.9)} 
                                        roughness={0.4} 
                                    />
                                </mesh>
                                {/* Bouncing Door Marker */}
                                <DoorMarker 
                                    x={0} 
                                    doorTop={3.8} 
                                    z={3.6} 
                                    color={0x7C9AFF} 
                                    roomId={b.roomId} 
                                    onDoorEnter={onDoorEnter}
                                    registerDoor={registerDoor}
                                    building={b} 
                                />
                            </group>
                        )}
                    </group>
                );
            })}

            {/* Render 6 World-space Sign Billboards */}
            {signs.map((s, idx) => (
                <mesh 
                    key={`sign-${idx}`} 
                    position={s.position} 
                    rotation-y={s.rotationY}
                >
                    <planeGeometry args={[s.aspect * (1.1 * s.scale), 1.1 * s.scale]} />
                    <meshStandardMaterial 
                        map={s.texture} 
                        emissiveMap={s.texture} 
                        emissive={0xffffff} 
                        ref={registerMat(0.1, s.nightGlow ?? 0.9)} 
                        roughness={0.6} 
                        transparent 
                    />
                </mesh>
            ))}
        </group>
    );
}
