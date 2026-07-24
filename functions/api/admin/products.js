import {
    jsonResponse,
    methodNotAllowed,
    requireAdmin,
    serializeProduct,
} from '../../_lib/http.js';
import { validateProductPayload } from '../../_lib/productValidation.js';

const ADMIN_HEADERS = { 'Cache-Control': 'no-store' };

export async function onRequest(context) {
    const authFail = requireAdmin(context.request, context.env);
    if (authFail) return authFail;

    if (context.request.method === 'GET') {
        return onRequestGet(context);
    }
    if (context.request.method === 'POST') {
        return onRequestPost(context);
    }
    return methodNotAllowed();
}

async function onRequestGet(context) {
    try {
        const { results } = await context.env.PRODUCTS_DB.prepare(`
            SELECT
                id,
                category,
                scale,
                platform_config AS platformConfig,
                title,
                date,
                description,
                url,
                cta_label AS ctaLabel,
                stock,
                price_cents AS priceCents,
                active,
                created_at AS createdAt,
                updated_at AS updatedAt
            FROM products
            ORDER BY title ASC
        `).all();

        return jsonResponse(
            { products: results.map(serializeProduct) },
            200,
            ADMIN_HEADERS,
        );
    } catch {
        return jsonResponse(
            { error: 'Impossible de charger les produits.' },
            500,
            ADMIN_HEADERS,
        );
    }
}

async function onRequestPost(context) {
    let body;
    try {
        body = await context.request.json();
    } catch {
        return jsonResponse({ error: 'Corps JSON invalide.' }, 400, ADMIN_HEADERS);
    }

    const { ok, value } = validateProductPayload(body);
    if (!ok) {
        return jsonResponse({ error: 'Données produit invalides.' }, 400, ADMIN_HEADERS);
    }

    try {
        await context.env.PRODUCTS_DB.prepare(`
            INSERT INTO products (
                id, category, scale, platform_config, title, date, description,
                url, cta_label, stock, price_cents, active
            ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
        `).bind(
            value.id,
            value.category,
            value.scale,
            JSON.stringify(value.platformConfig),
            value.title,
            value.date,
            value.description,
            value.url,
            value.ctaLabel,
            value.stock ?? 0,
            value.priceCents ?? null,
            value.active ?? 1,
        ).run();

        return jsonResponse({ ok: true, id: value.id }, 201, ADMIN_HEADERS);
    } catch {
        return jsonResponse({ error: 'Impossible de créer le produit.' }, 409, ADMIN_HEADERS);
    }
}
