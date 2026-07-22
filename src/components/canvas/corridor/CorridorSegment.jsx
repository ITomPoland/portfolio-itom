import { useMemo, memo } from 'react';
import { Text } from '@react-three/drei';
import * as THREE from 'three';

import CorridorWalls from './CorridorWalls';
import DoorSection from './DoorSection';
import SegmentDoors from './SegmentDoors';
import Avatar from './Avatar';
import HeroText from './HeroText';
import Doodles from './Doodles';
import CorridorDecorations from './CorridorDecorations';

/**
 * CorridorSegment Component
 * 
 * A single repeatable chunk of the infinite corridor.
 * Each segment contains: walls, avatar, hero text, doors, decorations.
 * 
 * Segment length: 80 units
 * Positioned based on segmentIndex * segmentLength
 */
/**
 * Length of a single corridor segment in world units (80u).
 * @type {number}
 */
const SEGMENT_LENGTH = 80;

/**
 * Outer X boundary coordinate for the corridor sawtooth wall geometry.
 * @type {number}
 */
const WALL_X_OUTER = 3.5;

/**
 * Inner X boundary coordinate for the corridor sawtooth wall geometry.
 * @type {number}
 */
const WALL_X_INNER = 1.7;

/**
 * Z span of the door opening within a sawtooth wall segment.
 * @type {number}
 */
const DOOR_Z_SPAN = 4;

// Angle of the wall relative to the corridor axis
const WALL_ANGLE = Math.atan2(WALL_X_OUTER - WALL_X_INNER, DOOR_Z_SPAN);

/**
 * CorridorSegment Component.
 *
 * Represents a single repeatable 80-unit segment of the infinite corridor.
 * Instantiates walls, hero text, avatar, decorations, and the 4 section doors
 * (THE GALLERY, THE STUDIO, THE ABOUT, LET'S CONNECT).
 *
 * @param {Object} props - Component props.
 * @param {number} [props.segmentIndex=0] - Index of the segment (determines Z offset).
 * @param {Function} [props.onDoorEnter] - Callback triggered when entering a door.
 * @param {boolean} [props.hideSegmentDoors=false] - Hide doors while keeping preloaded content.
 * @param {number} [props.zClip=100000] - Z-axis clipping plane.
 * @param {Function} [props.setCameraOverride] - Function to pass camera control to DoorSection.
 * @returns {React.ReactElement} The 3D corridor segment group.
 */
const CorridorSegment = ({
    segmentIndex = 0,
    onDoorEnter,
    hideSegmentDoors = false, // Hide only SegmentDoors while keeping content preloaded
    zClip = 100000, // Clipping plane (render everything with Z < zClip)
    setCameraOverride // Function to take over camera control
}) => {

    // Calculate Z offset based on segment index
    // Segment 0 starts at Z=10, goes to Z=-70
    const zOffset = 10 - (segmentIndex * SEGMENT_LENGTH);

    // Door positions within this segment (relative to segment start)
    const doors = useMemo(() => {
        const doorDefs = [
            {
                id: `gallery-${segmentIndex}`,
                roomId: 'gallery',
                relativeZ: -18,
                side: 'left',
                label: 'THE GALLERY',
                icon: '◈',
                color: '#f5efe6'
            },
            {
                id: `studio-${segmentIndex}`,
                roomId: 'studio',
                relativeZ: -32,
                side: 'right',
                label: 'THE STUDIO',
                icon: '▶',
                color: '#e6f5ef'
            },
            {
                id: `about-${segmentIndex}`,
                roomId: 'about',
                relativeZ: -48,
                side: 'left',
                label: 'THE ABOUT',
                icon: '★',
                color: '#efe6f5',
                enterDistance: 25 // Enter deep into the room (clouds are far back)
            },
            {
                id: `connect-${segmentIndex}`,
                roomId: 'contact',
                relativeZ: -62,
                side: 'right',
                label: "LET'S CONNECT",
                icon: '✉',
                color: '#f5e6e6'
            },
        ];

        return doorDefs.map(def => {
            // Calculate adjusted Position and Rotation for Sawtooth Walls
            const xBase = (WALL_X_OUTER + WALL_X_INNER) / 2; // Midpoint of the angled wall
            const xPos = def.side === 'left' ? -xBase : xBase;

            // Rotation:
            // Left Wall: Normal was (1,0,0) [RotY 90]. Now angle it towards camera (+Z).
            // Rotate Clockwise by WALL_ANGLE.
            // Right Wall: Normal was (-1,0,0) [RotY -90]. Angle towards camera (+Z).
            // Rotate Counter-Clockwise by WALL_ANGLE.

            const baseRot = def.side === 'left' ? Math.PI / 2 : -Math.PI / 2;
            const rotOffset = def.side === 'left' ? -WALL_ANGLE : WALL_ANGLE;

            return {
                ...def,
                x: xPos,
                rotation: baseRot + rotOffset
            };
        });
    }, [segmentIndex]);

    return (
        <group position={[0, 0, 0]}>
            {/* === CORRIDOR WALLS === */}
            {/* Pass door positions so walls can generate gaps/angles correctly */}
            <CorridorWalls
                zStart={zOffset}
                length={SEGMENT_LENGTH}
                doorPositions={doors}
                zClip={zClip}
            />

            {/* === WELCOME AREA (Start of segment) - MOVED CLOSER === */}
            <group position={[0, 0, zOffset - 2]}>
                {/* Hero text - centered (letters adjusted internally) */}
                <HeroText position={[0, -0.1, -0.5]} />

                {/* Avatar - center */}
                <Avatar position={[0, -0.61, -0.3]} />


                {/* Doodles around avatar */}
                <Doodles />

                {/* Segment number (debug - can remove later) */}
                <Text
                    position={[1.7, 1.4, 0.3]}
                    fontSize={0.12}
                    color="#ccc"
                    anchorX="center"
                >
                    #{segmentIndex}
                </Text>
            </group>

            {/* === DOOR SECTIONS (wall + door + label as one unit) === */}
            {/* Hidden during entrance animation for segment -1 */}
            {!hideSegmentDoors && doors.map((door) => (
                <DoorSection
                    key={door.id}
                    position={[
                        door.x,
                        0,
                        zOffset + door.relativeZ + 2
                    ]}
                    side={door.side}
                    label={door.label}
                    roomId={door.roomId}
                    icon={door.icon}
                    color={door.color}
                    enterDistance={door.enterDistance}
                    onEnter={() => onDoorEnter?.(door.roomId)}
                    setCameraOverride={setCameraOverride}
                    segmentIndex={segmentIndex}
                />
            ))}

            {/* === LIGHTING === */}
            {/* pointLight removed for optimization as it didn't affect visuals significantly */}

            <CorridorDecorations
                segmentLength={SEGMENT_LENGTH}
                zOffset={zOffset}
                corridorWidth={WALL_X_OUTER * 2}
                corridorHeight={3.5}
                zClip={zClip}
                setCameraOverride={setCameraOverride}
            />

            {/* === SEGMENT END DOORS (hidden during entrance) === */}
            {!hideSegmentDoors && (
                <SegmentDoors
                    position={[0, 0, zOffset - SEGMENT_LENGTH + 5]}
                    corridorHeight={3.5}
                />
            )}
        </group>
    );
};

const MemoizedCorridorSegment = memo(CorridorSegment);

export { SEGMENT_LENGTH, WALL_X_OUTER, WALL_X_INNER, DOOR_Z_SPAN };
export default MemoizedCorridorSegment;
