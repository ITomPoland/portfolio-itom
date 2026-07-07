/**
 * Hardened replacement for window.open on every external link of the site.
 *
 * Two threats covered (security backlog P3):
 * - reverse tabnabbing: the opened page could rewrite `window.opener.location`,
 *   so every open goes out with 'noopener,noreferrer';
 * - URL scheme injection: link URLs live in data files today and may come from
 *   a CMS tomorrow, so only http(s) destinations are ever opened
 *   (javascript:, data:, blob:, file:, ... are dropped).
 */

const ALLOWED_PROTOCOLS = ['http:', 'https:'];

/**
 * Opens `url` in a new tab if it is an absolute http(s) URL or a site-relative
 * path; otherwise logs a warning and does nothing.
 *
 * @param {string} url absolute http(s) URL, or path/hash relative to the site
 * @returns {Window|null} always null in practice: 'noopener' makes
 *   window.open return null, as does any rejected URL
 */
export function safeOpen(url) {
    // Click handlers only run in a browser, but stay inert anywhere else.
    if (typeof window === 'undefined') return null;

    if (typeof url !== 'string' || url.trim() === '') {
        console.warn('[safeOpen] rejected empty or non-string URL:', url);
        return null;
    }

    let parsed;
    try {
        // The base URL lets site-relative inputs ('#contact', '/page') resolve
        // to the current origin while leaving absolute URLs untouched. URL
        // parsing also neutralizes scheme-smuggling tricks (embedded newlines,
        // control characters) that homemade regexes routinely miss.
        parsed = new URL(url, window.location.href);
    } catch {
        console.warn('[safeOpen] rejected unparsable URL:', url);
        return null;
    }

    if (!ALLOWED_PROTOCOLS.includes(parsed.protocol)) {
        console.warn('[safeOpen] rejected URL with disallowed scheme:', url);
        return null;
    }

    return window.open(parsed.href, '_blank', 'noopener,noreferrer');
}
