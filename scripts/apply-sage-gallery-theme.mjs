#!/usr/bin/env node

/**
 * Build a staged "sage gallery" texture set without touching runtime assets.
 *
 * Visual reference:
 *   ChatGPT Image 2026年8月23日 17_24_57.png
 *
 * Direction:
 *   - high-key warm cream walls and paper
 *   - pale yellow wood floors/furniture
 *   - muted sage-green frames, doors, vents and foliage
 *   - soft green-grey ink lines with a restrained paper grain
 *
 * Safety boundaries:
 *   - source files under public are read-only
 *   - generated files go only to tmp/sage-gallery-theme
 *   - dimensions and alpha bytes are verified after encoding
 *   - content images, avatar frames and 3D/model/business files are excluded
 *
 * Usage:
 *   node scripts/apply-sage-gallery-theme.mjs
 *   node scripts/apply-sage-gallery-theme.mjs --list
 */

import { createHash } from 'node:crypto';
import { access, mkdir, readFile, rename, rm, writeFile } from 'node:fs/promises';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import sharp from 'sharp';

const SCRIPT_DIR = path.dirname(fileURLToPath(import.meta.url));
const PROJECT_ROOT = path.resolve(SCRIPT_DIR, '..');
const PUBLIC_ROOT = path.join(PROJECT_ROOT, 'public');
const OUTPUT_ROOT = path.join(PROJECT_ROOT, 'tmp', 'sage-gallery-theme');
const MANIFEST_PATH = path.join(OUTPUT_ROOT, 'manifest.json');

const THEME = Object.freeze({
    id: 'sage-gallery-v1',
    name: 'High-key cream and sage gallery',
    reference: 'ChatGPT Image 2026年8月23日 17_24_57.png',
    referenceUsage: 'Palette and material direction only; no reference pixels are copied.',
    outputFormat: 'Lossless WebP, retaining each source filename and dimensions',
});

/**
 * Each ramp maps source luminance (0..1) to a reference-derived palette.
 * Keeping dark-to-light order intact preserves existing drawing, lettering,
 * seams, bevel cues and baked texture detail without changing UVs or geometry.
 */
const PROFILES = Object.freeze({
    creamWall: {
        label: 'warm ivory wall with pale sage linework',
        palette: ['#48533f', '#899277', '#cdd3ae', '#eceecf', '#fffced'],
        stops: [0, 0.18, 0.46, 0.74, 1],
        contrast: 0.82,
        lift: 0.09,
        gamma: 0.78,
        chromaRetention: 0.025,
        grain: 1.25,
    },
    creamPaper: {
        label: 'warm cream paper and sign stock',
        palette: ['#4b5142', '#85866d', '#cbc6a3', '#eae1bd', '#fff7dc'],
        stops: [0, 0.2, 0.5, 0.78, 1],
        contrast: 0.9,
        lift: 0.06,
        gamma: 0.82,
        chromaRetention: 0.035,
        grain: 1.6,
    },
    sageSketch: {
        label: 'readable sage pencil linework on warm paper',
        palette: ['#2f3d31', '#53604b', '#7c876d', '#c2c8a5', '#fff7dc'],
        stops: [0, 0.24, 0.5, 0.78, 1],
        contrast: 1.16,
        lift: -0.035,
        gamma: 1.06,
        chromaRetention: 0.02,
        grain: 1.1,
    },
    paleWood: {
        label: 'sunlit pale yellow wood',
        palette: ['#59604d', '#99936b', '#d2c38e', '#edddb0', '#fff2ce'],
        stops: [0, 0.2, 0.5, 0.78, 1],
        contrast: 0.96,
        lift: 0.055,
        gamma: 0.84,
        chromaRetention: 0.055,
        grain: 1.25,
    },
    paleSage: {
        label: 'pale sage ceiling and secondary trim',
        palette: ['#46533f', '#77896a', '#aab991', '#d1d9b5', '#f1f2d9'],
        stops: [0, 0.2, 0.5, 0.78, 1],
        contrast: 0.88,
        lift: 0.075,
        gamma: 0.8,
        chromaRetention: 0.035,
        grain: 1,
    },
    sageAccent: {
        label: 'muted sage-green architectural accent',
        palette: ['#32452f', '#566b4c', '#819d6d', '#b6c69c', '#e9ebce'],
        stops: [0, 0.2, 0.5, 0.79, 1],
        contrast: 1.02,
        lift: 0.025,
        gamma: 0.9,
        chromaRetention: 0.045,
        grain: 0.9,
    },
    creamSageDoor: {
        label: 'cream door panel with sage ornamental values',
        palette: ['#334632', '#5c7450', '#8eaa76', '#dad8ac', '#fff3d5'],
        stops: [0, 0.18, 0.43, 0.7, 1],
        contrast: 1.08,
        lift: 0.025,
        gamma: 0.9,
        chromaRetention: 0.075,
        grain: 0.85,
    },
    foliage: {
        label: 'soft natural sage foliage',
        palette: ['#2f472d', '#4f7045', '#769a62', '#a9bf82', '#e1e6bd'],
        stops: [0, 0.2, 0.5, 0.78, 1],
        contrast: 1.04,
        lift: 0.015,
        gamma: 0.93,
        chromaRetention: 0.12,
        grain: 0.7,
    },
});

