import { useCallback, useEffect, useMemo, useRef } from 'react';
import { useFrame, useThree } from '@react-three/fiber';
import * as THREE from 'three';
import { GPUComputationRenderer } from 'three/examples/jsm/misc/GPUComputationRenderer.js';

const SIMULATION_WIDTH = 128;
const SIMULATION_HEIGHT = 96;
const WATER_WIDTH = 80;
const WATER_DEPTH = 70;
const WATER_CENTER_Z = -25;
const POINTER_IDLE_UV = 10000;
const HOVER_POINTER_RADIUS = 0.0075;
const DRAG_POINTER_RADIUS = 0.0105;

const HEIGHTMAP_FRAGMENT_SHADER = /* glsl */ `
    #include <common>

    uniform vec2 pointerUv;
    uniform float pointerRadius;
    uniform float pointerStrength;
    uniform float damping;
    uniform float time;
    uniform vec2 floaterUv0;
    uniform vec2 floaterUv1;
    uniform vec2 floaterUv2;
    uniform vec2 floaterUv3;
    uniform vec2 floaterUv4;
    uniform float floaterRadius0;
    uniform float floaterRadius1;
    uniform float floaterRadius2;
    uniform float floaterRadius3;
    uniform float floaterRadius4;
    uniform float floaterStrength0;
    uniform float floaterStrength1;
    uniform float floaterStrength2;
    uniform float floaterStrength3;
    uniform float floaterStrength4;

    float floaterWake(vec2 uv, vec2 center, float radius, float strength) {
        vec2 delta = (uv - center) * vec2(${(WATER_WIDTH / WATER_DEPTH).toFixed(8)}, 1.0);
        float distanceToFloater = length(delta) / max(radius, 0.0001);
        float contactPressure = exp(-distanceToFloater * distanceToFloater * 8.0);
        float wakeRing = exp(-pow((distanceToFloater - 0.78) * 5.4, 2.0));
        return (contactPressure * 0.42 - wakeRing * 0.34) * strength;
    }

    void main() {
        vec2 cellSize = 1.0 / resolution.xy;
        vec2 uv = gl_FragCoord.xy * cellSize;

        vec4 heightmapValue = texture2D(heightmap, uv);
        float north = texture2D(heightmap, uv + vec2(0.0, cellSize.y)).x;
        float south = texture2D(heightmap, uv - vec2(0.0, cellSize.y)).x;
        float east = texture2D(heightmap, uv + vec2(cellSize.x, 0.0)).x;
        float west = texture2D(heightmap, uv - vec2(cellSize.x, 0.0)).x;

        // Same two-frame height-field wave equation used by the official
        // Three.js GPGPU water example, adjusted for this rectangular sea.
        float nextHeight = ((north + south + east + west) * 0.5 - heightmapValue.y) * damping;

        vec2 pointerDelta = (uv - pointerUv) * vec2(${(WATER_WIDTH / WATER_DEPTH).toFixed(8)}, 1.0);
        float pointerDistance = length(pointerDelta) / pointerRadius;
        float pointerEnvelope = 1.0 - smoothstep(0.0, 1.0, pointerDistance);
        float pointerCenter = exp(-pointerDistance * pointerDistance * 18.0);
        float pointerRing = exp(-pow((pointerDistance - 0.58) * 7.5, 2.0));

        // A near-zero-volume impulse creates a small travelling ring instead
        // of pushing the whole patch of water into a deep rubbery crater.
        nextHeight += (
            pointerCenter - pointerRing * 0.48
        ) * pointerEnvelope * pointerStrength;

        // A very small continuous swell prevents the sea becoming perfectly
        // still while keeping cursor-generated rings clearly readable.
        float ambientSwell = (
            sin((uv.x * 5.0 + uv.y * 3.0 + time * 0.075) * PI * 2.0) +
            cos((uv.x * 2.0 - uv.y * 6.0 - time * 0.055) * PI * 2.0)
        ) * 0.000018;
        nextHeight += ambientSwell;

        // Each social model presses into the same height field as the pointer.
        // The low, alternating impulses produce a small wake around the
        // waterline without turning the models into rubber balls.
        nextHeight += floaterWake(uv, floaterUv0, floaterRadius0, floaterStrength0);
        nextHeight += floaterWake(uv, floaterUv1, floaterRadius1, floaterStrength1);
        nextHeight += floaterWake(uv, floaterUv2, floaterRadius2, floaterStrength2);
        nextHeight += floaterWake(uv, floaterUv3, floaterRadius3, floaterStrength3);
        nextHeight += floaterWake(uv, floaterUv4, floaterRadius4, floaterStrength4);

        heightmapValue.y = heightmapValue.x;
        heightmapValue.x = nextHeight;
        gl_FragColor = heightmapValue;
    }
`;

