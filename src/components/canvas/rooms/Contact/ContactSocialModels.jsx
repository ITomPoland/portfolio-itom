import { useEffect, useMemo, useRef, useState } from 'react';
import { useFrame } from '@react-three/fiber';
import { Html, useGLTF } from '@react-three/drei';
import Text from '../../LocalText';
import * as THREE from 'three';
import '../../../../styles/ContactSocialModels.scss';

const FEISHU_URL = 'https://my.feishu.cn/wiki/PdgpwD8griJDY9kkQ71c5zufnSH?from=from_copylink';
const CONTACT_FONT = '/fonts/HarmonyOS-Sans-SC-Bold-About.ttf';
const _targetScale = new THREE.Vector3();
const _waterPlane = new THREE.Plane();
const _waterPlaneNormal = new THREE.Vector3(0, 1, 0);
const _waterPlanePoint = new THREE.Vector3();
const _dragWorldPoint = new THREE.Vector3();
const _dragLocalPoint = new THREE.Vector3();
const COLLISION_MARGIN = 0.08;
const DRAG_LIMITS = {
    minX: -7.2,
    maxX: 7.2,
    minZ: -10.4,
    maxZ: -5.15
};

const CONTACTS = [
    {
        id: 'qq',
        label: 'QQ',
        modelPath: '/models/contact/qq.glb',
        desktopPosition: [-5.6, -0.96, -7.9],
        mobilePosition: [-3.35, -0.96, -7.9],
        rotation: [0, 0.18, 0],
        height: 3.15,
        submergeDepth: 0.34,
        waterFootprint: [0.98, 0.62],
        waterRadius: 0.015,
        collisionRadius: 1.34,
        restTilt: [0.055, -0.09],
        phase: 0.4
    },
    {
        id: 'wechat',
        label: '微信',
        modelPath: '/models/contact/wechat.glb',
        desktopPosition: [0, -0.96, -6.95],
        mobilePosition: [0, -0.96, -6.9],
        rotation: [0, -0.08, 0],
        height: 2.85,
        submergeDepth: 0.29,
        waterFootprint: [0.9, 0.58],
        waterRadius: 0.014,
        collisionRadius: 1.24,
        restTilt: [-0.04, 0.075],
        phase: 2.1
    },
    {
        id: 'feishu',
        label: '飞书',
        modelPath: '/models/contact/feishu.glb',
        desktopPosition: [5.6, -0.96, -7.9],
        mobilePosition: [3.35, -0.96, -7.9],
        rotation: [0, -0.22, 0],
        height: 2.9,
        submergeDepth: 0.31,
        waterFootprint: [0.92, 0.58],
        waterRadius: 0.0145,
        collisionRadius: 1.3,
        restTilt: [0.06, 0.11],
        phase: 4.3
    }
];