const target = (file, profile, role, outputFile = file) => Object.freeze({
    file,
    outputFile,
    profile,
    role,
});

/**
 * Explicit allow-list. Only visible environment skins are included.
 * Deliberately excluded: painting1/2/3, rysunek*, avatar assets, room content,
 * source backups and every model/code file.
 */
const TARGETS = Object.freeze([
    // Entrance shell and environmental accents.
    target('public/textures/entrance/wall_bricks_2.webp', 'creamWall', 'entrance wall'),
    target('public/textures/entrance/floor_paper.webp', 'paleWood', 'entrance floor'),
    target('public/textures/entrance/stone-path.webp', 'creamPaper', 'entrance path'),
    target('public/textures/entrance/belka.webp', 'sageAccent', 'entrance sign mount'),
    target('public/textures/entrance/sign.webp', 'creamPaper', 'entrance sign'),
    target('public/textures/entrance/window_sketch.webp', 'sageAccent', 'entrance window frame'),
    target('public/textures/entrance/tree_sketch.webp', 'foliage', 'entrance foliage'),

    // Entrance double doors. Sketch/painted pairs share profiles so hover reveals align stylistically.
    target('public/textures/doors/frame_sketch.webp', 'sageAccent', 'entrance door frame'),
    target('public/textures/doors/door_left_sketch.webp', 'creamSageDoor', 'entrance left door sketch'),
    target('public/textures/doors/door_left_painted.webp', 'creamSageDoor', 'entrance left door painted'),
    target('public/textures/doors/door_right_sketch.webp', 'creamSageDoor', 'entrance right door sketch'),
    target('public/textures/doors/door_right_painted.webp', 'creamSageDoor', 'entrance right door painted'),
    target('public/textures/doors/handle_left_sketch.webp', 'sageAccent', 'entrance left handle sketch'),
    target('public/textures/doors/handle_left_painted.webp', 'sageAccent', 'entrance left handle painted'),
    target('public/textures/doors/handle_right_sketch.webp', 'sageAccent', 'entrance right handle sketch'),
    target('public/textures/doors/handle_right_painted.webp', 'sageAccent', 'entrance right handle painted'),
    target('public/textures/doors/door_back_left_sketch.webp', 'creamSageDoor', 'entrance door back sketch'),
    target('public/textures/doors/door_back.webp', 'creamSageDoor', 'entrance door back'),
    target('public/textures/doors/pien_sketch.webp', 'paleWood', 'entrance door edge sketch'),
    target('public/textures/doors/pien.webp', 'paleWood', 'entrance door edge'),

    // Corridor architecture.
    target('public/textures/corridor/wall_texture.webp', 'creamWall', 'corridor wall'),
    target('public/textures/corridor/kawalekpodlogi.webp', 'paleWood', 'corridor floor'),
    target('public/textures/corridor/texturadoprogow.webp', 'paleSage', 'corridor baseboard and threshold'),
    target('public/textures/corridor/ceiling_texture.webp', 'paleSage', 'corridor ceiling'),

    // Corridor furniture, frames, plants and fixtures.
    target('public/textures/corridor/texturadrewnadonozekbiurka.webp', 'paleWood', 'table legs'),
    target('public/textures/corridor/gorastolika.webp', 'paleWood', 'table top'),
    target('public/textures/corridor/szafkaprzod.webp', 'sageAccent', 'cabinet front'),
    target('public/textures/corridor/szafkaprzodgora.webp', 'paleSage', 'cabinet body'),
    target('public/textures/corridor/drzewkowdoniczce.webp', 'foliage', 'potted tree'),
    target('public/textures/corridor/kwiatekwdoniczce.webp', 'foliage', 'small potted plant'),
    target('public/textures/corridor/kratkawentylacyjna.webp', 'sageAccent', 'vent grille'),
    target('public/textures/corridor/kratanalampy.webp', 'sageAccent', 'lamp grille'),
    target('public/textures/corridor/bokilampy.webp', 'paleSage', 'lamp housing'),
    target('public/textures/corridor/ramkanazdjecieduza.webp', 'sageAccent', 'large picture frame sketch'),
    target('public/textures/corridor/ramkanazdjecieduza_painted.webp', 'sageAccent', 'large picture frame painted'),
    target('public/textures/corridor/ramkanazdjeciemala.webp', 'sageAccent', 'small standing frame'),
    target('public/textures/corridor/pustatabliczka.webp', 'creamPaper', 'corridor sign plate'),
    target('public/textures/corridor/strzalka.webp', 'sageAccent', 'corridor direction arrow'),

    // Corridor end doors and four room doors.
    target('public/textures/corridor/doors/frame_sketch.webp', 'sageAccent', 'corridor end-door frame'),
    target('public/textures/corridor/doors/doorrleft.webp', 'creamSageDoor', 'corridor end door left'),
    target('public/textures/corridor/doors/dorright.webp', 'creamSageDoor', 'corridor end door right'),
    target('public/textures/corridor/doors/handle_left_sketch.webp', 'sageAccent', 'corridor end handle left'),
    target('public/textures/corridor/doors/handle_right_sketch.webp', 'sageAccent', 'corridor end handle right'),
    target('public/textures/corridor/doors/door_back.webp', 'creamSageDoor', 'corridor end door back'),
    target('public/textures/corridor/doors/pien.webp', 'paleWood', 'corridor end door edge'),
    target('public/textures/corridor/doors/ramkasingledoors.webp', 'sageAccent', 'room door frame'),
    target('public/textures/corridor/doors/klamkadodrzwi.webp', 'sageAccent', 'room handle sketch'),
    target('public/textures/corridor/doors/klamkadodrzwi_painted.webp', 'sageAccent', 'room handle painted'),
    target('public/textures/corridor/doors/backsingledoors.webp', 'creamSageDoor', 'room door back'),
    target('public/textures/corridor/doors/drzwiprojekty.webp', 'creamSageDoor', 'gallery door sketch'),
    target('public/textures/corridor/doors/drzwiprojekty_painted.webp', 'creamSageDoor', 'gallery door painted'),
    target('public/textures/corridor/doors/drzwisocial.webp', 'creamSageDoor', 'studio door sketch'),
    target('public/textures/corridor/doors/drzwisocial_painted.webp', 'creamSageDoor', 'studio door painted'),
    target('public/textures/corridor/doors/drzwiabout.webp', 'creamSageDoor', 'about door sketch'),
    target('public/textures/corridor/doors/drzwiabout_painted.webp', 'creamSageDoor', 'about door painted'),
    target('public/textures/corridor/doors/drzwikontakt.webp', 'creamSageDoor', 'contact door sketch'),
    target('public/textures/corridor/doors/drzwikontakt_painted.webp', 'creamSageDoor', 'contact door painted'),

    // Existing corridor props keep their shapes/text; only their material palette changes.
    target('public/textures/corridor/decorations/while_true_loop.webp', 'sageAccent', 'code doodle'),
    target('public/textures/corridor/decorations/coffee_debug.webp', 'creamPaper', 'coffee debug doodle'),
    target('public/textures/corridor/decorations/idea_process.webp', 'sageAccent', 'idea doodle'),
    target('public/textures/corridor/decorations/paper_ball.webp', 'creamPaper', 'paper ball'),
    target('public/textures/corridor/decorations/paper_airplane.webp', 'creamPaper', 'paper airplane'),
    target('public/textures/corridor/decorations/pencil.webp', 'paleWood', 'pencil'),
    target('public/textures/corridor/decorations/coffee_cup.webp', 'sageAccent', 'coffee cup'),

    // Gallery room shell. New sibling paths keep the original grey gallery reversible.
    target('public/textures/gallery/floor.webp', 'paleWood', 'gallery floor', 'public/textures/gallery/sage/floor.webp'),
    target('public/textures/gallery/railing.webp', 'sageAccent', 'gallery railing', 'public/textures/gallery/sage/railing.webp'),
    target('public/textures/gallery/domki.webp', 'paleSage', 'gallery foreground houses', 'public/textures/gallery/sage/domki.webp'),
    target('public/textures/gallery/miastotlo.webp', 'creamWall', 'gallery city background', 'public/textures/gallery/sage/miastotlo.webp'),
    target('public/textures/gallery/bird_gray.webp', 'sageAccent', 'gallery bird', 'public/textures/gallery/sage/bird_gray.webp'),
    target('public/textures/gallery/klamerka.webp', 'sageAccent', 'gallery clothespin', 'public/textures/gallery/sage/klamerka.webp'),
    target('public/textures/gallery/tylkartki.webp', 'creamPaper', 'gallery card back sketch', 'public/textures/gallery/sage/tylkartki.webp'),
    target('public/textures/gallery/tylkartki_painted.webp', 'paleSage', 'gallery card back painted', 'public/textures/gallery/sage/tylkartki_painted.webp'),
    target('public/textures/gallery/przyciskdotylukartki.webp', 'creamPaper', 'gallery card button sketch', 'public/textures/gallery/sage/przyciskdotylukartki.webp'),
    target('public/textures/gallery/przyciskdotylukartki_painted.webp', 'paleSage', 'gallery card button painted', 'public/textures/gallery/sage/przyciskdotylukartki_painted.webp'),

    // AI-edited project watercolours stay as the painted state; these are their lighter sketch states.
    target('public/assets/gallery/sage/project-painted-1.webp', 'sageSketch', 'gallery project 1 sketch', 'public/assets/gallery/sage/project-front-1.webp'),
    target('public/assets/gallery/sage/project-painted-2.webp', 'sageSketch', 'gallery project 2 sketch', 'public/assets/gallery/sage/project-front-2.webp'),
    target('public/assets/gallery/sage/project-painted-3.webp', 'sageSketch', 'gallery project 3 sketch', 'public/assets/gallery/sage/project-front-3.webp'),
    target('public/assets/gallery/sage/project-painted-4.webp', 'sageSketch', 'gallery project 4 sketch', 'public/assets/gallery/sage/project-front-4.webp'),

    // Project-detail icons use one restrained sage treatment on every input device.
    target('public/assets/gallery/skill1logo.webp', 'sageAccent', 'gallery skill icon 1', 'public/assets/gallery/sage/skill1logo.webp'),
    target('public/assets/gallery/skill2logo.webp', 'sageAccent', 'gallery skill icon 2', 'public/assets/gallery/sage/skill2logo.webp'),
    target('public/assets/gallery/skill3logo.webp', 'sageAccent', 'gallery skill icon 3', 'public/assets/gallery/sage/skill3logo.webp'),
    target('public/assets/gallery/skill4logo.webp', 'sageAccent', 'gallery skill icon 4', 'public/assets/gallery/sage/skill4logo.webp'),
    target('public/assets/gallery/gaokao1logo.webp', 'sageAccent', 'gallery gaokao icon 1', 'public/assets/gallery/sage/gaokao1logo.webp'),
    target('public/assets/gallery/gaokao2logo.webp', 'sageAccent', 'gallery gaokao icon 2', 'public/assets/gallery/sage/gaokao2logo.webp'),
    target('public/assets/gallery/gaokao3logo.webp', 'sageAccent', 'gallery gaokao icon 3', 'public/assets/gallery/sage/gaokao3logo.webp'),
    target('public/assets/gallery/gaokao4logo.webp', 'sageAccent', 'gallery gaokao icon 4', 'public/assets/gallery/sage/gaokao4logo.webp'),
    target('public/assets/gallery/aicode1logo.webp', 'sageAccent', 'gallery AI coding icon 1', 'public/assets/gallery/sage/aicode1logo.webp'),
    target('public/assets/gallery/aicode2logo.webp', 'sageAccent', 'gallery AI coding icon 2', 'public/assets/gallery/sage/aicode2logo.webp'),
    target('public/assets/gallery/aicode3logo.webp', 'sageAccent', 'gallery AI coding icon 3', 'public/assets/gallery/sage/aicode3logo.webp'),
    target('public/assets/gallery/aicode4logo.webp', 'sageAccent', 'gallery AI coding icon 4', 'public/assets/gallery/sage/aicode4logo.webp'),
    target('public/assets/gallery/wordpresslogo.webp', 'sageAccent', 'gallery WordPress icon', 'public/assets/gallery/sage/wordpresslogo.webp'),
    target('public/assets/gallery/elementorlogo.webp', 'sageAccent', 'gallery Elementor icon', 'public/assets/gallery/sage/elementorlogo.webp'),
    target('public/assets/gallery/phplogo.webp', 'sageAccent', 'gallery PHP icon', 'public/assets/gallery/sage/phplogo.webp'),
    target('public/assets/gallery/csslogo.webp', 'sageAccent', 'gallery CSS icon', 'public/assets/gallery/sage/csslogo.webp'),
]);

