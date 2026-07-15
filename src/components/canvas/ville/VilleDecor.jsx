import React, { useMemo, useRef, useEffect, useLayoutEffect, Suspense } from 'react';
import { useFrame } from '@react-three/fiber';
import { useGLTF } from '@react-three/drei';
import * as THREE from 'three';
import { makeVilleTextures } from './villeTextures';
import { usePerformance, TIERS } from '../../../context/PerformanceContext';

/**
 * ErrorBoundary for GLB loading fallbacks
 */
class BuildingErrorBoundary extends React.Component {
    constructor(props) {
        super(props);
        this.state = { hasError: false };
    }
    static getDerivedStateFromError() {
        return { hasError: true };
    }
    render() {
        if (this.state.hasError) {
            return this.props.fallback;
        }
        return this.props.children;
    }
}

/**
 * Simple beige box fallback when GLB fails to load
 */
function BuildingFallback({ position, height }) {
    return (
        <mesh position={[position[0], height / 2, position[2]]}>
            <boxGeometry args={[8, height, 8]} />
            <meshStandardMaterial color="#B9AF9B" roughness={0.9} />
        </mesh>
    );
}

/**
 * Kenney Building Loader
 */
function KenneyBuilding({ file, position, rotationY, heightTarget }) {
    const { scene } = useGLTF(`/ville-assets/kenney/${file}`);

    const { cloned, localPos, scale } = useMemo(() => {
        const clone = scene.clone(true);
        clone.traverse((o) => {
            if (o.isMesh) {
                o.castShadow = false;
                o.receiveShadow = false;
            }
        });

        const box = new THREE.Box3().setFromObject(clone);
        const size = box.getSize(new THREE.Vector3());
        const k = heightTarget / (size.y || 1);

        const posX = - (box.min.x + box.max.x) / 2;
        const posY = - box.min.y;
        const posZ = - (box.min.z + box.max.z) / 2;

        return { cloned: clone, localPos: [posX, posY, posZ], scale: k };
    }, [scene, heightTarget]);

    return (
        <group position={position} rotation={[0, rotationY, 0]}>
            <primitive object={cloned} position={localPos} scale={scale} />
        </group>
    );
}

/**
 * Celandine plant component loader
 */
function CelandinePlant({ position, scaleMultiplier, rotationY }) {
    const { scene } = useGLTF('/ville-assets/models/celandine/celandine_01_1k.gltf');

    const { cloned, localPos, scale } = useMemo(() => {
        const clone = scene.clone(true);
        const box = new THREE.Box3().setFromObject(clone);
        const size = box.getSize(new THREE.Vector3());
        const baseK = 0.42 / (size.y || 1);
        const finalScale = baseK * scaleMultiplier;

        const posX = - (box.min.x + box.max.x) / 2;
        const posY = - box.min.y;
        const posZ = - (box.min.z + box.max.z) / 2;

        return { cloned: clone, localPos: [posX, posY, posZ], scale: finalScale };
    }, [scene, scaleMultiplier]);

    return (
        <group position={position} rotation={[0, rotationY, 0]}>
            <primitive object={cloned} position={localPos} scale={scale} />
        </group>
    );
}

/**
 * Parasol GLTF Loader
 */
function ParasolModel({ variant, x, z }) {
    const { scene } = useGLTF(`/ville-assets/kenney/detail-parasol-${variant}.glb`);

    const { cloned, localPos, scale } = useMemo(() => {
        const clone = scene.clone(true);
        clone.traverse(o => { if (o.isMesh) o.castShadow = true; });
        const box = new THREE.Box3().setFromObject(clone);
        const size = box.getSize(new THREE.Vector3());
        const k = 2.3 / (size.y || 1);

        const posX = x - (box.min.x + box.max.x) / 2;
        const posY = - box.min.y;
        const posZ = z - (box.min.z + box.max.z) / 2;

        return { cloned: clone, localPos: [posX, posY, posZ], scale: k };
    }, [scene, x, z]);

    return <primitive object={cloned} position={localPos} scale={scale} />;
}

