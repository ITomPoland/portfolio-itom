import { RoundedBox } from '@react-three/drei';

/**
 * Primitive-built placeholder product models for the Boutique showroom.
 * No CC0 VR-headset/console/glasses model was sourced yet for this pilot, so these
 * are built entirely from Three.js primitives + PBR materials — legible silhouettes
 * for a well-lit showroom hero object, not meant to be photorealistic. Swap any of
 * these for a real GLB later (see FurnitureModel.jsx) without changing productData.js's
 * shape beyond pointing `modelPath` at the new asset.
 */

const ACCENT_COLOR = '#00d4ff';

export const VRHeadsetModel = () => (
    <group>
        {/* Front shell */}
        <RoundedBox args={[0.24, 0.1, 0.14]} radius={0.025} smoothness={4} castShadow>
            <meshStandardMaterial color="#1b1c1f" roughness={0.4} metalness={0.15} />
        </RoundedBox>

        {/* Lenses */}
        {[-0.055, 0.055].map((x) => (
            <mesh key={x} position={[x, 0, 0.075]} rotation={[Math.PI / 2, 0, 0]} castShadow>
                <cylinderGeometry args={[0.032, 0.032, 0.02, 24]} />
                <meshStandardMaterial color="#050507" roughness={0.05} metalness={0.3} />
            </mesh>
        ))}

        {/* Head strap (partial torus arcing over/behind the shell) */}
        <mesh position={[0, 0, -0.02]} rotation={[Math.PI / 2, 0, 0]}>
            <torusGeometry args={[0.16, 0.018, 12, 24, Math.PI * 1.3]} />
            <meshStandardMaterial color="#2b2c30" roughness={0.7} metalness={0.05} />
        </mesh>

        {/* Accent light strip */}
        <mesh position={[0, 0.032, 0.071]}>
            <boxGeometry args={[0.18, 0.007, 0.002]} />
            <meshStandardMaterial color={ACCENT_COLOR} emissive={ACCENT_COLOR} emissiveIntensity={1.6} toneMapped={false} />
        </mesh>
    </group>
);

export const SmartGlassesModel = () => (
    <group>
        {/* Two lenses */}
        {[-0.045, 0.045].map((x) => (
            <RoundedBox key={x} args={[0.07, 0.045, 0.006]} radius={0.015} smoothness={4} position={[x, 0, 0]} castShadow>
                <meshStandardMaterial color="#0a0a0c" roughness={0.1} metalness={0.4} />
            </RoundedBox>
        ))}

        {/* Bridge */}
        <mesh position={[0, 0.006, 0]}>
            <boxGeometry args={[0.02, 0.008, 0.006]} />
            <meshStandardMaterial color="#3a3a3e" roughness={0.4} metalness={0.6} />
        </mesh>

        {/* Temple arms */}
        {[-1, 1].map((side) => (
            <mesh key={side} position={[side * 0.09, 0, -0.05]} rotation={[0, side * 0.35, 0]}>
                <boxGeometry args={[0.09, 0.008, 0.006]} />
                <meshStandardMaterial color="#3a3a3e" roughness={0.4} metalness={0.6} />
            </mesh>
        ))}

        {/* Accent LED on temple */}
        <mesh position={[0.135, 0, -0.03]}>
            <sphereGeometry args={[0.004, 8, 8]} />
            <meshStandardMaterial color={ACCENT_COLOR} emissive={ACCENT_COLOR} emissiveIntensity={2} toneMapped={false} />
        </mesh>
    </group>
);

export const ConsoleModel = () => (
    <group>
        <RoundedBox args={[0.32, 0.045, 0.22]} radius={0.015} smoothness={4} castShadow>
            <meshStandardMaterial color="#e5e6e8" roughness={0.35} metalness={0.1} />
        </RoundedBox>

        {/* Vents */}
        {[-0.08, 0, 0.08].map((z) => (
            <mesh key={z} position={[0, 0.024, z]}>
                <boxGeometry args={[0.26, 0.004, 0.01]} />
                <meshStandardMaterial color="#1a1a1c" roughness={0.6} metalness={0.0} />
            </mesh>
        ))}

        {/* Accent light strip along the front edge */}
        <mesh position={[0, 0, 0.111]}>
            <boxGeometry args={[0.3, 0.006, 0.002]} />
            <meshStandardMaterial color={ACCENT_COLOR} emissive={ACCENT_COLOR} emissiveIntensity={1.6} toneMapped={false} />
        </mesh>
    </group>
);

