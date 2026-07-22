// Boot-chain tracer (fable/012). The preloader once froze at 90% with zero console
// errors; these logs pinpoint the dead link in the boot chain (preload → Canvas →
// warmup → sceneReady → preloader exit) without re-instrumenting every file.
// Enable by appending ?debugboot to the URL — no-op otherwise, dev and prod alike.
export const DEBUG_BOOT = typeof window !== 'undefined'
    && new URLSearchParams(window.location.search).has('debugboot');

export const bootLog = (...args) => {
    if (DEBUG_BOOT) console.info('[boot]', ...args);
};
