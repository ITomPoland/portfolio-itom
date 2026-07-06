import { useState } from 'react';
import { getConsent, grantConsent, denyConsent, analyticsEnabled } from '../../utils/analytics';
import '../../styles/ConsentBanner.scss';

// Minimal, neutral RGPD/CNIL consent gate for PostHog analytics.
// Visual is intentionally plain — Claude Design owns the final look (constitution §5);
// the behaviour (no tracking before consent) is the contract that must survive a restyle.
export default function ConsentBanner() {
  // Only prompt when analytics is configured and no choice is stored yet.
  // Lazy init (client-only app) — no effect needed to read env/localStorage.
  const [visible, setVisible] = useState(() => analyticsEnabled() && !getConsent());

  if (!visible) return null;

  const accept = () => {
    grantConsent();
    setVisible(false);
  };
  const decline = () => {
    denyConsent();
    setVisible(false);
  };

  return (
    <div
      className="consent-banner"
      role="dialog"
      aria-live="polite"
      aria-label="Consentement à la mesure d'audience"
    >
      <p className="consent-banner__text">
        Ce site utilise un outil de mesure d'audience (PostHog) pour améliorer l'expérience.
        Aucune donnée n'est collectée sans votre accord.
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
