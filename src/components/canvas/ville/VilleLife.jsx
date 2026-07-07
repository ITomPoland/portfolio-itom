import { useEffect, useMemo, useRef } from 'react';
import { useFrame, useThree } from '@react-three/fiber';
import * as THREE from 'three';
import { useScene } from '../../../context/SceneContext';

/**
 * VilleLife — living ambiance ported from the standalone prototype ("Hakkilo XR - Mini
 * Ville 3D (standalone).html"): a procedural bird wandering around the visitor + a close
 * companion drone orbiting them (prototype 'follow' state only — the selfie/celebrate
 * subsystem is a separate DOM feature, out of scope for the decor pass).
 *
 * Both steer relative to the CAMERA every frame, so they work in guide and libre modes
 * and never need the controls' yaw. Prototype's offscreen-hide for the bird is dropped
 * (4 meshes — not worth the frustum checks).
 */

// Drone build (prototype DRONE section, values verbatim) — called once, lazily, from the
// frame loop so every mutable part lives behind a ref (three objects are animated by
// mutation; hook-returned values must not be).
function buildDrone() {
    const Std = (p) => new THREE.MeshStandardMaterial(p);
    const group = new THREE.Group();
    const rotors = [];

    const carbon = Std({ color: 0x1c1e24, roughness: 0.35, metalness: 0.55 });
    const accent = Std({ color: 0xC1502E, roughness: 0.5 });
    const body = new THREE.Mesh(new THREE.BoxGeometry(0.34, 0.1, 0.34), carbon);
    group.add(body);
    const top = new THREE.Mesh(new THREE.BoxGeometry(0.2, 0.06, 0.26), accent);
    top.position.y = 0.075;
    group.add(top);
    // nacelle caméra
    const gimbal = new THREE.Mesh(new THREE.SphereGeometry(0.06, 10, 8), carbon);
    gimbal.position.set(0, -0.08, 0.12);
    group.add(gimbal);
    const lens = new THREE.Mesh(
        new THREE.CylinderGeometry(0.03, 0.03, 0.04, 10),
        Std({ color: 0x54749c, roughness: 0.1, metalness: 0.6 })
    );
    lens.rotation.x = Math.PI / 2;
    lens.position.set(0, -0.08, 0.17);
    group.add(lens);
    const led = new THREE.Mesh(
        new THREE.SphereGeometry(0.025, 8, 6),
        Std({ color: 0x3554E8, emissive: 0x3554E8, emissiveIntensity: 1.6 })
    );
    led.position.set(0, 0.11, 0.1);
    group.add(led);
    const armMat = Std({ color: 0x2a2d36, roughness: 0.4, metalness: 0.5 });
    for (const [sx, sz] of [[-1, -1], [1, -1], [-1, 1], [1, 1]]) {
        const arm = new THREE.Mesh(new THREE.BoxGeometry(0.26, 0.035, 0.05), armMat);
        arm.position.set(sx * 0.21, 0.02, sz * 0.21);
        arm.rotation.y = Math.atan2(sz, sx);
        group.add(arm);
        const hub = new THREE.Mesh(new THREE.CylinderGeometry(0.035, 0.035, 0.05, 8), carbon);
        hub.position.set(sx * 0.3, 0.045, sz * 0.3);
        group.add(hub);
        const rot = new THREE.Mesh(
            new THREE.BoxGeometry(0.3, 0.008, 0.035),
            Std({ color: 0x121014, roughness: 0.3 })
        );
        rot.position.set(sx * 0.3, 0.075, sz * 0.3);
        group.add(rot);
        rotors.push(rot);
        const guard = new THREE.Mesh(new THREE.TorusGeometry(0.17, 0.012, 6, 20), armMat);
        guard.rotation.x = Math.PI / 2;
        guard.position.set(sx * 0.3, 0.06, sz * 0.3);
        group.add(guard);
    }
    group.traverse((o) => { if (o.isMesh) o.castShadow = true; });
    group.position.set(1.5, 2.4, 47);
    return { group, rotors, led };
}

