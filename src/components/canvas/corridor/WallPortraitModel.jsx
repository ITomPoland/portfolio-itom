import {
    forwardRef,
    useCallback,
    useEffect,
    useImperativeHandle,
    useMemo,
    useRef,
    useState
} from 'react';
import { Html, useGLTF } from '@react-three/drei';
import { useFrame } from '@react-three/fiber';
import * as THREE from 'three';

import createPortraitFaceRig from './createPortraitFaceRig';
import PortraitTextChat from './PortraitTextChat';
import usePortraitFaceAnimation from './usePortraitFaceAnimation';
import usePortraitInspection from './usePortraitInspection';
import { useScene } from '../../../context/SceneContext';
import '../../../styles/PortraitControls.scss';

const MODEL_URL = '/models/corridor/female-portrait.glb';
const BASE_ROTATION_Y = Math.PI;
const MAX_YAW = 0.8;
const MAX_TILT = 0.18;
const EYE_INPUT_YAW_RANGE = 0.18;
const EYE_INPUT_PITCH_RANGE = 0.12;
const MAX_EYE_YAW = 0.04;
const MAX_EYE_PITCH = 0.025;
const MAX_IRIS_TRAVEL_X = 0.0044;
const MAX_IRIS_TRAVEL_Y = 0.002;
const EYE_TARGET_DISTANCE = 1.15;
const centerFullscreenHtml = (_object, _camera, size) => [size.width / 2, size.height / 2];

const gazeRaycaster = new THREE.Raycaster();
const eyeWorldPosition = new THREE.Vector3();
const gazeWorldPosition = new THREE.Vector3();
const gazeLocalPosition = new THREE.Vector3();
const gazeDirection = new THREE.Vector3();

/**
 * Pojedynczy relief 3D zawieszony na prawej ścianie pierwszego segmentu.
 * Model ma front skierowany w lokalnym +X, dlatego obracamy go do wnętrza korytarza.
 */
