import { EffectComposer, Bloom } from '@react-three/postprocessing';

/**
 * PostProcessing — mounted once at the Experience.jsx root so it composites the whole
 * canvas (corridor + rooms). @react-three/postprocessing was already a dependency but
 * unused anywhere in the app before this.
 *
 * Only Bloom for this pilot — SSAO needs the composer's normal pass wired up correctly
 * and threw runtime errors in this postprocessing version; not worth the extra
 * debugging time for a pilot's polish pass, so it's dropped rather than fought with.
 *
 * Tier-gated by the caller: Experience.jsx only mounts this component at all when
 * tier !== 'LOW', avoiding the EffectComposer's extra render-target allocation on weak
 * GPUs entirely rather than mounting-with-zero-effects.
 */
const PostProcessing = () => (
    <EffectComposer multisampling={0}>
        {/* Threshold raised high (0.95) because the rest of the app is an almost-white paper
            sketch aesthetic — a lower threshold made bright corridor surfaces bloom/overflow
            at their edges instead of just the emissive accents (product lights, door glow). */}
        <Bloom luminanceThreshold={0.95} luminanceSmoothing={0.2} intensity={0.35} mipmapBlur />
    </EffectComposer>
);

export default PostProcessing;
