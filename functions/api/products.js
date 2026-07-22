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
            WHERE active = ?
            ORDER BY title ASC
        `).bind(1);
        const { results } = await statement.all();

        return jsonResponse({ products: results.map(serializeProduct) });
    } catch {
        return jsonResponse(
            { error: 'Impossible de charger les produits.' },
            500,
            { ...JSON_HEADERS, 'Cache-Control': 'no-store' },
        );
    }
}
