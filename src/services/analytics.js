let analyticsPromise;

export function initAnalytics() {
  const key = import.meta.env.VITE_POSTHOG_KEY?.trim();
  if (!key) return Promise.resolve(null);
  analyticsPromise ??= import('posthog-js').then(({ default: posthog }) => {
    posthog.init(key, {
      api_host: import.meta.env.VITE_POSTHOG_HOST,
      person_profiles: 'identified_only',
    });
    return posthog;
  }).catch(() => null);
  return analyticsPromise;
}

export function captureEvent(name, properties) {
  // Both initialization and capture are optional; neither may block the UI.
  initAnalytics().then(client => client?.capture(name, properties)).catch(() => {});
}
