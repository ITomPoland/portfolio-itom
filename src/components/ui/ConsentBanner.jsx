import { getConsent, grantConsent, denyConsent, analyticsEnabled } from '../../utils/analytics';
import { useState } from 'react';
import '../../styles/ConsentBanner.scss';

/**
 * ConsentBanner — RGPD/CNIL gate (Miora Brief 1, paper register).
 *
 * CONTRACT: No tracking or cookies before explicit opt-in.
 * Optional `onAccept` / `onDecline` fire after grantConsent / denyConsent
 * (additive — existing callers without props keep working).
 */
export default function ConsentBanner({ onAccept, onDecline } = {}) {
    const [visible, setVisible] = useState(() => analyticsEnabled() && !getConsent());

    if (!visible) return null;

    const accept = () => {
        grantConsent();
        onAccept?.();
        setVisible(false);
    };
    const decline = () => {
        denyConsent();
        onDecline?.();
        setVisible(false);
    };

    return (
        <div
            className="consent-banner"
            role="region"
            aria-live="polite"
            aria-label="Consentement à la mesure d'audience"
        >
            <div className="consent-banner__accent" aria-hidden="true" />
            <p className="consent-banner__text">
                Ce site utilise un outil de mesure d'audience (PostHog) pour améliorer
                l'expérience. Aucune donnée n'est collectée sans votre accord.
                Choix modifiable à tout moment.
            </p>
            <div className="consent-banner__actions">
                <button
                    type="button"
                    className="consent-banner__btn consent-banner__btn--decline"
                    onClick={decline}
                >
                    Refuser
                </button>
                <button
                    type="button"
                    className="consent-banner__btn consent-banner__btn--accept"
                    onClick={accept}
                >
                    Accepter
                </button>
            </div>
        </div>
    );
}
