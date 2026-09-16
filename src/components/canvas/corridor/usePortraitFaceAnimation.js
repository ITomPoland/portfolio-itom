import { useCallback, useMemo, useRef } from 'react';
import { useFrame } from '@react-three/fiber';
import * as THREE from 'three';

const MIN_BLINK_OPENNESS = 0.055;
const BLINK_CLOSE_DURATION = 0.075;
const BLINK_HOLD_DURATION = 0.035;
const MANUAL_BLINK_HOLD_DURATION = 0.11;
const BLINK_OPEN_DURATION = 0.135;

const clamp01 = (value) => THREE.MathUtils.clamp(Number(value) || 0, 0, 1);
const smoothstep01 = (value) => {
    const t = clamp01(value);
    return t * t * (3 - (2 * t));
};
const nextBlinkDelay = () => 2.8 + (Math.random() * 3);

const getTextSpeechLevel = (time) => {
    const syllablePulse = Math.pow(
        0.5 + (Math.sin((time * 16.8) + 0.35) * 0.5),
        1.35
    );
    const emphasis = 0.82 + (
        (0.5 + (Math.sin((time * 5.3) + 1.1) * 0.5)) * 0.18
    );
    const pauseGate = Math.sin((time * 2.7) + 0.4) < -0.76 ? 0 : 1;
    return clamp01((0.04 + (syllablePulse * 0.96 * emphasis)) * pauseGate);
};

/**
 * Animacja nie korzysta z dźwięku. Usta poruszają się tylko wtedy, gdy UI
 * odsłania kolejne znaki odpowiedzi tekstowej AI.
 */