const clamp = (value, min = 0, max = 1) => Math.min(max, Math.max(min, value));
const mix = (a, b, amount) => a + (b - a) * amount;
const toPosix = (value) => value.split(path.sep).join('/');

function hexToRgb(hex) {
    const value = Number.parseInt(hex.slice(1), 16);
    return [(value >> 16) & 255, (value >> 8) & 255, value & 255];
}

function mappedColor(profile, tone) {
    const palette = profile.palette.map(hexToRgb);
    const stops = profile.stops;

    if (tone <= stops[0]) return palette[0];
    if (tone >= stops.at(-1)) return palette.at(-1);

    for (let index = 0; index < stops.length - 1; index += 1) {
        if (tone <= stops[index + 1]) {
            const amount = (tone - stops[index]) / (stops[index + 1] - stops[index]);
            return [
                mix(palette[index][0], palette[index + 1][0], amount),
                mix(palette[index][1], palette[index + 1][1], amount),
                mix(palette[index][2], palette[index + 1][2], amount),
            ];
        }
    }

    return palette.at(-1);
}

function seedFor(value) {
    let hash = 2166136261;
    for (let index = 0; index < value.length; index += 1) {
        hash ^= value.charCodeAt(index);
        hash = Math.imul(hash, 16777619);
    }
    return hash >>> 0;
}

