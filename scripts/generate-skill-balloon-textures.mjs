import { mkdir } from 'node:fs/promises';
import path from 'node:path';
import sharp from 'sharp';

const WIDTH = 800;
const HEIGHT = 1600;
const outputDir = path.resolve('public/textures/about/skills');
const feishuSource = path.resolve('scripts/assets/skill-icons/feishu-logo-generated.png');

const skills = [
    { id: 'ai-coding', fill: '#17b9b3', accent: '#fff4d8', iconAccent: '#ff4f86', icon: 'coding' },
    { id: 'python', fill: '#ffd363', accent: '#24559f', iconAccent: '#12aaa8', icon: 'python' },
    { id: 'lora', fill: '#ff7297', accent: '#fff4d8', iconAccent: '#00a9aa', icon: 'lora' },
    { id: 'feishu', fill: '#cbeaff', accent: '#173f9e', iconAccent: '#12bfae', icon: 'feishu' },
    { id: 'illustrator', fill: '#ff9f43', accent: '#4a2307', iconAccent: '#fff1ce', icon: 'illustrator' },
    { id: 'photoshop', fill: '#6756d8', accent: '#a8edff', iconAccent: '#fff4d8', icon: 'photoshop' },
];

const balloonPath = 'M400 42 C194 32 73 204 80 498 C85 713 210 834 355 850 C348 867 337 884 331 902 C363 924 437 924 469 901 C462 882 453 866 446 850 C594 829 717 706 722 500 C729 205 606 39 400 42 Z';

function iconMarkup(type, painted, accent, iconAccent) {
    const stroke = painted ? accent : '#252525';
    const second = painted ? iconAccent : '#252525';
    const common = `fill="none" stroke="${stroke}" stroke-width="24" stroke-linecap="round" stroke-linejoin="round"`;

    if (type === 'coding') {
        return `
            <g ${common}>
                <path d="M292 286 L205 402 L292 518" />
                <path d="M508 286 L595 402 L508 518" />
                <path d="M446 260 L354 542" />
            </g>
            <g fill="${second}" stroke="#252525" stroke-width="8" stroke-linejoin="round">
                <path d="M570 244 L584 276 L617 290 L584 304 L570 338 L556 304 L523 290 L556 276 Z" />
                <circle cx="230" cy="252" r="15" />
            </g>`;
    }

    if (type === 'python') {
        return `
            <g stroke="#252525" stroke-width="12" stroke-linejoin="round">
                <path d="M270 262 C270 218 306 190 350 190 H438 C480 190 508 220 508 260 V340 H350 C302 340 270 372 270 416 V446 H210 V350 C210 294 232 262 270 262 Z" fill="${painted ? '#2e68b2' : '#f8f6ef'}" />
                <path d="M530 542 C530 586 494 614 450 614 H362 C320 614 292 584 292 544 V464 H450 C498 464 530 432 530 388 V358 H590 V454 C590 510 568 542 530 542 Z" fill="${painted ? '#18a9a5' : '#f8f6ef'}" />
                <circle cx="350" cy="252" r="12" fill="#252525" stroke="none" />
                <circle cx="450" cy="552" r="12" fill="#252525" stroke="none" />
            </g>`;
    }

    if (type === 'lora') {
        return `
            <g ${common}>
                <path d="M225 318 L400 235 L575 318 L400 402 Z" />
                <path d="M225 405 L400 488 L575 405" />
                <path d="M225 492 L400 575 L575 492" />
                <path d="M265 337 V492 M535 337 V492" stroke-width="14" opacity="0.72" />
            </g>
            <g fill="${second}" stroke="#252525" stroke-width="7">
                <circle cx="225" cy="318" r="17" /><circle cx="400" cy="235" r="17" /><circle cx="575" cy="318" r="17" />
                <circle cx="225" cy="492" r="17" /><circle cx="400" cy="575" r="17" /><circle cx="575" cy="492" r="17" />
            </g>
            <text x="400" y="435" text-anchor="middle" font-family="Arial, sans-serif" font-size="74" font-weight="800" fill="${stroke}">LoRA</text>`;
    }

    if (type === 'illustrator') {
        return `
            <rect x="215" y="212" width="370" height="370" rx="54" fill="${painted ? '#ffe2a8' : '#f8f6ef'}" stroke="#252525" stroke-width="18" />
            <text x="400" y="485" text-anchor="middle" font-family="Arial, sans-serif" font-size="225" font-weight="800" fill="${stroke}">Ai</text>
            <path d="M265 536 C332 564 468 564 535 536" fill="none" stroke="${second}" stroke-width="14" stroke-linecap="round" />`;
    }

    if (type === 'photoshop') {
        return `
            <rect x="215" y="212" width="370" height="370" rx="54" fill="${painted ? '#193c8f' : '#f8f6ef'}" stroke="#252525" stroke-width="18" />
            <text x="400" y="485" text-anchor="middle" font-family="Arial, sans-serif" font-size="210" font-weight="800" fill="${stroke}">Ps</text>
            <circle cx="548" cy="245" r="18" fill="${second}" stroke="#252525" stroke-width="7" />`;
    }

    return '';
}

