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
    VILLE_TOUR_WAYPOINTS,
    VILLE_TOUR_TENSION,
    VILLE_TOUR_SCROLL_SENS,
    VILLE_TOUR_SWIPE_SENS,
} from '../components/canvas/ville/villeConfig';

const JOYSTICK_RADIUS = 46;      // px from touch-start = full joystick input (libre mode)
const GUIDE_YAW_CLAMP = 1.6;     // rad — look-around limits in guided mode
const GUIDE_PITCH_CLAMP = 0.9;

// Guided-tour spline, built once from the config waypoints (faithful to the prototype).
const TOUR_PATH = new THREE.CatmullRomCurve3(
    VILLE_TOUR_WAYPOINTS.map((w) => new THREE.Vector3(w[0], w[1], w[2])),
    false,
    'catmullrom',
    VILLE_TOUR_TENSION,
);

/**
 * useVilleControls — two navigation modes for the Mini Ville, MOBILE-FIRST.
 *
 * mode='guide' (DEFAULT): guided scroll tour. The camera follows a CatmullRom spline through the
 *   city; you advance with the wheel (desktop) or a vertical swipe (mobile), and glance around with
 *   a drag (a damped offset that springs back to the path-forward direction).
 * mode='libre': free walk. Z/W/S + Q/A/D/arrows (Q/D = turn, not strafe) on desktop; on mobile the
 *   left half is a move joystick and the right half is look-drag.
 *
 * Invariant preserved: when `enabled` is false (inside a building / mid-teleport) the hook does NOT
 * touch the camera, so DoorSection / TeleportRoom keep the room-entry camera. Guide progress (pathT)
 * and free-walk position persist while disabled → leaving a room resumes where you were.
 */