const resolveCircleMotion = ({
    index,
    startX,
    startZ,
    targetX,
    targetZ,
    radius,
    bodies
}) => {
    let x = startX;
    let z = startZ;
    let collided = false;

    // Repair any overlap left by a resize or a previous frame before sweeping.
    for (let pass = 0; pass < 2; pass += 1) {
        bodies.forEach((other, otherIndex) => {
            if (otherIndex === index || !other.initialized) return;

            const minimumDistance = radius + other.radius + COLLISION_MARGIN;
            let dx = x - other.x;
            let dz = z - other.z;
            let distance = Math.hypot(dx, dz);

            if (distance >= minimumDistance) return;

            collided = true;
            if (distance < 0.0001) {
                const fallbackAngle = (index + 1) * 2.17;
                dx = Math.cos(fallbackAngle);
                dz = Math.sin(fallbackAngle);
                distance = 1;
            }

            const correction = minimumDistance - distance;
            x += (dx / distance) * correction;
            z += (dz / distance) * correction;
        });
    }

    let remainingX = targetX - x;
    let remainingZ = targetZ - z;

    // Swept-circle collision prevents fast mouse movement tunnelling through
    // another model. Tangential motion is preserved so models slide apart.
    for (let pass = 0; pass < 3; pass += 1) {
        const movementLengthSquared = remainingX * remainingX + remainingZ * remainingZ;
        if (movementLengthSquared < 0.000001) break;

        let earliestTime = 1;
        let hitBody = null;

        bodies.forEach((other, otherIndex) => {
            if (otherIndex === index || !other.initialized) return;

            const minimumDistance = radius + other.radius + COLLISION_MARGIN;
            const relativeX = x - other.x;
            const relativeZ = z - other.z;
            const b = 2 * (relativeX * remainingX + relativeZ * remainingZ);
            const c = relativeX * relativeX + relativeZ * relativeZ
                - minimumDistance * minimumDistance;
            const discriminant = b * b - 4 * movementLengthSquared * c;

            if (discriminant < 0) return;

            const entryTime = (-b - Math.sqrt(discriminant))
                / (2 * movementLengthSquared);
            if (entryTime >= 0 && entryTime <= earliestTime) {
                earliestTime = entryTime;
                hitBody = other;
            }
        });

        if (!hitBody) {
            x += remainingX;
            z += remainingZ;
            break;
        }

        collided = true;
        const movementLength = Math.sqrt(movementLengthSquared);
        const contactTime = Math.max(
            0,
            earliestTime - COLLISION_MARGIN / Math.max(movementLength, 0.0001)
        );
        x += remainingX * contactTime;
        z += remainingZ * contactTime;

        let normalX = x - hitBody.x;
        let normalZ = z - hitBody.z;
        const normalLength = Math.hypot(normalX, normalZ) || 1;
        normalX /= normalLength;
        normalZ /= normalLength;

        let slideX = remainingX * (1 - contactTime);
        let slideZ = remainingZ * (1 - contactTime);
        const inwardSpeed = slideX * normalX + slideZ * normalZ;
        if (inwardSpeed < 0) {
            slideX -= normalX * inwardSpeed;
            slideZ -= normalZ * inwardSpeed;
        }

        remainingX = slideX * 0.82;
        remainingZ = slideZ * 0.82;
    }

    return {
        x: THREE.MathUtils.clamp(x, DRAG_LIMITS.minX, DRAG_LIMITS.maxX),
        z: THREE.MathUtils.clamp(z, DRAG_LIMITS.minZ, DRAG_LIMITS.maxZ),
        collided
    };
};

const pushBodiesAlongMotion = ({
    index,
    startX,
    startZ,
    targetX,
    targetZ,
    radius,
    bodies
}) => {
    const motionX = targetX - startX;
    const motionZ = targetZ - startZ;
    const motionLength = Math.hypot(motionX, motionZ);
    const stepCount = THREE.MathUtils.clamp(Math.ceil(motionLength / 0.24), 1, 32);
    const directionX = motionLength > 0.0001 ? motionX / motionLength : 1;
    const directionZ = motionLength > 0.0001 ? motionZ / motionLength : 0;
    let x = startX;
    let z = startZ;
    let collided = false;

    const pushBody = ({
        bodyIndex,
        sourceIndex,
        sourceX,
        sourceZ,
        sourceRadius,
        fallbackX,
        fallbackZ,
        visited
    }) => {
        const body = bodies[bodyIndex];
        if (!body?.initialized || bodyIndex === sourceIndex || visited.has(bodyIndex)) {
            return false;
        }

        const minimumDistance = sourceRadius + body.radius + COLLISION_MARGIN;
        let dx = body.x - sourceX;
        let dz = body.z - sourceZ;
        let distance = Math.hypot(dx, dz);
        if (distance >= minimumDistance) return false;

        visited.add(bodyIndex);
        if (distance < 0.0001) {
            dx = fallbackX;
            dz = fallbackZ;
            distance = Math.hypot(dx, dz) || 1;
        }

        const correction = minimumDistance - distance + 0.012;
        const normalX = dx / distance;
        const normalZ = dz / distance;
        const desiredX = THREE.MathUtils.clamp(
            body.x + normalX * correction,
            DRAG_LIMITS.minX,
            DRAG_LIMITS.maxX
        );
        const desiredZ = THREE.MathUtils.clamp(
            body.z + normalZ * correction,
            DRAG_LIMITS.minZ,
            DRAG_LIMITS.maxZ
        );
        const deltaX = desiredX - body.x;
        const deltaZ = desiredZ - body.z;

        body.x = desiredX;
        body.z = desiredZ;
        body.pushOffsetX += deltaX;
        body.pushOffsetZ += deltaZ;
        body.pushVelocityX += deltaX * 4.2;
        body.pushVelocityZ += deltaZ * 4.2;
        body.waterImpulse = Math.min(body.waterImpulse, -0.0002);

        if (body.root) {
            body.root.position.x = desiredX;
            body.root.position.z = desiredZ;
        }

        bodies.forEach((other, otherIndex) => {
            if (otherIndex === sourceIndex || otherIndex === bodyIndex) return;
            pushBody({
                bodyIndex: otherIndex,
                sourceIndex: bodyIndex,
                sourceX: body.x,
                sourceZ: body.z,
                sourceRadius: body.radius,
                fallbackX: normalX,
                fallbackZ: normalZ,
                visited
            });
        });

        return true;
    };

    for (let step = 1; step <= stepCount; step += 1) {
        const progress = step / stepCount;
        x = THREE.MathUtils.lerp(startX, targetX, progress);
        z = THREE.MathUtils.lerp(startZ, targetZ, progress);
        const visited = new Set([index]);

        bodies.forEach((body, bodyIndex) => {
            if (bodyIndex === index) return;
            collided = pushBody({
                bodyIndex,
                sourceIndex: index,
                sourceX: x,
                sourceZ: z,
                sourceRadius: radius,
                fallbackX: directionX,
                fallbackZ: directionZ,
                visited
            }) || collided;
        });

        // Only become a wall when another model has already reached the scene
        // boundary and physically cannot be pushed farther.
        bodies.forEach((other, otherIndex) => {
            if (otherIndex === index || !other.initialized) return;
            const minimumDistance = radius + other.radius + COLLISION_MARGIN;
            let dx = x - other.x;
            let dz = z - other.z;
            let distance = Math.hypot(dx, dz);
            if (distance >= minimumDistance) return;

            if (distance < 0.0001) {
                dx = -directionX;
                dz = -directionZ;
                distance = 1;
            }
            x = other.x + (dx / distance) * minimumDistance;
            z = other.z + (dz / distance) * minimumDistance;
        });
    }

    return {
        x: THREE.MathUtils.clamp(x, DRAG_LIMITS.minX, DRAG_LIMITS.maxX),
        z: THREE.MathUtils.clamp(z, DRAG_LIMITS.minZ, DRAG_LIMITS.maxZ),
        collided
    };
};