function balloonSvg(skill, painted) {
    const fill = painted ? skill.fill : '#faf9f3';
    const outline = '#252525';
    const icon = skill.icon === 'feishu' ? '' : iconMarkup(skill.icon, painted, skill.accent, skill.iconAccent);
    const hatch = painted ? '#ffffff' : '#77736b';

    return Buffer.from(`
        <svg xmlns="http://www.w3.org/2000/svg" width="${WIDTH}" height="${HEIGHT}" viewBox="0 0 ${WIDTH} ${HEIGHT}">
            <defs>
                <clipPath id="balloonClip"><path d="${balloonPath}" /></clipPath>
            </defs>
            <path d="${balloonPath}" fill="${fill}" stroke="${outline}" stroke-width="13" stroke-linejoin="round" />
            <path d="${balloonPath}" fill="none" stroke="${outline}" stroke-width="4" stroke-linejoin="round" transform="translate(5 -3)" opacity="0.6" />
            <g clip-path="url(#balloonClip)" fill="none" stroke="${hatch}" stroke-width="8" stroke-linecap="round" opacity="${painted ? '0.14' : '0.11'}">
                <path d="M120 184 C275 105 522 112 679 207" />
                <path d="M101 300 C280 220 548 229 701 323" />
                <path d="M94 424 C280 351 557 359 707 446" />
                <path d="M101 552 C278 481 550 493 694 580" />
                <path d="M133 674 C299 614 520 624 657 704" />
                <path d="M190 767 C334 722 482 733 598 787" />
            </g>
            <path d="M145 206 C175 143 223 111 278 89" fill="none" stroke="#fff9e9" stroke-width="25" stroke-linecap="round" opacity="${painted ? '0.88' : '0.7'}" />
            <path d="M132 278 C122 306 115 337 112 367" fill="none" stroke="#fff9e9" stroke-width="13" stroke-linecap="round" opacity="${painted ? '0.72' : '0.55'}" />
            <path d="M349 850 L328 913 Q400 946 472 910 L447 849" fill="${fill}" stroke="${outline}" stroke-width="12" stroke-linejoin="round" />
            <path d="M403 924 C360 1000 486 1053 423 1128 C362 1201 307 1265 362 1345 C397 1395 468 1379 497 1327" fill="none" stroke="${outline}" stroke-width="13" stroke-linecap="round" />
            <path d="M414 924 C374 999 497 1054 434 1137 C380 1206 327 1265 377 1331" fill="none" stroke="${painted ? skill.fill : '#6f6b65'}" stroke-width="6" stroke-linecap="round" opacity="0.82" />
            <g>${icon}</g>
        </svg>
    `);
}

async function prepareFeishuIcon() {
    const { data, info } = await sharp(feishuSource)
        .ensureAlpha()
        .raw()
        .toBuffer({ resolveWithObject: true });

    for (let offset = 0; offset < data.length; offset += 4) {
        const r = data[offset];
        const g = data[offset + 1];
        const b = data[offset + 2];
        const max = Math.max(r, g, b);
        const min = Math.min(r, g, b);
        const isCheckerboard = max - min < 20 && min > 208;

        if (isCheckerboard) {
            data[offset + 3] = 0;
        }
    }

    const cleaned = await sharp(data, { raw: info })
        .trim({ background: { r: 0, g: 0, b: 0, alpha: 0 } })
        .png()
        .toBuffer();

    const painted = await sharp(cleaned)
        .resize({
            width: 390,
            height: 390,
            fit: 'contain',
            background: { r: 0, g: 0, b: 0, alpha: 0 },
        })
        .png()
        .toBuffer();

    const { data: monoData, info: monoInfo } = await sharp(painted)
        .ensureAlpha()
        .raw()
        .toBuffer({ resolveWithObject: true });

    for (let offset = 0; offset < monoData.length; offset += 4) {
        if (monoData[offset + 3] > 0) {
            monoData[offset] = 37;
            monoData[offset + 1] = 37;
            monoData[offset + 2] = 37;
        }
    }

    const sketch = await sharp(monoData, { raw: monoInfo }).png().toBuffer();
    await sharp(cleaned).png().toFile(path.join(outputDir, 'feishu-logo-handdrawn.png'));
    return { painted, sketch };
}

async function renderSkill(skill, feishuIcon) {
    for (const painted of [false, true]) {
        let image = sharp(balloonSvg(skill, painted));

        if (skill.icon === 'feishu') {
            image = image.composite([{
                input: painted ? feishuIcon.painted : feishuIcon.sketch,
                left: 205,
                top: 205,
            }]);
        }

        const suffix = painted ? '-painted' : '-sketch';
        await image
            .webp({ quality: 92, alphaQuality: 100 })
            .toFile(path.join(outputDir, `${skill.id}${suffix}.webp`));
    }
}

await mkdir(outputDir, { recursive: true });
const feishuIcon = await prepareFeishuIcon();
await Promise.all(skills.map((skill) => renderSkill(skill, feishuIcon)));

console.log(`Generated ${skills.length * 2} balloon textures in ${outputDir}`);
