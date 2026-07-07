import { describe, it, expect } from 'vitest';
import { PRODUCTS } from '../productData.js';

// Shape required by GlobalOverlay.jsx's default (non certificate_grid) layout:
// title, date, description, url, ctaLabel, platformConfig.label.
describe('productData — GlobalOverlay contract', () => {
    it('has at least one product', () => {
        expect(PRODUCTS.length).toBeGreaterThan(0);
    });

    it('every product has the fields GlobalOverlay reads, all non-empty', () => {
        for (const p of PRODUCTS) {
            expect(typeof p.title).toBe('string');
            expect(p.title.length).toBeGreaterThan(0);

            expect(typeof p.date).toBe('string');
            expect(p.date.length).toBeGreaterThan(0);

            expect(typeof p.description).toBe('string');
            expect(p.description.length).toBeGreaterThan(0);

            expect(typeof p.url).toBe('string');
            expect(p.url.length).toBeGreaterThan(0);

            expect(typeof p.ctaLabel).toBe('string');
            expect(p.ctaLabel.length).toBeGreaterThan(0);

            expect(typeof p.platformConfig?.label).toBe('string');
            expect(p.platformConfig.label.length).toBeGreaterThan(0);
        }
    });

    it('every product has a non-empty category and a positive scale for 3D placement', () => {
        for (const p of PRODUCTS) {
            expect(typeof p.category).toBe('string');
            expect(p.category.length).toBeGreaterThan(0);
            expect(typeof p.scale).toBe('number');
            expect(p.scale).toBeGreaterThan(0);
        }
    });

    it('has unique ids', () => {
        const ids = PRODUCTS.map((p) => p.id);
        expect(new Set(ids).size).toBe(ids.length);
        for (const id of ids) {
            expect(typeof id).toBe('string');
            expect(id.length).toBeGreaterThan(0);
        }
    });
});
