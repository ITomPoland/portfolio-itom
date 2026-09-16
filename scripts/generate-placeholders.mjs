/**
 * generate-placeholders.mjs
 *
 * Batch-generates "Wu Tong" branded placeholder images for the portfolio-itom project.
 *
 * - New placeholders (A):   public/images/placeholders/{project,studio,cert}*.webp
 * - Overwrites (B):         original author's personal textures
 *   (avatar animation frames, entrance avatar window, about avatar,
 *    award certificates + painted variants, backups copies, og-image, favicon)
 *
 * Style: warm paper background (#faf5ea) + hand-drawn brown border (#4a3728)
 *        + centered ASCII label + simple geometric decoration.
 * Text is strictly ASCII ("PLACEHOLDER", "WU TONG", "AWARD", ...) to avoid
 * tofu boxes from missing CJK glyphs in sharp/librsvg.
 *
 * Run from project root:  node scripts/generate-placeholders.mjs
 */

import sharp from 'sharp';
import fs from 'fs';
import path from 'path';

const ROOT = process.cwd();

// ---------------------------------------------------------------------------
// Palette presets
// ---------------------------------------------------------------------------
const PALETTES = {
  front: { bg: '#faf5ea', ink: '#4a3728', accent: '#b0502e' },        // warm paper
  painted: { bg: '#eef4ec', ink: '#3f5d45', accent: '#7fa98a' },       // soft green watercolor
  studio: { bg: '#f7efe3', ink: '#4a3728', accent: '#c07a34' },        // warm sand
  studioPainted: { bg: '#e9f0f5', ink: '#3a5a78', accent: '#6f96b8' }, // soft blue watercolor
  cert: { bg: '#fdf6e3', ink: '#5a4a2a', accent: '#a8810f' },          // parchment gold
  avatar: { bg: '#faf5ea', ink: '#4a3728', accent: '#b0502e' },
};