// Scene snapshot for the drone selfie. The canvas is created WITHOUT preserveDrawingBuffer
// (permanent perf cost) → a naive toBlob reads a cleared buffer (black image). Re-rendering
// synchronously in the same tick keeps the buffer valid for the snapshot. Trade-off: this
// plain render bypasses the EffectComposer, so the photo has no bloom on MEDIUM/HIGH tiers.
function downloadSelfie(gl, scene, camera) {
    gl.render(scene, camera);
    gl.domElement.toBlob((blob) => {
        if (!blob) return;
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        const stamp = new Date().toISOString().slice(0, 19).replace(/[T:]/g, '-');
        a.href = url;
        a.download = `hakkilo-selfie-${stamp}.png`;
        a.click();
        URL.revokeObjectURL(url);
    }, 'image/png');
}

export default function VilleLife({ nightRef }) {
    const { camera, gl, scene } = useThree();
    const { villeSelfie, setVilleSelfie, isInRoom, isTeleporting } = useScene();

    const birdRef = useRef();
    const wLRef = useRef();
    const wRRef = useRef();
    const anchorRef = useRef();
    const droneRef = useRef(null);
    const simRef = useRef(null);

    // --- Bird materials/geometries (prototype OISEAU section, values verbatim) ---
    const birdParts = useMemo(() => {
        const bodyMat = new THREE.MeshStandardMaterial({ color: 0x35404f, roughness: 0.8, flatShading: true });
        const wingMat = new THREE.MeshStandardMaterial({ color: 0x27303c, roughness: 0.8, side: THREE.DoubleSide, flatShading: true });
        const bodyGeo = new THREE.ConeGeometry(0.09, 0.5, 5);
        const headGeo = new THREE.SphereGeometry(0.075, 6, 5);
        const wingGeo = new THREE.PlaneGeometry(0.46, 0.16);
        wingGeo.translate(0.23, 0, 0); // hinge at the body so rotation.z flaps
        return { bodyMat, wingMat, bodyGeo, headGeo, wingGeo };
    }, []);

    // Imperatively-built drone isn't auto-disposed by R3F.
    useEffect(() => () => {
        const d = droneRef.current;
        if (!d) return;
        d.group.traverse((o) => {
            if (o.isMesh) {
                o.geometry.dispose();
                o.material.dispose();
            }
        });
    }, []);

    useFrame((state, delta) => {
        // Lazy init: flight state + drone are born here so all frame mutations go
        // through refs, never through hook-returned values.
        if (!simRef.current) {
            simRef.current = {
                vel: new THREE.Vector3(1, 0, 0),
                target: new THREE.Vector3(),
                tmp: new THREE.Vector3(),
                fwd: new THREE.Vector3(),
                bobT: Math.random() * 9,
                selfiePhase: 'idle', // 'idle' | 'pose' | 'celebrate' (prototype drone states)
                selfieT: 0,
            };
            pickBirdTarget(simRef.current, camera);
        }
        if (!droneRef.current && anchorRef.current) {
            droneRef.current = buildDrone();
            anchorRef.current.add(droneRef.current.group);
        }

        const dt = Math.min(delta, 0.1); // clamp tab-back spikes
        const t = state.clock.elapsedTime;
        const s = simRef.current;

        // --- Bird: flap + wander-steer around the visitor (prototype loop, verbatim values) ---
        const bird = birdRef.current;
        if (bird) {
            const f = Math.sin(t * 14) * 0.75;
            if (wLRef.current) wLRef.current.rotation.z = f;
            if (wRRef.current) wRRef.current.rotation.z = Math.PI - f;

            s.tmp.copy(s.target).sub(bird.position);
            if (s.tmp.length() < 2 || Math.random() < dt * 0.12) pickBirdTarget(s, camera);
            s.tmp.normalize().multiplyScalar(4.2 * dt);
            s.vel.lerp(s.tmp, 0.04);
            bird.position.add(s.vel);
            bird.lookAt(
                bird.position.x + s.vel.x,
                bird.position.y + s.vel.y * 0.4,
                bird.position.z + s.vel.z
            );
            // drifted too far from the visitor → pull the next target back around them
            if (bird.position.distanceTo(camera.position) > 34) pickBirdTarget(s, camera);
        }

        // --- Drone: rotors, pulsing LED, close-follow orbit in front of the visitor ---
        /* eslint-disable react-hooks/immutability -- three objects are animated by mutation
           in the frame loop (standard R3F escape hatch). The rule taints droneRef because an
           effect reads it, but that effect is only the unmount disposal. */
        const drone = droneRef.current;
        if (drone) {
            s.bobT += dt;
            for (const r of drone.rotors) r.rotation.y += dt * 40;
            drone.led.material.emissiveIntensity = 1 + Math.sin(t * 6) * 0.8 + (nightRef?.current ?? 0);

            // Selfie sequence transitions (prototype ask/selfie → celebrate → follow).
            // Player camera/controls are never touched — only the drone moves.
            if (villeSelfie && s.selfiePhase === 'idle' && !isInRoom && !isTeleporting) {
                s.selfiePhase = 'pose';
                s.selfieT = 0;
            } else if (s.selfiePhase !== 'idle' && (isInRoom || isTeleporting)) {
                s.selfiePhase = 'idle'; // abort: visitor entered a building mid-sequence
                setVilleSelfie(false);
            }

            camera.getWorldDirection(s.fwd);
            const base = Math.atan2(s.fwd.x, s.fwd.z); // camera heading in the XZ plane
            let a, dist, ty;
            let lerpK = Math.min(1, dt * 1.6);
            if (s.selfiePhase === 'pose') {
                // straight in front of the visitor, close (prototype 'ask'/'selfie' target)
                s.selfieT += dt;
                a = base;
                dist = 1.9;
                ty = camera.position.y + 0.25 + Math.sin(s.bobT * 2.2) * 0.06;
                lerpK = Math.min(1, dt * 3);
                if (s.selfieT > 1.8) {
                    downloadSelfie(gl, scene, camera);
                    s.selfiePhase = 'celebrate';
                    s.selfieT = 0;
                }
            } else if (s.selfiePhase === 'celebrate') {
                // joy wiggle (prototype 'celebrate'), then back to follow
                s.selfieT += dt;
                const spin = s.selfieT * 4;
                a = base + Math.sin(spin) * 0.8;
                dist = 2.4;
                ty = camera.position.y + 0.7 + Math.sin(spin * 2) * 0.3;
                lerpK = Math.min(1, dt * 3);
                if (s.selfieT > 2.6) {
                    s.selfiePhase = 'idle';
                    setVilleSelfie(false);
                }
            } else {
                a = base + 0.9 + Math.sin(t * 0.5) * 0.35;
                dist = 2.6 + Math.sin(s.bobT * 0.7) * 0.4;
                ty = camera.position.y + 0.55 + Math.sin(s.bobT * 1.8) * 0.12;
            }
            const tx = camera.position.x + Math.sin(a) * dist;
            const tz = camera.position.z + Math.cos(a) * dist;
            const p = drone.group.position;
            p.x += (tx - p.x) * lerpK;
            p.y += (ty - p.y) * lerpK;
            p.z += (tz - p.z) * lerpK;
            drone.group.lookAt(camera.position.x, camera.position.y + 0.1, camera.position.z);
        }
        /* eslint-enable react-hooks/immutability */
    });

    return (
        <group ref={anchorRef}>
            <group ref={birdRef} position={[6, 7, 40]}>
                <mesh geometry={birdParts.bodyGeo} material={birdParts.bodyMat} rotation-x={Math.PI / 2} />
                <mesh geometry={birdParts.headGeo} material={birdParts.bodyMat} position={[0, 0.02, 0.28]} />
                <mesh ref={wLRef} geometry={birdParts.wingGeo} material={birdParts.wingMat} />
                <mesh ref={wRRef} geometry={birdParts.wingGeo} material={birdParts.wingMat} rotation-y={Math.PI} />
            </group>
        </group>
    );
}

// Prototype `birdPickTarget`: a fresh wander waypoint on a ring around the visitor.
function pickBirdTarget(s, camera) {
    const a = Math.random() * Math.PI * 2;
    const r = 9 + Math.random() * 15;
    s.target.set(
        camera.position.x + Math.cos(a) * r,
        3.5 + Math.random() * 8,
        camera.position.z + Math.sin(a) * r
    );
}
