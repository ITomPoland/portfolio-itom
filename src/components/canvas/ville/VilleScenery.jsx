import React, { useMemo, useRef, useLayoutEffect } from 'react';
import { useFrame } from '@react-three/fiber';
import * as THREE from 'three';
import { usePerformance, TIERS } from '../../../context/PerformanceContext';

export default function VilleScenery({ textures, nightRef }) {
    // Tier-aware densities (fable/007): LOW halves the decorative instances/particles and
    // skips the additive moon halo. HIGH/MEDIUM keep the original look untouched.
    const { tier } = usePerformance();
    const isLow = tier === TIERS.LOW;
    const grassCount = isLow ? 84 : 170;
    const starCount = isLow ? 130 : 260;
    const imRef1 = useRef();
    const imRef2 = useRef();
    const montRef1 = useRef();
    const montRef2 = useRef();
    const skylineRef = useRef();

    const matMontRef1 = useRef();
    const matMontRef2 = useRef();
    const skyMatRef = useRef();
    const starsRef = useRef();
    const starMatRef = useRef();
    const moonGroupRef = useRef();
    const moonMatRef = useRef();
    const moonHaloMatRef = useRef();

    // 1. Color constants for mountains Day-Night interpolation
    const colJourMont1 = useMemo(() => new THREE.Color(0x8896a8), []);
    const colNuitMont1 = useMemo(() => new THREE.Color(0x1c2436), []);
    const colJourMont2 = useMemo(() => new THREE.Color(0x6f7d92), []);
    const colNuitMont2 = useMemo(() => new THREE.Color(0x141b2a), []);

    // 2. Pre-calculated translated geometries
    const gGeo = useMemo(() => {
        const geo = new THREE.PlaneGeometry(1.0, 0.55);
        geo.translate(0, 0.27, 0);
        return geo;
    }, []);

    const coneGeo = useMemo(() => {
        const geo = new THREE.ConeGeometry(1, 1, 6);
        geo.translate(0, 0.5, 0);
        return geo;
    }, []);

    const skyBoxGeo = useMemo(() => {
        return new THREE.BoxGeometry(1, 1, 1);
    }, []);

    // 3. Deterministic pseudo-random generation logic
    // Grass Positions (avoiding roads and plaza)
    const GRASS_POSITIONS = useMemo(() => {
        const positions = [];
        let seed = 42;
        function random() {
            const x = Math.sin(seed++) * 10000;
            return x - Math.floor(x);
        }
        let placed = 0;
        let guard = 0;
        const N = grassCount;
        while (placed < N && guard++ < 10000) {
            const x = (random() - 0.5) * 100;
            const z = (random() - 0.5) * 100;
            const nearRoad = Math.abs(x) < 8.2 || Math.abs(z) < 8.2;
            const inPlaza = Math.sqrt(x * x + z * z) < 20.5;
            if (nearRoad || inPlaza) continue;
            const s = 0.7 + random() * 0.9;
            const ry1 = random() * Math.PI;
            const ry2 = random() * Math.PI + Math.PI / 2;
            positions.push({ x, z, s, ry1, ry2 });
            placed++;
        }
        return positions;
    }, [grassCount]);

    // Mountains config
    const MOUNTAINS_CONFIG = useMemo(() => {
        let seed = 123;
        function random() {
            const x = Math.sin(seed++) * 10000;
            return x - Math.floor(x);
        }

        const generateConfig = (r, n, hMin, hMax) => {
            const config = [];
            for (let i = 0; i < n; i++) {
                const a = (i / n) * Math.PI * 2 + random() * 0.3;
                const hgt = hMin + random() * (hMax - hMin);
                const x = Math.cos(a) * r;
                const z = Math.sin(a) * r;
                const ry = random() * 3;
                const base = hgt * (0.9 + random() * 0.7);
                config.push({ x, y: -2, z, ry, sx: base, sy: hgt, sz: base });
            }
            return config;
        };

        return {
            m1: generateConfig(215, 20, 18, 44),
            m2: generateConfig(275, 26, 30, 72)
        };
    }, []);

    // Skyline config
    const SKYLINE_CONFIG = useMemo(() => {
        let seed = 456;
        function random() {
            const x = Math.sin(seed++) * 10000;
            return x - Math.floor(x);
        }

        const config = [];
        for (let i = 0; i < 52; i++) {
            const a = (i / 52) * Math.PI * 2 + (random() - 0.5) * 0.08;
            const r = 118 + random() * 46;
            const hgt = 14 + random() * 34;
            const x = Math.cos(a) * r;
            const y = hgt / 2;
            const z = Math.sin(a) * r;
            const ry = -a + Math.PI / 2 + (random() - 0.5) * 0.4;
            const sx = 7 + random() * 9;
            const sy = hgt;
            const sz = 7 + random() * 9;
            config.push({ x, y, z, ry, sx, sy, sz });
        }
        return config;
    }, []);

    // Stars positions (hemisphere)
    const starPositions = useMemo(() => {
        let seed = 789;
        function random() {
            const x = Math.sin(seed++) * 10000;
            return x - Math.floor(x);
        }

        const n = starCount;
        const arr = new Float32Array(n * 3);
        for (let i = 0; i < n; i++) {
            const a = random() * Math.PI * 2;
            const e = 0.12 + random() * 1.2;
            const r = 380;
            arr[i * 3] = Math.cos(a) * Math.cos(e) * r;
            arr[i * 3 + 1] = Math.sin(e) * r;
            arr[i * 3 + 2] = Math.sin(a) * Math.cos(e) * r;
        }
        return arr;
    }, [starCount]);

    // 4. Instanced Meshes matrix composition
    useLayoutEffect(() => {
        const tempObj = new THREE.Object3D();

        // Setup Grass
        GRASS_POSITIONS.forEach((pos, idx) => {
            tempObj.position.set(pos.x, 0, pos.z);
            tempObj.rotation.set(0, pos.ry1, 0);
            tempObj.scale.set(pos.s, pos.s, pos.s);
            tempObj.updateMatrix();
            imRef1.current.setMatrixAt(idx, tempObj.matrix);

            tempObj.rotation.set(0, pos.ry2, 0);
            tempObj.updateMatrix();
            imRef2.current.setMatrixAt(idx, tempObj.matrix);
        });
        imRef1.current.instanceMatrix.needsUpdate = true;
        imRef2.current.instanceMatrix.needsUpdate = true;

        // Setup Mountains 1
        MOUNTAINS_CONFIG.m1.forEach((m, idx) => {
            tempObj.position.set(m.x, m.y, m.z);
            tempObj.rotation.set(0, m.ry, 0);
            tempObj.scale.set(m.sx, m.sy, m.sz);
            tempObj.updateMatrix();
            montRef1.current.setMatrixAt(idx, tempObj.matrix);
        });
        montRef1.current.instanceMatrix.needsUpdate = true;

        // Setup Mountains 2
        MOUNTAINS_CONFIG.m2.forEach((m, idx) => {
            tempObj.position.set(m.x, m.y, m.z);
            tempObj.rotation.set(0, m.ry, 0);
            tempObj.scale.set(m.sx, m.sy, m.sz);
            tempObj.updateMatrix();
            montRef2.current.setMatrixAt(idx, tempObj.matrix);
        });
        montRef2.current.instanceMatrix.needsUpdate = true;

        // Setup Skyline
        SKYLINE_CONFIG.forEach((s, idx) => {
            tempObj.position.set(s.x, s.y, s.z);
            tempObj.rotation.set(0, s.ry, 0);
            tempObj.scale.set(s.sx, s.sy, s.sz);
            tempObj.updateMatrix();
            skylineRef.current.setMatrixAt(idx, tempObj.matrix);
        });
        skylineRef.current.instanceMatrix.needsUpdate = true;
    }, [GRASS_POSITIONS, MOUNTAINS_CONFIG, SKYLINE_CONFIG]);

    // 5. Day-Night cycles animation
    useFrame(() => {
        const k = nightRef.current ?? 0;

        // Lerp mountains color
        if (matMontRef1.current) {
            matMontRef1.current.color.copy(colJourMont1).lerp(colNuitMont1, k);
        }
        if (matMontRef2.current) {
            matMontRef2.current.color.copy(colJourMont2).lerp(colNuitMont2, k);
        }

        // Lerp skyline emissive glow
        if (skyMatRef.current) {
            skyMatRef.current.emissiveIntensity = 0.9 * k;
        }

        // Lerp stars opacity (above 0.35 threshold)
        if (starMatRef.current) {
            const starsOpacity = k > 0.35 ? ((k - 0.35) / 0.65) * 1.4 : 0;
            starMatRef.current.opacity = starsOpacity;
            if (starsRef.current) starsRef.current.visible = starsOpacity > 0;
        }

        // Moon fades in slightly before the stars
        const moonK = k > 0.25 ? (k - 0.25) / 0.75 : 0;
        if (moonGroupRef.current) moonGroupRef.current.visible = moonK > 0;
        if (moonMatRef.current) moonMatRef.current.opacity = moonK;
        if (moonHaloMatRef.current) moonHaloMatRef.current.opacity = moonK * 0.22;
    });

    return (
        <group>
            {/* Grass Layers */}
            <instancedMesh key={`g1-${grassCount}`} ref={imRef1} args={[gGeo, null, grassCount]}>
                <meshStandardMaterial
                    map={textures.texGrass}
                    alphaTest={0.35}
                    side={THREE.DoubleSide}
                    roughness={1}
                />
            </instancedMesh>

            <instancedMesh key={`g2-${grassCount}`} ref={imRef2} args={[gGeo, null, grassCount]}>
                <meshStandardMaterial
                    map={textures.texGrass}
                    alphaTest={0.35}
                    side={THREE.DoubleSide}
                    roughness={1}
                />
            </instancedMesh>

            {/* Mountains (Inner Ring) */}
            <instancedMesh ref={montRef1} args={[coneGeo, null, 20]}>
                <meshStandardMaterial
                    ref={matMontRef1}
                    roughness={1}
                    flatShading
                />
            </instancedMesh>

            {/* Mountains (Outer Ring) */}
            <instancedMesh ref={montRef2} args={[coneGeo, null, 26]}>
                <meshStandardMaterial
                    ref={matMontRef2}
                    roughness={1}
                    flatShading
                />
            </instancedMesh>

            {/* Skyline Blocks */}
            <instancedMesh ref={skylineRef} args={[skyBoxGeo, null, 52]}>
                <meshStandardMaterial
                    ref={skyMatRef}
                    map={textures.texSkyline.map}
                    emissiveMap={textures.texSkyline.emissiveMap}
                    emissive="#ffd9a0"
                    emissiveIntensity={0}
                    roughness={0.9}
                />
            </instancedMesh>

            {/* Stars Particle System */}
            <points ref={starsRef} key={`stars-${starCount}`} frustumCulled={false} visible={false}>
                <bufferGeometry>
                    <bufferAttribute
                        attach="attributes-position"
                        args={[starPositions, 3]}
                    />
                </bufferGeometry>
                <pointsMaterial
                    ref={starMatRef}
                    color="#dfe6ff"
                    size={1.6}
                    sizeAttenuation={false}
                    transparent
                    opacity={0}
                    fog={false}
                />
            </points>

            {/* Moon — night-only, opposite the sun. fog=false: it sits at ~314 m, far beyond
                the 210 m fog cutoff, so fogged it would vanish into the sky colour (same
                reason the stars material disables fog). */}
            <group ref={moonGroupRef} position={[-170, 240, -110]} visible={false}>
                <mesh>
                    <sphereGeometry args={[16, 24, 18]} />
                    <meshBasicMaterial
                        ref={moonMatRef}
                        color="#e9edf9"
                        transparent
                        opacity={0}
                        fog={false}
                    />
                </mesh>
                {/* Additive halo: fullscreen-ish overdraw when the moon is up — skipped on LOW */}
                {!isLow && (
                    <mesh>
                        <sphereGeometry args={[22, 24, 18]} />
                        <meshBasicMaterial
                            ref={moonHaloMatRef}
                            color="#aebdf2"
                            transparent
                            opacity={0}
                            fog={false}
                            blending={THREE.AdditiveBlending}
                            depthWrite={false}
                        />
                    </mesh>
                )}
            </group>
        </group>
    );
}