// ---------------------------------------------------------------------------
// Deterministic pseudo-random (stable output across runs)
// ---------------------------------------------------------------------------
function mulberry32(seed) {
  let a = seed >>> 0;
  return function () {
    a |= 0;
    a = (a + 0x6d2b79f5) | 0;
    let t = Math.imul(a ^ (a >>> 15), 1 | a);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

// ---------------------------------------------------------------------------
// Hand-drawn placeholder SVG builder
// ---------------------------------------------------------------------------
function esc(s) {
  return String(s)
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;');
}

function handDrawnSVG({ width, height, label, sublabel, palette, seed = 0, bigText = false }) {
  const W = width;
  const H = height;
  const { bg, ink, accent } = palette;
  const rnd = mulberry32(seed);
  const r = (a, b) => a + rnd() * (b - a);
  const j = (n) => Math.round(r(-n, n));

  const borderW = Math.max(4, Math.round(W * 0.012));
  const innerBorderW = Math.max(2, Math.round(W * 0.005));
  const dash = `${Math.max(6, Math.round(W * 0.02))} ${Math.max(4, Math.round(W * 0.012))}`;
  const circleR = Math.min(W, H) * (bigText ? 0.3 : 0.27);
  const circleY = H * (bigText ? 0.4 : 0.42);
  const titleSize = bigText ? Math.round(H * 0.16) : Math.round(W * 0.085);
  const subSize = bigText ? Math.round(H * 0.055) : Math.round(W * 0.042);

  // Little hand-drawn "stitch" marks on the inner border
  let stitches = '';
  for (let i = 0; i < 8; i++) {
    const x = W * (0.12 + rnd() * 0.76);
    const y = H * (0.12 + rnd() * 0.76);
    const len = W * 0.015;
    stitches += `<line x1="${x.toFixed(1)}" y1="${y.toFixed(1)}" x2="${(x + len).toFixed(1)}" y2="${(y + len * r(0.3, 0.8)).toFixed(1)}" stroke="${ink}" stroke-width="${Math.max(1, innerBorderW)}" stroke-linecap="round" opacity="0.35"/>`;
  }

  // Corner dots (like push-pins)
  const dot = borderW * 1.1;
  const dd = Math.min(W, H) * 0.045;
  const cornerDots = [
    [dd, dd],
    [W - dd, dd],
    [dd, H - dd],
    [W - dd, H - dd],
  ]
    .map(
      ([x, y]) =>
        `<circle cx="${x.toFixed(1)}" cy="${y.toFixed(1)}" r="${dot.toFixed(1)}" fill="${accent}" opacity="0.85"/>`
    )
    .join('');

  return `<svg xmlns="http://www.w3.org/2000/svg" width="${W}" height="${H}" viewBox="0 0 ${W} ${H}">
  <rect width="${W}" height="${H}" fill="${bg}"/>
  <!-- outer hand-drawn border (slightly rotated, jittered) -->
  <rect x="${j(2)}" y="${j(2)}" width="${W - j(6)}" height="${H - j(6)}" fill="none" stroke="${ink}"
        stroke-width="${borderW}" stroke-linecap="round"
        transform="rotate(${r(-0.7, 0.7).toFixed(2)} ${(W / 2).toFixed(1)} ${(H / 2).toFixed(1)})" opacity="0.9"/>
  <!-- inner dashed border -->
  <rect x="${(W * 0.055).toFixed(1)}" y="${(H * 0.055).toFixed(1)}" width="${(W * 0.89).toFixed(1)}" height="${(H * 0.89).toFixed(1)}"
        fill="none" stroke="${ink}" stroke-width="${innerBorderW}" stroke-dasharray="${dash}"
        transform="rotate(${r(-0.4, 0.4).toFixed(2)} ${(W / 2).toFixed(1)} ${(H / 2).toFixed(1)})" opacity="0.55"/>
  <!-- decorative circle -->
  <circle cx="${(W / 2).toFixed(1)}" cy="${circleY.toFixed(1)}" r="${circleR.toFixed(1)}" fill="none"
          stroke="${accent}" stroke-width="${Math.max(3, Math.round(W * 0.008))}"
          transform="rotate(${r(-3, 3).toFixed(2)} ${(W / 2).toFixed(1)} ${circleY.toFixed(1)})" opacity="0.7"/>
  <!-- diagonal accent stripes (top-left corner) -->
  <g stroke="${accent}" stroke-width="${Math.max(2, Math.round(W * 0.004))}" stroke-linecap="round" opacity="0.45">
    <line x1="${(W * 0.07).toFixed(1)}" y1="${(H * 0.09).toFixed(1)}" x2="${(W * 0.13).toFixed(1)}" y2="${(H * 0.15).toFixed(1)}"/>
    <line x1="${(W * 0.09).toFixed(1)}" y1="${(H * 0.07).toFixed(1)}" x2="${(W * 0.15).toFixed(1)}" y2="${(H * 0.13).toFixed(1)}"/>
  </g>
  ${stitches}
  ${cornerDots}
  <!-- centered label -->
  <text x="${(W / 2).toFixed(1)}" y="${(H * 0.68).toFixed(1)}" text-anchor="middle"
        font-family="'Comic Sans MS', 'Segoe Print', cursive, sans-serif" font-weight="bold"
        font-size="${titleSize}" fill="${ink}">${esc(label)}</text>
  <text x="${(W / 2).toFixed(1)}" y="${(H * 0.68 + subSize * 1.7).toFixed(1)}" text-anchor="middle"
        font-family="'Comic Sans MS', 'Segoe Print', cursive, sans-serif"
        font-size="${subSize}" fill="${ink}" opacity="0.72">${esc(sublabel)}</text>
</svg>`;
}

// ---------------------------------------------------------------------------
// Rendering helpers
// ---------------------------------------------------------------------------
async function renderWebp(svg, outPath, quality = 88) {
  fs.mkdirSync(path.dirname(outPath), { recursive: true });
  await sharp(Buffer.from(svg)).webp({ quality }).toFile(outPath);
}

async function renderPng(svg, outPath) {
  fs.mkdirSync(path.dirname(outPath), { recursive: true });
  await sharp(Buffer.from(svg)).png().toFile(outPath);
}

/** Read original image size; scale so the longest edge <= maxEdge (keeps aspect ratio). */
async function scaledOriginalSize(filePath, maxEdge) {
  try {
    const meta = await sharp(filePath).metadata();
    const w = meta.width || 512;
    const h = meta.height || 512;
    const scale = Math.min(1, maxEdge / Math.max(w, h));
    return { w: Math.round(w * scale), h: Math.round(h * scale) };
  } catch {
    return null;
  }
}

// ---------------------------------------------------------------------------
// Task list definition
// ---------------------------------------------------------------------------
const tasks = [];

// --- A. New placeholder images (512x512) -----------------------------------
for (let i = 1; i <= 4; i++) {
  tasks.push({
    out: path.join(ROOT, 'public/images/placeholders', `project-front-${i}.webp`),
    w: 512, h: 512,
    svg: handDrawnSVG({ width: 512, height: 512, label: 'PROJECT PLACEHOLDER', sublabel: `WU TONG PROJECT ${i}`, palette: PALETTES.front, seed: 100 + i }),
  });
  tasks.push({
    out: path.join(ROOT, 'public/images/placeholders', `project-painted-${i}.webp`),
    w: 512, h: 512,
    svg: handDrawnSVG({ width: 512, height: 512, label: 'PROJECT PLACEHOLDER', sublabel: `WU TONG PROJECT ${i} - PAINTED`, palette: PALETTES.painted, seed: 200 + i }),
  });
}

for (let i = 1; i <= 6; i++) {
  tasks.push({
    out: path.join(ROOT, 'public/images/placeholders', `studio-front-${i}.webp`),
    w: 512, h: 512,
    svg: handDrawnSVG({ width: 512, height: 512, label: 'STUDIO PLACEHOLDER', sublabel: `WU TONG STUDIO ${i}`, palette: PALETTES.studio, seed: 300 + i }),
  });
  tasks.push({
    out: path.join(ROOT, 'public/images/placeholders', `studio-painted-front-${i}.webp`),
    w: 512, h: 512,
    svg: handDrawnSVG({ width: 512, height: 512, label: 'STUDIO PLACEHOLDER', sublabel: `WU TONG STUDIO ${i} - PAINTED`, palette: PALETTES.studioPainted, seed: 400 + i }),
  });
}

const CERT_LABELS = [
  ['AI CONTENT SPECIAL', 'SITE OF THE DAY'],
  ['AI CONTENT SPECIAL', 'SITE OF THE DAY'],
  ['BEST CREATOR', 'SITE OF THE MONTH'],
  ['OPEN SOURCE', 'COMMUNITY BADGE'],
  ['TOP LEARNER', 'CREATOR CAMP'],
];
for (let i = 1; i <= 5; i++) {
  const [label, sub] = CERT_LABELS[i - 1];
  tasks.push({
    out: path.join(ROOT, 'public/images/placeholders', `cert-${i}.webp`),
    w: 512, h: 512,
    svg: handDrawnSVG({ width: 512, height: 512, label, sublabel: `AWARD PLACEHOLDER ${i} - ${sub}`, palette: PALETTES.cert, seed: 500 + i }),
  });
}

// --- B. Overwrite original author personal assets ---------------------------

// B1. Corridor avatar animation frames (keep 1:1, up to 1024px)
const FRAME_TINTS = [0, 8, -6, 4, -4, 10, -8, 6, -2];
for (let i = 1; i <= 9; i++) {
  const src = path.join(ROOT, 'public/textures/corridor/avatar_anim', `${i}.webp`);
  const size = (await scaledOriginalSize(src, 1024)) || { w: 1024, h: 1024 };
  tasks.push({
    out: src, w: size.w, h: size.h,
    svg: handDrawnSVG({
      width: size.w, height: size.h,
      label: 'WU TONG', sublabel: `FRAME ${i} - PLACEHOLDER`,
      palette: { ...PALETTES.avatar, accent: shiftColor(PALETTES.avatar.accent, FRAME_TINTS[i - 1]) },
      seed: 600 + i,
    }),
  });
}

// B2. Entrance avatar window (1:1, up to 1024px)
{
  const src = path.join(ROOT, 'public/textures/entrance/avatar_window.webp');
  const size = (await scaledOriginalSize(src, 1024)) || { w: 1024, h: 1024 };
  tasks.push({
    out: src, w: size.w, h: size.h,
    svg: handDrawnSVG({
      width: size.w, height: size.h,
      label: 'WU TONG', sublabel: 'IN THE WINDOW - PLACEHOLDER',
      palette: PALETTES.avatar, seed: 700,
    }),
  });
}

// B3. About room: avatar on cloud (2:1-ish)
{
  const src = path.join(ROOT, 'public/textures/about/awatarnachmurce.webp');
  const size = (await scaledOriginalSize(src, 1024)) || { w: 1024, h: 512 };
  tasks.push({
    out: src, w: size.w, h: size.h,
    svg: handDrawnSVG({
      width: size.w, height: size.h,
      label: 'WU TONG', sublabel: 'ON A CLOUD - PLACEHOLDER',
      palette: PALETTES.avatar, seed: 710,
    }),
  });
}

// B4. About room: award certificate cards (sketch + painted variants)
const AWARD_CARDS = [
  { file: 'SOTY', sub: 'SITE OF THE YEAR', seed: 720, paint: true },
  { file: 'SOTD', sub: 'SITE OF THE DAY', seed: 730, paint: true },
  { file: 'SOTM', sub: 'SITE OF THE MONTH', seed: 740, paint: true },
];
for (const { file, sub, seed, paint } of AWARD_CARDS) {
  for (const variant of paint ? ['', '_painted'] : ['']) {
    const src = path.join(ROOT, 'public/textures/about', `${file}${variant}.webp`);
    if (!fs.existsSync(src)) continue;
    const size = (await scaledOriginalSize(src, 1024)) || { w: 1024, h: 512 };
    const palette = variant === '_painted' ? PALETTES.painted : PALETTES.front;
    tasks.push({
      out: src, w: size.w, h: size.h,
      svg: handDrawnSVG({
        width: size.w, height: size.h,
        label: 'AWARD PLACEHOLDER', sublabel: sub + (variant ? ' - PAINTED' : ''),
        palette, seed: seed + (variant ? 50 : 0),
      }),
    });
    // backup copy
    const bak = path.join(ROOT, 'public/textures/about/backups', `${file}${variant}.webp`);
    if (fs.existsSync(bak)) {
      tasks.push({
        out: bak, w: size.w, h: size.h,
        svg: handDrawnSVG({
          width: size.w, height: size.h,
          label: 'AWARD PLACEHOLDER', sublabel: sub + (variant ? ' - PAINTED' : ''),
          palette, seed: seed + (variant ? 50 : 0),
        }),
      });
    }
  }
}

// B5. About room: SOTD certificate images (square, 512x512)
const SOTD_FILES = [
  'SOTDAYYOUNGMULTICSSWINNER.webp',
  'SOTDAYYOUNGMULTIGSAP.webp',
  'SOTDAYYOUNGMULTIORPETRON.webp',
  'SOTDAYYOUNGMULTIDESIGNNOMINESS.webp',
];
const SOTD_SUB = {
  SOTDAYYOUNGMULTICSSWINNER: 'CSS WINNER',
  SOTDAYYOUNGMULTIGSAP: 'GSAP FEATURE',
  SOTDAYYOUNGMULTIORPETRON: 'ORPETRON PICK',
  SOTDAYYOUNGMULTIDESIGNNOMINESS: 'DESIGN NOMINEES',
};
for (let i = 0; i < SOTD_FILES.length; i++) {
  const file = SOTD_FILES[i];
  for (const dir of ['public/textures/about', 'public/textures/about/backups']) {
    const src = path.join(ROOT, dir, file);
    if (!fs.existsSync(src)) continue;
    const size = (await scaledOriginalSize(src, 1024)) || { w: 512, h: 512 };
    tasks.push({
      out: src, w: size.w, h: size.h,
      svg: handDrawnSVG({
        width: size.w, height: size.h,
        label: 'AWARD PLACEHOLDER', sublabel: `SOTD - ${SOTD_SUB[file]}`,
        palette: PALETTES.cert, seed: 800 + i,
      }),
    });
  }
}

// B6. Open Graph image (1200x630)
tasks.push({
  out: path.join(ROOT, 'public/og-image.webp'),
  w: 1200, h: 630,
  svg: handDrawnSVG({
    width: 1200, height: 630,
    label: 'WU TONG PORTFOLIO', sublabel: 'CREATIVE AI SELF-MEDIA - PLACEHOLDER',
    palette: PALETTES.front, seed: 900, bigText: true,
  }),
});

// B7. Favicon (128x128 PNG)
tasks.push({
  out: path.join(ROOT, 'public/favico.png'),
  w: 128, h: 128,
  svg: handDrawnSVG({
    width: 128, height: 128,
    label: 'W', sublabel: '',
    palette: PALETTES.front, seed: 950,
  }),
});

// ---------------------------------------------------------------------------
// Run
// ---------------------------------------------------------------------------
function shiftColor(hex, delta) {
  const n = parseInt(hex.slice(1), 16);
  const r = Math.min(255, Math.max(0, (n >> 16) + delta));
  const g = Math.min(255, Math.max(0, ((n >> 8) & 0xff) + delta));
  const b = Math.min(255, Math.max(0, (n & 0xff) + delta));
  return `#${((r << 16) | (g << 8) | b).toString(16).padStart(6, '0')}`;
}

let ok = 0;
let failed = 0;
for (const t of tasks) {
  try {
    if (t.out.endsWith('.png')) {
      await renderPng(t.svg, t.out);
    } else {
      await renderWebp(t.svg, t.out);
    }
    console.log(`OK   ${path.relative(ROOT, t.out)} (${t.w}x${t.h})`);
    ok++;
  } catch (e) {
    console.error(`FAIL ${path.relative(ROOT, t.out)}: ${e.message}`);
    failed++;
  }
}

console.log(`\nDone: ${ok} generated, ${failed} failed.`);
if (failed > 0) process.exit(1);
