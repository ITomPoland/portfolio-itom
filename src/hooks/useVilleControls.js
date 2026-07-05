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

// Drag this many px from the touch-start = full joystick input.
const JOYSTICK_RADIUS = 46;

/**
 * useVilleControls — GTA-style free-walk controls for the Mini Ville, MOBILE-FIRST.
 *
 * Desktop:
 *   - Forward / back : Z, W, ArrowUp / S, ArrowDown
 *   - Turn (yaw)     : Q, A, ArrowLeft / D, ArrowRight        (FIX: Q/D turn, they no longer strafe)
 *   - Look           : mouse drag
 * Mobile (touch, split screen):
 *   - LEFT half  = move joystick (drag up/down = forward/back, left/right = turn — no strafe)
 *   - RIGHT half = look-drag (yaw + pitch)
 *
 * Invariant preserved: when `enabled` is false (inside a building / mid-teleport) the hook does NOT
 * touch the camera, so DoorSection / TeleportRoom keep the room-entry camera. Position/yaw/pitch
 * persist while disabled → leaving a room drops you back where you stood.
 */
export default function useVilleControls({ enabled = true, collidersRef = null } = {}) {
    const { camera, gl } = useThree();

    const keys = useRef({});
    const yaw = useRef(VILLE_SPAWN.yaw);
    const pitch = useRef(VILLE_SPAWN.pitch);
    const pos = useRef(new THREE.Vector3(...VILLE_SPAWN.position));
    const enabledRef = useRef(enabled);
    const wasEnabled = useRef(false);
    const tmpDir = useRef(new THREE.Vector3());

    // Desktop mouse drag-look.
    const mouseDrag = useRef({ active: false, x: 0, y: 0 });
    // Touch: left-half move joystick (x/y normalized -1..1), right-half look (last client pos).
    const touchMove = useRef({ id: null, ox: 0, oy: 0, x: 0, y: 0 });
    const touchLook = useRef({ id: null, x: 0, y: 0 });

    enabledRef.current = enabled;

    useEffect(() => {
        const dom = gl.domElement;
        const prevTouchAction = dom.style.touchAction;
        dom.style.touchAction = 'none'; // stop mobile scroll/zoom stealing our gestures

        const onKeyDown = (e) => {
            const tag = e.target.tagName;
            if (tag === 'INPUT' || tag === 'TEXTAREA' || tag === 'SELECT') return;
            keys.current[e.code] = true;
        };
        const onKeyUp = (e) => { keys.current[e.code] = false; };

        const applyLook = (dxPx, dyPx) => {
            yaw.current -= (dxPx / window.innerWidth) * VILLE_LOOK_SENSITIVITY;
            pitch.current = THREE.MathUtils.clamp(
                pitch.current - (dyPx / window.innerHeight) * VILLE_PITCH_SENSITIVITY,
                -VILLE_PITCH_CLAMP,
                VILLE_PITCH_CLAMP,
            );
        };

        const onPointerDown = (e) => {
            if (e.pointerType === 'touch') {
                if (e.clientX < window.innerWidth / 2) {
                    touchMove.current = { id: e.pointerId, ox: e.clientX, oy: e.clientY, x: 0, y: 0 };
                } else {
                    touchLook.current = { id: e.pointerId, x: e.clientX, y: e.clientY };
                }
            } else {
                mouseDrag.current = { active: true, x: e.clientX, y: e.clientY };
            }
        };
        const onPointerMove = (e) => {
            if (!enabledRef.current) return;
            if (e.pointerType === 'touch') {
                if (e.pointerId === touchMove.current.id) {
                    touchMove.current.x = THREE.MathUtils.clamp((e.clientX - touchMove.current.ox) / JOYSTICK_RADIUS, -1, 1);
                    touchMove.current.y = THREE.MathUtils.clamp((e.clientY - touchMove.current.oy) / JOYSTICK_RADIUS, -1, 1);
                } else if (e.pointerId === touchLook.current.id) {
                    applyLook(e.clientX - touchLook.current.x, e.clientY - touchLook.current.y);
                    touchLook.current.x = e.clientX;
                    touchLook.current.y = e.clientY;
                }
            } else if (mouseDrag.current.active) {
                applyLook(e.clientX - mouseDrag.current.x, e.clientY - mouseDrag.current.y);
                mouseDrag.current.x = e.clientX;
                mouseDrag.current.y = e.clientY;
            }
        };
        const onPointerUp = (e) => {
            if (e.pointerId === touchMove.current.id) touchMove.current = { id: null, ox: 0, oy: 0, x: 0, y: 0 };
            else if (e.pointerId === touchLook.current.id) touchLook.current = { id: null, x: 0, y: 0 };
            mouseDrag.current.active = false;
        };
        const onBlur = () => {
            keys.current = {};
            mouseDrag.current.active = false;
            touchMove.current = { id: null, ox: 0, oy: 0, x: 0, y: 0 };
            touchLook.current = { id: null, x: 0, y: 0 };
        };

        window.addEventListener('keydown', onKeyDown);
        window.addEventListener('keyup', onKeyUp);
        dom.addEventListener('pointerdown', onPointerDown);
        window.addEventListener('pointermove', onPointerMove);
        window.addEventListener('pointerup', onPointerUp);
        window.addEventListener('pointercancel', onPointerUp);
        window.addEventListener('blur', onBlur);
        return () => {
            dom.style.touchAction = prevTouchAction;
            window.removeEventListener('keydown', onKeyDown);
            window.removeEventListener('keyup', onKeyUp);
            dom.removeEventListener('pointerdown', onPointerDown);
            window.removeEventListener('pointermove', onPointerMove);
            window.removeEventListener('pointerup', onPointerUp);
            window.removeEventListener('pointercancel', onPointerUp);
            window.removeEventListener('blur', onBlur);
        };
    }, [gl]);

    useFrame((_, delta) => {
        camera.rotation.order = 'YXZ';

        if (!enabledRef.current) { wasEnabled.current = false; return; }
        if (!wasEnabled.current) { camera.position.copy(pos.current); wasEnabled.current = true; }

        const k = keys.current;
        const dt = Math.min(delta, 0.05);

        // --- Turn (yaw): keyboard + touch joystick X. No strafe. ---
        let turn = (k.KeyD || k.ArrowRight ? 1 : 0) - (k.KeyQ || k.KeyA || k.ArrowLeft ? 1 : 0);
        turn = THREE.MathUtils.clamp(turn + touchMove.current.x, -1, 1);
        if (turn) yaw.current -= turn * VILLE_TURN_SPEED * dt;

        // --- Forward / back: keyboard + touch joystick Y (drag up = forward). ---
        let fwd = (k.KeyW || k.KeyZ || k.ArrowUp ? 1 : 0) - (k.KeyS || k.ArrowDown ? 1 : 0);
        fwd = THREE.MathUtils.clamp(fwd - touchMove.current.y, -1, 1);
        if (fwd) {
            const speed = (k.ShiftLeft || k.ShiftRight ? VILLE_RUN_SPEED : VILLE_WALK_SPEED) * dt;
            tmpDir.current.set(Math.sin(yaw.current) * -fwd, 0, Math.cos(yaw.current) * -fwd).multiplyScalar(speed);
            pos.current.add(tmpDir.current);
        }

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