/**
 * Cafe Spot combining Parasol model and custom table shapes
 */
function CafeSpot({ x, z, variant, texBois }) {
    return (
        <group>
            {/* Parasol GLB */}
            <BuildingErrorBoundary fallback={null}>
                <Suspense fallback={null}>
                    <ParasolModel variant={variant} x={x} z={z} />
                </Suspense>
            </BuildingErrorBoundary>

            {/* Table top */}
            <mesh position={[x, 0.74, z]} castShadow>
                <cylinderGeometry args={[0.5, 0.5, 0.06, 14]} />
                <meshStandardMaterial map={texBois} roughness={0.8} />
            </mesh>

            {/* Table leg */}
            <mesh position={[x, 0.37, z]} castShadow>
                <cylinderGeometry args={[0.05, 0.07, 0.74, 8]} />
                <meshStandardMaterial color={0x2a2a2e} metalness={0.5} roughness={0.5} />
            </mesh>
        </group>
    );
}

/**
 * Instanced low-poly trees (perf fable/007). The old per-tree component created 8 meshes
 * × 17 trees = 136 draw calls, 136 geometries and 136 materials (inline JSX args). Same
 * exact transforms, now composed into 4 InstancedMesh (trunks / branches / 2 leaf tints):
 * geometry args are UNIT values from the original blueprint, per-tree scale `s` and the
 * per-part offsets (which were all ×s) are carried by the instance matrix instead.
 */
const TREE_BRANCHES = [
    { pos: [0.3, 2.5, 0.1], rot: [0, 0, -0.7] },
    { pos: [-0.32, 2.3, -0.1], rot: [0.2, 0, 0.8] },
];
const TREE_LOBES = [
    { pos: [0, 3.6, 0], rot: [1.2, 2.4, 0], r: 1.5, dark: false },
    { pos: [0.9, 3.1, 0.3], rot: [0.5, 1.8, 0], r: 1.0, dark: true },
    { pos: [-0.85, 3.0, -0.2], rot: [2.1, 0.9, 0], r: 0.95, dark: true },
    { pos: [0.2, 4.3, -0.4], rot: [1.7, 2.7, 0], r: 0.9, dark: false },
    { pos: [-0.3, 3.3, 0.8], rot: [0.3, 1.2, 0], r: 0.85, dark: false },
];

