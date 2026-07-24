import { describe, it, expect } from 'vitest';
import { validateProductPayload } from '../../../functions/_lib/productValidation.js';

const valid = {
    id: 'test-01',
    category: 'headset',
    scale: 1,
    platformConfig: { label: 'Casque' },
    title: 'Test',
    date: '2026',
    description: 'Description produit',
    url: '#contact',
    ctaLabel: 'Demander une démo',
    stock: 3,
    priceCents: 1000,
};

describe('validateProductPayload', () => {
    it('accepts a full valid payload', () => {
        const { ok, errors } = validateProductPayload(valid);
        expect(ok).toBe(true);
        expect(errors).toHaveLength(0);
    });

    it('rejects negative price', () => {
        const { ok, errors } = validateProductPayload({ ...valid, priceCents: -1 });
        expect(ok).toBe(false);
        expect(errors).toContain('priceCents');
    });

    it('allows partial updates', () => {
        const { ok, value } = validateProductPayload(
            { id: 'test-01', title: 'Nouveau titre' },
            { partial: true },
        );
        expect(ok).toBe(true);
        expect(value.title).toBe('Nouveau titre');
    });
});