/** Deterministic, zero-allocation paper grain in the -0.5..0.5 range. */
function grainAt(x, y, seed) {
    let value = Math.imul(x + 1, 374761393) ^ Math.imul(y + 1, 668265263) ^ seed;
    value = Math.imul(value ^ (value >>> 13), 1274126177);
    value ^= value >>> 16;
    return (value >>> 0) / 4294967295 - 0.5;
}

function recolorPixels(input, info, profile, seed) {
    if (info.channels !== 4) {
        throw new Error(`Expected RGBA decode, received ${info.channels} channels`);
    }

    const output = Buffer.allocUnsafe(input.length);
    const { width, height } = info;

    for (let y = 0; y < height; y += 1) {
        for (let x = 0; x < width; x += 1) {
            const offset = (y * width + x) * 4;
            const red = input[offset];
            const green = input[offset + 1];
            const blue = input[offset + 2];
            const alpha = input[offset + 3];

            // Hidden RGB is left byte-identical; only visible pixels are themed.
            if (alpha === 0) {
                output[offset] = red;
                output[offset + 1] = green;
                output[offset + 2] = blue;
                output[offset + 3] = alpha;
                continue;
            }

            const luminance = 0.2126 * red + 0.7152 * green + 0.0722 * blue;
            let tone = luminance / 255;
            tone = clamp((tone - 0.5) * profile.contrast + 0.5 + profile.lift);
            tone = Math.pow(tone, profile.gamma);

            const paletteRgb = mappedColor(profile, tone);
            const detailRed = (red - luminance) * profile.chromaRetention;
            const detailGreen = (green - luminance) * profile.chromaRetention;
            const detailBlue = (blue - luminance) * profile.chromaRetention;
            const grain = grainAt(x, y, seed) * profile.grain;

            output[offset] = Math.round(clamp(paletteRgb[0] + detailRed + grain, 0, 255));
            output[offset + 1] = Math.round(clamp(paletteRgb[1] + detailGreen + grain, 0, 255));
            output[offset + 2] = Math.round(clamp(paletteRgb[2] + detailBlue + grain, 0, 255));
            output[offset + 3] = alpha;
        }
    }

    return output;
}