function InstancedTrees({ trees }) {
    const trunkRef = useRef();
    const branchRef = useRef();
    const lobesDarkRef = useRef();
    const lobesLightRef = useRef();

    const { trunkGeo, branchGeo, lobeGeo, woodMat, leafDarkMat, leafLightMat } = useMemo(() => ({
        trunkGeo: new THREE.CylinderGeometry(0.16, 0.3, 2.6, 7),
        branchGeo: new THREE.CylinderGeometry(0.07, 0.11, 1.3, 5),
        lobeGeo: new THREE.IcosahedronGeometry(1, 1),
        woodMat: new THREE.MeshStandardMaterial({ color: 0x5d4a33, roughness: 1 }),
        leafDarkMat: new THREE.MeshStandardMaterial({ color: 0x3d5c38, roughness: 1, flatShading: true }),
        leafLightMat: new THREE.MeshStandardMaterial({ color: 0x4a6b41, roughness: 1, flatShading: true }),
    }), []);

    useEffect(() => () => {
        trunkGeo.dispose(); branchGeo.dispose(); lobeGeo.dispose();
        woodMat.dispose(); leafDarkMat.dispose(); leafLightMat.dispose();
    }, [trunkGeo, branchGeo, lobeGeo, woodMat, leafDarkMat, leafLightMat]);

    useLayoutEffect(() => {
        const treeM = new THREE.Matrix4();
        const partM = new THREE.Matrix4();
        const q = new THREE.Quaternion();
        const e = new THREE.Euler();
        const v = new THREE.Vector3();
        const sv = new THREE.Vector3();
        let iTrunk = 0, iBranch = 0, iDark = 0, iLight = 0;

        for (const t of trees) {
            treeM.compose(
                v.set(t.x, 0, t.z),
                q.setFromEuler(e.set(0, t.rotationY, 0)),
                sv.set(t.scale, t.scale, t.scale),
            );
            partM.compose(v.set(0, 1.3, 0), q.identity(), sv.set(1, 1, 1)).premultiply(treeM);
            trunkRef.current.setMatrixAt(iTrunk++, partM);

            for (const b of TREE_BRANCHES) {
                partM.compose(
                    v.set(b.pos[0], b.pos[1], b.pos[2]),
                    q.setFromEuler(e.set(b.rot[0], b.rot[1], b.rot[2])),
                    sv.set(1, 1, 1),
                ).premultiply(treeM);
                branchRef.current.setMatrixAt(iBranch++, partM);
            }
            for (const l of TREE_LOBES) {
                partM.compose(
                    v.set(l.pos[0], l.pos[1], l.pos[2]),
                    q.setFromEuler(e.set(l.rot[0], l.rot[1], l.rot[2])),
                    sv.set(l.r, l.r * 0.82, l.r),
                ).premultiply(treeM);
                if (l.dark) lobesDarkRef.current.setMatrixAt(iDark++, partM);
                else lobesLightRef.current.setMatrixAt(iLight++, partM);
            }
        }
        for (const ref of [trunkRef, branchRef, lobesDarkRef, lobesLightRef]) {
            ref.current.instanceMatrix.needsUpdate = true;
        }
    }, [trees]);

    const n = trees.length;
    return (
        <group>
            <instancedMesh ref={trunkRef} args={[trunkGeo, woodMat, n]} castShadow />
            <instancedMesh ref={branchRef} args={[branchGeo, woodMat, n * 2]} castShadow />
            <instancedMesh ref={lobesDarkRef} args={[lobeGeo, leafDarkMat, n * 2]} castShadow />
            <instancedMesh ref={lobesLightRef} args={[lobeGeo, leafLightMat, n * 3]} castShadow />
        </group>
    );
}

/**
 * Detailed Plaza street lamp model
 */
function PlazaLampModel({ x, z, lampHeadMat }) {
    const { scene } = useGLTF('/ville-assets/models/street_lamp/street_lamp_02_1k.gltf');

    const { cloned, localPos, scale, rotY } = useMemo(() => {
        const clone = scene.clone(true);
        const box = new THREE.Box3().setFromObject(clone);
        const size = box.getSize(new THREE.Vector3());
        const k = 4.8 / (size.y || 1);

        const posX = x - (box.min.x + box.max.x) / 2;
        const posY = - box.min.y;
        const posZ = z - (box.min.z + box.max.z) / 2;

        const ry = Math.atan2(-x, -z);

        return { cloned: clone, localPos: [posX, posY, posZ], scale: k, rotY: ry };
    }, [scene, x, z]);

    return (
        <group>
            <primitive object={cloned} position={localPos} scale={scale} rotation={[0, rotY, 0]} />
            <mesh position={[x, 4.55, z]} material={lampHeadMat}>
                <sphereGeometry args={[0.16, 10, 8]} />
            </mesh>
        </group>
    );
}

/**
 * Low-poly simple street lamp for street grids
 */
function SimplePole({ x, z, lampPoleMat, lampHeadMat, poleGeo, poleHeadGeo }) {
    return (
        <group>
            <mesh position={[x, 2.3, z]} material={lampPoleMat} geometry={poleGeo} />
            <mesh position={[x, 4.7, z]} material={lampHeadMat} geometry={poleHeadGeo} />
        </group>
    );
}

/**
 * Static street row only. Plaza lamps keep SimplePole as an individually mountable
 * Suspense/ErrorBoundary fallback while the fixed grid can share two draw calls.
 */
