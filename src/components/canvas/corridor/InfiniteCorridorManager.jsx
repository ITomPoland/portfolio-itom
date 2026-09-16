import { useState, useRef } from 'react';
import { useFrame, useThree } from '@react-three/fiber';

import CorridorSegment, { SEGMENT_LENGTH } from './CorridorSegment';

/**
 * Wrapper to toggle segment visibility based on camera position.
 * Massively reduces Draw Calls by hiding segments fully behind the camera.
 */
const SegmentVisibilityWrapper = ({ children, segmentIndex }) => {
    const groupRef = useRef();
    const { camera } = useThree();

    // Z bounds for this segment
    // Segment 0: Z=10 to Z=-70
    // Segment 1: Z=-70 to Z=-150
    const startZ = 10 - (segmentIndex * SEGMENT_LENGTH);
    const endZ = startZ - SEGMENT_LENGTH;

    useFrame(() => {
        if (!groupRef.current) return;
        // Camera looks towards -Z. 
        // If camera is significantly "in front" of the segment (e.g., camera Z is much less than endZ), hide it.
        // We reduce the buffer from 20 to 5. Once we pass the segment by 5 units, it disappears, freeing CPU.
        const isBehindCamera = camera.position.z < endZ - 5;
        // If camera is significantly "behind" the segment (e.g., camera Z is much greater than startZ + buffer), hide it.
        const isFarAhead = camera.position.z > startZ + 30;

        const isVisible = !(isBehindCamera || isFarAhead);

        if (groupRef.current.visible !== isVisible) {
            groupRef.current.visible = isVisible;
        }
    });

    return (
        <group ref={groupRef}>
            {children}
        </group>
    );
};

/**
 * InfiniteCorridorManager Component
 * 
 * Manages dynamic generation/removal of corridor segments.
 * 
 * hideDoorsForSegments: Array of segment indices that should hide their SegmentDoors
 * (used during entrance to avoid duplicate doors while keeping content preloaded)
 */
const InfiniteCorridorManager = ({
    onDoorEnter,
    hasEntered = true,
    hideDoorsForSegments = [], // Segments that should hide their SegmentDoors
    clipSegmentNeg1 = false, // Whether to clip segment -1 at EntranceDoors
    setCameraOverride // Function to take over camera control
}) => {
    const { camera } = useThree();
    // The entrance is at Z=22, but segment 0 only begins at Z=10.
    // Keep the clipped tail of segment -1 mounted before opening the doors:
    // it supplies the walls, floor and ceiling along the entrance camera path.
    // Its duplicate doors remain hidden by hideDoorsForSegments / zClip.
    const [activeSegments, setActiveSegments] = useState([-1, 0]);
    const lastSegment = useRef(null);

    // Update active segments based on camera position
    useFrame(() => {
        if (!hasEntered) return;
        const currentSegment = Math.floor((10 - camera.position.z) / SEGMENT_LENGTH);
        if (lastSegment.current === currentSegment) return;
        lastSegment.current = currentSegment;

        // Render previous, current, and next segment
        const shouldBeActive = [
            currentSegment - 1,
            currentSegment,
            currentSegment + 1
        ];

        setActiveSegments(shouldBeActive);
    });

    return (
        <group>
            {activeSegments.map((segmentIndex) => (
                <SegmentVisibilityWrapper key={`seg-wrap-${segmentIndex}`} segmentIndex={segmentIndex}>
                    <CorridorSegment
                        key={`segment-${segmentIndex}`}
                        segmentIndex={segmentIndex}
                        onDoorEnter={onDoorEnter}
                        hideSegmentDoors={hideDoorsForSegments.includes(segmentIndex)}
                        zClip={clipSegmentNeg1 && segmentIndex === -1 ? 22 : 100000}
                        setCameraOverride={setCameraOverride}
                    />
                </SegmentVisibilityWrapper>
            ))}
        </group>
    );
};

export default InfiniteCorridorManager;
