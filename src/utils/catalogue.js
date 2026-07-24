/**
 * Product catalogue loader — same-origin GET /api/products with static fallback.
 * Not gated by analytics consent (no cookies, no third parties).
 */
import { PRODUCTS as STATIC_PRODUCTS } from '../components/canvas/rooms/Studio/productData.js';

const FETCH_TIMEOUT_MS = 2000;

let sessionCache = null;
let sessionPromise = null;
let lastLoadSource = 'static';

export function getLastCatalogueSource() {
    return lastLoadSource;
}

function isOverlayProductShape(p) {
    if (!p || typeof p !== 'object') return false;
    return (
        typeof p.id === 'string' &&
        typeof p.title === 'string' &&
        typeof p.description === 'string' &&
        typeof p.url === 'string' &&
        typeof p.ctaLabel === 'string' &&
        p.platformConfig &&
        typeof p.platformConfig.label === 'string' &&
        typeof p.category === 'string' &&
        typeof p.scale === 'number'
    );
}

function normalizeApiProduct(raw) {
    const platformConfig = raw.platformConfig ?? raw.platform_config;
    const ctaLabel = raw.ctaLabel ?? raw.cta_label;
    const candidate = {
        id: raw.id,
        category: raw.category,
        scale: Number(raw.scale),
        platformConfig: typeof platformConfig === 'string'
            ? (() => { try { return JSON.parse(platformConfig); } catch { return null; } })()
            : platformConfig,
        title: raw.title,
        date: raw.date ?? '',
        description: raw.description,
        url: raw.url,
        ctaLabel,
    };
    if (!isOverlayProductShape(candidate)) {
        return null;
    }
    return {
        ...candidate,
        stock: typeof raw.stock === 'number' ? raw.stock : undefined,
        priceCents: typeof raw.priceCents === 'number' ? raw.priceCents : undefined,
    };
}

/**
 * @returns {Promise<typeof STATIC_PRODUCTS>}
 */
export async function loadProducts({ forceRefresh = false } = {}) {
    if (sessionCache && !forceRefresh) {
        return sessionCache;
    }
    if (sessionPromise && !forceRefresh) {
        return sessionPromise;
    }

    sessionPromise = (async () => {
        const controller = new AbortController();
        const timer = setTimeout(() => controller.abort(), FETCH_TIMEOUT_MS);
        try {
            const res = await fetch('/api/products', {
                signal: controller.signal,
                credentials: 'same-origin',
            });
            if (!res.ok) {
                throw new Error(`HTTP ${res.status}`);
            }
            const data = await res.json();
            const list = Array.isArray(data.products) ? data.products : [];
            const normalized = list.map(normalizeApiProduct).filter(Boolean);
            if (normalized.length === 0) {
                throw new Error('empty catalogue');
            }
            sessionCache = normalized;
            lastLoadSource = 'api';
            return sessionCache;
        } catch {
            sessionCache = STATIC_PRODUCTS;
            lastLoadSource = 'static';
            return sessionCache;
        } finally {
            clearTimeout(timer);
            sessionPromise = null;
        }
    })();

    return sessionPromise;
}

/** @returns {typeof STATIC_PRODUCTS} */
export function getStaticProducts() {
    return STATIC_PRODUCTS;
}

/** Test helper — clears module cache between vitest cases. */
export function __resetCatalogueCacheForTests() {
    sessionCache = null;
    sessionPromise = null;
    lastLoadSource = 'static';
}

export function formatPriceEuros(priceCents) {
    if (typeof priceCents !== 'number' || priceCents < 0) return null;
    return new Intl.NumberFormat('fr-FR', {
        style: 'currency',
        currency: 'EUR',
    }).format(priceCents / 100);
}

export function stockBadgeLabel(stock) {
    if (typeof stock !== 'number') return null;
    if (stock <= 0) return 'Rupture';
    if (stock <= 3) return 'Stock limité';
    return 'En stock';
}
