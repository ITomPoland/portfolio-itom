const ID_RE = /^[a-z0-9][a-z0-9-]{0,63}$/i;
const MAX = {
    title: 120,
    date: 80,
    description: 2000,
    url: 500,
    ctaLabel: 80,
    category: 40,
    platformLabel: 80,
};

function trimStr(v, max) {
    if (typeof v !== 'string') return null;
    const t = v.trim();
    if (!t || t.length > max) return null;
    return t;
}

export function validateProductPayload(body, { partial = false } = {}) {
    const errors = [];
    const out = {};

    const requireField = (key, ok) => {
        if (!partial || body[key] !== undefined) {
            if (!ok) errors.push(key);
        }
    };

    if (!partial || body.id !== undefined) {
        const id = typeof body.id === 'string' ? body.id.trim() : '';
        if (!ID_RE.test(id)) errors.push('id');
        else out.id = id;
    }

    if (!partial || body.category !== undefined) {
        const category = trimStr(body.category, MAX.category);
        if (!category) errors.push('category');
        else out.category = category;
    }

    if (!partial || body.scale !== undefined) {
        const scale = Number(body.scale);
        if (!Number.isFinite(scale) || scale <= 0 || scale > 100) errors.push('scale');
        else out.scale = scale;
    }

    if (!partial || body.platformConfig !== undefined) {
        const label = trimStr(body.platformConfig?.label, MAX.platformLabel);
        if (!label) errors.push('platformConfig');
        else out.platformConfig = { label };
    }

    if (!partial || body.title !== undefined) {
        const title = trimStr(body.title, MAX.title);
        requireField('title', Boolean(title));
        if (title) out.title = title;
    }

    if (!partial || body.date !== undefined) {
        const date = trimStr(body.date, MAX.date);
        requireField('date', Boolean(date));
        if (date) out.date = date;
    }

    if (!partial || body.description !== undefined) {
        const description = trimStr(body.description, MAX.description);
        requireField('description', Boolean(description));
        if (description) out.description = description;
    }

    if (!partial || body.url !== undefined) {
        const url = trimStr(body.url, MAX.url);
        requireField('url', Boolean(url));
        if (url) out.url = url;
    }

    if (!partial || body.ctaLabel !== undefined) {
        const ctaLabel = trimStr(body.ctaLabel, MAX.ctaLabel);
        requireField('ctaLabel', Boolean(ctaLabel));
        if (ctaLabel) out.ctaLabel = ctaLabel;
    }

    if (body.stock !== undefined) {
        const stock = Number(body.stock);
        if (!Number.isInteger(stock) || stock < 0 || stock > 1_000_000) errors.push('stock');
        else out.stock = stock;
    } else if (!partial) {
        out.stock = 0;
    }

    if (body.priceCents !== undefined && body.priceCents !== null) {
        const priceCents = Number(body.priceCents);
        if (!Number.isInteger(priceCents) || priceCents < 0) errors.push('priceCents');
        else out.priceCents = priceCents;
    }

    if (body.active !== undefined) {
        out.active = body.active ? 1 : 0;
    } else if (!partial) {
        out.active = 1;
    }

    return { ok: errors.length === 0, errors, value: out };
}