async function decodeRgba(file) {
    return sharp(file, { failOn: 'error', limitInputPixels: false })
        .ensureAlpha()
        .raw()
        .toBuffer({ resolveWithObject: true });
}

function alphaBytes(rgba, pixelCount) {
    const alpha = Buffer.allocUnsafe(pixelCount);
    for (let index = 0; index < pixelCount; index += 1) {
        alpha[index] = rgba[index * 4 + 3];
    }
    return alpha;
}

function sha256(value) {
    return createHash('sha256').update(value).digest('hex');
}

function isInside(parent, candidate) {
    const relative = path.relative(parent, candidate);
    return relative !== '' && !relative.startsWith(`..${path.sep}`) && relative !== '..' && !path.isAbsolute(relative);
}

async function replaceStagedFile(tempPath, outputPath) {
    // The guard in transformTarget guarantees outputPath is inside the staging root.
    await rm(outputPath, { force: true });
    await rename(tempPath, outputPath);
}

async function transformTarget(entry, index) {
    const sourcePath = path.resolve(PROJECT_ROOT, entry.file);
    const outputPath = path.resolve(OUTPUT_ROOT, entry.outputFile);

    if (!isInside(PUBLIC_ROOT, sourcePath)) {
        throw new Error(`Source escaped public: ${entry.file}`);
    }
    if (!isInside(OUTPUT_ROOT, outputPath)) {
        throw new Error(`Output escaped staging root: ${entry.file}`);
    }
    if (sourcePath === outputPath) {
        throw new Error(`Refusing in-place conversion: ${entry.file}`);
    }

    await access(sourcePath);
    const profile = PROFILES[entry.profile];
    if (!profile) throw new Error(`Unknown profile "${entry.profile}" for ${entry.file}`);

    const sourceFile = await readFile(sourcePath);
    const sourceMetadata = await sharp(sourceFile).metadata();
    const decoded = await decodeRgba(sourceFile);
    const pixelCount = decoded.info.width * decoded.info.height;
    const sourceAlpha = alphaBytes(decoded.data, pixelCount);
    const themed = recolorPixels(decoded.data, decoded.info, profile, seedFor(entry.outputFile));

    await mkdir(path.dirname(outputPath), { recursive: true });
    const tempPath = path.join(
        path.dirname(outputPath),
        `.${path.basename(outputPath)}.sage-${process.pid}-${index}.tmp`,
    );

    try {
        let encoder = sharp(themed, {
            raw: {
                width: decoded.info.width,
                height: decoded.info.height,
                channels: 4,
            },
        });

        // Preserve the source's alpha-channel semantics as well as its alpha bytes.
        if (!sourceMetadata.hasAlpha) encoder = encoder.removeAlpha();

        await encoder.webp({ lossless: true, effort: 6 }).toFile(tempPath);
        await replaceStagedFile(tempPath, outputPath);
    } catch (error) {
        await rm(tempPath, { force: true });
        throw error;
    }

    const outputFile = await readFile(outputPath);
    const outputMetadata = await sharp(outputFile).metadata();
    const outputDecoded = await decodeRgba(outputFile);
    const outputAlpha = alphaBytes(outputDecoded.data, pixelCount);

    const dimensionsMatch =
        sourceMetadata.width === outputMetadata.width &&
        sourceMetadata.height === outputMetadata.height;
    const alphaBytesMatch = sourceAlpha.equals(outputAlpha);

    if (!dimensionsMatch) throw new Error(`Dimension check failed: ${entry.file}`);
    if (!alphaBytesMatch) throw new Error(`Alpha check failed: ${entry.file}`);

    console.log(
        `OK  ${entry.file} -> ${entry.outputFile}  ${sourceMetadata.width}x${sourceMetadata.height}  ${entry.profile}`,
    );

    return {
        file: entry.file,
        outputFile: entry.outputFile,
        role: entry.role,
        profile: entry.profile,
        source: {
            bytes: sourceFile.length,
            sha256: sha256(sourceFile),
            format: sourceMetadata.format,
            width: sourceMetadata.width,
            height: sourceMetadata.height,
            hasAlpha: Boolean(sourceMetadata.hasAlpha),
            alphaSha256: sha256(sourceAlpha),
        },
        staged: {
            file: toPosix(path.relative(PROJECT_ROOT, outputPath)),
            bytes: outputFile.length,
            sha256: sha256(outputFile),
            format: outputMetadata.format,
            width: outputMetadata.width,
            height: outputMetadata.height,
            hasAlpha: Boolean(outputMetadata.hasAlpha),
            alphaSha256: sha256(outputAlpha),
        },
        checks: {
            dimensionsMatch,
            alphaBytesMatch,
            sourceWasNotModified: sha256(await readFile(sourcePath)) === sha256(sourceFile),
        },
    };
}

