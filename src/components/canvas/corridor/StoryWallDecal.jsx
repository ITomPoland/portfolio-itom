import { useEffect, useMemo } from 'react';
import { useTexture } from '@react-three/drei';

export const STORY_WALL_ATLAS = '/assets/corridor/wall-story-atlas.png';
const ATLAS_WIDTH = 1672;
const ATLAS_HEIGHT = 941;
const REGIONS = {
    growth: [86, 151, 370, 677],
    motto: [547, 203, 548, 602],
    explore: [1225, 154, 403, 676],
};

// Keep the supplied artwork intact. White paper is made transparent only at
// render time, so the original hand lettering is never regenerated or replaced.
function removePaper(shader) {
    shader.fragmentShader = shader.fragmentShader.replace(
        '#include <map_fragment>',
        `#include <map_fragment>
        #ifdef USE_MAP
            vec3 paperSample = texture2D(map, vMapUv).rgb;
            float paperWhite = min(paperSample.r, min(paperSample.g, paperSample.b));
            diffuseColor.a *= 1.0 - smoothstep(0.66, 0.92, paperWhite);
        #endif`
    );
}

export default function StoryWallDecal({ region, height, position }) {
    const atlas = useTexture(STORY_WALL_ATLAS);
    const [left, top, width, sourceHeight] = REGIONS[region];
    const texture = useMemo(() => {
        const cropped = atlas.clone();
        cropped.repeat.set(width / ATLAS_WIDTH, sourceHeight / ATLAS_HEIGHT);
        cropped.offset.set(left / ATLAS_WIDTH, 1 - (top + sourceHeight) / ATLAS_HEIGHT);
        cropped.needsUpdate = true;
        return cropped;
    }, [atlas, left, top, width, sourceHeight]);
    useEffect(() => () => texture.dispose(), [texture]);

    return (
        <mesh position={position} name={`story-wall-${region}`}>
            <planeGeometry args={[height * width / sourceHeight, height]} />
            <meshBasicMaterial
                map={texture}
                transparent
                alphaTest={0.015}
                depthWrite={false}
                toneMapped={false}
                onBeforeCompile={removePaper}
                customProgramCacheKey={() => 'story-wall-paper-mask-v1'}
            />
        </mesh>
    );
}