const prepareMaterial = (sourceMaterial, paintOnBeforeCompile) => {
    const material = sourceMaterial.clone();

    if (material.map) {
        material.map.colorSpace = THREE.SRGBColorSpace;
    }

    if (paintOnBeforeCompile) {
        material.onBeforeCompile = paintOnBeforeCompile;
        material.needsUpdate = true;
    }

    return material;
};

const createNormalizedModel = (sourceScene, targetHeight, paintOnBeforeCompile) => {
    const model = sourceScene.clone(true);

    model.traverse((child) => {
        if (!child.isMesh) return;

        child.castShadow = true;
        child.receiveShadow = true;
        child.material = Array.isArray(child.material)
            ? child.material.map((material) => prepareMaterial(material, paintOnBeforeCompile))
            : prepareMaterial(child.material, paintOnBeforeCompile);
    });

    model.updateMatrixWorld(true);
    const initialBounds = new THREE.Box3().setFromObject(model);
    const initialSize = initialBounds.getSize(new THREE.Vector3());
    const scale = targetHeight / Math.max(initialSize.y, 0.001);
    model.scale.multiplyScalar(scale);
    model.updateMatrixWorld(true);

    const scaledBounds = new THREE.Box3().setFromObject(model);
    const scaledCenter = scaledBounds.getCenter(new THREE.Vector3());

    model.position.x -= scaledCenter.x;
    model.position.y -= scaledBounds.min.y;
    model.position.z -= scaledCenter.z;
    model.updateMatrixWorld(true);

    return model;
};

