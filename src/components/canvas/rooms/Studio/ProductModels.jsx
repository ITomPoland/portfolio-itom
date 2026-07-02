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

export const PRODUCT_MODELS = {
    headset: VRHeadsetModel,
    glasses: SmartGlassesModel,
    console: ConsoleModel,
};
