import { useCallback, useEffect, useRef, useState } from 'react';
import { useThree } from '@react-three/fiber';
import * as THREE from 'three';
import gsap from 'gsap';

const CAMERA_OWNER = 'female-wall-portrait';
const EXIT_EVENT = 'portraitInspectExit';

const notifyInspectionChange = (active) => {
    window.dispatchEvent(new CustomEvent('inspectChange', { detail: active }));
};

const usePortraitInspection = ({
    targetRef,
    setCameraOverride,
    onExitStart,
    focusDistance = 2.55
}) => {
    const { camera } = useThree();
    const [phase, setPhase] = useState('idle');
    const phaseRef = useRef('idle');
    const savedCameraRef = useRef(null);
    const cameraTweenRef = useRef(null);

    const updatePhase = useCallback((nextPhase) => {
        phaseRef.current = nextPhase;
        setPhase(nextPhase);
    }, []);

    const animateCamera = useCallback((targetPosition, targetQuaternion, duration, onComplete) => {
        cameraTweenRef.current?.kill();

        const startPosition = camera.position.clone();
        const startQuaternion = camera.quaternion.clone();
        const progress = { value: 0 };

        cameraTweenRef.current = gsap.to(progress, {
            value: 1,
            duration,
            ease: 'power2.inOut',
            onUpdate: () => {
                camera.position.lerpVectors(startPosition, targetPosition, progress.value);
                camera.quaternion.slerpQuaternions(startQuaternion, targetQuaternion, progress.value);
            },
            onComplete: () => {
                cameraTweenRef.current = null;
                onComplete?.();
            }
        });
    }, [camera]);

    const enterInspection = useCallback(() => {
        if (phaseRef.current !== 'idle' || !targetRef.current) return;

        const acquired = setCameraOverride?.(true, CAMERA_OWNER);
        if (acquired === false) return;

        savedCameraRef.current = {
            position: camera.position.clone(),
            quaternion: camera.quaternion.clone()
        };

        const portraitWorld = new THREE.Vector3();
        targetRef.current.getWorldPosition(portraitWorld);

        const lookTarget = portraitWorld.clone().add(new THREE.Vector3(0, 0.08, 0));
        const focusWorld = portraitWorld.clone().add(new THREE.Vector3(-focusDistance, 0.22, 0));
        const focusLocal = focusWorld.clone();

        camera.parent?.updateWorldMatrix(true, false);
        camera.parent?.worldToLocal(focusLocal);

        const originalPosition = camera.position.clone();
        const originalQuaternion = camera.quaternion.clone();

        camera.position.copy(focusLocal);
        camera.lookAt(lookTarget);
        const focusQuaternion = camera.quaternion.clone();

        camera.position.copy(originalPosition);
        camera.quaternion.copy(originalQuaternion);

        updatePhase('focusing');
        notifyInspectionChange(true);

        animateCamera(focusLocal, focusQuaternion, 0.95, () => {
            updatePhase('active');
        });
    }, [animateCamera, camera, focusDistance, setCameraOverride, targetRef, updatePhase]);

    const exitInspection = useCallback(() => {
        if (phaseRef.current === 'idle' || phaseRef.current === 'restoring') return;

        onExitStart?.();

        const savedCamera = savedCameraRef.current;
        if (!savedCamera) {
            setCameraOverride?.(false, CAMERA_OWNER);
            notifyInspectionChange(false);
            updatePhase('idle');
            return;
        }

        updatePhase('restoring');

        animateCamera(savedCamera.position, savedCamera.quaternion, 0.8, () => {
            savedCameraRef.current = null;
            setCameraOverride?.(false, CAMERA_OWNER);
            notifyInspectionChange(false);
            updatePhase('idle');
        });
    }, [animateCamera, onExitStart, setCameraOverride, updatePhase]);

    useEffect(() => {
        const handleKeyDown = (event) => {
            if (event.key === 'Escape') exitInspection();
        };
        const handleCanvasMiss = () => exitInspection();

        window.addEventListener('keydown', handleKeyDown);
        window.addEventListener(EXIT_EVENT, handleCanvasMiss);

        return () => {
            window.removeEventListener('keydown', handleKeyDown);
            window.removeEventListener(EXIT_EVENT, handleCanvasMiss);
        };
    }, [exitInspection]);

    useEffect(() => () => {
        cameraTweenRef.current?.kill();
        if (phaseRef.current !== 'idle') {
            if (savedCameraRef.current) {
                camera.position.copy(savedCameraRef.current.position);
                camera.quaternion.copy(savedCameraRef.current.quaternion);
            }
            setCameraOverride?.(false, CAMERA_OWNER);
            notifyInspectionChange(false);
        }
    }, [camera, setCameraOverride]);

    return {
        phase,
        isFocused: phase !== 'idle',
        isActive: phase === 'active',
        enterInspection,
        exitInspection
    };
};

export { EXIT_EVENT };
export default usePortraitInspection;