const ContactPopup = ({ type, onClose }) => (
    <Html
        center
        distanceFactor={8}
        zIndexRange={[70, 20]}
        className="contact-social-html"
    >
        <section
            className={`contact-social-card contact-social-card--${type}`}
            aria-label={
                type === 'qq'
                    ? 'QQ 联系方式'
                    : type === 'wechat'
                        ? '微信二维码名片'
                        : '飞书个人说明书链接'
            }
            onPointerDown={(event) => event.stopPropagation()}
        >
            <button
                type="button"
                className="contact-social-card__close"
                onClick={onClose}
                aria-label="关闭联系方式"
            >
                ×
            </button>

            {type === 'qq' && (
                <>
                    <span className="contact-social-card__eyebrow">QQ</span>
                    <strong className="contact-social-card__number">1670935895</strong>
                    <span className="contact-social-card__hint">添加时请备注来意</span>
                </>
            )}

            {type === 'wechat' && (
                <>
                    <span className="contact-social-card__eyebrow">微信 · 吴桐</span>
                    <img
                        className="contact-social-card__qr"
                        src="/assets/contact/wechat-card.png"
                        alt="吴桐的微信二维码名片"
                        draggable="false"
                    />
                    <span className="contact-social-card__hint">扫码添加微信</span>
                </>
            )}

            {type === 'feishu' && (
                <>
                    <span className="contact-social-card__eyebrow">飞书 · 个人说明书</span>
                    <strong className="contact-social-card__title">吴桐的个人说明书</strong>
                    <span className="contact-social-card__link-address">{FEISHU_URL}</span>
                    <a
                        className="contact-social-card__link-button"
                        href={FEISHU_URL}
                        target="_blank"
                        rel="noopener noreferrer"
                        onClick={(event) => event.stopPropagation()}
                    >
                        打开飞书个人说明书
                        <span aria-hidden="true">↗</span>
                    </a>
                    <span className="contact-social-card__hint">点击上方按钮后进入飞书</span>
                </>
            )}
        </section>
    </Html>
);

const WaterContactHalo = ({ config, waterSurfaceY, active }) => {
    const waterShadowMaterialRef = useRef();
    const meniscusMaterialRef = useRef();
    const rippleMaterialARef = useRef();
    const rippleMaterialBRef = useRef();
    const rippleARef = useRef();
    const rippleBRef = useRef();

    useFrame((state) => {
        const time = state.clock.getElapsedTime();
        const cycleA = (time * 0.18 + config.phase * 0.13) % 1;
        const cycleB = (cycleA + 0.5) % 1;
        const activeBoost = active ? 1.35 : 1;

        if (waterShadowMaterialRef.current) {
            waterShadowMaterialRef.current.opacity = active ? 0.105 : 0.075;
        }

        if (meniscusMaterialRef.current) {
            meniscusMaterialRef.current.opacity = active ? 0.34 : 0.24;
        }

        if (rippleARef.current && rippleMaterialARef.current) {
            const scale = 1 + cycleA * 0.58;
            rippleARef.current.scale.set(
                config.waterFootprint[0] * scale,
                config.waterFootprint[1] * scale,
                1
            );
            rippleMaterialARef.current.opacity = (1 - cycleA) * 0.11 * activeBoost;
        }

        if (rippleBRef.current && rippleMaterialBRef.current) {
            const scale = 1 + cycleB * 0.58;
            rippleBRef.current.scale.set(
                config.waterFootprint[0] * scale,
                config.waterFootprint[1] * scale,
                1
            );
            rippleMaterialBRef.current.opacity = (1 - cycleB) * 0.08 * activeBoost;
        }
    });

    return (
        <group position={[0, waterSurfaceY + 0.025, 0]} rotation={[-Math.PI / 2, 0, 0]}>
            <mesh
                scale={[
                    config.waterFootprint[0] * 0.82,
                    config.waterFootprint[1] * 0.72,
                    1
                ]}
                renderOrder={0}
            >
                <circleGeometry args={[1, 64]} />
                <meshBasicMaterial
                    ref={waterShadowMaterialRef}
                    color="#203f54"
                    transparent
                    opacity={0.075}
                    depthWrite={false}
                    toneMapped={false}
                />
            </mesh>

            <mesh
                scale={[config.waterFootprint[0], config.waterFootprint[1], 1]}
                renderOrder={2}
            >
                <ringGeometry args={[0.72, 1, 64]} />
                <meshBasicMaterial
                    ref={meniscusMaterialRef}
                    color="#34566f"
                    transparent
                    opacity={0.24}
                    depthWrite={false}
                    toneMapped={false}
                />
            </mesh>

            <mesh ref={rippleARef} renderOrder={1}>
                <ringGeometry args={[0.94, 1, 64]} />
                <meshBasicMaterial
                    ref={rippleMaterialARef}
                    color="#64859a"
                    transparent
                    opacity={0.1}
                    depthWrite={false}
                    toneMapped={false}
                />
            </mesh>

            <mesh ref={rippleBRef} renderOrder={1}>
                <ringGeometry args={[0.96, 1, 64]} />
                <meshBasicMaterial
                    ref={rippleMaterialBRef}
                    color="#f7fbfd"
                    transparent
                    opacity={0.07}
                    depthWrite={false}
                    toneMapped={false}
                />
            </mesh>
        </group>
    );
};

