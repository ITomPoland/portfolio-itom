import { describe, it, expect, afterEach, vi } from 'vitest';
import { isTouchDevice } from '../deviceDetect.js';

describe('isTouchDevice', () => {
    afterEach(() => {
        vi.unstubAllGlobals();
    });

    it('returns false when window is undefined', () => {
        vi.stubGlobal('window', undefined);
        expect(isTouchDevice()).toBe(false);
    });

    it('returns true when matchMedia reports a touch-capable pointer', () => {
        vi.stubGlobal('window', {
            matchMedia: (query) => ({
                matches: query === '(hover: none) and (pointer: coarse)',
            }),
        });
        expect(isTouchDevice()).toBe(true);
    });

    it('returns false when matchMedia reports a fine pointer', () => {
        vi.stubGlobal('window', {
            matchMedia: () => ({ matches: false }),
        });
        expect(isTouchDevice()).toBe(false);
    });
});
