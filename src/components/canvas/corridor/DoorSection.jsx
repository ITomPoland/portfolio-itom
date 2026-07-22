import { useRef, useState, useCallback, useEffect, useMemo } from 'react';
import { useFrame, useThree } from '@react-three/fiber';
import { Text, useTexture, PositionalAudio } from '@react-three/drei';
import * as THREE from 'three';
import gsap from 'gsap';
import RoomInterior from './RoomInterior';
import '../shaders/RevealMaterial'; // Registers alpha-discard reveal shader
import { useScene } from '../../../context/SceneContext';
import { useAchievements } from '../../../context/AchievementsContext';
import { useAudio } from '../../../context/AudioManager';
import { isTouchDevice } from '../../../utils/deviceDetect';

// Constants from CorridorSegment
const WALL_X_OUTER = 3.5;
const WALL_X_INNER = 1.7;
const DOOR_Z_SPAN = 4;
const CORRIDOR_HEIGHT = 3.5;

const DOOR_AUDIO_SETTINGS = {
    hoverVolume: 0.8, // Volume for "uchyleniedrzwi" (hovering the door)
    openVolume: 0.2,  // Volume for "otwarciedrzwi" (opening the door fully)
    closeVolume: 0.2, // Volume when door closes (playing same sound reversed/again)
    distance: 3,      // Reference distance for spatial audio before it starts dropping off
    rolloff: 2,       // How fast the sound fades away (exponential)
    closeDelay: 0.5   // Seconds to wait before playing the close door sound
};

// Calculate sawtooth wall geometry
const WALL_DX = WALL_X_OUTER - WALL_X_INNER; // 1.8
const WALL_DZ = DOOR_Z_SPAN; // 4
const WALL_LENGTH = Math.sqrt(WALL_DX * WALL_DX + WALL_DZ * WALL_DZ);
const BASE_WALL_ANGLE = Math.atan2(WALL_DX, WALL_DZ); // Sawtooth angle (~24 degrees)

// Camera look-at angle when aligning with door (adjust this to fix alignment)
// Math.PI * 0.33 is ~60 degrees
const DOOR_LOOK_ANGLE = Math.PI * 0.334;

// Camera X offset when aligning with door (adjust this to move camera left/right relative to door)
// Higher value = further from door center horizontally
const DOOR_ALIGN_X = 1.2;

// Door texture mapping - maps label to texture file
const DOOR_TEXTURES = {
    'THE GALLERY': '/textures/corridor/doors/drzwiprojekty.webp',
    'THE STUDIO': '/textures/corridor/doors/drzwisocial.webp',
    'THE ABOUT': '/textures/corridor/doors/drzwiabout.webp',
    "LET'S CONNECT": '/textures/corridor/doors/drzwikontakt.webp',
};

// Painted (colored) variants for brush-stroke reveal on hover
const DOOR_PAINTED_TEXTURES = {
    'THE GALLERY': '/textures/corridor/doors/drzwiprojekty_painted.webp',
    'THE STUDIO': '/textures/corridor/doors/drzwisocial_painted.webp',
    'THE ABOUT': '/textures/corridor/doors/drzwiabout_painted.webp',
    "LET'S CONNECT": '/textures/corridor/doors/drzwikontakt_painted.webp',
};


/**
 * DoorSection Component.
 * 
 * Unit combining angled wall + door + frame + sign + positional audio.
 * Controls camera flight animation into the room on click.
 *
 * INVARIANT: Camera ownership during room entry belongs exclusively to DoorSection.
 * A room component must ONLY take camera control once `isInRoom === true` (after entry flight).
 *
 * @param {Object} props - Component props.
 * @param {number[]} props.position - World coordinates [x, y, z] of wall segment center.
 * @param {'left' | 'right'} [props.side='left'] - Wall side in corridor.
 * @param {string} props.label - Display label ('THE GALLERY', 'THE STUDIO', 'THE ABOUT', "LET'S CONNECT").
 * @param {string} [props.roomId] - Target room ID for context updates.
 * @param {string} [props.icon] - Door icon symbol.
 * @param {Function} [props.onEnter] - Callback triggered when room entry sequence starts.
 * @param {number} [props.autoCloseDelay=3000] - Auto-close delay in ms.
 * @param {number} [props.enterDistance=8] - Fly-through camera distance into the room.
 * @param {Function} [props.setCameraOverride] - Takes over camera control from useInfiniteCamera.
 * @param {number} props.segmentIndex - Index of the parent corridor segment.
 * @returns {React.ReactElement} The 3D door section group.
 */