function InstancedStreetPoles({ spots, lampPoleMat, lampHeadMat, poleGeo, poleHeadGeo }) {
    const poleRef = useRef();
    const headRef = useRef();

    useLayoutEffect(() => {
        const matrix = new THREE.Matrix4();

        spots.forEach(([x, z], index) => {
            matrix.makeTranslation(x, 2.3, z);
            poleRef.current.setMatrixAt(index, matrix);

            matrix.makeTranslation(x, 4.7, z);
            headRef.current.setMatrixAt(index, matrix);
        });

        for (const ref of [poleRef, headRef]) {
            ref.current.instanceMatrix.needsUpdate = true;
            ref.current.computeBoundingSphere();
        }
    }, [spots, lampPoleMat, lampHeadMat, poleGeo, poleHeadGeo]);

    return (
        <group>
            <instancedMesh ref={poleRef} args={[poleGeo, lampPoleMat, spots.length]} />
            <instancedMesh ref={headRef} args={[poleHeadGeo, lampHeadMat, spots.length]} />
        </group>
    );
}

// Kenney buildings config
const KENNEY_BUILDINGS = [
    { file: 'building-a.glb', position: [-44, 0, -8],  rotationY: Math.PI / 2 },
    { file: 'building-b.glb', position: [-44, 0, -20], rotationY: Math.PI / 2 },
    { file: 'building-c.glb', position: [-44, 0, 12],  rotationY: Math.PI / 2 },
    { file: 'building-d.glb', position: [44,  0, -10], rotationY: -Math.PI / 2 },
    { file: 'building-e.glb', position: [44,  0, 6],   rotationY: -Math.PI / 2 },
    { file: 'building-f.glb', position: [44,  0, 20],  rotationY: -Math.PI / 2 },
    { file: 'building-g.glb', position: [-21, 0, -47], rotationY: 0 },
    { file: 'building-h.glb', position: [21,  0, -47], rotationY: 0 },
    { file: 'building-skyscraper-a.glb', position: [-14, 0, 46], rotationY: Math.PI },
    { file: 'building-skyscraper-c.glb', position: [14,  0, 46], rotationY: Math.PI },
];

