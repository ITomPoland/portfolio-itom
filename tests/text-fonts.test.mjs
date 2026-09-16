import assert from 'node:assert/strict';
import { readFileSync, readdirSync } from 'node:fs';
import { resolve, extname } from 'node:path';
import { fileURLToPath } from 'node:url';
import test from 'node:test';
import typrFactory from '../node_modules/troika-three-text/libs/typr.factory.js';
import { LOCAL_BODY_FONT, LOCAL_BOLD_FONT, resolveTextFont } from '../src/config/textFonts.js';
import { projects } from '../src/data/projects.js';

// Run the same glyph parser as Troika, without a browser or remote fallback.
globalThis.self = globalThis;
globalThis.window = globalThis;
const Typr = typrFactory();
const root = fileURLToPath(new URL('../', import.meta.url));
const fonts = [LOCAL_BODY_FONT, LOCAL_BOLD_FONT].map(url => {
    const bytes = readFileSync(resolve(root, 'public', url.slice(1)));
    return { url, font: Typr.parse(bytes.buffer.slice(bytes.byteOffset, bytes.byteOffset + bytes.byteLength))[0] };
});

test('Chinese text uses local glyphs; English sketch headings keep their font', () => {
    const sketch = '/fonts/CabinSketch-Bold.ttf';
    assert.equal(resolveTextFont('一个人也能完成', sketch), LOCAL_BODY_FONT);
    assert.equal(resolveTextFont('一对一沟通', sketch), LOCAL_BODY_FONT);
    assert.equal(resolveTextFont('PROJECT DETAILS:', sketch), sketch);
    assert.equal(resolveTextFont('TECH STACK', sketch), sketch);
    assert.equal(resolveTextFont('AI', undefined), undefined);
});

test('existing Chinese bold/regular choices are preserved with the new font files', () => {
    assert.equal(resolveTextFont('吴桐', '/fonts/HarmonyOS-Sans-SC-Bold-About.ttf'), LOCAL_BOLD_FONT);
    assert.equal(resolveTextFont('关于我', '/fonts/HarmonyOS-Sans-SC-Regular-About.ttf'), LOCAL_BODY_FONT);
    assert.equal(resolveTextFont('作品集', undefined, 700), LOCAL_BOLD_FONT);
});

test('both local fonts cover all current source Chinese and Chinese punctuation', () => {
    const sourceDir = resolve(root, 'src');
    const text = readdirSync(sourceDir, { recursive: true })
        .filter(path => ['.js', '.jsx', '.ts', '.tsx'].includes(extname(path)))
        .map(path => readFileSync(resolve(sourceDir, path), 'utf8')).join('');
    const characters = [...new Set(text.match(/[\u3400-\u9fff\u3000-\u303f\uff01-\uff60]/gu))];
    for (const { url, font } of fonts) {
        const missing = characters.filter(char => Typr.U.codeToGlyph(font, char.codePointAt(0)) === 0);
        assert.deepEqual(missing, [], `${url} missing glyphs: ${missing.join('')}`);
    }
});

test('the reported 一 has a real horizontal-stroke outline, not the missing-glyph box', () => {
    assert.match(projects.find(project => project.id === 'ai-studio').description, /一个人/);
    for (const { font } of fonts) {
        const glyph = Typr.U.codeToGlyph(font, '一'.codePointAt(0));
        assert.ok(glyph > 0);
        const { crds } = Typr.U.glyphToPath(font, glyph);
        const xs = crds.filter((_, index) => index % 2 === 0);
        const ys = crds.filter((_, index) => index % 2 === 1);
        const width = Math.max(...xs) - Math.min(...xs);
        const height = Math.max(...ys) - Math.min(...ys);
        assert.ok(height > 0 && width / height > 4, '一 must render as a wide horizontal stroke');
    }
});