const fillInitialHeightmap = (texture) => {
    const pixels = texture.image.data;

    for (let y = 0; y < SIMULATION_HEIGHT; y += 1) {
        for (let x = 0; x < SIMULATION_WIDTH; x += 1) {
            const u = x / (SIMULATION_WIDTH - 1);
            const v = y / (SIMULATION_HEIGHT - 1);
            const height = (
                Math.sin(u * Math.PI * 8 + v * Math.PI * 2) +
                Math.cos(v * Math.PI * 7 - u * Math.PI * 1.5)
            ) * 0.00075;
            const offset = (y * SIMULATION_WIDTH + x) * 4;

            pixels[offset] = height;
            pixels[offset + 1] = height;
            pixels[offset + 2] = 0;
            pixels[offset + 3] = 1;
        }
    }

    texture.needsUpdate = true;
};

const WATER_VERTEX_SHADER = /* glsl */ `
    #include <common>

    uniform sampler2D heightmap;
    uniform float waterTime;
    uniform float waterDisplacement;

    varying vec3 vWaterWorldPosition;
    varying vec3 vWaterWorldNormal;
    varying float vWaterHeight;
    varying float vWaterSlope;
    varying float vWaterInteractionHeight;
    varying float vWaterInteractionSlope;

    void main() {
        vec2 waterCell = vec2(
            1.0 / ${SIMULATION_WIDTH.toFixed(1)},
            1.0 / ${SIMULATION_HEIGHT.toFixed(1)}
        );

        float waterCenter = texture2D(heightmap, uv).x;
        float waterLeft = texture2D(heightmap, uv - vec2(waterCell.x, 0.0)).x;
        float waterRight = texture2D(heightmap, uv + vec2(waterCell.x, 0.0)).x;
        float waterDown = texture2D(heightmap, uv - vec2(0.0, waterCell.y)).x;
        float waterUp = texture2D(heightmap, uv + vec2(0.0, waterCell.y)).x;

        // Three low-amplitude wave trains cross at different angles. They are
        // real vertex displacement, not a scrolling water texture.
        float idlePhaseA = dot(position.xy, vec2(0.30, 0.10)) + waterTime * 0.44;
        float idlePhaseB = dot(position.xy, vec2(-0.16, 0.38)) - waterTime * 0.34;
        float idlePhaseC = dot(position.xy, vec2(0.54, -0.24)) + waterTime * 0.22;
        float idleHeight =
            sin(idlePhaseA) * 0.011 +
            sin(idlePhaseB) * 0.007 +
            sin(idlePhaseC) * 0.0035;

        float interactionDx = (
            (waterRight - waterLeft) * waterDisplacement /
            ${(2 * WATER_WIDTH / (SIMULATION_WIDTH - 1)).toFixed(8)}
        );
        float interactionDy = (
            (waterUp - waterDown) * waterDisplacement /
            ${(2 * WATER_DEPTH / (SIMULATION_HEIGHT - 1)).toFixed(8)}
        );
        float heightDx = interactionDx +
            cos(idlePhaseA) * 0.00330 -
            cos(idlePhaseB) * 0.00112 +
            cos(idlePhaseC) * 0.00189;
        float heightDy = interactionDy +
            cos(idlePhaseA) * 0.00110 +
            cos(idlePhaseB) * 0.00266 -
            cos(idlePhaseC) * 0.00084;

        vec3 objectWaterNormal = normalize(vec3(-heightDx, -heightDy, 1.0));
        vec3 transformed = vec3(
            position.x,
            position.y,
            position.z + waterCenter * waterDisplacement + idleHeight
        );
        vec4 waterWorldPosition = modelMatrix * vec4(transformed, 1.0);

        vWaterWorldPosition = waterWorldPosition.xyz;
        vWaterWorldNormal = normalize(mat3(modelMatrix) * objectWaterNormal);
        vWaterHeight = waterCenter * waterDisplacement + idleHeight;
        vWaterSlope = length(vec2(heightDx, heightDy));
        vWaterInteractionHeight = waterCenter * waterDisplacement;
        vWaterInteractionSlope = length(vec2(interactionDx, interactionDy));

        #include <worldpos_vertex>

        gl_Position = projectionMatrix * viewMatrix * waterWorldPosition;
    }
`;

