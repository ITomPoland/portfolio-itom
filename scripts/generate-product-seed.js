import { writeFileSync } from 'node:fs';
import { fileURLToPath } from 'node:url';

import { PRODUCTS } from '../src/components/canvas/rooms/Studio/productData.js';

const outputUrl = new URL('../migrations/0002_seed.sql', import.meta.url);
const expectedFields = [
    'id',
    'category',
    'scale',
    'platformConfig',
    'title',
    'date',
    'description',
    'url',
    'ctaLabel',
];

function sqlString(value) {
    return `'${String(value).replaceAll("'", "''")}'`;
}

function validateProduct(product) {
    const fields = Object.keys(product).sort();
    const expected = [...expectedFields].sort();

    if (JSON.stringify(fields) !== JSON.stringify(expected)) {
        throw new Error(`Unexpected fields for product ${product.id ?? '<sans id>'}: ${fields.join(', ')}`);
    }

    if (!Number.isFinite(product.scale)) {
        throw new Error(`Invalid scale for product ${product.id}`);
    }
}

const inserts = PRODUCTS.map((product) => {
    validateProduct(product);

    const values = [
        sqlString(product.id),
        sqlString(product.category),
        product.scale,
        sqlString(JSON.stringify(product.platformConfig)),
        sqlString(product.title),
        sqlString(product.date),
        sqlString(product.description),
        sqlString(product.url),
        sqlString(product.ctaLabel),
    ];

    return [
        'INSERT INTO products',
        '    (id, category, scale, platform_config, title, date, description, url, cta_label)',
        `VALUES (${values.join(', ')})`,
        'ON CONFLICT(id) DO UPDATE SET',
        '    category = excluded.category,',
        '    scale = excluded.scale,',
        '    platform_config = excluded.platform_config,',
        '    title = excluded.title,',
        '    date = excluded.date,',
        '    description = excluded.description,',
        '    url = excluded.url,',
        '    cta_label = excluded.cta_label,',
        '    updated_at = CURRENT_TIMESTAMP;',
    ].join('\n');
});

const output = [
    '-- Generated from productData.js by scripts/generate-product-seed.js.',
    '-- Re-run: node scripts/generate-product-seed.js',
    '',
    ...inserts.flatMap((insert) => [insert, '']),
].join('\n');

writeFileSync(fileURLToPath(outputUrl), output, 'utf8');
console.log(`Generated ${PRODUCTS.length} products in ${fileURLToPath(outputUrl)}`);
