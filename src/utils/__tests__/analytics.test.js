// @vitest-environment jsdom
import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';

const { posthogMock } = vi.hoisted(() => ({
    posthogMock: {
        init: vi.fn(),
        opt_in_capturing: vi.fn(),
        opt_out_capturing: vi.fn(),
    },
}));

vi.mock('posthog-js', () => ({ default: posthogMock }));

// KEY/HOST and the `initialized` singleton are captured at module load time, so every test
// re-imports the module fresh via vi.resetModules() after (un)setting the env key.
async function loadAnalytics() {
    vi.resetModules();
    return import('../analytics.js');
}

describe('analytics — no key configured', () => {
    beforeEach(() => {
        vi.stubEnv('VITE_POSTHOG_KEY', '');
        posthogMock.init.mockClear();
        posthogMock.opt_in_capturing.mockClear();
        posthogMock.opt_out_capturing.mockClear();
        window.localStorage.clear();
    });
    afterEach(() => {
        vi.unstubAllEnvs();
    });

    it('analyticsEnabled() is false', async () => {
        const { analyticsEnabled } = await loadAnalytics();
        expect(analyticsEnabled()).toBe(false);
    });

    it('initAnalytics() is a total no-op', async () => {
        const { initAnalytics } = await loadAnalytics();
        initAnalytics();
        expect(posthogMock.init).not.toHaveBeenCalled();
    });

    it('grantConsent()/denyConsent() persist but never touch posthog', async () => {
        const { grantConsent, denyConsent, getConsent } = await loadAnalytics();
        grantConsent();
        expect(getConsent()).toBe('granted');
        expect(posthogMock.opt_in_capturing).not.toHaveBeenCalled();

        denyConsent();
        expect(getConsent()).toBe('denied');
        expect(posthogMock.opt_out_capturing).not.toHaveBeenCalled();
    });
});

describe('analytics — key configured', () => {
    beforeEach(() => {
        vi.stubEnv('VITE_POSTHOG_KEY', 'phc_test_key');
        vi.stubEnv('VITE_POSTHOG_HOST', 'https://eu.posthog.test');
        posthogMock.init.mockClear();
        posthogMock.opt_in_capturing.mockClear();
        posthogMock.opt_out_capturing.mockClear();
        window.localStorage.clear();
    });
    afterEach(() => {
        vi.unstubAllEnvs();
    });

    it('initAnalytics() opts out by default and disables session recording, without opting in before consent', async () => {
        const { initAnalytics } = await loadAnalytics();
        initAnalytics();
        expect(posthogMock.init).toHaveBeenCalledTimes(1);
        expect(posthogMock.init).toHaveBeenCalledWith(
            'phc_test_key',
            expect.objectContaining({
                opt_out_capturing_by_default: true,
                disable_session_recording: true,
            })
        );
        expect(posthogMock.opt_in_capturing).not.toHaveBeenCalled();
    });

    it('initAnalytics() is idempotent — a second call does not re-init', async () => {
        const { initAnalytics } = await loadAnalytics();
        initAnalytics();
        initAnalytics();
        expect(posthogMock.init).toHaveBeenCalledTimes(1);
    });

    it('grantConsent() persists and opts in once initialized', async () => {
        const { initAnalytics, grantConsent, getConsent } = await loadAnalytics();
        initAnalytics();
        grantConsent();
        expect(getConsent()).toBe('granted');
        expect(posthogMock.opt_in_capturing).toHaveBeenCalledTimes(1);
        expect(posthogMock.opt_out_capturing).not.toHaveBeenCalled();
    });

    it('denyConsent() persists and opts out once initialized', async () => {
        const { initAnalytics, denyConsent, getConsent } = await loadAnalytics();
        initAnalytics();
        denyConsent();
        expect(getConsent()).toBe('denied');
        expect(posthogMock.opt_out_capturing).toHaveBeenCalledTimes(1);
        expect(posthogMock.opt_in_capturing).not.toHaveBeenCalled();
    });

    it('a consent already stored before init is honoured at init time', async () => {
        const { grantConsent } = await loadAnalytics();
        grantConsent(); // stores 'granted' in localStorage, but not yet initialized so no opt_in call

        const { initAnalytics } = await loadAnalytics(); // fresh module load, re-reads storage
        posthogMock.opt_in_capturing.mockClear();
        initAnalytics();
        expect(posthogMock.opt_in_capturing).toHaveBeenCalledTimes(1);
    });

    it('never crashes when storage is unavailable', async () => {
        const brokenStorage = {
            getItem: () => { throw new Error('blocked'); },
            setItem: () => { throw new Error('blocked'); },
        };
        vi.stubGlobal('localStorage', brokenStorage);

        const { initAnalytics, grantConsent, denyConsent, getConsent } = await loadAnalytics();
        expect(() => initAnalytics()).not.toThrow();
        expect(() => grantConsent()).not.toThrow();
        expect(() => denyConsent()).not.toThrow();
        expect(getConsent()).toBeNull();

        vi.unstubAllGlobals();
    });
});