export const DroneModel = () => (
    <group>
        {/* Central Core Body */}
        <RoundedBox args={[0.18, 0.07, 0.18]} radius={0.015} smoothness={4} castShadow>
            <meshStandardMaterial color="#1b1c1f" roughness={0.4} metalness={0.2} />
        </RoundedBox>

        {/* LiDAR / Sensor Dome on Top */}
        <mesh position={[0, 0.045, 0]}>
            <cylinderGeometry args={[0.05, 0.05, 0.02, 16]} />
            <meshStandardMaterial color="#2d3748" roughness={0.2} metalness={0.6} />
        </mesh>

        {/* LiDAR Accent Glow Stripe */}
        <mesh position={[0, 0.045, 0]}>
            <cylinderGeometry args={[0.052, 0.052, 0.004, 16, 1, true]} />
            <meshStandardMaterial color={ACCENT_COLOR} emissive={ACCENT_COLOR} emissiveIntensity={1.8} toneMapped={false} />
        </mesh>

        {/* 4 Diagonal Arms extending out */}
        {[
            [-1, -1],
            [-1, 1],
            [1, -1],
            [1, 1],
        ].map(([xSide, zSide], idx) => {
            const rotAngle = Math.atan2(zSide, xSide);
            return (
                <group key={idx} position={[xSide * 0.11, 0, zSide * 0.11]} rotation={[0, -rotAngle + Math.PI / 4, 0]}>
                    {/* The structural arm */}
                    <mesh rotation={[0, 0, 0]} castShadow>
                        <boxGeometry args={[0.14, 0.015, 0.025]} />
                        <meshStandardMaterial color="#3a3a3e" roughness={0.5} metalness={0.5} />
                    </mesh>
                    {/* Rotor Motor at the end */}
                    <mesh position={[0.07, 0.015, 0]} castShadow>
                        <cylinderGeometry args={[0.022, 0.022, 0.03, 12]} />
                        <meshStandardMaterial color="#111" roughness={0.6} />
                    </mesh>
                    {/* Propellers */}
                    <mesh position={[0.07, 0.031, 0]} rotation={[0, idx * 0.5, 0]}>
                        <boxGeometry args={[0.12, 0.002, 0.01]} />
                        <meshStandardMaterial color="#4a5568" roughness={0.7} />
                    </mesh>
                </group>
            );
        })}
    </group>
);

export const Scanner3DModel = () => (
    <group>
        {/* Main Scanner Body (Vertical handle + Scanner block) */}
        <group position={[0, 0.05, 0]}>
            {/* Grip Handle */}
            <mesh position={[0, -0.09, 0]} castShadow>
                <cylinderGeometry args={[0.02, 0.022, 0.16, 16]} />
                <meshStandardMaterial color="#2d2d30" roughness={0.7} metalness={0.1} />
            </mesh>
            {/* Upper Scanner Unit */}
            <RoundedBox args={[0.08, 0.18, 0.12]} radius={0.01} smoothness={4} position={[0, 0.05, -0.01]} castShadow>
                <meshStandardMaterial color="#e5e6e8" roughness={0.3} metalness={0.2} />
            </RoundedBox>
            {/* Laser Emitters / Camera Lenses on front face */}
            {[-0.04, 0.0, 0.04].map((yOffset) => (
                <mesh key={yOffset} position={[0, 0.05 + yOffset, 0.051]} rotation={[Math.PI / 2, 0, 0]} castShadow>
                    <cylinderGeometry args={[0.014, 0.014, 0.005, 12]} />
                    <meshStandardMaterial color="#0b0b0d" roughness={0.1} metalness={0.8} />
                </mesh>
            ))}
            {/* Ring light accent around top lens */}
            <mesh position={[0, 0.09, 0.052]} rotation={[Math.PI / 2, 0, 0]}>
                <torusGeometry args={[0.015, 0.003, 8, 16]} />
                <meshStandardMaterial color={ACCENT_COLOR} emissive={ACCENT_COLOR} emissiveIntensity={2.0} toneMapped={false} />
            </mesh>
        </group>
    </group>
);

export const ControllerModel = () => (
    <group>
        {/* Left and Right Controller side-by-side */}
        {[-1, 1].map((side) => (
            <group key={side} position={[side * 0.09, 0, 0]} rotation={[0.2, side * -0.3, side * 0.1]}>
                {/* Ergonomic Grip handle */}
                <mesh position={[0, -0.04, 0]} rotation={[0.2, 0, 0]} castShadow>
                    <cylinderGeometry args={[0.016, 0.014, 0.11, 12]} />
                    <meshStandardMaterial color="#1b1c1f" roughness={0.5} metalness={0.1} />
                </mesh>
                {/* Upper control disc */}
                <mesh position={[0, 0.015, 0.01]} rotation={[0.2, 0, 0]} castShadow>
                    <cylinderGeometry args={[0.028, 0.028, 0.018, 16]} />
                    <meshStandardMaterial color="#2d2d32" roughness={0.4} metalness={0.2} />
                </mesh>
                {/* Analog Joystick */}
                <mesh position={[0.005, 0.025, 0.015]} castShadow>
                    <sphereGeometry args={[0.006, 12, 12]} />
                    <meshStandardMaterial color="#111" roughness={0.6} />
                </mesh>
                {/* Tracking Halo Ring */}
                <mesh position={[0, 0.02, -0.01]} rotation={[0.4, 0, 0]} castShadow>
                    <torusGeometry args={[0.042, 0.007, 10, 24]} />
                    <meshStandardMaterial color="#1b1c1f" roughness={0.5} metalness={0.1} />
                </mesh>
                {/* Tracked Halo Ring Accent Line */}
                <mesh position={[0, 0.02, -0.01]} rotation={[0.4, 0, 0]}>
                    <torusGeometry args={[0.045, 0.002, 6, 24]} />
                    <meshStandardMaterial color={ACCENT_COLOR} emissive={ACCENT_COLOR} emissiveIntensity={1.5} toneMapped={false} />
                </mesh>
            </group>
        ))}
    </group>
);

