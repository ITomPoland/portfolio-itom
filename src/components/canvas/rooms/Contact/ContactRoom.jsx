import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { useFrame, useThree } from '@react-three/fiber';
import { PositionalAudio, useGLTF, useTexture } from '@react-three/drei';
import * as THREE from 'three';
import ContactSocialModels from './ContactSocialModels';
import InteractiveWater from './InteractiveWater';
import { useScene } from '../../../../context/SceneContext';
import GalleryClouds from '../Gallery/GalleryClouds';
import { useAchievements } from '../../../../context/AchievementsContext';
import { useAudio } from '../../../../context/AudioManager';

// ============================================
// ============================================
// 🌊 CONTACT ROOM v3 - INTERACTIVE SOCIAL MODELS
// QQ / WeChat / Feishu models floating above the interactive water
// ============================================
import { usePaintMaterial } from '../Gallery/usePaintMaterial';

// ============================================
// ⚙️ AUDIO SETTINGS - TWEAK HERE
// Edytuj te wartości, aby zmienić głośność i zasięg słyszalności szumu morza
// ============================================
export const AUDIO_SETTINGS = {
    volume: 2,
    distance: 2,           // Dystans, od którego dźwięk zaczyna cichnąć (refDistance)
    rolloff: 1.2           // Szybkość cichnięcia (rolloffFactor)
};

const WATER_SURFACE_Y = -1.02;
const SIGNAL_STATION_HEIGHT = 20;
const SIGNAL_STATION_SUBMERGE_DEPTH = 1.6;

// ============================================
// ⚙️ FLOATING SIGNAL STATION SETTINGS
// ============================================
export const SIGNAL_STATION_SETTINGS = {
    // Keep the buoy base 0.72 units below the real water surface instead of
    // positioning this centered GLB with the old flat lighthouse coordinates.
    position: [
        -15.5,
        WATER_SURFACE_Y + SIGNAL_STATION_HEIGHT * 0.5 - SIGNAL_STATION_SUBMERGE_DEPTH,
        -42
    ],
    rotation: [0, 0.35, 0],
    height: SIGNAL_STATION_HEIGHT,
    waterRadius: 0.09
};

const SIGNAL_STATION_MODEL_PATH = '/models/contact/floating-signal-station.glb';

// ============================================
// ⚙️ RUBBER DUCK SETTINGS
// Background floater replacing the original paper boat
// ============================================
export const DUCK_SETTINGS = {
    // Pozycja: [lewo/prawo (X), góra/dół (Y), tył/przód (Z)]
    // The 1.3x sprite is 2.99 units tall. Raising its center to y=0.375 keeps
    // the lower edge at y=-1.12, preserving the current immersion depth.
    position: [0, 0.375, -15],

    // Rotacja: [przechył w przód/tył (X), obrót w lewo/prawo (Y), obrót na boki (Z)]
    rotation: [0, -0.12, 0],

    // Wielkość: [szerokość, wysokość]
    scale: [4.485, 2.99]
};

const FloatingSignalStation = ({ paintOnBeforeCompile, floaterInteractionRef }) => {
    const { scene } = useGLTF(SIGNAL_STATION_MODEL_PATH);
    const stationRef = useRef();

    const normalizedModel = useMemo(() => {
        const model = scene.clone(true);
        const bounds = new THREE.Box3().setFromObject(model);
        const size = bounds.getSize(new THREE.Vector3());
        const center = bounds.getCenter(new THREE.Vector3());
        const normalizedScale = SIGNAL_STATION_SETTINGS.height / Math.max(size.y, 0.0001);

        model.scale.setScalar(normalizedScale);
        model.position.set(
            -center.x * normalizedScale,
            -center.y * normalizedScale,
            -center.z * normalizedScale
        );

        model.traverse((child) => {
            if (!child.isMesh) return;

            const sourceMaterials = Array.isArray(child.material)
                ? child.material
                : [child.material];
            const paintedMaterials = sourceMaterials.map((sourceMaterial) => {
                const material = sourceMaterial.clone();
                material.onBeforeCompile = paintOnBeforeCompile;
                material.needsUpdate = true;
                return material;
            });

            child.material = Array.isArray(child.material)
                ? paintedMaterials
                : paintedMaterials[0];
        });

        return model;
    }, [paintOnBeforeCompile, scene]);

    useFrame((state) => {
        if (!stationRef.current) return;

        const time = state.clock.getElapsedTime();
        const bobPhase = time * 0.52 + 0.8;
        stationRef.current.position.y = SIGNAL_STATION_SETTINGS.position[1]
            + Math.sin(bobPhase) * 0.065;
        stationRef.current.rotation.x = SIGNAL_STATION_SETTINGS.rotation[0]
            + Math.sin(time * 0.41) * 0.012;
        stationRef.current.rotation.z = SIGNAL_STATION_SETTINGS.rotation[2]
            + Math.cos(time * 0.37) * 0.018;

        const waterContact = floaterInteractionRef?.current?.[4];
        if (waterContact) {
            waterContact.x = stationRef.current.position.x;
            waterContact.z = stationRef.current.position.z;
            waterContact.radius = SIGNAL_STATION_SETTINGS.waterRadius;
            waterContact.strength = -0.000032 + Math.cos(bobPhase) * 0.00004;
        }
    });

    return (
        <group
            ref={stationRef}
            position={SIGNAL_STATION_SETTINGS.position}
            rotation={SIGNAL_STATION_SETTINGS.rotation}
        >
            <primitive object={normalizedModel} dispose={null} />
        </group>
    );
};

