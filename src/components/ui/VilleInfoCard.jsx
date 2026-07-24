import { useScene } from '../../context/SceneContext';
import '../../styles/VilleInfoCard.scss';

/**
 * VilleInfoCard — building info popover (Miora Brief 3, night-glass register).
 *
 * INFORMATIVE only: title + body + close. Entry is via the 3D door, not a CTA.
 * Non-blocking (pointer-events only on the card). ✕ target ≥ 44 px.
 * Data contract unchanged: villeInfoCard.info = { title, body }.
 */
export default function VilleInfoCard() {
    const { villeInfoCard, setVilleInfoCard, isTeleporting, isInRoom } = useScene();
    if (!villeInfoCard?.info || isTeleporting || isInRoom) return null;

    const { title, body } = villeInfoCard.info;

    return (
        <div className="ville-info-card-wrap">
            <div className="ville-info-card" role="status" aria-live="polite">
                <div className="ville-info-card__accent" aria-hidden="true" />
                <div className="ville-info-card__head">
                    <h3 className="ville-info-card__title">{title}</h3>
                    <button
                        type="button"
                        className="ville-info-card__close"
                        onClick={() => setVilleInfoCard(null)}
                        aria-label="Fermer la carte d'information"
                    >
                        <svg viewBox="0 0 24 24" width="18" height="18" aria-hidden="true">
                            <path
                                d="M18 6L6 18M6 6l12 12"
                                fill="none"
                                stroke="currentColor"
                                strokeWidth="2"
                                strokeLinecap="round"
                            />
                        </svg>
                    </button>
                </div>
                <p className="ville-info-card__body">{body}</p>
            </div>
        </div>
    );
}
