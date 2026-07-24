import { jsonResponse, methodNotAllowed } from '../_lib/http.js';

const HEADERS = { 'Cache-Control': 'no-store' };

async function verifyStripeSignature(payload, sigHeader, secret) {
    if (!sigHeader || !secret) return false;

    const parts = sigHeader.split(',').reduce((acc, piece) => {
        const [k, v] = piece.split('=');
        if (k && v) acc[k.trim()] = v.trim();
        return acc;
    }, {});

    const timestamp = parts.t;
    const v1 = parts.v1;
    if (!timestamp || !v1) return false;

    const signedPayload = `${timestamp}.${payload}`;
    const key = await crypto.subtle.importKey(
        'raw',
        new TextEncoder().encode(secret),
        { name: 'HMAC', hash: 'SHA-256' },
        false,
        ['sign'],
    );
    const mac = await crypto.subtle.sign('HMAC', key, new TextEncoder().encode(signedPayload));
    const expected = [...new Uint8Array(mac)].map((b) => b.toString(16).padStart(2, '0')).join('');

    if (expected.length !== v1.length) return false;
    let diff = 0;
    for (let i = 0; i < expected.length; i += 1) {
        diff |= expected.charCodeAt(i) ^ v1.charCodeAt(i);
    }
    return diff === 0;
}

export async function onRequest(context) {
    if (context.request.method !== 'POST') {
        return methodNotAllowed();
    }

    const webhookSecret = context.env.STRIPE_WEBHOOK_SECRET;
    if (!webhookSecret) {
        return jsonResponse({ error: 'Webhook indisponible.' }, 503, HEADERS);
    }

    const payload = await context.request.text();
    const sig = context.request.headers.get('stripe-signature');
    const valid = await verifyStripeSignature(payload, sig, webhookSecret);
    if (!valid) {
        return jsonResponse({ error: 'Signature invalide.' }, 400, HEADERS);
    }

    let event;
    try {
        event = JSON.parse(payload);
    } catch {
        return jsonResponse({ error: 'Payload invalide.' }, 400, HEADERS);
    }

    if (event.type !== 'checkout.session.completed') {
        return jsonResponse({ received: true }, 200, HEADERS);
    }

    const session = event.data?.object;
    const productId = session?.metadata?.product_id;
    const quantity = Number(session?.metadata?.quantity ?? 1);
    const sessionId = session?.id;
    const amountCents = Number(session?.amount_total ?? 0);

    if (!productId || !sessionId || !Number.isInteger(quantity) || quantity < 1) {
        return jsonResponse({ error: 'Session incomplète.' }, 400, HEADERS);
    }

    try {
        await context.env.PRODUCTS_DB.prepare(`
            INSERT INTO orders (stripe_session_id, product_id, quantity, amount_cents, currency)
            VALUES (?, ?, ?, ?, 'eur')
        `).bind(sessionId, productId, quantity, amountCents).run();
    } catch {
        // Idempotent replay if session already recorded
    }

    try {
        await context.env.PRODUCTS_DB.prepare(`
            UPDATE products
            SET stock = stock - ?, updated_at = CURRENT_TIMESTAMP
            WHERE id = ? AND stock >= ?
        `).bind(quantity, productId, quantity).run();
    } catch {
        return jsonResponse({ error: 'Échec mise à jour stock.' }, 500, HEADERS);
    }

    return jsonResponse({ received: true }, 200, HEADERS);
}