const DoorSection = ({
    position, // [x, y, z] - center of the wall segment
    side = 'left',
    label,
    roomId, // ID for context updates (gallery, studio, etc)
    icon,
    onEnter,
    autoCloseDelay = 3000,
    enterDistance = 8, // Default fly-through distance
    setCameraOverride, // Function to take control of camera from hook
    segmentIndex
}) => {
    const groupRef = useRef(); // Main group that tilts
    const doorRef = useRef();
    const handleRef = useRef();
    const doorMaterialRef = useRef(); // RevealMaterial ref for door sketch
    const handleMaterialRef = useRef(); // RevealMaterial ref for handle sketch
    const handlePaintedRef = useRef(); // Painted handle mesh visibility
    const doorPaintedRef = useRef(); // Painted door mesh visibility
    const handleHideDelayRef = useRef(); // Track pending gsap.delayedCall for handle visibility
    const [isHovered, setIsHovered] = useState(false);
    const [isOpen, setIsOpen] = useState(false);
    const [isAnimating, setIsAnimating] = useState(false);
    const isNearRef = useRef(false);
    const [isInsideRoom, setIsInsideRoom] = useState(false);
    const [isTiltLocked, setIsTiltLocked] = useState(false); // Lock tilt when entering room
    const [shouldRenderRoom, setShouldRenderRoom] = useState(false); // Lazy loading state
    const [roomReady, setRoomReady] = useState(false); // Room signaled it's ready
    const { camera } = useThree();
    const closeTimerRef = useRef(null);
    const loadTimeoutRef = useRef(null); // Ref for the room loading fallback timeout

    // Get exit request signal from context
    const {
        currentRoom, // We need to know if the global room changed (teleportation)
        exitRequested,
        clearExitRequest,
        exitRoom: contextExitRoom,
        enterRoom,
        pendingDoorClick,
        isTeleporting,
        isFastTeleport,
        signalRoomReady,
        teleportPhase // We need this to delay reset until curtain is closed
    } = useScene();

    const { unlockAchievement } = useAchievements();
    const { globalVolume, isMuted } = useAudio();

    // Audio Refs for 3D positional sound
    const hoverAudioRef = useRef();
    const openAudioRef = useRef();
    const closeAudioRef = useRef();

    // Map label to ID for teleport matching
    const doorId = useMemo(() => {
        if (roomId) return roomId;

        // Fallback for older code
        if (label === 'THE GALLERY') return 'gallery';
        if (label === 'THE STUDIO') return 'studio';
        if (label === 'THE ABOUT') return 'about';
        if (label === "LET'S CONNECT") return 'contact';
        return null;
    }, [label, roomId]);

    // Listen for pending door click (auto-click after teleport)
    useEffect(() => {
        // Only trigger for segment 0 doors (closest to start) and matching ID
        // We assume teleport always goes to segment 0
        const isSegment0 = segmentIndex === 0;

        if (pendingDoorClick && pendingDoorClick === doorId && isSegment0 && !isOpen && !isAnimating) {
            handleClick({ stopPropagation: () => { }, isTeleport: true }); // Trigger click simulation with TELEPORT flag
        }
    }, [pendingDoorClick, doorId, segmentIndex, isOpen, isAnimating]);

    // --- SILENT RESET FOR TELEPORTATION ---
    // If a teleport starts (users clicks map), and we are inside THIS room,
    // we must silently reset our state so we are "outside" and "closed"
    // BUT only after the curtain is closed (phase === 'teleporting').
    useEffect(() => {
        // FIX: Added (currentRoom === doorId) check to ensure we only reset the OLD room
        // FIX: Added (teleportPhase === 'teleporting') to wait for curtain to close
        if (isTeleporting && teleportPhase === 'teleporting' && isInsideRoom && currentRoom === doorId) {
            // console.log(`[DoorSection ${label}] Silent Reset triggered by teleport (Old Room)`);

            // 1. Reset Internal State immediately
            setIsOpen(false);
            setIsInsideRoom(false);
            setIsAnimating(false);
            setShouldRenderRoom(false); // Unmount room content
            setIsTiltLocked(false);
            setRoomReady(false);
            roomReadyRef.current = false;

            // 2. Reset Door/Handle Rotation (Visuals)
            // We can do this instantly or very quickly since screen is covered
            if (doorRef.current) doorRef.current.rotation.y = 0;
            if (handleRef.current) handleRef.current.rotation.z = 0;

            // 3. Reset Camera Override 
            // Important: DO NOT RELEASE control here. 
            // Experience.jsx manages the override during "isTeleporting".
            // If we release it here, useInfiniteCamera takes over before the new room is ready.
            // setCameraOverride?.(false); <--- REMOVED

            // 4. Reset Timers
            if (closeTimerRef.current) clearTimeout(closeTimerRef.current);
        }
    }, [isTeleporting, teleportPhase, isInsideRoom, currentRoom, doorId, label, setCameraOverride]);

    // Save camera state before entering room (for ESC exit)
    // Save camera state before entering room (for ESC exit)
    // Now saving FULL rotation (x, y, z) to prevent snap on exit
    const savedCameraState = useRef({ x: 0, y: 0, z: 0, rotationX: 0, rotationY: 0, rotationZ: 0 });
    // Save position ALIGNED with door (intermediate step for exit)
    const doorAlignedState = useRef({ x: 0, y: 0, z: 0, rotationY: 0 });
    // Save position after flying through corridor (before final rotation) 
    const roomEntryState = useRef({ x: 0, y: 0, z: 0, rotationY: 0 });

    // Dynamic tilt state
    const currentTilt = useRef(0);

    // Load wall texture
    const originalWallTexture = useTexture('/textures/corridor/wall_texture.webp');

    // Clone texture to have independent repeat settings (fixes scaling issues)
    const wallTexture = useMemo(() => {
        const tex = originalWallTexture.clone();
        tex.needsUpdate = true;
        tex.wrapS = tex.wrapT = THREE.RepeatWrapping;

        // ShapeGeometry uses world-space UVs (1 unit = 1 meter), unlike PlaneGeometry (0..1)
        // We want 1 repeat every 2 meters (0.5 density), so we set repeat to 0.5
        tex.repeat.set(0.5, 0.5);

        // Adjust offset to center texture (optional, nice for alignment)
        tex.offset.set(0.5, 0.5);

        return tex;
    }, [originalWallTexture]);

    // Load door textures - use the right texture based on label
    const doorTexturePath = DOOR_TEXTURES[label] || DOOR_TEXTURES['THE GALLERY'];
    const doorTexture = useTexture(doorTexturePath);

    const isTouch = isTouchDevice();
    const dummyTex = 'data:image/gif;base64,R0lGODlhAQABAIAAAAAAAP///yH5BAEAAAAALAAAAAABAAEAAAIBRAA7';

    const doorPaintedTexturePath = DOOR_PAINTED_TEXTURES[label] || DOOR_PAINTED_TEXTURES['THE GALLERY'];
    const doorPaintedTexture = useTexture(isTouch ? dummyTex : doorPaintedTexturePath);
    const frameTexture = useTexture('/textures/corridor/doors/ramkasingledoors.webp');
    const handleTexture = useTexture('/textures/corridor/doors/klamkadodrzwi.webp');
    const handlePaintedTexture = useTexture(isTouch ? dummyTex : '/textures/corridor/doors/klamkadodrzwi_painted.webp');
    const doorBackTexture = useTexture('/textures/corridor/doors/backsingledoors.webp');
    const arrowTexture = useTexture('/textures/corridor/strzalka.webp');

    // Baseboard texture for door sections (1582x94 px, aspect 16.83:1)
    const baseboardTexture = useTexture('/textures/corridor/texturadoprogow.webp');
    baseboardTexture.wrapS = baseboardTexture.wrapT = THREE.RepeatWrapping;
    baseboardTexture.colorSpace = THREE.SRGBColorSpace;

    // Pre-create baseboard textures via useMemo (same pattern as legTexture above)
    const doorBoardWidth = (WALL_LENGTH - 1.1) / 2;
    const NATURAL_TILE_W = (1582 / 94) * 0.15; // = 2.524 units per natural tile
    const doorBbTexLeft = useMemo(() => {
        const tex = baseboardTexture.clone();
        tex.wrapS = tex.wrapT = THREE.RepeatWrapping;
        tex.rotation = 0; // Reset rotation (shared texture may have PI/2 from threshold)
        tex.offset.set(0, 0);
        tex.needsUpdate = true;
        tex.repeat.set(doorBoardWidth / NATURAL_TILE_W, 1);
        return tex;
    }, [baseboardTexture]);

    const doorBbTexRight = useMemo(() => {
        const tex = baseboardTexture.clone();
        tex.wrapS = tex.wrapT = THREE.RepeatWrapping;
        tex.rotation = 0; // Reset rotation (shared texture may have PI/2 from threshold)
        tex.offset.set(0, 0);
        tex.needsUpdate = true;
        tex.repeat.set(doorBoardWidth / NATURAL_TILE_W, 1);
        return tex;
    }, [baseboardTexture]);

    // Door dimensions - based on legacy texture aspect ratio (approx 0.376)
    const doorRatio = label === 'THE STUDIO' ? 0.388 : 0.376;
    const doorHeight = 2.5;
    const doorWidth = doorHeight * doorRatio * 1.12;

    // Frame dimensions - based on legacy ratio 762/1759 (0.433)
    const frameHeight = 2.5;
    const frameWidth = frameHeight * 0.5;

    // Hole dimensions - MUST fit inside wall
    const holeWidth = doorWidth - 0.03;
    const holeHeight = doorHeight - 0.1;
    const holeOffsetY = -0.55; // Same as door group Y offset

    // Create wall geometry with door hole
    const wallWithHoleGeometry = useMemo(() => {
        // Create wall shape
        const wallShape = new THREE.Shape();
        const halfW = WALL_LENGTH / 2;
        const halfH = CORRIDOR_HEIGHT / 2;

        wallShape.moveTo(-halfW, -halfH);
        wallShape.lineTo(halfW, -halfH);
        wallShape.lineTo(halfW, halfH);
        wallShape.lineTo(-halfW, halfH);
        wallShape.lineTo(-halfW, -halfH);

        // Create hole for door
        const holePath = new THREE.Path();
        const holeHalfW = holeWidth / 2;
        const holeHalfH = holeHeight / 2;
        const holeY = holeOffsetY; // Center of hole

        holePath.moveTo(-holeHalfW, holeY - holeHalfH);
        holePath.lineTo(holeHalfW, holeY - holeHalfH);
        holePath.lineTo(holeHalfW, holeY + holeHalfH);
        holePath.lineTo(-holeHalfW, holeY + holeHalfH);
        holePath.lineTo(-holeHalfW, holeY + holeHalfH);
        holePath.lineTo(-holeHalfW, holeY - holeHalfH);

        wallShape.holes.push(holePath);

        return new THREE.ShapeGeometry(wallShape);
    }, [holeWidth, holeHeight, holeOffsetY]);

    // Tilt parameters
    const BASE_ROTATION = Math.PI / 2; // 90 degrees - side wall orientation
    const BASE_TILT = 0.02;   // ~1 degree additional tilt towards camera
    const MAX_TILT = BASE_WALL_ANGLE + 0.1; // Sawtooth angle + extra (~27 degrees total tilt)
    const TILT_START = 15;    // Start tilting when camera is 15 units away
    const TILT_PEAK = 3;      // Max tilt at 3 units

    // Pivot offset - the group pivots from the OUTER edge
    const pivotX = side === 'left' ? -WALL_X_OUTER : WALL_X_OUTER;

    // Wall offset from pivot - wall extends FROM pivot INWARD
    const wallOffsetX = side === 'left'
        ? WALL_LENGTH / 2
        : -WALL_LENGTH / 2;

    // Force shader compilation: let the painted versions render for 2 frames during preloader, then hide
    const compileFramesRef = useRef(0);
    useFrame(() => {
        // === SHADER COMPILE (first 2 frames only) ===
        if (compileFramesRef.current < 2) {
            compileFramesRef.current++;
            if (compileFramesRef.current === 2) {
                if (!isHovered && !isOpen) {
                    if (doorPaintedRef.current) doorPaintedRef.current.visible = false;
                    if (handlePaintedRef.current) handlePaintedRef.current.visible = false;
                }
            }
        }

        // === TILT ANIMATION ===
        if (!groupRef.current) return;

        let targetTilt = BASE_TILT;

        // If tilt is locked (clicked/entering), force it to MAX_TILT (fully facing user)
        if (isTiltLocked) {
            targetTilt = MAX_TILT;
        } else {
            // Normal proximity-based tilting
            const distance = Math.abs(camera.position.z - position[2]);
            isNearRef.current = distance < 8;

            if (distance < TILT_START && distance > TILT_PEAK) {
                const t = (TILT_START - distance) / (TILT_START - TILT_PEAK);
                const easedT = t * (2 - t); // easeOutQuad
                targetTilt = BASE_TILT + (MAX_TILT - BASE_TILT) * easedT;
            } else if (distance <= TILT_PEAK) {
                targetTilt = MAX_TILT;
            }
        }

        // Smooth interpolation
        currentTilt.current = THREE.MathUtils.lerp(currentTilt.current, targetTilt, 0.06);

        // Apply rotation: BASE_ROTATION (90°) + dynamic tilt
        const baseDir = side === 'left' ? 1 : -1;
        const tiltDir = side === 'left' ? -1 : 1;

        // Calculate the actual rotation angle
        const currentRotation = (BASE_ROTATION * baseDir) + (currentTilt.current * tiltDir);
        groupRef.current.rotation.y = currentRotation;

        // Trigonometric Scaling Fix:
        // We want the Z-projection of the wall to ALWAYS be exactly DOOR_Z_SPAN (4.0m).
        // Formula: Scale = DOOR_Z_SPAN / (WALL_LENGTH * sin(Angle))

        const absSinAngle = Math.abs(Math.sin(currentRotation));

        // Safety to prevent division by zero (angle is clamped ~60-90 deg)
        let exactScale = 1.0;
        if (absSinAngle > 0.1) {
            // -0.01 safety margin to prevent Z-fighting on the exact edge
            exactScale = (DOOR_Z_SPAN - 0.01) / (WALL_LENGTH * absSinAngle);
        }

        // Clamp scale to avoid explosion if math goes wrong, but allow gentle flex
        const currentScale = THREE.MathUtils.clamp(exactScale, 0.8, 1.1);

        groupRef.current.scale.set(currentScale, 1, 1);
    });

    useEffect(() => {
        return () => {
            if (closeTimerRef.current) clearTimeout(closeTimerRef.current);
            if (loadTimeoutRef.current) clearTimeout(loadTimeoutRef.current);
        };
    }, []);

    const handleClick = useCallback((e) => {
        // e might be null or synthetic from teleport
        e?.stopPropagation?.();
        const isTeleport = e?.isTeleport || false;
        if (isAnimating) return;

        if (isOpen) {
            closeDoor();
            return;
        }

        // Reset cursor on transition
        document.body.style.cursor = "auto";

        setIsAnimating(true);

        // Take control of camera from hook
        setCameraOverride?.(true);

        // Lock tilt so the corridor doesn't rotate while we fly through
        setIsTiltLocked(true);

        // Save camera state BEFORE entering (for ESC exit)
        savedCameraState.current = {
            x: camera.position.x,
            y: camera.position.y,
            z: camera.position.z,
            rotationX: camera.rotation.x,
            rotationY: camera.rotation.y,
            rotationZ: camera.rotation.z
        };

        // If this is a TELEPORT entry, overwrite the saved state with a "Safe Corridor Position"
        // This prevents the camera from jumping back to the OLD room position on exit.
        if (e && e.isTeleport) {
            // Use a NATURAL corridor glance angle (~8.5 degrees), NOT the intense door-aligned angle (60°)
            // This creates a visible head turn: from looking at door (60°) → subtle corridor glance (8.5°)
            // The angle is smaller because we end up 4m back from the door, not right next to it
            const corridorGlanceY = side === 'left' ? 0.15 : -0.15;

            savedCameraState.current = {
                x: 0,
                y: 0.2, // Correct height matching useInfiniteCamera
                z: position[2] + 4, // 4 meters back from the door Z
                rotationX: 0,
                rotationY: corridorGlanceY, // Natural corridor glance, not intense door stare
                rotationZ: 0
            };
        }

        // FAST TELEPORT: Use ultra-fast animation durations (almost instant)
        // The paper is closed so user won't see the fast motion
        const useFastMode = isTeleport && isFastTeleport;
        const alignDuration = useFastMode ? 0.01 : 1.0;

        // Get door world position
        const doorWorldPos = new THREE.Vector3();
        groupRef.current.getWorldPosition(doorWorldPos);

        // Camera moves to be at door's Z level (so door is centered when we look at it)
        // and slightly towards the door's side
        const cameraTargetZ = doorWorldPos.z;
        const cameraTargetX = side === 'left' ? DOOR_ALIGN_X : -DOOR_ALIGN_X;

        // Calculate the target rotation to look at the door
        // We need to account for the camera PARENT's rotation (sway), so we get a consistent WORLD angle
        // Current Sway (Parent Rotation) + Camera Rotation = World Rotation
        // World Rotation Target = DOOR_LOOK_ANGLE
        // Camera Target = World Target - Parent Rotation

        let parentRotationY = 0;
        if (camera.parent) {
            // Get parent's world rotation Y (approximate, assuming mostly Y rotation for sway)
            const parentWorldQuat = new THREE.Quaternion();
            camera.parent.getWorldQuaternion(parentWorldQuat);
            const parentEuler = new THREE.Euler().setFromQuaternion(parentWorldQuat, 'YXZ');
            parentRotationY = parentEuler.y;
        }

        const worldTargetRotationY = side === 'left'
            ? DOOR_LOOK_ANGLE   // Target WORLD angle
            : -DOOR_LOOK_ANGLE; // Target WORLD angle

        // Compensate for parent sway to get consistent local rotation
        const targetRotationY = worldTargetRotationY - parentRotationY;

        // Store initial rotation
        const startRotationY = camera.rotation.y;

        // Create a proxy object for the rotation animation
        const rotationProxy = { y: startRotationY };

        // Animate camera position and rotation simultaneously
        gsap.to(camera.position, {
            x: cameraTargetX,
            z: cameraTargetZ,
            duration: alignDuration,
            ease: useFastMode ? 'none' : 'power2.inOut'
        });

        gsap.to(rotationProxy, {
            y: targetRotationY,
            duration: alignDuration,
            ease: useFastMode ? 'none' : 'power2.inOut',
            onUpdate: () => {
                camera.rotation.y = rotationProxy.y;
            },
            onComplete: () => {
                // Save aligned state for reverse animation
                doorAlignedState.current = {
                    x: camera.position.x,
                    y: camera.position.y,
                    z: camera.position.z,
                    rotationY: camera.rotation.y
                };

                // Lazy Load Room:
                // 1. Camera is now aligned.
                // 2. Start rendering the room.
                // 3. Door will open when room signals ready via onReady callback
                //    OR after fallback timeout for rooms without onReady support
                setShouldRenderRoom(true);

                // During FAST teleport, we still want to WAIT for the room to be ready!
                // So we do NOT open immediately anymore. We let the onReady callback handle it.
                // But we still set the flag so handleRoomReady knows to use fast animation.

                // Fallback: If room doesn't call onReady within 8000ms, open door anyway
                // This ensures all rooms work even if they don't implement onReady
                loadTimeoutRef.current = setTimeout(() => {
                    if (!roomReadyRef.current) {
                        console.warn(`[DoorSection ${label}] Room load timeout - forcing open`);
                        roomReadyRef.current = true;
                        setRoomReady(true);
                        // If it timed out, we still use the current mode preference
                        openDoor(useFastMode);
                    }
                }, 8000);
            }
        });
    }, [camera, side, isOpen, isAnimating, setCameraOverride, isFastTeleport]);

    const openDoor = useCallback((fastMode = false) => {
        if (!doorRef.current) return;

        setIsOpen(true);
        const openAngle = side === 'left' ? Math.PI * 0.6 : -Math.PI * 0.6;

        if (!fastMode && openAudioRef.current) {
            const vol = isMuted ? 0 : DOOR_AUDIO_SETTINGS.openVolume * globalVolume;
            openAudioRef.current.setVolume(vol);
            if (openAudioRef.current.isPlaying) openAudioRef.current.stop();
            openAudioRef.current.play();
        }

        // FAST MODE: Ultra-fast durations for teleport entry
        const handleDuration = fastMode ? 0.01 : 0.15;
        const doorDuration = fastMode ? 0.01 : 0.7;
        const flyDuration = fastMode ? 0.01 : 1.5;

        // Animate handle down first
        if (handleRef.current) {
            gsap.to(handleRef.current.rotation, {
                z: side === 'left' ? 0.4 : -0.4,
                duration: handleDuration,
                ease: fastMode ? 'none' : 'power2.out'
            });
        }

        gsap.to(doorRef.current.rotation, {
            y: openAngle,
            duration: doorDuration,
            ease: fastMode ? 'none' : 'power2.out',
            onComplete: () => {
                // Door is open, now fly camera through the door
                // Get the direction the camera is looking AT THE START
                const direction = new THREE.Vector3();
                camera.getWorldDirection(direction);

                const flyDistance = enterDistance; // Fly through short vestibule (3) + into room

                // Calculate TARGET position BEFORE animating (so flight path is straight)
                const targetX = camera.position.x + direction.x * flyDistance;
                const targetZ = camera.position.z + direction.z * flyDistance;

                // STEP 1: Fly camera forward in a STRAIGHT LINE
                gsap.to(camera.position, {
                    x: targetX,
                    z: targetZ,
                    duration: flyDuration,
                    ease: fastMode ? 'none' : 'power2.inOut',
                    onComplete: () => {
                        // Save position AFTER flight
                        roomEntryState.current = {
                            x: camera.position.x,
                            y: camera.position.y,
                            z: camera.position.z,
                            rotationY: camera.rotation.y
                        };

                        // NO ROTATION needed - we are already looking perpendicular to corridor
                        // Just mark as inside
                        setIsAnimating(false);
                        setIsInsideRoom(true);

                        // Defer context update exactly 250ms to strictly avoid any
                        // stutter during the very last frames of the GSAP animation loop.
                        setTimeout(() => {
                            enterRoom(doorId); // Use ID ('gallery') not label ('THE GALLERY')
                            onEnter?.();

                            // FAST TELEPORT: Signal that room is ready - this opens the paper
                            if (fastMode) {
                                signalRoomReady();
                            }
                        }, 250);
                    }
                });
            }
        });
    }, [side, onEnter, camera, enterRoom, doorId, signalRoomReady]);

    // Handle room ready callback - open door when room is fully loaded
    // Use ref to prevent multiple calls (state might not update fast enough)
    const roomReadyRef = useRef(false);

    const handleRoomReady = useCallback(() => {
        // Guard: only call openDoor once
        if (roomReadyRef.current) return;

        // Clear the fallback timeout since we are ready
        if (loadTimeoutRef.current) clearTimeout(loadTimeoutRef.current);

        roomReadyRef.current = true;
        setRoomReady(true);
        // Use the current context state to decide if we should do a fast open
        openDoor(isFastTeleport);
    }, [openDoor, isFastTeleport]);

    // Exit room function - TRUE REVERSE animation (like rewinding video)
    const exitRoom = useCallback(() => {
        if (!isInsideRoom || isAnimating) return;

        setIsAnimating(true);

        const saved = savedCameraState.current;
        const aligned = doorAlignedState.current;

        // Store current rotation as starting point for exit
        // This captures the "tilted" state if coming from About/Flight
        const startRotation = {
            x: camera.rotation.x,
            y: camera.rotation.y,
            z: camera.rotation.z
        };

        // REVERSE STEP 1: Walk backwards through corridor to ALIGNED position (in front of door)
        // AND smoothly rotate to "aligned" state (level horizon)

        // Proxy for Step 1 rotation
        const step1RotationProxy = { ...startRotation };

        // Target for Step 1: Position = aligned position (in front of door)
        // Rotation = 0 pitch/bank, Y facing the door (approx same as aligned.rotationY)
        // We assume 'aligned.rotationY' is the correct facing for the door

        gsap.to(camera.position, {
            x: aligned.x,
            y: aligned.y,
            z: aligned.z,
            duration: 1.5,
            ease: 'power2.inOut'
        });

        // Simultaneously animate rotation to level out
        gsap.to(step1RotationProxy, {
            x: 0, // Level pitch
            y: aligned.rotationY, // Face door
            z: 0, // Level bank
            duration: 1.5,
            ease: 'power2.inOut',
            onUpdate: () => {
                camera.rotation.set(step1RotationProxy.x, step1RotationProxy.y, step1RotationProxy.z);
            },
            onComplete: () => {
                // REVERSE STEP 2: Move back to original center position & rotate to original view
                // This is the reverse of the "align to door" animation

                // 2a. Position
                gsap.to(camera.position, {
                    x: saved.x,
                    y: saved.y,
                    z: saved.z,
                    duration: 1.0,
                    ease: 'power2.inOut'
                });

                // 2b. Rotation
                // Animate ALL axes to saved state
                const step2RotationProxy = {
                    x: camera.rotation.x,
                    y: camera.rotation.y,
                    z: camera.rotation.z
                };

                gsap.to(step2RotationProxy, {
                    x: saved.rotationX,
                    y: saved.rotationY,
                    z: saved.rotationZ,
                    duration: 1.0,
                    ease: 'power2.inOut',
                    onUpdate: () => {
                        camera.rotation.set(step2RotationProxy.x, step2RotationProxy.y, step2RotationProxy.z);
                    },
                    onComplete: () => {
                        // Restore precise full rotation (just in case)
                        camera.rotation.set(saved.rotationX, saved.rotationY, saved.rotationZ);

                        // Spread state updates across frames to prevent jank
                        // Frame 1: ANIMATION FINISHED BUT STATE STILL "INSIDE" TO PREVENT ROOM WAKEUP
                        // We keep isInsideRoom=true and isAnimating=true (or effectively "exiting")
                        // so that AboutRoom sees "isExiting" as true until it's unmounted.

                        requestAnimationFrame(() => {
                            // Frame 2: Close door FIRST
                            // Room logic is still "held" in exit state

                            // Close door, THEN hide room and reset state
                            closeDoor(() => {
                                // Door is now closed. NOW we are officially "out"
                                setIsInsideRoom(false);
                                setIsAnimating(false);
                                setIsTiltLocked(false);
                                setRoomReady(false);
                                roomReadyRef.current = false;

                                setShouldRenderRoom(false);
                                contextExitRoom();
                                setCameraOverride?.(false);
                            });
                        });
                    }
                });
            }
        });
    }, [isInsideRoom, isAnimating, camera, setCameraOverride, contextExitRoom]);

    // ESC key listener for exiting room
    useEffect(() => {
        const handleKeyDown = (e) => {
            if (e.key === 'Escape' && isInsideRoom && !isAnimating) {
                exitRoom();
            }
        };

        window.addEventListener('keydown', handleKeyDown);
        return () => window.removeEventListener('keydown', handleKeyDown);
    }, [isInsideRoom, isAnimating, exitRoom]);

    // Listen for exit request from UI back button
    useEffect(() => {
        if (exitRequested && isInsideRoom && !isAnimating) {
            // Note: We deliberately do NOT call clearExitRequest() here.
            // Calling it triggers an immediate global React Context update exactly
            // when we want to start a 60 FPS GSAP animation. 
            // setExitRequested(false) will be handled safely at the end of the 
            // animation by contextExitRoom().
            exitRoom(); // Trigger the exit animation
        }
    }, [exitRequested, isInsideRoom, isAnimating, exitRoom]);

    const closeDoor = useCallback((onDoorClosed) => {
        if (!doorRef.current || !isOpen) return;
        if (closeTimerRef.current) clearTimeout(closeTimerRef.current);
        if (loadTimeoutRef.current) clearTimeout(loadTimeoutRef.current);

        setIsAnimating(true);

        if (closeAudioRef.current) {
            setTimeout(() => {
                const vol = isMuted ? 0 : DOOR_AUDIO_SETTINGS.closeVolume * globalVolume;
                if (closeAudioRef.current) {
                    closeAudioRef.current.setVolume(vol);
                    if (closeAudioRef.current.isPlaying) closeAudioRef.current.stop();
                    closeAudioRef.current.play();
                }
            }, DOOR_AUDIO_SETTINGS.closeDelay * 1000);
        }

        // Reset handle
        if (handleRef.current) {
            gsap.to(handleRef.current.rotation, {
                z: 0,
                duration: 0.2,
                ease: 'power2.out'
            });
        }

        // Reverse brush-stroke reveal (un-paint the door)
        if (doorMaterialRef.current) {
            gsap.to(doorMaterialRef.current, {
                uProgress: 0.0,
                duration: 0.6,
                ease: 'power2.out',
                overwrite: true
            });
        }
        if (handleMaterialRef.current) {
            gsap.to(handleMaterialRef.current, {
                uProgress: 0.0,
                duration: 0.6,
                ease: 'power2.out',
                overwrite: true
            });
        }
        // Hide painted layers after animation
        if (handleHideDelayRef.current) handleHideDelayRef.current.kill();
        handleHideDelayRef.current = gsap.delayedCall(0.65, () => {
            if (handlePaintedRef.current) handlePaintedRef.current.visible = false;
            if (doorPaintedRef.current) doorPaintedRef.current.visible = false;
        });

        gsap.to(doorRef.current.rotation, {
            y: 0,
            duration: 0.6,
            ease: 'power2.in',
            onComplete: () => {
                setIsOpen(false);
                setIsAnimating(false);
                // Call optional completion callback
                onDoorClosed?.();
            }
        });
    }, [isOpen]);

    // Handle hover effects
    const handlePointerEnter = () => {
        if (isOpen || isAnimating) return;
        setIsHovered(true);
        document.body.style.cursor = "pointer";

        if (hoverAudioRef.current && !isHovered) {
            const vol = isMuted ? 0 : DOOR_AUDIO_SETTINGS.hoverVolume * globalVolume;
            hoverAudioRef.current.setVolume(vol);
            
            // Only play if AudioContext is already running to avoid console warnings
            // Browsers block audio until a user click, and hover is not always enough.
            if (hoverAudioRef.current.isPlaying) hoverAudioRef.current.stop();
            if (hoverAudioRef.current.context.state === 'running') {
                hoverAudioRef.current.play();
            }
        }

        // Slightly open door on hover
        if (doorRef.current) {
            gsap.to(doorRef.current.rotation, {
                y: side === 'left' ? 0.15 : -0.15,
                duration: 0.3,
                ease: 'power2.out'
            });
        }

        // Slightly rotate handle on hover
        if (handleRef.current) {
            gsap.to(handleRef.current.rotation, {
                z: side === 'left' ? 0.1 : -0.1,
                duration: 0.2,
                ease: 'power2.out'
            });
        }

        // Brush-stroke reveal: discard sketch pixels to show painted door beneath
        if (doorMaterialRef.current) {
            gsap.to(doorMaterialRef.current, {
                uProgress: 1.0,
                duration: 0.8,
                ease: 'power2.out',
                overwrite: true
            });
        }
        if (handleMaterialRef.current) {
            gsap.to(handleMaterialRef.current, {
                uProgress: 1.0,
                duration: 0.8,
                ease: 'power2.out',
                overwrite: true
            });
        }
        // Show painted layers (kill any pending hide from previous leave)
        if (handleHideDelayRef.current) handleHideDelayRef.current.kill();
        if (handlePaintedRef.current) handlePaintedRef.current.visible = true;
        if (doorPaintedRef.current) doorPaintedRef.current.visible = true;
    };

    const handlePointerLeave = () => {
        if (isOpen || isAnimating) return;
        setIsHovered(false);
        document.body.style.cursor = "auto";

        if (hoverAudioRef.current && hoverAudioRef.current.isPlaying) {
            hoverAudioRef.current.stop();
        }

        // Close door
        if (doorRef.current) {
            gsap.to(doorRef.current.rotation, {
                y: 0,
                duration: 0.3,
                ease: 'power2.out'
            });
        }

        // Reset handle
        if (handleRef.current) {
            gsap.to(handleRef.current.rotation, {
                z: 0,
                duration: 0.2,
                ease: 'power2.out'
            });
        }

        // Reverse brush-stroke reveal
        if (doorMaterialRef.current) {
            gsap.to(doorMaterialRef.current, {
                uProgress: 0.0,
                duration: 0.5,
                ease: 'power2.out',
                overwrite: true
            });
        }
        if (handleMaterialRef.current) {
            gsap.to(handleMaterialRef.current, {
                uProgress: 0.0,
                duration: 0.5,
                ease: 'power2.out',
                overwrite: true
            });
        }

        // Hide painted layers after reverse animation completes
        handleHideDelayRef.current = gsap.delayedCall(0.55, () => {
            if (handlePaintedRef.current) handlePaintedRef.current.visible = false;
            if (doorPaintedRef.current) doorPaintedRef.current.visible = false;
        });
    };

    // Door pivot position - hinges on the side
    const doorPivotX = side === 'left' ? -doorWidth / 2 : doorWidth / 2;
    const doorMeshX = side === 'left' ? doorWidth / 2 : -doorWidth / 2;

    // Handle position on door (based on texture - handle is on the right side for left doors)
    const handlePivotX = side === 'left' ? doorWidth * 0.25 : -doorWidth * 0.25;

    // Sign texture mapping - now uses a single empty sign texture
    const signTextureUrl = '/textures/corridor/pustatabliczka.webp';
    const signLegacyRatio = 1.792; // 2752x1536
    const signHeight = 0.55;
    const signWidth = signHeight * signLegacyRatio;
    const signTexture = useTexture(signTextureUrl);

    return (
        // Outer group at pivot position (outer edge of wall)
        <group position={[pivotX, position[1], position[2]]}>
            {/* Inner group that rotates - contains wall + door */}
            <group ref={groupRef}>
                {/* Wall segment with door hole */}
                <mesh position={[wallOffsetX, 0, 0]} geometry={wallWithHoleGeometry}>
                    <meshBasicMaterial color="#e0e0e0" map={wallTexture} roughness={1} metalness={0} side={THREE.DoubleSide} />
                </mesh>

                {/* === ARROW DECORATION === */}
                {/* Pointing to door. Left arrow. */}
                {/* ===================================================
                    REGULACJA STRZAŁKI LEWEJ:
                    position={[wallOffsetX - 0.9, 0, 0.02]}
                      - wallOffsetX - 0.9 → odległość od środka drzwi (zwiększ 0.9 = dalej od drzwi)
                      - Y = 0             → wysokość (0 = środek ściany, + = wyżej, - = niżej)
                    scale={[0.5, 0.5, 1]} → rozmiar strzałki
                    =================================================== */}
                <mesh
                    position={[wallOffsetX - 1.1, 0, 0.02]}
                    rotation={[0, 0, 0]}
                    scale={[0.5, 0.5, 1]}
                >
                    <planeGeometry args={[1, 0.5]} />
                    <meshBasicMaterial color="#e0e0e0"
                        map={arrowTexture}
                        transparent={true}
                        alphaTest={0.1}
                        side={THREE.DoubleSide}
                        roughness={0.8}
                    />
                </mesh>

                {/* === ARROW DECORATION (RIGHT, MIRRORED) === */}
                {/* ===================================================
                    REGULACJA STRZAŁKI PRAWEJ:
                    position={[wallOffsetX + 0.9, -0.3, 0.02]}
                      - wallOffsetX + 0.9 → odległość od środka drzwi (prawa strona)
                      - Y = -0.3          → trochę niżej niż lewa strzałka
                    scale={[-0.5, 0.5, 1]} → ujemny X = lustrzane odbicie
                    =================================================== */}
                <mesh
                    position={[wallOffsetX + 1.1, -0.3, 0.02]}
                    rotation={[0, 0, 0]}
                    scale={[-0.5, 0.5, 1]}
                >
                    <planeGeometry args={[1, 0.5]} />
                    <meshBasicMaterial color="#e0e0e0"
                        map={arrowTexture}
                        transparent={true}
                        alphaTest={0.1}
                        side={THREE.DoubleSide}
                        roughness={0.8}
                    />
                </mesh>

                {/* Baseboard (Listwa) Left side of door */}
                <mesh position={[wallOffsetX - 1.4, -CORRIDOR_HEIGHT / 2 + 0.075, 0.02]}>
                    <planeGeometry args={[doorBoardWidth, 0.15]} />
                    <meshBasicMaterial color="#e0e0e0"
                        map={doorBbTexLeft}
                        roughness={0.8}
                        side={THREE.DoubleSide}
                    />
                </mesh>

                {/* Baseboard (Listwa) Right side of door */}
                <mesh position={[wallOffsetX + 1.4, -CORRIDOR_HEIGHT / 2 + 0.075, 0.02]}>
                    <planeGeometry args={[doorBoardWidth, 0.15]} />
                    <meshBasicMaterial color="#e0e0e0"
                        map={doorBbTexRight}
                        roughness={0.8}
                        side={THREE.DoubleSide}
                    />
                </mesh>

                {/* === THRESHOLD STRIPE (Próg przy drzwiach bocznych) === */}
                {(() => {
                    // Próg leży na podłodze, prostopadle do ściany bocznej
                    // Szerokość progu = szerokość otworu drzwiowego (~1.1)
                    const THRESH_W = 1.1;   // Szerokość (wzdłuż X lokalnego = wzdłuż ściany)
                    const THRESH_D = 0.15;  // Głębokość (wzdłuż Z lokalnego = w głąb korytarza)
                    const threshTex = baseboardTexture.clone();
                    threshTex.needsUpdate = true;
                    threshTex.wrapS = threshTex.wrapT = THREE.RepeatWrapping;
                    threshTex.rotation = 0;
                    threshTex.offset.set(0, 0);
                    threshTex.repeat.set(THRESH_W / NATURAL_TILE_W, 1);
                    return (
                        <mesh
                            position={[wallOffsetX, -CORRIDOR_HEIGHT / 2 + 0.005, 0.02]}
                            rotation={[-Math.PI / 2, 0, 0]}
                        >
                            <planeGeometry args={[THRESH_W, THRESH_D]} />
                            <meshBasicMaterial color="#e0e0e0"
                                map={threshTex}
                                roughness={0.9}
                                metalness={0}
                                side={THREE.DoubleSide}
                            />
                        </mesh>
                    );
                })()}

                {/* Door and frame - centered on wall */}
                <group position={[wallOffsetX, -0.4, 0]}>
                    {/* === TEXTURED SIGN === */}
                    <group position={[0, doorHeight / 2 + 0.45, 0.08]}>
                        {/* 
                            WIELKOŚĆ TABLICZKI (SIGN SIZE):
                            Zmień liczby w args={[Szerokość, Wysokość]}
                            Obecnie: 1.3 szerokości, 0.65 wysokości
                        */}
                        <mesh>
                            {/* Adjusted size for the signs - assuming rectangular aspect ratio */}
                            <planeGeometry args={[1.3, 0.65]} />
                            <meshBasicMaterial color="#e0e0e0"
                                map={signTexture}
                                transparent={true}
                                alphaTest={0.1}
                                roughness={0.8}
                            />
                        </mesh>

                        {/* === DYNAMIC TEXT FOR SIGNS === */}
                        {label === 'THE GALLERY' && (
                            <group position={[0, 0, 0.01]}>
                                <Text
                                    font="/fonts/CabinSketch-Bold.ttf"
                                    fontSize={0.25}
                                    color="#111111"
                                    anchorX="center"
                                    anchorY="bottom"
                                    position={[0, -0.02, 0]}
                                >
                                    THE
                                </Text>
                                <Text
                                    font="/fonts/CabinSketch-Bold.ttf"
                                    fontSize={0.25}
                                    color="#111111"
                                    anchorX="center"
                                    anchorY="top"
                                    position={[0, +0.02, 0]}
                                >
                                    GALLERY
                                </Text>
                            </group>
                        )}
                        {label === 'THE STUDIO' && (
                            <group position={[0, 0, 0.01]}>
                                <Text
                                    font="/fonts/CabinSketch-Bold.ttf"
                                    fontSize={0.25}
                                    color="#111111"
                                    anchorX="center"
                                    anchorY="bottom"
                                    position={[0, -0.02, 0]}
                                >
                                    THE
                                </Text>
                                <Text
                                    font="/fonts/CabinSketch-Bold.ttf"
                                    fontSize={0.25}
                                    color="#111111"
                                    anchorX="center"
                                    anchorY="top"
                                    position={[0, +0.03, 0]}
                                >
                                    STUDIO
                                </Text>
                            </group>
                        )}
                        {label === 'THE ABOUT' && (
                            <Text
                                font="/fonts/CabinSketch-Bold.ttf"
                                fontSize={0.30}
                                color="#111111"
                                anchorX="center"
                                anchorY="middle"
                                position={[0, 0, 0.01]}
                            >
                                ABOUT
                            </Text>
                        )}
                        {label === "LET'S CONNECT" && (
                            <Text
                                font="/fonts/CabinSketch-Bold.ttf"
                                fontSize={0.25}
                                color="#111111"
                                anchorX="center"
                                anchorY="middle"
                                position={[0, 0, 0.01]}
                            >
                                CONTACT
                            </Text>
                        )}
                    </group>

                    {/* === DOOR FRAME (textured) === */}
                    {/* Moved to Z = 0.04 to sit in front of baseboards (Z=0.02), hiding the hole edges */}
                    <mesh position={[0, -0.1, 0.04]} scale={[side === 'right' ? -1 : 1, 1, 1]}>
                        <planeGeometry args={[frameWidth, frameHeight]} />
                        <meshBasicMaterial color="#e0e0e0"
                            map={frameTexture}
                            transparent={true}
                            alphaTest={0.1}
                            roughness={0.9}
                        />
                    </mesh>

                    {/* === DOOR INTERIOR CORRIDOR + ROOM === */}
                    {/* Always render, but pass showRoom prop for lazy loading giant room */}
                    <RoomInterior
                        label={label}
                        showRoom={shouldRenderRoom}
                        onReady={handleRoomReady}
                        isExiting={isInsideRoom && isAnimating}
                    />

                    {/* === DOOR PANEL (pivots for opening) === */}
                    {/* Pivot Z at 0.01 to be slightly behind frame but in front of wall if needed, or just flush */}
                    <group ref={doorRef} position={[doorPivotX, 0, 0.01]}>
                        {/* Clickable hitbox (invisible) for pointer events */}
                        <mesh
                            position={[doorMeshX, -0.2, 0.005]}
                            onClick={handleClick}
                            onPointerEnter={handlePointerEnter}
                            onPointerLeave={handlePointerLeave}
                        >
                            <planeGeometry args={[doorWidth, doorHeight]} />
                            <meshBasicMaterial color="#e0e0e0" transparent={true} opacity={0} depthWrite={false} />
                        </mesh>

                        {label === 'THE STUDIO' ? (
                            /* === REAL 3D DOOR SLAB (Boutique only) ===
                               Same hinge group / gsap.to(doorRef.current.rotation, ...) / enterRoom()
                               logic above is untouched — only this leaf's geometry+material changes
                               from a flat sketch texture to a lit panel. doorPaintedRef/doorMaterialRef
                               simply stay unattached here (all their usages are already null-guarded). */
                            <>
                                <mesh position={[doorMeshX, -0.2, 0]} castShadow receiveShadow>
                                    <boxGeometry args={[doorWidth, doorHeight, 0.05]} />
                                    <meshStandardMaterial color="#3a332c" roughness={0.55} metalness={0.05} />
                                </mesh>
                                {/* This door slab is a lit MeshStandardMaterial, but there is no global
                                    scene lighting (rest of the app is unlit meshBasicMaterial) — a small
                                    local light keeps it from rendering pure black. */}
                                <pointLight position={[doorMeshX, 0.6, 0.6]} intensity={0.6} distance={2.5} color="#fff4e0" />
                            </>
                        ) : (
                            <>
                                {/* Painted layer (behind sketch) - hidden after 2 frames to precompile shader */}
                                <mesh
                                    ref={doorPaintedRef}
                                    position={[doorMeshX, -0.2, -0.001]}
                                    scale={[side === 'right' ? -1 : 1, 1, 1]}
                                >
                                    <planeGeometry args={[doorWidth, doorHeight]} />
                                    <meshBasicMaterial color="#e0e0e0"
                                        map={doorPaintedTexture}
                                        transparent={true}
                                        alphaTest={0.5}
                                        roughness={0.8}
                                    />
                                </mesh>

                                {/* Sketch overlay (front) - brush-stroke discard reveals painted beneath */}
                                <mesh
                                    position={[doorMeshX, -0.2, 0]}
                                    scale={[side === 'right' ? -1 : 1, 1, 1]}
                                >
                                    <planeGeometry args={[doorWidth, doorHeight]} />
                                    <revealMaterial color="#e0e0e0"
                                        ref={doorMaterialRef}
                                        map={doorTexture}
                                        transparent={true}
                                        alphaTest={0.1}
                                        roughness={0.8}
                                        uProgress={0.0}
                                    />
                                </mesh>

                                {/* Door Back Texture */}
                                <mesh
                                    position={[doorMeshX, -0.2, -0.01]}
                                    rotation={[0, Math.PI, 0]}
                                    scale={[side === 'right' ? -1 : 1, 1, 1]}
                                >
                                    <planeGeometry args={[doorWidth, doorHeight]} />
                                    <meshBasicMaterial color="#e0e0e0"
                                        map={doorBackTexture}
                                        transparent={true}
                                        alphaTest={0.1}
                                        roughness={0.8}
                                        side={THREE.DoubleSide}
                                    />
                                </mesh>
                            </>
                        )}

                        {/* Handle Layer - pivot at screw position */}
                        <group ref={handleRef} position={[doorMeshX + (side === 'left' ? 0.45 : -0.45), -0.29, 0.03]}>
                            {/* Painted handle (behind) - hidden after 2 frames */}
                            <mesh ref={handlePaintedRef} position={[side === 'left' ? -0.50 : 0.50, 0.14, -0.001]} scale={[side === 'right' ? -1 : 1, 1, 1]}>
                                <planeGeometry args={[doorWidth, doorHeight]} />
                                <meshBasicMaterial color="#e0e0e0"
                                    map={handlePaintedTexture}
                                    transparent={true}
                                    alphaTest={0.5}
                                    depthWrite={false}
                                />
                            </mesh>
                            {/* Sketch handle overlay (front) */}
                            <mesh position={[side === 'left' ? -0.50 : 0.50, 0.14, 0]} scale={[side === 'right' ? -1 : 1, 1, 1]}>
                                <planeGeometry args={[doorWidth, doorHeight]} />
                                <revealMaterial color="#e0e0e0"
                                    ref={handleMaterialRef}
                                    map={handleTexture}
                                    transparent={true}
                                    alphaTest={0.1}
                                    depthWrite={false}
                                    uProgress={0.0}
                                />
                            </mesh>
                        </group>
                    </group>
                </group>

                {/* SPATIAL AUDIO NODES (Attached slightly in front of the door) */}
                <PositionalAudio
                    ref={hoverAudioRef}
                    url="/sounds/uchyleniedrzwi.mp3"
                    distanceModel="exponential"
                    rolloffFactor={DOOR_AUDIO_SETTINGS.rolloff}
                    refDistance={DOOR_AUDIO_SETTINGS.distance}
                    loop={false}
                />
                <PositionalAudio
                    ref={openAudioRef}
                    url="/sounds/otwarciedrzwi.mp3"
                    distanceModel="exponential"
                    rolloffFactor={DOOR_AUDIO_SETTINGS.rolloff}
                    refDistance={DOOR_AUDIO_SETTINGS.distance}
                    loop={false}
                />
                <PositionalAudio
                    ref={closeAudioRef}
                    url="/sounds/zamknieciedrzwi.mp3"
                    distanceModel="exponential"
                    rolloffFactor={DOOR_AUDIO_SETTINGS.rolloff}
                    refDistance={DOOR_AUDIO_SETTINGS.distance}
                    loop={false}
                />
            </group>
        </group >
    );
};

export default DoorSection;