export default function VilleDecor({ nightRef, textures: texturesProp }) {
    const lightsRef = useRef([]);
    const lampHeadMatRef = useRef();
    const { tier } = usePerformance();

    // Textures come from MiniVille (shared set). The fallback keeps the component
    // standalone-safe but used to run unconditionally — a full duplicate ~12 MB set.
    const textures = useMemo(() => texturesProp ?? makeVilleTextures(), [texturesProp]);

    // 1. Lamp materials + shared pole geometries (perf: the 20 SimplePoles used to build
    // their own cylinder+sphere each → 40 geometries for 2 shapes)
    const { lampPoleMat, lampHeadMat, poleGeo, poleHeadGeo } = useMemo(() => ({
        lampPoleMat: new THREE.MeshStandardMaterial({ color: 0x2a2a2e, roughness: 0.5, metalness: 0.6 }),
        lampHeadMat: new THREE.MeshStandardMaterial({ color: 0xfff2dc, emissive: 0xffd9a0, emissiveIntensity: 0.05, roughness: 0.4 }),
        poleGeo: new THREE.CylinderGeometry(0.07, 0.1, 4.6, 6),
        poleHeadGeo: new THREE.SphereGeometry(0.24, 10, 8),
    }), []);

    // Capture the lampHeadMat ref to update emissive intensity in useFrame
    useEffect(() => {
        lampHeadMatRef.current = lampHeadMat;
        return () => {
            lampHeadMatRef.current = null;
            lightsRef.current = [];
        };
    }, [lampHeadMat]);

    // 2. Animate streetlights in useFrame
    useFrame(() => {
        const k = nightRef.current ?? 0;
        
        // Lerp PointLights intensity
        const lightIntensity = 14 * k;
        lightsRef.current.forEach((light) => {
            if (light) {
                light.intensity = lightIntensity;
            }
        });

        // Lerp lamp head emissive glow
        if (lampHeadMatRef.current) {
            lampHeadMatRef.current.emissiveIntensity = 0.05 + (2.2 - 0.05) * k;
        }
    });

    // 3. Deterministic pseudo-random scaling heights for background buildings
    const buildingHeights = useMemo(() => {
        return KENNEY_BUILDINGS.map((_, idx) => {
            return 9 + ((idx * 7) % 5); // Heights deterministic: 9, 11, 13, 10, 12...
        });
    }, []);

    // 4. Deterministic pseudo-random offsets and scale factors for celandines
    const celandineSpots = useMemo(() => {
        const baseSpots = [[8.2, 8.2], [-8.5, 8.0], [20, 21], [21.5, 31.5], [12.8, 15.8]];
        return baseSpots.map((spot, idx) => {
            const randomX = ((idx * 7) % 10) / 10 - 0.5;
            const randomZ = ((idx * 13) % 10) / 10 - 0.5;
            const scaleMult = 0.8 + ((idx * 3) % 6) * 0.1;
            const rotY = ((idx * 17) % 8) / 8 * Math.PI * 2;
            return {
                position: [spot[0] + randomX, 0, spot[1] + randomZ],
                scaleMultiplier: scaleMult,
                rotationY: rotY
            };
        });
    }, []);

    // 5. Deterministic tree placements
    const trees = useMemo(() => {
        const list = [];
        const loop1 = [[-7, 3], [7, -2], [3, 8], [-4, -7], [9, 5]];
        loop1.forEach((offsets, idx) => {
            const s = 0.9 + ((idx * 7) % 5) * 0.1;
            const rotY = ((idx * 13) % 8) / 8 * Math.PI * 2;
            list.push({ x: 26 + offsets[0], z: 26 + offsets[1], scale: s, rotationY: rotY });
        });

        const loop2 = [
            [-14, 34], [14, 36], [-36, -14], [36, 16],
            [-16, -36], [34, -16], [-34, 14], [16, 38],
            [-38, 18], [10, -12], [-11, -13], [12, 12.5]
        ];
        loop2.forEach((pos, idx) => {
            const s = 0.8 + ((idx * 5) % 7) * 0.1;
            const rotY = ((idx * 19) % 8) / 8 * Math.PI * 2;
            list.push({ x: pos[0], z: pos[1], scale: s, rotationY: rotY });
        });
        return list;
    }, []);

    // 6. Lamp posts locations
    const { plazaLamps, streetLamps } = useMemo(() => {
        const plaza = [];
        for (let a = 0; a < 8; a++) {
            const t = (a / 8) * Math.PI * 2;
            plaza.push([Math.cos(t) * 21, Math.sin(t) * 21]);
        }
        
        const street = [];
        for (const z of [-34, 34]) {
            street.push([5.5, z], [-5.5, z]);
        }
        for (const x of [-34, 34]) {
            street.push([x, 5.5], [x, -5.5]);
        }
        street.push([5.5, -42], [-5.5, -42]);

        return { plazaLamps: plaza, streetLamps: street };
    }, []);

    return (
        <group>
            {/* 1. Background Kenney Buildings */}
            {KENNEY_BUILDINGS.map((b, idx) => (
                <BuildingErrorBoundary 
                    key={b.file}
                    fallback={<BuildingFallback position={b.position} height={buildingHeights[idx]} />}
                >
                    <Suspense fallback={<BuildingFallback position={b.position} height={buildingHeights[idx]} />}>
                        <KenneyBuilding 
                            file={b.file} 
                            position={b.position} 
                            rotationY={b.rotationY} 
                            heightTarget={buildingHeights[idx]} 
                        />
                    </Suspense>
                </BuildingErrorBoundary>
            ))}

            {/* 2. Café de la place (3 spots on the plaza) */}
            {[[-13, 11, 'a'], [-15.5, 14, 'b'], [-11, 15.5, 'a']].map((c, idx) => (
                <CafeSpot 
                    key={idx} 
                    x={c[0]} 
                    z={c[1]} 
                    variant={c[2]} 
                    texBois={textures.texBois} 
                />
            ))}

            {/* 3. Celandine Plants */}
            {celandineSpots.map((p, idx) => (
                <BuildingErrorBoundary key={idx} fallback={null}>
                    <Suspense fallback={null}>
                        <CelandinePlant 
                            position={p.position} 
                            scaleMultiplier={p.scaleMultiplier} 
                            rotationY={p.rotationY} 
                        />
                    </Suspense>
                </BuildingErrorBoundary>
            ))}

            {/* 4. Low-poly trees — 4 instanced draws instead of 136 meshes (fable/007) */}
            <InstancedTrees trees={trees} />

            {/* 5. Plaza Lamps (Using Detailed GLB model) */}
            {plazaLamps.map((spot, idx) => (
                <BuildingErrorBoundary key={idx} fallback={<SimplePole x={spot[0]} z={spot[1]} lampPoleMat={lampPoleMat} lampHeadMat={lampHeadMat} poleGeo={poleGeo} poleHeadGeo={poleHeadGeo} />}>
                    <Suspense fallback={<SimplePole x={spot[0]} z={spot[1]} lampPoleMat={lampPoleMat} lampHeadMat={lampHeadMat} poleGeo={poleGeo} poleHeadGeo={poleHeadGeo} />}>
                        <PlazaLampModel x={spot[0]} z={spot[1]} lampHeadMat={lampHeadMat} />
                    </Suspense>
                </BuildingErrorBoundary>
            ))}

            {/* 6. Fixed street row: 10 poles in two instanced draws. */}
            <InstancedStreetPoles
                spots={streetLamps}
                lampPoleMat={lampPoleMat}
                lampHeadMat={lampHeadMat}
                poleGeo={poleGeo}
                poleHeadGeo={poleHeadGeo}
            />

            {/* 7. Night PointLights — tier-aware count (fable/007). Forward rendering pays
                every light in EVERY fragment shader, day included (intensity 0 still runs the
                loop), so LOW gets 2 and MEDIUM 4. Count is fixed per tier — toggling lights
                at runtime would change the shader program count and cause a compile hitch. */}
            {Array.from({ length: tier === TIERS.LOW ? 2 : tier === TIERS.MEDIUM ? 4 : 6 }).map((_, idx, arr) => {
                const angle = (idx / arr.length) * Math.PI * 2;
                const x = Math.cos(angle) * 21;
                const z = Math.sin(angle) * 21;
                return (
                    <pointLight
                        key={`${arr.length}-${idx}`}
                        ref={(el) => { lightsRef.current[idx] = el; }}
                        color="#ffd9a0"
                        position={[x, 4.6, z]}
                        distance={26}
                        decay={2}
                        intensity={0}
                    />
                );
            })}
        </group>
    );
}

// Preload all 3D assets to prevent flickering on spawn
useGLTF.preload('/ville-assets/kenney/building-a.glb');
useGLTF.preload('/ville-assets/kenney/building-b.glb');
useGLTF.preload('/ville-assets/kenney/building-c.glb');
useGLTF.preload('/ville-assets/kenney/building-d.glb');
useGLTF.preload('/ville-assets/kenney/building-e.glb');
useGLTF.preload('/ville-assets/kenney/building-f.glb');
useGLTF.preload('/ville-assets/kenney/building-g.glb');
useGLTF.preload('/ville-assets/kenney/building-h.glb');
useGLTF.preload('/ville-assets/kenney/building-skyscraper-a.glb');
useGLTF.preload('/ville-assets/kenney/building-skyscraper-c.glb');
useGLTF.preload('/ville-assets/kenney/detail-parasol-a.glb');
useGLTF.preload('/ville-assets/kenney/detail-parasol-b.glb');
useGLTF.preload('/ville-assets/models/street_lamp/street_lamp_02_1k.gltf');
useGLTF.preload('/ville-assets/models/celandine/celandine_01_1k.gltf');
