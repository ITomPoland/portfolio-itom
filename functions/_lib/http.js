const JSON_HEADERS = {
    'Content-Type': 'application/json; charset=utf-8',
    'X-Content-Type-Options': 'nosniff',
};

export function jsonResponse(body, status = 200, extraHeaders = {}) {
    return new Response(JSON.stringify(body), {
        status,
        headers: { ...JSON_HEADERS, ...extraHeaders },
    });
}

export function unauthorized() {
    return jsonResponse({ error: 'Non autorisé.' }, 401, { 'Cache-Control': 'no-store' });
}

export function methodNotAllowed() {
    return jsonResponse({ error: 'Méthode non autorisée.' }, 405, { 'Cache-Control': 'no-store' });
}

/** Constant-time string compare (UTF-8 byte length must match for timing safety). */
export function safeEqualToken(provided, expected) {
    if (typeof provided !== 'string' || typeof expected !== 'string') {
        return false;
    }
    const enc = new TextEncoder();
    const a = enc.encode(provided);
    const b = enc.encode(expected);
    if (a.byteLength !== b.byteLength) {
        return false;
    }
    let diff = 0;
    for (let i = 0; i < a.byteLength; i += 1) {
        diff |= a[i] ^ b[i];
    }
    return diff === 0;
}

export function getBearerToken(request) {
    const header = request.headers.get('Authorization') || '';
    const match = header.match(/^Bearer\s+(.+)$/i);
    return match ? match[1].trim() : '';
}

export function requireAdmin(request, env) {
    const token = getBearerToken(request);
    const secret = env.ADMIN_TOKEN;
    if (!secret || !safeEqualToken(token, secret)) {
        return unauthorized();
    }
    return null;
}

export function serializeProduct(product) {
    return {
        ...product,
        platformConfig: typeof product.platformConfig === 'string'
            ? JSON.parse(product.platformConfig)
            : product.platformConfig,
        active: Boolean(product.active),
    };
}