async function writeManifest(files) {
    const usedProfiles = [...new Set(TARGETS.map((entry) => entry.profile))];
    const manifest = {
        schemaVersion: 1,
        generatedAt: new Date().toISOString(),
        theme: THEME,
        safety: {
            sourceRoot: toPosix(path.relative(PROJECT_ROOT, PUBLIC_ROOT)),
            outputRoot: toPosix(path.relative(PROJECT_ROOT, OUTPUT_ROOT)),
            runtimeAssetsOverwritten: false,
            geometryOrCodeChanged: false,
            excludedContent: [
                'public/textures/corridor/painting1.png',
                'public/textures/corridor/painting2.gif',
                'public/textures/corridor/painting3.png',
                'public/textures/corridor/avatar_anim/**',
                'public/textures/entrance/avatar_window.webp',
            ],
        },
        algorithm: {
            version: 1,
            method: 'deterministic luminance-ramp recolor with restrained source chroma and paper grain',
            encoder: 'lossless WebP',
            invariants: ['same width', 'same height', 'same alpha byte at every pixel', 'same relative filename'],
            profiles: Object.fromEntries(usedProfiles.map((name) => [name, PROFILES[name]])),
        },
        targetCount: TARGETS.length,
        files,
    };

    await mkdir(OUTPUT_ROOT, { recursive: true });
    const tempManifest = `${MANIFEST_PATH}.tmp-${process.pid}`;
    await writeFile(tempManifest, `${JSON.stringify(manifest, null, 2)}\n`, 'utf8');
    await replaceStagedFile(tempManifest, MANIFEST_PATH);
}