const ContactSocialModel = ({
    index,
    config,
    position,
    active,
    onActivate,
    onInteract,
    paintOnBeforeCompile,
    onFloaterUpdate,
    collisionBodiesRef,
    waterSurfaceY
}) => {
    const { scene } = useGLTF(config.modelPath);
    const rootRef = useRef();
    const modelRef = useRef();
    const floatMotionRef = useRef({
        y: waterSurfaceY - config.submergeDepth,
        velocity: 0,
        clickImpulse: 0
    });
    const dragStateRef = useRef({
        active: false,
        pointerId: null,
        captureTarget: null,
        targetX: position[0],
        targetZ: position[2],
        offsetX: 0,
        offsetZ: 0,
        startX: position[0],
        startZ: position[2],
        lastX: position[0],
        lastZ: position[2],
        lastTime: 0,
        startPointerY: 0,
        lastPointerY: 0,
        depthOffset: 0,
        targetDepth: 0,
        verticalSpeed: 0,
        moved: false,
        suppressClick: false
    });
    const [hovered, setHovered] = useState(false);

    const normalizedModel = useMemo(
        () => createNormalizedModel(scene, config.height, paintOnBeforeCompile),
        [scene, config.height, paintOnBeforeCompile]
    );

    useEffect(() => () => {
        normalizedModel.traverse((child) => {
            if (!child.isMesh) return;
            const materials = Array.isArray(child.material) ? child.material : [child.material];
            materials.forEach((material) => material.dispose());
        });
    }, [normalizedModel]);

    useEffect(() => {
        if (!hovered) return undefined;
        document.body.style.cursor = 'pointer';

        return () => {
            document.body.style.cursor = 'auto';
        };
    }, [hovered]);

    useEffect(() => {
        const body = collisionBodiesRef.current[index];
        body.anchorX = position[0];
        body.anchorZ = position[2];
        body.radius = config.collisionRadius;

        if (!body.initialized) {
            body.x = position[0];
            body.z = position[2];
            body.initialized = true;
        }
    }, [collisionBodiesRef, config.collisionRadius, index, position]);

    useFrame((state, delta) => {
        if (!rootRef.current || !modelRef.current) return;

        const time = state.clock.getElapsedTime();
        const safeDelta = Math.min(delta, 0.033);
        const wavePhase = time * 0.86 + config.phase;
        const motion = floatMotionRef.current;
        const drag = dragStateRef.current;
        const body = collisionBodiesRef.current[index];
        body.root = rootRef.current;

        if (!drag.active) {
            body.pushVelocityX += -body.pushOffsetX * 7.8 * safeDelta;
            body.pushVelocityZ += -body.pushOffsetZ * 7.8 * safeDelta;
            body.pushVelocityX *= Math.exp(-2.8 * safeDelta);
            body.pushVelocityZ *= Math.exp(-2.8 * safeDelta);
            body.pushOffsetX += body.pushVelocityX * safeDelta;
            body.pushOffsetZ += body.pushVelocityZ * safeDelta;
        }
        body.waterImpulse *= Math.exp(-5.2 * safeDelta);

        drag.depthOffset = THREE.MathUtils.damp(
            drag.depthOffset,
            drag.active ? drag.targetDepth : 0,
            drag.active ? 10.5 : 4.2,
            safeDelta
        );

        const targetY = waterSurfaceY - config.submergeDepth
            + Math.sin(wavePhase) * 0.082
            + Math.sin(time * 0.38 + config.phase * 1.7) * 0.024
            + drag.depthOffset;
        const drift = Math.sin(time * 0.34 + config.phase) * 0.075;
        const targetScaleValue = hovered || active ? 1.08 : 1;

        motion.velocity += (targetY - motion.y) * 9.2 * safeDelta;
        motion.velocity *= Math.exp(-2.65 * safeDelta);
        motion.y += motion.velocity * safeDelta;
        motion.clickImpulse *= Math.exp(-5.4 * safeDelta);

        const anchorX = position[0] + drift + body.pushOffsetX;
        const anchorZ = position[2]
            + Math.cos(time * 0.27 + config.phase) * 0.045
            + body.pushOffsetZ;
        const targetX = drag.active ? drag.targetX : anchorX;
        const targetZ = drag.active ? drag.targetZ : anchorZ;
        const horizontalDamping = drag.active ? 15 : 3.1;
        const desiredX = THREE.MathUtils.damp(
            rootRef.current.position.x,
            targetX,
            horizontalDamping,
            safeDelta
        );
        const desiredZ = THREE.MathUtils.damp(
            rootRef.current.position.z,
            targetZ,
            horizontalDamping,
            safeDelta
        );
        const constrainedPosition = resolveCircleMotion({
            index,
            startX: rootRef.current.position.x,
            startZ: rootRef.current.position.z,
            targetX: desiredX,
            targetZ: desiredZ,
            radius: config.collisionRadius,
            bodies: collisionBodiesRef.current
        });

        const previousX = body.x;
        const previousZ = body.z;
        rootRef.current.position.x = constrainedPosition.x;
        rootRef.current.position.z = constrainedPosition.z;

        const rawVelocityX = (constrainedPosition.x - previousX) / safeDelta;
        const rawVelocityZ = (constrainedPosition.z - previousZ) / safeDelta;
        body.velocityX = THREE.MathUtils.damp(
            body.velocityX,
            THREE.MathUtils.clamp(rawVelocityX, -4, 4),
            drag.active ? 12 : 5,
            safeDelta
        );
        body.velocityZ = THREE.MathUtils.damp(
            body.velocityZ,
            THREE.MathUtils.clamp(rawVelocityZ, -4, 4),
            drag.active ? 12 : 5,
            safeDelta
        );
        body.x = constrainedPosition.x;
        body.z = constrainedPosition.z;
        body.y = motion.y;
        body.dragging = drag.active;

        if (constrainedPosition.collided) {
            motion.clickImpulse = Math.min(motion.clickImpulse, -0.00013);
        }

        modelRef.current.position.y = motion.y;
        const effectiveVelocityX = body.velocityX + body.pushVelocityX;
        const effectiveVelocityZ = body.velocityZ + body.pushVelocityZ;
        const pitchFromMotion = THREE.MathUtils.clamp(-effectiveVelocityZ * 0.035, -0.14, 0.14);
        const rollFromMotion = THREE.MathUtils.clamp(effectiveVelocityX * 0.042, -0.16, 0.16);
        const immersion = Math.max(waterSurfaceY - motion.y, 0);
        const immersionDelta = immersion - config.submergeDepth;
        modelRef.current.rotation.x = THREE.MathUtils.damp(
            modelRef.current.rotation.x,
            config.restTilt[0]
                + Math.cos(wavePhase) * 0.052
                + pitchFromMotion
                + drag.depthOffset * 0.035,
            3.2,
            safeDelta
        );
        modelRef.current.rotation.y = config.rotation[1] + Math.sin(time * 0.28 + config.phase) * 0.035;
        modelRef.current.rotation.z = THREE.MathUtils.damp(
            modelRef.current.rotation.z,
            config.restTilt[1]
                + Math.sin(wavePhase + 0.65) * 0.072
                + rollFromMotion
                - motion.velocity * 0.18,
            3.2,
            safeDelta
        );
        modelRef.current.scale.lerp(
            _targetScale.setScalar(targetScaleValue),
            Math.min(safeDelta * 8, 1)
        );

        onFloaterUpdate?.(
            index,
            rootRef.current.position.x,
            rootRef.current.position.z,
            config.waterRadius,
            Math.sin(wavePhase) * 0.000025
                + THREE.MathUtils.clamp(-motion.velocity * 0.00055, -0.0001, 0.0001)
                - THREE.MathUtils.clamp(
                    Math.hypot(effectiveVelocityX, effectiveVelocityZ) * 0.000024,
                    0,
                    0.00012
                )
                - THREE.MathUtils.clamp(immersionDelta * 0.00011, -0.000035, 0.00009)
                + body.waterImpulse
                + motion.clickImpulse
        );
    });

    const getWaterDragPoint = (event) => {
        const parent = rootRef.current?.parent;
        if (!parent || !event.ray) return null;

        parent.updateWorldMatrix(true, false);
        _waterPlanePoint.set(0, waterSurfaceY, 0);
        parent.localToWorld(_waterPlanePoint);
        _waterPlane.setFromNormalAndCoplanarPoint(_waterPlaneNormal, _waterPlanePoint);

        if (!event.ray.intersectPlane(_waterPlane, _dragWorldPoint)) return null;

        _dragLocalPoint.copy(_dragWorldPoint);
        parent.worldToLocal(_dragLocalPoint);
        return _dragLocalPoint;
    };

    const handlePointerDown = (event) => {
        event.stopPropagation();
        const dragPoint = getWaterDragPoint(event);
        if (!dragPoint || !rootRef.current) return;

        const drag = dragStateRef.current;
        const pointerY = event.pointer?.y ?? 0;
        drag.active = true;
        drag.pointerId = event.pointerId;
        drag.captureTarget = event.target;
        drag.offsetX = rootRef.current.position.x - dragPoint.x;
        drag.offsetZ = rootRef.current.position.z - dragPoint.z;
        drag.targetX = rootRef.current.position.x;
        drag.targetZ = rootRef.current.position.z;
        drag.startX = rootRef.current.position.x;
        drag.startZ = rootRef.current.position.z;
        drag.lastX = rootRef.current.position.x;
        drag.lastZ = rootRef.current.position.z;
        drag.lastTime = performance.now();
        drag.startPointerY = pointerY;
        drag.lastPointerY = pointerY;
        drag.depthOffset = 0;
        drag.targetDepth = 0;
        drag.verticalSpeed = 0;
        drag.moved = false;
        drag.suppressClick = false;
        collisionBodiesRef.current[index].dragging = true;

        event.target.setPointerCapture?.(event.pointerId);
        floatMotionRef.current.velocity += 0.11;
        floatMotionRef.current.clickImpulse = -0.0002;
    };

    const handlePointerMove = (event) => {
        const drag = dragStateRef.current;
        if (!drag.active || drag.pointerId !== event.pointerId) return;

        event.stopPropagation();
        const dragPoint = getWaterDragPoint(event);
        if (!dragPoint) return;

        const proposedX = THREE.MathUtils.clamp(
            dragPoint.x + drag.offsetX,
            DRAG_LIMITS.minX,
            DRAG_LIMITS.maxX
        );
        const proposedZ = THREE.MathUtils.clamp(
            dragPoint.z + drag.offsetZ,
            DRAG_LIMITS.minZ,
            DRAG_LIMITS.maxZ
        );
        const constrainedDrag = pushBodiesAlongMotion({
            index,
            startX: drag.lastX,
            startZ: drag.lastZ,
            targetX: proposedX,
            targetZ: proposedZ,
            radius: config.collisionRadius,
            bodies: collisionBodiesRef.current
        });
        const nextX = constrainedDrag.x;
        const nextZ = constrainedDrag.z;
        const now = performance.now();
        const elapsed = Math.max(now - drag.lastTime, 12);
        const movement = Math.hypot(nextX - drag.lastX, nextZ - drag.lastZ);
        const totalMovement = Math.hypot(nextX - drag.startX, nextZ - drag.startZ);
        const speed = movement / elapsed;
        const pointerY = event.pointer?.y ?? drag.lastPointerY;
        const pointerDeltaY = pointerY - drag.startPointerY;
        const targetDepth = THREE.MathUtils.clamp(pointerDeltaY * 1.05, -0.72, 0.16);
        const verticalDelta = pointerY - drag.lastPointerY;

        drag.targetX = nextX;
        drag.targetZ = nextZ;
        drag.lastX = nextX;
        drag.lastZ = nextZ;
        drag.lastTime = now;
        drag.lastPointerY = pointerY;
        drag.targetDepth = targetDepth;
        drag.verticalSpeed = verticalDelta / elapsed;
        drag.moved = drag.moved
            || totalMovement > 0.12
            || Math.abs(targetDepth) > 0.08;

        const collisionBoost = constrainedDrag.collided ? 0.00005 : 0;
        const depthBoost = Math.min(Math.abs(targetDepth) * 0.00016, 0.00012);

        floatMotionRef.current.clickImpulse = -THREE.MathUtils.clamp(
            0.00012 + speed * 0.012 + collisionBoost + depthBoost,
            0.00012,
            0.00032
        );
    };

    const finishDrag = (event) => {
        const drag = dragStateRef.current;
        if (!drag.active || drag.pointerId !== event.pointerId) return;

        event.stopPropagation();
        drag.captureTarget?.releasePointerCapture?.(event.pointerId);
        const releasedDepth = drag.depthOffset;
        drag.active = false;
        drag.pointerId = null;
        drag.captureTarget = null;
        drag.targetDepth = 0;
        drag.verticalSpeed = 0;
        drag.suppressClick = drag.moved;
        collisionBodiesRef.current[index].dragging = false;

        if (releasedDepth < -0.08) {
            floatMotionRef.current.velocity += THREE.MathUtils.clamp(
                -releasedDepth * 0.72,
                0.12,
                0.52
            );
            floatMotionRef.current.clickImpulse = -THREE.MathUtils.clamp(
                0.00018 + -releasedDepth * 0.00018,
                0.00018,
                0.0003
            );
        } else {
            floatMotionRef.current.clickImpulse = -0.00022;
        }
    };

    const handleClick = (event) => {
        event.stopPropagation();
        const drag = dragStateRef.current;
        if (drag.suppressClick) {
            drag.suppressClick = false;
            return;
        }

        onInteract?.(config.id);

        floatMotionRef.current.velocity += 0.24;
        floatMotionRef.current.clickImpulse = -0.00024;

        onActivate(config.id);
    };

    return (
        <group
            ref={rootRef}
            position={[position[0], 0, position[2]]}
            onPointerDown={handlePointerDown}
            onPointerMove={handlePointerMove}
            onPointerUp={finishDrag}
            onPointerCancel={finishDrag}
            onClick={handleClick}
            onPointerOver={(event) => {
                event.stopPropagation();
                setHovered(true);
            }}
            onPointerOut={(event) => {
                event.stopPropagation();
                setHovered(false);
            }}
        >
            <group
                ref={modelRef}
                position={[0, waterSurfaceY - config.submergeDepth, 0]}
                rotation={config.rotation}
            >
                <primitive object={normalizedModel} />

                <mesh position={[0, config.height * 0.5, 0]}>
                    <boxGeometry args={[config.height * 1.12, config.height, config.height * 0.9]} />
                    <meshBasicMaterial transparent opacity={0} depthWrite={false} />
                </mesh>

                <Text
                    position={[0, 0.16, config.height * 0.48]}
                    font={CONTACT_FONT}
                    fontSize={0.34}
                    color="#172029"
                    outlineWidth={0.025}
                    outlineColor="#ffffff"
                    anchorX="center"
                    anchorY="bottom"
                >
                    {config.label}
                </Text>

                {active && (
                    <group position={[0, config.height + 0.72, 0]}>
                        <ContactPopup
                            type={config.id}
                            onClose={(event) => {
                                event.stopPropagation();
                                onActivate(null);
                            }}
                        />
                    </group>
                )}
            </group>

            <WaterContactHalo
                config={config}
                waterSurfaceY={waterSurfaceY}
                active={active || hovered}
            />
        </group>
    );
};

