import { useRef, useEffect } from 'react';
import { useThree, useFrame } from '@react-three/fiber';
import * as THREE from 'three';
import {
    VILLE_SPAWN,
    VILLE_BOUNDS,
    VILLE_EYE_Y,
    VILLE_WALK_SPEED,
    VILLE_RUN_SPEED,
    VILLE_TURN_SPEED,
    VILLE_LOOK_SENSITIVITY,
    VILLE_PITCH_SENSITIVITY,
    VILLE_PITCH_CLAMP,
} from '../components/canvas/ville/villeConfig';

/**
 * useVilleControls — GTA-style free-walk controls for the Mini Ville exterior.
 *
 * KEY FIX vs the Claude Design prototype: Q and D used to STRAFE (walk sideways). They now YAW
 * the camera (turn left/right) — the requested "comme dans GTA" feel. Bindings:
 *   - Forward / back : Z, W, ArrowUp  /  S, ArrowDown
 *   - Turn (yaw)     : Q, A, ArrowLeft (left)  /  D, ArrowRight (right)   ← the fix
 *   - Look           : mouse drag (yaw + pitch)
 *   - Sprint         : Shift
 *
 * Invariant preserved: when `enabled` is false (inside a building or mid-teleport) the hook does
 * NOT touch the camera, so DoorSection / TeleportRoom keep ownership of the room-entry camera.
 * Position/yaw/pitch persist while disabled, so leaving a room drops you back where you stood.
 */
export default function useVilleControls({ enabled = true, collidersRef = null } = {}) {
    const { camera, gl } = useThree();

    const keys = useRef({});
    const yaw = useRef(VILLE_SPAWN.yaw);
    const pitch = useRef(VILLE_SPAWN.pitch);
    const pos = useRef(new THREE.Vector3(...VILLE_SPAWN.position));
    const dragging = useRef(false);
    const last = useRef({ x: 0, y: 0 });
    const enabledRef = useRef(enabled);
    const wasEnabled = useRef(false);
    const tmpDir = useRef(new THREE.Vector3());

    // Keep the latest `enabled` readable inside the (stable) event closures.
    enabledRef.current = enabled;

    // Input listeners (mounted for the hook's lifetime; they early-out when disabled).
    useEffect(() => {
        const dom = gl.domElement;

        const onKeyDown = (e) => {
            const tag = e.target.tagName;
            if (tag === 'INPUT' || tag === 'TEXTAREA' || tag === 'SELECT') return;
            keys.current[e.code] = true;
        };
        const onKeyUp = (e) => { keys.current[e.code] = false; };
        const onPointerDown = (e) => { dragging.current = true; last.current = { x: e.clientX, y: e.clientY }; };
        const onPointerUp = () => { dragging.current = false; };
        const onPointerMove = (e) => {
            if (!dragging.current || !enabledRef.current) return;
            const dx = (e.clientX - last.current.x) / window.innerWidth;
            const dy = (e.clientY - last.current.y) / window.innerHeight;
            last.current = { x: e.clientX, y: e.clientY };
            yaw.current -= dx * VILLE_LOOK_SENSITIVITY;
            pitch.current = THREE.MathUtils.clamp(
                pitch.current - dy * VILLE_PITCH_SENSITIVITY,
                -VILLE_PITCH_CLAMP,
                VILLE_PITCH_CLAMP,
            );
        };

        window.addEventListener('keydown', onKeyDown);
        window.addEventListener('keyup', onKeyUp);
        dom.addEventListener('pointerdown', onPointerDown);
        window.addEventListener('pointerup', onPointerUp);
        window.addEventListener('pointermove', onPointerMove);
        return () => {
            window.removeEventListener('keydown', onKeyDown);
            window.removeEventListener('keyup', onKeyUp);
            dom.removeEventListener('pointerdown', onPointerDown);
            window.removeEventListener('pointerup', onPointerUp);
            window.removeEventListener('pointermove', onPointerMove);
        };
    }, [gl]);

    useFrame((_, delta) => {
        camera.rotation.order = 'YXZ';

        if (!enabledRef.current) { wasEnabled.current = false; return; }

        // On (re)enable, restore the saved city camera (spawn on first entry, last spot after a room).
        if (!wasEnabled.current) {
            camera.position.copy(pos.current);
            wasEnabled.current = true;
        }

        const k = keys.current;
        const dt = Math.min(delta, 0.05); // clamp long frames (tab refocus, GC hitches…)

        // --- Yaw from keyboard (THE FIX: turn instead of strafe) ---
        const turn = (k.KeyD || k.ArrowRight ? 1 : 0) - (k.KeyQ || k.KeyA || k.ArrowLeft ? 1 : 0);
        if (turn) yaw.current -= turn * VILLE_TURN_SPEED * dt;

        // --- Forward / back (no keyboard strafe anymore) ---
        const fwd = (k.KeyW || k.KeyZ || k.ArrowUp ? 1 : 0) - (k.KeyS || k.ArrowDown ? 1 : 0);
        if (fwd) {
            const speed = (k.ShiftLeft || k.ShiftRight ? VILLE_RUN_SPEED : VILLE_WALK_SPEED) * dt;
            // Forward at yaw=0 points to −Z (three.js camera default).
            tmpDir.current.set(Math.sin(yaw.current) * -fwd, 0, Math.cos(yaw.current) * -fwd).multiplyScalar(speed);
            pos.current.add(tmpDir.current);
        }

        // Keep inside the walkable bounds.
        pos.current.x = THREE.MathUtils.clamp(pos.current.x, -VILLE_BOUNDS, VILLE_BOUNDS);
        pos.current.z = THREE.MathUtils.clamp(pos.current.z, -VILLE_BOUNDS, VILLE_BOUNDS);

        // Sphere-collider push-back (buildings/decor register { x, z, r }).
        const colliders = collidersRef?.current;
        if (colliders) {
            for (const c of colliders) {
                const ddx = pos.current.x - c.x;
                const ddz = pos.current.z - c.z;
                const d = Math.hypot(ddx, ddz);
                if (d < c.r && d > 0.001) {
                    pos.current.x = c.x + (ddx / d) * c.r;
                    pos.current.z = c.z + (ddz / d) * c.r;
                }
            }
        }

        pos.current.y = VILLE_EYE_Y;

        // Commit transform.
        camera.position.copy(pos.current);
        camera.rotation.y = yaw.current;
        camera.rotation.x = pitch.current;
        camera.rotation.z = 0;
    });

    return {
        getYaw: () => yaw.current,
        getPosition: () => pos.current,
        resetToSpawn: () => {
            pos.current.set(...VILLE_SPAWN.position);
            yaw.current = VILLE_SPAWN.yaw;
            pitch.current = VILLE_SPAWN.pitch;
            wasEnabled.current = false;
        },
    };
}
