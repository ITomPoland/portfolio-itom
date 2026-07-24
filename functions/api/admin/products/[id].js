import {
    jsonResponse,
    methodNotAllowed,
    requireAdmin,
    serializeProduct,
} from '../../../_lib/http.js';
import { validateProductPayload } from '../../../_lib/productValidation.js';

const ADMIN_HEADERS = { 'Cache-Control': 'no-store' };

export async function onRequest(context) {
    const authFail = requireAdmin(context.request, context.env);
    if (authFail) return authFail;

    const { id } = context.params;

    if (context.request.method === 'PUT') {
        return onRequestPut(context, id);
    }
    if (context.request.method === 'DELETE') {
        return onRequestDelete(context, id);
    }
    return methodNotAllowed();
}

async function onRequestPut(context, id) {
    let body;
    try {
        body = await context.request.json();
    } catch {
        return jsonResponse({ error: 'Corps JSON invalide.' }, 400, ADMIN_HEADERS);
    }

    const { ok, value } = validateProductPayload({ ...body, id }, { partial: true });
    if (!ok) {
        return jsonResponse({ error: 'Données produit invalides.' }, 400, ADMIN_HEADERS);
    }

    const fields = [];
    const binds = [];

    const map = [
        ['category', value.category],
        ['scale', value.scale],
        ['platform_config', value.platformConfig ? JSON.stringify(value.platformConfig) : undefined],
        ['title', value.title],
        ['date', value.date],
        ['description', value.description],
        ['url', value.url],
        ['cta_label', value.ctaLabel],
        ['stock', value.stock],
        ['price_cents', value.priceCents],
        ['active', value.active],
    ];

    for (const [col, val] of map) {
        if (val !== undefined) {
            fields.push(`${col} = ?`);
            binds.push(val);
        }
    }

    if (fields.length === 0) {
        return jsonResponse({ error: 'Aucune modification.' }, 400, ADMIN_HEADERS);
    }

    fields.push('updated_at = CURRENT_TIMESTAMP');
    binds.push(id);

    try {
        const result = await context.env.PRODUCTS_DB.prepare(`
            UPDATE products SET ${fields.join(', ')} WHERE id = ?
        `).bind(...binds).run();

        if (result.meta.changes === 0) {
            return jsonResponse({ error: 'Produit introuvable.' }, 404, ADMIN_HEADERS);
        }

        const product = await context.env.PRODUCTS_DB.prepare(`
            SELECT
                id, category, scale, platform_config AS platformConfig, title, date,
                description, url, cta_label AS ctaLabel, stock, price_cents AS priceCents,
                active, created_at AS createdAt, updated_at AS updatedAt
            FROM products WHERE id = ?
        `).bind(id).first();

        return jsonResponse({ product: serializeProduct(product) }, 200, ADMIN_HEADERS);
    } catch {
        return jsonResponse({ error: 'Impossible de mettre à jour le produit.' }, 500, ADMIN_HEADERS);
    }
}

async function onRequestDelete(context, id) {
    try {
        const result = await context.env.PRODUCTS_DB.prepare(`
            UPDATE products SET active = 0, updated_at = CURRENT_TIMESTAMP WHERE id = ?
        `).bind(id).run();

        if (result.meta.changes === 0) {
            return jsonResponse({ error: 'Produit introuvable.' }, 404, ADMIN_HEADERS);
        }

        return jsonResponse({ ok: true }, 200, ADMIN_HEADERS);
    } catch {
        return jsonResponse({ error: 'Impossible de désactiver le produit.' }, 500, ADMIN_HEADERS);
    }
}
