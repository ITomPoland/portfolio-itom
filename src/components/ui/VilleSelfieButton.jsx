import { useScene } from '../../context/SceneContext';
import '../../styles/VilleSelfieButton.scss';

/**
 * VilleSelfieButton — drone selfie trigger (Miora Brief 4, night-glass register).
 *
 * CONTRACT: visible only in city walk; disabled while capture runs.
 * Optional `onCapture` fires when starting a capture (additive — default
 * still sets villeSelfie via SceneContext).
 * Placement: elevated bottom-left — clears joystick + look zone.
 */
export default function VilleSelfieButton({ onCapture } = {}) {
    const { villeSelfie, setVilleSelfie, isInRoom, isTeleporting } = useScene();
    if (isInRoom || isTeleporting) return null;

    const busy = Boolean(villeSelfie);

    const handleClick = () => {
        if (busy) return;
        setVilleSelfie(true);
        onCapture?.();
    };

    return (
        <button
            type="button"
            className={`ville-selfie-btn${busy ? ' is-busy' : ''}`}
            onClick={handleClick}
            disabled={busy}
            aria-label="Selfie avec le drone"
            aria-busy={busy}
            title="Selfie avec le drone"
        >
            <span className="ville-selfie-btn__glow" aria-hidden="true" />
            <svg
                className="ville-selfie-btn__icon"
                viewBox="0 0 24 24"
                width="24"
                height="24"
                fill="none"
                stroke="currentColor"
                strokeWidth="1.75"
                strokeLinecap="round"
                strokeLinejoin="round"
                aria-hidden="true"
            >
                <path d="M23 19a2 2 0 0 1-2 2H3a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h4l2-3h6l2 3h4a2 2 0 0 1 2 2z" />
                <circle cx="12" cy="13" r="4" />
            </svg>
        </button>
    );
}
