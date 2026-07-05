import { useScene } from '../../context/SceneContext';

/**
 * VilleNavToggle — DOM control to switch the city navigation between the guided scroll tour
 * (default) and free walk. Mobile-first: large touch target, bottom-centre, one-line hint,
 * safe-area aware. Reads/writes villeNavMode on SceneContext.
 */
export default function VilleNavToggle() {
    const { villeNavMode, toggleVilleNavMode } = useScene();
    const guided = villeNavMode === 'guide';

    return (
        <div style={wrapStyle}>
            <button
                type="button"
                onClick={toggleVilleNavMode}
                style={btnStyle}
                aria-label={guided ? 'Passer en balade libre' : 'Passer en visite guidée'}
            >
                {guided ? '🚶 Balade libre' : '🛤 Visite guidée'}
            </button>
            <p style={hintStyle}>
                {guided
                    ? 'Molette ou glisser vers le haut : avancer · glisser : regarder'
                    : 'ZQSD / joystick : marcher · glisser : regarder'}
            </p>
        </div>
    );
}

const wrapStyle = {
    position: 'fixed',
    left: '50%',
    bottom: 'max(1rem, env(safe-area-inset-bottom))',
    transform: 'translateX(-50%)',
    zIndex: 60,
    display: 'flex',
    flexDirection: 'column',
    alignItems: 'center',
    gap: '0.4rem',
    pointerEvents: 'none',
};

const btnStyle = {
    pointerEvents: 'auto',
    minHeight: '44px',
    padding: '0.6rem 1.2rem',
    borderRadius: '999px',
    border: '1px solid rgba(255, 255, 255, 0.25)',
    background: 'rgba(18, 16, 20, 0.62)',
    backdropFilter: 'blur(8px)',
    WebkitBackdropFilter: 'blur(8px)',
    color: '#F7F4EE',
    font: '600 0.95rem/1 Sora, system-ui, sans-serif',
    letterSpacing: '0.01em',
    cursor: 'pointer',
};

const hintStyle = {
    pointerEvents: 'none',
    margin: 0,
    padding: '0.2rem 0.6rem',
    borderRadius: '8px',
    maxWidth: '86vw',
    background: 'rgba(18, 16, 20, 0.45)',
    color: 'rgba(247, 244, 238, 0.85)',
    font: '400 0.72rem/1.2 "IBM Plex Sans", system-ui, sans-serif',
    textAlign: 'center',
};