const usePortraitFaceAnimation = ({ eyeRigs, mouthRig, isTextSpeaking }) => {
    const eyeRigsRef = useRef(eyeRigs);
    const mouthRigRef = useRef(mouthRig);
    const blinkCommandRef = useRef(0);
    const blinkOpennessRef = useRef(1);
    const mouthMotionRef = useRef({ open: 0, width: 1 });
    const blinkStateRef = useRef({
        phase: 'waiting',
        phaseStartedAt: 0,
        nextAt: 0,
        consumedCommand: 0,
        holdDuration: BLINK_HOLD_DURATION,
        queueSecondBlink: false,
        isSecondBlink: false
    });

    const blink = useCallback(() => {
        blinkCommandRef.current += 1;
    }, []);

    const resetFace = useCallback(() => {
        const blinkState = blinkStateRef.current;
        blinkState.phase = 'waiting';
        blinkState.nextAt = 0;
        blinkState.queueSecondBlink = false;
        blinkState.isSecondBlink = false;
        blinkOpennessRef.current = 1;
        mouthMotionRef.current.open = 0;
        mouthMotionRef.current.width = 1;
    }, []);

    const api = useMemo(() => ({ blink, resetFace }), [blink, resetFace]);

    useFrame((state, delta) => {
        const time = state.clock.elapsedTime;
        const blinkState = blinkStateRef.current;

        if (blinkState.nextAt <= 0) blinkState.nextAt = time + nextBlinkDelay();

        const manualBlinkRequested = blinkState.consumedCommand !== blinkCommandRef.current;
        if (blinkState.phase === 'waiting' && (manualBlinkRequested || time >= blinkState.nextAt)) {
            blinkState.consumedCommand = blinkCommandRef.current;
            blinkState.phase = 'closing';
            blinkState.phaseStartedAt = time;
            blinkState.holdDuration = manualBlinkRequested
                ? MANUAL_BLINK_HOLD_DURATION
                : BLINK_HOLD_DURATION;
            if (!blinkState.isSecondBlink) blinkState.queueSecondBlink = Math.random() < 0.1;
        }

        let blinkOpenness = 1;
        const blinkElapsed = time - blinkState.phaseStartedAt;

        if (blinkState.phase === 'closing') {
            const progress = smoothstep01(blinkElapsed / BLINK_CLOSE_DURATION);
            blinkOpenness = THREE.MathUtils.lerp(1, MIN_BLINK_OPENNESS, progress);
            if (blinkElapsed >= BLINK_CLOSE_DURATION) {
                blinkState.phase = 'closed';
                blinkState.phaseStartedAt = time;
            }
        } else if (blinkState.phase === 'closed') {
            blinkOpenness = MIN_BLINK_OPENNESS;
            if (blinkElapsed >= blinkState.holdDuration) {
                blinkState.phase = 'opening';
                blinkState.phaseStartedAt = time;
            }
        } else if (blinkState.phase === 'opening') {
            const progress = smoothstep01(blinkElapsed / BLINK_OPEN_DURATION);
            blinkOpenness = THREE.MathUtils.lerp(MIN_BLINK_OPENNESS, 1, progress);
            if (blinkElapsed >= BLINK_OPEN_DURATION) {
                blinkState.phase = 'waiting';
                blinkOpenness = 1;
                if (blinkState.queueSecondBlink && !blinkState.isSecondBlink) {
                    blinkState.nextAt = time + 0.14;
                    blinkState.isSecondBlink = true;
                    blinkState.queueSecondBlink = false;
                } else {
                    blinkState.nextAt = time + nextBlinkDelay();
                    blinkState.isSecondBlink = false;
                }
            }
        }

        blinkOpennessRef.current = blinkOpenness;
        const blinkDownshift = (1 - blinkOpenness) * 0.0014;

        eyeRigsRef.current.forEach((eyeRig) => {
            eyeRig.scleraBlinkPivot.scale.y = blinkOpenness;
            eyeRig.scleraBlinkPivot.position.y = eyeRig.scleraBlinkNeutralPosition.y - blinkDownshift;
            eyeRig.irisCenter.scale.y = eyeRig.irisBaseScaleY * blinkOpenness;
            eyeRig.irisCenter.position.y = eyeRig.irisCenterNeutralPosition.y - blinkDownshift;

            const eyelidOpacity = smoothstep01((0.72 - blinkOpenness) / 0.56);
            const lineOpacity = smoothstep01((0.28 - blinkOpenness) / 0.2);
            eyeRig.eyelidCover.visible = eyelidOpacity > 0.01;
            eyeRig.eyelidCover.material.opacity = eyelidOpacity;
            eyeRig.blinkLine.visible = lineOpacity > 0.01;
            eyeRig.blinkLine.material.opacity = lineOpacity;
        });

        const activeMouthRig = mouthRigRef.current;
        if (!activeMouthRig) return;

        const targetOpen = isTextSpeaking ? getTextSpeechLevel(time) : 0;
        const targetWidth = isTextSpeaking
            ? THREE.MathUtils.clamp(1 + (Math.sin(time * 6.1) * 0.025), 0.96, 1.04)
            : 1;
        const mouthMotion = mouthMotionRef.current;
        const mouthDamping = targetOpen > mouthMotion.open ? 22 : 12;

        mouthMotion.open = THREE.MathUtils.damp(
            mouthMotion.open,
            targetOpen,
            mouthDamping,
            delta
        );
        mouthMotion.width = THREE.MathUtils.damp(
            mouthMotion.width,
            targetWidth,
            16,
            delta
        );

        // Ten model nie ma morph targetów i w spoczynku powierzchnie warg
        // zachodzą na siebie. Krzywa progowa daje czytelny ruch bez przekraczania
        // bezpiecznych maksymalnych przesunięć pivotów.
        const open = smoothstep01((mouthMotion.open - 0.08) / 0.58);
        activeMouthRig.root.scale.z = mouthMotion.width;
        activeMouthRig.upperPivot.position.x = THREE.MathUtils.damp(
            activeMouthRig.upperPivot.position.x,
            activeMouthRig.upperNeutralPosition.x - (open * 0.001),
            mouthDamping,
            delta
        );
        activeMouthRig.upperPivot.position.y = THREE.MathUtils.damp(
            activeMouthRig.upperPivot.position.y,
            activeMouthRig.upperNeutralPosition.y + (open * 0.0023),
            mouthDamping,
            delta
        );
        activeMouthRig.lowerPivot.position.x = THREE.MathUtils.damp(
            activeMouthRig.lowerPivot.position.x,
            activeMouthRig.lowerNeutralPosition.x - (open * 0.0028),
            mouthDamping,
            delta
        );
        activeMouthRig.lowerPivot.position.y = THREE.MathUtils.damp(
            activeMouthRig.lowerPivot.position.y,
            activeMouthRig.lowerNeutralPosition.y - (open * 0.0095),
            mouthDamping,
            delta
        );
        activeMouthRig.lowerPivot.rotation.z = THREE.MathUtils.damp(
            activeMouthRig.lowerPivot.rotation.z,
            activeMouthRig.lowerNeutralRotation.z - (open * 0.105),
            mouthDamping,
            delta
        );

        const cavityVisibility = smoothstep01((open - 0.025) / 0.25);
        activeMouthRig.cavity.visible = cavityVisibility > 0.01;
        activeMouthRig.cavity.scale.y = activeMouthRig.cavityBaseScale.y * (0.1 + (open * 0.9));
        activeMouthRig.cavity.material.opacity = cavityVisibility * 0.96;
    });

    return { api, blink, blinkOpennessRef };
};

export default usePortraitFaceAnimation;
