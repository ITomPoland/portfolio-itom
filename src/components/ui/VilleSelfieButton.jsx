import { useScene } from '../../context/SceneContext';

/**
 * VilleSelfieButton — DOM trigger for the drone selfie (prototype port). Visible only
 * while walking the city (hidden inside rooms / during teleport), disabled while the
 * sequence runs; VilleLife owns the choreography + capture and clears villeSelfie when
 * done. Bottom-left mirror of the bottom-right VilleThemeToggle, mobile-first.
 * Minimal glass style — restyle belongs to Claude Design.
 */
export default function VilleSelfieButton() {
    const { villeSelfie, setVilleSelfie, isInRoom, isTeleporting } = useScene();
    if (isInRoom || isTeleporting) return null;

    return (
        <button
            type="button"
            onClick={() => { if (!villeSelfie) setVilleSelfie(true); }}
            disabled={villeSelfie}
            style={{ ...btnStyle, opacity: villeSelfie ? 0.45 : 1 }}
            aria-label="Selfie avec le drone"
            title="Selfie avec le drone"
        >
            📸
        </button>
    );
}

const btnStyle = {
    position: 'fixed',
    left: 'max(1rem, env(safe-area-inset-left))',
    // same raised row as VilleThemeToggle (bottom-right) — clears the bottom-centre nav block
    bottom: 'calc(max(1rem, env(safe-area-inset-bottom)) + 5.5rem)',
    zIndex: 60,
    minWidth: '48px',
    minHeight: '48px',
    padding: '0.5rem',
    borderRadius: '999px',
    border: '1px solid rgba(255, 255, 255, 0.25)',
    background: 'rgba(18, 16, 20, 0.62)',
    backdropFilter: 'blur(8px)',
    WebkitBackdropFilter: 'blur(8px)',
    fontSize: '1.25rem',
    lineHeight: 1,
    cursor: 'pointer',
};