const ContactSocialModels = ({
    isMobile,
    paintOnBeforeCompile,
    onInteract,
    onFloaterUpdate,
    waterSurfaceY = -1.02
}) => {
    const [activeContact, setActiveContact] = useState(null);
    const collisionBodiesRef = useRef(
        CONTACTS.map((config) => ({
            initialized: false,
            x: config.desktopPosition[0],
            y: waterSurfaceY - config.submergeDepth,
            z: config.desktopPosition[2],
            anchorX: config.desktopPosition[0],
            anchorZ: config.desktopPosition[2],
            radius: config.collisionRadius,
            velocityX: 0,
            velocityZ: 0,
            pushOffsetX: 0,
            pushOffsetZ: 0,
            pushVelocityX: 0,
            pushVelocityZ: 0,
            waterImpulse: 0,
            root: null,
            dragging: false
        }))
    );

    useEffect(() => {
        const handleKeyDown = (event) => {
            if (event.key === 'Escape') setActiveContact(null);
        };

        window.addEventListener('keydown', handleKeyDown);
        return () => window.removeEventListener('keydown', handleKeyDown);
    }, []);

    return (
        <group>
            <hemisphereLight color="#ffffff" groundColor="#8aa4b4" intensity={1.25} />
            <directionalLight position={[-4, 8, 5]} intensity={1.8} color="#fff9ec" />

            {CONTACTS.map((config, index) => (
                <ContactSocialModel
                    key={config.id}
                    index={index}
                    config={config}
                    position={isMobile ? config.mobilePosition : config.desktopPosition}
                    active={activeContact === config.id}
                    onActivate={(id) => setActiveContact((current) => current === id ? null : id)}
                    onInteract={onInteract}
                    paintOnBeforeCompile={paintOnBeforeCompile}
                    onFloaterUpdate={onFloaterUpdate}
                    collisionBodiesRef={collisionBodiesRef}
                    waterSurfaceY={waterSurfaceY}
                />
            ))}
        </group>
    );
};

useGLTF.preload('/models/contact/qq.glb');
useGLTF.preload('/models/contact/wechat.glb');
useGLTF.preload('/models/contact/feishu.glb');

export default ContactSocialModels;
