/**
 * Stripe Checkout hébergé — redirection pleine page (pas de stripe.js sur notre origine).
 */
export async function startCheckout(productId, quantity = 1) {
    if (typeof productId !== 'string' || !productId) {
        throw new Error('Produit invalide.');
    }
    const qty = Number(quantity);
    if (!Number.isInteger(qty) || qty < 1 || qty > 99) {
        throw new Error('Quantité invalide.');
    }

    const res = await fetch('/api/checkout', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'same-origin',
        body: JSON.stringify({ productId, quantity: qty }),
    });

    const data = await res.json().catch(() => ({}));
    if (!res.ok || typeof data.url !== 'string') {
        throw new Error(data.error || 'Impossible de démarrer le paiement.');
    }

    window.location.assign(data.url);
}
