import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import {
    loadProducts,
    __resetCatalogueCacheForTests,
    getLastCatalogueSource,
    formatPriceEuros,
    stockBadgeLabel,
} from '../catalogue.js';
import { PRODUCTS } from '../../components/canvas/rooms/Studio/productData.js';

describe('catalogue.loadProducts', () => {
    beforeEach(() => {
        __resetCatalogueCacheForTests();
        vi.stubGlobal('fetch', vi.fn());
    });

    afterEach(() => {
        vi.unstubAllGlobals();
    });

    it('falls back to static products on HTTP 500', async () => {
        fetch.mockResolvedValue({ ok: false, status: 500 });
        const list = await loadProducts();
        expect(list).toEqual(PRODUCTS);
        expect(getLastCatalogueSource()).toBe('static');
    });

    it('falls back on fetch timeout/abort', async () => {
        fetch.mockRejectedValue(new DOMException('Aborted', 'AbortError'));
        const list = await loadProducts();
        expect(list.length).toBe(PRODUCTS.length);
        expect(getLastCatalogueSource()).toBe('static');
    });

    it('uses API payload when valid', async () => {
        const apiProduct = {
            ...PRODUCTS[0],
            stock: 5,
            priceCents: 129000,
        };
        fetch.mockResolvedValue({
            ok: true,
            json: async () => ({ products: [apiProduct] }),
        });
        const list = await loadProducts();
        expect(list[0].stock).toBe(5);
        expect(getLastCatalogueSource()).toBe('api');
    });
});

describe('catalogue helpers', () => {
    it('formatPriceEuros', () => {
        expect(formatPriceEuros(129000)).toMatch(/1[\s\u202f]?290/);
    });

    it('stockBadgeLabel', () => {
        expect(stockBadgeLabel(0)).toBe('Rupture');
        expect(stockBadgeLabel(2)).toBe('Stock limité');
        expect(stockBadgeLabel(10)).toBe('En stock');
    });
});