useGLTF.preload(SIGNAL_STATION_MODEL_PATH);

const ContactRoom = ({ showRoom, onReady, isExiting, isWarmup }) => {
    const { camera } = useThree();
    const { isTeleporting } = useScene();
    const { showTutorial, unlockAchievement, hidePopup } = useAchievements();
    const { globalVolume, isMuted } = useAudio();
    const effectiveVolume = isMuted ? 0 : AUDIO_SETTINGS.volume * globalVolume;

    const audioRef = useRef();
    useEffect(() => {
        if (audioRef.current && audioRef.current.setVolume) {
            audioRef.current.setVolume(effectiveVolume);
        }
    }, [effectiveVolume]);

    useEffect(() => {
        if (isExiting || isTeleporting) {
            hidePopup();
        }
    }, [isExiting, isTeleporting, hidePopup]);

    // Load Molo Texture
    const moloTexture = useTexture("/assets/contact/molo.webp");
    // Load transparent rubber duck texture
    const duckTexture = useTexture("/assets/contact/rubber-duck.png");


    // Configure texture repeating (1:1 scale)
    useEffect(() => {
        if (moloTexture) {
            moloTexture.wrapS = moloTexture.wrapT = THREE.RepeatWrapping;
            moloTexture.center.set(0.5, 0.5);
            moloTexture.rotation = Math.PI / 2;
            moloTexture.repeat.set(1, 1);
            moloTexture.needsUpdate = true;
        }
    }, [moloTexture]);

    useEffect(() => {
        // Change to YXZ smoothly on mount for proper head nodding, 
        // avoiding mathematical snapping of the Euler angles.
        camera.rotation.reorder('YXZ');

        return () => {
            // Restore default XYZ on unmount so other rooms/corridors don't break
            camera.rotation.reorder('XYZ');
        };
    }, [camera]);

    // ===== PAINT TRANSITION =====
    // Contact is on the RIGHT side of the corridor, so reveal goes from right (+X) into the room
    const groupRef = useRef();
    const { onBeforeCompile, animatePaint, resetPaint, uniformsData, updateRoomOrigin } = usePaintMaterial({
        dirX: 1.0,    // Opposite to Gallery (right side door)
        dirY: 0.0,
        dirZ: -0.1,   // Slight angle matching mirrored direction
        startDist: -5.0,
        endDist: 55.0,
        noiseAxes: 'yz'
    });

    const [isTransitioning, setIsTransitioning] = useState(false);

    const wasTeleportedRef = useRef(false);
    useEffect(() => {
        if (isTeleporting) wasTeleportedRef.current = true;
    }, [isTeleporting]);

    useEffect(() => {
        if (showRoom && !isWarmup) {
            if (wasTeleportedRef.current || isTeleporting) {
                uniformsData.uPaintProgress.value = 1.0;
                setIsTransitioning(false);
            } else {
                setIsTransitioning(true);
                resetPaint();
                animatePaint(0.2, 2.5);
                setTimeout(() => {
                    setIsTransitioning(false);
                }, 2700);
            }
        } else {
            uniformsData.uPaintProgress.value = 1.0;
        }
    }, [showRoom, isWarmup, isTeleporting]);

    // Track if we've signaled ready
    const hasSignaledReady = useRef(false);
    const frameCount = useRef(0);
    const FRAMES_TO_WAIT = 5;

    // Refs for animations
    const duckRef = useRef();
    const floaterInteractionRef = useRef([
        { x: -4.1, z: -7.7, radius: 0.019, strength: 0 },
        { x: 0, z: -7.15, radius: 0.0175, strength: 0 },
        { x: 4.1, z: -7.7, radius: 0.018, strength: 0 },
        { x: DUCK_SETTINGS.position[0], z: DUCK_SETTINGS.position[2], radius: 0.03, strength: 0 },
        {
            x: SIGNAL_STATION_SETTINGS.position[0],
            z: SIGNAL_STATION_SETTINGS.position[2],
            radius: SIGNAL_STATION_SETTINGS.waterRadius,
            strength: 0
        }
    ]);
    const updateFloaterInteraction = useCallback((index, x, z, radius, strength) => {
        const floater = floaterInteractionRef.current[index];
        floater.x = x;
        floater.z = z;
        floater.radius = radius;
        floater.strength = strength;
    }, []);
    // Frame Loop
    useFrame((state) => {
        // Update room origin for paint shader
        updateRoomOrigin(groupRef);

        if (!hasSignaledReady.current) {
            frameCount.current++;
            if (frameCount.current >= FRAMES_TO_WAIT) {
                hasSignaledReady.current = true;
                onReady?.();
                if (!isWarmup) setTimeout(() => showTutorial('contact_choose'), 2000);
            }
        }

        const time = state.clock.getElapsedTime();

        // 2. Rubber duck animation (bobbing with waves and drifting)
        if (duckRef.current) {
            // 🌊 Bobbing up and down (Y axis)
            const bobSpeed = 0.82;
            const bobAmplitude = 0.1;
            const bobPhase = time * bobSpeed;
            duckRef.current.position.y = DUCK_SETTINGS.position[1] + Math.sin(bobPhase) * bobAmplitude;

            // ⛵ Sailing left and right (X axis)
            const sailSpeed = 0.04; // znacznie wolniejsze pływanie (było 0.15)
            const sailAmplitude = 12; // mniejszy obszar pływania, by nie wyjeżdżał za ekran (było 25)
            duckRef.current.position.x = DUCK_SETTINGS.position[0] + Math.sin(time * sailSpeed) * sailAmplitude;

            // 🔄 Add a slight tilt on the Z axis (roll)
            const rollAmplitude = 0.05;
            duckRef.current.rotation.z = Math.sin(time * bobSpeed * 1.2) * rollAmplitude;

            // The duck presses the same GPGPU height field as the three
            // contact models, creating a small wake at its current position.
            const duckFloater = floaterInteractionRef.current[3];
            duckFloater.x = duckRef.current.position.x;
            duckFloater.z = duckRef.current.position.z;
            duckFloater.radius = 0.03;
            duckFloater.strength = -0.000035 + Math.cos(bobPhase) * 0.00005;
        }

    });

    const [isMobile, setIsMobile] = useState(false);

    useEffect(() => {
        const checkMobile = () => {
            setIsMobile(window.innerWidth < 1000); // 1000px breakpoint to catch tablets/phones
        };
        checkMobile();
        window.addEventListener('resize', checkMobile);
        return () => window.removeEventListener('resize', checkMobile);
    }, []);

    return (
        <group ref={groupRef} position={[0, -0.7, -5]}>
            {!isWarmup && (
                <PositionalAudio
                    ref={audioRef}
                    url="/sounds/szummorza.mp3"
                    distanceModel="exponential"
                    refDistance={AUDIO_SETTINGS.distance}
                    rolloffFactor={AUDIO_SETTINGS.rolloff}
                    loop
                    autoplay
                    volume={effectiveVolume}
                />
            )}

            {/* ☁️ CLOUDS */}
            <GalleryClouds count={45} seed={88} rotationOffset={[0, 1, 0]} />

            {/* 🌊 CONTINUOUS GPGPU WATER */}
            <InteractiveWater
                active={showRoom && !isWarmup}
                paintOnBeforeCompile={onBeforeCompile}
                floaterInteractionRef={floaterInteractionRef}
                surfaceY={WATER_SURFACE_Y}
            />

            {/* 💬 QQ / WECHAT / FEISHU 3D CONTACTS */}
            <ContactSocialModels
                isMobile={isMobile}
                paintOnBeforeCompile={onBeforeCompile}
                onInteract={() => unlockAchievement('contact_choose')}
                onFloaterUpdate={updateFloaterInteraction}
                waterSurfaceY={WATER_SURFACE_Y}
            />


            {/* 🏖️ DOCK / MOLO */}
            <mesh
                position={[0, 0.05, 1.8]}
                rotation={[-Math.PI / 2, 0, 0]}
            >
                <planeGeometry args={[2.5, 7]} />
                <meshBasicMaterial
                    map={moloTexture}
                    color="#e0e0e0"
                    roughness={0.8}
                    side={THREE.DoubleSide}
                    transparent
                    onBeforeCompile={onBeforeCompile}
                />
            </mesh>

            {/* 📡 FLOATING SIGNAL STATION */}
            <FloatingSignalStation
                paintOnBeforeCompile={onBeforeCompile}
                floaterInteractionRef={floaterInteractionRef}
            />

            {/* 🦆 RUBBER DUCK */}
            <mesh
                ref={duckRef}
                position={DUCK_SETTINGS.position}
                rotation={DUCK_SETTINGS.rotation}
            >
                <planeGeometry args={DUCK_SETTINGS.scale} />
                <meshBasicMaterial
                    color="#ffffff"
                    map={duckTexture}
                    transparent
                    alphaTest={0.04}
                    depthWrite={false}
                    side={THREE.DoubleSide}
                    onBeforeCompile={onBeforeCompile}
                />
            </mesh>

        </group>
    );
};

export default ContactRoom;
