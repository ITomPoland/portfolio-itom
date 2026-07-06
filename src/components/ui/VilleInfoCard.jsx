import { useScene } from '../../context/SceneContext';

/**
 * VilleInfoCard — guided-tour building card. When the tour brings the visitor near a
 * building (proximity + hysteresis computed by MiniVille → villeInfoCard), shows a compact
 * top-centre card telling what the building is about. Non-blocking: never grabs the camera
 * or the controls, closes itself when walking away, ✕ closes it manually. Top-centre keeps
 * it clear of the bottom widgets (nav/theme toggles, door prompt, consent banner).
 * Minimal glass style — restyle belongs to Claude Design.
 */
export default function VilleInfoCard() {
    const { villeInfoCard, setVilleInfoCard, isTeleporting, isInRoom } = useScene();
    if (!villeInfoCard?.info || isTeleporting || isInRoom) return null;

    const { title, body } = villeInfoCard.info;

    return (
        <div style={wrapStyle}>
            <div style={cardStyle} role="status" aria-live="polite">
                <div style={headRowStyle}>
                    <h3 style={titleStyle}>{title}</h3>
                    <button
                        type="button"
                        onClick={() => setVilleInfoCard(null)}
                        style={closeStyle}
                        aria-label="Fermer la carte d'information"
                    >
                        ✕
                    </button>
                </div>
                <p style={bodyStyle}>{body}</p>
            </div>
        </div>
    );
}

const wrapStyle = {
    position: 'fixed',
    left: '50%',
    top: 'max(0.9rem, env(safe-area-inset-top))',
    transform: 'translateX(-50%)',
    zIndex: 59, // under the door prompt / toggles (60-61): those stay usable if ever adjacent
    width: 'min(92vw, 400px)',
    pointerEvents: 'none',
};

const cardStyle = {
    pointerEvents: 'auto',
    padding: '0.85rem 0.9rem 0.9rem 1.1rem',
    borderRadius: '14px',
    border: '1px solid rgba(159, 224, 187, 0.4)',
    background: 'rgba(18, 16, 20, 0.78)',
    backdropFilter: 'blur(8px)',
    WebkitBackdropFilter: 'blur(8px)',
    color: '#F7F4EE',
};

const headRowStyle = {
    display: 'flex',
    alignItems: 'flex-start',
    justifyContent: 'space-between',
    gap: '0.5rem',
};

const titleStyle = {
    margin: '0.15rem 0 0',
    font: '700 1.02rem/1.25 Sora, system-ui, sans-serif',
    letterSpacing: '0.01em',
};

const closeStyle = {
    flex: 'none',
    width: '44px',
    height: '44px',
    margin: '-0.55rem -0.55rem 0 0', // 44px tap target without inflating the card visually
    border: 'none',
    borderRadius: '12px',
    background: 'transparent',
    color: 'rgba(247, 244, 238, 0.75)',
    font: '400 1.05rem/1 system-ui, sans-serif',
    cursor: 'pointer',
};

const bodyStyle = {
    margin: '0.45rem 0 0',
    font: '400 0.86rem/1.45 "IBM Plex Sans", system-ui, sans-serif',
    color: 'rgba(247, 244, 238, 0.92)',
};
