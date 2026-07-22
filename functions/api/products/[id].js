const JSON_HEADERS = {
    'Cache-Control': 'public, max-age=60',
    'Content-Type': 'application/json; charset=utf-8',
    'X-Content-Type-Options': 'nosniff',
};

function jsonResponse(body, status = 200, headers = JSON_HEADERS) {
    return new Response(JSON.stringify(body), { status, headers });
}

function serializeProduct(product) {
    return {
        ...product,
        platformConfig: JSON.parse(product.platformConfig),
        active: Boolean(product.active),
    };
}

export async function onRequestGet(context) {
    try {
        const statement = context.env.PRODUCTS_DB.prepare(`
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
            WHERE id = ? AND active = ?
        `).bind(context.params.id, 1);
        const product = await statement.first();

        if (!product) {
            return jsonResponse(
                { error: 'Produit introuvable.' },
                404,
                { ...JSON_HEADERS, 'Cache-Control': 'no-store' },
            );
        }

        return jsonResponse({ products: [serializeProduct(product)] });
    } catch {
        return jsonResponse(
            { error: 'Impossible de charger le produit.' },
            500,
            { ...JSON_HEADERS, 'Cache-Control': 'no-store' },
        );
    }
}