const WallPortraitModel = forwardRef(({
    position,
    scale = 1.15,
    setCameraOverride,
    onSendMessage
}, portraitRef) => {
    const { scene } = useGLTF(MODEL_URL);
    const { modelScene, eyeRigs, mouthRig } = useMemo(
        () => createPortraitFaceRig(scene),
        [scene]
    );
    const rootRef = useRef();
    const visualRef = useRef();
    const yawRef = useRef(0);
    const tiltRef = useRef(0);
    const draggingRef = useRef(false);
    const dragDistanceRef = useRef(0);
    const lastPointerRef = useRef({ x: 0, y: 0 });
    const capturedPointerRef = useRef(null);
    const hasFinePointerRef = useRef(true);
    const [isHovered, setIsHovered] = useState(false);
    const [isChatOpen, setIsChatOpen] = useState(false);
    const [isTextSpeaking, setIsTextSpeaking] = useState(false);
    const { hasEntered, isTeleporting, isInRoom } = useScene();
    const interactionEnabled = hasEntered && !isTeleporting && !isInRoom;

    const handleCloseChat = useCallback(() => {
        setIsChatOpen(false);
        setIsTextSpeaking(false);
    }, []);

    const handleTextSpeakingChange = useCallback((value) => {
        setIsTextSpeaking(Boolean(value));
    }, []);

    const {
        phase,
        isFocused,
        isActive,
        enterInspection,
        exitInspection
    } = usePortraitInspection({
        targetRef: rootRef,
        setCameraOverride,
        onExitStart: handleCloseChat
    });

    const {
        api: faceAnimationApi,
        blink: triggerBlink,
        blinkOpennessRef
    } = usePortraitFaceAnimation({
        eyeRigs,
        mouthRig,
        isTextSpeaking: isTextSpeaking && isFocused
    });

    useImperativeHandle(portraitRef, () => ({
        ...faceAnimationApi,
        openTextChat: () => setIsChatOpen(true),
        closeTextChat: handleCloseChat
    }), [faceAnimationApi, handleCloseChat]);

    const rotateBy = useCallback((delta) => {
        yawRef.current = THREE.MathUtils.clamp(yawRef.current + delta, -MAX_YAW, MAX_YAW);
    }, []);

    const resetRotation = useCallback(() => {
        yawRef.current = 0;
        tiltRef.current = 0;
    }, []);

    const handlePointerDown = useCallback((event) => {
        event.stopPropagation();
        if (!isActive) {
            dragDistanceRef.current = 0;
            return;
        }
        draggingRef.current = true;
        dragDistanceRef.current = 0;
        lastPointerRef.current = { x: event.clientX, y: event.clientY };
        capturedPointerRef.current = {
            target: event.target,
            pointerId: event.pointerId
        };
        event.target?.setPointerCapture?.(event.pointerId);
        document.body.style.cursor = 'grabbing';
    }, [isActive]);

    const handlePointerMove = useCallback((event) => {
        if (!draggingRef.current || !isActive) return;

        const deltaX = event.clientX - lastPointerRef.current.x;
        const deltaY = event.clientY - lastPointerRef.current.y;
        lastPointerRef.current = { x: event.clientX, y: event.clientY };
        dragDistanceRef.current += Math.abs(deltaX) + Math.abs(deltaY);

        yawRef.current = THREE.MathUtils.clamp(
            yawRef.current + deltaX * 0.008,
            -MAX_YAW,
            MAX_YAW
        );
        tiltRef.current = THREE.MathUtils.clamp(
            tiltRef.current + deltaY * 0.004,
            -MAX_TILT,
            MAX_TILT
        );
    }, [isActive]);

    const handlePointerUp = useCallback(() => {
        const capturedPointer = capturedPointerRef.current;
        try {
            capturedPointer?.target?.releasePointerCapture?.(capturedPointer.pointerId);
        } catch {
            // Przeglądarka mogła już automatycznie zwolnić capture po pointerup/blur.
        }
        capturedPointerRef.current = null;
        draggingRef.current = false;
        document.body.style.cursor = isHovered
            ? (isFocused ? 'grab' : 'pointer')
            : 'auto';
    }, [isFocused, isHovered]);

    const handleClick = useCallback((event) => {
        event.stopPropagation();
        if (dragDistanceRef.current > 4) {
            dragDistanceRef.current = 0;
            return;
        }
        if (!isFocused) {
            setIsChatOpen(false);
            setIsTextSpeaking(false);
            enterInspection();
        }
    }, [enterInspection, isFocused]);

    const handleExitInspection = useCallback(() => {
        exitInspection();
    }, [exitInspection]);

    useEffect(() => {
        const finePointerQuery = window.matchMedia('(hover: hover) and (pointer: fine)');
        const updatePointerCapability = () => {
            hasFinePointerRef.current = finePointerQuery.matches;
        };

        updatePointerCapability();
        finePointerQuery.addEventListener?.('change', updatePointerCapability);

        return () => {
            finePointerQuery.removeEventListener?.('change', updatePointerCapability);
        };
    }, []);

    useEffect(() => {
        window.addEventListener('pointermove', handlePointerMove);
        window.addEventListener('pointerup', handlePointerUp);
        window.addEventListener('pointercancel', handlePointerUp);
        window.addEventListener('blur', handlePointerUp);

        return () => {
            window.removeEventListener('pointermove', handlePointerMove);
            window.removeEventListener('pointerup', handlePointerUp);
            window.removeEventListener('pointercancel', handlePointerUp);
            window.removeEventListener('blur', handlePointerUp);
        };
    }, [handlePointerMove, handlePointerUp]);

    useEffect(() => {
        if (!isFocused) {
            yawRef.current = 0;
            tiltRef.current = 0;
            dragDistanceRef.current = 0;
        }
        if (!isActive) handlePointerUp();
    }, [handlePointerUp, isActive, isFocused]);

    useEffect(() => {
        if (!interactionEnabled && isFocused) exitInspection();
    }, [exitInspection, interactionEnabled, isFocused]);

    useEffect(() => {
        if (draggingRef.current) document.body.style.cursor = 'grabbing';
        else if (isHovered) document.body.style.cursor = isFocused ? 'grab' : 'pointer';
        else document.body.style.cursor = 'auto';

        return () => {
            document.body.style.cursor = 'auto';
        };
    }, [isFocused, isHovered]);

    useFrame((state, delta) => {
        if (!visualRef.current) return;
        const smoothing = 1 - Math.exp(-10 * delta);
        const targetYaw = BASE_ROTATION_Y + (isFocused ? yawRef.current : 0);
        const targetTilt = isFocused ? tiltRef.current : 0;
        const targetX = isFocused ? -0.36 : 0;

        visualRef.current.position.x = THREE.MathUtils.lerp(
            visualRef.current.position.x,
            targetX,
            smoothing
        );
        visualRef.current.rotation.y = THREE.MathUtils.lerp(
            visualRef.current.rotation.y,
            targetYaw,
            smoothing
        );
        visualRef.current.rotation.z = THREE.MathUtils.lerp(
            visualRef.current.rotation.z,
            targetTilt,
            smoothing
        );

        visualRef.current.updateWorldMatrix(true, true);

        const shouldTrackPointer = interactionEnabled
            && hasFinePointerRef.current
            && !draggingRef.current
            && (isHovered || phase === 'active');

        if (shouldTrackPointer) {
            gazeRaycaster.setFromCamera(state.pointer, state.camera);
        }

        eyeRigs.forEach(({ pivot, neutralPosition }) => {
            let targetEyeYaw = 0;
            let targetEyePitch = 0;
            let gazeX = 0;
            let gazeY = 0;

            if (shouldTrackPointer && pivot.parent) {
                pivot.getWorldPosition(eyeWorldPosition);
                const rayDistance = Math.max(
                    0.2,
                    state.camera.position.distanceTo(eyeWorldPosition) - EYE_TARGET_DISTANCE
                );

                gazeRaycaster.ray.at(rayDistance, gazeWorldPosition);
                gazeLocalPosition.copy(gazeWorldPosition);
                pivot.parent.worldToLocal(gazeLocalPosition);
                gazeDirection.subVectors(gazeLocalPosition, pivot.position).normalize();

                const rawYaw = Math.atan2(-gazeDirection.z, gazeDirection.x);
                const rawPitch = Math.atan2(
                    gazeDirection.y,
                    Math.hypot(gazeDirection.x, gazeDirection.z)
                );

                gazeX = THREE.MathUtils.clamp(rawYaw / EYE_INPUT_YAW_RANGE, -1, 1);
                gazeY = THREE.MathUtils.clamp(rawPitch / EYE_INPUT_PITCH_RANGE, -1, 1);

                // Eliptyczny limit chroni tęczówkę przed wejściem w narożnik oka.
                const gazeLength = Math.hypot(gazeX, gazeY);
                if (gazeLength > 1) {
                    gazeX /= gazeLength;
                    gazeY /= gazeLength;
                }

                gazeX = Math.sign(gazeX) * Math.pow(Math.abs(gazeX), 0.78);
                gazeY = Math.sign(gazeY) * Math.pow(Math.abs(gazeY), 0.78);
                const easedLength = Math.hypot(gazeX, gazeY);
                if (easedLength > 1) {
                    gazeX /= easedLength;
                    gazeY /= easedLength;
                }

                // Podczas mrugania pionowe śledzenie zanika, aby tęczówka nie
                // wyskoczyła spod zwężonej krawędzi oka przy ponownym otwarciu.
                gazeY *= blinkOpennessRef.current;

                targetEyeYaw = gazeX * MAX_EYE_YAW;
                targetEyePitch = gazeY * MAX_EYE_PITCH;
            }

            const eyeDamping = shouldTrackPointer ? 18 : 9;

            pivot.position.y = THREE.MathUtils.damp(
                pivot.position.y,
                neutralPosition.y + (gazeY * MAX_IRIS_TRAVEL_Y),
                eyeDamping,
                delta
            );
            pivot.position.z = THREE.MathUtils.damp(
                pivot.position.z,
                neutralPosition.z - (gazeX * MAX_IRIS_TRAVEL_X),
                eyeDamping,
                delta
            );

            pivot.rotation.y = THREE.MathUtils.damp(
                pivot.rotation.y,
                targetEyeYaw,
                eyeDamping,
                delta
            );
            pivot.rotation.z = THREE.MathUtils.damp(
                pivot.rotation.z,
                targetEyePitch,
                eyeDamping,
                delta
            );
        });
    });

    return (
        <group ref={rootRef} name="female-wall-portrait" position={position} dispose={null}>
            {/* Korytarz używa głównie materiałów Basic; te światła zachowują materiały PBR modelu. */}
            <hemisphereLight
                intensity={1.8}
                color="#fffdf2"
                groundColor="#9aaa82"
            />
            <pointLight
                position={[-1.4, 1.6, 0.8]}
                intensity={12}
                distance={6}
                decay={2}
                color="#fff8df"
            />

            <group
                ref={visualRef}
                name="female-wall-portrait-visual"
                rotation={[0, BASE_ROTATION_Y, 0]}
                scale={scale}
            >
                <primitive object={modelScene} />
            </group>

            {/* Prosty box zamiast raycastu przez bardzo ciężki model GLB. */}
            {interactionEnabled && (
                <mesh
                    name="female-wall-portrait-hitbox"
                    position={[-0.4, 0.12, 0]}
                    onClick={handleClick}
                    onPointerDown={handlePointerDown}
                    onPointerEnter={(event) => {
                        event.stopPropagation();
                        setIsHovered(true);
                    }}
                    onPointerLeave={() => setIsHovered(false)}
                >
                    <boxGeometry args={[0.9, 1.35, 1.3]} />
                    <meshBasicMaterial
                        transparent
                        opacity={0}
                        depthWrite={false}
                        colorWrite={false}
                        side={THREE.DoubleSide}
                    />
                </mesh>
            )}

            {isFocused && (
                <Html
                    fullscreen
                    className="portrait-inspect-layer"
                    calculatePosition={centerFullscreenHtml}
                    zIndexRange={[120, 110]}
                >
                    <div
                        className="portrait-interaction-shell"
                        onPointerDown={(event) => event.stopPropagation()}
                        onPointerUp={(event) => event.stopPropagation()}
                        onClick={(event) => event.stopPropagation()}
                    >
                        {isChatOpen && (
                            <PortraitTextChat
                                onClose={handleCloseChat}
                                onSendMessage={onSendMessage}
                                onSpeakingChange={handleTextSpeakingChange}
                            />
                        )}

                        <div className="portrait-controls" aria-label="女性肖像模型控制">
                            <span className="portrait-controls__hint">
                                {phase === 'active' ? '鼠标控制视线 · 自动眨眼 · 文字回复时嘴型联动' : '镜头移动中…'}
                            </span>
                            <div className="portrait-controls__actions">
                                <button
                                    type="button"
                                    onClick={() => rotateBy(-0.24)}
                                    disabled={!isActive}
                                    aria-label="向左旋转"
                                >
                                    ↶
                                </button>
                                <button
                                    type="button"
                                    onClick={resetRotation}
                                    disabled={!isActive}
                                >
                                    复位
                                </button>
                                <button
                                    type="button"
                                    onClick={() => rotateBy(0.24)}
                                    disabled={!isActive}
                                    aria-label="向右旋转"
                                >
                                    ↷
                                </button>
                                <button
                                    type="button"
                                    onClick={triggerBlink}
                                    disabled={!isActive}
                                >
                                    眨眼
                                </button>
                                <button
                                    type="button"
                                    aria-pressed={isChatOpen}
                                    onClick={() => {
                                        if (isChatOpen) handleCloseChat();
                                        else setIsChatOpen(true);
                                    }}
                                    disabled={!isActive}
                                >
                                    文字对话
                                </button>
                                <button
                                    type="button"
                                    className="portrait-controls__exit"
                                    onClick={handleExitInspection}
                                >
                                    返回 <kbd>Esc</kbd>
                                </button>
                            </div>
                        </div>
                    </div>
                </Html>
            )}
        </group>
    );
});

WallPortraitModel.displayName = 'WallPortraitModel';

export default WallPortraitModel;
