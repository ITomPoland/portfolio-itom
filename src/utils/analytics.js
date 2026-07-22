// -----------------------------------------------------------------------------
// Analytics (PostHog) — RGPD/CNIL consent gate.
// Owns init + opt-in/opt-out so the rest of the app never touches posthog config.
// Rule: NO capture and NO analytics cookies before the user explicitly consents.
// -----------------------------------------------------------------------------
import posthog from 'posthog-js';

const KEY = import.meta.env.VITE_POSTHOG_KEY;
const HOST = import.meta.env.VITE_POSTHOG_HOST;

/**
 * LocalStorage key for persisting RGPD analytics consent state ('granted'|'denied').
 * @type {string}
 */
export const CONSENT_STORAGE_KEY = 'hakkilo_analytics_consent';

let initialized = false;

/**
 * Checks if PostHog analytics key is configured.
 * @returns {boolean} True if analytics environment key is present.
 */
export const analyticsEnabled = () => Boolean(KEY);

/**
 * Retrieves stored analytics consent value from localStorage.
 * @returns {'granted' | 'denied' | null} Stored consent or null if not answered.
 */
export function getConsent() {
  try {
    return localStorage.getItem(CONSENT_STORAGE_KEY);
  } catch {
    return null;
  }
}

/**
 * Initializes PostHog analytics opted-OUT by default (RGPD compliant).
 * Safe to call multiple times. Event capture and cookie creation only begin if
 * stored consent is already 'granted' or when grantConsent() is invoked.
 */
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

/**
 * Grants RGPD analytics consent, persists choice to localStorage, and enables PostHog capturing.
 */
export function grantConsent() {
  try {
    localStorage.setItem(CONSENT_STORAGE_KEY, 'granted');
  } catch {
    /* storage unavailable — session-only consent */
  }
  if (initialized) posthog.opt_in_capturing();
}

/**
 * Denies RGPD analytics consent, persists choice to localStorage, and disables PostHog capturing.
 */
export function denyConsent() {
  try {
    localStorage.setItem(CONSENT_STORAGE_KEY, 'denied');
  } catch {
    /* storage unavailable */
  }
  if (initialized) posthog.opt_out_capturing();
}