const WATER_FRAGMENT_SHADER = /* glsl */ `
    #include <common>

    uniform vec3 waterDeepColor;
    uniform vec3 waterShallowColor;
    uniform vec3 waterShadowColor;
    uniform vec3 waterHighlightColor;
    uniform float waterOpacity;
    uniform float waterTime;

    varying vec3 vWaterWorldPosition;
    varying vec3 vWaterWorldNormal;
    varying float vWaterHeight;
    varying float vWaterSlope;
    varying float vWaterInteractionHeight;
    varying float vWaterInteractionSlope;

    vec2 waterCausticBands(vec2 point, float timeOffset) {
        vec2 warpedPoint = point;
        warpedPoint += vec2(
            sin(point.y * 1.34 + timeOffset * 0.62),
            cos(point.x * 1.16 - timeOffset * 0.54)
        ) * 0.36;

        float waveA = sin(warpedPoint.x * 1.72 + sin(warpedPoint.y + timeOffset));
        float waveB = sin(warpedPoint.y * 1.88 + cos(warpedPoint.x - timeOffset * 0.86));
        float waveC = sin(
            (warpedPoint.x + warpedPoint.y) * 1.08 +
            cos((warpedPoint.x - warpedPoint.y) * 0.72 + timeOffset * 0.48)
        );

        float interference = abs(waveA + waveB + waveC);
        float brightCore = 1.0 - smoothstep(0.045, 0.16, interference);
        float refractedHalo = 1.0 - smoothstep(0.08, 0.38, interference);
        return vec2(brightCore, refractedHalo);
    }

    void main() {
        vec3 normalDirection = normalize(vWaterWorldNormal);
        vec3 viewDirection = normalize(cameraPosition - vWaterWorldPosition);
        vec3 lightDirection = normalize(vec3(-0.42, 0.88, 0.22));
        vec3 fillLightDirection = normalize(vec3(0.64, 0.48, -0.42));
        vec3 halfDirection = normalize(lightDirection + viewDirection);
        vec3 fillHalfDirection = normalize(fillLightDirection + viewDirection);

        float diffuseLight = 0.44 + 0.56 * max(dot(normalDirection, lightDirection), 0.0);
        float broadSpecular = pow(max(dot(normalDirection, fillHalfDirection), 0.0), 22.0);
        float sharpSpecular = pow(max(dot(normalDirection, halfDirection), 0.0), 92.0);
        float fresnel = pow(
            1.0 - clamp(dot(normalDirection, viewDirection), 0.0, 1.0),
            3.6
        );
        float rippleRidge = smoothstep(0.0035, 0.030, vWaterSlope);
        float highCrest = smoothstep(0.004, 0.075, vWaterHeight);
        float darkTrough = smoothstep(0.004, 0.070, -vWaterHeight);
        float interactionRing = smoothstep(0.00035, 0.0065, vWaterInteractionSlope);
        float interactionLift = smoothstep(0.0005, 0.024, abs(vWaterInteractionHeight));

        vec2 causticPoint = vWaterWorldPosition.xz * 0.95;
        vec2 fineCaustic = waterCausticBands(causticPoint, waterTime * 0.34);
        vec2 broadCaustic = waterCausticBands(
            causticPoint * 0.61 + vec2(2.7, -1.9),
            -waterTime * 0.22
        );
        float causticLight = clamp(fineCaustic.x * 0.86 + broadCaustic.x * 0.30, 0.0, 1.0);
        float causticHalo = clamp(fineCaustic.y * 0.78 + broadCaustic.y * 0.28, 0.0, 1.0);
        float causticEdge = max(causticHalo - causticLight * 0.72, 0.0);

        // Keep the body almost colourless. Depth comes from narrow dark
        // troughs and layered specular bands instead of a flat cyan fill.
        vec3 waterColor = mix(
            waterDeepColor,
            waterShallowColor,
            clamp(0.18 + diffuseLight * 0.42 + vWaterHeight * 0.72, 0.0, 1.0)
        );
        waterColor = mix(
            waterColor,
            waterShadowColor,
            clamp(
                darkTrough * 0.20 +
                rippleRidge * (1.0 - diffuseLight) * 0.14 +
                causticEdge * 0.72 +
                interactionRing * (1.0 - highCrest) * 0.24,
                0.0,
                0.76
            )
        );
        waterColor = mix(
            waterColor,
            waterHighlightColor,
            clamp(
                causticLight * 0.72 +
                fresnel * 0.14 +
                rippleRidge * 0.10 +
                highCrest * 0.08 +
                broadSpecular * 0.12 +
                interactionRing * 0.52,
                0.0,
                0.86
            )
        );
        waterColor += waterHighlightColor * sharpSpecular * 0.72;

        float alpha = clamp(
            waterOpacity +
            causticLight * 0.30 +
            causticEdge * 0.26 +
            fresnel * 0.07 +
            rippleRidge * 0.025 +
            broadSpecular * 0.040 +
            interactionRing * 0.34 +
            interactionLift * 0.055,
            0.0,
            0.72
        );

        gl_FragColor = vec4(waterColor, alpha);

        #include <tonemapping_fragment>
        #include <colorspace_fragment>
        #include <dithering_fragment>
    }
`;

