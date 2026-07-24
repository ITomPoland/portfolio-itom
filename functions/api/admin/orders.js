import { jsonResponse, methodNotAllowed, requireAdmin } from '../../_lib/http.js';

const ADMIN_HEADERS = { 'Cache-Control': 'no-store' };

export async function onRequest(context) {
    const authFail = requireAdmin(context.request, context.env);
    if (authFail) return authFail;

    if (context.request.method !== 'GET') {
        return methodNotAllowed();
    }

    try {
        const { results } = await context.env.PRODUCTS_DB.prepare(`
            SELECT
                id,
                stripe_session_id AS stripeSessionId,
                product_id AS productId,
                quantity,
                amount_cents AS amountCents,
                currency,
                created_at AS createdAt
            FROM orders
            ORDER BY created_at DESC
            LIMIT 200
        `).all();

        return jsonResponse({ orders: results }, 200, ADMIN_HEADERS);
    } catch {
        return jsonResponse({ error: 'Impossible de charger les commandes.' }, 500, ADMIN_HEADERS);
    }
}
