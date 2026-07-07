import { describe, it, expect, afterEach, vi } from 'vitest';
import { safeOpen } from '../safeOpen.js';

describe('safeOpen', () => {
    afterEach(() => {
        vi.restoreAllMocks();
        vi.unstubAllGlobals();
    });

    it('returns null when window is undefined', () => {
        vi.stubGlobal('window', undefined);
        expect(safeOpen('https://example.com')).toBeNull();
    });

    it('returns null and warns when url is not a string or empty', () => {
        const warnSpy = vi.spyOn(console, 'warn').mockImplementation(() => {});
        vi.stubGlobal('window', {
            location: { href: 'https://example.com/site/' }
        });

        expect(safeOpen(null)).toBeNull();
        expect(safeOpen('')).toBeNull();
        expect(safeOpen('   ')).toBeNull();
        expect(warnSpy).toHaveBeenCalledTimes(3);
    });

    it('rejects disallowed protocols like javascript: or data:', () => {
        const warnSpy = vi.spyOn(console, 'warn').mockImplementation(() => {});
        vi.stubGlobal('window', {
            location: { href: 'https://example.com/site/' },
            open: vi.fn()
        });

        expect(safeOpen('javascript:alert(1)')).toBeNull();
        expect(safeOpen('data:text/html,<h1>Hello</h1>')).toBeNull();
        expect(safeOpen('file:///etc/passwd')).toBeNull();
        expect(safeOpen('blob:https://example.com/uuid')).toBeNull();
        expect(warnSpy).toHaveBeenCalledTimes(4);
    });

    it('accepts absolute http and https URLs and opens them', () => {
        const openMock = vi.fn().mockReturnValue({});
        vi.stubGlobal('window', {
            location: { href: 'https://example.com/site/' },
            open: openMock
        });

        safeOpen('https://another-site.com/foo');
        expect(openMock).toHaveBeenCalledWith(
            'https://another-site.com/foo',
            '_blank',
            'noopener,noreferrer'
        );

        safeOpen('http://insecure-site.com');
        expect(openMock).toHaveBeenCalledWith(
            'http://insecure-site.com/',
            '_blank',
            'noopener,noreferrer'
        );
    });

    it('accepts site-relative URLs and resolves them to base location', () => {
        const openMock = vi.fn().mockReturnValue({});
        vi.stubGlobal('window', {
            location: { href: 'https://example.com/site/' },
            open: openMock
        });

        safeOpen('/about');
        expect(openMock).toHaveBeenCalledWith(
            'https://example.com/about',
            '_blank',
            'noopener,noreferrer'
        );

        safeOpen('contact#form');
        expect(openMock).toHaveBeenCalledWith(
            'https://example.com/site/contact#form',
            '_blank',
            'noopener,noreferrer'
        );
    });
});
