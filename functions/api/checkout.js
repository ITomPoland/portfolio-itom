import { jsonResponse, methodNotAllowed } from '../_lib/http.js';

const HEADERS = { 'Cache-Control': 'no-store' };

export async function onRequest(context) {
    if (context.request.method !== 'POST') {
        return methodNotAllowed();
    }

    const stripeKey = context.env.STRIPE_SECRET_KEY;
    if (!stripeKey) {
        return jsonResponse({ error: 'Paiement indisponible.' }, 503, HEADERS);
    }

    let body;
    try {
        body = await context.request.json();
    } catch {
        return jsonResponse({ error: 'Corps JSON invalide.' }, 400, HEADERS);
    }

    const productId = typeof body.productId === 'string' ? body.productId.trim() : '';
    const quantity = Number(body.quantity ?? 1);
    if (!productId || !Number.isInteger(quantity) || quantity < 1 || quantity > 99) {
        return jsonResponse({ error: 'Requête invalide.' }, 400, HEADERS);
    }

    try {
        const product = await context.env.PRODUCTS_DB.prepare(`
            SELECT id, title, stock, price_cents AS priceCents, active
            FROM products WHERE id = ? AND active = 1
        `).bind(productId).first();

        if (!product || product.priceCents == null || product.priceCents < 0) {
            return jsonResponse({ error: 'Produit indisponible.' }, 400, HEADERS);
        }
        if (product.stock < quantity) {
            return jsonResponse({ error: 'Stock insuffisant.' }, 400, HEADERS);
        }

        const origin = new URL(context.request.url).origin;
        const params = new URLSearchParams();
        params.set('mode', 'payment');
        params.set('success_url', `${origin}/checkout/success?session_id={CHECKOUT_SESSION_ID}`);
        params.set('cancel_url', `${origin}/checkout/cancel`);
        params.set('client_reference_id', productId);
        params.set('line_items[0][price_data][currency]', 'eur');
        params.set('line_items[0][price_data][unit_amount]', String(product.priceCents));
        params.set('line_items[0][price_data][product_data][name]', product.title);
        params.set('line_items[0][quantity]', String(quantity));
        params.set('metadata[product_id]', productId);
        params.set('metadata[quantity]', String(quantity));

        const stripeRes = await fetch('https://api.stripe.com/v1/checkout/sessions', {
            method: 'POST',
            headers: {
                Authorization: `Bearer ${stripeKey}`,
                'Content-Type': 'application/x-www-form-urlencoded',
            },
            body: params.toString(),
        });

        const session = await stripeRes.json();
        if (!stripeRes.ok || typeof session.url !== 'string') {
            return jsonResponse({ error: 'Impossible de créer la session de paiement.' }, 502, HEADERS);
        }

        return jsonResponse({ url: session.url }, 200, HEADERS);
    } catch {
        return jsonResponse({ error: 'Impossible de démarrer le paiement.' }, 500, HEADERS);
    }
}