const InteractiveWater = ({
    active = true,
    paintOnBeforeCompile,
    floaterInteractionRef,
    surfaceY = -1.02
}) => {
    const { gl } = useThree();
    const meshRef = useRef();
    const materialRef = useRef();
    const simulationRef = useRef();
    const pointerUvRef = useRef(new THREE.Vector2(POINTER_IDLE_UV, POINTER_IDLE_UV));
    const idlePointerUvRef = useRef(new THREE.Vector2(POINTER_IDLE_UV, POINTER_IDLE_UV));
    const pointerStrengthRef = useRef(0);
    const pointerRadiusRef = useRef(HOVER_POINTER_RADIUS);
    const pointerActiveUntilRef = useRef(0);
    const pointerDownRef = useRef(false);
    const lastPointerRef = useRef({ uv: new THREE.Vector2(0.5, 0.5), time: 0 });

    const fallbackHeightTexture = useMemo(() => {
        const texture = new THREE.DataTexture(
            new Uint8Array([0, 0, 0, 255]),
            1,
            1,
            THREE.RGBAFormat,
            THREE.UnsignedByteType
        );
        texture.needsUpdate = true;
        return texture;
    }, []);

    const waterUniforms = useMemo(() => ({
        heightmap: { value: fallbackHeightTexture },
        waterTime: { value: 0 },
        waterDisplacement: { value: 4.6 },
        waterDeepColor: { value: new THREE.Color('#557f9c') },
        waterShallowColor: { value: new THREE.Color('#a8c8da') },
        waterShadowColor: { value: new THREE.Color('#38566e') },
        waterHighlightColor: { value: new THREE.Color('#ffffff') },
        waterOpacity: { value: 0.42 }
    }), [fallbackHeightTexture]);

    useEffect(() => () => {
        fallbackHeightTexture.dispose();
    }, [fallbackHeightTexture]);

    useEffect(() => {
        const gpuCompute = new GPUComputationRenderer(
            SIMULATION_WIDTH,
            SIMULATION_HEIGHT,
            gl
        );
        gpuCompute.setDataType(THREE.HalfFloatType);

        const initialHeightmap = gpuCompute.createTexture();
        fillInitialHeightmap(initialHeightmap);

        const heightmapVariable = gpuCompute.addVariable(
            'heightmap',
            HEIGHTMAP_FRAGMENT_SHADER,
            initialHeightmap
        );
        gpuCompute.setVariableDependencies(heightmapVariable, [heightmapVariable]);

        const uniforms = heightmapVariable.material.uniforms;
        uniforms.pointerUv = { value: new THREE.Vector2(POINTER_IDLE_UV, POINTER_IDLE_UV) };
        uniforms.pointerRadius = { value: HOVER_POINTER_RADIUS };
        uniforms.pointerStrength = { value: 0 };
        uniforms.damping = { value: 0.962 };
        uniforms.time = { value: 0 };
        uniforms.floaterUv0 = { value: new THREE.Vector2(POINTER_IDLE_UV, POINTER_IDLE_UV) };
        uniforms.floaterUv1 = { value: new THREE.Vector2(POINTER_IDLE_UV, POINTER_IDLE_UV) };
        uniforms.floaterUv2 = { value: new THREE.Vector2(POINTER_IDLE_UV, POINTER_IDLE_UV) };
        uniforms.floaterUv3 = { value: new THREE.Vector2(POINTER_IDLE_UV, POINTER_IDLE_UV) };
        uniforms.floaterUv4 = { value: new THREE.Vector2(POINTER_IDLE_UV, POINTER_IDLE_UV) };
        uniforms.floaterRadius0 = { value: 0.018 };
        uniforms.floaterRadius1 = { value: 0.018 };
        uniforms.floaterRadius2 = { value: 0.018 };
        uniforms.floaterRadius3 = { value: 0.03 };
        uniforms.floaterRadius4 = { value: 0.09 };
        uniforms.floaterStrength0 = { value: 0 };
        uniforms.floaterStrength1 = { value: 0 };
        uniforms.floaterStrength2 = { value: 0 };
        uniforms.floaterStrength3 = { value: 0 };
        uniforms.floaterStrength4 = { value: 0 };

        const error = gpuCompute.init();
        if (error) {
            console.warn('Contact water GPGPU fallback:', error);
            gpuCompute.dispose();
            simulationRef.current = null;
            return undefined;
        }

        simulationRef.current = {
            gpuCompute,
            heightmapVariable,
            uniforms
        };

        return () => {
            simulationRef.current = null;
            gpuCompute.dispose();
        };
    }, [gl]);

    const injectPointer = useCallback((event, isPress = false) => {
        if (!event.uv) return;

        const now = performance.now();
        const lastPointer = lastPointerRef.current;
        const elapsed = Math.max(now - lastPointer.time, 12);
        const distance = event.uv.distanceTo(lastPointer.uv);
        const speed = distance / elapsed;
        const isDragging = isPress || pointerDownRef.current;

        if (!isDragging && lastPointer.time > 0 && now - lastPointer.time < 24) {
            return;
        }

        const strengthFromSpeed = THREE.MathUtils.clamp(speed * 0.28, 0, 0.00105);

        pointerUvRef.current.copy(event.uv);
        pointerStrengthRef.current = isDragging
            ? -0.0039
            : -(0.00058 + strengthFromSpeed);
        pointerRadiusRef.current = isDragging
            ? DRAG_POINTER_RADIUS
            : HOVER_POINTER_RADIUS;
        pointerActiveUntilRef.current = now + (isDragging ? 58 : 34);

        lastPointer.uv.copy(event.uv);
        lastPointer.time = now;
    }, []);

    useFrame((state) => {
        const elapsedTime = state.clock.getElapsedTime();
        const materialUniforms = materialRef.current?.uniforms;
        if (materialUniforms) {
            materialUniforms.waterTime.value = elapsedTime;
        }

        const simulation = simulationRef.current;
        if (!simulation || !active) return;

        const now = performance.now();
        const pointerIsActive = now <= pointerActiveUntilRef.current;

        simulation.uniforms.pointerUv.value.copy(
            pointerIsActive
                ? pointerUvRef.current
                : idlePointerUvRef.current
        );
        simulation.uniforms.pointerStrength.value = pointerIsActive
            ? pointerStrengthRef.current
            : 0;
        simulation.uniforms.pointerRadius.value = pointerRadiusRef.current;
        simulation.uniforms.time.value = elapsedTime;

        const floaters = floaterInteractionRef?.current;
        for (let index = 0; index < 5; index += 1) {
            const floater = floaters?.[index];
            const uvUniform = simulation.uniforms[`floaterUv${index}`];
            const radiusUniform = simulation.uniforms[`floaterRadius${index}`];
            const strengthUniform = simulation.uniforms[`floaterStrength${index}`];

            // During Vite HMR an existing GPU simulation can survive for one
            // frame with the previous four-floater uniform layout.
            if (!uvUniform || !radiusUniform || !strengthUniform) continue;

            if (!floater) {
                uvUniform.value.set(POINTER_IDLE_UV, POINTER_IDLE_UV);
                strengthUniform.value = 0;
                continue;
            }

            uvUniform.value.set(
                THREE.MathUtils.clamp(floater.x / WATER_WIDTH + 0.5, 0, 1),
                THREE.MathUtils.clamp(
                    (WATER_CENTER_Z + WATER_DEPTH * 0.5 - floater.z) / WATER_DEPTH,
                    0,
                    1
                )
            );
            radiusUniform.value = floater.radius;
            strengthUniform.value = floater.strength;
        }

        simulation.gpuCompute.compute();
        if (materialUniforms) {
            materialUniforms.heightmap.value = simulation.gpuCompute
                .getCurrentRenderTarget(simulation.heightmapVariable)
                .texture;
        }
    });

    return (
        <mesh
            ref={meshRef}
            position={[0, surfaceY, WATER_CENTER_Z]}
            rotation={[-Math.PI / 2, 0, 0]}
            renderOrder={-2}
            onPointerMove={(event) => injectPointer(event, false)}
            onPointerDown={(event) => {
                pointerDownRef.current = true;
                event.target.setPointerCapture?.(event.pointerId);
                injectPointer(event, true);
            }}
            onPointerUp={(event) => {
                pointerDownRef.current = false;
                event.target.releasePointerCapture?.(event.pointerId);
            }}
            onPointerCancel={() => {
                pointerDownRef.current = false;
                pointerActiveUntilRef.current = 0;
            }}
            onPointerLeave={() => {
                pointerDownRef.current = false;
                pointerActiveUntilRef.current = 0;
            }}
        >
            <planeGeometry
                args={[
                    WATER_WIDTH,
                    WATER_DEPTH,
                    SIMULATION_WIDTH - 1,
                    SIMULATION_HEIGHT - 1
                ]}
            />
            <shaderMaterial
                ref={materialRef}
                uniforms={waterUniforms}
                vertexShader={WATER_VERTEX_SHADER}
                fragmentShader={WATER_FRAGMENT_SHADER}
                transparent
                side={THREE.DoubleSide}
                depthWrite
                onBeforeCompile={paintOnBeforeCompile}
                customProgramCacheKey={() => 'contact-gpgpu-water-3d-v9'}
            />
        </mesh>
    );
};

export default InteractiveWater;
