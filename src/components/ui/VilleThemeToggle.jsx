import { useScene } from '../../context/SceneContext';
import { villeIsNightNow } from '../canvas/ville/villeConfig';

/**
 * VilleThemeToggle — DOM control cycling the city theme auto → jour → nuit (prototype
 * `btnTheme`). 'auto' follows the local clock; the forced modes are the demo toggle the
 * ville needed (stars/moon/lamps are otherwise invisible when testing in daytime).
 * Choice persists via SceneContext (localStorage 'hakkilo-ville-theme').
 * Minimal glass style matching VilleNavToggle — restyle belongs to Claude Design.
 */
export default function VilleThemeToggle() {
    const { villeTheme, cycleVilleTheme } = useScene();
    const label = villeTheme === 'auto'
        ? (villeIsNightNow() ? '☾ Auto' : '☀ Auto')
        : villeTheme === 'jour' ? '☀ Jour' : '☾ Nuit';

    return (
        <button
            type="button"
            onClick={cycleVilleTheme}
            style={btnStyle}
            aria-label="Changer le thème de la ville (auto, jour, nuit)"
        >
            {label}
        </button>
    );
}

const btnStyle = {
    position: 'fixed',
    right: 'max(1rem, env(safe-area-inset-right))',
    // raised above the bottom-centre VilleNavToggle + hint so they never overlap on phones
    bottom: 'calc(max(1rem, env(safe-area-inset-bottom)) + 5.5rem)',
    zIndex: 60,
    minHeight: '44px',
    padding: '0.6rem 1rem',
    borderRadius: '999px',
    border: '1px solid rgba(255, 255, 255, 0.25)',
    background: 'rgba(18, 16, 20, 0.62)',
    backdropFilter: 'blur(8px)',
    WebkitBackdropFilter: 'blur(8px)',
    color: '#F7F4EE',
    font: '600 0.9rem/1 Sora, system-ui, sans-serif',
    letterSpacing: '0.01em',
    cursor: 'pointer',
};
