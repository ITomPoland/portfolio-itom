// -----------------------------------------------------------------------------
// Analytics (PostHog) — RGPD/CNIL consent gate.
// Owns init + opt-in/opt-out so the rest of the app never touches posthog config.
// Rule: NO capture and NO analytics cookies before the user explicitly consents.
// -----------------------------------------------------------------------------
import posthog from 'posthog-js';

const KEY = import.meta.env.VITE_POSTHOG_KEY;
const HOST = import.meta.env.VITE_POSTHOG_HOST;

export const CONSENT_STORAGE_KEY = 'hakkilo_analytics_consent';

let initialized = false;

// Analytics only exists when a key is configured (dev/local runs stay clean).
export const analyticsEnabled = () => Boolean(KEY);

export function getConsent() {
  try {
    return localStorage.getItem(CONSENT_STORAGE_KEY);
  } catch {
    return null;
  }
}

// Init PostHog opted-OUT by default: nothing is captured and no analytics cookie
// is set until grantConsent() runs. Safe to call multiple times.
export function initAnalytics() {
  if (initialized || !KEY) return;
  posthog.init(KEY, {
    api_host: HOST,
    person_profiles: 'identified_only',
    opt_out_capturing_by_default: true, // RGPD: no tracking before consent
    disable_session_recording: true,
  });
  initialized = true;
  // Honour a consent already granted on a previous visit.
  if (getConsent() === 'granted') posthog.opt_in_capturing();
}

export function grantConsent() {
  try {
    localStorage.setItem(CONSENT_STORAGE_KEY, 'granted');
  } catch {
    /* storage unavailable — session-only consent */
  }
  if (initialized) posthog.opt_in_capturing();
}

export function denyConsent() {
  try {
    localStorage.setItem(CONSENT_STORAGE_KEY, 'denied');
  } catch {
    /* storage unavailable */
  }
  if (initialized) posthog.opt_out_capturing();
}