export default function useVilleControls({ enabled = true, mode = 'guide', collidersRef = null } = {}) {
    const { camera, gl } = useThree();

    const enabledRef = useRef(enabled);
    const modeRef = useRef(mode);
    const prevMode = useRef(mode);
    enabledRef.current = enabled;
    modeRef.current = mode;

    // Free-walk state.
    const keys = useRef({});
    const yaw = useRef(VILLE_SPAWN.yaw);
    const pitch = useRef(VILLE_SPAWN.pitch);
    const pos = useRef(new THREE.Vector3(...VILLE_SPAWN.position));
    const tmpDir = useRef(new THREE.Vector3());
    const tmpFwd = useRef(new THREE.Vector3());

    // Guided-tour state.
    const pathT = useRef(0);
    const pathTTarget = useRef(0);
    const lookYawOff = useRef(0);
    const lookPitchOff = useRef(0);
    const tmpP = useRef(new THREE.Vector3());
    const tmpAhead = useRef(new THREE.Vector3());

    // Shared pointer state.
    const mouseDrag = useRef({ active: false, x: 0, y: 0 });
    const touchMove = useRef({ id: null, ox: 0, oy: 0, x: 0, y: 0 }); // libre joystick, normalized
    const touchLook = useRef({ id: null, x: 0, y: 0 });               // guide/libre look-drag

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

        // Wheel advances the guided tour (desktop).
        const onWheel = (e) => {
            if (!enabledRef.current || modeRef.current !== 'guide') return;
            pathTTarget.current = THREE.MathUtils.clamp(pathTTarget.current + e.deltaY * VILLE_TOUR_SCROLL_SENS, 0, 1);
        };

        // A drag delta, interpreted per mode + input type.
        const applyDrag = (dxPx, dyPx, isTouch) => {
            if (modeRef.current === 'guide') {
                lookYawOff.current = THREE.MathUtils.clamp(
                    lookYawOff.current - (dxPx / window.innerWidth) * VILLE_LOOK_SENSITIVITY,
                    -GUIDE_YAW_CLAMP, GUIDE_YAW_CLAMP,
                );
                if (isTouch) {
                    // vertical swipe advances the tour (drag up = forward)
                    pathTTarget.current = THREE.MathUtils.clamp(
                        pathTTarget.current - (dyPx / window.innerHeight) * VILLE_TOUR_SWIPE_SENS, 0, 1,
                    );
                } else {
                    lookPitchOff.current = THREE.MathUtils.clamp(
                        lookPitchOff.current - (dyPx / window.innerHeight) * VILLE_PITCH_SENSITIVITY,
                        -GUIDE_PITCH_CLAMP, GUIDE_PITCH_CLAMP,
                    );
                }
            } else {
                yaw.current -= (dxPx / window.innerWidth) * VILLE_LOOK_SENSITIVITY;
                pitch.current = THREE.MathUtils.clamp(
                    pitch.current - (dyPx / window.innerHeight) * VILLE_PITCH_SENSITIVITY,
                    -VILLE_PITCH_CLAMP, VILLE_PITCH_CLAMP,
                );
            }
        };

        const onPointerDown = (e) => {
            if (e.pointerType === 'touch') {
                // libre + left half = move joystick; everything else = look/advance drag
                if (modeRef.current === 'libre' && e.clientX < window.innerWidth / 2) {
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
                    applyDrag(e.clientX - touchLook.current.x, e.clientY - touchLook.current.y, true);
                    touchLook.current.x = e.clientX;
                    touchLook.current.y = e.clientY;
                }
            } else if (mouseDrag.current.active) {
                applyDrag(e.clientX - mouseDrag.current.x, e.clientY - mouseDrag.current.y, false);
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
        window.addEventListener('wheel', onWheel, { passive: true });
        dom.addEventListener('pointerdown', onPointerDown);
        window.addEventListener('pointermove', onPointerMove);
        window.addEventListener('pointerup', onPointerUp);
        window.addEventListener('pointercancel', onPointerUp);
        window.addEventListener('blur', onBlur);
        return () => {
            dom.style.touchAction = prevTouchAction;
            window.removeEventListener('keydown', onKeyDown);
            window.removeEventListener('keyup', onKeyUp);
            window.removeEventListener('wheel', onWheel);
            dom.removeEventListener('pointerdown', onPointerDown);
            window.removeEventListener('pointermove', onPointerMove);
            window.removeEventListener('pointerup', onPointerUp);
            window.removeEventListener('pointercancel', onPointerUp);
            window.removeEventListener('blur', onBlur);
        };
    }, [gl]);

    useFrame((_, delta) => {
        camera.rotation.order = 'YXZ';
        if (!enabledRef.current) return;

        const dt = Math.min(delta, 0.05);
        const m = modeRef.current;

        // On switch INTO free-walk, seed yaw/pitch/pos from the current camera (no jump).
        if (prevMode.current !== m) {
            if (m === 'libre') {
                const d = tmpFwd.current;
                camera.getWorldDirection(d);
                yaw.current = Math.atan2(-d.x, -d.z) + Math.PI;
                pitch.current = Math.asin(THREE.MathUtils.clamp(d.y, -1, 1));
                pos.current.copy(camera.position);
                pos.current.y = VILLE_EYE_Y;
            }
            prevMode.current = m;
        }

        if (m === 'guide') {
            pathT.current += (pathTTarget.current - pathT.current) * Math.min(1, dt * 3.5);
            const p = TOUR_PATH.getPointAt(THREE.MathUtils.clamp(pathT.current, 0, 1), tmpP.current);
            const ahead = TOUR_PATH.getPointAt(Math.min(pathT.current + 0.012, 1), tmpAhead.current);
            const baseYaw = Math.atan2(-(ahead.x - p.x), -(ahead.z - p.z)) + Math.PI;
            // Look-around springs back toward the path-forward direction.
            lookYawOff.current *= (1 - Math.min(1, dt * 0.8));
            lookPitchOff.current *= (1 - Math.min(1, dt * 0.8));
            camera.position.copy(p);
            camera.rotation.y = baseYaw + lookYawOff.current;
            camera.rotation.x = lookPitchOff.current;
            camera.rotation.z = 0;
            return;
        }

        // --- Free walk ---
        const k = keys.current;
        let turn = (k.KeyD || k.ArrowRight ? 1 : 0) - (k.KeyQ || k.KeyA || k.ArrowLeft ? 1 : 0);
        turn = THREE.MathUtils.clamp(turn + touchMove.current.x, -1, 1);
        if (turn) yaw.current -= turn * VILLE_TURN_SPEED * dt;

        let fwd = (k.KeyW || k.KeyZ || k.ArrowUp ? 1 : 0) - (k.KeyS || k.ArrowDown ? 1 : 0);
        fwd = THREE.MathUtils.clamp(fwd - touchMove.current.y, -1, 1);
        if (fwd) {
            const speed = (k.ShiftLeft || k.ShiftRight ? VILLE_RUN_SPEED : VILLE_WALK_SPEED) * dt;
            tmpDir.current.set(Math.sin(yaw.current) * -fwd, 0, Math.cos(yaw.current) * -fwd).multiplyScalar(speed);
            pos.current.add(tmpDir.current);
        }

        pos.current.x = THREE.MathUtils.clamp(pos.current.x, -VILLE_BOUNDS, VILLE_BOUNDS);
        pos.current.z = THREE.MathUtils.clamp(pos.current.z, -VILLE_BOUNDS, VILLE_BOUNDS);

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
}
