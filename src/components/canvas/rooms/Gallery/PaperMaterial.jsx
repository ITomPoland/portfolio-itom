import { forwardRef, useMemo, useRef, useImperativeHandle } from 'react';
import * as THREE from 'three';
import { useFrame } from '@react-three/fiber';

/**
 * PaperMaterial
 * A MeshStandardMaterial that supports bending via a custom vertex shader.
 * 
 * Uniforms accessible via ref:
 * - uBend: Float. Controls the amount of bending along the vertical axis.
 * - uBendAxis: Vector2. Direction of bending (not yet implemented, defaults to Y-axis bend).
 */
const PaperMaterial = forwardRef(({ color = '#ffffff', roughness = 0.6, map, side = THREE.DoubleSide, ...props }, ref) => {
    const materialRef = useRef();

    // Shader injection logic
    const onBeforeCompile = useMemo(() => (shader) => {
        // Add uniforms
        shader.uniforms.uBend = { value: 0 };
        shader.uniforms.uTime = { value: 0 };
        shader.uniforms.uWindStrength = { value: 0 }; // Extra flutter intensity
        shader.uniforms.mapBack = { value: null }; // Back texture
        shader.uniforms.mapOverlay = { value: null }; // Overlay texture

        // Prepend uniforms to vertex shader
        shader.vertexShader = `
            uniform float uBend;
            uniform float uTime;
            uniform float uWindStrength;
        ` + shader.vertexShader;

        // Inject bending logic before gl_Position
        shader.vertexShader = shader.vertexShader.replace(
            '#include <begin_vertex>',
            `
            #include <begin_vertex>
            
            // Simple parabolic bend
            float bendAmount = pow(transformed.y, 2.0) * uBend;
            transformed.z += bendAmount;

            // Add subtle flutter inspired by wind
            // Base flutter + Extra Wind Strength on hover
            float totalWind = 0.02 + uWindStrength; 
            // SLOWER FLUTTER: Reduced speed (uTime * 2.0) and frequency (y * 2.0)
            float flutter = sin(uTime * 2.0 + transformed.y * 2.0) * totalWind * (1.0 + abs(uBend * 3.0));
            transformed.z += flutter;
            `
        );

        // Inject Fragment Shader logic for double-sided texturing
        shader.fragmentShader = `
            uniform sampler2D mapBack;
            uniform sampler2D mapOverlay;
        ` + shader.fragmentShader;

        shader.fragmentShader = shader.fragmentShader.replace(
            '#include <map_fragment>',
            `
            #ifdef USE_MAP
                vec4 texColor = texture2D( map, vMapUv );
                
                // Flip Y UV to turn it upside down as requested
                // And keep X standard (vMapUv.x) to create a mirror effect (since back view naturally mirrors)
                vec2 backUv = vec2(vMapUv.x, 1.0 - vMapUv.y);
                vec4 backColor = texture2D( mapBack, backUv );
                
                // Sample overlay (also using the back UVs so it aligns)
                vec4 overlayColor = texture2D( mapOverlay, backUv );
                
                // Composite: Draw overlay on top of back texture based on alpha
                // Assuming overlay has transparency. If not, this might overwrite completely.
                vec4 finalBackColor = mix(backColor, overlayColor, overlayColor.a);
                
                vec4 sampledDiffuseColor = gl_FrontFacing ? texColor : finalBackColor;
                
                diffuseColor *= sampledDiffuseColor;
                
                // Slight brightness boost for readability
                diffuseColor.rgb *= 1.4;
            #endif
            `
        );

        // Store reference to shader to update uniforms later
        materialRef.current.userData.shader = shader;

        // Initial update if props provided
        if (props.mapBack && shader.uniforms.mapBack) {
            shader.uniforms.mapBack.value = props.mapBack;
        }
        if (props.mapOverlay && shader.uniforms.mapOverlay) {
            shader.uniforms.mapOverlay.value = props.mapOverlay;
        }
    }, [props.mapBack, props.mapOverlay]);

    useImperativeHandle(ref, () => ({
        // Getter/Setter for bend
        set bend(value) {
            if (materialRef.current?.userData?.shader) {
                materialRef.current.userData.shader.uniforms.uBend.value = value;
            }
        },
        get bend() {
            return materialRef.current?.userData?.shader?.uniforms.uBend.value || 0;
        },
        // Getter/Setter for windStrength
        set windStrength(value) {
            if (materialRef.current?.userData?.shader) {
                materialRef.current.userData.shader.uniforms.uWindStrength.value = value;
            }
        },
        get windStrength() {
            return materialRef.current?.userData?.shader?.uniforms.uWindStrength.value || 0;
        },
        // We can also expose the raw material if needed
        material: materialRef.current
    }));

    useFrame((state) => {
        if (materialRef.current?.userData?.shader) {
            materialRef.current.userData.shader.uniforms.uTime.value = state.clock.getElapsedTime();
        }
    });

    return (
        <meshStandardMaterial
            ref={materialRef}
            map={map}
            color={color}
            roughness={roughness}
            side={side}
            onBeforeCompile={onBeforeCompile}
            {...props}
        />
    );
});

export default PaperMaterial;