function validateTargetList() {
    const seen = new Set();
    for (const entry of TARGETS) {
        if (seen.has(entry.outputFile)) throw new Error(`Duplicate target: ${entry.outputFile}`);
        seen.add(entry.outputFile);
        if (path.extname(entry.file).toLowerCase() !== '.webp' || path.extname(entry.outputFile).toLowerCase() !== '.webp') {
            throw new Error(`Only WebP staging is configured: ${entry.file} -> ${entry.outputFile}`);
        }
    }
}

async function main() {
    validateTargetList();

    if (process.argv.includes('--list')) {
        for (const entry of TARGETS) {
            console.log(`${entry.profile.padEnd(15)} ${entry.file} -> ${entry.outputFile}  # ${entry.role}`);
        }
        console.log(`\n${TARGETS.length} staged targets; --list performs no writes.`);
        return;
    }

    const unsupportedArgs = process.argv.slice(2).filter((argument) => argument !== '--list');
    if (unsupportedArgs.length > 0) {
        throw new Error(`Unknown argument(s): ${unsupportedArgs.join(', ')}`);
    }

    console.log(`Theme: ${THEME.name}`);
    console.log(`Output: ${toPosix(path.relative(PROJECT_ROOT, OUTPUT_ROOT))}`);
    console.log('Runtime textures are read-only; generating staged files...\n');

    const files = [];
    for (let index = 0; index < TARGETS.length; index += 1) {
        files.push(await transformTarget(TARGETS[index], index));
    }

    await writeManifest(files);
    console.log(`\nDone: ${files.length} textures staged.`);
    console.log(`Manifest: ${toPosix(path.relative(PROJECT_ROOT, MANIFEST_PATH))}`);
}

main().catch((error) => {
    console.error(`\nSage gallery theme build failed: ${error.message}`);
    process.exitCode = 1;
});
