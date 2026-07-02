import { useRef, useEffect } from 'react';
import { usePerformance } from '../../../../context/PerformanceContext';

/**
 * BoutiqueLighting — real-time lighting rig for the Boutique showroom.
 * No offline light-baking pipeline is available, so this approximates a "museum
 * plinth" showroom look with a handful of real-time lights, tier-gated via
 * PerformanceContext: HIGH gets a shadow-casting key light + accent spots,
 * MEDIUM keeps the same lights without shadows, LOW drops the accent spots entirely.
 */
const BoutiqueLighting = ({ roomWidth = 12, roomHeight = 4.5, roomDepth = 12, targetPosition = [0, 1.3, -2] }) => {
    const { tier, settings } = usePerformance();
    const shadowsEnabled = settings.shadows;
    const isLow = tier === 'LOW';

    const spotLeftRef = useRef();
    const spotRightRef = useRef();

    // Spotlight targets aren't added to the scene graph, so their world matrix
    // must be updated manually after moving them.
    useEffect(() => {
        [spotLeftRef, spotRightRef].forEach((ref) => {
            if (ref.current) {
                ref.current.target.position.set(...targetPosition);
                ref.current.target.updateMatrixWorld();
            }
        });
    }, [targetPosition]);

    return (
        <group>
            {/* Global fill — replaces the ambient occlusion the flat-shaded look implicitly had */}
            <hemisphereLight args={['#ffffff', '#4a4038', 0.55]} />

            {/* Key light — soft skylight motif from directly overhead. Kept centred on X/Z
                (not offset toward one wall) because the camera's entry orientation isn't
                guaranteed, and an off-centre key light was blowing one wall out to white
                while leaving the other in shadow depending on which way the camera faced. */}
            <directionalLight
                position={[0, roomHeight * 1.8, roomDepth * 0.1]}
                intensity={0.55}
                color="#fff4e0"
                castShadow={shadowsEnabled}
                shadow-mapSize={shadowsEnabled ? [1024, 1024] : [256, 256]}
                shadow-camera-left={-roomWidth / 2}
                shadow-camera-right={roomWidth / 2}
                shadow-camera-top={roomDepth / 2}
                shadow-camera-bottom={-roomDepth / 2}
                shadow-camera-near={0.5}
                shadow-camera-far={roomHeight * 3}
            />

            {/* Showroom accent spots over the product cluster — skipped on LOW */}
            {!isLow && (
                <>
                    <spotLight
                        ref={spotLeftRef}
                        position={[-2, roomHeight - 0.5, 0]}
                        angle={0.5}
                        penumbra={0.7}
                        intensity={1.0}
                        color="#fff0d0"
                        distance={roomHeight * 1.6}
                        castShadow={false}
                    />
                    <spotLight
                        ref={spotRightRef}
                        position={[2, roomHeight - 0.5, 0]}
                        angle={0.5}
                        penumbra={0.7}
                        intensity={1.0}
                        color="#fff0d0"
                        distance={roomHeight * 1.6}
                        castShadow={false}
                    />
                </>
            )}
        </group>
    );
};

export default BoutiqueLighting;