export const BaseStationModel = () => (
    <group>
        {/* Tracking Base Station Cube */}
        <RoundedBox args={[0.13, 0.13, 0.13]} radius={0.012} smoothness={4} castShadow>
            <meshStandardMaterial color="#1b1c1f" roughness={0.4} metalness={0.3} />
        </RoundedBox>

        {/* Curved front optical window face */}
        <mesh position={[0, 0, 0.06]} rotation={[0, 0, 0]} castShadow>
            <sphereGeometry args={[0.055, 16, 16, 0, Math.PI * 2, 0, Math.PI / 2.2]} />
            <meshStandardMaterial color="#020205" roughness={0.05} metalness={0.9} />
        </mesh>

        {/* Stand connector */}
        <mesh position={[0, -0.08, 0]} castShadow>
            <cylinderGeometry args={[0.01, 0.01, 0.03, 12]} />
            <meshStandardMaterial color="#3a3a3e" roughness={0.4} metalness={0.6} />
        </mesh>
        
        {/* Status Indicator LED Accent */}
        <mesh position={[0, 0.045, 0.062]}>
            <sphereGeometry args={[0.003, 8, 8]} />
            <meshStandardMaterial color={ACCENT_COLOR} emissive={ACCENT_COLOR} emissiveIntensity={2.0} toneMapped={false} />
        </mesh>
    </group>
);

export const HapticGloveModel = () => (
    <group>
        {/* Base wrist band cuff */}
        <mesh position={[0, -0.07, 0]} rotation={[Math.PI / 2, 0, 0]} castShadow>
            <cylinderGeometry args={[0.045, 0.05, 0.04, 16]} />
            <meshStandardMaterial color="#1a1b1e" roughness={0.6} />
        </mesh>

        {/* Main Palm plate */}
        <RoundedBox args={[0.085, 0.08, 0.024]} radius={0.008} smoothness={4} position={[0, -0.01, 0.005]} castShadow>
            <meshStandardMaterial color="#2b2d31" roughness={0.5} metalness={0.2} />
        </RoundedBox>

        {/* 5 Finger mechanical exoskeletons */}
        {[
            [-0.035, 0.03, 0.15],   // Thumb
            [-0.025, 0.06, 0.1],    // Index
            [-0.008, 0.065, 0.05],   // Middle
            [0.01, 0.06, 0.0],      // Ring
            [0.028, 0.05, -0.05]    // Pinky
        ].map(([xPos, yHeight, rotY], idx) => (
            <group key={idx} position={[xPos, 0.025, 0.008]} rotation={[0.2, rotY, 0.1]}>
                {/* Exoskeleton Link 1 */}
                <mesh castShadow>
                    <boxGeometry args={[0.007, yHeight * 0.5, 0.007]} />
                    <meshStandardMaterial color="#4a5568" roughness={0.4} metalness={0.6} />
                </mesh>
                {/* Joint hinge node */}
                <mesh position={[0, yHeight * 0.25, 0.002]} castShadow>
                    <sphereGeometry args={[0.005, 8, 8]} />
                    <meshStandardMaterial color="#1a1b1e" roughness={0.5} />
                </mesh>
                {/* Exoskeleton Link 2 */}
                <mesh position={[0, yHeight * 0.5, 0.005]} rotation={[-0.4, 0, 0]} castShadow>
                    <boxGeometry args={[0.006, yHeight * 0.4, 0.006]} />
                    <meshStandardMaterial color="#4a5568" roughness={0.4} metalness={0.6} />
                </mesh>
            </group>
        ))}

        {/* Wrist Control Unit Accent LED Light Strip */}
        <mesh position={[0, -0.06, 0.046]} rotation={[0.1, 0, 0]}>
            <boxGeometry args={[0.05, 0.006, 0.002]} />
            <meshStandardMaterial color={ACCENT_COLOR} emissive={ACCENT_COLOR} emissiveIntensity={1.8} toneMapped={false} />
        </mesh>
    </group>
);

export const PRODUCT_MODELS = {
    headset: VRHeadsetModel,
    glasses: SmartGlassesModel,
    console: ConsoleModel,
    drone: DroneModel,
    scanner3d: Scanner3DModel,
    controller: ControllerModel,
    basestation: BaseStationModel,
    hapticglove: HapticGloveModel,
};
